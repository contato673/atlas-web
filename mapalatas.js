// ATLAS — as latinhas desenhadas DENTRO do mapa.
//
// Por que um módulo só para isto: a latinha já foi remendada três vezes, e as
// duas primeiras falharam pela mesma razão de fundo — um elemento do DOM é
// posicionado DEPOIS, por cima de um mapa já desenhado, com arredondamento
// próprio, enquanto a rua foi desenhada pela matriz do mapa. Toda diferença
// entre os dois aparece como deslize, e não há ajuste de marcador que feche
// isso. Como símbolo, a lata passa pela mesma matriz que a rua, no mesmo
// quadro: deslizar deixa de ser possível por construção.
//
// Estando num módulo, a página de teste (teste-latinha.html) consegue montar
// exatamente estas camadas com dados de mentira. Assim o que se confere com os
// olhos é o código que roda no jogo, e não uma imitação dele.

import { LATINHAS, latinhaSVG } from './progresso.js?v=56';
import { circlePolygon } from './geo.js?v=56';

// Raio do disco no chão, em metros. NÃO é o raio de coleta (20 m, fixado pelo
// Miguel): é só a marca visual, e 5 m é mais ou menos a largura de uma calçada.
export const RAIO_CHAO_M = 5;

// Transforma o desenho da lata numa imagem que o MapLibre sabe usar como
// símbolo. Precisa do xmlns, senão o navegador recusa o data URL do SVG.
export function carregarIcones(map) {
  return Promise.all(Object.keys(LATINHAS).map((tipo) => new Promise((pronto) => {
    const id = `lata-${tipo}`;
    if (map.hasImage && map.hasImage(id)) { pronto(true); return; }
    const svg = latinhaSVG({ tipo, tam: 96 })
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    const img = new Image();
    img.onload = () => {
      try { map.addImage(id, img, { pixelRatio: 2 }); pronto(true); } catch { pronto(false); }
    };
    img.onerror = () => pronto(false);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }))).then((r) => r.every(Boolean));
}

const vazio = () => ({ type: 'FeatureCollection', features: [] });

// As camadas de chão. Sobem na hora, porque não dependem de imagem nenhuma.
export function instalarChao(map) {
  if (map.getSource('latas')) return;
  map.addSource('latas', { type: 'geojson', data: vazio() });
  // Opacidade CONSTANTE de propósito. `fill-color` e `line-color` aceitam
  // expressão sem discussão (o território já usa), mas opacidade orientada a
  // dado nem sempre: se o MapLibre recusar, a camada só não pinta — sem erro,
  // sem aviso, sem rastro. Já perdi uma rodada inteira por causa disso.
  map.addLayer({
    id: 'latas-chao', type: 'fill', source: 'latas',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: { 'fill-color': ['get', 'cor'], 'fill-opacity': 0.14 },
  });
  map.addLayer({
    id: 'latas-borda', type: 'line', source: 'latas',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: { 'line-color': ['get', 'cor'], 'line-width': 2, 'line-opacity': 0.55 },
  });
  map.addLayer({
    id: 'latas-perto', type: 'line', source: 'latas',
    filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', ['get', 'perto'], true]],
    paint: { 'line-color': ['get', 'cor'], 'line-width': 3, 'line-opacity': 0.95, 'line-blur': 1 },
  });
}

// A camada do ícone, que só pode subir depois das imagens carregarem.
export async function instalarIcone(map, aoTocar) {
  if (map.getLayer('latas-icone')) return true;
  const ok = await carregarIcones(map);
  if (!ok) return false;
  map.addLayer({
    id: 'latas-icone', type: 'symbol', source: 'latas',
    filter: ['==', ['geometry-type'], 'Point'],
    layout: {
      'icon-image': ['get', 'icone'],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-size': ['case', ['get', 'perto'], 0.62, 0.52],
    },
  });
  if (aoTocar) {
    map.on('click', 'latas-icone', (e) => aoTocar(e.features[0].properties.celula));
    map.on('mouseenter', 'latas-icone', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'latas-icone', () => { map.getCanvas().style.cursor = ''; });
  }
  return true;
}

// O disco no chão e o ponto do ícone saem na MESMA coordenada, de propósito:
// é isso que faz a lata parecer plantada naquele ponto e não pairando perto
// dele. O ícone é ancorado pelo pé, então o pé cai no centro do disco.
// O tipo é normalizado UMA vez e serve para a cor e para o ícone. Antes a cor
// caía para 'lata' quando o tipo era desconhecido, mas o nome do ícone não:
// sobrava um disco no chão sem lata nenhuma em cima, e sem nada para tocar.
// Isso aconteceria de verdade no dia em que o servidor ganhasse um tipo novo
// antes de o celular atualizar o cliente.
export const tipoConhecido = (tipo) => (LATINHAS[tipo] ? tipo : 'lata');

export function feicoes(spawns, ehPerto) {
  const fs = [];
  for (const s of spawns) {
    const tipo = tipoConhecido(s.tipo);
    const cor = LATINHAS[tipo].cor;
    const perto = Boolean(ehPerto && ehPerto(s));
    const disco = circlePolygon({ lat: s.lat, lng: s.lng }, RAIO_CHAO_M, 24);
    disco.properties = { cor, perto, celula: s.celula };
    fs.push(disco);
    fs.push({
      type: 'Feature',
      properties: { cor, perto, celula: s.celula, icone: `lata-${tipo}` },
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
    });
  }
  return { type: 'FeatureCollection', features: fs };
}

export function atualizar(map, spawns, ehPerto) {
  const fonte = map.getSource && map.getSource('latas');
  if (fonte) fonte.setData(feicoes(spawns, ehPerto));
}
