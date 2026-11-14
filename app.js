// ATLAS — protótipo web: identidade do jogador + sessão de rota.
// Ainda NÃO existe servidor: perfil e rotas ficam apenas neste aparelho.
import {
  CONFIG, RouteSession, circlePolygon, haversine, pertoNoSegmento, DetectorDeMovimento,
} from './geo.js?v=44';
import {
  FACCOES, NEONS, avatarSVG, carregarPerfil, salvarPerfil, perfilVazio, corDoPerfil,
  logoSVG,
  GRATIS, PRECOS, temItem, precoDe, fmtOuro, CENARIOS, cenarioSVG,
} from './player.js?v=44';
import * as api from './api.js?v=44';
import {
  resolverVisual, PRESETS, VISUAL_PADRAO, visualValido, mudouDePeca,
  SLOTS, CATALOGO, PLACAS, CORES_PECA,
} from './visual.js?v=44';
import {
  anelNivel, medalhaSVG, cartaoConquista, compartilhar, tremer, VIB,
  latinhaSVG, marcaLatinhaHTML, LATINHAS,
} from './progresso.js?v=44';

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
let energia = null;
let spawns = [];
let marcasLata = new Map();
let coletaRaio = 20;
let ultimaBuscaSpawn = 0;
let ultimoCentroSpawn = null;
let temFoto = false;
const AREA_KEY = 'atlas.area_ativa.v1';

/* ===================== cores ===================== */
function aplicarCores(p) {
  const raiz = document.documentElement.style;
  raiz.setProperty('--neon', corDoPerfil(p));
  raiz.setProperty('--fac', (FACCOES[p && p.faccao] || FACCOES.meridiano).cor);
}

function pintarHud() {
  if (!perfil) return;
  ui.hudShoe.innerHTML = avatarSVG({ ...perfil, cor: corDoPerfil(perfil), largura: 26, sombra: false });
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
  velocidade: `Houve trecho acima de ${CONFIG.MAX_SPEED_KMH} km/h. Se não foi corrida nem veículo, pode ter sido falha do GPS.`,
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

// Os tres modelos antigos viram conjuntos de peça equivalentes, para quem ja
// tinha roupa comprada nao abrir o jogo e encontrar outra unidade. Fica aqui em
// cima porque `const` nao sobe, e duas funcoes diferentes dependem dele.
const PRESET_ANTIGO = { basico: 'batedor', corredor: 'corredor', jaqueta: 'bastiao' };

/* ===================== pré-telas ===================== */
const LORE = [
  {
    titulo: 'A Ruptura',
    texto: 'A rede contínua de energia se partiu num intervalo de poucas horas, e o que veio depois não foi escassez: '
      + 'foi dispersão. A carga não sumiu — ela se espalhou.\n\n'
      + 'Hoje o que sobrou aflora em cápsulas soltas, pelos ramais antigos que correm por baixo das ruas. '
      + 'É pouco demais em cada ponto e espalhado demais para qualquer central recolher. Só funciona de um jeito: '
      + 'alguém andando.',
  },
  {
    titulo: 'As Unidades',
    texto: 'Por isso o projeto ATLAS deixou de fabricar máquina grande e passou a fabricar unidades de campo: '
      + 'uma por operador.\n\n'
      + 'A sua unidade caminha a cidade, recolhe o que encontra e devolve à rede o que junta. '
      + 'Quem comanda é você. Quem anda é ela.\n\n'
      + 'Duas agências herdaram o mesmo mandato e disputam o mesmo resíduo. '
      + 'AURORA acende e mantém: para ela a carga pertence a quem a conserva. Marca a cidade de azul. '
      + 'ZÊNITE vive da pressão constante: para ela a carga pertence a quem chega primeiro. Marca a cidade de verde.\n\n'
      + 'Nenhuma das duas está errada. As duas precisam da mesma energia — e é por isso que a cidade segue em disputa.',
  },
  {
    titulo: 'A Regra',
    texto: 'A sua unidade não reivindica território: ela o drena. E só consegue drenar quando fecha o perímetro '
      + 'da área a pé, porque o circuito fechado é literalmente a antena.\n\n'
      + 'Perímetro aberto não fecha circuito, e circuito aberto não drena nada. Não existe atalho e não existe '
      + 'conquista pela metade.\n\n'
      + 'O que você fechar passa a levar o seu nome — até que alguém caminhe mais do que você.',
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
  montarPecas();

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

/* ===================== oficina dentro do perfil ===================== */
// As peças da unidade ainda NAO estao na tabela `loja` do servidor, entao
// comprar peça daria erro. Enquanto a migracao nao roda, todas aparecem
// liberadas e o preco fica so na oficina, para nao oferecer um botao que falha.
let abaPeca = SLOTS[0].id;

function visualDoRascunho() {
  if (!visualValido(rascunho.visual)) {
    const antigo = PRESET_ANTIGO[rascunho.modelo] || 'batedor';
    rascunho.visual = { ...(PRESETS[antigo] || VISUAL_PADRAO) };
  }
  return rascunho.visual;
}

function montarAbas() {
  const abas = [...SLOTS.map((s) => [s.id, s.nome]), ['placa', 'Metal']];
  $('row-abas').innerHTML = abas.map(([id, nome]) =>
    `<button type="button" data-slot="${id}" aria-pressed="${abaPeca === id}">${nome}</button>`).join('');
}

function montarPecas() {
  montarAbas();
  const v = visualDoRascunho();
  const alvo = $('row-pecas');

  if (abaPeca === 'placa') {
    alvo.innerHTML = '<span class="sub-tit">METAL DO CHASSI</span>'
      + `<div class="opt-row">${PLACAS.map((t) =>
        `<button type="button" data-peca="placa" data-valor="${t.id}" aria-pressed="${v.placa === t.id}" title="${t.nome}" aria-label="${t.nome}">`
        + `<span style="background:${t.cor}"></span></button>`).join('')}</div>`;
    return;
  }

  const slot = SLOTS.find((s) => s.id === abaPeca) || SLOTS[0];
  let html = '<span class="sub-tit">MODELO</span><div class="opt-row">'
    + CATALOGO[slot.id].map((it) =>
      `<button type="button" data-peca="${slot.id}" data-valor="${it.id}" aria-pressed="${v[slot.id] === it.id}">`
      + `<b>${it.nome}</b></button>`).join('')
    + '</div>';
  if (slot.cores) {
    const chave = `${slot.id}Cor`;
    html += '<span class="sub-tit">COR</span><div class="opt-row">'
      + CORES_PECA.map((c) =>
        `<button type="button" data-peca="${chave}" data-valor="${c.id}" aria-pressed="${v[chave] === c.id}" title="${c.nome}" aria-label="${c.nome}">`
        + `<span style="background:${c.cor || corDoPerfil(rascunho)}"></span></button>`).join('')
      + '</div>';
  }
  alvo.innerHTML = html;
}

/* ---- o preview em 3D, a mesma unidade que anda no mapa ---- */
let preview3d = null;
let lacoPreview = 0;
let giroPreview = 0;

async function ligarPreview3d() {
  if (preview3d) return;
  const tela = $('preview3d');
  if (!tela) return;
  try {
    const mod = await import('./boneco3d.js?v=44');
    preview3d = await mod.criarBoneco(tela, resolverVisual(visualDoRascunho(), corDoPerfil(rascunho)));
    tela.hidden = false;
    $('preview').hidden = true;
    const lado = 190;
    tela.style.width = `${lado}px`;
    tela.style.height = `${Math.round(lado * 1.2)}px`;
    preview3d.dimensionar(lado, Math.round(lado * 1.2));
    rodarPreview();
  } catch {
    // sem 3D o perfil continua com a silhueta em SVG, que sempre funciona
    preview3d = null;
  }
}

function rodarPreview() {
  cancelAnimationFrame(lacoPreview);
  const passo = () => {
    lacoPreview = requestAnimationFrame(passo);
    const tela = $('preview3d');
    if (!preview3d || !tela || tela.hidden || ui.onb.hidden) return;
    giroPreview += 0.006;
    preview3d.quadro(false, 0, Math.sin(giroPreview) * 0.6);
  };
  passo();
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
  document.querySelectorAll('[data-slot]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.slot === abaPeca)));
  document.querySelectorAll('[data-cor]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cor === rascunho.cor)));
  document.querySelectorAll('[data-cenario]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cenario === rascunho.cenario)));
  document.querySelectorAll('[data-fac]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fac === rascunho.faccao)));
}

function desenharPreview() {
  $('cenario-fundo').innerHTML = cenarioSVG({ id: rascunho.cenario, cor: corDoPerfil(rascunho), largura: 300 });
  $('preview').innerHTML = avatarSVG({ ...rascunho, cor: corDoPerfil(rascunho), largura: 118 });
  ligarPreview3d();
  if (preview3d) {
    try { preview3d.vestir(resolverVisual(visualDoRascunho(), corDoPerfil(rascunho))); } catch { /* segue */ }
  }
}

function desenharResumo() {
  $('resumo-shoe').innerHTML = avatarSVG({ ...rascunho, cor: corDoPerfil(rascunho), largura: 92 });
  $('resumo-nome').textContent = rascunho.apelido;
  $('resumo-fac').textContent = `AGÊNCIA ${FACCOES[rascunho.faccao].nome}`;
  const v = visualDoRascunho();
  const chassi = (CATALOGO.chassi.find((x) => x.id === v.chassi) || CATALOGO.chassi[0]).nome;
  const c = NEONS.find((x) => x.id === rascunho.cor) || NEONS[0];
  $('resumo-ten').textContent = `Chassi ${chassi} · ${c.nome}`;
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
  if (b.dataset.slot) {
    abaPeca = b.dataset.slot;
    montarPecas();
    return;
  }
  if (b.dataset.peca) {
    // peça ainda nao esta na tabela `loja` do servidor, entao nao ha compra a
    // fazer aqui: todas aparecem liberadas ate a migracao rodar
    visualDoRascunho()[b.dataset.peca] = b.dataset.valor;
    montarPecas();
    desenharPreview();
    return;
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
      // O servidor ainda nao tem coluna para o visual novo: so modelo, cor e
      // cenario atravessam. As peças da unidade ficam no aparelho ate a
      // migracao rodar — e e por isso que a oficina avisa isso em tela.
      api.salvarVisual({ modelo: perfil.modelo, cor: perfil.cor, cenario: perfil.cenario });
      fecharOnboarding();
      toast('Unidade atualizada.');
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

function ask({ title, text, ok, cancel, danger, numeros, arte, extra, extra2 }) {
  return new Promise((resolve) => {
    const bArte = $('m-arte');
    bArte.hidden = !arte;
    bArte.innerHTML = arte || '';
    const ligar = (id, cfg) => {
      const b = $(id);
      b.hidden = !cfg;
      if (!cfg) { b.onclick = null; return; }
      b.textContent = cfg.rotulo;
      b.disabled = false;
      b.onclick = async () => {
        b.disabled = true;
        try { await cfg.acao(); } finally { b.disabled = false; }
      };
    };
    ligar('m-extra', extra);
    ligar('m-extra2', extra2);
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
      ui.mOk.onclick = ui.mCancel.onclick = null;
      $('m-extra').onclick = $('m-extra2').onclick = null;
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
    // Girar com dois dedos fica LIGADO: é como se olha o resto da cidade.
    attributionControl: false, dragRotate: true, pitchWithRotate: true,
    // O afastamento máximo é amarrado ao raio de 500 m das latinhas: se desse
    // para afastar mais, as bordas do mapa ficariam vazias e pareceria defeito.
    minZoom: CAMERA.zoomMin, maxZoom: 19.5, pitch: 0, maxPitch: 62,
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
  map.touchZoomRotate.enableRotation();
  map.on('dragstart', () => { followMe = false; $('btn-centro').hidden = false; });
  // Girou a tela? O botão de centralizar aparece e também desgira.
  map.on('rotatestart', () => { $('btn-centro').hidden = false; });
  map.on('error', (e) => {
    const msg = String((e && e.error && e.error.message) || '');
    if (msg) banner(`Problema no mapa: ${msg}`);
  });

  map.on('load', () => {
    levantarPredios();
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

    // O chao da latinha e geometria do mapa, nao desenho de tela: assim ele
    // tomba com a inclinacao e escala com o zoom exatamente como a linha da
    // quadra e da rua. Era isso que faltava para a lata parecer fincada.
    map.addSource('latas', { type: 'geojson', data: empty() });
    map.addLayer({
      id: 'latas-chao', type: 'fill', source: 'latas',
      paint: { 'fill-color': ['get', 'cor'], 'fill-opacity': ['get', 'fundo'] },
    });
    map.addLayer({
      id: 'latas-borda', type: 'line', source: 'latas',
      paint: { 'line-color': ['get', 'cor'], 'line-width': 2, 'line-opacity': ['get', 'forca'] },
    });

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
    ligarBoneco3d();
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
    avatarSVG({ ...(perfil || perfilVazio()), cor, largura: 54, sombra: false });
  marker.getElement().classList.toggle('tem3d', !!boneco3d);
  repintarBoneco3d();
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



/* ===================== foto do território ===================== */
// A foto é reduzida e reescrita aqui antes de subir. Além de economizar
// rede, passar pelo canvas apaga os metadados do arquivo original —
// inclusive a coordenada de GPS que a câmera grava na foto.
function encolherFoto(file, lado = 1280, qualidade = 0.82) {
  return new Promise((pronto, falhou) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const esc = Math.min(1, lado / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * esc);
      c.height = Math.round(img.height * esc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => (b ? pronto(b) : falhou(new Error('Não deu para preparar a foto.'))), 'image/jpeg', qualidade);
    };
    img.onerror = () => { URL.revokeObjectURL(url); falhou(new Error('Não deu para ler a foto.')); };
    img.src = url;
  });
}

function pedirFoto() {
  return new Promise((pronto) => {
    const inp = $('camera');
    inp.value = '';
    const fim = () => { inp.onchange = null; };
    inp.onchange = () => { const f = inp.files && inp.files[0]; fim(); pronto(f || null); };
    inp.click();
  });
}

async function tirarFotoDoTerritorio() {
  const file = await pedirFoto();
  if (!file) return;
  const alvo = await api.ultimaConquista();
  if (!alvo || !alvo.id) { toast('Não achei a conquista para pendurar a foto.', 5000); return; }
  toast('Preparando a foto…', 2500);
  try {
    const blob = await encolherFoto(file);
    const r = await api.enviarFoto(alvo.id, blob);
    if (r && r.ok) {
      tremer(VIB.conquista);
      toast('Foto guardada neste território.', 4000);
      await atualizarMapa();
    } else {
      toast(`A foto não foi guardada: ${(r && r.motivo) || 'motivo desconhecido'}`, 6000);
    }
  } catch (e) {
    toast(e.message || 'Não deu para enviar a foto.', 6000);
  }
}

// As fotos chegam pelo mapa como caminho; o arquivo em si só vem quando
// alguém abre a ficha, e com o token — o balde não é público.
const fotosNaTela = new Map();
async function pintarFotos(raiz) {
  for (const alvo of raiz.querySelectorAll('[data-foto]')) {
    const caminho = alvo.dataset.foto;
    try {
      if (!fotosNaTela.has(caminho)) fotosNaTela.set(caminho, await api.baixarFoto(caminho));
      const img = document.createElement('img');
      img.className = alvo.classList.contains('grande') ? 'foto-grande' : 'foto-mini';
      img.alt = 'Foto do território';
      img.src = fotosNaTela.get(caminho);
      alvo.replaceWith(img);
    } catch {
      alvo.textContent = '!';
    }
  }
}



/* ===================== câmera: passeio inclinado, rota reta ===================== */
// APROVADO pelo Miguel em 13/11/2026: no passeio a câmera fica inclinada, como
// no Pokémon GO. Quando a rota começa o mapa volta a ficar reto, porque de
// lado o território vira um trapézio e fica difícil julgar a forma do polígono.
const CAMERA = {
  pitchPasseio: 55,
  pitchRota: 0,
  // Em Campo Grande, neste zoom a tela cobre pouco mais que o diâmetro do
  // raio de 500 m em que o servidor entrega latinha.
  zoomMin: 15.2,
  // Perto o bastante para o boneco ficar do tamanho de uma quadra.
  zoomPadrao: 17.8,
};

function aplicarCamera({ animado = true } = {}) {
  if (!mapReady) return;
  const alvo = session.state === 'idle' ? CAMERA.pitchPasseio : CAMERA.pitchRota;
  if (Math.abs(map.getPitch() - alvo) < 1) return;
  if (animado) map.easeTo({ pitch: alvo, duration: 900 });
  else map.setPitch(alvo);
}

// Os dados de mapa que já baixamos trazem a altura de cada edificação, então
// os prédios saem em volume sem nenhum arquivo novo.
function levantarPredios() {
  const base = map.getLayer('building');
  if (!base || map.getLayer('predios-3d')) return;
  const antes = map.getStyle().layers.find((l) => l.id === 'terr-fill') ? 'terr-fill' : undefined;
  try {
    map.addLayer({
      id: 'predios-3d',
      type: 'fill-extrusion',
      source: base.source,
      'source-layer': 'building',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': [
          'interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6],
          0, '#17232f', 20, '#1d2e3f', 60, '#25405a',
        ],
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.82,
      },
    }, antes);
  } catch { /* estilo sem camada de edificação: segue sem os volumes */ }
}


/* ===================== personagem em 3D sobre o mapa ===================== */
// Tudo aqui é opcional: se o Three.js não carregar, se a placa recusar ou se
// o aparelho for fraco, o jogo segue com o boneco vetorial de sempre. Nada
// nesta seção pode derrubar o resto.
let boneco3d = null;
let laco3d = 0;
let ultimoVisual = null;

// O visual guardado no perfil vem em ids de peca. Quem ainda nao tem visual
// novo cai no preset do modelo antigo, entao ninguem abre o jogo e encontra um
// boneco diferente do seu.
// Os tres modelos antigos viram conjuntos de peça equivalentes, para quem ja
// tinha roupa comprada nao abrir o jogo e encontrar outra unidade.
function visualCru() {
  const salvo = perfil && perfil.visual;
  if (visualValido(salvo)) return salvo;
  const antigo = PRESET_ANTIGO[(perfil && perfil.modelo) || 'basico'] || 'batedor';
  return PRESETS[antigo] || VISUAL_PADRAO;
}

function visualDoBoneco() {
  return resolverVisual(visualCru(), corDoPerfil(perfil));
}

// Tamanho na tela: cresce com a aproximação, como qualquer coisa que está no
// chão. Travado entre 46 e 160 px para não sumir nem virar outdoor.
function tamanhoDoBoneco() {
  const z = mapReady ? map.getZoom() : CAMERA.zoomPadrao;
  return Math.round(Math.max(46, Math.min(160, 78 * (2 ** (z - CAMERA.zoomPadrao)))));
}

async function ligarBoneco3d() {
  if (boneco3d || !mapReady) return;
  const tela = $('boneco3d');
  if (!tela) return;
  try {
    const mod = await import('./boneco3d.js?v=44');
    ultimoVisual = visualCru();
    boneco3d = await mod.criarBoneco(tela, visualDoBoneco());
    tela.hidden = false;
    if (marker) marker.getElement().classList.add('tem3d');
    rodar3d();
  } catch (e) {
    boneco3d = null;
    tela.hidden = true;
    if (marker) marker.getElement().classList.remove('tem3d');
  }
}

function rodar3d() {
  cancelAnimationFrame(laco3d);
  const passo = () => {
    laco3d = requestAnimationFrame(passo);
    if (!boneco3d || !mapReady) return;
    const tela = $('boneco3d');
    if (!lastFix || document.visibilityState !== 'visible' || !$('onb').hidden) {
      tela.style.opacity = '0';
      return;
    }
    const p = map.project([lastFix.lng, lastFix.lat]);
    const lado = tamanhoDoBoneco();
    const alto = Math.round(lado * 1.25);
    if (tela.width !== lado || tela.height !== alto) {
      tela.style.width = `${lado}px`;
      tela.style.height = `${alto}px`;
      boneco3d.dimensionar(lado, alto);
    }
    tela.style.opacity = '1';
    // os pés do boneco ficam no ponto do GPS
    tela.style.transform = `translate(${Math.round(p.x - lado / 2)}px, ${Math.round(p.y - alto + lado * 0.12)}px)`;
    const el = marker && marker.getElement();
    boneco3d.quadro(!!(el && el.classList.contains('andando')),
      el && el.classList.contains('virado') ? -1 : 1);
  };
  passo();
}

function repintarBoneco3d() {
  if (!boneco3d) return;
  try {
    const cru = visualCru();
    if (mudouDePeca(ultimoVisual, cru)) boneco3d.vestir(visualDoBoneco());
    else boneco3d.pintar(visualDoBoneco());
    ultimoVisual = cru;
  } catch { /* segue com o que ja esta na tela */ }
}

/* ===================== latinhas de energia ===================== */
// O servidor manda a célula; quem encaixa a latinha numa rua é o celular,
// usando a malha viária que o próprio mapa já carregou. O primeiro jogador
// que passa por ali fixa o ponto para todo mundo.
const CLASSES_RUA = new Set([
  'residential', 'tertiary', 'secondary', 'primary', 'minor', 'street',
  'living_street', 'service', 'pedestrian', 'path', 'footway', 'track',
]);

function fonteDoMapa() {
  const l = map.getLayer('building') || map.getLayer('water');
  return l ? l.source : null;
}

function ruaNaCelula(caixa) {
  const fonte = fonteDoMapa();
  if (!fonte) return null;
  let feicoes;
  try { feicoes = map.querySourceFeatures(fonte, { sourceLayer: 'transportation' }); }
  catch { return null; }
  if (!feicoes || !feicoes.length) return null;

  const centro = { lat: (caixa[0] + caixa[2]) / 2, lng: (caixa[1] + caixa[3]) / 2 };
  let melhor = null; let melhorD = Infinity;
  for (const f of feicoes) {
    const classe = f.properties && f.properties.class;
    if (classe && !CLASSES_RUA.has(classe)) continue;
    const g = f.geometry;
    if (!g) continue;
    const linhas = g.type === 'LineString' ? [g.coordinates]
      : g.type === 'MultiLineString' ? g.coordinates : [];
    for (const linha of linhas) {
      for (let i = 1; i < linha.length; i++) {
        const q = pertoNoSegmento(centro, linha[i - 1], linha[i]);
        if (q.lat < caixa[0] || q.lat >= caixa[2] || q.lng < caixa[1] || q.lng >= caixa[3]) continue;
        const d = haversine(centro, q);
        if (d < melhorD) { melhorD = d; melhor = q; }
      }
    }
  }
  return melhor;
}

async function atualizarSpawns(forcar = false) {
  if (!lastFix || !api.temSessao() || !mapReady) return;
  const agora = Date.now();
  const longe = !ultimoCentroSpawn || haversine(ultimoCentroSpawn, lastFix) > 120;
  if (!forcar && !longe && agora - ultimaBuscaSpawn < 60000) return;
  ultimaBuscaSpawn = agora;
  ultimoCentroSpawn = { lat: lastFix.lat, lng: lastFix.lng };

  const r = await api.spawnsPerto(lastFix.lat, lastFix.lng);
  if (!r || !r.ok) return;
  coletaRaio = Number(r.coleta_m) || 20;
  spawns = (r.spawns || []).filter((s) => s.tem_ponto);
  desenharLatinhas();

  // células vivas que ainda não têm rua escolhida: o app propõe uma
  const semPonto = (r.spawns || []).filter((s) => !s.tem_ponto).slice(0, 6);
  let achou = false;
  for (const s of semPonto) {
    const q = ruaNaCelula(s.caixa);
    if (!q) continue;
    const ok = await api.proporPonto(s.celula, q.lat, q.lng);
    if (ok && ok.ok) achou = true;
  }
  if (achou) { ultimaBuscaSpawn = 0; setTimeout(() => atualizarSpawns(true), 600); }
}

// Raio do disco no chao, em metros. Nao e o raio de coleta (20 m): e so a
// marca visual, e 5 m e mais ou menos a largura de uma calcada.
const RAIO_CHAO_M = 5;

function desenharLatinhas() {
  const vivas = new Set();
  const chao = [];
  for (const s of spawns) {
    vivas.add(s.celula);
    const dist = lastFix ? haversine(lastFix, s) : Infinity;
    const perto = dist <= coletaRaio;
    const cor = (LATINHAS[s.tipo] || LATINHAS.lata).cor;

    const disco = circlePolygon({ lat: s.lat, lng: s.lng }, RAIO_CHAO_M, 24);
    disco.properties = { cor, forca: perto ? 0.95 : 0.45, fundo: perto ? 0.22 : 0.1 };
    chao.push(disco);

    let m = marcasLata.get(s.celula);
    if (!m) {
      const el = document.createElement('div');
      el.className = 'marca-lata';
      el.style.setProperty('--c', cor);
      el.innerHTML = marcaLatinhaHTML(s.tipo, 42);
      el.onclick = () => pegarLatinha(s);
      // anchor 'bottom' e o conserto: o padrao do MapLibre e 'center', entao o
      // pe da lata ficava 34 px ABAIXO da coordenada. Offset constante em tela
      // nao e offset constante no chao quando o mapa esta inclinado — perto do
      // alto da tela 34 px valem muitos metros, embaixo valem poucos. Por isso
      // a lata derivava sobre as ruas conforme a camera andava.
      m = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([s.lng, s.lat]).addTo(map);
      marcasLata.set(s.celula, m);
    }
    m.getElement().classList.toggle('perto', perto);
    m.getElement().classList.toggle('lata-longe', !perto);
  }
  for (const [celula, m] of marcasLata) {
    if (!vivas.has(celula)) { m.remove(); marcasLata.delete(celula); }
  }
  if (mapReady && map.getSource('latas')) {
    map.getSource('latas').setData({ type: 'FeatureCollection', features: chao });
  }
}

async function pegarLatinha(s) {
  if (!lastFix) { toast('Sem posição ainda. Espere o GPS.', 4000); return; }
  const d = haversine(lastFix, s);
  if (d > coletaRaio) {
    toast(`Chegue mais perto: faltam ${Math.round(d - coletaRaio)} m.`, 3500);
    return;
  }
  try {
    const r = await api.coletar(s.celula, lastFix.lat, lastFix.lng);
    if (r && r.ok) {
      const nome = (LATINHAS[r.tipo] || LATINHAS.lata).nome;
      tremer(VIB.podeFechar);
      energia = r.energia || energia;
      pintarEnergia();
      toast(r.tipo === 'capsula' ? `${nome}! Agora dá para usar o turbo.` : `${nome}: +${r.ganho} de carga.`, 4000);
      spawns = spawns.filter((x) => x.celula !== s.celula);
      desenharLatinhas();
    } else {
      toast(MOTIVOS_LATA[r && r.motivo] || 'Não deu para pegar essa latinha.', 4000);
      if (r && r.motivo === 'ja_sumiu') { spawns = spawns.filter((x) => x.celula !== s.celula); desenharLatinhas(); }
    }
  } catch (e) {
    toast(e.message || 'Não deu para pegar essa latinha.', 4000);
  }
}

const MOTIVOS_LATA = {
  ja_sumiu: 'Essa latinha acabou de sumir. Elas trocam a cada 20 minutos.',
  ja_peguei: 'Você já pegou essa.',
  longe: 'Você ainda está longe demais.',
  sem_ponto: 'Essa latinha ainda não tem lugar definido.',
  ritmo_alto: 'Muitas coletas em pouco tempo. Espere um pouco.',
  rapido_demais: 'Você se moveu rápido demais entre uma latinha e outra.',
};

function pintarEnergia() {
  const chip = $('energia');
  if (!energia) { chip.hidden = true; return; }
  const turboDePe = energia.turbo_ate && new Date(energia.turbo_ate) > new Date();
  chip.hidden = false;
  chip.classList.toggle('ligado', !!turboDePe);
  chip.innerHTML = `<span class="carga">⚡ <b>${energia.carga || 0}</b></span>`
    + `<span class="turbo">◆ <b>${turboDePe ? 'ON' : (energia.turbo || 0)}</b></span>`;
}

async function atualizarEnergia() {
  const e = await api.buscarEnergia();
  if (!e) return;
  energia = e;
  pintarEnergia();
}

// Ligação defensiva: um elemento que falte no HTML não pode derrubar o app
// inteiro, como derrubou em 13/11 quando este chip não existia na página.
const aoTocarEnergia = async () => {
  if (!energia) return;
  const turboDePe = energia.turbo_ate && new Date(energia.turbo_ate) > new Date();
  if (turboDePe) {
    const falta = Math.max(0, Math.round((new Date(energia.turbo_ate) - Date.now()) / 60000));
    await ask({
      title: 'Turbo de pé',
      text: `Toda conquista fechada nos próximos ${falta} min rende o dobro de ouro.`,
      ok: 'FECHAR',
    });
    return;
  }
  const sim = await ask({
    title: 'Mochila de energia',
    numeros: [[String(energia.carga || 0), 'carga'], [String(energia.turbo || 0), 'cápsulas']],
    text: 'A CARGA é munição: serve para tomar território do inimigo.\n\n'
      + 'A CÁPSULA liga o TURBO por 45 minutos, e toda conquista fechada nesse tempo rende o dobro de ouro.',
    ok: (energia.turbo || 0) > 0 ? 'LIGAR O TURBO' : 'FECHAR',
    cancel: (energia.turbo || 0) > 0 ? 'AGORA NÃO' : null,
  });
  if (!sim || !(energia.turbo > 0)) return;
  try {
    const r = await api.usarTurbo();
    if (r && r.ok) {
      energia = r.energia; pintarEnergia(); tremer(VIB.conquista);
      toast('Turbo ligado por 45 minutos. Ouro em dobro.', 5000);
    } else toast('Não deu para ligar o turbo.', 4000);
  } catch (e) { toast(e.message, 4000); }
};
if ($('energia')) $('energia').onclick = aoTocarEnergia;

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
    const foto = d && d.foto
      ? `<span class="foto-mini" data-foto="${d.foto}"></span>`
      : '<span class="foto-vazia">·</span>';
    // o avatar de quem domina o pedaço, pedido do Miguel em 13/11
    const av = d && d.modelo
      ? `<span class="av">${avatarSVG({
        modelo: d.modelo,
        cor: (NEONS.find((n) => n.id === d.cor) || NEONS[0]).cor,
        faccao: props.faccao, largura: 30, sombra: false,
      })}</span>`
      : '';
    return `<li>${foto}${av}<span class="nm" data-jog="${nome}">${nome}</span>
      <span class="m2">${a > 0 ? fmtArea(a) : ''}</span><span class="pc">${pc}</span></li>`;
  }).join('');
  abrirFicha(`<h3 class="ficha-tit">${fmtArea(area)}</h3>
    <p class="ficha-sub" style="color:${f.cor}">Bloco ${f.nome}</p>
    <ul class="ficha-donos">${linhas || '<li>Território sem dono registrado.</li>'}</ul>
    <p class="nota">Toque num apelido para ver o perfil e as medalhas.</p>
    <p class="foto-nota">A foto vive enquanto o território for do time. Tomado pelo outro lado, ela some daqui e do servidor.</p>`);
  pintarFotos($('ficha-corpo'));
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
        <div class="ten">${avatarSVG({ modelo: e.modelo, cor, faccao: e.faccao, largura: 66 })}</div>
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
  }).join('') || '<p class="vazio">Nenhuma agência pontuou ainda.</p>';

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
    <span class="sh">${avatarSVG({ modelo: j.modelo, cor: (NEONS.find((n) => n.id === j.cor) || NEONS[0]).cor, faccao: j.faccao, largura: 24, sombra: false })}</span>
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
  // Centralizar também desgira a tela e devolve a inclinação certa.
  if (mapReady && lastFix) {
    map.easeTo({
      center: [lastFix.lng, lastFix.lat],
      zoom: Math.max(map.getZoom(), CAMERA.zoomPadrao),
      bearing: 0,
      pitch: session.state === 'idle' ? CAMERA.pitchPasseio : CAMERA.pitchRota,
      duration: 700,
    });
  }
};
$('btn-rank').onclick = abrirRanking;
$('painel-fechar').onclick = () => { $('painel').hidden = true; };
$('painel').addEventListener('click', (e) => { if (e.target.id === 'painel') $('painel').hidden = true; });

/* ===================== GPS ===================== */
let firstFix = true;
const detector = new DetectorDeMovimento();

function conferirMovimento(p) {
  const r = detector.ver(p);
  if (!marker) return;
  const el = marker.getElement();
  el.classList.toggle('andando', r.andando);
  el.classList.toggle('virado', r.olhandoPara === -1);
}

function onFix(p) {
  lastFix = p;
  conferirMovimento(p);
  if (mapReady && (firstFix || followMe)) {
    map.easeTo({ center: [p.lng, p.lat], zoom: firstFix ? CAMERA.zoomPadrao : map.getZoom(), duration: firstFix ? 0 : 600 });
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
  desenharLatinhas();
  atualizarSpawns();
  aplicarCamera();
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
  aplicarCamera();
};

ui.finish.onclick = async () => {
  if (!session.canFinish) return;
  // Evita a frustração de caminhar, finalizar e só então ouvir um não.
  if (session.distanceM < CONFIG.MIN_ROUTE_M) {
    const segue = await ask({
      title: 'O servidor vai recusar',
      text: `O percurso tem ${Math.round(session.distanceM)} m e o mínimo é ${CONFIG.MIN_ROUTE_M} m.\n\n`
        + 'Dê mais uma volta e volte ao ponto inicial: a rota continua aberta e nada se perde.',
      ok: 'CONTINUAR CAMINHANDO', cancel: 'FINALIZAR MESMO ASSIM',
    });
    if (segue) return;
  }
  const payload = session.finish(SIM ? simT : Date.now());
  payload.sessao = sessaoServidor;
  sessaoServidor = null;
  save();
  releaseScreen();
  render();
  aplicarCamera();

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
      text: resumo
        + (tomadas.length ? `\n\nVocê tirou território de: ${tomadas.join(', ')}` : '')
        + (r.faltou_carga
          ? '\n\nTinha território inimigo dentro do seu circuito, mas você estava sem CARGA. '
            + 'Ele ficou protegido e você levou só o terreno neutro. Pegue latinhas pela cidade para ter munição.'
          : (r.carga != null && tomadas.length ? `\n\nGastou 1 de carga. Restam ${r.carga}.` : '')),
      ok: 'VOLTAR AO MAPA',
      extra: temFoto ? {
        rotulo: 'FOTO DO LUGAR',
        acao: tirarFotoDoTerritorio,
      } : null,
      extra2: {
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
    await atualizarEnergia();
    atualizarSpawns(true);
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
  atualizarEnergia();
  // A foto só aparece quando o servidor já tem a parte dela aplicada.
  api.ultimaConquista().then((u) => { temFoto = u !== null; }).catch(() => { temFoto = false; });
  api.faxinaFotos();
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
    atualizarEnergia();
    atualizarSpawns(true);
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
