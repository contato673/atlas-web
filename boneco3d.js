// ATLAS — o personagem em 3D de verdade, sobre o mapa.
//
// Por que aqui e não um arquivo pronto: o Mixamo entrega FBX, e dá para
// carregar FBX com o Three.js sem conversão. Mas enquanto o arquivo não chega,
// o corpo é montado com primitivas aqui mesmo — e isso resolve dois problemas
// de uma vez: a animação passa a ser a perna girando de verdade, em vez de um
// pulinho em CSS, e personalizar vira trocar a cor de um material.
//
// Desenha numa tela transparente POR CIMA do mapa, não dentro dele. É mais
// simples e não depende de acertar a matriz de projeção do MapLibre. O preço
// é que o boneco não fica atrás dos prédios — como ele está sempre no chão e
// perto da câmera, isso quase nunca aparece.
//
// Se o Three.js não carregar ou a placa de vídeo recusar, nada quebra: quem
// chamou continua com o boneco vetorial de sempre.

const FONTES = [
  'https://unpkg.com/three@^0.160/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js',
];

let THREE = null;

async function carregarThree() {
  if (THREE) return THREE;
  for (const url of FONTES) {
    try {
      THREE = await import(/* @vite-ignore */ url);
      if (THREE && THREE.Scene) return THREE;
    } catch { /* tenta a próxima */ }
  }
  throw new Error('Three.js não carregou');
}

const rad = (g) => (g * Math.PI) / 180;

function material(cor, brilho = 0.12) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(cor), roughness: 1 - brilho, metalness: 0.02, flatShading: false,
  });
}

// Corpo em partes agrupadas, para cada uma poder girar sozinha na caminhada.
function montarCorpo({ pele, roupa, calca, sapato, bone, cabelo, detalhe }) {
  const g = new THREE.Group();
  const mPele = material(pele);
  const mRoupa = material(roupa);
  const mCalca = material(calca);
  const mSapato = material(sapato, 0.3);
  const mBone = material(bone);
  const mCabelo = material(cabelo);
  const mDet = material(detalhe, 0.45);
  mDet.emissive = new THREE.Color(detalhe);
  mDet.emissiveIntensity = 0.45;
  const materiais = { pele: mPele, roupa: mRoupa, calca: mCalca, sapato: mSapato, bone: mBone, cabelo: mCabelo, detalhe: mDet };

  const esfera = (r, m, seg = 20) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), m);
  const capsula = (r, h, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 6, 14), m);

  // tronco
  const tronco = new THREE.Group();
  const peito = esfera(1, mRoupa);
  peito.scale.set(0.95, 0.72, 0.62);
  peito.position.y = 1.05;
  const quadril = esfera(1, mRoupa);
  quadril.scale.set(0.82, 0.62, 0.56);
  quadril.position.y = 0.35;
  const faixa = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.95, 0.06), mDet);
  faixa.position.set(0, 0.95, 0.56);
  tronco.add(peito, quadril, faixa);
  tronco.position.y = 2.6;

  // cabeça
  const cabeca = new THREE.Group();
  const cranio = esfera(0.82, mPele, 24);
  cranio.scale.set(1, 1.06, 0.98);
  const nariz = esfera(0.13, mPele, 10);
  nariz.position.set(0, -0.1, 0.78);
  const olhoE = esfera(0.17, material('#f6f8fb', 0.4), 14);
  olhoE.scale.set(1, 0.9, 0.36);
  olhoE.position.set(-0.31, 0.04, 0.73);
  const olhoD = olhoE.clone();
  olhoD.position.x = 0.31;
  const pupE = esfera(0.085, material('#0b1118'), 10);
  pupE.position.set(-0.31, 0.03, 0.82);
  const pupD = pupE.clone();
  pupD.position.x = 0.31;
  const cabelos = esfera(0.85, mCabelo, 20);
  cabelos.scale.set(1.02, 1.06, 1);
  cabelos.position.z = -0.05;
  const calota = esfera(0.87, mBone, 22);
  calota.scale.set(1.03, 0.62, 1.01);
  calota.position.y = 0.3;
  const aba = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.07, 18, 1, false, 0, Math.PI), mBone);
  aba.rotation.x = rad(-8);
  aba.position.set(0, 0.26, 0.42);
  cabeca.add(cabelos, cranio, nariz, olhoE, olhoD, pupE, pupD, calota, aba);
  cabeca.position.y = 4.35;

  // braços: o pivô fica no ombro, para a rotação parecer braço e não aba
  const braco = (lado) => {
    const p = new THREE.Group();
    const b = capsula(0.23, 0.95, mRoupa);
    b.position.y = -0.62;
    const mao = esfera(0.26, mPele, 12);
    mao.position.y = -1.22;
    p.add(b, mao);
    p.position.set(lado * 0.78, 3.42, 0);
    return p;
  };
  const bracoE = braco(-1);
  const bracoD = braco(1);

  // pernas: pivô no quadril
  const perna = (lado) => {
    const p = new THREE.Group();
    const c = capsula(0.3, 1.15, mCalca);
    c.position.y = -0.72;
    const pe = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.3, 0.9), mSapato);
    pe.position.set(0, -1.45, 0.18);
    const sola = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.92), mDet);
    sola.position.set(0, -1.59, 0.18);
    p.add(c, pe, sola);
    p.position.set(lado * 0.42, 2.5, 0);
    return p;
  };
  const pernaE = perna(-1);
  const pernaD = perna(1);

  // sombra de contato: um disco escuro no chão, que é o que assenta o boneco
  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42 }),
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.02;

  g.add(sombra, tronco, cabeca, bracoE, bracoD, pernaE, pernaD);
  return { grupo: g, tronco, cabeca, bracoE, bracoD, pernaE, pernaD, sombra, materiais };
}

export async function criarBoneco(canvas, cores) {
  await carregarThree();
  const cena = new THREE.Scene();

  const render = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  render.setClearColor(0x000000, 0);
  render.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // Câmera a uns 35 graus acima do chão, para casar com a inclinação do mapa.
  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  cam.position.set(0, 7.6, 11.5);
  cam.lookAt(0, 2.6, 0);

  cena.add(new THREE.HemisphereLight(0x9fc4ff, 0x16202c, 1.15));
  const sol = new THREE.DirectionalLight(0xfff0d8, 1.35);
  sol.position.set(-4, 7, 5);
  cena.add(sol);
  const contra = new THREE.DirectionalLight(new THREE.Color(cores.detalhe), 0.7);
  contra.position.set(4, 2.5, -4);
  cena.add(contra);

  const corpo = montarCorpo(cores);
  cena.add(corpo.grupo);

  let fase = 0;
  let ultimo = performance.now();

  function dimensionar(larg, alt) {
    render.setSize(larg, alt, false);
    cam.aspect = larg / alt;
    cam.updateProjectionMatrix();
  }

  function quadro(andando, olhandoPara) {
    const agora = performance.now();
    const dt = Math.min((agora - ultimo) / 1000, 0.1);
    ultimo = agora;

    corpo.grupo.rotation.y = rad(olhandoPara === -1 ? 28 : olhandoPara === 1 ? -28 : 0);

    if (andando) {
      fase += dt * 7.5;
      const s = Math.sin(fase);
      const c = Math.cos(fase);
      corpo.pernaE.rotation.x = s * 0.62;
      corpo.pernaD.rotation.x = -s * 0.62;
      corpo.bracoE.rotation.x = -s * 0.5;
      corpo.bracoD.rotation.x = s * 0.5;
      corpo.tronco.position.y = 2.6 + Math.abs(c) * 0.075;
      corpo.cabeca.position.y = 4.35 + Math.abs(c) * 0.075;
      corpo.tronco.rotation.z = s * 0.025;
      corpo.sombra.scale.setScalar(1 - Math.abs(c) * 0.06);
    } else {
      // parado: respiração lenta, quase imperceptível de propósito
      fase += dt * 1.1;
      const r = Math.sin(fase) * 0.5 + 0.5;
      corpo.pernaE.rotation.x *= 0.85;
      corpo.pernaD.rotation.x *= 0.85;
      corpo.bracoE.rotation.x *= 0.85;
      corpo.bracoD.rotation.x *= 0.85;
      corpo.tronco.rotation.z *= 0.85;
      corpo.tronco.position.y = 2.6 + r * 0.03;
      corpo.cabeca.position.y = 4.35 + r * 0.045;
      corpo.sombra.scale.setScalar(1);
    }
    render.render(cena, cam);
  }

  // Personalizar é trocar a cor do material. É isto que a versão vetorial
  // nunca ia dar de graça: aqui a luz recalcula sozinha em cima da cor nova.
  function pintar(novas) {
    for (const [nome, cor] of Object.entries(novas || {})) {
      const m = corpo.materiais[nome];
      if (m) m.color.set(cor);
      if (nome === 'detalhe') {
        if (m) m.emissive.set(cor);
        contra.color.set(cor);
      }
    }
  }

  return { dimensionar, quadro, pintar, render, cena };
}
