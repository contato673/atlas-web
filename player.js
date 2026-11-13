// ATLAS — identidade do jogador e desenho do tênis (avatar).
// Enquanto não existe servidor, o perfil vive apenas neste aparelho.

export const PLAYER_KEY = 'atlas.player.v1';

// Os ids meridiano/azimute ficaram: sao eles que estao gravados no perfil, no
// territorio e no placar. Trocar id exigiria migrar as tres coisas, e quem o
// jogador le e o `nome`. Entao o nome mudou e o id nao.
export const FACCOES = {
  meridiano: { nome: 'AURORA', cor: '#2f7bff', clara: '#8fbaff', lema: 'Acende e mantém', corNome: 'Azul' },
  azimute: { nome: 'ZÊNITE', cor: '#22d97a', clara: '#8cf0bd', lema: 'Pressão constante', corNome: 'Verde' },
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

const P = {
  peleL: '#e2b78f', pele: '#c89a72', peleS: '#9e7249',
  panoL: '#2d3f54', pano: '#1f2d3d', panoS: '#121b26',
  calcaL: '#2a384a', calca: '#1d2836', calcaS: '#121a24',
  sapatoL: '#1a2531', sapato: '#0e151e',
  cabeloL: '#2a3747', cabelo: '#161e29',
  linha: '#0a0f16',
};

function cabeca(fac, cor) {
  return `
    <g>
      <path d="M53 57h14v9H53z" fill="${P.peleS}"/>
      <path d="M53 57h6v9h-6z" fill="${P.pele}"/>
      <ellipse cx="60" cy="40" rx="19" ry="19.5" fill="${P.pele}"/>
      <path d="M60 20.5a19 19.5 0 0 1 0 39 19 19.5 0 0 0 0-39z" fill="${P.peleS}" opacity=".55"/>
      <ellipse cx="52" cy="38" rx="9" ry="12" fill="${P.peleL}" opacity=".45"/>
      <path d="M41 45q-3.5 0-3.5-4.5T41 36z" fill="${P.pele}"/>
      <path d="M79 45q3.5 0 3.5-4.5T79 36z" fill="${P.peleS}"/>
      <path d="M41.2 38q0-18 18.8-18T79 38q-2.5-7.5-18.9-7.5T41.2 38z" fill="${P.cabelo}"/>
      <path d="M44 24q14-8 28 0-9-4.5-14-4.5T44 24z" fill="${P.cabeloL}" opacity=".7"/>
      <path d="M42 25.5q18-12.5 36 0 2 7.5.6 12.5-4-8.5-18.6-8.5T41.4 38Q40 33 42 25.5z" fill="${fac}"/>
      <path d="M60 21.2q9.5 0 18 4.3 2 7.5.6 12.5-3.4-7.2-14.6-8.3z" fill="#000" opacity=".22"/>
      <path d="M44 24.5q7-4 16-4" stroke="#fff" stroke-width="2" opacity=".28" fill="none" stroke-linecap="round"/>
      <path d="M38.5 36.5h43q1 4-1.2 5H39.7q-2.2-1-1.2-5z" fill="${fac}"/>
      <path d="M38.5 36.5h43q1 4-1.2 5H39.7q-2.2-1-1.2-5z" fill="#000" opacity=".3"/>
      <path d="M38.5 36.5h22q.4 4-.6 5H39.7q-2.2-1-1.2-5z" fill="#fff" opacity=".12"/>
      <ellipse cx="52.5" cy="46.5" rx="2.5" ry="2.7" fill="${P.linha}"/>
      <ellipse cx="66.5" cy="46.5" rx="2.3" ry="2.6" fill="${P.linha}"/>
      <circle cx="53.3" cy="45.7" r=".8" fill="#fff" opacity=".85"/>
      <path d="M48.5 42q3-1.6 6-.4M64 41.6q3-1.2 6 .4" stroke="${P.cabelo}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      <path d="M58.5 50.5q1.5 1.5 3 0" stroke="${P.peleS}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M55 53.5q5 4 10.5.5" stroke="${P.linha}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M79 47.5q2.5-4 0-9" stroke="${cor}" stroke-width="1.6" fill="none" opacity=".75" stroke-linecap="round"/>
    </g>`;
}

function pernas(cor) {
  return `
    <path d="M46 99h12l-1.5 30H45l1-30z" fill="${P.calca}"/>
    <path d="M46 99h5l-1 30h-5l1-30z" fill="${P.calcaL}"/>
    <path d="M62 99h12l1.5 30H63.5L62 99z" fill="${P.calcaS}"/>
    <path d="M40.5 126h17.5l.6 8H39.2q-1.2-4 1.3-8z" fill="${P.sapato}"/>
    <path d="M40.5 126h8l.3 8h-9.6q-1.2-4 1.3-8z" fill="${P.sapatoL}"/>
    <path d="M63.4 126H81q2.5 4 1.3 8H62.8z" fill="${P.sapato}"/>
    <path d="M39.2 131h19.5l.1 3H39q-.6-1.6.2-3zM62.9 131h19.3q.8 1.4.2 3H63z" fill="${cor}"/>`;
}

function roupaDe(id, cor, fac) {
  // Silhueta estreita: tronco de 42 a 78, mangas coladas de 33 a 42 e de 78 a 87.
  // Ombro arredondado, cintura mais fina que o ombro, mão na ponta da manga.
  const manga = `
    <path d="M42 71q-7 1-9 6l-4 22q5 3 11 3l6-28z" fill="${P.panoL}"/>
    <path d="M78 71q7 1 9 6l4 22q-5 3-11 3l-6-28z" fill="${P.panoS}"/>
    <path d="M29 99q5 3 11 3l-1.5 7q-6-.5-11-3.5z" fill="${P.pele}"/>
    <path d="M91 99q-5 3-11 3l1.5 7q6-.5 11-3.5z" fill="${P.peleS}"/>`;

  if (id === 'corredor') {
    return `
      <path d="M48 66h24q6 1 6.5 6l1.5 29q-18 5-36 0l1.5-29q.5-5 6.5-6z" fill="${P.pano}"/>
      <path d="M48 66h10l-2 36q-5-.4-9.5-1l1.5-29q.5-5 6.5-6z" fill="${P.panoL}"/>
      <path d="M68 66h4q6 1 6.5 6l1.5 29q-4.5 1.2-9.5 1.8z" fill="${P.panoS}"/>
      <path d="M44.6 73h31v5h-31z" fill="${cor}"/>
      <path d="M44.6 73h9v5h-9z" fill="#fff" opacity=".3"/>
      <path d="M43.6 88h33.6l.3 4.2H43.3z" fill="${cor}" opacity=".55"/>
      <path d="M60 66v36" stroke="${fac}" stroke-width="1.8" opacity=".8"/>
      ${manga}`;
  }
  if (id === 'jaqueta') {
    return `
      <path d="M46 66h28q7 1 7.5 7l1.5 29q-23 6-46 0L38.5 73q.5-6 7.5-7z" fill="${P.pano}"/>
      <path d="M46 66h10l-2.5 37q-5.5-.5-11-1.5L38.5 73q.5-6 7.5-7z" fill="${P.panoL}"/>
      <path d="M70 66h4q7 1 7.5 7l1.5 29q-5.5 1.4-12 2.2z" fill="${P.panoS}"/>
      <path d="M52 64h16l-3 12H55z" fill="${cor}"/>
      <path d="M52 64h6l-2 12h-3z" fill="#fff" opacity=".3"/>
      <path d="M52 64h16l-.8 3H52.8z" fill="#000" opacity=".3"/>
      <path d="M60 76v26" stroke="${cor}" stroke-width="2.2" opacity=".95"/>
      <path d="M40 68q7-3 13-3l-1 9q-6 0-13 2z" fill="${fac}"/>
      <path d="M40 68q5-2 9-2.6l-.7 8.6q-4.6.3-8.6 1.4z" fill="#fff" opacity=".18"/>
      <path d="M80 68q-7-3-13-3l1 9q6 0 13 2z" fill="${fac}"/>
      <path d="M80 68q-7-3-13-3l.3 2.4q6 .2 12 2.4z" fill="#000" opacity=".3"/>
      ${manga}`;
  }
  return `
    <path d="M47 66h26q6.5 1 7 6.5L82 102q-22 6-44 0l2-29.5q.5-5.5 7-6.5z" fill="${P.pano}"/>
    <path d="M47 66h10l-2.5 37q-5.5-.5-11-1.5L38 72.5q.5-5.5 7-6.5z" fill="${P.panoL}"/>
    <path d="M69 66h4q6.5 1 7 6.5L82 102q-5.5 1.4-12 2.2z" fill="${P.panoS}"/>
    <path d="M44 66q16 10 32 0l-2.5-4.5q-13.5 7.5-27 0z" fill="${P.panoL}"/>
    <path d="M60 66q8.5-1.6 16-4.5L73.5 57q-6.5 3.6-13.5 5z" fill="${P.panoS}" opacity=".85"/>
    <path d="M56 69v6.5M64 69v6" stroke="${cor}" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M60 77v25" stroke="${fac}" stroke-width="1.8" opacity=".6"/>
    <path d="M45 99h30l.4 5H44.6z" fill="${P.panoL}"/>
    ${manga}`;
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

// Contador de ids para os gradientes: dois SVGs na mesma página não podem
// repetir id, senão um rouba o gradiente do outro. Era usado também pela logo
// e pelos cenários, e foi apagado sem querer junto com a geometria do tênis.
let uid = 0;
let semente = 0;
function montarAvatar(roupa, cor, faccao, largura, sombra) {
  const id = `a${(semente += 1)}`;
  return `<svg viewBox="0 0 120 150" width="${largura}" height="${largura * 150 / 120}" class="avatar">
    <defs>
      <radialGradient id="s${id}" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#000" stop-opacity=".6"/>
        <stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    ${sombra ? `<ellipse cx="60" cy="137" rx="30" ry="9" fill="url(#s${id})"/>` : ''}
    ${pernas(cor)}
    ${roupaDe(roupa, cor, faccao)}
    ${cabeca(faccao, cor)}
    <path d="M78 71q7 1 9 6l4 22" fill="none" stroke="${cor}" stroke-width="1.4" opacity=".5" stroke-linecap="round"/>
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
