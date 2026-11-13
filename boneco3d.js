// ATLAS — o personagem em 3D, montado peça por peça.
//
// Por que facetado e nao liso: as versoes anteriores tentavam parecer gente
// usando esferas lisas, e esfera lisa sem silhueta le como plastico. Aqui a
// geometria e assumidamente baixa — poucas faces, quinas visiveis — e isso le
// como estilo, nao como tentativa falhada de realismo.
//
// A divisao de trabalho: o visual.js diz O QUE existe e ja entrega tudo
// resolvido em cor; este arquivo so sabe DESENHAR. Trocar de peça remonta a
// geometria; trocar de cor so troca a cor do material, sem remontar nada.
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

// Tudo facetado de proposito: roughness alto deixa a face chapada, que e o
// que faz cada quina aparecer como um tom diferente.
function mat(cor, { brilho = 0.1, metal = 0.05, liso = false } = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(cor), roughness: 1 - brilho,
    metalness: metal, flatShading: !liso,
  });
}

// Vidro aceso: liso, para contrastar com o resto chapado.
function matVidro(cor) {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cor), roughness: 0.22, metalness: 0.35, flatShading: false,
  });
  m.emissive = new THREE.Color(cor);
  m.emissiveIntensity = 0.95;
  return m;
}

// Duas silhuetas. A diferenca esta no ombro, na cintura e no quadril, que e
// o que de fato se le num boneco de 60 pixels — nao em detalhe de rosto.
const FORMA = {
  masculino: {
    ombro: 0.92, cintura: 0.58, xOmbro: 0.88, xQuadril: 0.30, perna: 0.33,
    braco: 0.20, rCabeca: 0.72, quadril: 1.78, ombroY: 3.08, pescoco: 3.26,
  },
  feminino: {
    ombro: 0.78, cintura: 0.52, xOmbro: 0.76, xQuadril: 0.33, perna: 0.30,
    braco: 0.175, rCabeca: 0.70, quadril: 1.74, ombroY: 3.0, pescoco: 3.18,
  },
};

export function montarCorpo(v) {
  const f = FORMA[v.corpo] || FORMA.masculino;

  const mPele = mat(v.pele, { brilho: 0.14 });
  const mCabelo = mat(v.cabeloCor, { brilho: 0.1 });
  const mCapacete = mat(v.capaceteCor, { brilho: 0.26, metal: 0.3 });
  const mCamiseta = mat(v.camisetaCor, { brilho: 0.16, metal: 0.08 });
  const mCasaco = mat(v.casacoCor, { brilho: 0.18, metal: 0.12 });
  const mCalca = mat(v.calcaCor, { brilho: 0.12 });
  const mTenis = mat(v.tenisCor, { brilho: 0.24, metal: 0.18 });
  const mNeon = matVidro(v.neon);
  const mEscuro = mat('#10151c', { brilho: 0.06 });
  const materiais = {
    pele: mPele, cabelo: mCabelo, capacete: mCapacete, camiseta: mCamiseta,
    casaco: mCasaco, calca: mCalca, tenis: mTenis, neon: mNeon,
  };

  // Icosaedro = esfera com poucas faces. detalhe 0 da 20 faces (bem anguloso),
  // detalhe 1 da 80 (arredondado, mas ainda com quina).
  const pedra = (r, m, det = 1) => new THREE.Mesh(new THREE.IcosahedronGeometry(r, det), m);
  const caixa = (x, y, z, m) => new THREE.Mesh(new THREE.BoxGeometry(x, y, z), m);
  const cone = (rc, rb, h, m, lados = 8) => new THREE.Mesh(new THREE.CylinderGeometry(rc, rb, h, lados), m);
  const casca = (rc, rb, h, m, de, arco, lados = 16) => new THREE.Mesh(
    new THREE.CylinderGeometry(rc, rb, h, lados, 1, true, rad(de), rad(arco)), m,
  );
  const cupula = (r, m, parte = 0.56, gomos = 12) => new THREE.Mesh(
    new THREE.SphereGeometry(r, gomos, 6, 0, Math.PI * 2, 0, Math.PI * parte), m,
  );

  const g = new THREE.Group();

  /* ---------------- pernas ---------------- */
  // O pivo fica no quadril, para a rotacao da caminhada parecer perna.
  const perna = (lado) => {
    const p = new THREE.Group();
    const r = f.perna;

    if (v.calca === 'short') {
      const bermuda = cone(r, r * 0.95, 0.56, mCalca, 6);
      bermuda.position.y = -0.28;
      const canela = cone(r * 0.78, r * 0.6, 0.66, mPele, 6);
      canela.position.y = -0.9;
      p.add(bermuda, canela);
    } else if (v.calca === 'legging') {
      const l = cone(r * 0.88, r * 0.7, 1.15, mCalca, 6);
      l.position.y = -0.58;
      const faixa = cone(r * 0.72, r * 0.72, 0.08, mNeon, 6);
      faixa.position.y = -1.08;
      p.add(l, faixa);
    } else { // cargo
      const l = cone(r, r * 0.84, 1.15, mCalca, 6);
      l.position.y = -0.58;
      const bolso = caixa(0.1, 0.26, 0.2, mEscuro);
      bolso.position.set(lado * (r * 0.9), -0.62, 0.06);
      const joelheira = cone(r * 0.9, r * 0.9, 0.09, mNeon, 6);
      joelheira.position.y = -0.6;
      p.add(l, bolso, joelheira);
    }

    if (v.tenis === 'bota') {
      const b = caixa(0.5, 0.56, 0.82, mTenis);
      b.position.set(0, -1.5, 0.08);
      const bico = caixa(0.46, 0.2, 0.12, mEscuro);
      bico.position.set(0, -1.68, 0.47);
      const risca = caixa(0.52, 0.08, 0.2, mNeon);
      risca.position.set(0, -1.34, 0.44);
      p.add(b, bico, risca);
    } else if (v.tenis === 'chunky') {
      const b = caixa(0.58, 0.44, 0.9, mTenis);
      b.position.set(0, -1.5, 0.1);
      const sola = caixa(0.62, 0.14, 0.94, mEscuro);
      sola.position.set(0, -1.71, 0.1);
      const risca = caixa(0.64, 0.07, 0.3, mNeon);
      risca.position.set(0, -1.64, 0.48);
      p.add(b, sola, risca);
    } else { // corrida
      const b = caixa(0.44, 0.32, 0.8, mTenis);
      b.position.set(0, -1.6, 0.1);
      const sola = caixa(0.47, 0.1, 0.84, mEscuro);
      sola.position.set(0, -1.73, 0.1);
      const risca = caixa(0.46, 0.06, 0.34, mNeon);
      risca.position.set(0, -1.58, 0.1);
      risca.rotation.y = rad(90);
      risca.position.set(lado * 0.22, -1.58, 0.1);
      p.add(b, sola, risca);
    }

    p.position.set(lado * f.xQuadril, f.quadril, 0);
    return p;
  };
  const pernaE = perna(-1);
  const pernaD = perna(1);

  /* ---------------- tronco ---------------- */
  const tronco = new THREE.Group();
  const altoDoTronco = f.ombroY - f.quadril + 0.42; // ate o ombro, com folga

  if (v.camiseta === 'regata') {
    const peito = cone(f.ombro * 0.95, f.cintura, altoDoTronco - 0.34, mCamiseta, 8);
    peito.position.y = (altoDoTronco - 0.34) / 2 + 0.03;
    const pescocoNu = cone(f.ombro, f.ombro * 0.95, 0.34, mPele, 8);
    pescocoNu.position.y = altoDoTronco - 0.14;
    const alca = (lado) => {
      const a = caixa(0.13, 0.42, 0.1, mCamiseta);
      a.position.set(lado * f.ombro * 0.42, altoDoTronco - 0.2, f.ombro * 0.62);
      return a;
    };
    tronco.add(peito, pescocoNu, alca(-1), alca(1));
  } else {
    const peito = cone(f.ombro, f.cintura, altoDoTronco, mCamiseta, 8);
    peito.position.y = altoDoTronco / 2 + 0.03;
    tronco.add(peito);
  }

  if (v.casaco !== 'nenhum') {
    const grosso = v.casaco === 'jaqueta' ? 0.07 : 0.04;
    const capa = cone(f.ombro + grosso, f.cintura + grosso + 0.02, altoDoTronco - 0.12, mCasaco, 8);
    capa.position.y = (altoDoTronco - 0.12) / 2 + 0.06;
    const gola = cone(f.ombro * 0.6, f.ombro * 0.78, v.casaco === 'jaqueta' ? 0.34 : 0.22, mCasaco, 8);
    gola.position.y = altoDoTronco + 0.04;
    // ziper aceso: e o que mostra que tem um casaco por cima, e nao so outra cor
    const ziper = caixa(0.07, altoDoTronco - 0.3, 0.07, mNeon);
    ziper.position.set(0, altoDoTronco / 2, f.cintura + grosso + 0.2);
    tronco.add(capa, gola, ziper);
    if (v.casaco === 'jaqueta') {
      const ombreira = (lado) => {
        const o = pedra(0.39, mCasaco, 0);
        o.scale.set(1, 0.68, 1);
        o.position.set(lado * (f.xOmbro - 0.02), altoDoTronco - 0.1, 0);
        o.rotation.z = lado * rad(-14);
        return o;
      };
      tronco.add(ombreira(-1), ombreira(1));
    }
  }

  const cinto = cone(f.cintura + 0.03, f.cintura + 0.03, 0.16, mEscuro, 8);
  cinto.position.y = 0.1;
  const fivela = caixa(0.26, 0.14, 0.1, mNeon);
  fivela.position.set(0, 0.1, f.cintura + 0.06);
  // V aceso no peito: le a silhueta de longe melhor que qualquer detalhe fino
  const galao = (lado) => {
    const c = caixa(0.5, 0.11, 0.1, mNeon);
    const h = altoDoTronco * 0.68;
    const raio = f.cintura + (f.ombro - f.cintura) * (h / altoDoTronco);
    c.position.set(lado * 0.18, h, raio * 0.94 + (v.casaco !== 'nenhum' ? 0.08 : 0.02));
    c.rotation.z = lado * rad(28);
    return c;
  };
  // mochila de energia: alem de silhueta, e o item do jogo
  const mochila = caixa(0.68, 0.7, 0.3, mCapacete);
  mochila.position.set(0, altoDoTronco * 0.62, -(f.cintura + 0.28));
  const vento = caixa(0.12, 0.34, 0.1, mNeon);
  vento.position.set(-0.2, altoDoTronco * 0.62, -(f.cintura + 0.45));
  const ventoD = vento.clone();
  ventoD.position.x = 0.2;
  tronco.add(cinto, fivela, galao(-1), galao(1), mochila, vento, ventoD);
  tronco.position.y = f.quadril;

  /* ---------------- bracos ---------------- */
  // Quanto da manga cobre o braco depende da camiseta e do casaco.
  const mManga = v.casaco !== 'nenhum' ? mCasaco : mCamiseta;
  const cobertura = v.camiseta === 'regata' && v.casaco === 'nenhum' ? 0
    : (v.camiseta === 'longa' || v.casaco !== 'nenhum') ? 1 : 0.5;

  const braco = (lado) => {
    const p = new THREE.Group();
    const r = f.braco;
    if (cobertura >= 1) {
      const b = cone(r, r * 0.8, 0.82, mManga, 6);
      b.position.y = -0.44;
      p.add(b);
    } else if (cobertura > 0) {
      const manga = cone(r, r * 0.86, 0.42, mManga, 6);
      manga.position.y = -0.24;
      const antebraco = cone(r * 0.84, r * 0.74, 0.42, mPele, 6);
      antebraco.position.y = -0.64;
      p.add(manga, antebraco);
    } else {
      const b = cone(r, r * 0.78, 0.82, mPele, 6);
      b.position.y = -0.44;
      p.add(b);
    }
    const bracelete = cone(r * 0.95, r * 0.95, 0.1, mNeon, 6);
    bracelete.position.y = -0.84;
    const mao = pedra(r * 1.05, mPele, 0);
    mao.position.y = -1.0;
    p.add(bracelete, mao);
    p.position.set(lado * f.xOmbro, f.ombroY, 0);
    return p;
  };
  const bracoE = braco(-1);
  const bracoD = braco(1);

  /* ---------------- cabeca ---------------- */
  const cabeca = new THREE.Group();
  const R = f.rCabeca;
  const gola = cone(R * 0.58, R * 0.7, 0.24, mEscuro, 8);
  gola.position.y = 0.02;
  const cranio = pedra(R, mPele, 1);
  cranio.scale.set(1, 1.02, 0.94);
  cranio.position.y = R * 0.92;
  const queixo = pedra(R * 0.56, mPele, 1);
  queixo.scale.set(0.95, 0.6, 0.88);
  queixo.position.set(0, R * 0.42, R * 0.25);
  cabeca.add(gola, cranio, queixo);

  const alturaOlho = R * 1.0;
  const frente = R * 0.9;

  // rosto: so aparece se nao houver viseira na frente
  if (v.viseira === 'nenhuma') {
    const olho = (lado) => {
      const o = pedra(R * 0.2, mEscuro, 1);
      o.scale.set(1, 0.72, 0.4);
      o.position.set(lado * R * 0.36, alturaOlho, frente * 0.84);
      return o;
    };
    const brilho = (lado) => {
      const b = pedra(R * 0.06, matVidro('#e9f4ff'), 0);
      b.position.set(lado * R * 0.42, alturaOlho + R * 0.06, frente * 0.92);
      return b;
    };
    const boca = caixa(R * 0.38, R * 0.07, 0.08, mEscuro);
    boca.position.set(0, R * 0.5, frente * 0.72);
    cabeca.add(olho(-1), olho(1), brilho(-1), brilho(1), boca);
  } else if (v.viseira === 'faixa') {
    const moldura = casca(R * 1.01, R * 0.96, R * 0.67, mEscuro, -66, 132);
    moldura.position.y = alturaOlho;
    const vidro = casca(R * 0.97, R * 0.92, R * 0.5, mNeon, -62, 124);
    vidro.position.y = alturaOlho;
    const barbicha = caixa(R * 0.42, 0.09, 0.1, mEscuro);
    barbicha.position.set(0, R * 0.4, frente * 0.78);
    cabeca.add(moldura, vidro, barbicha);
  } else { // oculos
    const lente = (lado) => {
      const l = caixa(R * 0.42, R * 0.26, 0.1, mNeon);
      l.position.set(lado * R * 0.34, alturaOlho, frente * 0.86);
      l.rotation.y = lado * rad(-10);
      return l;
    };
    const ponte = caixa(R * 0.3, 0.07, 0.08, mEscuro);
    ponte.position.set(0, alturaOlho, frente * 0.9);
    const haste = (lado) => {
      const h = caixa(0.07, 0.07, R * 0.6, mEscuro);
      h.position.set(lado * R * 0.74, alturaOlho, frente * 0.2);
      return h;
    };
    const boca = caixa(R * 0.36, R * 0.07, 0.08, mEscuro);
    boca.position.set(0, R * 0.5, frente * 0.72);
    cabeca.add(lente(-1), lente(1), ponte, haste(-1), haste(1), boca);
  }

  // cabelo: so com a cabeca descoberta. Capacete por cima some com o cabelo,
  // que e o que acontece de verdade e evita cabelo atravessando capacete.
  if (v.capacete === 'nenhum' && v.cabelo !== 'raspado') {
    const toca = cupula(R * 1.03, mCabelo, 0.52, 12);
    toca.position.y = R * 0.95;
    toca.scale.set(1, 1.05, 0.98);
    cabeca.add(toca);
    if (v.cabelo === 'rabo') {
      const rabo = cone(R * 0.2, R * 0.12, R * 0.9, mCabelo, 6);
      rabo.position.set(0, R * 0.82, -R * 0.95);
      rabo.rotation.x = rad(28);
      cabeca.add(rabo);
    } else if (v.cabelo === 'coque') {
      const bola = pedra(R * 0.3, mCabelo, 1);
      bola.position.set(0, R * 1.62, -R * 0.42);
      cabeca.add(bola);
    } else if (v.cabelo === 'moicano') {
      // aqui a crista funciona: cabelo escuro contra cabeca clara tem contraste
      const crista = caixa(R * 0.2, R * 0.48, R * 1.3, mCabelo);
      crista.position.set(0, R * 1.78, -R * 0.08);
      cabeca.add(crista);
    }
  } else if (v.capacete === 'nenhum' && v.cabelo === 'raspado') {
    const sombra = cupula(R * 1.005, mCabelo, 0.45, 10);
    sombra.position.y = R * 0.95;
    cabeca.add(sombra);
  }

  if (v.capacete === 'calota' || v.capacete === 'tatico') {
    const calota = cupula(R * 1.06, mCapacete, 0.56, 12);
    calota.position.y = R * 0.97;
    calota.scale.set(1, 1.1, 0.98);
    cabeca.add(calota);
  }
  if (v.capacete === 'capuz') {
    const capuz = cupula(R * 1.2, mCasaco, 0.72, 10);
    capuz.position.y = R * 0.92;
    capuz.scale.set(1.02, 1.12, 1.08);
    const nuca = pedra(R * 0.6, mCasaco, 1);
    nuca.scale.set(1, 0.9, 0.8);
    nuca.position.set(0, R * 0.9, -R * 0.78);
    cabeca.add(capuz, nuca);
  }
  if (v.capacete === 'tatico') {
    // Aletas nas laterais, e nao crista no alto: uma barbatana de 0,09 de
    // espessura vista de frente e um fio, e o jogador olha o boneco de frente
    // o tempo todo. Aleta lateral aparece de frente e de perfil.
    const aleta = (lado) => {
      const a = new THREE.Group();
      const base = caixa(0.1, 0.3, 0.3, mCapacete);
      const acesa = caixa(0.07, 0.3, 0.16, mNeon);
      acesa.position.set(lado * 0.04, 0.12, -0.02);
      a.add(base, acesa);
      a.position.set(lado * (R * 0.97), R * 1.38, -0.06);
      a.rotation.z = lado * rad(-20);
      a.rotation.x = rad(16);
      return a;
    };
    const lombada = caixa(0.16, 0.14, R * 0.86, mCapacete);
    lombada.position.set(0, R * 2.08, -0.02);
    cabeca.add(lombada, aleta(-1), aleta(1));
  }
  cabeca.position.y = f.pescoco;

  /* ---------------- sombra de contato ---------------- */
  // E isto que assenta o boneco no chao.
  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 }),
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.02;

  g.add(sombra, pernaE, pernaD, tronco, cabeca, bracoE, bracoD);
  return {
    grupo: g, tronco, cabeca, bracoE, bracoD, pernaE, pernaD, sombra, materiais,
    base: { tronco: f.quadril, cabeca: f.pescoco },
  };
}

export async function criarBoneco(canvas, visual) {
  await carregarThree();
  const cena = new THREE.Scene();

  const render = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  render.setClearColor(0x000000, 0);
  render.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // Camera uns 33 graus acima do chao, para casar com a inclinacao do mapa.
  const cam = new THREE.PerspectiveCamera(27, 1, 0.1, 100);
  cam.position.set(0, 5.9, 9.5);
  cam.lookAt(0, 2.25, 0);

  // Luz dura de um lado e fria do outro: e o contraste entre as duas que faz a
  // face facetada aparecer. Com luz chapada o low-poly vira mancha.
  cena.add(new THREE.HemisphereLight(0x8fb6ff, 0x101820, 0.85));
  const sol = new THREE.DirectionalLight(0xfff4e2, 1.5);
  sol.position.set(-4.5, 6.5, 4.5);
  cena.add(sol);
  const contra = new THREE.DirectionalLight(new THREE.Color(visual.neon), 1.1);
  contra.position.set(4.5, 2.2, -4);
  cena.add(contra);
  const chao = new THREE.DirectionalLight(0x2a3a52, 0.5);
  chao.position.set(0, -3, 2);
  cena.add(chao);

  let corpo = montarCorpo(visual);
  cena.add(corpo.grupo);

  let fase = 0;
  let ultimo = performance.now();
  let anguloAtual = 0;

  function dimensionar(larg, alt) {
    render.setSize(larg, alt, false);
    cam.aspect = larg / alt;
    cam.updateProjectionMatrix();
  }

  // Joga fora a geometria antiga de verdade: sem isto, cada troca de roupa
  // deixa malha na memoria da placa e o celular vai ficando lento.
  function descartar(raiz) {
    raiz.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
  }

  // Trocar de peça remonta; trocar de cor so repinta.
  function vestir(novo) {
    const guardaAngulo = corpo.grupo.rotation.y;
    cena.remove(corpo.grupo);
    descartar(corpo.grupo);
    corpo = montarCorpo(novo);
    corpo.grupo.rotation.y = guardaAngulo;
    cena.add(corpo.grupo);
    contra.color.set(novo.neon);
  }

  function pintar(novas) {
    for (const [nome, cor] of Object.entries(novas || {})) {
      const m = corpo.materiais[nome];
      if (m && cor) m.color.set(cor);
      if (nome === 'neon' && cor) {
        if (m) m.emissive.set(cor);
        contra.color.set(cor);
      }
    }
  }

  // anguloLivre existe para o vestiario, onde o jogador gira o boneco a dedo.
  function quadro(andando, olhandoPara, anguloLivre) {
    const agora = performance.now();
    const dt = Math.min((agora - ultimo) / 1000, 0.1);
    ultimo = agora;

    if (typeof anguloLivre === 'number') {
      anguloAtual = anguloLivre;
      corpo.grupo.rotation.y = anguloLivre;
    } else {
      const alvo = rad(olhandoPara === -1 ? 30 : olhandoPara === 1 ? -30 : 0);
      anguloAtual += (alvo - anguloAtual) * Math.min(dt * 6, 1);
      corpo.grupo.rotation.y = anguloAtual;
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

  return { dimensionar, quadro, pintar, vestir, render, cena, get corpo() { return corpo; } };
}
