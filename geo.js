// ATLAS — lógica de sessão de rota (sem dependências; roda no navegador e no Node).
// O cliente só REGISTRA e controla a interface. Validade e pontuação são do servidor.

export const CONFIG = {
  // --- Regras APROVADAS (documento mestre, seção 3.1) ---
  FINISH_RADIUS_M: 20, // retornar a até 20 m do ponto de partida
  MAX_SPEED_KMH: 20, // espelha vel_max_kmh do servidor. Mudar os dois juntos.

  // --- PROPOSTAS, não aprovadas (seção 10: pendências). Ajustar após testes de campo. ---
  LEAVE_RADIUS_M: 40, // espelha raio_saida_m do servidor. Mudar os dois juntos:
                      // com 25 aqui e 40 lá, o jogo oferece FINALIZAR numa rota
                      // que o servidor vai recusar.
  MAX_ACCURACY_M: 35, // leituras com precisão pior que isto não mudam o estado
  MIN_POINT_SPACING_M: 4, // não grava pontos mais próximos que isto do anterior
  // Com GPS ruim o ponto "anda" sozinho. Só vira vértice quem se afastou mais
  // do que o próprio erro da leitura: é isso que tira o zigue-zague do traçado.
  JITTER_FACTOR: 0.7,
  ACC_AVISO_M: 22, // acima disto, avisa que o sinal está ruim
  // Espelham os valores do servidor (atlas_config). Aqui servem só para avisar
  // o jogador antes; quem decide de verdade continua sendo o servidor.
  MIN_ROUTE_M: 150,
  MIN_AREA_M2: 500,
};

const R = 6371008.8; // raio médio da Terra em metros
const rad = (d) => (d * Math.PI) / 180;

/** Distância em metros entre dois pontos {lat, lng}. */
// Ponto de um segmento de reta mais próximo de p, em lat/lng. A longitude é
// corrigida pelo cosseno da latitude, senão o "mais próximo" sai torto: perto
// de Campo Grande um grau de longitude é mais curto que um de latitude.
// Serve para encaixar a latinha na rua mais próxima dentro da célula.
export function pertoNoSegmento(p, a, b) {
  const k = Math.cos((p.lat * Math.PI) / 180) || 1;
  const ax = a[0] * k; const ay = a[1];
  const bx = b[0] * k; const by = b[1];
  const px = p.lng * k; const py = p.lat;
  const dx = bx - ax; const dy = by - ay;
  const len = dx * dx + dy * dy;
  let t = len > 0 ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
  t = Math.max(0, Math.min(1, t));
  return { lng: (ax + t * dx) / k, lat: ay + t * dy };
}

export function haversine(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Polígono aproximando um círculo de `radiusM` metros (para desenhar a zona de 20 m). */
export function circlePolygon(center, radiusM, steps = 48) {
  const ring = [];
  const dLat = radiusM / 111320;
  const dLng = radiusM / (111320 * Math.cos(rad(center.lat)));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    ring.push([center.lng + dLng * Math.cos(a), center.lat + dLat * Math.sin(a)]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}

/**
 * Estados: 'idle' (sem rota) | 'active' (rota em andamento) | 'ready' (pode finalizar).
 * Ponto: { lat, lng, acc (m), t (ms epoch) }.
 */
export class RouteSession {
  constructor(cfg = CONFIG) {
    this.cfg = cfg;
    this.reset();
  }

  reset() {
    this.state = 'idle';
    this.origin = null;
    this.points = []; // pontos aceitos
    this.flagged = []; // leituras descartadas do cálculo, guardadas para o servidor analisar
    this.gaps = []; // intervalos em que o app ficou fechado/oculto
    this.leftZone = false;
    this.distanceM = 0;
    this.startedAt = null;
    this.lastDistToOrigin = 0;
    this.maxDistToOrigin = 0; // o mais longe que chegou do início
    this.descartados = 0;     // leituras engolidas pelo filtro de ruído
  }

  /** Início MANUAL da rota. Exige uma leitura de GPS aceitável. */
  start(p) {
    if (this.state !== 'idle') throw new Error('Já existe uma rota em andamento.');
    if (!(p.acc <= this.cfg.MAX_ACCURACY_M)) throw new Error('GPS impreciso demais para iniciar.');
    this.reset();
    this.state = 'active';
    this.origin = { lat: p.lat, lng: p.lng };
    this.startedAt = p.t;
    this.points.push({ ...p });
  }

  get canFinish() {
    return this.state === 'ready';
  }

  /** Processa uma leitura de GPS. Nunca finaliza sozinho. */
  addPoint(p) {
    if (this.state === 'idle') return { accepted: false, reason: 'sem-rota' };

    if (!(p.acc <= this.cfg.MAX_ACCURACY_M)) {
      this.flagged.push({ ...p, reason: 'imprecisao' });
      return { accepted: false, reason: 'imprecisao' };
    }

    const last = this.points[this.points.length - 1];
    const dt = (p.t - last.t) / 1000;
    if (dt <= 0) {
      this.flagged.push({ ...p, reason: 'tempo' });
      return { accepted: false, reason: 'tempo' };
    }
    const step = haversine(last, p);
    const speedKmh = (step / dt) * 3.6;
    if (speedKmh > this.cfg.MAX_SPEED_KMH) {
      // Pico de velocidade: pode ser GPS espúrio, não assume fraude. Guarda e ignora no estado.
      this.flagged.push({ ...p, reason: 'velocidade', speedKmh });
      return { accepted: false, reason: 'velocidade', speedKmh };
    }

    // separação mínima proporcional ao erro da leitura
    const separacao = Math.max(this.cfg.MIN_POINT_SPACING_M, p.acc * this.cfg.JITTER_FACTOR);
    if (step >= separacao) {
      this.points.push({ ...p });
      this.distanceM += step;
    } else {
      this.descartados++;
    }

    const dist = haversine(this.origin, p);
    this.lastDistToOrigin = dist;
    if (dist > this.maxDistToOrigin) this.maxDistToOrigin = dist;
    if (dist > this.cfg.LEAVE_RADIUS_M) this.leftZone = true;

    const before = this.state;
    this.state = this.leftZone && dist <= this.cfg.FINISH_RADIUS_M ? 'ready' : 'active';

    return {
      accepted: true,
      distToOrigin: dist,
      maxDistToOrigin: this.maxDistToOrigin,
      faltaParaSair: Math.max(0, this.cfg.LEAVE_RADIUS_M - this.maxDistToOrigin),
      canFinish: this.canFinish,
      justReturned: this.state === 'ready' && before !== 'ready',
      justLeftRadius: this.state === 'active' && before === 'ready',
    };
  }

  /** Registra um intervalo em que o registro ficou pausado (app oculto). */
  addGap(fromMs, toMs) {
    if (this.state !== 'idle') this.gaps.push({ from: fromMs, to: toMs });
  }

  /** Só funciona por ação explícita do jogador e só dentro do raio. */
  finish(nowMs) {
    if (!this.canFinish) throw new Error('Fora do raio de 20 m: não é possível finalizar.');
    const payload = {
      startedAt: this.startedAt,
      finishedAt: nowMs,
      origin: this.origin,
      distanceM: Math.round(this.distanceM),
      points: this.points,
      flagged: this.flagged,
      gaps: this.gaps,
    };
    this.reset();
    return payload;
  }

  abandon() {
    this.reset();
  }

  serialize() {
    const { cfg, ...data } = this;
    return JSON.parse(JSON.stringify(data));
  }

  static restore(data, cfg = CONFIG) {
    const s = new RouteSession(cfg);
    if (data && data.state && data.state !== 'idle' && data.origin) Object.assign(s, data);
    return s;
  }
}


/* ===================== andando ou parado ===================== */
// Terceira vez que um limiar fixo contra ruído de GPS dá problema, então esta
// lógica mora aqui, com teste. A regra: o limiar ACOMPANHA o erro do GPS.
// Parado com ±13 m de precisão, o aparelho pula vários metros sozinho; um
// limiar de 1,2 m fazia o boneco "andar" o tempo todo e espelhar para os dois
// lados, porque a longitude oscilava.
export const MOVIMENTO = {
  PISO_M: 6,          // nunca exige menos que isto
  FATOR_ERRO: 0.9,    // e nunca menos que 0,9 x o erro do GPS
  PARA_APOS_MS: 5000, // some do estado "andando" depois disto quieto
  DERIVA_MS: 8000,    // sem sair do lugar, a referência acompanha a deriva
};

export class DetectorDeMovimento {
  constructor(cfg = {}) {
    this.cfg = { ...MOVIMENTO, ...cfg };
    this.ref = null;
    // -Infinity, não 0: com 0 o boneco nasce "andando" até o relógio passar
    // dos 5 s. No app isso não aparecia porque o relógio é grande, mas é
    // defeito de verdade — o teste pegou.
    this.paradoDesde = -Infinity;
    this.olhandoPara = 0; // -1 esquerda, 1 direita, 0 indefinido
  }

  // Devolve { andando, olhandoPara, limiar }
  ver(p) {
    const agora = p.t || Date.now();
    const erro = Math.max(p.acc || 15, this.cfg.PISO_M);
    const limiar = Math.max(this.cfg.PISO_M, erro * this.cfg.FATOR_ERRO);

    if (!this.ref) this.ref = { ...p, t: agora };
    const afastou = haversine(this.ref, p);

    if (afastou > limiar) {
      this.paradoDesde = agora;
      // a direção só muda quando o deslocamento é claramente horizontal
      if (Math.abs(p.lng - this.ref.lng) > Math.abs(p.lat - this.ref.lat) * 0.5) {
        this.olhandoPara = p.lng < this.ref.lng ? -1 : 1;
      }
      this.ref = { ...p, t: agora };
    } else if (agora - this.ref.t > this.cfg.DERIVA_MS) {
      this.ref = { ...p, t: agora };
    }

    return {
      andando: agora - this.paradoDesde < this.cfg.PARA_APOS_MS,
      olhandoPara: this.olhandoPara,
      limiar,
    };
  }
}

/* ===================== perto de um território ===================== */
// Usadas para avisar o jogador quando ele chega perto de terreno inimigo.
// Ficam aqui e não no app porque são geometria pura, e porque geometria pura
// é a única coisa deste projeto que dá para testar sem navegador nenhum.

// Raio-casting: conta quantas vezes uma linha saindo do ponto cruza o anel.
// Ímpar = dentro. Funciona com o anel em [lng, lat], como vem do GeoJSON.
export function dentroDoAnel(p, anel) {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    const cruza = (yi > p.lat) !== (yj > p.lat)
      && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

// Distância até a borda do anel, em metros. Dentro ou fora, é sempre a borda:
// quem chama decide o que fazer com o "dentro".
export function distanciaAoAnel(p, anel, metro) {
  let menor = Infinity;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const q = pertoNoSegmento(p, [anel[j][0], anel[j][1]], [anel[i][0], anel[i][1]]);
    const d = metro(p, q);
    if (d < menor) menor = d;
  }
  return menor;
}

// Percorre um FeatureCollection de polígonos e devolve o mais próximo que
// passe no filtro. Só olha o anel de fora: buraco de polígono não muda a
// resposta de "estou chegando perto?".
export function territorioMaisPerto(p, colecao, passa, metro) {
  let achado = null;
  for (const f of (colecao && colecao.features) || []) {
    if (!f.geometry || f.geometry.type !== 'Polygon') continue;
    if (passa && !passa(f.properties || {})) continue;
    const anel = f.geometry.coordinates[0];
    if (!anel || anel.length < 4) continue;
    const dentro = dentroDoAnel(p, anel);
    const d = dentro ? 0 : distanciaAoAnel(p, anel, metro);
    if (!achado || d < achado.distancia) achado = { feature: f, distancia: d, dentro };
  }
  return achado;
}
