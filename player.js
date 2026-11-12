// ATLAS — identidade do jogador e desenho do tênis (avatar).
// Enquanto não existe servidor, o perfil vive apenas neste aparelho.

export const PLAYER_KEY = 'atlas.player.v1';

export const FACCOES = {
  azul: { nome: 'AZUL', cor: '#2f7bff', clara: '#8fbaff', lema: 'Avanço calculado' },
  vermelha: { nome: 'VERMELHA', cor: '#ff3b4e', clara: '#ff97a2', lema: 'Pressão constante' },
};

export const NEONS = [
  { id: 'ciano', nome: 'Ciano', cor: '#22e3ff' },
  { id: 'verde', nome: 'Verde', cor: '#39ff9c' },
  { id: 'lima', nome: 'Lima', cor: '#d4ff3d' },
  { id: 'magenta', nome: 'Magenta', cor: '#ff3df0' },
  { id: 'laranja', nome: 'Laranja', cor: '#ff8a1f' },
  { id: 'violeta', nome: 'Violeta', cor: '#9a5cff' },
];

export const MODELOS = [
  { id: 'runner', nome: 'Runner', desc: 'Perfil baixo e leve' },
  { id: 'hitop', nome: 'Cano alto', desc: 'Silhueta de quadra' },
  { id: 'chunky', nome: 'Chunky', desc: 'Sola alta e marcante' },
];

// Geometria de cada modelo, em um quadro de 64 x 40 (perfil, virado para a direita).
const FORMAS = {
  runner: {
    sola: 'M5.6,26.2 L58.6,26.2 C61.6,26.2 62.2,28.4 61.4,30.8 C60.6,33 58,33.6 55,33.6 L10,33.6 C6.4,33.6 4.6,32.4 4.4,29.6 C4.2,27.4 4.6,26.2 5.6,26.2 Z',
    entressola: 'M5,29.3 L61.6,29.3',
    cano: 'M8.5,26.5 L8.5,14.5 C8.5,10.5 10.5,9 14,8.8 L19.5,8.5 C20.6,8.5 21.4,9 22.4,10 L27,13.2 L36,15.6 L47,18 C53,19.6 56.6,21.6 58.6,24.4 C59.6,25.8 59.2,26.5 58,26.5 Z',
    painel: 'M12.5,24.4 C20,23.4 27,21 33,17.8 C38,15.2 43,15.4 47.5,17.6',
    cadarcos: [[15, 10.6, 17.6, 14.6], [18.6, 11.8, 21, 16], [22.2, 13.2, 24.4, 17.4]],
    calcanhar: 'M7.6,10.4 L10.4,10.4 L10.4,14.6 L7.6,14.6 Z',
  },
  hitop: {
    sola: 'M5.6,26.2 L58.6,26.2 C61.6,26.2 62.2,28.4 61.4,30.8 C60.6,33 58,33.6 55,33.6 L10,33.6 C6.4,33.6 4.6,32.4 4.4,29.6 C4.2,27.4 4.6,26.2 5.6,26.2 Z',
    entressola: 'M5,29.3 L61.6,29.3',
    cano: 'M8.5,26.5 L8.5,9.6 C8.5,5.2 11,3.8 14.6,3.8 L18,3.8 C19.8,3.8 20.6,4.8 20.6,7 L20.6,11.8 L27,13.6 L36,15.8 L47,18 C53,19.6 56.6,21.6 58.6,24.4 C59.6,25.8 59.2,26.5 58,26.5 Z',
    painel: 'M12.4,24.4 C20,23.4 27,21.4 32,18.4 C37,15.6 43,15.6 47.5,17.6',
    cadarcos: [[12.6, 8.6, 19.2, 9.2], [12.6, 12.4, 20, 12.8], [13, 16, 21.6, 15.6]],
    calcanhar: 'M9.4,5.6 C9.4,5.6 12,4.9 17.4,5.1',
    canoAberto: true,
  },
  chunky: {
    sola: 'M4.6,22.6 L58.6,22.6 C62.4,22.6 63,25.6 62.2,29.6 C61.4,33.6 58,34.8 54,34.8 L9.5,34.8 C5,34.8 3.2,33 3.2,29.4 C3.2,25.4 3.6,22.6 4.6,22.6 Z',
    entressola: 'M3.6,27.6 L62.6,27.6',
    cano: 'M9.5,23 L9.5,13 C9.5,9.5 11.5,8 15,7.8 L20.5,7.5 C21.6,7.5 22.4,8 23.4,9 L28,12.4 L37,14.8 L47.5,17 C53,18.4 56,19.8 57.6,21.8 C58.6,23 58.2,23 57,23 Z',
    painel: 'M13.4,21 C21,20 28,18 33,15.6 C38,13.2 43,13.4 47.5,15.6',
    cadarcos: [[16, 9.6, 18.6, 13.4], [19.6, 10.8, 22, 14.8], [23.2, 12.2, 25.4, 16.2]],
    calcanhar: 'M8.6,9.4 L11.4,9.4 L11.4,13.6 L8.6,13.6 Z',
  },
};

let uid = 0;

/**
 * Desenha o tênis como SVG.
 * cor: neon do jogador (vem do perfil). faccao: 'azul' | 'vermelha'.
 */
export function sneakerSVG({ modelo = 'runner', cor = '#22e3ff', faccao = 'azul', largura = 64, brilho = 1.6 } = {}) {
  const f = FORMAS[modelo] || FORMAS.runner;
  const corFaccao = (FACCOES[faccao] || FACCOES.azul).cor;
  const n = `s${++uid}`;
  const cadarcos = f.cadarcos
    .map(([x1, y1, x2, y2]) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${corFaccao}" stroke-width="1.5" stroke-linecap="round" opacity=".95"/>`)
    .join('');
  const calcanhar = f.canoAberto
    ? `<path d="${f.calcanhar}" fill="none" stroke="${corFaccao}" stroke-width="1.6" stroke-linecap="round"/>`
    : `<path d="${f.calcanhar}" fill="${corFaccao}" opacity=".9"/>`;

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
    <path d="${f.sola}" fill="url(#sola${n})"/>
    <path d="${f.entressola}" stroke="#05080c" stroke-width="1.1" opacity=".65"/>
    <path d="${f.cano}" fill="url(#corpo${n})" stroke="${cor}" stroke-width="1.5" stroke-linejoin="round"/>
    ${cadarcos}
    ${calcanhar}
    <path d="${f.painel}" fill="none" stroke="${cor}" stroke-width="2.4" stroke-linecap="round"/>
  </g>
</svg>`;
}

const vazio = { apelido: '', faccao: 'azul', modelo: 'runner', cor: 'ciano' };

export function corDoPerfil(p) {
  return (NEONS.find((n) => n.id === (p && p.cor)) || NEONS[0]).cor;
}

export function carregarPerfil() {
  try {
    const p = JSON.parse(localStorage.getItem(PLAYER_KEY));
    return p && p.apelido ? { ...vazio, ...p } : null;
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
export function logoSVG({ largura = 120, cor = '#22e3ff', faccao = 'azul', brilho = 2 } = {}) {
  const corFac = (FACCOES[faccao] || FACCOES.azul).cor;
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
