/*
  Encontrei o sol nos seus olhos — página "Apartamento" (joguinho).

  A planta é um desenho feito aqui mesmo (sem serviço externo).
  COMO SE JOGA:
  - Toque na Lorena, na Juquinha ou no Cadu para escolher quem vai andar.
  - Depois toque num cômodo: ela (ou ele) vai até lá.
  - Lorena e depois Juquinha (ou o contrário): uma vai até a outra e as duas
    se beijam, com coraçõezinhos cor-de-rosa.
  - Lorena ou Juquinha e depois o Cadu: ela vai até ele e faz carinho.
  - "Chamar o Cadu" e "Fazer carinho" são os botões grandes do painel.

  O painel também conta quantas vezes cada cômodo aparece nos capítulos
  (a conta é feita sozinha a partir de capitulos.js).

  >>> PARA MUDAR NOMES OU FRASES, edite só COMODOS e FRASES abaixo. <<<
  - busca: palavras procuradas no texto para contar as aparições do cômodo.
*/
var COMODOS = {
  sala: {
    nome: 'Sala',
    detalhe: 'Sofá, TV e o lugar preferido do Cadu: o outro lado do sofá, alheio a qualquer conversa.',
    busca: /(?<!\p{L})(sala|sof[áa])(?!\p{L})/giu
  },
  cozinha: {
    nome: 'Cozinha',
    detalhe: 'A mesa da primeira conversa, o café passado de manhã e o Cadu aos pés de quem estiver no fogão.',
    busca: /(?<!\p{L})(cozinha|caf[ée])(?!\p{L})/giu
  },
  quartoLorena: {
    nome: 'Quarto da Lorena',
    detalhe: 'Arrumado num sábado de folga da Juquinha. Ela não tinha muita coisa para trazer.',
    busca: /quarto d[ae] (Lorena|morena)/giu
  },
  quartoJuquinha: {
    nome: 'Quarto da Juquinha',
    detalhe: 'A Lorena nunca tinha entrado nele antes.',
    busca: /quarto d[ae] (Juquinha|Eduarda|ruiva)/giu
  },
  banheiro: {
    nome: 'Banheiro',
    detalhe: 'Um só, para as duas. Boa sorte com os horários.',
    busca: /(?<!\p{L})(banheiro|banho)(?!\p{L})/giu
  },
  entrada: {
    nome: 'Porta de entrada',
    detalhe: 'Onde fica a cópia da chave que a Juquinha mandou fazer, e os bilhetes de quem saiu cedo para a delegacia.',
    busca: /(?<!\p{L})(chaves?|bilhetes?|portaria|elevador)(?!\p{L})/giu
  }
};

var FRASES = {
  chamar: ['O Cadu veio, mas só porque quis.', 'O Cadu ouviu. E ignorou.', 'O Cadu veio correndo. Deve ser hora da ração.'],
  carinho: ['O Cadu fechou os olhos e ronronou.', 'O Cadu aceitou. Por enquanto.', 'O Cadu fugiu para o quarto. Ele odeia visitas.'],
  beijo: ['Colegas de apartamento, é?', 'A regra de não se envolver com a colega de apartamento durou pouco.', 'O Cadu viu tudo e vai fingir que não.'],
  carinhoDela: ['{nome} fez carinho no Cadu. Ele ronronou.', '{nome} pegou o Cadu no colo. Ele deixou.', '{nome} coçou a orelha do Cadu. Ele fechou os olhos.'],
  caduVai: ['O Cadu se esfregou na perna da {nome}.', 'O Cadu deitou aos pés da {nome}.'],
  contas: 'Cada uma paga a metade. A da Lorena saiu um pouco menos, porque a Juquinha conhece o dono.'
};

(function () {
  'use strict';

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var ORDEM = ['sala', 'cozinha', 'quartoLorena', 'quartoJuquinha', 'banheiro', 'entrada'];

  // Geometria da planta. Cada cômodo: caixa e caminho do corredor (y = 300) até o centro.
  var GEO = {
    quartoLorena:   { caixa: [20, 20, 360, 240],  via: [[190, 300], [190, 210], [230, 160]] },
    banheiro:       { caixa: [380, 20, 220, 240], via: [[490, 300], [490, 210], [470, 175]] },
    quartoJuquinha: { caixa: [600, 20, 380, 240], via: [[790, 300], [790, 210], [720, 165]] },
    sala:           { caixa: [20, 340, 580, 340], via: [[300, 300], [300, 400], [330, 520]] },
    cozinha:        { caixa: [600, 340, 380, 340], via: [[800, 300], [800, 400], [830, 600]] },
    entrada:        { caixa: [420, 600, 120, 80], via: [[300, 300], [300, 400], [420, 560], [480, 630]] }
  };

  // Quem pode andar pela casa. desvio = onde cada uma fica dentro do cômodo, para não se sobreporem.
  var ATORES = {
    lorena:   { nome: 'Lorena',   onde: 'quartoLorena',   desvio: [-40, 10], escala: 1.5 },
    juquinha: { nome: 'Juquinha', onde: 'cozinha',        desvio: [40, 10],  escala: 1.5 },
    cadu:     { nome: 'Cadu',     onde: 'sala',           desvio: [0, 44],   escala: 1.55 }
  };

  var svg, camadaAtores, camadaEfeitos, montado = false;
  var escolhido = null;   // ator escolhido, esperando um destino
  var comodoAberto = null; // cômodo mostrado no cartão
  var folha = $('#folha'), estadoEl = $('#folha-estado'), acoesEl = $('#folha-acoes'), plantaEl = $('#planta');
  var contagens = null;
  var TP = function () { return window.TP || {}; };
  var esc = function (s) { return TP().escapar ? TP().escapar(s) : String(s); };
  var sortear = function (l) { return l[Math.floor(Math.random() * l.length)]; };
  var toast = function (m) { if (TP().toast) TP().toast(m); };
  var reduzido = function () { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; };

  function el(nome, attrs, pai) {
    var e = document.createElementNS(NS, nome);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(e);
    return e;
  }

  function pontoDoComodo(k, quem) {
    var v = GEO[k].via, c = v[v.length - 1], d = ATORES[quem].desvio;
    return [c[0] + d[0], c[1] + d[1]];
  }

  /* ---------- Contagem nos capítulos ---------- */

  function contar() {
    var caps = TP().capitulos || [];
    contagens = {};
    ORDEM.forEach(function (k) {
      var total = 0, melhor = null, max = 0;
      caps.forEach(function (c) {
        var m = c.texto.match(COMODOS[k].busca);
        var n = m ? m.length : 0;
        total += n;
        if (n > max) { max = n; melhor = c.numero; }
      });
      contagens[k] = { total: total, capitulo: melhor };
    });
  }

  /* ---------- Desenho da planta ---------- */

  function desenhar() {
    plantaEl.innerHTML = '';
    svg = el('svg', { 'class': 'planta-svg', viewBox: '-10 -10 1020 720', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'Planta do apartamento', focusable: 'false' }, plantaEl);
    var piso = el('g', {}, svg);

    ORDEM.forEach(function (k) {
      if (k === 'entrada') return;
      var c = GEO[k].caixa;
      var r = el('rect', { x: c[0], y: c[1], width: c[2], height: c[3], 'class': 'p-piso p-piso-' + k, 'data-comodo': k }, piso);
      r.addEventListener('click', function (e) { tocarComodo(k, e); });
    });
    el('rect', { x: 20, y: 260, width: 960, height: 80, 'class': 'p-piso p-corredor' }, piso);

    var mov = el('g', { 'class': 'p-moveis' }, svg);
    var tap = el('g', { 'class': 'p-tapete' }, mov);
    for (var i = 0; i < 6; i++) for (var j = 0; j < 4; j++) {
      el('rect', { x: 150 + i * 40, y: 450 + j * 40, width: 40, height: 40, 'class': (i + j) % 2 ? 'p-xadrez-a' : 'p-xadrez-b' }, tap);
    }
    el('rect', { x: 60, y: 430, width: 64, height: 200, rx: 14, 'class': 'p-sofa' }, mov);
    el('rect', { x: 76, y: 446, width: 40, height: 168, rx: 10, 'class': 'p-sofa-assento' }, mov);
    el('rect', { x: 66, y: 448, width: 26, height: 30, rx: 6, 'class': 'p-almofada' }, mov);
    el('rect', { x: 66, y: 580, width: 26, height: 30, rx: 6, 'class': 'p-almofada p-almofada-2' }, mov);
    el('rect', { x: 552, y: 440, width: 22, height: 180, rx: 4, 'class': 'p-rack' }, mov);
    el('rect', { x: 540, y: 470, width: 8, height: 120, rx: 2, 'class': 'p-tv' }, mov);
    el('circle', { cx: 440, cy: 530, r: 22, 'class': 'p-banco' }, mov);
    [[50, 370], [575, 655], [540, 370]].forEach(function (p) {
      el('circle', { cx: p[0], cy: p[1], r: 20, 'class': 'p-planta' }, mov);
      el('circle', { cx: p[0] - 6, cy: p[1] - 5, r: 9, 'class': 'p-planta-luz' }, mov);
    });
    el('path', { d: 'M160 680h220', 'class': 'p-janela' }, mov);

    el('path', { d: 'M960 360v300H760v-40h160V360z', 'class': 'p-bancada' }, mov);
    el('rect', { x: 920, y: 360, width: 40, height: 60, rx: 4, 'class': 'p-geladeira' }, mov);
    el('rect', { x: 924, y: 480, width: 32, height: 52, rx: 3, 'class': 'p-fogao' }, mov);
    [[934, 494], [946, 494], [934, 516], [946, 516]].forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: 4, 'class': 'p-boca' }, mov); });
    el('circle', { cx: 730, cy: 500, r: 50, 'class': 'p-mesa' }, mov);
    [[730, 432], [730, 568], [662, 500], [798, 500]].forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: 15, 'class': 'p-cadeira' }, mov); });
    el('circle', { cx: 730, cy: 500, r: 10, 'class': 'p-xicara' }, mov);

    el('rect', { x: 40, y: 40, width: 130, height: 180, rx: 8, 'class': 'p-cama' }, mov);
    el('rect', { x: 52, y: 50, width: 106, height: 34, rx: 8, 'class': 'p-travesseiro' }, mov);
    el('rect', { x: 40, y: 110, width: 130, height: 110, rx: 8, 'class': 'p-coberta p-coberta-lorena' }, mov);
    el('rect', { x: 250, y: 40, width: 110, height: 60, rx: 4, 'class': 'p-mesa-quadrada' }, mov);
    el('path', { d: 'M266 56l30 28M300 50h40', 'class': 'p-rabisco' }, mov);
    el('circle', { cx: 300, cy: 124, r: 14, 'class': 'p-cadeira' }, mov);
    el('rect', { x: 180, y: 40, width: 40, height: 40, rx: 4, 'class': 'p-mesa-quadrada' }, mov);
    el('path', { d: 'M40 20h120', 'class': 'p-janela' }, mov);

    el('rect', { x: 400, y: 40, width: 90, height: 90, rx: 6, 'class': 'p-box' }, mov);
    el('circle', { cx: 445, cy: 85, r: 6, 'class': 'p-ralo' }, mov);
    el('rect', { x: 520, y: 40, width: 60, height: 40, rx: 14, 'class': 'p-pia' }, mov);
    el('ellipse', { cx: 550, cy: 200, rx: 22, ry: 28, 'class': 'p-vaso' }, mov);

    el('rect', { x: 820, y: 40, width: 140, height: 180, rx: 8, 'class': 'p-cama' }, mov);
    el('rect', { x: 832, y: 50, width: 116, height: 34, rx: 8, 'class': 'p-travesseiro' }, mov);
    el('rect', { x: 820, y: 110, width: 140, height: 110, rx: 8, 'class': 'p-coberta p-coberta-juquinha' }, mov);
    el('rect', { x: 620, y: 40, width: 150, height: 44, rx: 4, 'class': 'p-armario' }, mov);
    el('path', { d: 'M695 40v44', 'class': 'p-rabisco' }, mov);
    el('ellipse', { cx: 740, cy: 170, rx: 56, ry: 34, 'class': 'p-tapete-redondo' }, mov);
    el('path', { d: 'M840 20h120', 'class': 'p-janela' }, mov);

    el('path', {
      'class': 'p-parede',
      d: 'M20 20H980V680H20Z' +
         'M380 20V260M600 20V260' +
         'M20 260H150M230 260H450M530 260H750M830 260H980' +
         'M20 340H250M350 340H600M600 340H750M850 340H980' +
         'M600 340V420M600 580V680'
    }, svg);
    el('path', { d: 'M440 680h80', 'class': 'p-vao' }, svg);
    el('path', { d: 'M440 680a80 80 0 0 1 80 -80', 'class': 'p-porta-arco' }, svg);
    el('path', { d: 'M520 680v-80', 'class': 'p-porta-folha' }, svg);
    // área de toque da porta de entrada
    var portaToque = el('rect', { x: 420, y: 590, width: 130, height: 100, 'class': 'p-toque' }, svg);
    portaToque.addEventListener('click', function (e) { tocarComodo('entrada', e); });

    var et = el('g', { 'class': 'p-etiquetas' }, svg);
    var POS = { quartoLorena: [200, 246], banheiro: [490, 246], quartoJuquinha: [880, 246], sala: [320, 420], cozinha: [850, 660], entrada: [455, 590] };
    ORDEM.forEach(function (k) {
      var g = el('g', { 'class': 'p-etiqueta', 'data-comodo': k, transform: 'translate(' + POS[k][0] + ' ' + POS[k][1] + ')' }, et);
      el('text', { 'text-anchor': 'middle', y: 0 }, g).textContent = COMODOS[k].nome;
      g.addEventListener('click', function (e) { tocarComodo(k, e); });
    });

    camadaAtores = el('g', { 'class': 'p-atores' }, svg);
    camadaEfeitos = el('g', { 'class': 'p-efeitos' }, svg);
    Object.keys(ATORES).forEach(criarAtor);
  }

  /* ---------- Personagens no mapa ---------- */

  var DESENHOS = {
    // Cadu: gato laranja listrado, de lado
    cadu:
      '<ellipse cx="26" cy="33" rx="22" ry="3" class="p-sombra"/>' +
      '<path d="M8 20c-10-2-12-12-6-16" class="p-cadu-rabo"/>' +
      '<ellipse cx="22" cy="20" rx="17" ry="10" class="p-cadu-pelo"/>' +
      '<path d="M12 14c2 4 2 9 0 12M20 11c2 5 2 12 0 16M28 12c2 4 2 9 0 13" class="p-cadu-listra"/>' +
      '<rect x="9" y="24" width="5" height="9" rx="2" class="p-cadu-pelo"/><rect x="29" y="24" width="5" height="9" rx="2" class="p-cadu-pelo"/>' +
      '<circle cx="40" cy="12" r="9" class="p-cadu-pelo"/>' +
      '<path d="M33 7l1-9 7 6zM42 4l6-7 1 9z" class="p-cadu-pelo"/>' +
      '<path d="M35 15c3 3 8 3 11 0" class="p-cadu-focinho"/>' +
      '<circle cx="43" cy="11" r="1.8" class="p-cadu-olho"/>',
    // Lorena: cabelo escuro comprido, suéter vinho listrado
    lorena:
      '<ellipse cx="0" cy="2" rx="17" ry="4" class="p-sombra"/>' +
      '<path d="M-13-48c0-12 6-19 13-19s13 7 13 19v26h-26z" class="p-lorena-cabelo"/>' +
      '<rect x="-7" y="-14" width="6" height="15" rx="3" class="p-calca"/><rect x="1" y="-14" width="6" height="15" rx="3" class="p-calca"/>' +
      '<path d="M-13-36c0-4 3-6 6-6h14c3 0 6 2 6 6v24h-26z" class="p-lorena-roupa"/>' +
      '<path d="M-13-30h26M-13-23h26M-13-16h26" class="p-lorena-listra"/>' +
      '<circle cx="0" cy="-52" r="10" class="p-pele"/>' +
      '<path d="M-10-54c1-9 6-12 11-12 6 0 10 4 10 11-6-1-13-3-21 1z" class="p-lorena-cabelo"/>' +
      '<circle cx="-3.5" cy="-51" r="1.3" class="p-olho"/><circle cx="3.5" cy="-51" r="1.3" class="p-olho"/>' +
      '<path d="M-2.5-46.5q2.5 2 5 0" class="p-boca"/>',
    // Juquinha: ruiva, jaqueta verde-oliva
    juquinha:
      '<ellipse cx="0" cy="2" rx="17" ry="4" class="p-sombra"/>' +
      '<path d="M-12-50c0-11 5-17 12-17s12 6 12 17v14h-24z" class="p-juquinha-cabelo"/>' +
      '<rect x="-7" y="-14" width="6" height="15" rx="3" class="p-calca p-calca-escura"/><rect x="1" y="-14" width="6" height="15" rx="3" class="p-calca p-calca-escura"/>' +
      '<path d="M-14-36c0-4 3-6 6-6h16c3 0 6 2 6 6v24h-28z" class="p-juquinha-roupa"/>' +
      '<path d="M0-42v30M-8-28h5M3-28h5" class="p-juquinha-detalhe"/>' +
      '<circle cx="0" cy="-52" r="10" class="p-pele"/>' +
      '<path d="M-11-52c0-10 5-14 11-14 7 0 11 5 11 13-4-4-9-6-14-6-3 0-6 2-8 7z" class="p-juquinha-cabelo"/>' +
      '<circle cx="-3.5" cy="-51" r="1.3" class="p-olho"/><circle cx="3.5" cy="-51" r="1.3" class="p-olho"/>' +
      '<path d="M-2.5-46.5q2.5 2 5 0" class="p-boca"/>'
  };

  function criarAtor(id) {
    var a = ATORES[id];
    a.id = id;
    a.pos = pontoDoComodo(a.onde, id);
    a.dir = id === 'juquinha' ? -1 : 1;
    a.g = el('g', { 'class': 'p-ator p-ator-' + id, tabindex: '0', role: 'button', 'aria-label': a.nome + ': escolher' }, camadaAtores);
    a.anel = el('ellipse', { cx: 0, cy: id === 'cadu' ? 3 : 2, rx: id === 'cadu' ? 36 : 30, ry: id === 'cadu' ? 10 : 9, 'class': 'p-anel' }, a.g);
    a.corpo = el('g', { 'class': 'p-ator-corpo' }, a.g);
    a.desenho = el('g', { transform: id === 'cadu' ? 'translate(-26 -30)' : '' }, a.corpo);
    a.desenho.innerHTML = DESENHOS[id];
    el('rect', { x: -36, y: id === 'cadu' ? -50 : -108, width: 72, height: id === 'cadu' ? 60 : 118, 'class': 'p-toque' }, a.g);
    a.g.addEventListener('click', function (e) { e.stopPropagation(); tocarAtor(id); });
    a.g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tocarAtor(id); } });
    posicionar(a);
  }

  function posicionar(a) {
    var s = a.escala;
    a.g.setAttribute('transform', 'translate(' + a.pos[0].toFixed(1) + ' ' + a.pos[1].toFixed(1) + ')');
    a.corpo.setAttribute('transform', 'scale(' + (s * a.dir) + ' ' + s + ')');
  }

  // Desenha quem está mais embaixo na frente
  function ordenar() {
    Object.keys(ATORES).map(function (k) { return ATORES[k]; })
      .sort(function (x, y) { return x.pos[1] - y.pos[1]; })
      .forEach(function (a) { camadaAtores.appendChild(a.g); });
  }

  /* ---------- Andar ---------- */

  function caminho(a, destinoComodo, ponto) {
    if (a.onde === destinoComodo) return [a.pos, ponto];
    var ida = GEO[a.onde].via.slice().reverse().slice(1);  // porta e corredor do cômodo atual
    var volta = GEO[destinoComodo].via.slice(0, -1);       // corredor e porta do destino
    if (a.onde === 'entrada' && destinoComodo === 'sala') { ida = [[420, 560]]; volta = []; }
    if (a.onde === 'sala' && destinoComodo === 'entrada') { ida = []; volta = [[420, 560]]; }
    return [a.pos].concat(ida, volta, [ponto]);
  }

  function andar(a, destinoComodo, ponto, aoChegar) {
    if (a.raf) cancelAnimationFrame(a.raf);
    var pts = caminho(a, destinoComodo, ponto);
    var acc = [0];
    for (var i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var total = acc[acc.length - 1];
    a.onde = destinoComodo;
    if (total < 1) { if (aoChegar) aoChegar(); return; }
    var dur = reduzido() ? 1 : Math.max(500, total / (a.id === 'cadu' ? 0.34 : 0.26));
    var t0 = performance.now();
    a.g.classList.add('andando');
    a.andando = true;
    atualizarStatus();
    (function passo(agora) {
      var t = Math.min(1, (agora - t0) / dur), alvo = total * t;
      for (var k = 1; k < pts.length; k++) {
        if (acc[k] >= alvo) {
          var f = (alvo - acc[k - 1]) / ((acc[k] - acc[k - 1]) || 1);
          var dx = pts[k][0] - pts[k - 1][0];
          if (Math.abs(dx) > 1) a.dir = dx < 0 ? -1 : 1;
          a.pos = [pts[k - 1][0] + dx * f, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f];
          break;
        }
      }
      posicionar(a); ordenar();
      if (t < 1) a.raf = requestAnimationFrame(passo);
      else { a.raf = null; a.andando = false; a.g.classList.remove('andando'); atualizarStatus(); if (aoChegar) aoChegar(); }
    })(t0);
  }

  function virarPara(a, b) { a.dir = b.pos[0] < a.pos[0] ? -1 : 1; posicionar(a); }

  /* ---------- Efeitos: corações ---------- */

  var CORACAO = 'M0 3.5c-2.6-4.4-9.5-3.6-9.5 1.6 0 4.6 9.5 10.4 9.5 10.4s9.5-5.8 9.5-10.4c0-5.2-6.9-6-9.5-1.6z';

  function coracoes(x, y, n, pequenos) {
    for (var i = 0; i < n; i++) (function (i) {
      var g = el('g', { 'class': 'p-coracao' }, camadaEfeitos);
      el('path', { d: CORACAO, 'class': i % 3 === 1 ? 'p-coracao-claro' : '' }, g);
      var dx = (Math.random() - .5) * (pequenos ? 50 : 110), sobe = (pequenos ? 50 : 90) + Math.random() * 50;
      var esc0 = (pequenos ? .9 : 1.3) + Math.random() * .8, atraso = i * (pequenos ? 140 : 110), dur = 1300 + Math.random() * 500;
      var t0 = performance.now() + atraso;
      g.setAttribute('opacity', 0);
      (function passo(agora) {
        var t = (agora - t0) / dur;
        if (t < 0) { requestAnimationFrame(passo); return; }
        if (t >= 1) { g.remove(); return; }
        var balanco = Math.sin(t * Math.PI * 2) * 8;
        g.setAttribute('transform', 'translate(' + (x + dx * t + balanco) + ' ' + (y - sobe * t) + ') scale(' + (esc0 * (0.6 + t * .5)) + ')');
        g.setAttribute('opacity', t < .15 ? t / .15 : 1 - (t - .15) / .85);
        requestAnimationFrame(passo);
      })(performance.now());
    })(i);
  }

  /* ---------- Ações ---------- */

  function nomeLugar(k) {
    return { sala: 'na sala', cozinha: 'na cozinha', quartoLorena: 'no quarto da Lorena', quartoJuquinha: 'no quarto da Juquinha', banheiro: 'no banheiro', entrada: 'na porta de entrada' }[k];
  }
  var paraLugar = function (k) { return nomeLugar(k).replace(/^n/, 'pr'); };

  function escolher(id) {
    escolhido = id;
    Object.keys(ATORES).forEach(function (k) { ATORES[k].g.classList.toggle('escolhido', k === id); });
    $$('.ator-chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-ator') === id)); });
    atualizarDica();
  }

  function tocarAtor(id) {
    if (!escolhido) { escolher(id); return; }
    if (escolhido === id) { escolher(null); return; }
    var a = ATORES[escolhido], b = ATORES[id];
    escolher(null);
    if (a.id !== 'cadu' && b.id !== 'cadu') beijar(a, b);
    else if (b.id === 'cadu') fazerCarinho(a);
    else caduVaiAte(b);
  }

  function tocarComodo(k, e) {
    if (e) e.stopPropagation();
    comodoAberto = k;
    if (escolhido) {
      var a = ATORES[escolhido];
      escolher(null);
      andar(a, k, pontoDoComodo(k, a.id));
    }
    desenharCartao();
    atualizarStatus();
  }

  function pontoAoLado(alvo, quem, dist) {
    var lado = quem.pos[0] <= alvo.pos[0] ? -1 : 1;
    return [alvo.pos[0] + lado * dist, alvo.pos[1] + (alvo.id === 'cadu' ? -2 : 0)];
  }

  function beijar(a, b) {
    var ponto = pontoAoLado(b, a, 46);
    andar(a, b.onde, ponto, function () {
      virarPara(a, b); virarPara(b, a);
      a.g.classList.add('beijando'); b.g.classList.add('beijando');
      var meio = [(a.pos[0] + b.pos[0]) / 2, Math.min(a.pos[1], b.pos[1]) - 100];
      coracoes(meio[0], meio[1], 14);
      toast(sortear(FRASES.beijo));
      setTimeout(function () { a.g.classList.remove('beijando'); b.g.classList.remove('beijando'); }, 1600);
    });
  }

  function fazerCarinho(a) {
    var cadu = ATORES.cadu;
    var ponto = pontoAoLado(cadu, a, 52);
    andar(a, cadu.onde, ponto, function () {
      virarPara(a, cadu); virarPara(cadu, a);
      a.g.classList.add('agachando');
      ronronar();
      coracoes(cadu.pos[0], cadu.pos[1] - 55, 6, true);
      toast(sortear(FRASES.carinhoDela).replace('{nome}', a.nome));
      setTimeout(function () { a.g.classList.remove('agachando'); }, 1500);
    });
  }

  function caduVaiAte(b) {
    var cadu = ATORES.cadu;
    andar(cadu, b.onde, pontoAoLado(b, cadu, 50), function () {
      virarPara(cadu, b);
      ronronar();
      coracoes(cadu.pos[0], cadu.pos[1] - 55, 4, true);
      toast(sortear(FRASES.caduVai).replace('{nome}', b.nome));
    });
  }

  function ronronar() {
    var g = ATORES.cadu.g;
    g.classList.remove('ronrona'); void g.getBBox(); g.classList.add('ronrona');
  }

  function chamar() {
    var frase = sortear(FRASES.chamar), cadu = ATORES.cadu;
    toast(frase);
    if (frase.indexOf('ignorou') !== -1) return;
    andar(cadu, 'sala', [300, 600], function () { ronronar(); coracoes(300, 560, 3, true); });
  }

  function carinho() {
    var frase = sortear(FRASES.carinho), cadu = ATORES.cadu;
    toast(frase);
    if (frase.indexOf('fugiu') !== -1) { andar(cadu, 'quartoJuquinha', pontoDoComodo('quartoJuquinha', 'cadu')); return; }
    ronronar();
    coracoes(cadu.pos[0], cadu.pos[1] - 55, 5, true);
  }

  /* ---------- Painel ---------- */

  function atualizarDica() {
    var d = $('#jogo-dica');
    if (!d) return;
    if (!escolhido) { d.innerHTML = 'Toque na <b>Lorena</b>, na <b>Juquinha</b> ou no <b>Cadu</b>, aqui ou na planta.'; return; }
    var outros = escolhido === 'cadu'
      ? 'na <b>Lorena</b> ou na <b>Juquinha</b> para ele ir até ela'
      : (escolhido === 'lorena' ? 'na <b>Juquinha</b> para um beijo' : 'na <b>Lorena</b> para um beijo') + ' ou no <b>Cadu</b> para um carinho';
    d.innerHTML = '<b>' + ATORES[escolhido].nome + '</b> escolhida. Agora toque num cômodo, ' + outros + '.';
    if (escolhido === 'cadu') d.innerHTML = d.innerHTML.replace('escolhida', 'escolhido');
  }

  function atualizarStatus() {
    var s = $('#cadu-status'), c = ATORES.cadu;
    if (s) s.textContent = c.andando ? 'Cadu está indo ' + paraLugar(c.onde) + '…' : 'Cadu está ' + nomeLugar(c.onde) + '.';
    $$('.p-piso').forEach(function (r) { r.classList.toggle('aberto', r.getAttribute('data-comodo') === comodoAberto); });
    $$('.p-etiqueta').forEach(function (g) { g.classList.toggle('aberta', g.getAttribute('data-comodo') === comodoAberto); });
    $$('.comodo-chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-comodo') === comodoAberto)); });
  }

  function desenharCartao() {
    var alvo = $('#comodo-cartao');
    if (!alvo) return;
    if (!comodoAberto) { alvo.innerHTML = ''; alvo.hidden = true; return; }
    var c = COMODOS[comodoAberto], n = contagens[comodoAberto];
    alvo.hidden = false;
    alvo.innerHTML =
      '<button type="button" class="comodo-fechar" aria-label="Fechar">×</button>' +
      '<p class="folha-rotulo">Cômodo</p>' +
      '<h3 class="comodo-titulo">' + esc(c.nome) + '</h3>' +
      '<p class="comodo-detalhe">' + esc(c.detalhe) + '</p>' +
      (n && n.total ? '<p class="comodo-numeros"><strong>' + n.total.toLocaleString('pt-BR') + '</strong> menções nos capítulos · mais vezes no <a href="#capitulo-' + n.capitulo + '">capítulo ' + n.capitulo + '</a></p>' : '');
    $('.comodo-fechar', alvo).addEventListener('click', function () { comodoAberto = null; desenharCartao(); atualizarStatus(); });
  }

  function telaCasa() {
    var t = TP();
    estadoEl.innerHTML =
      // 1. Os dois botões do Cadu, em destaque
      '<div class="cadu-destaque">' +
        '<span class="cadu-destaque-foto" id="cadu-destaque-foto"></span>' +
        '<div class="cadu-destaque-info"><p class="folha-rotulo">O filho da casa</p><strong>Cadu</strong><small id="cadu-status"></small></div>' +
        '<div class="cadu-botoes">' +
          '<button type="button" class="cadu-botao cadu-botao-chamar" id="botao-chamar"><span aria-hidden="true">📣</span>Chamar o Cadu</button>' +
          '<button type="button" class="cadu-botao cadu-botao-carinho" id="botao-carinho"><span aria-hidden="true">🐾</span>Fazer carinho</button>' +
        '</div>' +
      '</div>' +
      // 2. Quem você quer mover
      '<div class="jogo">' +
        '<p class="jogo-titulo">Quem vai andar pela casa?</p>' +
        '<div class="atores" role="group" aria-label="Escolher personagem">' +
          ['lorena', 'juquinha', 'cadu'].map(function (k) {
            return '<button type="button" class="ator-chip ator-chip-' + k + '" data-ator="' + k + '" aria-pressed="false"><span class="ator-chip-foto" data-pessoa="' + (k === 'juquinha' ? 'eduarda' : k) + '"></span>' + ATORES[k].nome + '</button>';
          }).join('') +
        '</div>' +
        '<p class="jogo-dica" id="jogo-dica" aria-live="polite"></p>' +
      '</div>' +
      '<div class="comodo-cartao" id="comodo-cartao" hidden></div>' +
      // 3. Cômodos, discretos
      '<details class="comodos-lista">' +
        '<summary>Cômodos e menções nos capítulos</summary>' +
        '<ul class="comodos">' + ORDEM.map(function (k) {
          var n = contagens[k];
          return '<li><button type="button" class="comodo-chip" data-comodo="' + k + '" aria-pressed="false">' + esc(COMODOS[k].nome) +
            (n && n.total ? ' <small>' + n.total.toLocaleString('pt-BR') + '</small>' : '') + '</button></li>';
        }).join('') + '</ul>' +
      '</details>' +
      '<div class="contas"><p class="contas-titulo">Contas da casa</p><div class="contas-barra"><span class="contas-l">Lorena</span><span class="contas-j">Juquinha</span></div><p class="contas-nota">' + esc(FRASES.contas) + '</p></div>';

    var cadu = t.acharPessoa && t.acharPessoa('cadu');
    if (cadu && t.criarFoto) $('#cadu-destaque-foto').appendChild(t.criarFoto(cadu, 'cadu-destaque-img'));
    $$('.ator-chip-foto', estadoEl).forEach(function (s) {
      var p = t.acharPessoa && t.acharPessoa(s.getAttribute('data-pessoa'));
      if (p && t.criarFoto) s.appendChild(t.criarFoto(p, 'ator-foto'));
    });
    $$('.ator-chip', estadoEl).forEach(function (b) { b.addEventListener('click', function () { tocarAtor(b.getAttribute('data-ator')); }); });
    $$('.comodo-chip', estadoEl).forEach(function (b) { b.addEventListener('click', function () { tocarComodo(b.getAttribute('data-comodo')); }); });
    $('#botao-chamar').addEventListener('click', chamar);
    $('#botao-carinho').addEventListener('click', carinho);
    acoesEl.innerHTML = '';
    atualizarDica();
    atualizarStatus();
  }

  /* ---------- Painel recolhível e enquadramento ---------- */

  function enquadrar() {
    if (!svg) return;
    if (window.innerWidth >= 760) { plantaEl.style.paddingBottom = ''; return; }
    var fh = folha.classList.contains('recolhida') ? 96 : Math.min(folha.offsetHeight, window.innerHeight * 0.5);
    plantaEl.style.paddingBottom = (fh + 10) + 'px';
  }

  function expandir(sim) {
    folha.classList.toggle('recolhida', !sim);
    $('#folha-alca').setAttribute('aria-expanded', String(sim));
    $('#folha-alca').setAttribute('aria-label', sim ? 'Recolher painel' : 'Expandir painel');
    setTimeout(enquadrar, 380);
  }
  $('#folha-alca').addEventListener('click', function () { expandir(folha.classList.contains('recolhida')); });
  window.addEventListener('resize', function () { if (document.body.getAttribute('data-pagina') === 'apartamento') enquadrar(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && escolhido) escolher(null); });

  /* ---------- Entrada/saída da página ---------- */

  window.TPApartamento = {
    entrar: function () {
      folha.classList.remove('subindo');
      void folha.offsetWidth;
      folha.classList.add('subindo');
      if (!montado) {
        montado = true;
        contar();
        desenhar();
        telaCasa();
        ordenar();
      }
      requestAnimationFrame(enquadrar);
      setTimeout(enquadrar, 600);
    },
    sair: function () { escolher(null); }
  };

  if (document.body.getAttribute('data-pagina') === 'apartamento') window.TPApartamento.entrar();
})();
