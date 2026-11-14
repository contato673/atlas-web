// ATLAS — a unidade ciborgue em 3D, montada peça por peça.
//
// Por que robo: rosto humano em low-poly facetado nao fecha — ou vira boneco de
// plastico, ou exige malha e textura que um PWA de graça nao comporta. Placa
// metalica, ao contrario, melhora quando e facetada: cada quina vira um tom
// diferente, e e exatamente isso que da a leitura de "modelado".
//
// Tres coisas fazem a diferenca entre parecer modelado e parecer montado com
// bolas, e as tres estao aqui de proposito:
//   1. junta aparente no quadril, joelho, ombro e cotovelo — e ela que explica
//      como o membro prende no corpo, em vez de esconder a emenda;
//   2. metal de verdade (metalness alto), porque e o metal que faz a luz
//      responder a cada face;
//   3. linha de painel e chanfro — placa sobreposta em vez de volume liso.
//
// A divisao de trabalho: visual.js diz O QUE existe e ja entrega resolvido em
// cor; este arquivo so sabe DESENHAR. Trocar de peça remonta a geometria;
// trocar de cor so troca a cor do material.
//
// Desenha numa tela transparente POR CIMA do mapa, nao dentro dele. Mais
// simples e sem depender da matriz de projecao do MapLibre. O preco e a unidade
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

// Metal facetado: metalness alto e o que faz cada face devolver uma luz
// diferente. Com metalness baixo o low-poly vira mancha chapada.
function mat(cor, { aspereza = 0.42, metal = 0.72, liso = false } = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(cor), roughness: aspereza,
    metalness: metal, flatShading: !liso,
  });
}

// Vidro aceso: liso, para contrastar com o resto facetado.
function matVidro(cor, forca = 0.95) {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cor), roughness: 0.2, metalness: 0.3, flatShading: false,
  });
  m.emissive = new THREE.Color(cor);
  m.emissiveIntensity = forca;
  return m;
}

// Dois chassis. A diferenca esta no ombro, na cintura e na grossura do membro,
// que e o que de fato se le num boneco de 60 pixels sobre o mapa.
const FORMA = {
  pesado: {
    ombro: 0.9, cintura: 0.6, xOmbro: 0.86, xQuadril: 0.32,
    coxa: 0.26, canela: 0.22, braco: 0.19, rCabeca: 0.6,
    quadril: 1.78, ombroY: 3.02, pescoco: 3.16,
  },
  leve: {
    ombro: 0.76, cintura: 0.52, xOmbro: 0.74, xQuadril: 0.3,
    coxa: 0.22, canela: 0.18, braco: 0.16, rCabeca: 0.56,
    quadril: 1.82, ombroY: 3.04, pescoco: 3.18,
  },
};

export function montarCorpo(v) {
  const f = FORMA[v.chassi] || FORMA.pesado;

  const mPlaca = mat(v.placa, { aspereza: 0.38, metal: 0.8 });
  const mCabeca = mat(v.cabecaCor, { aspereza: 0.4, metal: 0.7 });
  const mElmo = mat(v.elmoCor, { aspereza: 0.36, metal: 0.78 });
  const mPeitoral = mat(v.peitoralCor, { aspereza: 0.46, metal: 0.6 });
  const mCouraca = mat(v.couracaCor, { aspereza: 0.44, metal: 0.66 });
  const mPernas = mat(v.pernasCor, { aspereza: 0.46, metal: 0.6 });
  const mPes = mat(v.pesCor, { aspereza: 0.5, metal: 0.55 });
  const mNeon = matVidro(v.neon);
  // junta e borracha: escuro e fosco, para a junta ler como vão e nao como peça
  const mJunta = mat('#15191f', { aspereza: 0.85, metal: 0.25 });
  const materiais = {
    placa: mPlaca, cabeca: mCabeca, elmo: mElmo, peitoral: mPeitoral,
    couraca: mCouraca, pernas: mPernas, pes: mPes, neon: mNeon,
  };

  const pedra = (r, m, det = 1) => new THREE.Mesh(new THREE.IcosahedronGeometry(r, det), m);
  const caixa = (x, y, z, m) => new THREE.Mesh(new THREE.BoxGeometry(x, y, z), m);
  const cone = (rc, rb, h, m, lados = 8) => new THREE.Mesh(new THREE.CylinderGeometry(rc, rb, h, lados), m);
  const casca = (rc, rb, h, m, de, arco, lados = 16) => new THREE.Mesh(
    new THREE.CylinderGeometry(rc, rb, h, lados, 1, true, rad(de), rad(arco)), m,
  );
  const cupula = (r, m, parte = 0.56, gomos = 12) => new THREE.Mesh(
    new THREE.SphereGeometry(r, gomos, 6, 0, Math.PI * 2, 0, Math.PI * parte), m,
  );
  // anel de junta: o tubo escuro que aparece entre dois segmentos
  const junta = (r, alt, m = mJunta) => cone(r, r, alt, m, 10);

  const g = new THREE.Group();

  /* ---------------- pernas: quadril, joelho e pé ----------------
     Dois segmentos com junta no meio. Alem de ficar melhor parado, permite a
     perna dobrar o joelho na caminhada, que e o que falta num membro de peça
     unica — ele so pode girar inteiro, e isso le como perna de boneco. */
  const perna = (lado) => {
    const raiz = new THREE.Group();
    const fina = v.pernas === 'fina';
    const rCoxa = f.coxa * (fina ? 0.84 : 1);
    const rCanela = f.canela * (fina ? 0.84 : 1);

    raiz.add(junta(rCoxa * 1.12, 0.18));
    const quadrilPlaca = pedra(rCoxa * 1.3, mPernas, 0);
    quadrilPlaca.scale.set(1, 0.7, 1);
    quadrilPlaca.position.y = 0.04;
    raiz.add(quadrilPlaca);

    const coxa = cone(rCoxa, rCoxa * 0.9, 0.58, mPernas, 8);
    coxa.position.y = -0.3;
    raiz.add(coxa);
    if (v.pernas === 'pistao') {
      // pistao: o cilindro aparente do lado de fora da coxa
      const p = cone(rCoxa * 0.3, rCoxa * 0.3, 0.5, mPlaca, 8);
      p.position.set(lado * rCoxa * 0.95, -0.3, -0.06);
      const brilho = junta(rCoxa * 0.34, 0.08, mNeon);
      brilho.position.set(lado * rCoxa * 0.95, -0.5, -0.06);
      raiz.add(p, brilho);
    }

    const joelho = new THREE.Group();
    joelho.position.y = -0.58;
    joelho.add(junta(rCanela * 1.25, 0.2));
    const rotula = pedra(rCanela * 1.15, mPlaca, 0);
    rotula.position.set(0, 0, rCanela * 0.5);
    rotula.scale.set(1, 1, 0.6);
    joelho.add(rotula);

    const canela = cone(rCanela, rCanela * 0.88, 0.84, mPernas, 8);
    canela.position.y = -0.44;
    joelho.add(canela);
    // linha de painel: placa sobreposta, nao volume liso
    const painel = caixa(rCanela * 0.5, 0.42, 0.06, mPlaca);
    painel.position.set(0, -0.44, rCanela * 0.9);
    const risca = caixa(rCanela * 0.56, 0.06, 0.05, mNeon);
    risca.position.set(0, -0.26, rCanela * 0.94);
    joelho.add(painel, risca);

    const pe = new THREE.Group();
    pe.position.y = -0.86;
    pe.add(junta(rCanela * 0.95, 0.14));
    if (v.pes === 'garra') {
      const casco = caixa(0.44, 0.26, 0.62, mPes);
      casco.position.set(0, -0.19, 0.06);
      const dedo = (x) => {
        const d = caixa(0.11, 0.12, 0.26, mPlaca);
        d.position.set(x, -0.26, 0.42);
        return d;
      };
      const calcanhar = caixa(0.2, 0.3, 0.16, mPlaca);
      calcanhar.position.set(0, -0.17, -0.26);
      const sola = caixa(0.46, 0.06, 0.66, mJunta);
      sola.position.set(0, -0.33, 0.06);
      pe.add(casco, dedo(-0.14), dedo(0), dedo(0.14), calcanhar, sola);
    } else if (v.pes === 'pesado') {
      const casco = caixa(0.54, 0.34, 0.78, mPes);
      casco.position.set(0, -0.17, 0.08);
      const chanfro = caixa(0.46, 0.12, 0.84, mPlaca);
      chanfro.position.set(0, -0.3, 0.08);
      const sola = caixa(0.56, 0.08, 0.8, mJunta);
      sola.position.set(0, -0.37, 0.08);
      const faixa = caixa(0.58, 0.07, 0.3, mNeon);
      faixa.position.set(0, -0.12, 0.3);
      pe.add(casco, chanfro, sola, faixa);
    } else { // leve
      const casco = caixa(0.4, 0.24, 0.68, mPes);
      casco.position.set(0, -0.18, 0.1);
      const bico = caixa(0.34, 0.14, 0.2, mPlaca);
      bico.position.set(0, -0.26, 0.44);
      const sola = caixa(0.42, 0.06, 0.72, mJunta);
      sola.position.set(0, -0.32, 0.1);
      const risca2 = caixa(0.06, 0.1, 0.5, mNeon);
      risca2.position.set(lado * 0.17, -0.18, 0.12);
      pe.add(casco, bico, sola, risca2);
    }
    joelho.add(pe);
    raiz.add(joelho);

    raiz.position.set(lado * f.xQuadril, f.quadril, 0);
    return { raiz, joelho };
  };
  const pE = perna(-1);
  const pD = perna(1);

  /* ---------------- tronco ---------------- */
  const tronco = new THREE.Group();
  const alto = f.ombroY - f.quadril + 0.3;

  const peito = cone(f.ombro, f.cintura, alto, mPeitoral, 8);
  peito.position.y = alto / 2 + 0.04;
  tronco.add(peito);

  // colarinho e cintura: dois aneis que arrematam o tronco, em vez de deixar a
  // peça terminar no vazio
  const colar = cone(f.ombro * 0.82, f.ombro * 0.98, 0.16, mPlaca, 8);
  colar.position.y = alto - 0.02;
  const cintura = junta(f.cintura + 0.02, 0.18);
  cintura.position.y = 0.08;
  tronco.add(colar, cintura);

  if (v.peitoral === 'ventilado') {
    // grelha de dissipacao no lugar do peito liso
    for (let i = 0; i < 3; i += 1) {
      const grelha = caixa(f.ombro * 0.62, 0.07, 0.06, mJunta);
      grelha.position.set(0, alto * 0.52 + i * 0.15, f.cintura + (f.ombro - f.cintura) * 0.55 + 0.04);
      tronco.add(grelha);
    }
  } else if (v.peitoral === 'blindado') {
    const placa = cone(f.ombro * 0.96, f.cintura * 1.04, alto * 0.56, mPlaca, 8);
    placa.position.y = alto * 0.62;
    const borda = cone(f.ombro * 0.98, f.ombro * 0.98, 0.07, mNeon, 8);
    borda.position.y = alto * 0.34;
    tronco.add(placa, borda);
  }

  // nucleo: a celula de energia. E o centro visual do robo e o item da lore.
  const anelNucleo = cone(0.26, 0.26, 0.1, mPlaca, 6);
  anelNucleo.rotation.x = rad(90);
  anelNucleo.position.set(0, alto * 0.66, f.cintura + (f.ombro - f.cintura) * 0.7);
  const nucleo = cone(0.17, 0.17, 0.12, mNeon, 6);
  nucleo.rotation.x = rad(90);
  nucleo.position.set(0, alto * 0.66, f.cintura + (f.ombro - f.cintura) * 0.7 + 0.03);
  tronco.add(anelNucleo, nucleo);

  if (v.couraca !== 'nenhuma') {
    const grosso = v.couraca === 'reator' ? 0.08 : 0.04;
    const capa = cone(f.ombro + grosso, f.cintura + grosso + 0.02, alto - 0.14, mCouraca, 8);
    capa.position.y = (alto - 0.14) / 2 + 0.08;
    const gola = cone(f.ombro * 0.62, f.ombro * 0.84, v.couraca === 'reator' ? 0.32 : 0.2, mCouraca, 8);
    gola.position.y = alto + 0.02;
    tronco.add(capa, gola);
    if (v.couraca === 'reator') {
      const ombreira = (lado) => {
        const o = new THREE.Group();
        const casco = pedra(0.4, mCouraca, 0);
        casco.scale.set(1, 0.66, 1);
        const borda = caixa(0.5, 0.07, 0.3, mNeon);
        borda.position.y = -0.2;
        o.add(casco, borda);
        o.position.set(lado * (f.xOmbro + 0.02), alto - 0.08, 0);
        o.rotation.z = lado * rad(-14);
        return o;
      };
      tronco.add(ombreira(-1), ombreira(1));
    }
  }

  // tanque de energia nas costas: e o item do jogo, nao so silhueta
  const tanque = caixa(0.6, 0.66, 0.28, mPlaca);
  tanque.position.set(0, alto * 0.6, -(f.cintura + 0.26));
  const cinta = caixa(0.66, 0.08, 0.32, mJunta);
  cinta.position.set(0, alto * 0.6, -(f.cintura + 0.26));
  const vento = caixa(0.1, 0.3, 0.1, mNeon);
  vento.position.set(-0.18, alto * 0.6, -(f.cintura + 0.43));
  const ventoD = vento.clone();
  ventoD.position.x = 0.18;
  tronco.add(tanque, cinta, vento, ventoD);
  tronco.position.y = f.quadril;

  /* ---------------- bracos: ombro e cotovelo ---------------- */
  const braco = (lado) => {
    const raiz = new THREE.Group();
    const r = f.braco;
    const esfera = pedra(r * 1.35, mPlaca, 1);
    raiz.add(esfera);
    const bracoSup = cone(r, r * 0.9, 0.46, mPeitoral, 8);
    bracoSup.position.y = -0.3;
    raiz.add(bracoSup);

    const cotovelo = new THREE.Group();
    cotovelo.position.y = -0.56;
    cotovelo.add(junta(r * 1.05, 0.14));
    // Antebraço e mão um pouco maiores: antes a mão era um cubinho que sumia,
    // e o braço inteiro lia como curto demais para o tamanho do tronco.
    const antebraco = cone(r * 0.94, r * 0.82, 0.52, mPeitoral, 8);
    antebraco.position.y = -0.3;
    const bracelete = junta(r * 1.02, 0.09, mNeon);
    bracelete.position.y = -0.54;
    const mao = caixa(r * 2.1, r * 2.3, r * 1.5, mPlaca);
    mao.position.y = -0.7;
    const dedo = caixa(r * 0.62, r * 1.0, r * 0.6, mPlaca);
    dedo.position.set(lado * r * 0.78, -0.86, 0);
    cotovelo.add(antebraco, bracelete, mao, dedo);
    raiz.add(cotovelo);

    raiz.position.set(lado * f.xOmbro, f.ombroY, 0);
    return { raiz, cotovelo };
  };
  const bE = braco(-1);
  const bD = braco(1);

  /* ---------------- cabeca ---------------- */
  const cabeca = new THREE.Group();
  const R = f.rCabeca;
  const pescocoTubo = junta(R * 0.42, 0.2);
  pescocoTubo.position.y = 0.04;
  cabeca.add(pescocoTubo);

  // o cranio muda de forma conforme a peça escolhida
  if (v.cabeca === 'bloco') {
    const bloco = caixa(R * 1.5, R * 1.42, R * 1.42, mCabeca);
    bloco.position.y = R * 0.86;
    const chanfro = caixa(R * 1.56, R * 0.5, R * 1.3, mPlaca);
    chanfro.position.y = R * 1.4;
    cabeca.add(bloco, chanfro);
  } else {
    const domo = pedra(R, mCabeca, 1);
    domo.scale.set(1.08, 1.02, 0.98);
    domo.position.y = R * 0.9;
    cabeca.add(domo);
  }
  // maxilar: a peça que separa o visor do pescoço
  const maxilar = caixa(R * 1.1, R * 0.3, R * 0.9, mPlaca);
  maxilar.position.set(0, R * 0.42, R * 0.2);
  cabeca.add(maxilar);

  if (v.cabeca === 'cabo') {
    const cabo = cone(R * 0.18, R * 0.1, R * 1.1, mJunta, 6);
    cabo.position.set(0, R * 0.9, -R * 1.0);
    cabo.rotation.x = rad(32);
    const ponta = junta(R * 0.14, 0.08, mNeon);
    ponta.position.set(0, R * 0.42, -R * 1.3);
    cabeca.add(cabo, ponta);
  } else if (v.cabeca === 'crista') {
    const base = caixa(R * 0.2, R * 0.34, R * 1.5, mPlaca);
    base.position.set(0, R * 1.76, -R * 0.06);
    const acesa = caixa(R * 0.1, R * 0.2, R * 1.3, mNeon);
    acesa.position.set(0, R * 1.96, -R * 0.06);
    cabeca.add(base, acesa);
  } else if (v.cabeca === 'orbe') {
    const haste = cone(R * 0.1, R * 0.1, R * 0.5, mPlaca, 6);
    haste.position.set(0, R * 1.74, -R * 0.2);
    const bola = pedra(R * 0.32, mNeon, 1);
    bola.position.set(0, R * 2.12, -R * 0.2);
    cabeca.add(haste, bola);
  }

  const alturaOlho = R * 1.0;
  const frente = R * 0.92;

  if (v.visor === 'faixa') {
    const moldura = casca(R * 1.12, R * 1.06, R * 0.62, mPlaca, -70, 140);
    moldura.position.y = alturaOlho;
    const vidro = casca(R * 1.07, R * 1.01, R * 0.46, mNeon, -66, 132);
    vidro.position.y = alturaOlho;
    cabeca.add(moldura, vidro);
  } else if (v.visor === 'ciclope') {
    const trilho = caixa(R * 1.5, R * 0.3, 0.08, mPlaca);
    trilho.position.set(0, alturaOlho, frente * 0.9);
    const olho = pedra(R * 0.26, mNeon, 1);
    olho.scale.set(1, 1, 0.5);
    olho.position.set(0, alturaOlho, frente * 1.0);
    const aro = junta(R * 0.33, 0.07, mPlaca);
    aro.rotation.x = rad(90);
    aro.position.set(0, alturaOlho, frente * 0.96);
    cabeca.add(trilho, aro, olho);
  } else if (v.visor === 'cruz') {
    const vertical = caixa(R * 0.16, R * 0.9, 0.07, mNeon);
    vertical.position.set(0, alturaOlho, frente * 0.92);
    const horizontal = caixa(R * 1.1, R * 0.16, 0.07, mNeon);
    horizontal.position.set(0, alturaOlho, frente * 0.92);
    const chapa = caixa(R * 1.3, R * 1.1, 0.06, mPlaca);
    chapa.position.set(0, alturaOlho, frente * 0.86);
    cabeca.add(chapa, vertical, horizontal);
  } else { // dois sensores
    const orbita = (lado) => {
      const o = caixa(R * 0.52, R * 0.34, 0.07, mJunta);
      o.position.set(lado * R * 0.42, alturaOlho, frente * 0.88);
      return o;
    };
    const sensor = (lado) => {
      const s = pedra(R * 0.17, mNeon, 1);
      s.scale.set(1, 0.9, 0.5);
      s.position.set(lado * R * 0.42, alturaOlho, frente * 0.95);
      return s;
    };
    cabeca.add(orbita(-1), orbita(1), sensor(-1), sensor(1));
  }

  if (v.elmo === 'calota' || v.elmo === 'tatico') {
    const calota = cupula(R * 1.16, mElmo, 0.54, 12);
    calota.position.y = R * 0.95;
    calota.scale.set(1, 1.08, 0.98);
    cabeca.add(calota);
  }
  if (v.elmo === 'couro') {
    const casco = cupula(R * 1.28, mElmo, 0.74, 10);
    casco.position.y = R * 0.9;
    casco.scale.set(1.02, 1.1, 1.08);
    const nuca = pedra(R * 0.6, mElmo, 1);
    nuca.scale.set(1, 0.9, 0.78);
    nuca.position.set(0, R * 0.88, -R * 0.8);
    cabeca.add(casco, nuca);
  }
  if (v.elmo === 'tatico') {
    // Aletas nas laterais, e nao crista no alto: uma barbatana fina vista de
    // frente e um fio, e o jogador olha a unidade de frente o tempo todo.
    const aleta = (lado) => {
      const a = new THREE.Group();
      const base = caixa(0.1, 0.3, 0.3, mElmo);
      const acesa = caixa(0.07, 0.3, 0.16, mNeon);
      acesa.position.set(lado * 0.04, 0.12, -0.02);
      a.add(base, acesa);
      a.position.set(lado * (R * 1.06), R * 1.44, -0.06);
      a.rotation.z = lado * rad(-20);
      a.rotation.x = rad(16);
      return a;
    };
    const lombada = caixa(0.16, 0.14, R * 0.94, mElmo);
    lombada.position.set(0, R * 2.08, -0.02);
    cabeca.add(lombada, aleta(-1), aleta(1));
  }
  cabeca.position.y = f.pescoco;

  /* ---------------- sombra de contato ---------------- */
  // E isto que assenta a unidade no chao.
  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 }),
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.02;

  g.add(sombra, pE.raiz, pD.raiz, tronco, cabeca, bE.raiz, bD.raiz);
  return {
    grupo: g, tronco, cabeca, sombra, materiais,
    pernaE: pE.raiz, pernaD: pD.raiz, joelhoE: pE.joelho, joelhoD: pD.joelho,
    bracoE: bE.raiz, bracoD: bD.raiz, cotoveloE: bE.cotovelo, cotoveloD: bD.cotovelo,
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

  // Metal sem nada em volta para refletir fica cinza morto. Estas luzes fazem o
  // papel do ambiente: quente de um lado, fria do outro, e o neon por tras.
  cena.add(new THREE.HemisphereLight(0x9ec4ff, 0x0e141c, 1.0));
  const sol = new THREE.DirectionalLight(0xfff4e2, 1.6);
  sol.position.set(-4.5, 6.5, 4.5);
  cena.add(sol);
  const contra = new THREE.DirectionalLight(new THREE.Color(visual.neon), 1.3);
  contra.position.set(4.5, 2.4, -4);
  cena.add(contra);
  const lateral = new THREE.DirectionalLight(0x5f8bd0, 0.8);
  lateral.position.set(5, 1.5, 3);
  cena.add(lateral);
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

  // Joga fora a geometria antiga de verdade: sem isto, cada troca de peça deixa
  // malha na memoria da placa e o celular vai ficando lento.
  function descartar(raiz) {
    raiz.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
  }

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

  // anguloLivre existe para o vestiario, onde o jogador gira a unidade a dedo.
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
      // o joelho so dobra para tras, nunca para a frente: joelho que dobra
      // nos dois sentidos e o que mais denuncia animacao feita no olho
      corpo.joelhoE.rotation.x = Math.max(0, -s) * 0.7;
      corpo.joelhoD.rotation.x = Math.max(0, s) * 0.7;
      corpo.bracoE.rotation.x = -s * 0.46;
      corpo.bracoD.rotation.x = s * 0.46;
      corpo.cotoveloE.rotation.x = -0.2 - Math.max(0, -s) * 0.3;
      corpo.cotoveloD.rotation.x = -0.2 - Math.max(0, s) * 0.3;
      // o quique vem do passo, entao segue |cos| e nao sen
      corpo.tronco.position.y = corpo.base.tronco + Math.abs(c) * 0.07;
      corpo.cabeca.position.y = corpo.base.cabeca + Math.abs(c) * 0.07;
      corpo.tronco.rotation.y = s * 0.09;
      corpo.cabeca.rotation.y = -s * 0.05;
      corpo.sombra.scale.setScalar(1 - Math.abs(c) * 0.07);
    } else {
      // parado: um zumbido lento. Robo nao respira, entao o movimento e menor e
      // vem do tronco assentando, nao de peito inflando.
      fase += dt * 1.05;
      const r = Math.sin(fase) * 0.5 + 0.5;
      const frear = Math.min(dt * 7, 1);
      for (const parte of [corpo.pernaE, corpo.pernaD, corpo.bracoE, corpo.bracoD,
        corpo.joelhoE, corpo.joelhoD]) {
        parte.rotation.x += (0 - parte.rotation.x) * frear;
      }
      for (const parte of [corpo.cotoveloE, corpo.cotoveloD]) {
        parte.rotation.x += (-0.18 - parte.rotation.x) * frear;
      }
      corpo.tronco.rotation.y += (0 - corpo.tronco.rotation.y) * frear;
      corpo.cabeca.rotation.y += (0 - corpo.cabeca.rotation.y) * frear;
      corpo.tronco.position.y = corpo.base.tronco + r * 0.022;
      corpo.cabeca.position.y = corpo.base.cabeca + r * 0.03;
      corpo.sombra.scale.setScalar(1);
    }
    render.render(cena, cam);
  }

  return { dimensionar, quadro, pintar, vestir, render, cena, get corpo() { return corpo; } };
}
