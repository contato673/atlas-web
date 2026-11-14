// ATLAS — nível, XP, medalhas e o cartão de conquista.
// Tudo desenhado em SVG/canvas aqui mesmo: nenhuma imagem para baixar.

export const RARIDADES = {
  comum:    { nome: 'Comum',    cor: '#8aa0b4' },
  rara:     { nome: 'Rara',     cor: '#22e3ff' },
  epica:    { nome: 'Épica',    cor: '#a855ff' },
  lendaria: { nome: 'Lendária', cor: '#ffb43d' },
};

// Glifos em caixa 0..24, como marcação: cor vem do `color` do grupo que os
// envolve, então a mesma forma serve para medalha ganha e medalha bloqueada.
const GLIFOS = {
  passo: `<ellipse cx="9" cy="9.5" rx="3.1" ry="4.6" transform="rotate(-12 9 9.5)" fill="currentColor"/>
          <ellipse cx="9.3" cy="16" rx="2.1" ry="1.7" transform="rotate(-12 9.3 16)" fill="currentColor"/>
          <ellipse cx="16" cy="13" rx="2.7" ry="4" transform="rotate(10 16 13)" fill="currentColor" opacity=".55"/>
          <ellipse cx="16.2" cy="18.6" rx="1.8" ry="1.5" transform="rotate(10 16.2 18.6)" fill="currentColor" opacity=".55"/>`,
  poligono: `<path d="M12 3l8 5.2-3 10.3H7L4 8.2 12 3z" fill="currentColor"/>`,
  area: `<path d="M4 6h7v5H4V6zm9 0h7v5h-7V6zM4 13h7v5H4v-5zm9 0h7v5h-7v-5z" fill="currentColor"/>`,
  cerco: `<path d="M12 2.5l9.5 6v7l-9.5 6-9.5-6v-7l9.5-6zm0 4.2L6.5 10v4L12 17.3 17.5 14v-4L12 6.7z" fill="currentColor"/>`,
  rota: `<path d="M5 19.5c3.4 0 3.4-4.6 6.9-4.6s3.5-4.6 7-4.6" fill="none" stroke="currentColor"
               stroke-width="2.1" stroke-linecap="round"/>
         <circle cx="5" cy="19.5" r="2.1" fill="currentColor"/>
         <path d="M18.9 3.4c1.9 0 3.4 1.5 3.4 3.4 0 2.4-3.4 6-3.4 6s-3.4-3.6-3.4-6c0-1.9 1.5-3.4 3.4-3.4z"
               fill="currentColor"/>`,
  lua: `<path d="M18 15.4A8 8 0 018.6 6 7.4 7.4 0 1018 15.4z" fill="currentColor"/>`,
  sol: `<circle cx="12" cy="12" r="4.3" fill="currentColor"/>
        <g stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
          <path d="M12 2.2v2.4M12 19.4v2.4M2.2 12h2.4M19.4 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"/>
        </g>`,
  raio: `<path d="M13.8 2L5.2 13.9h5.3L9.6 22 18.8 9.8h-5.5L13.8 2z" fill="currentColor"/>`,
  lanca: `<g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <path d="M3.5 20.5l6-6M20.5 3.5l-3.2.5-8.6 8.6 2.7 2.7 8.6-8.6.5-3.2z"/>
            <path d="M12.6 16.2l4.6 4.6"/>
          </g>`,
  estrela: `<path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9 2.9-6z" fill="currentColor"/>`,
  coroa: `<path d="M3 8.5l4.2 3.8L12 4.6l4.8 7.7L21 8.5V19H3V8.5z" fill="currentColor"/>`,
  globo: `<g fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9.3"/>
            <path d="M2.7 12h18.6M12 2.7c2.9 3.1 2.9 15.5 0 18.6M12 2.7c-2.9 3.1-2.9 15.5 0 18.6"/>
          </g>`,
};

const MEDALHA_GLIFO = {
  fundador: 'coroa', pioneiro: 'estrela',
  primeiro_passo: 'passo', topografo: 'poligono', cartografo: 'poligono', agrimensor: 'poligono',
  hectare: 'area', dez_hectares: 'area', quilometro2: 'globo',
  grande_cerco: 'cerco', cerco_colossal: 'cerco',
  caminhante: 'rota', maratonista: 'rota', cem_quilometros: 'rota',
  invasor: 'lanca', conquistador: 'lanca', devastador: 'lanca',
  madrugador: 'sol', notivago: 'lua',
  constante: 'raio', inabalavel: 'raio',
  veterano: 'estrela', mestre: 'estrela', lenda: 'coroa',
};

export function medalhaSVG({ codigo, raridade = 'comum', tam = 56, ganha = true }) {
  const r = RARIDADES[raridade] || RARIDADES.comum;
  const cor = ganha ? r.cor : '#3a4654';
  const g = GLIFOS[MEDALHA_GLIFO[codigo] || 'estrela'];
  const id = `m${codigo}${ganha ? '' : 'x'}`;
  return `<svg viewBox="0 0 48 48" width="${tam}" height="${tam}" aria-hidden="true">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${cor}" stop-opacity="${ganha ? 0.3 : 0.1}"/>
        <stop offset="1" stop-color="${cor}" stop-opacity="${ganha ? 0.06 : 0.03}"/>
      </linearGradient>
    </defs>
    <path d="M24 2.5l18 10v23l-18 10-18-10v-23l18-10z" fill="url(#${id})"
          stroke="${cor}" stroke-width="${ganha ? 1.8 : 1.2}" stroke-opacity="${ganha ? 0.95 : 0.5}"/>
    ${ganha && (raridade === 'epica' || raridade === 'lendaria')
      ? `<path d="M24 6l14.6 8.1v18.6L24 40.9 9.4 32.7V14.1L24 6z" fill="none" stroke="${cor}" stroke-width="0.7" stroke-opacity="0.45"/>` : ''}
    <g transform="translate(12 12)" color="${cor}" opacity="${ganha ? 0.92 : 0.5}">${g}</g>
  </svg>`;
}

// Anel de nível: círculo com o número dentro e a barra de XP em volta.
export function anelNivel({ nivel = 1, pct = 0, cor = '#22e3ff', tam = 38 }) {
  const raio = 15.5;
  const volta = 2 * Math.PI * raio;
  const feito = Math.max(0, Math.min(1, pct)) * volta;
  return `<svg viewBox="0 0 38 38" width="${tam}" height="${tam}" class="anel">
    <circle cx="19" cy="19" r="${raio}" fill="rgba(5,8,12,.75)" stroke="rgba(255,255,255,.12)" stroke-width="2.6"/>
    <circle cx="19" cy="19" r="${raio}" fill="none" stroke="${cor}" stroke-width="2.6"
            stroke-linecap="round" stroke-dasharray="${feito} ${volta}"
            transform="rotate(-90 19 19)" style="filter:drop-shadow(0 0 4px ${cor}aa)"/>
    <text x="19" y="23.5" text-anchor="middle" font-family="Orbitron, sans-serif"
          font-size="${nivel >= 10 ? 13 : 15}" font-weight="800" fill="#eaf2fb">${nivel}</text>
  </svg>`;
}

/* ===================== cartão de conquista ===================== */
// Imagem quadrada para mandar no grupo. Desenhada no canvas, sem rede.
export async function cartaoConquista({
  titulo, subtitulo, linhas = [], pontos = [], cor = '#22e3ff', corEquipe = '#2f7bff',
  apelido = '', equipe = '', nivel = null, medalha = null,
}) {
  const L = 1080;
  const c = document.createElement('canvas');
  c.width = L; c.height = L;
  const x = c.getContext('2d');

  x.fillStyle = '#05080c'; x.fillRect(0, 0, L, L);
  const brilho = x.createRadialGradient(L / 2, L * 0.42, 40, L / 2, L * 0.42, L * 0.75);
  brilho.addColorStop(0, `${cor}22`); brilho.addColorStop(1, '#05080c00');
  x.fillStyle = brilho; x.fillRect(0, 0, L, L);

  x.strokeStyle = 'rgba(255,255,255,.045)'; x.lineWidth = 1;
  for (let i = 0; i <= L; i += 45) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i, L); x.stroke();
    x.beginPath(); x.moveTo(0, i); x.lineTo(L, i); x.stroke();
  }

  // o traçado da caminhada, encaixado no meio
  if (pontos.length > 2) {
    const lx = pontos.map((p) => p.lng), ly = pontos.map((p) => p.lat);
    const minx = Math.min(...lx), maxx = Math.max(...lx);
    const miny = Math.min(...ly), maxy = Math.max(...ly);
    const k = Math.cos((miny + maxy) / 2 * Math.PI / 180);
    const larg = Math.max((maxx - minx) * k, 1e-9), alt = Math.max(maxy - miny, 1e-9);
    const caixa = L * 0.46, esc = Math.min(caixa / larg, caixa / alt);
    const cx = L / 2, cy = L * 0.44;
    const px = (p) => cx + ((p.lng - (minx + maxx) / 2) * k) * esc;
    const py = (p) => cy - (p.lat - (miny + maxy) / 2) * esc;

    x.beginPath(); x.moveTo(px(pontos[0]), py(pontos[0]));
    for (const p of pontos.slice(1)) x.lineTo(px(p), py(p));
    x.closePath();
    x.fillStyle = `${cor}26`; x.fill();
    x.strokeStyle = cor; x.lineWidth = 7; x.lineJoin = 'round';
    x.shadowColor = cor; x.shadowBlur = 34; x.stroke();
    x.shadowBlur = 0;
  }

  if (medalha) {
    const svg = medalhaSVG({ ...medalha, tam: 320 });
    const img = new Image();
    await new Promise((pronto) => {
      img.onload = pronto; img.onerror = pronto;
      img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    });
    x.drawImage(img, L / 2 - 160, L * 0.44 - 180, 320, 320);
  }

  const centro = (txt, y, fonte, fill) => {
    x.font = fonte; x.fillStyle = fill; x.textAlign = 'center'; x.fillText(txt, L / 2, y);
  };
  centro('A T L A S', 92, '700 34px Orbitron, sans-serif', 'rgba(234,242,251,.5)');
  centro(String(titulo), L * 0.74, '800 66px Orbitron, sans-serif', '#eaf2fb');
  if (subtitulo) centro(subtitulo, L * 0.74 + 56, '600 36px Rajdhani, sans-serif', cor);

  let y = L * 0.845;
  for (const linha of linhas) { centro(linha, y, '600 32px Rajdhani, sans-serif', 'rgba(234,242,251,.72)'); y += 44; }

  x.fillStyle = corEquipe; x.fillRect(L * 0.18, L * 0.93, L * 0.64, 3);
  centro(`${apelido}${nivel ? `  ·  NÍVEL ${nivel}` : ''}${equipe ? `  ·  ${equipe}` : ''}`,
    L * 0.962, '700 30px Orbitron, sans-serif', 'rgba(234,242,251,.75)');

  return new Promise((pronto) => c.toBlob(pronto, 'image/png'));
}

export async function compartilhar(blob, nome, texto) {
  const arquivo = new File([blob], nome, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try { await navigator.share({ files: [arquivo], text: texto }); return 'enviado'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelado'; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'baixado';
}

// Vibração curta: o celular costuma estar no bolso na hora que importa.
export function tremer(padrao) {
  try { if (navigator.vibrate) navigator.vibrate(padrao); } catch { /* sem vibração */ }
}
export const VIB = {
  saiu: 40,
  podeFechar: [60, 60, 60],
  conquista: [90, 50, 90, 50, 180],
  recusa: [220],
  medalha: [40, 40, 40, 40, 120],
};

/* ===================== latinhas de energia ===================== */
export const LATINHAS = {
  lata:    { nome: 'Latinha', cor: '#c6ff3d', raridade: 'comum' },
  latao:   { nome: 'Latão',   cor: '#22e3ff', raridade: 'rara' },
  capsula: { nome: 'Cápsula', cor: '#a855ff', raridade: 'epica' },
};

// Cilindro falso: gradiente horizontal escuro-claro-escuro dá o volume,
// a elipse de cima dá a boca da lata, o brilho vertical dá o metal.
function cilindro(id, cor) {
  const g = `g${id}`;
  const corpo = {
    lata:    { x: 11, y: 14, w: 18, h: 25, r: 3.2 },
    latao:   { x: 9,  y: 9,  w: 22, h: 32, r: 3.6 },
    capsula: { x: 12, y: 13, w: 16, h: 27, r: 7.5 },
  }[id];
  const { x, y, w, h, r } = corpo;
  const cx = x + w / 2;
  return `
    <defs>
      <linearGradient id="${g}m" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#0a0f16"/>
        <stop offset=".28" stop-color="#43536a"/>
        <stop offset=".46" stop-color="#9fb4cc"/>
        <stop offset=".62" stop-color="#43536a"/>
        <stop offset="1" stop-color="#0a0f16"/>
      </linearGradient>
      <linearGradient id="${g}c" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${cor}" stop-opacity=".35"/>
        <stop offset=".42" stop-color="${cor}"/>
        <stop offset=".62" stop-color="${cor}" stop-opacity=".75"/>
        <stop offset="1" stop-color="${cor}" stop-opacity=".3"/>
      </linearGradient>
    </defs>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#${g}m)"/>
    <rect x="${x}" y="${y + h * 0.3}" width="${w}" height="${h * 0.42}" fill="url(#${g}c)"/>
    <path d="M${x + 3.5} ${y + 2}v${h - 4}" stroke="#eaf2fb" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>
    <ellipse cx="${cx}" cy="${y}" rx="${w / 2}" ry="${w / 5.5}" fill="#8ea4bd"/>
    <ellipse cx="${cx}" cy="${y}" rx="${w / 2.9}" ry="${w / 8.5}" fill="#36475c"/>
    <path d="M${x} ${y + h - r} a${w / 2} ${w / 7} 0 0 0 ${w} 0 v${r} a${r} ${r} 0 0 1 -${r} ${r} h-${w - r * 2} a${r} ${r} 0 0 1 -${r} -${r} z"
          fill="#111a24" opacity=".85"/>
    ${id === 'capsula'
      ? `<rect x="${x + 2}" y="${y - 7}" width="${w - 4}" height="7" rx="2" fill="${cor}"/>
         <ellipse cx="${cx}" cy="${y - 7}" rx="${(w - 4) / 2}" ry="2" fill="#eaf2fb" opacity=".7"/>`
      : `<path d="M${cx - 3} ${y + h * 0.42}l-2.5 5h3l-2 5 6-6.5h-3l2-3.5z" fill="#0a0f16" opacity=".85"/>`}`;
}

export function latinhaSVG({ tipo = 'lata', tam = 46 } = {}) {
  const cor = (LATINHAS[tipo] || LATINHAS.lata).cor;
  return `<svg viewBox="0 0 40 52" width="${tam}" height="${tam * 52 / 40}" class="lata-arte">
    <g style="filter:drop-shadow(0 0 6px ${cor}aa)">${cilindro(tipo, cor)}</g>
  </svg>`;
}

// O que faz flutuar é o conjunto: a lata sobe e desce, a sombra no chão
// encolhe quando ela sobe, e o anel de luz fica parado no chão.
// So a lata. O anel e a sombra no chao viraram camada do mapa (fonte `latas`
// no app.js), porque desenho de tela nao tomba com a inclinacao nem escala com
// o zoom — e era isso que fazia a lata parecer solta sobre as ruas.
export function marcaLatinhaHTML(tipo, tam = 46) {
  const cor = (LATINHAS[tipo] || LATINHAS.lata).cor;
  // A haste e o ponto de contato sao a pista de que a lata esta fincada
  // naquele lugar, e nao pairando sobre o mapa. Como o marcador e ancorado por
  // baixo, a base do elemento cai exatamente na coordenada.
  return `<span class="lata-sobe">${latinhaSVG({ tipo, tam })}</span>
    <span class="lata-haste" style="--c:${cor}"></span>
    <span class="lata-pe" style="--c:${cor}"></span>`;
}
