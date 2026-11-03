/*
  Encontrei o sol nos seus olhos — página "Apartamento".

  A planta é um desenho feito aqui mesmo (sem serviço externo). Toque num
  cômodo e o Cadu vai andando até lá. O painel conta quantas vezes cada
  cômodo aparece nos capítulos (a conta é feita sozinha a partir de
  capitulos.js, então atualiza quando entram capítulos novos).

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
  chamar: ['O Cadu ouviu. E ignorou.', 'O Cadu veio, mas só porque quis.', 'O Cadu levantou a orelha e voltou a dormir.'],
  carinho: ['O Cadu fechou os olhos e ronronou.', 'O Cadu aceitou. Por enquanto.', 'O Cadu fugiu para o quarto. Ele odeia visitas.'],
  contas: 'Cada uma paga a metade. A da Lorena saiu um pouco menos, porque a Juquinha conhece o dono.'
};

(function () {
  'use strict';

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var NS = 'http://www.w3.org/2000/svg';
  var ORDEM = ['sala', 'cozinha', 'quartoLorena', 'quartoJuquinha', 'banheiro', 'entrada'];

  // Geometria da planta (unidades do desenho). Cada cômodo: caixa, centro e
  // caminho do corredor (y = 300) até o centro.
  var GEO = {
    quartoLorena:   { caixa: [20, 20, 360, 240],  via: [[190, 300], [190, 210], [210, 150]] },
    banheiro:       { caixa: [380, 20, 220, 240], via: [[490, 300], [490, 210], [470, 170]] },
    quartoJuquinha: { caixa: [600, 20, 380, 240], via: [[790, 300], [790, 210], [760, 160]] },
    sala:           { caixa: [20, 340, 580, 340], via: [[300, 300], [300, 400], [330, 520]] },
    cozinha:        { caixa: [600, 340, 380, 340], via: [[800, 300], [800, 400], [820, 560]] },
    entrada:        { caixa: [420, 600, 120, 80], via: [[300, 300], [300, 400], [420, 560], [480, 630]] }
  };

  var svg, caduEl, onde = 'sala', pos = [330, 520], indo = null, selecionado = null, montado = false;
  var folha = $('#folha'), estadoEl = $('#folha-estado'), acoesEl = $('#folha-acoes'), plantaEl = $('#planta');
  var contagens = null;
  var TP = function () { return window.TP || {}; };
  var esc = function (s) { return TP().escapar ? TP().escapar(s) : String(s); };
  var sortear = function (l) { return l[Math.floor(Math.random() * l.length)]; };

  function el(nome, attrs, pai) {
    var e = document.createElementNS(NS, nome);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(e);
    return e;
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
      contagens[k] = { total: total, capitulo: melhor, vezes: max };
    });
  }

  /* ---------- Desenho ---------- */

  function desenhar() {
    plantaEl.innerHTML = '';
    svg = el('svg', { 'class': 'planta-svg', viewBox: '-10 -10 1020 720', preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true', focusable: 'false' }, plantaEl);
    var piso = el('g', {}, svg);

    // pisos dos cômodos (clicáveis)
    ORDEM.forEach(function (k) {
      if (k === 'entrada') return;
      var c = GEO[k].caixa;
      var r = el('rect', { x: c[0], y: c[1], width: c[2], height: c[3], 'class': 'p-piso p-piso-' + k, 'data-comodo': k }, piso);
      r.addEventListener('click', function () { escolher(k); });
    });
    el('rect', { x: 20, y: 260, width: 960, height: 80, 'class': 'p-piso p-corredor' }, piso);

    var mov = el('g', { 'class': 'p-moveis' }, svg);
    // Sala: tapete xadrez, sofá, TV, banquinho, plantas e janela
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

    // Cozinha: bancada em L, geladeira, fogão, mesa redonda
    el('path', { d: 'M960 360v300H760v-40h160V360z', 'class': 'p-bancada' }, mov);
    el('rect', { x: 920, y: 360, width: 40, height: 60, rx: 4, 'class': 'p-geladeira' }, mov);
    el('rect', { x: 924, y: 480, width: 32, height: 52, rx: 3, 'class': 'p-fogao' }, mov);
    [[934, 494], [946, 494], [934, 516], [946, 516]].forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: 4, 'class': 'p-boca' }, mov); });
    el('circle', { cx: 730, cy: 500, r: 50, 'class': 'p-mesa' }, mov);
    [[730, 432], [730, 568], [662, 500], [798, 500]].forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: 15, 'class': 'p-cadeira' }, mov); });
    el('circle', { cx: 730, cy: 500, r: 10, 'class': 'p-xicara' }, mov);

    // Quarto da Lorena: cama, prancheta de desenho, cabideiro
    el('rect', { x: 40, y: 40, width: 130, height: 180, rx: 8, 'class': 'p-cama' }, mov);
    el('rect', { x: 52, y: 50, width: 106, height: 34, rx: 8, 'class': 'p-travesseiro' }, mov);
    el('rect', { x: 40, y: 110, width: 130, height: 110, rx: 8, 'class': 'p-coberta p-coberta-lorena' }, mov);
    el('rect', { x: 250, y: 40, width: 110, height: 60, rx: 4, 'class': 'p-mesa-quadrada' }, mov);
    el('path', { d: 'M266 56l30 28M300 50h40', 'class': 'p-rabisco' }, mov);
    el('circle', { cx: 300, cy: 124, r: 14, 'class': 'p-cadeira' }, mov);
    el('rect', { x: 180, y: 40, width: 40, height: 40, rx: 4, 'class': 'p-mesa-quadrada' }, mov);
    el('path', { d: 'M40 20h120', 'class': 'p-janela' }, mov);

    // Banheiro
    el('rect', { x: 400, y: 40, width: 90, height: 90, rx: 6, 'class': 'p-box' }, mov);
    el('circle', { cx: 445, cy: 85, r: 6, 'class': 'p-ralo' }, mov);
    el('rect', { x: 520, y: 40, width: 60, height: 40, rx: 14, 'class': 'p-pia' }, mov);
    el('ellipse', { cx: 550, cy: 200, rx: 22, ry: 28, 'class': 'p-vaso' }, mov);

    // Quarto da Juquinha: cama, guarda-roupa, tapete
    el('rect', { x: 820, y: 40, width: 140, height: 180, rx: 8, 'class': 'p-cama' }, mov);
    el('rect', { x: 832, y: 50, width: 116, height: 34, rx: 8, 'class': 'p-travesseiro' }, mov);
    el('rect', { x: 820, y: 110, width: 140, height: 110, rx: 8, 'class': 'p-coberta p-coberta-juquinha' }, mov);
    el('rect', { x: 620, y: 40, width: 150, height: 44, rx: 4, 'class': 'p-armario' }, mov);
    el('path', { d: 'M695 40v44', 'class': 'p-rabisco' }, mov);
    el('ellipse', { cx: 740, cy: 170, rx: 56, ry: 34, 'class': 'p-tapete-redondo' }, mov);
    el('path', { d: 'M840 20h120', 'class': 'p-janela' }, mov);

    // Paredes (com vãos de porta)
    el('path', {
      'class': 'p-parede',
      d: 'M20 20H980V680H20Z' +
         'M380 20V260M600 20V260' +
         'M20 260H150M230 260H450M530 260H750M830 260H980' +
         'M20 340H250M350 340H600M600 340H750M850 340H980' +
         'M600 340V420M600 580V680'
    }, svg);
    // porta de entrada (vão na parede de baixo)
    el('path', { d: 'M440 680h80', 'class': 'p-vao' }, svg);
    el('path', { d: 'M440 680a80 80 0 0 1 80 -80', 'class': 'p-porta-arco' }, svg);
    el('path', { d: 'M520 680v-80', 'class': 'p-porta-folha' }, svg);

    // Etiquetas dos cômodos
    var et = el('g', { 'class': 'p-etiquetas' }, svg);
    var POS = { quartoLorena: [200, 246], banheiro: [490, 246], quartoJuquinha: [880, 246], sala: [320, 420], cozinha: [850, 660], entrada: [455, 590] };
    ORDEM.forEach(function (k) {
      var g = el('g', { 'class': 'p-etiqueta', 'data-comodo': k, transform: 'translate(' + POS[k][0] + ' ' + POS[k][1] + ')' }, et);
      var t = el('text', { 'text-anchor': 'middle', y: 0 }, g);
      t.textContent = COMODOS[k].nome;
      g.addEventListener('click', function () { escolher(k); });
    });

    // Cadu (visto de lado, pequeno)
    caduEl = el('g', { 'class': 'p-cadu' }, svg);
    var corpo = el('g', { 'class': 'p-cadu-corpo', transform: 'translate(-26 -30)' }, caduEl);
    corpo.innerHTML =
      '<ellipse cx="26" cy="33" rx="22" ry="3" class="p-cadu-sombra"/>' +
      '<path d="M8 20c-10-2-12-12-6-16" class="p-cadu-rabo"/>' +
      '<ellipse cx="22" cy="20" rx="17" ry="10" class="p-cadu-pelo"/>' +
      '<path d="M12 14c2 4 2 9 0 12M20 11c2 5 2 12 0 16M28 12c2 4 2 9 0 13" class="p-cadu-listra"/>' +
      '<rect x="9" y="24" width="5" height="9" rx="2" class="p-cadu-pelo"/><rect x="29" y="24" width="5" height="9" rx="2" class="p-cadu-pelo"/>' +
      '<circle cx="40" cy="12" r="9" class="p-cadu-pelo"/>' +
      '<path d="M33 7l1-9 7 6zM42 4l6-7 1 9z" class="p-cadu-pelo"/>' +
      '<circle cx="43" cy="11" r="1.8" class="p-cadu-olho"/>' +
      '<path d="M48 14l2 1" class="p-cadu-listra"/>';
    moverCadu(pos, 1);
  }

  /* ---------- Cadu andando ---------- */

  function moverCadu(p, direcao) {
    pos = p;
    var s = direcao < 0 ? -1 : 1;
    caduEl.setAttribute('transform', 'translate(' + p[0] + ' ' + p[1] + ') scale(' + (1.25 * s) + ' 1.25)');
  }

  function caminho(de, para) {
    var a = GEO[de].via.slice().reverse(), b = GEO[para].via;
    var pts = [pos].concat(a.slice(1)).concat(b);
    return pts;
  }

  function andarAte(destino, aoChegar) {
    if (indo) cancelAnimationFrame(indo.raf);
    if (destino === onde && !indo) { if (aoChegar) aoChegar(); return; }
    var pts = caminho(onde, destino);
    var acc = [0];
    for (var i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var total = acc[acc.length - 1] || 1;
    var reduzido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dur = reduzido ? 1 : Math.max(700, total / 0.32);
    var t0 = performance.now(), dir = 1;
    caduEl.classList.add('andando');
    onde = destino;
    indo = {};
    (function passo(agora) {
      var t = Math.min(1, (agora - t0) / dur), alvo = total * t;
      for (var k = 1; k < pts.length; k++) {
        if (acc[k] >= alvo) {
          var f = (alvo - acc[k - 1]) / ((acc[k] - acc[k - 1]) || 1);
          var dx = pts[k][0] - pts[k - 1][0];
          if (Math.abs(dx) > 1) dir = dx < 0 ? -1 : 1;
          moverCadu([pts[k - 1][0] + dx * f, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f], dir);
          break;
        }
      }
      if (t < 1) { indo.raf = requestAnimationFrame(passo); }
      else { indo = null; caduEl.classList.remove('andando'); atualizarStatus(); if (aoChegar) aoChegar(); }
    })(t0);
    atualizarStatus(true);
  }

  /* ---------- Painel ---------- */

  function nomeNoCadu(k) {
    return { sala: 'na sala', cozinha: 'na cozinha', quartoLorena: 'no quarto da Lorena', quartoJuquinha: 'no quarto da Juquinha', banheiro: 'no banheiro', entrada: 'na porta de entrada' }[k];
  }

  function atualizarStatus(andando) {
    var s = $('#cadu-status');
    if (s) s.textContent = andando ? 'Cadu está indo ' + nomeNoCadu(onde).replace(/^n/, 'pr') + '…' : 'Cadu está ' + nomeNoCadu(onde) + '.';
    document.querySelectorAll('.p-piso').forEach(function (r) { r.classList.toggle('escolhido', r.getAttribute('data-comodo') === selecionado); });
    document.querySelectorAll('.p-etiqueta').forEach(function (g) { g.classList.toggle('escolhida', g.getAttribute('data-comodo') === selecionado); });
    document.querySelectorAll('.comodo-item').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-comodo') === selecionado)); });
  }

  function cartaoComodo() {
    if (!selecionado) return '';
    var c = COMODOS[selecionado], n = contagens[selecionado];
    return '<div class="comodo-cartao">' +
      '<p class="folha-rotulo">Cômodo</p>' +
      '<h2 class="folha-titulo">' + esc(c.nome) + '</h2>' +
      '<p class="comodo-detalhe">' + esc(c.detalhe) + '</p>' +
      (n && n.total
        ? '<p class="comodo-numeros"><strong>' + n.total.toLocaleString('pt-BR') + '</strong> menções nos capítulos · mais vezes no <a href="#capitulo-' + n.capitulo + '">capítulo ' + n.capitulo + '</a></p>'
        : '') +
    '</div>';
  }

  function telaCasa() {
    var t = TP(), lorena = t.acharPessoa && t.acharPessoa('lorena'), juquinha = t.acharPessoa && t.acharPessoa('eduarda');
    estadoEl.innerHTML =
      cartaoComodo() +
      (selecionado ? '' :
        '<p class="folha-rotulo">Apartamento em São Paulo</p>' +
        '<h2 class="folha-titulo">Bem-vinda. Fica à vontade, só não liga se o Cadu fugir.</h2>') +
      '<div class="moradoras">' +
        '<span class="moradora" id="m-lorena"></span>' +
        '<span class="moradora" id="m-juquinha"></span>' +
        '<span class="moradoras-info"><strong>Lorena e Juquinha</strong><small>Colegas de apartamento</small></span>' +
      '</div>' +
      '<div class="contas"><p class="contas-titulo">Contas da casa</p><div class="contas-barra"><span class="contas-l">metade</span><span class="contas-j">metade</span></div><p class="contas-nota">' + esc(FRASES.contas) + '</p></div>' +
      '<p class="cadu-status"><span class="cadu-pata" aria-hidden="true">🐾</span><span id="cadu-status"></span></p>' +
      '<ul class="comodos" aria-label="Cômodos">' + ORDEM.map(function (k) {
        var n = contagens[k];
        return '<li><button type="button" class="comodo-item" data-comodo="' + k + '" aria-pressed="false">' +
          '<span>' + esc(COMODOS[k].nome) + '</span><small>' + (n && n.total ? n.total.toLocaleString('pt-BR') + ' menções' : '') + '</small></button></li>';
      }).join('') + '</ul>';
    if (lorena && t.criarFoto) $('#m-lorena').appendChild(t.criarFoto(lorena, 'moradora-foto'));
    if (juquinha && t.criarFoto) $('#m-juquinha').appendChild(t.criarFoto(juquinha, 'moradora-foto'));
    estadoEl.querySelectorAll('.comodo-item').forEach(function (b) {
      b.addEventListener('click', function () { escolher(b.getAttribute('data-comodo')); });
    });
    acoesEl.innerHTML =
      '<button type="button" class="ap-botao" id="botao-chamar">Chamar o Cadu</button>' +
      '<button type="button" class="ap-botao ap-botao-secundario" id="botao-carinho">Fazer carinho</button>';
    $('#botao-chamar').addEventListener('click', chamar);
    $('#botao-carinho').addEventListener('click', carinho);
    atualizarStatus(!!indo);
  }

  function escolher(k) {
    selecionado = k;
    telaCasa();
    expandir(true);
    andarAte(k);
    if (window.innerWidth < 760) folha.scrollTop = 0;
  }

  function chamar() {
    var frase = sortear(FRASES.chamar);
    if (frase.indexOf('ignorou') !== -1 || frase.indexOf('dormir') !== -1) { if (TP().toast) TP().toast(frase); return; }
    if (TP().toast) TP().toast(frase);
    selecionado = 'sala'; telaCasa(); andarAte('sala');
  }

  function carinho() {
    var frase = sortear(FRASES.carinho);
    if (TP().toast) TP().toast(frase);
    if (frase.indexOf('fugiu') !== -1) { selecionado = 'quartoJuquinha'; telaCasa(); andarAte('quartoJuquinha'); }
    else { caduEl.classList.remove('ronrona'); void caduEl.getBBox(); caduEl.classList.add('ronrona'); }
  }

  /* ---------- Painel recolhível e enquadramento ---------- */

  function enquadrar() {
    if (!svg) return;
    var largo = window.innerWidth >= 760;
    if (largo) { plantaEl.style.paddingBottom = ''; }
    else {
      var fh = folha.classList.contains('recolhida') ? 96 : Math.min(folha.offsetHeight, window.innerHeight * 0.58);
      plantaEl.style.paddingBottom = (fh + 12) + 'px';
    }
  }

  function expandir(sim) {
    folha.classList.toggle('recolhida', !sim);
    $('#folha-alca').setAttribute('aria-expanded', String(sim));
    $('#folha-alca').setAttribute('aria-label', sim ? 'Recolher painel' : 'Expandir painel');
    setTimeout(enquadrar, 380);
  }
  $('#folha-alca').addEventListener('click', function () { expandir(folha.classList.contains('recolhida')); });
  window.addEventListener('resize', function () { if (document.body.getAttribute('data-pagina') === 'apartamento') enquadrar(); });

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
      }
      requestAnimationFrame(enquadrar);
      setTimeout(enquadrar, 600);
    },
    sair: function () {}
  };

  // Este arquivo carrega depois do app.js: se a página já é o apartamento, entra agora
  if (document.body.getAttribute('data-pagina') === 'apartamento') window.TPApartamento.entrar();
})();
