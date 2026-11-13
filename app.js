// ATLAS — protótipo web: identidade do jogador + sessão de rota.
// Ainda NÃO existe servidor: perfil e rotas ficam apenas neste aparelho.
import { CONFIG, RouteSession, circlePolygon, haversine } from './geo.js?v=20';
import {
  FACCOES, NEONS, MODELOS, sneakerSVG, carregarPerfil, salvarPerfil, perfilVazio, corDoPerfil,
  logoSVG,
  GRATIS, PRECOS, temItem, precoDe, fmtOuro, CENARIOS, cenarioSVG,
} from './player.js?v=20';
import * as api from './api.js?v=20';
import {
  anelNivel, medalhaSVG, cartaoConquista, compartilhar, tremer, VIB,
} from './progresso.js?v=20';

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
let territorios = null;
let sessaoServidor = null;
let avisouGps = false;
let carteira = null;
let progresso = null;
let catalogo = null;
let abaRank = 'total';
const AREA_KEY = 'atlas.area_ativa.v1';

/* ===================== cores ===================== */
function aplicarCores(p) {
  const raiz = document.documentElement.style;
  raiz.setProperty('--neon', corDoPerfil(p));
  raiz.setProperty('--fac', (FACCOES[p && p.faccao] || FACCOES.meridiano).cor);
}

function pintarHud() {
  if (!perfil) return;
  ui.hudShoe.innerHTML = sneakerSVG({ ...perfil, cor: corDoPerfil(perfil), largura: 34, brilho: 1 });
  ui.hudNome.textContent = perfil.apelido;
  ui.hudFac.textContent = FACCOES[perfil.faccao].nome;
  pintarNivel();
}

function pintarNivel() {
  const anel = $('hud-nivel'); const barra = $('hud-xp'); const dentro = $('hud-xp-barra');
  if (!anel) return;
  if (!progresso || !progresso.ok) { anel.innerHTML = ''; barra.hidden = true; return; }
  const pct = Math.min(1, progresso.xp_no_nivel / Math.max(progresso.xp_do_nivel, 1));
  anel.innerHTML = anelNivel({ nivel: progresso.nivel, pct, cor: corDoPerfil(perfil), tam: 34 });
  barra.hidden = false;
  dentro.style.width = `${(pct * 100).toFixed(1)}%`;
}

/* ===================== contas (por enquanto, só neste aparelho) ===================== */
const MOTIVOS = {
  poucos_pontos: 'O percurso teve leituras de GPS demais de menos para ser conferido.',
  nao_fechou: 'O percurso não voltou a até 20 m do ponto inicial.',
  nao_saiu_da_zona: 'Você não se afastou o bastante do ponto inicial.',
  velocidade: 'Houve trecho acima de 25 km/h. Se não foi corrida nem carro, pode ter sido falha do GPS.',
  curta_demais: 'O percurso foi curto demais.',
  area_pequena: 'A área fechada ficou pequena demais.',
  circuito_invalido: 'O traçado não formou uma área fechada válida.',
  so_area_protegida: 'Todo o circuito caiu sobre território inimigo protegido. Nada foi conquistado.',
  sem_sessao: 'Esta rota não foi aberta no servidor, então não vale território.',
  sessao_invalida: 'O servidor não reconheceu esta rota.',
  sessao_usada: 'Esta rota já tinha sido encerrada no servidor.',
  sessao_velha: 'A rota ficou aberta tempo demais e expirou.',
  rapido_para_o_relogio: 'Pelo relógio do servidor, esse percurso foi rápido demais para ter sido feito a pé.',
  tempo_inconsistente: 'O tempo marcado no aparelho não bate com o tempo real da rota.',
  pings_fora_do_trajeto: 'As posições enviadas durante a caminhada não batem com o trajeto final.',
  inicio_diferente: 'O começo do trajeto não bate com o lugar onde a rota foi aberta.',
  rapido_demais: 'Espere alguns minutos entre uma conquista e outra.',
  limite_diario: 'Você chegou ao limite de conquistas por dia.',
  sem_perfil: 'Essa conta existe e o PIN está certo, mas o cadastro ficou pela metade. Volte e use CRIAR CONTA com o MESMO apelido e PIN, e um código de convite ainda não usado.',
  sem_servidor: 'O servidor ainda não está ligado: a rota ficou guardada neste aparelho.',
  rede: 'Não deu para falar com o servidor. Confira a internet e tente de novo.',
  rede_rota: 'Não deu para falar com o servidor. A rota ficou guardada e será reenviada sozinha.',
  apelido_em_uso: 'Esse apelido já tem conta. Volte e use ENTRAR com o mesmo apelido e PIN.',
  ja_tem_perfil: 'Essa conta já está criada e pronta. Volte e use ENTRAR.',
  erro: 'O servidor não aceitou o cadastro. Se você já tem conta, volte e use ENTRAR.',
  dados_invalidos: 'Algum dado do cadastro não foi aceito. Confira o apelido e tente de novo.',
  convite_invalido: 'Código de convite inválido ou já usado.',
  sem_vagas: 'As vagas do teste fechado acabaram.',
  confirmacao_de_email: 'O servidor está exigindo confirmação de e-mail. Desligue essa opção no painel do Supabase.',
  pin: 'Apelido ou PIN incorreto.',
  sem_conta: 'Não existe conta com esse apelido.',
};

/* ===================== pré-telas ===================== */
const LORE = [
  {
    titulo: 'O Levantamento',
    texto: 'Quando as cidades deixaram de ser medidas por quem as caminhava, elas começaram a esquecer o próprio desenho. '
      + 'Ruas viraram linhas em um servidor. Praças viraram polígonos sem dono.\n\n'
      + 'O projeto ATLAS nasceu para refazer esse mapa do único jeito que ninguém consegue falsificar: passo a passo. '
      + 'Duas equipes saíram a campo com o mesmo caderno: uma para fixar as linhas, outra para abrir os rumos.',
  },
  {
    titulo: 'A Cisão',
    texto: 'Com o mapa pronto, o levantamento se partiu em dois.\n\n'
      + 'MERIDIANO ficou com as linhas. Para eles o mapa pertence a quem o mantém: avanço calculado, '
      + 'território que se segura. Marcam a cidade de azul.\n\n'
      + 'AZIMUTE ficou com os rumos. Para eles o mapa pertence a quem o percorre: pressão constante, '
      + 'território que se toma. Marcam a cidade de verde.\n\n'
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

function abrirOnboarding({ edicao = false, tela = null } = {}) {
  modoEdicao = edicao;
  rascunho = edicao ? { ...perfil } : perfilVazio();
  aplicarCores(rascunho);
  montarOpcoes();
  $('passo-tenis').textContent = edicao ? 'Perfil' : 'Passo 2 de 3';
  document.querySelector('[data-scr=tenis] [data-back]').textContent = edicao ? 'CANCELAR' : 'VOLTAR';
  document.querySelector('[data-scr=tenis] [data-go]').textContent = edicao ? 'SALVAR' : 'CONTINUAR';
  $('btn-sair').hidden = !edicao;
  $('logo-mark').innerHTML = logoSVG({ largura: 112, cor: corDoPerfil(rascunho), faccao: rascunho.faccao });
  ui.onb.hidden = false;
  irPara(tela || (edicao ? 'tenis' : 'intro'));
}

function fecharOnboarding() {
  ui.onb.hidden = true;
  aplicarCores(perfil);
  pintarHud();
  atualizarMarcador();
  render();
}

function montarOpcoes() {
  $('row-modelo').innerHTML = MODELOS.map((m) => {
    const item = `modelo:${m.id}`;
    const meu = temItem(carteira, item);
    return `<button type="button" data-modelo="${m.id}" data-item="${item}" class="${meu ? '' : 'travado'}">`
      + `<b>${m.nome}</b><i>${meu ? m.desc : `${fmtOuro(precoDe(item))} ouro`}</i></button>`;
  }).join('');

  $('row-cor').innerHTML = NEONS.map((c) => {
    const item = `cor:${c.id}`;
    const meu = temItem(carteira, item);
    return `<button type="button" data-cor="${c.id}" data-item="${item}" class="${meu ? '' : 'travado'}" title="${c.nome}" aria-label="${c.nome}">`
      + `<span style="background:${c.cor};box-shadow:0 0 16px ${c.cor}"></span>`
      + (meu ? '' : `<em>${fmtOuro(precoDe(item))}</em>`) + '</button>';
  }).join('');

  $('row-cenario').innerHTML = CENARIOS.map((c) => {
    const item = `cenario:${c.id}`;
    const meu = temItem(carteira, item);
    return `<button type="button" data-cenario="${c.id}" data-item="${item}" class="mini ${meu ? '' : 'travado'}" title="${c.nome}">`
      + `<span class="mini-arte">${cenarioSVG({ id: c.id, cor: corDoPerfil(rascunho), largura: 54 })}</span>`
      + `<i>${meu ? c.nome : `${fmtOuro(c.custo)} ouro`}</i></button>`;
  }).join('');

  const bolsa = $('bolsa');
  if (carteira) {
    bolsa.hidden = false;
    bolsa.innerHTML = `<b>${fmtOuro(carteira.ouro)}</b><span>ouro</span>`;
  } else {
    bolsa.hidden = true;
  }
  marcarEscolhas();
}

async function tentarComprar(item, nome) {
  if (!carteira) { toast('A loja ainda não está ligada no servidor.'); return false; }
  const preco = precoDe(item);
  if (carteira.ouro < preco) {
    toast(`Faltam ${fmtOuro(preco - carteira.ouro)} de ouro para ${nome}. Conquiste mais território.`, 5000);
    return false;
  }
  const sim = await ask({
    title: `Comprar ${nome}?`,
    text: `Custa ${fmtOuro(preco)} de ouro.\nVocê tem ${fmtOuro(carteira.ouro)}.`,
    ok: 'COMPRAR', cancel: 'AGORA NÃO',
  });
  if (!sim) return false;
  const r = await api.comprarItem(item);
  if (!r || !r.ok) {
    toast(r && r.motivo === 'sem_ouro' ? 'Ouro insuficiente.' : 'Não deu para comprar agora.');
    return false;
  }
  carteira = await api.buscarCarteira();
  montarOpcoes();
  toast(`${nome} desbloqueado.`);
  return true;
}

function marcarEscolhas() {
  document.querySelectorAll('[data-modelo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modelo === rascunho.modelo)));
  document.querySelectorAll('[data-cor]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cor === rascunho.cor)));
  document.querySelectorAll('[data-cenario]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cenario === rascunho.cenario)));
  document.querySelectorAll('[data-fac]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fac === rascunho.faccao)));
}

function desenharPreview() {
  $('cenario-fundo').innerHTML = cenarioSVG({ id: rascunho.cenario, cor: corDoPerfil(rascunho), largura: 300 });
  $('preview').innerHTML = sneakerSVG({ ...rascunho, cor: corDoPerfil(rascunho), largura: 236, brilho: 2.4 });
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

async function concluir() {
  const b = $('btn-lore');
  b.disabled = true; b.textContent = 'CRIANDO…';
  const r = await api.criarConta({ ...rascunho, codigo: $('in-codigo').value.trim().toUpperCase() });
  b.disabled = false; b.textContent = 'ENTRAR NO MAPA';
  if (!r.ok) {
    irPara('criar');
    // Mostra o código cru quando a causa é desconhecida: sem ele, não dá para
    // saber o que o servidor recusou olhando só a tela.
    erro('cri-erro', MOTIVOS[r.motivo]
      || `Não foi possível criar a conta. Código do servidor: ${r.motivo || 'sem resposta'}`
      + (r.detalhe ? ` — ${r.detalhe}` : ''));
    return;
  }
  perfil = { ...rascunho, ...r.perfil };
  salvarPerfil(perfil);
  fecharOnboarding();
  if (r.jaEra) toast(`Essa conta já existia e o PIN confere. Bem-vindo de volta, ${perfil.apelido}.`, 6000);
  await atualizarMapa();
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
  if (b.dataset.modelo) {
    const item = `modelo:${b.dataset.modelo}`;
    if (!temItem(carteira, item)) {
      const m = MODELOS.find((x) => x.id === b.dataset.modelo);
      tentarComprar(item, m.nome).then((ok) => { if (ok) { rascunho.modelo = b.dataset.modelo; marcarEscolhas(); desenharPreview(); } });
      return;
    }
    rascunho.modelo = b.dataset.modelo; marcarEscolhas(); desenharPreview(); return;
  }
  if (b.dataset.cenario) {
    const item = `cenario:${b.dataset.cenario}`;
    if (!temItem(carteira, item)) {
      const c = CENARIOS.find((x) => x.id === b.dataset.cenario);
      tentarComprar(item, c.nome).then((ok) => { if (ok) { rascunho.cenario = b.dataset.cenario; marcarEscolhas(); desenharPreview(); } });
      return;
    }
    rascunho.cenario = b.dataset.cenario; marcarEscolhas(); desenharPreview(); return;
  }
  if (b.dataset.cor) {
    const item = `cor:${b.dataset.cor}`;
    if (!temItem(carteira, item)) {
      const c = NEONS.find((x) => x.id === b.dataset.cor);
      tentarComprar(item, c.nome).then((ok) => { if (ok) { rascunho.cor = b.dataset.cor; aplicarCores(rascunho); marcarEscolhas(); desenharPreview(); } });
      return;
    }
    rascunho.cor = b.dataset.cor; aplicarCores(rascunho); marcarEscolhas(); desenharPreview(); return;
  }

  if (b.id === 'btn-entrar-conta') {
    b.disabled = true; b.textContent = 'ENTRANDO…';
    api.entrar($('ent-nome').value.trim().toUpperCase(), $('ent-pin').value).then(async (r) => {
      b.disabled = false; b.textContent = 'ENTRAR';
      if (!r.ok) {
        erro('ent-erro', MOTIVOS[r.motivo]
          || `Não foi possível entrar. Código do servidor: ${r.motivo || 'sem resposta'}`
          + (r.detalhe ? ` — ${r.detalhe}` : ''));
        return;
      }
      erro('ent-erro', '');
      perfil = { ...perfilVazio(), ...r.perfil };
      salvarPerfil(perfil);
      fecharOnboarding();
      toast(`Bem-vindo de volta, ${perfil.apelido}.`);
      await atualizarMapa();
    });
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
    if (modoEdicao) {
      perfil = { ...rascunho };
      salvarPerfil(perfil);
      api.salvarVisual({ modelo: perfil.modelo, cor: perfil.cor, cenario: perfil.cenario });
      fecharOnboarding();
      toast('Tênis atualizado.');
      return;
    }
    if (b.dataset.go === 'faccao') erro('cri-erro', '');
    irPara(b.dataset.go);
  }
});

function validarCriar() {
  const codigoOk = !api.temServidor || $('in-codigo').value.trim().length >= 4;
  const ok = rascunho.apelido.length >= 2 && /^\d{6}$/.test(rascunho.pin || '') && codigoOk;
  document.querySelector('[data-scr=criar] [data-go]').disabled = !ok;
}

$('in-nome').addEventListener('input', (e) => {
  rascunho.apelido = e.target.value.trim().toUpperCase().slice(0, 16);
  validarCriar();
});
$('in-codigo').addEventListener('input', validarCriar);
$('in-pin').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
  rascunho.pin = e.target.value;
  validarCriar();
});
const validarEntrar = () => {
  $('btn-entrar-conta').disabled = !($('ent-nome').value.trim().length >= 2 && /^\d{6}$/.test($('ent-pin').value));
};
$('ent-nome').addEventListener('input', validarEntrar);
$('ent-pin').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
  validarEntrar();
});

ui.perfil.onclick = async () => {
  carteira = await api.buscarCarteira();
  abrirOnboarding({ edicao: true });
};

/* ===================== utilidades de interface ===================== */
const fmtDist = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`);
const fmtTime = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

let audioCtx = null;
function aviso() {
  try { if (navigator.vibrate) navigator.vibrate([120, 70, 120]); } catch { /* sem vibração */ }
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const agora = audioCtx.currentTime;
    [880, 1320].forEach((hz, i) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = hz;
      g.gain.setValueAtTime(0.0001, agora + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.18, agora + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, agora + i * 0.18 + 0.16);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(agora + i * 0.18); o.stop(agora + i * 0.18 + 0.2);
    });
  } catch { /* sem áudio */ }
}

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

function ask({ title, text, ok, cancel, danger, numeros, arte, extra }) {
  return new Promise((resolve) => {
    const bArte = $('m-arte');
    bArte.hidden = !arte;
    bArte.innerHTML = arte || '';
    const bEx = $('m-extra');
    bEx.hidden = !extra;
    if (extra) {
      bEx.textContent = extra.rotulo;
      bEx.onclick = async () => {
        bEx.disabled = true;
        try { await extra.acao(); } finally { bEx.disabled = false; }
      };
    } else bEx.onclick = null;
    ui.mTitle.textContent = title;
    ui.mText.textContent = text;
    const bloco = $('m-num');
    bloco.hidden = !numeros;
    if (numeros) bloco.innerHTML = numeros.map((n) => `<div><b>${n[0]}</b><span>${n[1]}</span></div>`).join('');
    ui.mOk.textContent = ok;
    ui.mOk.className = `btn ${danger ? 'danger' : 'primary'}`;
    ui.mCancel.textContent = cancel || '';
    ui.mCancel.hidden = !cancel;
    ui.modal.hidden = false;
    const close = (v) => {
      ui.modal.hidden = true;
      ui.mOk.onclick = ui.mCancel.onclick = $('m-extra').onclick = null;
      resolve(v);
    };
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
    attributionControl: false, dragRotate: false, pitchWithRotate: false,
  });
  // Crédito do OpenStreetMap é obrigatório, mas fica recolhido num "i" de canto.
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
  map.on('idle', () => {
    const c = document.querySelector('.maplibregl-ctrl-attrib');
    if (c && c.classList.contains('maplibregl-compact-show') && !c.dataset.tocado) {
      c.classList.remove('maplibregl-compact-show');
      c.querySelector('summary, .maplibregl-ctrl-attrib-button')?.addEventListener(
        'click', () => { c.dataset.tocado = '1'; }, { once: true });
    }
  });
  map.touchZoomRotate.disableRotation();
  map.on('dragstart', () => { followMe = false; $('btn-centro').hidden = false; });
  map.on('error', (e) => {
    const msg = String((e && e.error && e.error.message) || '');
    if (msg) banner(`Problema no mapa: ${msg}`);
  });

  map.on('load', () => {
    // Edificações do OpenStreetMap, no chão, discretas e só de perto.
    if (map.getLayer('building')) {
      map.setPaintProperty('building', 'fill-color', '#16222f');
      map.setPaintProperty('building', 'fill-outline-color', '#31506e');
      map.setPaintProperty('building', 'fill-opacity',
        ['interpolate', ['linear'], ['zoom'], 13.5, 0, 15.5, 0.7, 17, 0.9]);
    }

    const corEquipe = ['match', ['get', 'faccao'],
      'meridiano', FACCOES.meridiano.cor, 'azimute', FACCOES.azimute.cor, '#8aa0b4'];

    map.addSource('terr', { type: 'geojson', data: empty() });
    map.addLayer({ id: 'terr-fill', type: 'fill', source: 'terr', paint: { 'fill-color': corEquipe, 'fill-opacity': 0.26 } });
    map.addLayer({ id: 'terr-brilho', type: 'line', source: 'terr', paint: { 'line-color': corEquipe, 'line-width': 10, 'line-opacity': 0.18, 'line-blur': 5 } });
    map.addLayer({ id: 'terr-line', type: 'line', source: 'terr', paint: { 'line-color': corEquipe, 'line-width': 2, 'line-opacity': 0.9 } });

    map.addSource('acc', { type: 'geojson', data: empty() });
    map.addLayer({ id: 'acc-fill', type: 'fill', source: 'acc', paint: { 'fill-color': corDoPerfil(perfil), 'fill-opacity': 0.07 } });
    map.addLayer({ id: 'acc-line', type: 'line', source: 'acc', paint: { 'line-color': corDoPerfil(perfil), 'line-width': 1, 'line-opacity': 0.35 } });

    map.addSource('rumo', { type: 'geojson', data: empty() });
    map.addLayer({ id: 'rumo-line', type: 'line', source: 'rumo', paint: { 'line-color': '#ffffff', 'line-width': 1.4, 'line-opacity': 0.4, 'line-dasharray': [1, 2] } });

    map.addSource('saida', { type: 'geojson', data: empty() });
    map.addLayer({ id: 'saida-line', type: 'line', source: 'saida',
      paint: { 'line-color': '#ffffff', 'line-width': 1.6, 'line-opacity': 0.5, 'line-dasharray': [3, 3] } });

    map.addSource('zone', { type: 'geojson', data: empty() });
    map.addSource('route', { type: 'geojson', data: empty() });
    map.addLayer({ id: 'zone-fill', type: 'fill', source: 'zone', paint: { 'fill-color': corDoPerfil(perfil), 'fill-opacity': 0.14 } });
    map.addLayer({ id: 'zone-line', type: 'line', source: 'zone', paint: { 'line-color': corDoPerfil(perfil), 'line-width': 2, 'line-dasharray': [2, 2] } });
    map.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': corDoPerfil(perfil), 'line-width': 11, 'line-opacity': 0.22, 'line-blur': 3 } });
    map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': corDoPerfil(perfil), 'line-width': 4 } });

    map.on('click', 'terr-fill', (e) => abrirTerritorio(e.features[0].properties));
    map.on('mouseenter', 'terr-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'terr-fill', () => { map.getCanvas().style.cursor = ''; });

    mapReady = true;
    atualizarMarcador();
    drawAll();
    if (territorios) map.getSource('terr').setData(territorios);
  });

  if (SIM) map.on('click', (e) => simulate(e.lngLat));
}

function atualizarMarcador() {
  if (!mapReady) return;
  const cor = corDoPerfil(perfil);
  if (map.getLayer('route-line')) {
    map.setPaintProperty('route-line', 'line-color', cor);
    map.setPaintProperty('route-glow', 'line-color', cor);
    map.setPaintProperty('zone-fill', 'fill-color', cor);
    map.setPaintProperty('zone-line', 'line-color', cor);
    map.setPaintProperty('acc-fill', 'fill-color', cor);
    map.setPaintProperty('acc-line', 'line-color', cor);
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
  map.getSource('acc').setData(lastFix && lastFix.acc > 8 ? circlePolygon(lastFix, lastFix.acc) : empty());
  map.getSource('saida').setData(session.origin && !session.leftZone
    ? circlePolygon(session.origin, CONFIG.LEAVE_RADIUS_M) : empty());
  map.getSource('rumo').setData(session.origin && lastFix && session.leftZone && !session.canFinish
    ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[lastFix.lng, lastFix.lat], [session.origin.lng, session.origin.lat]] } }
    : empty());
  map.getSource('route').setData(session.points.length > 1
    ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: session.points.map((p) => [p.lng, p.lat]) } }
    : empty());
  if (marker && lastFix) marker.setLngLat([lastFix.lng, lastFix.lat]);
  else if (lastFix) atualizarMarcador();
  map.setPaintProperty('zone-fill', 'fill-opacity', session.canFinish ? 0.3 : 0.14);
}


/* ===================== ficha: território e jogador ===================== */
function abrirFicha(html) {
  $('ficha-corpo').innerHTML = html;
  $('ficha').hidden = false;
}
$('ficha-fechar').onclick = () => { $('ficha').hidden = true; };
$('ficha').addEventListener('click', (e) => { if (e.target.id === 'ficha') $('ficha').hidden = true; });
$('ficha-corpo').addEventListener('click', (e) => {
  const alvo = e.target.closest('[data-jog]');
  if (alvo) abrirJogador(alvo.dataset.jog);
});

const cardMedalha = (m, ganha = true) => `<div class="med ${ganha ? 'ganha' : ''}" data-med="${m.codigo}">
  ${medalhaSVG({ codigo: m.codigo, raridade: m.raridade, tam: 48, ganha })}
  <span>${m.nome}</span></div>`;

function abrirTerritorio(props) {
  let donos = props.donos;
  if (typeof donos === 'string') { try { donos = JSON.parse(donos); } catch { donos = []; } }
  donos = Array.isArray(donos) ? donos : [];
  const area = Number(props.area) || 0;
  const f = FACCOES[props.faccao] || FACCOES.meridiano;
  const linhas = donos.map((d) => {
    const nome = (d && d.apelido) || String(d);
    const a = Number(d && d.area) || 0;
    const pc = area > 0 && a > 0 ? `${Math.max(1, Math.round((a / area) * 100))}%` : '';
    return `<li><span class="nm" data-jog="${nome}">${nome}</span>
      <span class="m2">${a > 0 ? fmtArea(a) : ''}</span><span class="pc">${pc}</span></li>`;
  }).join('');
  abrirFicha(`<h3 class="ficha-tit">${fmtArea(area)}</h3>
    <p class="ficha-sub" style="color:${f.cor}">Bloco ${f.nome}</p>
    <ul class="ficha-donos">${linhas || '<li>Território sem dono registrado.</li>'}</ul>
    <p class="nota">Toque num apelido para ver o perfil e as medalhas.</p>`);
}

async function abrirJogador(apelido) {
  abrirFicha('<p class="nota">Carregando…</p>');
  const e = await api.buscarEstante(apelido);
  if (!e || !e.apelido) { abrirFicha('<p class="nota">Não deu para carregar esse perfil.</p>'); return; }
  const cor = (NEONS.find((n) => n.id === e.cor) || NEONS[0]).cor;
  const f = FACCOES[e.faccao] || FACCOES.meridiano;
  const meds = e.medalhas || [];
  abrirFicha(`<div class="ficha-perfil">
      <div class="ficha-arte">
        <div class="cen">${cenarioSVG({ id: e.cenario || 'noturno', cor, largura: 108 })}</div>
        <div class="ten">${sneakerSVG({ modelo: e.modelo, cor, faccao: e.faccao, largura: 78, brilho: 1.4 })}</div>
      </div>
      <div>
        <h3 class="ficha-tit">${e.apelido}</h3>
        <p class="ficha-sub" style="color:${f.cor}">${f.nome} · Nível ${e.nivel}</p>
      </div>
    </div>
    <span class="opt-tit">Medalhas — ${meds.length}</span>
    <div class="estante">${meds.map((m) => cardMedalha(m, true)).join('')
      || '<p class="nota">Nenhuma medalha ainda.</p>'}</div>`);
}

/* ===================== progresso, medalhas, ofensiva ===================== */
async function atualizarProgresso({ celebrar = true } = {}) {
  const p = await api.buscarProgresso();
  if (!p || !p.ok) return;
  const novas = celebrar ? (p.novas || []) : [];
  const subiu = progresso && p.nivel > progresso.nivel;
  progresso = p;
  pintarNivel();
  avisarPerdaDeTerritorio(p);
  if (subiu) {
    tremer(VIB.medalha);
    await ask({
      title: `Nível ${p.nivel}`,
      text: `Seu bônus de ouro agora é de ${p.bonus_ouro}%. Faltam ${Math.round(p.xp_do_nivel)} XP para o próximo nível.`,
      arte: anelNivel({ nivel: p.nivel, pct: 1, cor: corDoPerfil(perfil), tam: 96 }),
      ok: 'SEGUIR',
    });
  }
  for (const codigo of novas) await celebrarMedalha(codigo, p);
}

function avisarPerdaDeTerritorio(p) {
  const ativa = Number(p.numeros && p.numeros.area_ativa) || 0;
  const antes = store.get(AREA_KEY);
  if (typeof antes === 'number' && ativa < antes - 1) {
    tremer(VIB.recusa);
    banner(`Enquanto você esteve fora, perdeu ${fmtArea(antes - ativa)} de território.`);
    setTimeout(() => banner(''), 14000);
  }
  store.set(AREA_KEY, ativa);
}

async function celebrarMedalha(codigo, p) {
  const m = (p.medalhas || []).find((x) => x.codigo === codigo);
  if (!m) return;
  tremer(VIB.medalha);
  await ask({
    title: m.nome,
    text: m.descricao,
    arte: medalhaSVG({ codigo: m.codigo, raridade: m.raridade, tam: 120 }),
    ok: 'GUARDAR NA ESTANTE',
    extra: {
      rotulo: 'COMPARTILHAR',
      acao: async () => {
        const blob = await cartaoConquista({
          titulo: m.nome, subtitulo: m.descricao, medalha: m,
          cor: corDoPerfil(perfil), corEquipe: FACCOES[perfil.faccao].cor,
          apelido: perfil.apelido, equipe: FACCOES[perfil.faccao].nome, nivel: p.nivel,
        });
        await compartilhar(blob, `atlas-${m.codigo}.png`, `Medalha ${m.nome} no ATLAS.`);
      },
    },
  });
}

/* ===================== replay da rota ===================== */
function replay(pontos) {
  return new Promise((pronto) => {
    if (!mapReady || !map.getSource('route') || pontos.length < 3) { pronto(); return; }
    const coords = pontos.map((p) => [p.lng, p.lat]);
    const lngs = coords.map((c) => c[0]); const lats = coords.map((c) => c[1]);
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 70, duration: 600 });
    const inicio = performance.now(); const dur = 2000;
    const passo = (t) => {
      const k = Math.min(1, (t - inicio) / dur);
      const n = Math.max(2, Math.round(k * coords.length));
      map.getSource('route').setData({
        type: 'Feature', properties: {},
        geometry: { type: 'LineString', coordinates: coords.slice(0, n) },
      });
      if (k < 1) requestAnimationFrame(passo);
      else {
        map.getSource('route').setData({
          type: 'Feature', properties: {},
          geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] },
        });
        setTimeout(pronto, 450);
      }
    };
    requestAnimationFrame(passo);
  });
}

/* ===================== territórios e ranking ===================== */
async function atualizarMapa() {
  if (!api.temSessao()) return;
  territorios = await api.buscarMapa();
  for (const f of (territorios.features || [])) {
    const d = f.properties.donos || [];
    f.properties.rotulo = Array.isArray(d) ? d.join(' · ') : String(d);
  }
  if (mapReady && map.getSource('terr')) map.getSource('terr').setData(territorios);
}

function fmtArea(m2) {
  const n = Number(m2) || 0;
  return n >= 100000 ? `${(n / 1e6).toFixed(2)} km²` : `${Math.round(n).toLocaleString('pt-BR')} m²`;
}

async function abrirRanking() {
  $('painel').hidden = false;
  $('placar').innerHTML = '<p class="vazio">Carregando…</p>';
  $('rank').innerHTML = '';
  $('rank-nota').textContent = '';

  if (!api.temSessao()) {
    $('placar').innerHTML = '';
    $('rank').innerHTML = '';
    $('rank-nota').textContent = 'O ranking é do servidor, que ainda não está ligado. Enquanto isso, as rotas ficam guardadas só neste aparelho.';
    return;
  }

  const [placar, lista] = await Promise.all([api.buscarPlacar(), api.buscarRanking()]);
  pintarMeuProgresso();
  $('placar').innerHTML = placar.map((e) => {
    const f = FACCOES[e.faccao] || FACCOES.meridiano;
    return `<div class="eq" style="--c:${f.cor}">
      <b>${f.nome}</b><span class="n">${fmtArea(e.area_fisica_m2)}</span>
      <small>${e.pontos.toLocaleString('pt-BR')} pontos competitivos · ${e.conquistas} conquistas · ${e.jogadores} jogadores</small>
    </div>`;
  }).join('') || '<p class="vazio">Nenhuma equipe pontuou ainda.</p>';

  $('rank').innerHTML = lista.map((j, i) =>
    linhaRank(j, i, Number(j.creditos), Number(j.creditos).toLocaleString('pt-BR'))).join('');
  if (!lista.length) $('rank-nota').textContent = 'Ninguém fechou um circuito ainda. Seja o primeiro.';
  else $('rank-nota').textContent = 'Créditos valem enquanto o território for seu. Perdeu o território, perdeu os pontos.';
  if (abaRank !== 'total') mostrarAba(abaRank);
}

function pintarMeuProgresso() {
  const caixa = $('meu-prog');
  if (!progresso || !progresso.ok) { caixa.hidden = true; return; }
  const pct = Math.min(1, progresso.xp_no_nivel / Math.max(progresso.xp_do_nivel, 1));
  const falta = Math.max(0, Math.round(progresso.xp_do_nivel - progresso.xp_no_nivel));
  const of = progresso.ofensiva || 0;
  caixa.hidden = false;
  caixa.innerHTML = `
    <div class="anel-g">${anelNivel({ nivel: progresso.nivel, pct, cor: corDoPerfil(perfil), tam: 54 })}</div>
    <div>
      <b>NÍVEL ${progresso.nivel}${progresso.nivel >= progresso.nivel_max ? ' · MÁXIMO' : ''}</b>
      <div class="barra"><s style="width:${(pct * 100).toFixed(1)}%"></s></div>
      <small>${progresso.nivel >= progresso.nivel_max ? 'Você chegou ao topo.' : `faltam ${falta.toLocaleString('pt-BR')} XP para o nível ${progresso.nivel + 1}`}
        · +${progresso.bonus_ouro}% de ouro</small>
      <small>${of > 0 ? `<span class="fogo">ofensiva de ${of} dia${of > 1 ? 's' : ''}</span>` : 'sem ofensiva: caminhe hoje para começar'}
        · ${fmtArea(progresso.semana)} nesta semana</small>
    </div>`;
}

async function mostrarAba(qual) {
  abaRank = qual;
  for (const b of document.querySelectorAll('.aba')) b.classList.toggle('on', b.dataset.aba === qual);
  const lista = $('rank'); const estante = $('minhas-medalhas');
  lista.hidden = qual === 'medalhas';
  estante.hidden = qual !== 'medalhas';

  if (qual === 'medalhas') {
    $('rank-tit').textContent = 'Minhas medalhas';
    estante.innerHTML = '<p class="nota">Carregando…</p>';
    catalogo = catalogo || await api.buscarCatalogo();
    const tenho = new Set(((progresso && progresso.medalhas) || []).map((m) => m.codigo));
    estante.innerHTML = catalogo.map((m) => cardMedalha(m, tenho.has(m.codigo))).join('')
      || '<p class="nota">O catálogo de medalhas ainda não foi aplicado no servidor.</p>';
    $('rank-nota').textContent = `${tenho.size} de ${catalogo.length} conquistadas. Toque numa para ver o que ela pede.`;
    return;
  }

  if (qual === 'semana') {
    $('rank-tit').textContent = 'Racha da semana — zera toda segunda-feira';
    lista.innerHTML = '<li class="vazio">Carregando…</li>';
    const semana = await api.buscarSemana();
    lista.innerHTML = semana.map((j, i) => linhaRank(j, i, Number(j.area), fmtArea(Number(j.area)))).join('')
      || '<li class="vazio">Ninguém conquistou nada nesta semana ainda.</li>';
    $('rank-nota').textContent = 'O território continua seu. O que zera na segunda é só este placar.';
    return;
  }

  $('rank-tit').textContent = 'Ranking individual — por créditos ativos';
  abrirRanking();
}

function linhaRank(j, i, valor, rotulo) {
  const f = FACCOES[j.faccao] || FACCOES.meridiano;
  const eu = perfil && j.apelido === perfil.apelido;
  return `<li class="${eu ? 'eu' : ''}" data-jog="${j.apelido}">
    <span class="pos">${i + 1}</span>
    <span class="sh">${sneakerSVG({ modelo: j.modelo, cor: (NEONS.find((n) => n.id === j.cor) || NEONS[0]).cor, faccao: j.faccao, largura: 30, brilho: 0.6 })}</span>
    <span class="nm">${j.apelido}<i style="color:${f.cor}">${f.nome}</i></span>
    <span class="cr">${rotulo}</span>
  </li>`;
}

$('abas').addEventListener('click', (e) => {
  const b = e.target.closest('.aba');
  if (b) mostrarAba(b.dataset.aba);
});
$('rank').addEventListener('click', (e) => {
  const li = e.target.closest('[data-jog]');
  if (li) abrirJogador(li.dataset.jog);
});
$('minhas-medalhas').addEventListener('click', async (e) => {
  const d = e.target.closest('[data-med]');
  if (!d) return;
  catalogo = catalogo || await api.buscarCatalogo();
  const m = catalogo.find((x) => x.codigo === d.dataset.med);
  if (!m) return;
  const tem = ((progresso && progresso.medalhas) || []).some((x) => x.codigo === m.codigo);
  await ask({
    title: m.nome,
    text: tem ? m.descricao : `${m.descricao}\n\nAinda não conquistada.`,
    arte: medalhaSVG({ codigo: m.codigo, raridade: m.raridade, tam: 110, ganha: tem }),
    ok: 'FECHAR',
  });
});

$('campo-codigo').hidden = !api.temServidor;
$('btn-sair').onclick = async () => {
  const sure = await ask({
    title: 'Sair da conta?',
    text: 'Você vai precisar do apelido e do PIN para entrar de novo. Uma rota em andamento é descartada.',
    ok: 'SAIR', cancel: 'FICAR', danger: true,
  });
  if (!sure) return;
  session.abandon(); save();
  api.sair();
  try { localStorage.removeItem('atlas.player.v1'); } catch { /* sem armazenamento */ }
  location.reload();
};

$('btn-centro').onclick = () => {
  followMe = true;
  $('btn-centro').hidden = true;
  if (mapReady && lastFix) map.easeTo({ center: [lastFix.lng, lastFix.lat], zoom: Math.max(map.getZoom(), 16.5), duration: 700 });
};
$('btn-rank').onclick = abrirRanking;
$('painel-fechar').onclick = () => { $('painel').hidden = true; };
$('painel').addEventListener('click', (e) => { if (e.target.id === 'painel') $('painel').hidden = true; });

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
      const agora = Date.now();
      if (session.sessaoServidor && p.acc <= 25 && agora - ultimoPing > 90000) {
        ultimoPing = agora;
        api.pingRota(session.sessaoServidor, p.lat, p.lng, p.acc);
      }
      if (r.justReturned) { aviso(); toast('Você voltou ao ponto inicial. Toque em FINALIZAR ROTA para encerrar.', 6000); }
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

let ultimoPing = 0;

ui.start.onclick = async () => {
  if (!lastFix) { toast('Aguardando o GPS encontrar sua posição.'); return; }

  const inicio = lastFix;   // a mesma leitura abre a rota e começa o percurso
  if (api.temSessao()) {
    ui.start.disabled = true;
    toast('Abrindo a rota no servidor…', 2500);
    const r = await api.iniciarRota(inicio.lat, inicio.lng);
    ui.start.disabled = false;
    if (!r || !r.ok) {
      const segue = await ask({
        title: 'Sem conexão com o servidor',
        text: 'A rota precisa ser aberta no servidor para valer território.\n\n'
          + 'Dá para caminhar assim mesmo e testar o GPS, mas o percurso não vai conquistar nada.',
        ok: 'CAMINHAR ASSIM MESMO', cancel: 'TENTAR DE NOVO',
      });
      if (!segue) return;
      sessaoServidor = null;
    } else {
      sessaoServidor = r.sessao;
    }
  }

  try {
    session.start({ ...inicio, t: SIM ? simT : Date.now() });
  } catch (e) { toast(e.message); return; }
  session.sessaoServidor = sessaoServidor;
  ultimoPing = Date.now();
  followMe = true;
  save();
  keepScreenOn();
  render();
  drawAll();
};

ui.finish.onclick = async () => {
  if (!session.canFinish) return;
  const payload = session.finish(SIM ? simT : Date.now());
  payload.sessao = sessaoServidor;
  sessaoServidor = null;
  save();
  releaseScreen();
  render();

  const resumo = `Percurso: ${fmtDist(payload.distanceM)} em ${fmtTime(payload.finishedAt - payload.startedAt)}.`;
  toast('Enviando a rota para o servidor…', 2500);
  const [r] = await Promise.all([api.enviarRota(payload), replay(payload.points)]);
  drawAll();

  if (r && r.ok && r.repetida) {
    await ask({ title: 'Rota já registrada', text: `${resumo}\n\nEsta rota já tinha sido validada pelo servidor; não contou duas vezes.`, ok: 'VOLTAR AO MAPA' });
    await atualizarMapa();
    return;
  }

  if (r && r.ok) {
    const tomadas = (r.tomadas || []).map((t) => `${t.apelido} (${Number(t.area).toLocaleString('pt-BR')} m²)`);
    aviso();
    tremer(VIB.conquista);
    await ask({
      title: 'Território conquistado',
      numeros: [[fmtArea(r.area_terreno), 'área tomada'], [Number(r.creditos).toLocaleString('pt-BR'), 'créditos'],
        ...(carteira ? [[`+${fmtOuro(Math.floor(r.area_terreno / 1000))}`, 'ouro']] : [])],
      text: resumo + (tomadas.length ? `\n\nVocê tirou território de: ${tomadas.join(', ')}` : ''),
      ok: 'VOLTAR AO MAPA',
      extra: {
        rotulo: 'CARTÃO',
        acao: async () => {
          const blob = await cartaoConquista({
            titulo: fmtArea(r.area_terreno),
            subtitulo: 'território conquistado',
            linhas: [`${fmtDist(payload.distanceM)} caminhados em ${fmtTime(payload.finishedAt - payload.startedAt)}`,
              new Date(payload.finishedAt).toLocaleDateString('pt-BR')],
            pontos: payload.points,
            cor: corDoPerfil(perfil), corEquipe: FACCOES[perfil.faccao].cor,
            apelido: perfil.apelido, equipe: FACCOES[perfil.faccao].nome,
            nivel: progresso && progresso.nivel,
          });
          await compartilhar(blob, 'atlas-conquista.png',
            `Conquistei ${fmtArea(r.area_terreno)} para a ${FACCOES[perfil.faccao].nome} no ATLAS.`);
        },
      },
    });
    carteira = await api.buscarCarteira();
    await atualizarMapa();
    await atualizarProgresso();
    return;
  }

  tremer(VIB.recusa);
  await ask({
    title: r && r.motivo === 'sem_servidor' ? 'Rota registrada neste aparelho' : 'Rota não validada',
    text: `${resumo}\n\n${(r && MOTIVOS[r.motivo === 'rede' ? 'rede_rota' : r.motivo]) || (r && r.detalhe) || 'O servidor não aceitou esta rota.'}`,
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
// A volta ao ponto inicial já vibra em aviso(). Aqui só a saída da zona,
// que até agora não dava nenhum retorno com o celular no bolso.
let eraFora = false;
function render() {
  const st = session.state;
  if (st === 'active' && session.leftZone && !eraFora) { tremer(VIB.saiu); eraFora = true; }
  if (st === 'idle') eraFora = false;
  ui.start.hidden = st !== 'idle';
  ui.finish.hidden = st !== 'ready';
  ui.abandon.hidden = st === 'idle';
  ui.stats.hidden = st === 'idle';
  ui.perfil.disabled = st !== 'idle';

  if (lastFix && !SIM) {
    const good = lastFix.acc <= CONFIG.ACC_AVISO_M;
    ui.gps.className = `chip ${good ? 'ok' : 'bad'}`;
    ui.gps.innerHTML = `GPS <span>±${Math.round(lastFix.acc)} m</span>`;
    if (!good && !avisouGps) {
      avisouGps = true;
      banner('Sinal fraco aqui. Dentro de mercado, prédio ou garagem o GPS erra muito e o traçado sai torto — o jogo foi feito para rua aberta.');
      setTimeout(() => { if (lastFix && lastFix.acc <= CONFIG.ACC_AVISO_M) banner(''); }, 12000);
    }
    if (good && avisouGps && session.state === 'idle') { avisouGps = false; banner(''); }
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
  if (st === 'ready') {
    const curta = session.distanceM < CONFIG.MIN_ROUTE_M;
    ui.hint.textContent = curta
      ? `Você está no ponto inicial, mas o percurso tem ${Math.round(session.distanceM)} m e o mínimo é ${CONFIG.MIN_ROUTE_M} m. Dê mais uma volta antes de finalizar.`
      : 'Você está no ponto inicial. Toque em FINALIZAR ROTA para encerrar.';
  }
  else if (!session.leftZone) {
    const falta = Math.max(0, Math.ceil(CONFIG.LEAVE_RADIUS_M - session.maxDistToOrigin));
    const chegou = Math.round(session.maxDistToOrigin);
    ui.hint.textContent = `Saia do círculo pontilhado: faltam ${falta} m (você chegou a ${chegou} m do início).${lockNote}`;
  }
  else ui.hint.textContent = `Rota em andamento. Volte a até ${CONFIG.FINISH_RADIUS_M} m do início para poder finalizar.${lockNote}`;
}

setInterval(() => {
  if (session.state !== 'idle') ui.time.textContent = fmtTime((SIM ? simT : Date.now()) - session.startedAt);
}, 1000);

/* ===================== início ===================== */
aplicarCores(perfil);
if (!api.temServidor) banner('Servidor ainda não ligado: sua conta e suas rotas ficam só neste aparelho.');
function sessaoVencida() {
  const quem = perfil ? perfil.apelido : '';
  toast('Sua sessão expirou. Entre de novo com o apelido e o PIN.', 6000);
  abrirOnboarding({ tela: 'entrar' });
  if (quem) { $('ent-nome').value = quem; $('ent-nome').dispatchEvent(new Event('input', { bubbles: true })); }
}

function entrarNoJogo() {
  pintarHud();
  aplicarCores(perfil);
  atualizarMarcador();
  atualizarMapa();
  atualizarProgresso();
  api.reenviarPendentes().then((f) => { if (f.length) { toast(`${f.length} rota(s) guardada(s) foram enviadas.`); atualizarMapa(); } });
}

if (perfil && !api.temServidor) {
  entrarNoJogo();
} else if (api.temSessao()) {
  // A sessão do servidor manda. O perfil local é só um atalho: se ele sumiu
  // (Safari limpa o armazenamento sozinho), buscamos de volta em vez de
  // mandar a pessoa criar uma conta que já existe.
  if (perfil) entrarNoJogo();
  api.meuPerfil().then((p) => {
    if (!p) { sessaoVencida(); return; }
    perfil = { ...perfilVazio(), ...(perfil || {}), ...p };
    salvarPerfil(perfil);
    if (!ui.onb.hidden) fecharOnboarding();
    entrarNoJogo();
  }).catch(() => { if (!perfil) abrirOnboarding(); });
} else {
  abrirOnboarding();
}
setInterval(() => { if (api.temSessao() && document.visibilityState === 'visible') atualizarMapa(); }, 45000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && api.temSessao() && session.state === 'idle') {
    atualizarMapa();
    atualizarProgresso();
  }
});

if (session.state !== 'idle') {
  sessaoServidor = session.sessaoServidor || null;
  toast('Rota em andamento recuperada.');
  keepScreenOn();
  document.addEventListener('pointerdown', keepScreenOn, { once: true });
}
render();
initMap();
startGps();
