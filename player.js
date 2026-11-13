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

// O tênis saiu do jogo em 13/11/2026. Quem tinha modelo antigo salvo no
// aparelho ou no banco vira a roupa correspondente, sem perder nada.
export const ROUPA_ANTIGA = { runner: 'basico', hitop: 'corredor', chunky: 'jaqueta' };

export const ROUPAS = [
  { id: 'basico',   nome: 'Moletom',        desc: 'Capuz caído e cordão' },
  { id: 'corredor', nome: 'Corta-vento',    desc: 'Justo, com faixa refletiva' },
  { id: 'jaqueta',  nome: 'Jaqueta Tática', desc: 'Gola alta e ombreiras' },
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
const PELE = '#c99a73', PELE_S = '#a97e5c';
const CABELO = '#171f2a';
const CALCA = '#202b39', CALCA_S = '#19222e';
const SAPATO = '#0d141c';

// Visto de cima e de frente, uns 50 graus: a cabeça cobre parte dos ombros,
// os pés aparecem curtos. Proporção de boneco, para ler bem pequeno no mapa.
function tronco(id, cor, fac) {
  const comum = `
    <path d="M44 128h14v8H42l2-8z" fill="${SAPATO}"/>
    <path d="M62 128h14l2 8H62v-8z" fill="${SAPATO}"/>
    <path d="M42 133h16v3H42zM62 133h16v3H62z" fill="${cor}" opacity=".95"/>
    <path d="M47 100h11l-1 29H46l1-29z" fill="${CALCA}"/>
    <path d="M62 100h11l1 29H63l-1-29z" fill="${CALCA_S}"/>`;

  if (id === 'corredor') {
    return comum + `
      <path d="M41 66h38l4 34q-23 6-46 0l4-34z" fill="#18222e"/>
      <path d="M41 66h38l1 7H40l1-7z" fill="${cor}"/>
      <path d="M39 86h42v5H39z" fill="${cor}" opacity=".55"/>
      <path d="M60 66v34" stroke="${fac}" stroke-width="2" opacity=".9"/>
      <path d="M41 66l-9 5-5 26 10 4 8-31z" fill="#18222e"/>
      <path d="M79 66l9 5 5 26-10 4-8-31z" fill="#18222e"/>
      <path d="M28 95l9 3-1 6-10-3z" fill="${PELE}"/>
      <path d="M92 95l-9 3 1 6 10-3z" fill="${PELE_S}"/>`;
  }
  if (id === 'jaqueta') {
    return comum + `
      <path d="M36 68h48l5 33q-29 7-58 0l5-33z" fill="#1b2633"/>
      <path d="M51 67h18l-3 11H54l-3-11z" fill="${cor}"/>
      <path d="M51 67h18l-1 4H52l-1-4z" fill="#000" opacity=".25"/>
      <path d="M60 72v29" stroke="${cor}" stroke-width="2.6" opacity=".95"/>
      <path d="M36 68l-11 6-5 25 11 4 9-30z" fill="#1b2633"/>
      <path d="M84 68l11 6 5 25-11 4-9-30z" fill="#1b2633"/>
      <path d="M30 70h14l2 9H28z" fill="${fac}" opacity=".85"/>
      <path d="M76 70h14l2 9H74z" fill="${fac}" opacity=".85"/>
      <path d="M21 97l10 3-1 6-11-3z" fill="${PELE}"/>
      <path d="M99 97l-10 3 1 6 11-3z" fill="${PELE_S}"/>`;
  }
  return comum + `
    <path d="M40 67h40l4 34q-24 7-48 0l4-34z" fill="#16202b"/>
    <path d="M40 67q20 12 40 0l-3-5q-17 9-34 0z" fill="#1e2a38"/>
    <path d="M56 70v6M64 70v6" stroke="${cor}" stroke-width="2" stroke-linecap="round"/>
    <path d="M60 78v23" stroke="${fac}" stroke-width="2" opacity=".7"/>
    <path d="M44 100h32v6H44z" fill="#1e2a38"/>
    <path d="M40 67l-10 5-5 26 10 4 9-31z" fill="#16202b"/>
    <path d="M80 67l10 5 5 26-10 4-9-31z" fill="#16202b"/>
    <path d="M26 96l9 3-1 6-10-3z" fill="${PELE}"/>
    <path d="M94 96l-9 3 1 6 10-3z" fill="${PELE_S}"/>`;
}

// Aceita tanto `roupa` quanto `modelo` (o nome da coluna no banco), e a
// facção tanto pelo id ('meridiano') quanto por uma cor pronta.
export function avatarSVG({
  roupa, modelo, cor = '#22e3ff', faccao = 'meridiano', largura = 90, sombra = true,
} = {}) {
  let peca = roupa || modelo;
  if (ROUPA_ANTIGA[peca]) peca = ROUPA_ANTIGA[peca];
  if (!ROUPAS.some((r) => r.id === peca)) peca = 'basico';
  const corFac = FACCOES[faccao] ? FACCOES[faccao].cor : faccao;
  return montarAvatar(peca, cor, corFac, largura, sombra);
}

function montarAvatar(roupa, cor, faccao, largura, sombra) {
  return `<svg viewBox="0 0 120 150" width="${largura}" height="${largura * 150 / 120}" class="avatar">
    ${sombra ? '<ellipse cx="60" cy="139" rx="27" ry="7" fill="#000" opacity=".5"/>' : ''}
    ${tronco(roupa, cor, faccao)}
    <path d="M54 56h12v10H54z" fill="${PELE_S}"/>
    <ellipse cx="60" cy="41" rx="19.5" ry="20" fill="${PELE}"/>
    <path d="M40.5 41q0-20 19.5-20T79.5 41q-3-7-19.5-7T40.5 41z" fill="${CABELO}"/>
    <path d="M41 25q19-13 38 0 2 8 .5 13-4-9-19.5-9T41.5 38Q40 33 41 25z" fill="${faccao}"/>
    <path d="M38 36h44q1 4-1 5H39q-2-1-1-5z" fill="${faccao}"/>
    <path d="M38 36h44q1 4-1 5H39q-2-1-1-5z" fill="#000" opacity=".2"/>
    <circle cx="53" cy="47" r="2.4" fill="#0b1118"/>
    <circle cx="67" cy="47" r="2.4" fill="#0b1118"/>
    <path d="M55 54q5 3.5 10 0" stroke="#0b1118" stroke-width="1.9" fill="none" stroke-linecap="round"/>
  </svg>`;
}

const vazio = { apelido: '', faccao: 'meridiano', modelo: 'basico', cor: 'ciano', cenario: 'noturno' };

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
    if (ROUPA_ANTIGA[perfil.modelo]) perfil.modelo = ROUPA_ANTIGA[perfil.modelo];
    if (!ROUPAS.some((r) => r.id === perfil.modelo)) perfil.modelo = vazio.modelo;
    if (!NEONS.some((n) => n.id === perfil.cor)) perfil.cor = vazio.cor;
    if (!CENARIOS.some((c) => c.id === perfil.cenario)) perfil.cenario = vazio.cenario;
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
export const GRATIS = ['roupa:basico', 'cor:ciano', 'cor:lima', 'cenario:noturno'];

// Preços espelham a tabela `loja` do servidor; aqui servem para mostrar na tela.
export const PRECOS = {
  'cor:roxo': 150,
  'cor:violeta': 150,
  'cor:laranja': 150,
  'cor:coral': 150,
  'roupa:corredor': 600,
  'roupa:jaqueta': 900,
};

export const temItem = (carteira, item) =>
  GRATIS.includes(item) || Boolean(carteira && (carteira.itens || []).includes(item));

export const precoDe = (item) => {
  if (PRECOS[item]) return PRECOS[item];
  const c = CENARIOS.find((x) => `cenario:${x.id}` === item);
  return c ? c.custo : 0;
};

export const fmtOuro = (n) => Math.floor(Number(n) || 0).toLocaleString('pt-BR');

/* ===================== cenários (fundo do tênis) ===================== */
export const CENARIOS = [
  { id: 'noturno',   nome: 'Noite Urbana',       custo: 0 },
  { id: 'cerrado',   nome: 'Cerrado',            custo: 250 },
  { id: 'chuva',     nome: 'Chuva Neon',         custo: 350 },
  { id: 'sintetico', nome: 'Deserto Sintético',  custo: 450 },
  { id: 'orbita',    nome: 'Órbita',             custo: 600 },
];

const estrelas = (lista) => lista
  .map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`).join('');

const CENAS = {
  noturno: (c) => `
    <rect width="200" height="200" fill="url(#ceu)"/>
    ${estrelas([[38, 40, 1.3, .8], [62, 28, 1, .6], [96, 46, 1.5, .7], [150, 34, 1.1, .7], [168, 62, 1.3, .5], [24, 74, 1, .5], [126, 22, 1, .6]])}
    <circle cx="150" cy="52" r="17" fill="#dfe9f5" opacity=".9"/>
    <circle cx="143" cy="47" r="14" fill="url(#ceu)" opacity=".95"/>
    <g fill="#0c1826">
      <rect x="12" y="104" width="22" height="60"/><rect x="36" y="88" width="16" height="76"/>
      <rect x="55" y="116" width="26" height="48"/><rect x="84" y="78" width="20" height="86"/>
      <rect x="107" y="100" width="15" height="64"/><rect x="125" y="112" width="28" height="52"/>
      <rect x="156" y="92" width="18" height="72"/><rect x="178" y="118" width="14" height="46"/>
    </g>
    <g fill="${c}" opacity=".85">
      <rect x="17" y="112" width="3" height="4"/><rect x="25" y="124" width="3" height="4"/>
      <rect x="41" y="98" width="3" height="4"/><rect x="45" y="118" width="3" height="4"/>
      <rect x="62" y="126" width="3" height="4"/><rect x="89" y="88" width="3" height="4"/>
      <rect x="95" y="110" width="3" height="4"/><rect x="112" y="116" width="3" height="4"/>
      <rect x="133" y="124" width="3" height="4"/><rect x="161" y="102" width="3" height="4"/>
      <rect x="166" y="130" width="3" height="4"/><rect x="182" y="130" width="3" height="4"/>
    </g>
    <rect x="0" y="162" width="200" height="4" fill="${c}" opacity=".5"/>
    <rect x="0" y="166" width="200" height="40" fill="#060b12"/>`,

  cerrado: (c) => `
    <rect width="200" height="200" fill="url(#poente)"/>
    <circle cx="104" cy="118" r="34" fill="#ffd35e" opacity=".95"/>
    <circle cx="104" cy="118" r="46" fill="#ff8a1f" opacity=".2"/>
    <path d="M0,132 L30,120 L58,130 L86,116 L120,128 L152,114 L200,126 L200,146 L0,146 Z" fill="#5b2a2f"/>
    <path d="M0,146 L200,146 L200,200 L0,200 Z" fill="#7a3a2a"/>
    <path d="M0,152 C40,158 80,150 120,156 C150,160 180,154 200,158" stroke="${c}" stroke-width="1.6" fill="none" opacity=".45"/>
    <g fill="#2a1418">
      <rect x="146" y="118" width="5" height="44"/>
      <path d="M148.5,116 C132,116 124,106 128,98 C132,90 146,88 148.5,94 C151,88 165,90 169,98 C173,106 165,116 148.5,116 Z"/>
      <rect x="44" y="134" width="3" height="26"/>
      <path d="M45.5,132 C35,132 30,126 32,120 C35,114 44,113 45.5,117 C47,113 56,114 59,120 C61,126 56,132 45.5,132 Z"/>
    </g>`,

  chuva: (c) => `
    <rect width="200" height="200" fill="url(#molhado)"/>
    <g fill="#0a1a22">
      <rect x="6" y="54" width="34" height="92"/><rect x="48" y="74" width="26" height="72"/>
      <rect x="128" y="62" width="30" height="84"/><rect x="166" y="86" width="28" height="60"/>
    </g>
    <g fill="${c}" opacity=".9">
      <rect x="12" y="70" width="22" height="5"/><rect x="12" y="86" width="14" height="4"/>
      <rect x="134" y="78" width="18" height="5"/><rect x="172" y="100" width="16" height="4"/>
    </g>
    <g stroke="#9fd8ff" stroke-width="1.1" opacity=".5">
      <path d="M20,0 L8,40"/><path d="M52,-6 L40,38"/><path d="M86,2 L74,44"/><path d="M118,-4 L106,40"/>
      <path d="M150,4 L138,46"/><path d="M182,-2 L170,42"/><path d="M36,58 L26,92"/><path d="M100,60 L90,96"/>
      <path d="M160,56 L150,92"/><path d="M68,100 L60,128"/><path d="M196,64 L186,98"/>
    </g>
    <rect x="0" y="146" width="200" height="54" fill="#061218"/>
    <g opacity=".55">
      <rect x="10" y="152" width="26" height="3" fill="${c}"/><rect x="130" y="160" width="24" height="3" fill="${c}"/>
      <rect x="60" y="172" width="34" height="3" fill="#9fd8ff"/><rect x="150" y="182" width="30" height="3" fill="${c}"/>
    </g>
    <rect x="0" y="144" width="200" height="3" fill="${c}" opacity=".7"/>`,

  sintetico: (c) => `
    <rect width="200" height="200" fill="url(#retro)"/>
    ${estrelas([[28, 26, 1.2, .7], [168, 30, 1.2, .6], [112, 18, 1, .5]])}
    <circle cx="100" cy="92" r="40" fill="url(#astro)"/>
    <g fill="#1b0c2a" opacity=".85">
      <rect x="56" y="96" width="88" height="3"/><rect x="56" y="104" width="88" height="4"/>
      <rect x="58" y="113" width="84" height="5"/><rect x="62" y="123" width="76" height="6"/>
    </g>
    <path d="M0,130 L34,104 L58,130 L84,96 L112,130 L140,108 L168,130 L200,112 L200,134 L0,134 Z" fill="#2a1240"/>
    <rect x="0" y="132" width="200" height="68" fill="#120722"/>
    <g stroke="${c}" stroke-width="1.1" opacity=".65">
      <path d="M0,146 L200,146"/><path d="M0,158 L200,158"/><path d="M0,174 L200,174"/><path d="M0,194 L200,194"/>
      <path d="M100,132 L100,200"/><path d="M100,132 L58,200"/><path d="M100,132 L142,200"/>
      <path d="M100,132 L16,200"/><path d="M100,132 L184,200"/><path d="M100,132 L-28,200"/><path d="M100,132 L228,200"/>
    </g>
    <rect x="0" y="130" width="200" height="3" fill="${c}" opacity=".9"/>`,

  orbita: (c) => `
    <rect width="200" height="200" fill="url(#espaco)"/>
    ${estrelas([[24, 28, 1.4, .9], [58, 52, 1, .6], [92, 24, 1.2, .7], [132, 44, 1, .5], [176, 24, 1.5, .8],
      [16, 86, 1, .5], [186, 74, 1.2, .6], [46, 112, 1, .4], [164, 118, 1.1, .5], [112, 70, 1, .5]])}
    <circle cx="150" cy="150" r="52" fill="url(#planeta)"/>
    <path d="M150,150 m-52,0 a52,52 0 0 1 104,0" fill="none" stroke="${c}" stroke-width="1.4" opacity=".5"/>
    <ellipse cx="150" cy="150" rx="80" ry="20" fill="none" stroke="${c}" stroke-width="3" opacity=".75"
      transform="rotate(-18 150 150)"/>
    <ellipse cx="150" cy="150" rx="68" ry="15" fill="none" stroke="#ffffff" stroke-width="1.2" opacity=".35"
      transform="rotate(-18 150 150)"/>
    <circle cx="48" cy="64" r="13" fill="#39445a"/>
    <circle cx="44" cy="60" r="3" fill="#2a3346"/><circle cx="53" cy="68" r="2" fill="#2a3346"/>`,
};

export function cenarioSVG({ id = 'noturno', cor = '#22e3ff', largura = 300 } = {}) {
  const n = `c${++uid}`;
  const cena = (CENAS[id] || CENAS.noturno)(cor);
  return `<svg viewBox="0 0 200 200" width="${largura}" height="${largura}" aria-hidden="true">
  <defs>
    <clipPath id="rec${n}"><circle cx="100" cy="100" r="99"/></clipPath>
    <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#070d18"/><stop offset="1" stop-color="#2a1a44"/></linearGradient>
    <linearGradient id="poente" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b1136"/><stop offset=".55" stop-color="#b8465a"/><stop offset="1" stop-color="#ff9a3c"/></linearGradient>
    <linearGradient id="molhado" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05171f"/><stop offset="1" stop-color="#0b2f3d"/></linearGradient>
    <linearGradient id="retro" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#140826"/><stop offset="1" stop-color="#43145c"/></linearGradient>
    <linearGradient id="astro" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe66b"/><stop offset=".5" stop-color="#ff7a3d"/><stop offset="1" stop-color="#ff2e87"/></linearGradient>
    <linearGradient id="espaco" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#03060f"/><stop offset="1" stop-color="#121a33"/></linearGradient>
    <radialGradient id="planeta" cx=".35" cy=".3">
      <stop offset="0" stop-color="#6f86d6"/><stop offset=".6" stop-color="#3b4b8f"/><stop offset="1" stop-color="#141c3a"/></radialGradient>
  </defs>
  <g clip-path="url(#rec${n})">${cena}</g>
  <circle cx="100" cy="100" r="98" fill="none" stroke="${cor}" stroke-width="2" opacity=".55"/>
</svg>`;
}
