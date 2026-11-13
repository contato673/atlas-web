// ATLAS — identidade do jogador e desenho do tênis (avatar).
// Enquanto não existe servidor, o perfil vive apenas neste aparelho.

export const PLAYER_KEY = 'atlas.player.v1';

export const FACCOES = {
  meridiano: { nome: 'MERIDIANO', cor: '#2f7bff', clara: '#8fbaff', lema: 'Avanço calculado', corNome: 'Azul' },
  azimute: { nome: 'AZIMUTE', cor: '#22d97a', clara: '#8cf0bd', lema: 'Pressão constante', corNome: 'Verde' },
};

// Perfis criados antes dos nomes das facções.
const FACCAO_ANTIGA = { azul: 'meridiano', vermelha: 'azimute', verde: 'azimute' };

export const NEONS = [
  { id: 'ciano', nome: 'Ciano', cor: '#22e3ff' },
  { id: 'lima', nome: 'Lima', cor: '#c6ff3d' },
  { id: 'roxo', nome: 'Roxo', cor: '#a855ff' },
  { id: 'violeta', nome: 'Violeta', cor: '#7b5bff' },
  { id: 'laranja', nome: 'Laranja', cor: '#ff8a1f' },
  { id: 'coral', nome: 'Coral', cor: '#ff5a6e' },
];

export const MODELOS = [
  { id: 'runner', nome: 'Runner', desc: 'Perfil baixo e leve' },
  { id: 'hitop', nome: 'Cano alto', desc: 'Silhueta de quadra' },
  { id: 'chunky', nome: 'Chunky', desc: 'Sola alta e marcante' },
];

// Geometria de cada modelo, em um quadro de 64 x 40 (perfil, virado para a direita).
const FORMAS = {
  runner: {
    contorno: 'M8.6,33.9 C9.6,33.9 8.2,32.6 8.2,30.6 L8.2,16 C8.2,12.2 10,10.6 13.4,10.2 L18.6,9.6 C21,9.4 21.8,10.8 21.8,13 L22.6,17.4 C28,17.9 36,18.9 44,20.4 C50,21.5 55,22.6 58,24.6 C60.8,26.4 62,28.6 60.6,30.8 C59,32.8 55.6,33.8 51,33.9 Z',
    sola: 'M8.2,28.6 C20,30.2 40,30 61.3,27.4 C62,28.9 61.6,29.9 60.6,30.8 C59,32.8 55.6,33.8 51,33.9 L12.5,33.9 C9.6,33.9 8.2,32.6 8.2,30.6 Z',
    entressola: 'M8.3,28.8 C20,30.4 40,30.2 61,27.6',
    colarinho: 'M15.8,10.3 C18.6,9.7 21,10.2 21.8,12.3 C20.2,13.2 17.6,13.6 15.8,13 C14.5,12.5 14.5,10.6 15.8,10.3 Z',
    lingua: 'M21.9,12.9 L25,11.8 L26.2,17 L22.7,17.5 Z',
    painel: 'M13.8,25.6 C20.4,24.4 27.4,22.2 33.8,20.2 C39,18.7 44.4,18.7 48,20',
    cadarcos: [[25, 13.3, 26.8, 16.9], [27.9, 14.3, 29.5, 17.7], [30.7, 15.3, 32.1, 18.5]],
    calcanhar: 'M8.9,12.4 L11.3,12.4 L11.3,20 L8.9,20 Z',
  },
  hitop: {
    contorno: 'M8.6,33.9 C9.6,33.9 8.2,32.6 8.2,30.6 L8.2,9 C8.2,5.2 10.2,3.6 13.8,3.5 L18.8,3.5 C21.3,3.5 22.1,5.2 22.1,7.6 L22.1,13.2 L22.7,17.5 C28,18 36,19 44,20.5 C50,21.6 55,22.7 58,24.7 C60.8,26.5 62,28.6 60.6,30.8 C59,32.8 55.6,33.8 51,33.9 Z',
    sola: 'M8.2,28.6 C20,30.2 40,30 61.3,27.4 C62,28.9 61.6,29.9 60.6,30.8 C59,32.8 55.6,33.8 51,33.9 L12.5,33.9 C9.6,33.9 8.2,32.6 8.2,30.6 Z',
    entressola: 'M8.3,28.8 C20,30.4 40,30.2 61,27.6',
    colarinho: 'M9.6,5 C13,3.3 18.4,3.3 21.6,5 C19.4,7 11.8,7.2 9.6,5 Z',
    lingua: 'M22.2,7.8 L25.2,6.7 L26.2,16.8 L22.7,17.4 Z',
    painel: 'M13.8,25.6 C20.4,24.4 27.4,22.2 33.8,20.2 C39,18.7 44.4,18.7 48,20',
    cadarcos: [[12.4, 9, 21.7, 9.4], [12.4, 12.6, 21.9, 13], [12.8, 16.2, 22.4, 16.4]],
    calcanhar: 'M8.9,19 L11.3,19 L11.3,25.6 L8.9,25.6 Z',
  },
  chunky: {
    contorno: 'M8,34.9 C8.4,34.9 6.4,33.4 6.4,30.6 L6.4,14 C6.4,10.2 8.4,8.6 12,8.2 L18.2,7.5 C20.8,7.3 21.9,8.8 21.9,11.2 L22.7,15.6 C28,16.1 36,17.1 44.4,18.6 C50.4,19.7 55.6,20.6 59,22.4 C62.4,24.2 64.2,27.4 62.6,30.6 C61,33.4 56.6,34.8 51,34.9 Z',
    sola: 'M6.4,26.6 C20,28.8 42,28.6 62.4,24.6 C64.4,26.6 64.2,28.6 62.6,30.6 C61,33.4 56.6,34.8 51,34.9 L11.6,34.9 C8.4,34.9 6.4,33.4 6.4,30.6 Z',
    entressola: 'M6.5,26.8 C20,29 42,28.8 62.2,24.8',
    colarinho: 'M15.6,8.2 C18.6,7.6 21.1,8.1 21.9,10.4 C20.2,11.4 17.4,11.8 15.6,11.2 C14.2,10.6 14.2,8.5 15.6,8.2 Z',
    lingua: 'M22,11 L25.2,9.9 L26.4,15.3 L22.8,15.8 Z',
    painel: 'M12.4,23.2 C19.4,22 26.8,19.8 33.6,17.8 C39,16.3 44.8,16.3 48.6,17.6',
    cadarcos: [[25.1, 11.4, 26.9, 15.1], [28, 12.4, 29.6, 15.9], [30.8, 13.4, 32.2, 16.7]],
    calcanhar: 'M7.2,10.4 L9.6,10.4 L9.6,18.4 L7.2,18.4 Z',
  },
};

let uid = 0;

/**
 * Desenha o tênis como SVG.
 * cor: neon do jogador (vem do perfil). faccao: 'meridiano' | 'azimute'.
 */
export function sneakerSVG({ modelo = 'runner', cor = '#22e3ff', faccao = 'meridiano', largura = 64, brilho = 1.6 } = {}) {
  const f = FORMAS[modelo] || FORMAS.runner;
  const corFaccao = (FACCOES[faccao] || FACCOES.meridiano).cor;
  const n = `s${++uid}`;
  const cadarcos = f.cadarcos
    .map(([x1, y1, x2, y2]) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${corFaccao}" stroke-width="1.5" stroke-linecap="round" opacity=".95"/>`)
    .join('');
  const calcanhar = `<path d="${f.calcanhar}" fill="${corFaccao}" opacity=".85"/>`;

  return `<svg viewBox="0 0 66 38" width="${largura}" height="${(largura * 38) / 66}" aria-hidden="true">
  <defs>
    <linearGradient id="corpo${n}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#22304260"/><stop offset="1" stop-color="#0a1018"/>
    </linearGradient>
    <linearGradient id="sola${n}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${cor}"/><stop offset="1" stop-color="${corFaccao}"/>
    </linearGradient>
    <filter id="luz${n}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="${brilho}" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#luz${n})">
    <path d="${f.contorno}" fill="url(#corpo${n})"/>
    <path d="${f.sola}" fill="url(#sola${n})" opacity=".92"/>
    <path d="${f.entressola}" fill="none" stroke="#05080c" stroke-width="1.2" opacity=".7"/>
    <path d="${f.contorno}" fill="none" stroke="${cor}" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="${f.lingua}" fill="#0a1018" stroke="${cor}" stroke-width="1.1" stroke-linejoin="round" opacity=".95"/>
    <path d="${f.colarinho}" fill="#05080c" stroke="${cor}" stroke-width="1.1" opacity=".9"/>
    ${cadarcos}
    ${calcanhar}
    <path d="${f.painel}" fill="none" stroke="${cor}" stroke-width="2.2" stroke-linecap="round" opacity=".92"/>
  </g>
</svg>`;
}

const vazio = { apelido: '', faccao: 'meridiano', modelo: 'runner', cor: 'ciano' };

export function corDoPerfil(p) {
  return (NEONS.find((n) => n.id === (p && p.cor)) || NEONS[0]).cor;
}

export function carregarPerfil() {
  try {
    const p = JSON.parse(localStorage.getItem(PLAYER_KEY));
    if (!p || !p.apelido) return null;
    const perfil = { ...vazio, ...p };
    if (FACCAO_ANTIGA[perfil.faccao]) perfil.faccao = FACCAO_ANTIGA[perfil.faccao];
    if (!FACCOES[perfil.faccao]) perfil.faccao = vazio.faccao;
    if (!NEONS.some((n) => n.id === perfil.cor)) perfil.cor = vazio.cor;
    return perfil;
  } catch { return null; }
}

export function salvarPerfil(p) {
  const { pin, ...semSegredo } = p; // o PIN fica só na lista de contas
  try { localStorage.setItem(PLAYER_KEY, JSON.stringify(semSegredo)); } catch { /* sem armazenamento */ }
}

export function perfilVazio() {
  return { ...vazio };
}

/**
 * Marca do ATLAS: o titã que sustenta o mundo e o atlas que mapeia a cidade.
 * Cúpula (o mundo) apoiada sobre um "A" atlético, dentro de moldura hexagonal.
 */
export function logoSVG({ largura = 120, cor = '#22e3ff', faccao = 'meridiano', brilho = 2 } = {}) {
  const corFac = (FACCOES[faccao] || FACCOES.meridiano).cor;
  const n = `l${++uid}`;
  return `<svg viewBox="0 0 120 124" width="${largura}" height="${(largura * 124) / 120}" aria-hidden="true">
  <defs>
    <linearGradient id="g${n}" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${cor}"/><stop offset="1" stop-color="${corFac}"/>
    </linearGradient>
    <filter id="f${n}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="${brilho}" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#f${n})" fill="none" stroke="url(#g${n})" stroke-linecap="round">
    <path d="M60,6 L107,33 L107,87 L60,114 L13,87 L13,33 Z" stroke-width="1.6" opacity=".38"/>
    <path d="M60,6 L72,13 M107,33 L107,46 M107,87 L95,94 M60,114 L48,107 M13,87 L13,74 M13,33 L25,26"
          stroke-width="3" opacity=".9"/>
    <path d="M26,52 A34,34 0 0 1 94,52" stroke-width="3.6"/>
    <path d="M60,18 A26,34 0 0 1 86,52 M60,18 A26,34 0 0 0 34,52" stroke-width="1.3" opacity=".45"/>
    <path d="M26,52 H94" stroke-width="2" opacity=".75"/>
    <path d="M37,101 L60,56 L83,101" stroke-width="9" stroke-linejoin="round"/>
    <path d="M47,85 H73" stroke-width="7"/>
    <path d="M15,64 H26 M17,73 H30 M19,82 H28" stroke-width="2.6" opacity=".6"/>
    <path d="M105,64 H94 M103,73 H90 M101,82 H92" stroke-width="2.6" opacity=".6"/>
    <path d="M104,62 H95 M102,70 H91 M100,78 H93" stroke-width="2.4" opacity=".55"/>
  </g>
</svg>`;
}

/* ===================== economia ===================== */
// O que todo jogador já começa tendo. O resto se compra com ouro.
export const GRATIS = ['modelo:runner', 'cor:ciano', 'cor:lima'];

// Preços espelham a tabela `loja` do servidor; aqui servem para mostrar na tela.
export const PRECOS = {
  'cor:roxo': 150,
  'cor:violeta': 150,
  'cor:laranja': 150,
  'cor:coral': 150,
  'modelo:hitop': 600,
  'modelo:chunky': 900,
};

export const temItem = (carteira, item) =>
  GRATIS.includes(item) || Boolean(carteira && (carteira.itens || []).includes(item));

export const precoDe = (item) => PRECOS[item] || 0;

export const fmtOuro = (n) => Math.floor(Number(n) || 0).toLocaleString('pt-BR');
