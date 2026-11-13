// ATLAS — catalogo do personagem: o que existe para vestir, em peças.
//
// Por que um arquivo so para isto: a geometria do boneco nao pode decidir o
// que existe na loja, e a loja nao pode saber desenhar. Aqui fica a lista; o
// boneco3d.js so recebe o resultado ja resolvido em cores e ids de peça.
//
// Compatibilidade: o servidor ainda guarda `modelo` com a trava
// basico/corredor/jaqueta. Enquanto a coluna nova nao existe, esses tres
// viram presets daqui, e ninguem perde o que comprou.

export const PELES = [
  { id: 'clara', nome: 'Clara', cor: '#e8c49f' },
  { id: 'media', nome: 'Média', cor: '#c89a72' },
  { id: 'morena', nome: 'Morena', cor: '#9e7249' },
  { id: 'escura', nome: 'Escura', cor: '#6b4527' },
  { id: 'retinta', nome: 'Retinta', cor: '#46291a' },
];

export const CORES_CABELO = [
  { id: 'preto', nome: 'Preto', cor: '#15181f' },
  { id: 'castanho', nome: 'Castanho', cor: '#3a2416' },
  { id: 'loiro', nome: 'Loiro', cor: '#b9893f' },
  { id: 'ruivo', nome: 'Ruivo', cor: '#8c3a1c' },
  { id: 'grisalho', nome: 'Grisalho', cor: '#9aa3ad' },
  { id: 'neon', nome: 'Neon', cor: null }, // usa a cor neon do jogador
];

// Paleta de roupa: serve para camiseta, casaco, calca e tenis.
export const CORES_PANO = [
  { id: 'grafite', nome: 'Grafite', cor: '#242a31' },
  { id: 'chumbo', nome: 'Chumbo', cor: '#3b434d' },
  { id: 'marinho', nome: 'Marinho', cor: '#1b2d44' },
  { id: 'petroleo', nome: 'Petróleo', cor: '#14414f' },
  { id: 'vinho', nome: 'Vinho', cor: '#4a1a24' },
  { id: 'areia', nome: 'Areia', cor: '#8a7352' },
  { id: 'branco', nome: 'Branco', cor: '#cfd8e3' },
];

// Cada peça tem `custo` em ouro. 0 = já vem com a conta.
export const CATALOGO = {
  corpo: [
    { id: 'masculino', nome: 'Masculino', custo: 0 },
    { id: 'feminino', nome: 'Feminino', custo: 0 },
  ],
  cabelo: [
    { id: 'curto', nome: 'Curto', custo: 0 },
    { id: 'raspado', nome: 'Raspado', custo: 0 },
    { id: 'rabo', nome: 'Rabo de cavalo', custo: 0 },
    { id: 'moicano', nome: 'Moicano', custo: 250 },
    { id: 'coque', nome: 'Coque', custo: 250 },
  ],
  capacete: [
    { id: 'nenhum', nome: 'Nenhum', custo: 0 },
    { id: 'calota', nome: 'Calota', custo: 0 },
    { id: 'capuz', nome: 'Capuz', custo: 300 },
    { id: 'tatico', nome: 'Tático', custo: 900 },
  ],
  viseira: [
    { id: 'nenhuma', nome: 'Nenhuma', custo: 0 },
    { id: 'faixa', nome: 'Faixa', custo: 0 },
    { id: 'oculos', nome: 'Óculos', custo: 200 },
  ],
  camiseta: [
    { id: 'manga', nome: 'Manga curta', custo: 0 },
    { id: 'regata', nome: 'Regata', custo: 0 },
    { id: 'longa', nome: 'Manga longa', custo: 150 },
  ],
  casaco: [
    { id: 'nenhum', nome: 'Nenhum', custo: 0 },
    { id: 'cortavento', nome: 'Corta-vento', custo: 600 },
    { id: 'jaqueta', nome: 'Jaqueta tática', custo: 900 },
  ],
  calca: [
    { id: 'cargo', nome: 'Cargo', custo: 0 },
    { id: 'legging', nome: 'Legging', custo: 0 },
    { id: 'short', nome: 'Short', custo: 150 },
  ],
  tenis: [
    { id: 'corrida', nome: 'Corrida', custo: 0 },
    { id: 'bota', nome: 'Bota', custo: 400 },
    { id: 'chunky', nome: 'Chunky', custo: 400 },
  ],
};

// Ordem em que as abas aparecem no vestiário.
export const SLOTS = [
  { id: 'corpo', nome: 'Corpo', cores: null },
  { id: 'cabelo', nome: 'Cabelo', cores: 'cabelo' },
  { id: 'capacete', nome: 'Capacete', cores: 'pano' },
  { id: 'viseira', nome: 'Viseira', cores: null },
  { id: 'camiseta', nome: 'Camiseta', cores: 'pano' },
  { id: 'casaco', nome: 'Casaco', cores: 'pano' },
  { id: 'calca', nome: 'Calça', cores: 'pano' },
  { id: 'tenis', nome: 'Tênis', cores: 'pano' },
];

export const VISUAL_PADRAO = {
  corpo: 'masculino',
  pele: 'media',
  cabelo: 'curto', cabeloCor: 'preto',
  capacete: 'nenhum', capaceteCor: 'grafite',
  viseira: 'nenhuma',
  camiseta: 'manga', camisetaCor: 'marinho',
  casaco: 'nenhum', casacoCor: 'grafite',
  calca: 'cargo', calcaCor: 'grafite',
  tenis: 'corrida', tenisCor: 'grafite',
};

// Os tres modelos antigos viram conjuntos prontos, para quem ja comprou nao
// abrir o jogo e dar de cara com um boneco diferente do seu.
export const PRESETS = {
  basico: { ...VISUAL_PADRAO },
  corredor: {
    ...VISUAL_PADRAO, camiseta: 'longa', camisetaCor: 'petroleo',
    casaco: 'cortavento', casacoCor: 'petroleo', calca: 'legging', tenis: 'corrida',
  },
  jaqueta: {
    ...VISUAL_PADRAO, capacete: 'calota', capaceteCor: 'grafite', viseira: 'faixa',
    casaco: 'jaqueta', casacoCor: 'grafite', calca: 'cargo', tenis: 'bota', tenisCor: 'grafite',
  },
};

const acha = (lista, id) => lista.find((x) => x.id === id) || lista[0];
const corDe = (lista, id, reserva) => {
  const c = acha(lista, id);
  return c.cor === null ? reserva : c.cor;
};

// Troca o visual guardado (ids) pelo visual desenhavel (hex). O boneco nunca
// vê um id de item: so recebe peça e cor resolvidas.
export function resolverVisual(visual, neon = '#22e3ff') {
  const v = { ...VISUAL_PADRAO, ...(visual || {}) };
  const peca = (slot) => acha(CATALOGO[slot], v[slot]).id;
  return {
    corpo: peca('corpo'),
    pele: corDe(PELES, v.pele, '#c89a72'),
    cabelo: peca('cabelo'),
    cabeloCor: corDe(CORES_CABELO, v.cabeloCor, neon),
    capacete: peca('capacete'),
    capaceteCor: corDe(CORES_PANO, v.capaceteCor, neon),
    viseira: peca('viseira'),
    camiseta: peca('camiseta'),
    camisetaCor: corDe(CORES_PANO, v.camisetaCor, neon),
    casaco: peca('casaco'),
    casacoCor: corDe(CORES_PANO, v.casacoCor, neon),
    calca: peca('calca'),
    calcaCor: corDe(CORES_PANO, v.calcaCor, neon),
    tenis: peca('tenis'),
    tenisCor: corDe(CORES_PANO, v.tenisCor, neon),
    neon,
  };
}

// Trocar de peça muda a geometria; trocar de cor nao. Isto evita remontar o
// boneco inteiro a cada toque numa bolinha de cor.
export const PECAS = SLOTS.map((s) => s.id);
export const mudouDePeca = (a, b) => PECAS.some((p) => (a || {})[p] !== (b || {})[p]);

export const precoDaPeca = (slot, id) => (acha(CATALOGO[slot], id).custo || 0);

export const itemDaPeca = (slot, id) => `${slot}:${id}`;

// Lista plana de tudo que é de graça, para a carteira do jogador.
export const PECAS_GRATIS = Object.entries(CATALOGO)
  .flatMap(([slot, itens]) => itens.filter((i) => !i.custo).map((i) => `${slot}:${i.id}`));

export function visualValido(visual) {
  const v = { ...VISUAL_PADRAO, ...(visual || {}) };
  for (const slot of PECAS) {
    if (!CATALOGO[slot].some((i) => i.id === v[slot])) return false;
  }
  return true;
}
