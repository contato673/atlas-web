// ATLAS — lógica de sessão de rota (sem dependências; roda no navegador e no Node).
// O cliente só REGISTRA e controla a interface. Validade e pontuação são do servidor.

export const CONFIG = {
  // --- Regras APROVADAS (documento mestre, seção 3.1) ---
  FINISH_RADIUS_M: 20, // retornar a até 20 m do ponto de partida
  MAX_SPEED_KMH: 25, // limite de velocidade

  // --- PROPOSTAS, não aprovadas (seção 10: pendências). Ajustar após testes de campo. ---
  LEAVE_RADIUS_M: 40, // distância que conta como "saiu da zona inicial"
  MAX_ACCURACY_M: 35, // leituras com precisão pior que isto não mudam o estado
  MIN_POINT_SPACING_M: 3, // não grava pontos mais próximos que isto do anterior
};

const R = 6371008.8; // raio médio da Terra em metros
const rad = (d) => (d * Math.PI) / 180;

/** Distância em metros entre dois pontos {lat, lng}. */
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

    if (step >= this.cfg.MIN_POINT_SPACING_M) {
      this.points.push({ ...p });
      this.distanceM += step;
    }

    const dist = haversine(this.origin, p);
    this.lastDistToOrigin = dist;
    if (dist > this.cfg.LEAVE_RADIUS_M) this.leftZone = true;

    const before = this.state;
    this.state = this.leftZone && dist <= this.cfg.FINISH_RADIUS_M ? 'ready' : 'active';

    return {
      accepted: true,
      distToOrigin: dist,
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
