// ATLAS — catalogo do personagem: as peças da unidade ciborgue.
//
// Por que robo e nao gente: rosto humano em low-poly facetado nao fecha. Ou
// vira boneco de plastico, ou exige malha e textura que um PWA de graça nao
// comporta. Robo resolve na raiz — placa metalica le muito melhor facetada,
// o sensor optico aceso substitui o rosto, e a lore da coleta de energia passa
// a explicar as latinhas, que antes eram so um item solto no mapa.
//
// Por que um arquivo so para isto: a geometria nao pode decidir o que existe na
// loja, e a loja nao pode saber desenhar. Aqui fica a lista; o boneco3d.js so
// recebe o resultado ja resolvido em cor.
//
// Nota de compatibilidade: o visual novo ainda nao tem coluna no servidor, so
// vive no aparelho. Entao os ids puderam ser renomeados sem migracao: um visual
// antigo salvo simplesmente cai no padrao, sem quebrar nada.

// A placa e o metal do corpo: o que antes era tom de pele.
export const PLACAS = [
  { id: 'aco', nome: 'Aço', cor: '#8b949e' },
  { id: 'grafite', nome: 'Grafite', cor: '#39414b' },
  { id: 'titanio', nome: 'Titânio', cor: '#b9c3cc' },
  { id: 'cobre', nome: 'Cobre', cor: '#9c6239' },
  { id: 'obsidiana', nome: 'Obsidiana', cor: '#1d2229' },
  { id: 'osso', nome: 'Osso', cor: '#d8d2c4' },
];

// Pintura das peças de carenagem.
export const CORES_PECA = [
  { id: 'grafite', nome: 'Grafite', cor: '#242a31' },
  { id: 'chumbo', nome: 'Chumbo', cor: '#3b434d' },
  { id: 'marinho', nome: 'Marinho', cor: '#1b2d44' },
  { id: 'petroleo', nome: 'Petróleo', cor: '#14414f' },
  { id: 'ferrugem', nome: 'Ferrugem', cor: '#5e2a1c' },
  { id: 'areia', nome: 'Areia', cor: '#8a7352' },
  { id: 'gelo', nome: 'Gelo', cor: '#cfd8e3' },
  { id: 'neon', nome: 'Neon', cor: null }, // usa a cor neon do jogador
];

// Cada peça tem `custo` em ouro. 0 = já vem com a unidade.
export const CATALOGO = {
  chassi: [
    { id: 'pesado', nome: 'Pesado', custo: 0 },
    { id: 'leve', nome: 'Leve', custo: 0 },
  ],
  cabeca: [
    { id: 'domo', nome: 'Domo', custo: 0 },
    { id: 'bloco', nome: 'Bloco', custo: 0 },
    { id: 'cabo', nome: 'Cabo traseiro', custo: 250 },
    { id: 'crista', nome: 'Crista', custo: 250 },
    { id: 'orbe', nome: 'Orbe', custo: 400 },
  ],
  visor: [
    { id: 'olhos', nome: 'Dois sensores', custo: 0 },
    { id: 'faixa', nome: 'Faixa', custo: 0 },
    { id: 'ciclope', nome: 'Ciclope', custo: 200 },
    { id: 'cruz', nome: 'Cruz', custo: 350 },
  ],
  elmo: [
    { id: 'nenhum', nome: 'Aberto', custo: 0 },
    { id: 'calota', nome: 'Calota', custo: 0 },
    { id: 'couro', nome: 'Encouraçado', custo: 300 },
    { id: 'tatico', nome: 'Tático', custo: 900 },
  ],
  peitoral: [
    { id: 'liso', nome: 'Liso', custo: 0 },
    { id: 'ventilado', nome: 'Ventilado', custo: 0 },
    { id: 'blindado', nome: 'Blindado', custo: 150 },
  ],
  couraca: [
    { id: 'nenhuma', nome: 'Nenhuma', custo: 0 },
    { id: 'manto', nome: 'Manto leve', custo: 600 },
    { id: 'reator', nome: 'Couraça reator', custo: 900 },
  ],
  pernas: [
    { id: 'tubular', nome: 'Tubular', custo: 0 },
    { id: 'fina', nome: 'Fina', custo: 0 },
    { id: 'pistao', nome: 'Pistão', custo: 150 },
  ],
  pes: [
    { id: 'leve', nome: 'Leve', custo: 0 },
    { id: 'garra', nome: 'Garra', custo: 400 },
    { id: 'pesado', nome: 'Pesado', custo: 400 },
  ],
};

// Ordem em que as abas aparecem no vestiário.
export const SLOTS = [
  { id: 'chassi', nome: 'Chassi', cores: null },
  { id: 'cabeca', nome: 'Cabeça', cores: 'peca' },
  { id: 'visor', nome: 'Visor', cores: null },
  { id: 'elmo', nome: 'Elmo', cores: 'peca' },
  { id: 'peitoral', nome: 'Peitoral', cores: 'peca' },
  { id: 'couraca', nome: 'Couraça', cores: 'peca' },
  { id: 'pernas', nome: 'Pernas', cores: 'peca' },
  { id: 'pes', nome: 'Pés', cores: 'peca' },
];

export const VISUAL_PADRAO = {
  chassi: 'pesado',
  placa: 'aco',
  cabeca: 'domo', cabecaCor: 'grafite',
  visor: 'olhos',
  elmo: 'nenhum', elmoCor: 'grafite',
  peitoral: 'liso', peitoralCor: 'marinho',
  couraca: 'nenhuma', couracaCor: 'grafite',
  pernas: 'tubular', pernasCor: 'grafite',
  pes: 'leve', pesCor: 'grafite',
};

// Conjuntos prontos, para o jogador novo nao começar diante de oito abas.
export const PRESETS = {
  batedor: { ...VISUAL_PADRAO },
  corredor: {
    ...VISUAL_PADRAO, chassi: 'leve', placa: 'titanio', visor: 'faixa',
    peitoral: 'ventilado', peitoralCor: 'petroleo', pernas: 'fina',
    pes: 'leve', pesCor: 'petroleo',
  },
  bastiao: {
    ...VISUAL_PADRAO, placa: 'grafite', elmo: 'tatico', elmoCor: 'grafite',
    visor: 'faixa', peitoral: 'blindado', couraca: 'reator',
    pernas: 'pistao', pes: 'pesado',
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
    chassi: peca('chassi'),
    placa: corDe(PLACAS, v.placa, '#8b949e'),
    cabeca: peca('cabeca'),
    cabecaCor: corDe(CORES_PECA, v.cabecaCor, neon),
    visor: peca('visor'),
    elmo: peca('elmo'),
    elmoCor: corDe(CORES_PECA, v.elmoCor, neon),
    peitoral: peca('peitoral'),
    peitoralCor: corDe(CORES_PECA, v.peitoralCor, neon),
    couraca: peca('couraca'),
    couracaCor: corDe(CORES_PECA, v.couracaCor, neon),
    pernas: peca('pernas'),
    pernasCor: corDe(CORES_PECA, v.pernasCor, neon),
    pes: peca('pes'),
    pesCor: corDe(CORES_PECA, v.pesCor, neon),
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
  return PLACAS.some((p) => p.id === v.placa);
}
