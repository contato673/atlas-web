// ATLAS — o personagem em 3D, sobre o mapa.
//
// Por que facetado e nao liso: as versoes anteriores tentavam parecer gente
// usando esferas lisas, e esfera lisa sem silhueta sempre le como plastico.
// Aqui a geometria e assumidamente baixa — poucas faces, quinas visiveis,
// flatShading ligado — e isso le como estilo, nao como tentativa falhada.
// Proporcao chibi (cabeca grande), viseira no lugar dos olhos, ombreiras e
// botas pesadas: a silhueta se reconhece de longe, que e o que importa num
// boneco de 60 pixels em cima de um mapa.
//
// Desenha numa tela transparente POR CIMA do mapa, nao dentro dele. Mais
// simples e sem depender da matriz de projecao do MapLibre. O preco e o boneco
// nao ficar atras dos predios — como esta sempre no chao e perto da camera,
// quase nunca aparece.
//
// Se o Three.js nao carregar ou a placa recusar, nada quebra: quem chamou
// continua com o boneco vetorial de sempre.

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
    } catch { /* tenta a proxima */ }
  }
  throw new Error('Three.js nao carregou');
}

const rad = (g) => (g * Math.PI) / 180;

// Tudo facetado de proposito. roughness alto deixa a face chapada, que e o
// que faz cada quina aparecer como um tom diferente.
function mat(cor, { brilho = 0.1, metal = 0.05, liso = false } = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(cor),
    roughness: 1 - brilho,
    metalness: metal,
    flatShading: !liso,
  });
}

// O vidro da viseira: liso e aceso, para contrastar com o resto chapado.
function matVidro(cor) {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cor), roughness: 0.22, metalness: 0.35, flatShading: false,
  });
  m.emissive = new THREE.Color(cor);
  m.emissiveIntensity = 0.95;
  return m;
}

export function montarCorpo(cores) {
  const { pele, roupa, calca, sapato, bone, cabelo, detalhe } = cores;

  const mPele = mat(pele, { brilho: 0.14 });
  const mFato = mat(roupa, { brilho: 0.16, metal: 0.12 });
  const mCalca = mat(calca, { brilho: 0.12 });
  const mBota = mat(sapato, { brilho: 0.24, metal: 0.2 });
  const mCapacete = mat(bone, { brilho: 0.26, metal: 0.3 });
  const mInterno = mat(cabelo, { brilho: 0.08 });
  const mNeon = matVidro(detalhe);
  const materiais = {
    pele: mPele, roupa: mFato, calca: mCalca, sapato: mBota,
    bone: mCapacete, cabelo: mInterno, detalhe: mNeon,
  };

  // Icosaedro = esfera com poucas faces. detalhe 0 da 20 faces (bem anguloso),
  // detalhe 1 da 80 (arredondado, mas ainda com quina).
  const pedra = (r, m, det = 1) => new THREE.Mesh(new THREE.IcosahedronGeometry(r, det), m);
  const caixa = (x, y, z, m) => new THREE.Mesh(new THREE.BoxGeometry(x, y, z), m);
  const cone = (rc, rb, h, m, lados = 8) => new THREE.Mesh(new THREE.CylinderGeometry(rc, rb, h, lados), m);

  const g = new THREE.Group();

  // Proporcao: a cabeca e uns 30% da altura. Menos que isso vira boneco de
  // acao magro, que some no mapa; mais vira bebe.
  const QUADRIL = 1.78;
  const OMBRO = 3.08;
  const PESCOCO = 3.26;

  // ---- pernas: pivo no quadril, para a rotacao parecer perna
  const perna = (lado) => {
    const p = new THREE.Group();
    const coxa = cone(0.3, 0.24, 1.15, mCalca, 6);
    coxa.position.y = -0.58;
    // faixa em volta da perna, e nao uma pedra na frente: a pedra lia como
    // um coracao neon flutuando no ar.
    const joelheira = cone(0.27, 0.27, 0.09, mNeon, 6);
    joelheira.position.y = -0.6;
    const bota = caixa(0.5, 0.56, 0.82, mBota);
    bota.position.set(0, -1.5, 0.08);
    const bico = caixa(0.46, 0.2, 0.12, mInterno);
    bico.position.set(0, -1.68, 0.47);
    const risca = caixa(0.52, 0.08, 0.2, mNeon);
    risca.position.set(0, -1.34, 0.44);
    p.add(coxa, joelheira, bota, bico, risca);
    p.position.set(lado * 0.3, QUADRIL, 0);
    return p;
  };
  const pernaE = perna(-1);
  const pernaD = perna(1);

  // ---- tronco: trapezio de 8 lados. Ombro largo, cintura fina.
  const tronco = new THREE.Group();
  const peito = cone(0.92, 0.58, 1.5, mFato, 8);
  peito.position.y = 0.78;
  const cinto = cone(0.6, 0.6, 0.16, mInterno, 8);
  cinto.position.y = 0.1;
  const fivela = caixa(0.26, 0.14, 0.1, mNeon);
  fivela.position.set(0, 0.1, 0.61);
  // V aceso no peito: le a silhueta de longe melhor que qualquer detalhe fino
  const galao = (lado) => {
    const c = caixa(0.56, 0.11, 0.1, mNeon);
    c.position.set(lado * 0.2, 1.08, 0.8);
    c.rotation.z = lado * rad(28);
    return c;
  };
  const mochila = caixa(0.7, 0.72, 0.3, mCapacete);
  mochila.position.set(0, 0.9, -0.55);
  const vento = caixa(0.12, 0.36, 0.1, mNeon);
  vento.position.set(-0.2, 0.9, -0.72);
  const ventoD = vento.clone();
  ventoD.position.x = 0.2;
  const ombreira = (lado) => {
    const o = pedra(0.44, mCapacete, 0);
    o.scale.set(1, 0.68, 1);
    o.position.set(lado * 0.9, 1.35, 0);
    o.rotation.z = lado * rad(-14);
    return o;
  };
  tronco.add(peito, cinto, fivela, galao(-1), galao(1), mochila, vento, ventoD, ombreira(-1), ombreira(1));
  tronco.position.y = QUADRIL;

  // ---- bracos: pivo no ombro. Curtos de proposito: na versao anterior a mao
  // passava do joelho e o boneco ficava com braco de gorila.
  const braco = (lado) => {
    const p = new THREE.Group();
    const b = cone(0.2, 0.16, 0.82, mFato, 6);
    b.position.y = -0.44;
    const bracelete = cone(0.19, 0.19, 0.1, mNeon, 6);
    bracelete.position.y = -0.84;
    const mao = pedra(0.21, mPele, 0);
    mao.position.y = -1.0;
    p.add(b, bracelete, mao);
    p.position.set(lado * 0.86, OMBRO, 0);
    return p;
  };
  const bracoE = braco(-1);
  const bracoD = braco(1);

  // ---- cabeca: grande de proposito, com viseira no lugar dos olhos
  const cabeca = new THREE.Group();
  const gola = cone(0.42, 0.5, 0.24, mInterno, 8);
  gola.position.y = 0.02;
  const cranio = pedra(0.72, mPele, 1);
  cranio.scale.set(1, 1.02, 0.94);
  cranio.position.y = 0.66;
  // calota: meia esfera de poucos gomos, cobrindo da testa para cima
  const calota = new THREE.Mesh(
    new THREE.SphereGeometry(0.76, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.56), mCapacete,
  );
  calota.position.y = 0.7;
  calota.scale.set(1, 1.1, 0.98);
  // viseira: casca de cilindro abracando a frente do rosto
  const viseira = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.66, 0.36, 16, 1, true, rad(-62), rad(124)), mNeon,
  );
  viseira.position.set(0, 0.72, 0.02);
  const moldura = new THREE.Mesh(
    new THREE.CylinderGeometry(0.73, 0.69, 0.48, 16, 1, true, rad(-66), rad(132)), mInterno,
  );
  moldura.position.set(0, 0.72, 0.02);
  const queixo = pedra(0.4, mPele, 1);
  queixo.scale.set(0.95, 0.6, 0.88);
  queixo.position.set(0, 0.3, 0.18);
  const barbicha = caixa(0.3, 0.09, 0.1, mInterno);
  barbicha.position.set(0, 0.24, 0.54);
  // crista no alto do capacete, da testa para a nuca: e o que da silhueta.
  // A antena lateral anterior virava um ponto solto no ar, porque a haste
  // escura sumia no fundo escuro e so a ponta acesa aparecia.
  const crista = caixa(0.09, 0.26, 0.46, mNeon);
  crista.position.set(0, 1.5, -0.02);
  const cristaBase = caixa(0.15, 0.16, 0.54, mCapacete);
  cristaBase.position.set(0, 1.4, -0.02);
  cabeca.add(gola, cranio, queixo, calota, moldura, viseira, barbicha, cristaBase, crista);
  cabeca.position.y = PESCOCO;

  // ---- sombra de contato: e isto que assenta o boneco no chao
  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 }),
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.02;

  g.add(sombra, pernaE, pernaD, tronco, cabeca, bracoE, bracoD);
  return {
    grupo: g, tronco, cabeca, bracoE, bracoD, pernaE, pernaD, sombra, materiais,
    base: { tronco: QUADRIL, cabeca: PESCOCO },
  };
}

export async function criarBoneco(canvas, cores) {
  await carregarThree();
  const cena = new THREE.Scene();

  const render = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  render.setClearColor(0x000000, 0);
  render.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // Camera uns 33 graus acima do chao, para casar com a inclinacao do mapa.
  const cam = new THREE.PerspectiveCamera(27, 1, 0.1, 100);
  cam.position.set(0, 5.9, 9.5);
  cam.lookAt(0, 2.25, 0);

  // Luz dura de um lado e fria do outro: e o contraste entre as duas que faz
  // a face facetada aparecer. Com luz chapada o low-poly vira mancha.
  cena.add(new THREE.HemisphereLight(0x8fb6ff, 0x101820, 0.85));
  const sol = new THREE.DirectionalLight(0xfff4e2, 1.5);
  sol.position.set(-4.5, 6.5, 4.5);
  cena.add(sol);
  const contra = new THREE.DirectionalLight(new THREE.Color(cores.detalhe), 1.1);
  contra.position.set(4.5, 2.2, -4);
  cena.add(contra);
  const chao = new THREE.DirectionalLight(0x2a3a52, 0.5);
  chao.position.set(0, -3, 2);
  cena.add(chao);

  const corpo = montarCorpo(cores);
  cena.add(corpo.grupo);

  let fase = 0;
  let ultimo = performance.now();

  function dimensionar(larg, alt) {
    render.setSize(larg, alt, false);
    cam.aspect = larg / alt;
    cam.updateProjectionMatrix();
  }

  // anguloLivre existe para o vestiario, onde o jogador gira o boneco a dedo.
  function quadro(andando, olhandoPara, anguloLivre) {
    const agora = performance.now();
    const dt = Math.min((agora - ultimo) / 1000, 0.1);
    ultimo = agora;

    if (typeof anguloLivre === 'number') {
      corpo.grupo.rotation.y = anguloLivre;
    } else {
      const alvo = rad(olhandoPara === -1 ? 30 : olhandoPara === 1 ? -30 : 0);
      corpo.grupo.rotation.y += (alvo - corpo.grupo.rotation.y) * Math.min(dt * 6, 1);
    }

    if (andando) {
      fase += dt * 7.2;
      const s = Math.sin(fase);
      const c = Math.cos(fase);
      corpo.pernaE.rotation.x = s * 0.6;
      corpo.pernaD.rotation.x = -s * 0.6;
      corpo.bracoE.rotation.x = -s * 0.46;
      corpo.bracoD.rotation.x = s * 0.46;
      // o quique vem do passo, entao segue |cos| e nao sen
      corpo.tronco.position.y = corpo.base.tronco + Math.abs(c) * 0.08;
      corpo.cabeca.position.y = corpo.base.cabeca + Math.abs(c) * 0.08;
      corpo.tronco.rotation.y = s * 0.09;
      corpo.cabeca.rotation.y = -s * 0.05;
      corpo.sombra.scale.setScalar(1 - Math.abs(c) * 0.07);
    } else {
      // parado: respiracao lenta e um peso que desce, nada de balanco
      fase += dt * 1.05;
      const r = Math.sin(fase) * 0.5 + 0.5;
      const frear = Math.min(dt * 7, 1);
      for (const parte of [corpo.pernaE, corpo.pernaD, corpo.bracoE, corpo.bracoD]) {
        parte.rotation.x += (0 - parte.rotation.x) * frear;
      }
      corpo.tronco.rotation.y += (0 - corpo.tronco.rotation.y) * frear;
      corpo.cabeca.rotation.y += (0 - corpo.cabeca.rotation.y) * frear;
      corpo.tronco.position.y = corpo.base.tronco + r * 0.035;
      corpo.cabeca.position.y = corpo.base.cabeca + r * 0.05;
      corpo.sombra.scale.setScalar(1);
    }
    render.render(cena, cam);
  }

  // Personalizar e trocar a cor de um material: a luz recalcula sozinha em
  // cima da cor nova. E isto que a versao vetorial nunca ia dar de graca.
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

  return { dimensionar, quadro, pintar, render, cena, corpo };
}
