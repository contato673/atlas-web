// ATLAS — conversa com o servidor (Supabase, pela API REST, sem bibliotecas).
// Sem servidor configurado, tudo cai no MODO LOCAL, só neste aparelho.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js?v=20';

export const temServidor = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const SESSAO_KEY = 'atlas.sessao.v1';
const CONTAS_KEY = 'atlas.contas.v1';
const ROTAS_KEY = 'atlas.pending.v1';

const ler = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
const apagar = (k) => { try { localStorage.removeItem(k); } catch { /* sem armazenamento */ } };

let sessao = ler(SESSAO_KEY);

const emailDe = (apelido) => `${String(apelido).toLowerCase().replace(/[^a-z0-9]/g, '')}@atlas.jogo`;

async function chamar(caminho, { metodo = 'GET', corpo, comToken = true, tentouRenovar = false, prazo = 15000 } = {}) {
  const h = { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
  if (comToken && sessao && sessao.access_token) h.Authorization = `Bearer ${sessao.access_token}`;
  // Sem prazo, uma rede ruim deixa o jogo travado esperando para sempre.
  const freio = new AbortController();
  const relogio = setTimeout(() => freio.abort(), prazo);
  let r;
  try {
    r = await fetch(SUPABASE_URL + caminho, {
      method: metodo, headers: h, signal: freio.signal,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch (e) {
    throw new Error(e && e.name === 'AbortError' ? 'O servidor demorou demais para responder.' : 'Sem conexão com o servidor.');
  } finally {
    clearTimeout(relogio);
  }
  if (r.status === 401 && comToken && !tentouRenovar && sessao && sessao.refresh_token) {
    if (await renovar()) return chamar(caminho, { metodo, corpo, comToken, tentouRenovar: true, prazo });
  }
  const texto = await r.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch { dados = texto; }
  if (!r.ok) {
    const e = new Error((dados && (dados.msg || dados.message || dados.error_description || dados.error)) || `Erro ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return dados;
}

async function renovar() {
  try {
    const d = await chamar('/auth/v1/token?grant_type=refresh_token', {
      metodo: 'POST', corpo: { refresh_token: sessao.refresh_token }, comToken: false,
    });
    sessao = d; gravar(SESSAO_KEY, d); return true;
  } catch { sessao = null; apagar(SESSAO_KEY); return false; }
}

export function temSessao() { return Boolean(sessao && sessao.access_token); }

export function sair() { sessao = null; apagar(SESSAO_KEY); }

/* ===================== contas ===================== */
export async function entrar(apelido, pin) {
  if (!temServidor) {
    const c = (ler(CONTAS_KEY) || {})[apelido];
    if (!c) return { ok: false, motivo: 'sem_conta' };
    if (c.pin !== pin) return { ok: false, motivo: 'pin' };
    return { ok: true, perfil: { ...c } };
  }
  try {
    const d = await chamar('/auth/v1/token?grant_type=password', {
      metodo: 'POST', comToken: false, corpo: { email: emailDe(apelido), password: pin },
    });
    sessao = d; gravar(SESSAO_KEY, d);
  } catch (e) {
    return { ok: false, motivo: e.status === 400 ? 'pin' : 'rede', detalhe: e.message };
  }
  let perfil;
  try { perfil = await meuPerfil(); }
  catch (e) { return { ok: false, motivo: 'rede', detalhe: e.message }; }
  if (!perfil) return { ok: false, motivo: 'sem_perfil' };
  return { ok: true, perfil };
}

export async function criarConta({ apelido, pin, faccao, modelo, cor, codigo }) {
  if (!temServidor) {
    const contas = ler(CONTAS_KEY) || {};
    if (contas[apelido]) return { ok: false, motivo: 'apelido_em_uso' };
    const p = { apelido, pin, faccao, modelo, cor };
    contas[apelido] = p; gravar(CONTAS_KEY, contas);
    return { ok: true, perfil: { ...p } };
  }
  // Já logado e com perfil pronto? Então não é cadastro, é entrada.
  if (temSessao()) {
    const meu = await meuPerfil().catch(() => null);
    if (meu) return { ok: true, perfil: meu, jaEra: true };
  }
  let jaExistia = false;
  try {
    const d = await chamar('/auth/v1/signup', {
      metodo: 'POST', comToken: false, corpo: { email: emailDe(apelido), password: pin },
    });
    if (d && d.access_token) { sessao = d; gravar(SESSAO_KEY, d); }
  } catch (e) {
    if (!/already|registered|exists/i.test(e.message)) return { ok: false, motivo: 'rede', detalhe: e.message };
    jaExistia = true;
  }
  if (!temSessao()) {
    // Pode ser uma conta criada antes e que ficou sem perfil (convite errado, queda de rede).
    const r = await entrar(apelido, pin);
    if (!r.ok && r.motivo === 'sem_perfil') { /* segue: falta só o perfil */ }
    else if (!r.ok) return { ok: false, motivo: jaExistia ? 'apelido_em_uso' : 'confirmacao_de_email' };
    // O apelido já tem conta E o PIN confere: é a própria pessoa voltando.
    // Entrar é melhor que recusar o cadastro e deixá-la sem jogo.
    else return { ok: true, perfil: r.perfil, jaEra: true };
  }
  let res;
  try {
    res = await chamar('/rest/v1/rpc/criar_perfil', {
      metodo: 'POST',
      corpo: { p_apelido: apelido, p_faccao: faccao, p_modelo: modelo, p_cor: cor, p_codigo: codigo },
    });
  } catch (e) { return { ok: false, motivo: 'rede', detalhe: e.message }; }
  if (!res || !res.ok) return { ok: false, motivo: (res && res.motivo) || 'erro' };
  return { ok: true, perfil: { apelido, faccao, modelo, cor } };
}

export function meuId() {
  return sessao && sessao.user ? sessao.user.id : null;
}

export async function meuPerfil() {
  if (!temServidor || !temSessao()) return null;
  const u = meuId();
  if (!u) return null;   // sem o id não dá para saber qual perfil é o meu
  // select=* de propósito: pedir colunas pelo nome quebra o login inteiro
  // sempre que o cliente ganha um campo antes de o banco ganhar a coluna.
  // O erro NÃO é engolido: falha de rede não pode virar "conta sem perfil".
  const d = await chamar(`/rest/v1/perfis?select=*&id=eq.${u}&limit=1`);
  return d && d[0] ? d[0] : null;
}

export async function salvarVisual({ modelo, cor, cenario }) {
  if (!temServidor || !temSessao()) {
    return { ok: true };
  }
  try {
    const u = meuId();
    if (!u) return { ok: false, detalhe: 'sem sessão' };
    try {
      await chamar(`/rest/v1/perfis?id=eq.${u}`, { metodo: 'PATCH', corpo: { modelo, cor, cenario } });
    } catch (e) {
      // banco ainda sem a coluna de cenário: grava o resto em vez de falhar
      if (e.status !== 400) throw e;
      await chamar(`/rest/v1/perfis?id=eq.${u}`, { metodo: 'PATCH', corpo: { modelo, cor } });
    }
    return { ok: true };
  } catch (e) { return { ok: false, detalhe: e.message }; }
}

/* ===================== jogo ===================== */
// A rota é aberta no servidor ANTES de caminhar: o relógio que vale é o dele.
export async function iniciarRota(lat, lng) {
  if (!temServidor || !temSessao()) return { ok: false, motivo: 'sem_servidor' };
  try {
    return await chamar('/rest/v1/rpc/iniciar_rota', { metodo: 'POST', corpo: { lat, lng } });
  } catch (e) { return { ok: false, motivo: 'rede', detalhe: e.message }; }
}

// Sinal de vida durante a caminhada, com a hora marcada pelo servidor.
export async function pingRota(sessao, lat, lng, precisao) {
  if (!temServidor || !temSessao() || !sessao) return { ok: false };
  try {
    return await chamar('/rest/v1/rpc/ping_rota', { metodo: 'POST', corpo: { sessao, lat, lng, precisao } });
  } catch { return { ok: false }; }
}

function marcarRota(rota) {
  if (!rota.uid) {
    rota.uid = `${rota.startedAt}-${rota.finishedAt}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return rota;
}

export async function enviarRota(rota) {
  marcarRota(rota);
  if (!temServidor || !temSessao()) {
    const fila = ler(ROTAS_KEY) || [];
    fila.push(rota); gravar(ROTAS_KEY, fila);
    return { ok: false, motivo: 'sem_servidor' };
  }
  const pontos = rota.points.map((p) => ({ lat: p.lat, lng: p.lng, acc: p.acc, t: p.t }));
  try {
    return await chamar('/rest/v1/rpc/finalizar_rota', { metodo: 'POST', corpo: { pontos, rota_uid: rota.uid, sessao: rota.sessao || null }, prazo: 30000 });
  } catch (e) {
    const fila = ler(ROTAS_KEY) || [];
    fila.push(rota); gravar(ROTAS_KEY, fila);   // guarda para reenviar
    return { ok: false, motivo: 'rede', detalhe: e.message };
  }
}

export async function reenviarPendentes() {
  if (!temServidor || !temSessao()) return [];
  const fila = ler(ROTAS_KEY) || [];
  if (!fila.length) return [];
  const sobra = []; const feitos = [];
  for (const rota of fila) {
    const r = await enviarRotaDireto(rota);
    if (r && (r.ok || r.motivo)) feitos.push(r); else sobra.push(rota);
  }
  gravar(ROTAS_KEY, sobra);
  return feitos;
}

async function enviarRotaDireto(rota) {
  marcarRota(rota);
  const pontos = rota.points.map((p) => ({ lat: p.lat, lng: p.lng, acc: p.acc, t: p.t }));
  try { return await chamar('/rest/v1/rpc/finalizar_rota', { metodo: 'POST', corpo: { pontos, rota_uid: rota.uid, sessao: rota.sessao || null }, prazo: 30000 }); }
  catch { return null; }
}

export async function buscarMapa() {
  if (!temServidor || !temSessao()) return { type: 'FeatureCollection', features: [] };
  try { return await chamar('/rest/v1/rpc/mapa', { metodo: 'POST', corpo: {} }); }
  catch { return { type: 'FeatureCollection', features: [] }; }
}

/* ===================== ouro ===================== */
// Devolve null quando o servidor ainda não tem a economia instalada.
export async function buscarCarteira() {
  if (!temServidor || !temSessao()) return null;
  try { return await chamar('/rest/v1/rpc/carteira', { metodo: 'POST', corpo: {} }); }
  catch { return null; }
}

export async function comprarItem(item) {
  if (!temServidor || !temSessao()) return { ok: false, motivo: 'sem_servidor' };
  try { return await chamar('/rest/v1/rpc/comprar', { metodo: 'POST', corpo: { p_item: item } }); }
  catch (e) { return { ok: false, motivo: 'rede', detalhe: e.message }; }
}

export async function buscarRanking() {
  if (!temServidor || !temSessao()) return [];
  try { return await chamar('/rest/v1/ranking_individual?select=*&order=creditos.desc&limit=100') || []; }
  catch { return []; }
}

export async function buscarPlacar() {
  if (!temServidor || !temSessao()) return [];
  try { return await chamar('/rest/v1/placar_equipes?select=*') || []; }
  catch { return []; }
}

export async function buscarProgresso() {
  if (!temServidor || !temSessao()) return null;
  try { return await chamar('/rest/v1/rpc/progresso', { metodo: 'POST', corpo: {} }); }
  catch { return null; }
}

export async function buscarEstante(apelido) {
  if (!temServidor || !temSessao()) return null;
  try { return await chamar('/rest/v1/rpc/estante', { metodo: 'POST', corpo: { p_apelido: apelido } }); }
  catch { return null; }
}

export async function buscarSemana() {
  if (!temServidor || !temSessao()) return [];
  try { return (await chamar('/rest/v1/placar_semana?select=*&limit=20')) || []; }
  catch { return []; }
}

export async function buscarCatalogo() {
  if (!temServidor || !temSessao()) return [];
  try { return (await chamar('/rest/v1/medalhas?select=*&order=ordem')) || []; }
  catch { return []; }
}
