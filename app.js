// ATLAS — protótipo web: identidade do jogador + sessão de rota.
// Ainda NÃO existe servidor: perfil e rotas ficam apenas neste aparelho.
import { CONFIG, RouteSession, circlePolygon, haversine } from './geo.js';
import {
  FACCOES, NEONS, MODELOS, sneakerSVG, carregarPerfil, salvarPerfil, perfilVazio, corDoPerfil,
  logoSVG,
} from './player.js';

const CAMPO_GRANDE = [-54.6201, -20.4697];
const SESSION_KEY = 'atlas.session.v1';
const PENDING_KEY = 'atlas.pending.v1';
const SIM = new URLSearchParams(location.search).has('sim');

const $ = (id) => document.getElementById(id);
const ui = {
  gps: $('gps'), banner: $('banner'), stats: $('stats'), hint: $('hint'),
  start: $('btn-start'), finish: $('btn-finish'), abandon: $('btn-abandon'),
  dist: $('st-dist'), time: $('st-time'), home: $('st-home'),
  modal: $('modal'), mTitle: $('m-title'), mText: $('m-text'), mOk: $('m-ok'), mCancel: $('m-cancel'),
  toast: $('toast'), onb: $('onb'),
  hudShoe: $('hud-shoe'), hudNome: $('hud-nome'), hudFac: $('hud-fac'), perfil: $('btn-perfil'),
};

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* sem armazenamento */ } },
};

const session = RouteSession.restore(store.get(SESSION_KEY));
let perfil = carregarPerfil();
let lastFix = null;
let map = null;
let mapReady = false;
let marker = null;
let wakeLock = null;
let hiddenAt = null;
let followMe = true;

/* ===================== cores ===================== */
function aplicarCores(p) {
  const raiz = document.documentElement.style;
  raiz.setProperty('--neon', corDoPerfil(p));
  raiz.setProperty('--fac', (FACCOES[p && p.faccao] || FACCOES.azul).cor);
}

function pintarHud() {
  if (!perfil) return;
  ui.hudShoe.innerHTML = sneakerSVG({ ...perfil, cor: corDoPerfil(perfil), largura: 34, brilho: 1 });
  ui.hudNome.textContent = perfil.apelido;
  ui.hudFac.textContent = FACCOES[perfil.faccao].nome;
}

/* ===================== contas (por enquanto, só neste aparelho) ===================== */
const CONTAS_KEY = 'atlas.contas.v1';
const LORE_KEY = 'atlas.lore.v1';
const contas = () => store.get(CONTAS_KEY) || {};
function gravarConta(p) {
  const c = contas();
  c[p.apelido] = { ...p };
  store.set(CONTAS_KEY, c);
}

/* ===================== pré-telas ===================== */
const LORE = [
  {
    titulo: 'O Levantamento',
    texto: 'Quando as cidades deixaram de ser medidas por quem as caminhava, elas começaram a esquecer o próprio desenho. '
      + 'Ruas viraram linhas em um servidor. Praças viraram polígonos sem dono.\n\n'
      + 'O projeto ATLAS nasceu para refazer esse mapa do único jeito que ninguém consegue falsificar: passo a passo.',
  },
  {
    titulo: 'A Cisão',
    texto: 'A equipe do levantamento se dividiu sobre o que fazer com o mapa pronto.\n\n'
      + 'A AZUL defende que o mapa pertence a quem o mantém: avanço calculado, território que se segura.\n\n'
      + 'A VERMELHA responde que o mapa pertence a quem o percorre: pressão constante, território que se toma.\n\n'
      + 'Nenhum dos dois lados venceu. Por isso a cidade continua em disputa.',
  },
  {
    titulo: 'A Regra',
    texto: 'Um território só muda de lado quando alguém o cerca por inteiro, com as próprias pernas. '
      + 'Não existe atalho e não existe conquista pela metade.\n\n'
      + 'O que você fechar com um circuito válido passa a levar o seu nome — até que alguém caminhe mais do que você.',
  },
];

let rascunho = perfilVazio();
let modoEdicao = false;
let lorePag = 0;

function telaAtual() { return document.querySelector('.scr:not([hidden])'); }

function irPara(nome) {
  document.querySelectorAll('.scr').forEach((s) => { s.hidden = s.dataset.scr !== nome; });
  const t = telaAtual();
  if (t) t.scrollTop = 0;
  if (nome === 'tenis') desenharPreview();
  if (nome === 'pronto') desenharResumo();
  if (nome === 'lore') { lorePag = 0; desenharLore(); }
  if (nome === 'criar') setTimeout(() => $('in-nome').focus(), 180);
  if (nome === 'entrar') setTimeout(() => $('ent-nome').focus(), 180);
}

function abrirOnboarding({ edicao = false } = {}) {
  modoEdicao = edicao;
  rascunho = edicao ? { ...perfil } : perfilVazio();
  aplicarCores(rascunho);
  montarOpcoes();
  $('passo-tenis').textContent = edicao ? 'Perfil' : 'Passo 2 de 3';
  document.querySelector('[data-scr=tenis] [data-back]').textContent = edicao ? 'CANCELAR' : 'VOLTAR';
  document.querySelector('[data-scr=tenis] [data-go]').textContent = edicao ? 'SALVAR' : 'CONTINUAR';
  $('logo-mark').innerHTML = logoSVG({ largura: 112, cor: corDoPerfil(rascunho), faccao: rascunho.faccao });
  ui.onb.hidden = false;
  irPara(edicao ? 'tenis' : 'intro');
}

function fecharOnboarding() {
  ui.onb.hidden = true;
  aplicarCores(perfil);
  pintarHud();
  atualizarMarcador();
  render();
}

function montarOpcoes() {
  $('row-modelo').innerHTML = MODELOS
    .map((m) => `<button type="button" data-modelo="${m.id}"><b>${m.nome}</b><i>${m.desc}</i></button>`).join('');
  $('row-cor').innerHTML = NEONS
    .map((c) => `<button type="button" data-cor="${c.id}" title="${c.nome}" aria-label="${c.nome}"><span style="background:${c.cor};box-shadow:0 0 16px ${c.cor}"></span></button>`).join('');
  marcarEscolhas();
}

function marcarEscolhas() {
  document.querySelectorAll('[data-modelo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modelo === rascunho.modelo)));
  document.querySelectorAll('[data-cor]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cor === rascunho.cor)));
  document.querySelectorAll('[data-fac]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fac === rascunho.faccao)));
}

function desenharPreview() {
  $('preview').innerHTML = sneakerSVG({ ...rascunho, cor: corDoPerfil(rascunho), largura: 300, brilho: 2.4 });
}

function desenharResumo() {
  $('resumo-shoe').innerHTML = sneakerSVG({ ...rascunho, cor: corDoPerfil(rascunho), largura: 110, brilho: 1.6 });
  $('resumo-nome').textContent = rascunho.apelido;
  $('resumo-fac').textContent = `FACÇÃO ${FACCOES[rascunho.faccao].nome}`;
  const m = MODELOS.find((x) => x.id === rascunho.modelo);
  const c = NEONS.find((x) => x.id === rascunho.cor);
  $('resumo-ten').textContent = `${m.nome} · ${c.nome}`;
}

function desenharLore() {
  const pag = LORE[lorePag];
  $('lore-tit').textContent = pag.titulo;
  $('lore-txt').textContent = pag.texto;
  $('lore-mark').innerHTML = logoSVG({ largura: 92, cor: corDoPerfil(rascunho), faccao: rascunho.faccao, brilho: 3 });
  $('lore-dots').innerHTML = LORE.map((_, i) => `<span${i === lorePag ? ' class="on"' : ''}></span>`).join('');
  $('btn-lore').textContent = lorePag === LORE.length - 1 ? 'ENTRAR NO MAPA' : 'CONTINUAR';
  $('btn-pular').hidden = lorePag === LORE.length - 1;
}

function erro(id, msg) {
  const e = $(id);
  e.textContent = msg || '';
  e.hidden = !msg;
}

function concluir() {
  perfil = { ...rascunho };
  gravarConta(perfil);
  salvarPerfil(perfil);
  store.set(LORE_KEY, true);
  fecharOnboarding();
}

// navegação e escolhas
ui.onb.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;

  if (b.dataset.fac) {
    rascunho.faccao = b.dataset.fac;
    aplicarCores(rascunho);
    marcarEscolhas();
    document.querySelector('[data-scr=faccao] [data-go]').disabled = false;
    return;
  }
  if (b.dataset.modelo) { rascunho.modelo = b.dataset.modelo; marcarEscolhas(); desenharPreview(); return; }
  if (b.dataset.cor) { rascunho.cor = b.dataset.cor; aplicarCores(rascunho); marcarEscolhas(); desenharPreview(); return; }

  if (b.id === 'btn-entrar-conta') {
    const nome = $('ent-nome').value.trim().toUpperCase();
    const conta = contas()[nome];
    if (!conta) { erro('ent-erro', 'Não existe conta com esse apelido neste aparelho.'); return; }
    if (conta.pin !== $('ent-pin').value) { erro('ent-erro', 'PIN incorreto.'); return; }
    erro('ent-erro', '');
    perfil = { ...conta };
    salvarPerfil(perfil);
    fecharOnboarding();
    toast(`Bem-vindo de volta, ${perfil.apelido}.`);
    return;
  }

  if (b.id === 'btn-briefing') { irPara('lore'); return; }
  if (b.id === 'btn-pular') { concluir(); return; }
  if (b.id === 'btn-lore') {
    if (lorePag < LORE.length - 1) { lorePag++; desenharLore(); } else concluir();
    return;
  }

  if (b.dataset.back) {
    if (modoEdicao) { fecharOnboarding(); return; }
    irPara(b.dataset.back);
    return;
  }
  if (b.dataset.go) {
    if (modoEdicao) { perfil = { ...rascunho }; gravarConta(perfil); salvarPerfil(perfil); fecharOnboarding(); toast('Tênis atualizado.'); return; }
    if (b.dataset.go === 'faccao') {
      if (contas()[rascunho.apelido]) { erro('cri-erro', 'Esse apelido já tem conta neste aparelho.'); return; }
      erro('cri-erro', '');
    }
    irPara(b.dataset.go);
  }
});

function validarCriar() {
  const ok = rascunho.apelido.length >= 2 && /^\d{4}$/.test(rascunho.pin || '');
  document.querySelector('[data-scr=criar] [data-go]').disabled = !ok;
}

$('in-nome').addEventListener('input', (e) => {
  rascunho.apelido = e.target.value.trim().toUpperCase().slice(0, 16);
  validarCriar();
});
$('in-pin').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  rascunho.pin = e.target.value;
  validarCriar();
});
const validarEntrar = () => {
  $('btn-entrar-conta').disabled = !($('ent-nome').value.trim().length >= 2 && /^\d{4}$/.test($('ent-pin').value));
};
$('ent-nome').addEventListener('input', validarEntrar);
$('ent-pin').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  validarEntrar();
});

ui.perfil.onclick = () => abrirOnboarding({ edicao: true });

/* ===================== utilidades de interface ===================== */
const fmtDist = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`);
const fmtTime = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

let toastTimer = null;
function toast(msg, ms = 3500) {
  ui.toast.textContent = msg;
  ui.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { ui.toast.hidden = true; }, ms);
}

function banner(msg) {
  ui.banner.textContent = msg || '';
  ui.banner.hidden = !msg;
}

function ask({ title, text, ok, cancel, danger }) {
  return new Promise((resolve) => {
    ui.mTitle.textContent = title;
    ui.mText.textContent = text;
    ui.mOk.textContent = ok;
    ui.mOk.className = `btn ${danger ? 'danger' : 'primary'}`;
    ui.mCancel.textContent = cancel || '';
    ui.mCancel.hidden = !cancel;
    ui.modal.hidden = false;
    const close = (v) => { ui.modal.hidden = true; ui.mOk.onclick = ui.mCancel.onclick = null; resolve(v); };
    ui.mOk.onclick = () => close(true);
    ui.mCancel.onclick = () => close(false);
  });
}

/* ===================== tela ligada durante a rota ===================== */
async function keepScreenOn() {
  if (!('wakeLock' in navigator) || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch { wakeLock = null; }
  render();
}
function releaseScreen() {
  if (wakeLock) wakeLock.release().catch(() => {});
  wakeLock = null;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    if (session.state !== 'idle') hiddenAt = Date.now();
    return;
  }
  if (session.state !== 'idle') {
    keepScreenOn();
    if (hiddenAt) {
      const now = Date.now();
      session.addGap(hiddenAt, now);
      save();
      toast(`O registro ficou pausado por ${fmtTime(now - hiddenAt)} enquanto o ATLAS esteve fora da tela.`, 6000);
    }
  }
  hiddenAt = null;
});

/* ===================== mapa ===================== */
async function pickStyle() {
  for (const name of ['dark', 'liberty']) {
    try {
      const r = await fetch(`https://tiles.openfreemap.org/styles/${name}`);
      if (r.ok) return await r.json();
    } catch { /* tenta o próximo */ }
  }
  throw new Error('Não foi possível carregar o estilo do mapa.');
}

const empty = () => ({ type: 'FeatureCollection', features: [] });

async function initMap() {
  if (!window.maplibregl) { banner('O mapa não carregou (sem internet?). O registro da rota funciona mesmo assim.'); return; }
  let style;
  try { style = await pickStyle(); } catch (e) { banner(`${e.message} O registro da rota funciona mesmo assim.`); return; }

  map = new maplibregl.Map({
    container: 'map', style, center: CAMPO_GRANDE, zoom: 12.5,
    attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false,
  });
  map.touchZoomRotate.disableRotation();
  map.on('dragstart', () => { followMe = false; });
  map.on('error', (e) => {
    const msg = String((e && e.error && e.error.message) || '');
    if (msg) banner(`Problema no mapa: ${msg}`);
  });

  map.on('load', () => {
    map.addSource('zone', { type: 'geojson', data: empty() });
    map.addSource('route', { type: 'geojson', data: empty() });
    map.addLayer({ id: 'zone-fill', type: 'fill', source: 'zone', paint: { 'fill-color': '#39ff9c', 'fill-opacity': 0.14 } });
    map.addLayer({ id: 'zone-line', type: 'line', source: 'zone', paint: { 'line-color': '#39ff9c', 'line-width': 2, 'line-dasharray': [2, 2] } });
    map.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': corDoPerfil(perfil), 'line-width': 11, 'line-opacity': 0.22, 'line-blur': 3 } });
    map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': corDoPerfil(perfil), 'line-width': 4 } });
    mapReady = true;
    atualizarMarcador();
    drawAll();
  });

  if (SIM) map.on('click', (e) => simulate(e.lngLat));
}

function atualizarMarcador() {
  if (!mapReady) return;
  const cor = corDoPerfil(perfil);
  if (map.getLayer('route-line')) {
    map.setPaintProperty('route-line', 'line-color', cor);
    map.setPaintProperty('route-glow', 'line-color', cor);
  }
  if (!lastFix) { if (marker) { marker.remove(); marker = null; } return; }

  if (!marker) {
    const el = document.createElement('div');
    el.className = 'me-marker';
    el.innerHTML = '<div class="me-pulse"></div><div class="me-dot"></div><div class="me-shoe"></div>';
    marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lastFix.lng, lastFix.lat]).addTo(map);
  }
  marker.getElement().querySelector('.me-shoe').innerHTML =
    sneakerSVG({ ...(perfil || perfilVazio()), cor, largura: 62, brilho: 2 });
  marker.setLngLat([lastFix.lng, lastFix.lat]);
}

function drawAll() {
  if (!mapReady) return;
  map.getSource('zone').setData(session.origin ? circlePolygon(session.origin, CONFIG.FINISH_RADIUS_M) : empty());
  map.getSource('route').setData(session.points.length > 1
    ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: session.points.map((p) => [p.lng, p.lat]) } }
    : empty());
  if (marker && lastFix) marker.setLngLat([lastFix.lng, lastFix.lat]);
  else if (lastFix) atualizarMarcador();
  map.setPaintProperty('zone-fill', 'fill-opacity', session.canFinish ? 0.3 : 0.14);
}

/* ===================== GPS ===================== */
let firstFix = true;
function onFix(p) {
  lastFix = p;
  if (mapReady && (firstFix || followMe)) {
    map.easeTo({ center: [p.lng, p.lat], zoom: firstFix ? 16.5 : map.getZoom(), duration: firstFix ? 0 : 600 });
  }
  firstFix = false;

  if (session.state !== 'idle') {
    const r = session.addPoint(p);
    if (r.accepted) {
      save();
      if (r.justReturned) toast('Você voltou ao ponto inicial. Toque em FINALIZAR ROTA para encerrar.', 6000);
    }
  }
  render();
  drawAll();
}

function startGps() {
  if (SIM) { ui.gps.innerHTML = 'GPS <span>simulação</span>'; return; }
  if (!('geolocation' in navigator)) { banner('Este navegador não oferece localização.'); return; }
  navigator.geolocation.watchPosition(
    (pos) => onFix({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy, t: pos.timestamp || Date.now() }),
    (err) => {
      ui.gps.className = 'chip bad';
      ui.gps.innerHTML = err.code === 1 ? 'GPS <span>bloqueado</span>' : 'GPS <span>sem sinal</span>';
      if (err.code === 1) banner('Permita o acesso à localização para este site nos ajustes do Safari e recarregue a página.');
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
  );
}

// Simulação: cada toque vira uma leitura, com o relógio avançando em ritmo de caminhada.
let simT = Date.now();
function simulate(lngLat) {
  const p = { lat: lngLat.lat, lng: lngLat.lng, acc: 5 };
  const d = lastFix ? haversine(lastFix, p) : 0;
  simT += Math.max(1000, (d / 1.4) * 1000);
  onFix({ ...p, t: simT });
}

/* ===================== ações do jogador ===================== */
function save() {
  if (session.state === 'idle') store.del(SESSION_KEY);
  else store.set(SESSION_KEY, session.serialize());
}

ui.start.onclick = () => {
  if (!lastFix) { toast('Aguardando o GPS encontrar sua posição.'); return; }
  try {
    session.start({ ...lastFix, t: SIM ? simT : Date.now() });
  } catch (e) { toast(e.message); return; }
  followMe = true;
  save();
  keepScreenOn();
  render();
  drawAll();
};

ui.finish.onclick = async () => {
  if (!session.canFinish) return;
  const payload = session.finish(SIM ? simT : Date.now());
  const pending = store.get(PENDING_KEY) || [];
  pending.push(payload);
  store.set(PENDING_KEY, pending);
  save();
  releaseScreen();
  render();
  drawAll();
  await ask({
    title: 'Rota registrada neste aparelho',
    text: `Percurso: ${fmtDist(payload.distanceM)} em ${fmtTime(payload.finishedAt - payload.startedAt)}.\n\n`
      + 'A validação e a pontuação são feitas pelo servidor, que ainda não existe nesta versão. Nenhum território foi conquistado.',
    ok: 'VOLTAR AO MAPA',
  });
};

ui.abandon.onclick = async () => {
  const sure = await ask({
    title: 'Desistir da rota?',
    text: 'O percurso registrado até aqui será descartado.',
    ok: 'DESISTIR', cancel: 'CONTINUAR', danger: true,
  });
  if (!sure) return;
  session.abandon();
  save();
  releaseScreen();
  render();
  drawAll();
};

/* ===================== desenho do estado ===================== */
function render() {
  const st = session.state;
  ui.start.hidden = st !== 'idle';
  ui.finish.hidden = st !== 'ready';
  ui.abandon.hidden = st === 'idle';
  ui.stats.hidden = st === 'idle';
  ui.perfil.disabled = st !== 'idle';

  if (lastFix && !SIM) {
    const good = lastFix.acc <= CONFIG.MAX_ACCURACY_M;
    ui.gps.className = `chip ${good ? 'ok' : 'bad'}`;
    ui.gps.innerHTML = `GPS <span>±${Math.round(lastFix.acc)} m</span>`;
  }
  ui.start.disabled = !lastFix;

  if (st === 'idle') {
    ui.hint.textContent = lastFix
      ? 'Toque em INICIAR ROTA para começar a registrar.'
      : 'Aguardando o GPS encontrar sua posição…';
    return;
  }

  ui.dist.textContent = fmtDist(session.distanceM);
  ui.home.textContent = fmtDist(session.lastDistToOrigin);
  const lockNote = wakeLock ? '' : ' Mantenha a tela ligada: com ela apagada o registro pausa.';
  if (st === 'ready') ui.hint.textContent = 'Você está no ponto inicial. Toque em FINALIZAR ROTA para encerrar.';
  else if (!session.leftZone) ui.hint.textContent = `Rota em andamento. Afaste-se do ponto inicial para formar o circuito.${lockNote}`;
  else ui.hint.textContent = `Rota em andamento. Volte a até ${CONFIG.FINISH_RADIUS_M} m do início para poder finalizar.${lockNote}`;
}

setInterval(() => {
  if (session.state !== 'idle') ui.time.textContent = fmtTime((SIM ? simT : Date.now()) - session.startedAt);
}, 1000);

/* ===================== início ===================== */
aplicarCores(perfil);
if (perfil) pintarHud(); else abrirOnboarding();

if (session.state !== 'idle') {
  toast('Rota em andamento recuperada.');
  keepScreenOn();
  document.addEventListener('pointerdown', keepScreenOn, { once: true });
}
render();
initMap();
startGps();
