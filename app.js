/*
  Encontrei o sol nos seus olhos — lógica do site.
  O conteúdo vem de capitulos.js, personagens.js e tema.js; este arquivo só monta as páginas.
*/
(function () {
  'use strict';

  var PALAVRAS_POR_MINUTO = 200;
  var FONTE_MIN = 14, FONTE_MAX = 26, FONTE_PASSO = 2, FONTE_PADRAO = 18;
  var CHAVES = { tema: 'esol-tema', fonte: 'esol-fonte', idade: 'esol-maior-18', progresso: 'esol-progresso' };
  var NOME_SITE = 'Encontrei o sol nos seus olhos';

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var guardar = {
    ler: function (k, padrao) {
      try { var v = localStorage.getItem(k); return v === null ? padrao : JSON.parse(v); } catch (e) { return padrao; }
    },
    salvar: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // Linhas tipo "**Lorena**" marcam de quem é o ponto de vista do trecho
  var RE_VOZ = /^\*\*([^*\n]{1,24})\*\*$/;
  var RE_QUANDO = /^\*\*\*([^*\n]+)\*\*\*$/;

  /* ---------- Dados ---------- */

  var capitulos = (typeof CAPITULOS !== 'undefined' && Array.isArray(CAPITULOS) ? CAPITULOS : [])
    .filter(function (c) { return c && c.texto != null; })
    .map(function (c) {
      var palavras = contarPalavras(c.texto);
      return {
        numero: Number(c.numero),
        titulo: String(c.titulo || ('Capítulo ' + c.numero)),
        texto: String(c.texto),
        notaInicio: c.notaInicio ? String(c.notaInicio) : '',
        notaFim: c.notaFim ? String(c.notaFim) : '',
        vozes: vozesDoTexto(c.texto),
        palavras: palavras,
        minutos: Math.max(1, Math.ceil(palavras / PALAVRAS_POR_MINUTO))
      };
    })
    .sort(function (a, b) { return a.numero - b.numero; });

  var personagens = (typeof PERSONAGENS !== 'undefined' && Array.isArray(PERSONAGENS) ? PERSONAGENS : [])
    .filter(Boolean);

  var musica = typeof MUSICA_TEMA !== 'undefined' ? MUSICA_TEMA : null;

  /* ---------- Texto ---------- */

  function contarPalavras(texto) {
    var m = String(texto).match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu);
    return m ? m.length : 0;
  }


  function vozesDoTexto(texto) {
    var vistas = [];
    String(texto).split('\n').forEach(function (l) {
      var m = l.trim().match(RE_VOZ);
      if (m && vistas.indexOf(m[1].trim()) === -1) vistas.push(m[1].trim());
    });
    return vistas;
  }

  function numeroBR(n) { return Number(n).toLocaleString('pt-BR'); }
  function dois(n) { return (n < 10 ? '0' : '') + n; }

  function metaCapitulo(c) {
    return '≈ ' + c.minutos + ' min de leitura · ' + numeroBR(c.palavras) + (c.palavras === 1 ? ' palavra' : ' palavras');
  }

  function escapar(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function formatarLinha(s) {
    return escapar(s)
      .replace(/\*\*(?=\S)([^*\n]+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(?=\S)([^*\n]+?)\*/g, '<em>$1</em>');
  }

  var ehDivisor = function (l) { return /^(\*\s*){3,}$/.test(l) || /^\[(\.{3}|…)\]$/.test(l); };
  var ehFala = function (l) { return /^[—–]/.test(l) || /^-\s/.test(l); };

  // Linha em branco = novo parágrafo; cada fala com travessão também vira parágrafo.
  function textoParaHTML(texto) {
    var linhas = String(texto).replace(/\r\n?/g, '\n').split('\n');
    var html = [], atual = [], anteriorFala = false;
    function fechar() {
      if (atual.length) html.push('<p>' + atual.map(formatarLinha).join('<br>') + '</p>');
      atual = [];
    }
    linhas.forEach(function (bruta) {
      var l = bruta.trim();
      if (!l) { fechar(); anteriorFala = false; return; }
      if (ehDivisor(l)) {
        fechar();
        html.push('<div class="divisor" role="separator"><span aria-hidden="true">☀</span></div>');
        anteriorFala = false;
        return;
      }
      var q = l.match(RE_QUANDO);
      if (q && !atual.length) { html.push('<p class="marca-tempo">' + escapar(q[1]) + '</p>'); return; }
      var v = l.match(RE_VOZ);
      if (v && !atual.length) {
        html.push('<p class="voz" data-voz="' + escapar(v[1].trim()) + '"><span>' + escapar(v[1].trim()) + '</span></p>');
        return;
      }
      var fala = ehFala(l);
      if (atual.length && (fala || anteriorFala)) fechar();
      atual.push(l);
      anteriorFala = fala;
    });
    fechar();
    return html.join('\n');
  }

  /* ---------- Fotos (com inicial quando não há imagem) ---------- */

  function acharPessoa(nome) {
    var n = String(nome).toLowerCase();
    return personagens.find(function (p) {
      return p.id === n || String(p.nome).toLowerCase().indexOf(n) === 0 ||
        String(p.apelido || '').toLowerCase().split(/\s*·\s*/).indexOf(n) !== -1;
    });
  }

  function criarFoto(p, classe) {
    var caixa = document.createElement('div');
    caixa.className = 'foto' + (classe ? ' ' + classe : '');
    var inicial = document.createElement('span');
    inicial.className = 'foto-inicial';
    inicial.setAttribute('aria-hidden', 'true');
    inicial.textContent = String(p.nome || '?').trim().charAt(0).toUpperCase();
    caixa.appendChild(inicial);
    if (p.foto) {
      var img = new Image();
      img.alt = p.nome || '';
      img.decoding = 'async';
      img.onload = function () { caixa.classList.add('tem-foto'); };
      img.onerror = function () { img.remove(); };
      img.src = p.foto;
      caixa.appendChild(img);
    }
    return caixa;
  }

  /* ---------- Aviso rápido ---------- */

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('visivel');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('visivel'); }, 2800);
  }

  /* ---------- Tema: acender e apagar a luz ---------- */

  function aplicarTema(t) {
    document.documentElement.setAttribute('data-tema', t);
    $('#botao-tema').setAttribute('aria-label', t === 'noite' ? 'Acender a luz (modo claro)' : 'Apagar a luz (modo escuro)');
  }
  aplicarTema(document.documentElement.getAttribute('data-tema') || 'dia');
  $('#botao-tema').addEventListener('click', function () {
    var novo = document.documentElement.getAttribute('data-tema') === 'noite' ? 'dia' : 'noite';
    aplicarTema(novo);
    guardar.salvar(CHAVES.tema, novo);
  });

  /* ---------- Menu hambúrguer ---------- */

  var botaoMenu = $('#botao-menu'), menu = $('#menu');
  function abrirMenu(abrir) {
    menu.classList.toggle('aberto', abrir);
    document.body.classList.toggle('menu-aberto', abrir);
    botaoMenu.setAttribute('aria-expanded', String(abrir));
    botaoMenu.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
  }
  botaoMenu.addEventListener('click', function () { abrirMenu(!menu.classList.contains('aberto')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { abrirMenu(false); }); });

  /* ---------- Música-tema ---------- */

  function linksMusica() {
    var q = encodeURIComponent(musica.titulo + ' ' + musica.artista);
    return {
      spotify: musica.spotifyId ? 'https://open.spotify.com/track/' + encodeURIComponent(musica.spotifyId) : 'https://open.spotify.com/search/' + q,
      youtube: 'https://www.youtube.com/results?search_query=' + q
    };
  }

  function montarMusica() {
    var alvo = $('#vitrola'), rodape = $('#rodape-musica');
    if (!musica) { alvo.hidden = true; return; }
    var l = linksMusica();
    alvo.innerHTML =
      '<div class="vitrola-disco" aria-hidden="true"><span class="vitrola-selo"></span></div>' +
      '<div class="vitrola-info">' +
        '<p class="vitrola-rotulo"><span class="vitrola-ondas" aria-hidden="true"><i></i><i></i><i></i></span>Música-tema</p>' +
        '<strong class="vitrola-titulo">' + escapar(musica.titulo) + '</strong>' +
        '<span class="vitrola-artista">' + escapar(musica.artista) + ' · <em>' + escapar(musica.album) + '</em> (' + escapar(musica.ano) + ') · ' + escapar(musica.duracao) + '</span>' +
        '<div class="vitrola-botoes">' +
          '<a class="botao botao-primario botao-pequeno" href="' + l.spotify + '" target="_blank" rel="noopener">▶ Ouvir no Spotify</a>' +
          '<a class="botao botao-secundario botao-pequeno" href="' + l.youtube + '" target="_blank" rel="noopener">YouTube</a>' +
        '</div>' +
      '</div>' +
      (musica.spotifyId
        ? '<iframe class="vitrola-player" title="Player do Spotify: ' + escapar(musica.titulo) + '" src="https://open.spotify.com/embed/track/' + encodeURIComponent(musica.spotifyId) + '?utm_source=generator" height="152" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>'
        : '');
    rodape.innerHTML = '♪ Música-tema: <a href="' + l.spotify + '" target="_blank" rel="noopener">' + escapar(musica.titulo) + '</a>, ' + escapar(musica.artista);
  }

  /* ---------- Início ---------- */

  function montarInicio() {
    var arte = $('#arte-svg');
    if (arte && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) arte.classList.add('parada');

    var total = capitulos.reduce(function (s, c) { return s + c.palavras; }, 0);
    var min = Math.max(1, Math.ceil(total / PALAVRAS_POR_MINUTO));
    var horas = Math.floor(min / 60), resto = min % 60;
    $('#inicio-numeros').textContent = capitulos.length
      ? capitulos.length + (capitulos.length === 1 ? ' capítulo' : ' capítulos') + ' · ' + numeroBR(total) + ' palavras · ≈ ' + (horas ? horas + ' h ' + (resto ? resto + ' min' : '') : min + ' min') + ' de leitura'
      : 'Nenhum capítulo publicado ainda';
    if (capitulos.length) {
      $('#botao-comecar').setAttribute('href', '#capitulo-' + capitulos[0].numero);
      $('.porta-pilula').textContent = 'Cap. ' + capitulos[0].numero;
    }

    var p = guardar.ler(CHAVES.progresso, null);
    var cap = p && capitulos.find(function (c) { return c.numero === p.numero; });
    var botao = $('#botao-continuar');
    botao.disabled = !cap;
    $('#continuar-detalhe').textContent = cap
      ? 'Capítulo ' + cap.numero + (cap.titulo !== 'Capítulo ' + cap.numero ? ' · ' + cap.titulo : '') + ' · ' + Math.round((p.posicao || 0) * 100) + '% lido'
      : 'Nenhuma leitura salva ainda';

    montarRecados(cap);
  }

  // Os próximos capítulos aparecem como recados presos na geladeira
  function montarRecados(lendo) {
    var lista = $('#recados');
    if (!capitulos.length) {
      lista.innerHTML = '<li class="vazio">Nenhum recado ainda. Adicione capítulos em <code>capitulos.js</code>.</li>';
      return;
    }
    var i = lendo ? capitulos.indexOf(lendo) : 0;
    var inicio = Math.max(0, Math.min(i, capitulos.length - 4));
    var mostrar = capitulos.slice(inicio, inicio + 4);
    lista.innerHTML = mostrar.map(function (c, k) {
      var atual = lendo && lendo.numero === c.numero;
      var rotulo = atual ? 'Lendo agora' : (lendo && c.numero < lendo.numero ? 'Já lido' : (k === 0 && !lendo ? 'Comece aqui' : 'Próximo'));
      return '<li><a class="recado' + (atual ? ' lendo' : '') + '" href="#capitulo-' + c.numero + '" style="--giro:' + ([-2.2, 1.6, -1, 2.4][k]) + 'deg">' +
        '<span class="recado-ima" aria-hidden="true"></span>' +
        '<small>' + rotulo + '</small>' +
        '<strong>' + escapar(c.titulo) + '</strong>' +
        '<span>≈ ' + c.minutos + ' min' + (c.vozes.length ? ' · ' + escapar(c.vozes.join(' e ')) : '') + '</span>' +
      '</a></li>';
    }).join('') +
    (capitulos.length > 4 ? '<li><a class="recado recado-todos" href="#capitulos" style="--giro:-1.4deg"><span class="recado-ima" aria-hidden="true"></span><small>Todos</small><strong>Ver os ' + capitulos.length + ' capítulos</strong><span>Índice completo ›</span></a></li>' : '');
  }

  $('#botao-continuar').addEventListener('click', function () {
    var p = guardar.ler(CHAVES.progresso, null);
    if (!p) return;
    retomar = p.posicao || 0;
    navegar('#capitulo-' + p.numero);
  });

  /* ---------- Índice ---------- */

  function chipsVozes(vozes) {
    return vozes.map(function (v) {
      return '<span class="chip-voz" data-voz="' + escapar(v) + '">' + escapar(v) + '</span>';
    }).join('');
  }

  function montarIndice() {
    var lista = $('#lista-capitulos');
    var total = capitulos.reduce(function (s, c) { return s + c.palavras; }, 0);
    $('#indice-resumo').textContent = capitulos.length
      ? capitulos.length + (capitulos.length === 1 ? ' capítulo' : ' capítulos') + ' · ' + numeroBR(total) + ' palavras no total'
      : '';
    var p = guardar.ler(CHAVES.progresso, null);
    if (!capitulos.length) {
      lista.innerHTML = '<li class="vazio">Ainda não há capítulos. Adicione o primeiro em <code>capitulos.js</code>.</li>';
      return;
    }
    lista.innerHTML = capitulos.map(function (c) {
      var lendo = p && p.numero === c.numero;
      var lido = p && c.numero < p.numero;
      var mostrarTitulo = c.titulo !== 'Capítulo ' + c.numero;
      return '<li><a class="item-capitulo' + (lendo ? ' lendo' : '') + (lido ? ' lido' : '') + '" href="#capitulo-' + c.numero + '">' +
        '<span class="item-numero" aria-hidden="true"><small>apto</small>' + dois(c.numero) + '</span>' +
        '<span class="item-corpo">' +
          '<span class="item-titulo">' + escapar(mostrarTitulo ? c.titulo : 'Capítulo ' + c.numero) + (lendo ? ' <span class="selo">lendo agora</span>' : '') + '</span>' +
          '<span class="item-meta">' + metaCapitulo(c) + (c.notaInicio || c.notaFim ? ' · <span class="item-bilhete">com bilhete da autora</span>' : '') + '</span>' +
          (c.vozes.length ? '<span class="item-vozes">' + chipsVozes(c.vozes) + '</span>' : '') +
        '</span>' +
        '<span class="item-seta" aria-hidden="true">›</span>' +
      '</a></li>';
    }).join('');
  }

  /* ---------- Leitura ---------- */

  var retomar = null;        // posição (0–1) a restaurar ao abrir capítulo
  var capituloAtual = null;
  var salvarTimer;

  var FRASES_CADU = [
    'está dormindo no sofá',
    'observa tudo do braço do sofá',
    'foi se esconder no quarto',
    'está aos seus pés, esperando o café',
    'está arranhando a porta',
    'fingiu que não te viu',
    'se espreguiçou no tapete',
    'está se lambendo, alheio a tudo'
  ];

  function fonteAtual() { return guardar.ler(CHAVES.fonte, FONTE_PADRAO); }

  function aplicarFonte(px) {
    document.documentElement.style.setProperty('--fonte-leitura', px + 'px');
    var menos = $('#fonte-menos'), mais = $('#fonte-mais');
    if (menos) menos.disabled = px <= FONTE_MIN;
    if (mais) mais.disabled = px >= FONTE_MAX;
  }

  function posicaoLeitura() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  function irPara(posicao) {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.round(max * posicao));
  }

  function bilhete(texto, rotulo, classe) {
    if (!texto) return '';
    return '<aside class="bilhete-autora ' + classe + '">' +
      '<p class="bilhete-rotulo">' + rotulo + '</p>' +
      '<div class="bilhete-texto">' + textoParaHTML(texto) + '</div>' +
      '<p class="bilhete-assinatura">wildshoni</p>' +
    '</aside>';
  }

  function mostrarCapitulo(numero) {
    var alvo = $('#leitura');
    var i = capitulos.findIndex(function (c) { return c.numero === numero; });
    var c = capitulos[i];
    capituloAtual = null;

    if (!c) {
      alvo.innerHTML = '<div class="largura nao-encontrado"><h1>Capítulo não encontrado</h1>' +
        '<p>Essa porta ainda não existe.</p><a class="botao botao-primario" href="#capitulos">Ver índice</a></div>';
      return;
    }

    if (!guardar.ler(CHAVES.idade, false)) {
      alvo.innerHTML =
        '<div class="aviso-idade" role="alertdialog" aria-labelledby="aviso-titulo" aria-describedby="aviso-texto">' +
          '<span class="aviso-selo" aria-hidden="true">+18</span>' +
          '<h1 id="aviso-titulo">Antes de entrar</h1>' +
          '<p id="aviso-texto">Esta história é classificada como <strong>Explicit</strong> no AO3: tem conteúdo adulto e é indicada apenas para maiores de 18 anos.</p>' +
          '<button class="botao botao-primario" id="aceitar-idade" type="button">Tenho 18 anos ou mais, entrar</button>' +
          '<a class="botao botao-texto" href="#inicio">Voltar ao início</a>' +
        '</div>';
      $('#aceitar-idade').addEventListener('click', function () {
        guardar.salvar(CHAVES.idade, true);
        mostrarCapitulo(numero);
        window.scrollTo(0, 0);
      });
      $('#aceitar-idade').focus({ preventScroll: true });
      return;
    }

    var ant = capitulos[i - 1], prox = capitulos[i + 1];
    var mostrarTitulo = c.titulo !== 'Capítulo ' + c.numero;
    var nome = mostrarTitulo ? c.titulo : 'Capítulo ' + c.numero;

    var corpoHTML = textoParaHTML(c.texto);
    var paragrafos = (corpoHTML.match(/<p>/g) || []).length;
    var cadu = acharPessoa('cadu') || { nome: 'Cadu' };
    var frase = FRASES_CADU[(c.numero - 1) % FRASES_CADU.length];

    alvo.innerHTML =
      '<article class="capitulo">' +
        // Cabeçalho no formato de bilhete preso na porta da geladeira
        '<header class="capitulo-cabecalho bilhete" id="bilhete">' +
          '<span class="bilhete-fita" aria-hidden="true"></span>' +
          '<nav class="bilhete-nav" aria-label="Navegação do capítulo">' +
            '<a class="bilhete-voltar" href="#capitulos"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Capítulos</a>' +
            (prox ? '<a class="bilhete-proximo" href="#capitulo-' + prox.numero + '" aria-label="Próximo capítulo: ' + escapar(prox.titulo) + '">Próximo<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>'
                  : '<span class="bilhete-proximo desativado" aria-disabled="true">Último</span>') +
          '</nav>' +
          '<p class="bilhete-status"><span class="bilhete-luz" aria-hidden="true"></span>Luz acesa · Capítulo ' + c.numero + ' de ' + capitulos.length + '</p>' +
          '<h1 class="capitulo-titulo">' + escapar(nome) + '</h1>' +
          '<p class="bilhete-eta"><strong id="bilhete-restante">Termina em ' + c.minutos + ' min</strong> <span id="bilhete-hora"></span></p>' +
          '<div class="bilhete-barra" aria-hidden="true"><span id="bilhete-barra"></span></div>' +
          (c.vozes.length
            ? '<div class="bilhete-vozes"><small>Quem narra</small><ol>' + c.vozes.map(function (v) {
                return '<li><span class="bilhete-voz-foto" data-pessoa="' + escapar(v) + '"></span>' + escapar(v) + '</li>';
              }).join('') + '</ol></div>'
            : '') +
          '<ul class="bilhete-dados">' +
            '<li><strong>≈ ' + c.minutos + ' min</strong><small>de leitura</small></li>' +
            '<li><strong>' + numeroBR(c.palavras) + '</strong><small>' + (c.palavras === 1 ? 'palavra' : 'palavras') + '</small></li>' +
            '<li><strong>' + numeroBR(paragrafos) + '</strong><small>parágrafos</small></li>' +
          '</ul>' +
          '<div class="bilhete-casa">' +
            '<span class="bilhete-cadu" id="bilhete-cadu"></span>' +
            '<span class="bilhete-casa-info"><strong>Cadu</strong><small>' + frase + '</small></span>' +
            '<span class="bilhete-chave" title="Chave do capítulo"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7.5" cy="12" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 12h9M17 12v3M19.5 12v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' + dois(c.numero) + '</span>' +
          '</div>' +
        '</header>' +
        '<div class="capitulo-ferramentas">' +
          '<div class="ajuste-fonte" role="group" aria-label="Tamanho da letra">' +
            '<span class="ajuste-fonte-rotulo" aria-hidden="true">Tamanho da letra</span>' +
            '<button type="button" id="fonte-menos" aria-label="Diminuir letra">A−</button>' +
            '<button type="button" id="fonte-mais" aria-label="Aumentar letra">A+</button>' +
          '</div>' +
        '</div>' +
        bilhete(c.notaInicio, 'Bilhete da autora', 'bilhete-inicio') +
        '<div class="texto">' + corpoHTML + '</div>' +
        '<p class="capitulo-fim" aria-hidden="true">☀</p>' +
        bilhete(c.notaFim, 'Recado no fim do capítulo', 'bilhete-fim') +
        '<nav class="capitulo-nav" aria-label="Navegação entre capítulos">' +
          (ant ? '<a class="botao botao-secundario" href="#capitulo-' + ant.numero + '">‹ Anterior</a>'
               : '<span class="botao botao-secundario desativado" aria-disabled="true">‹ Anterior</span>') +
          '<a class="botao botao-secundario" href="#capitulos">Índice</a>' +
          (prox ? '<a class="botao botao-primario" href="#capitulo-' + prox.numero + '">Próximo ›</a>'
                : '<span class="botao botao-primario desativado" aria-disabled="true">Fim ☀</span>') +
        '</nav>' +
      '</article>';

    aplicarFonte(fonteAtual());
    $('#fonte-menos').addEventListener('click', function () { mudarFonte(-FONTE_PASSO); });
    $('#fonte-mais').addEventListener('click', function () { mudarFonte(FONTE_PASSO); });

    $('#bilhete-cadu').appendChild(criarFoto(cadu, 'bilhete-foto'));
    $$('.bilhete-voz-foto', alvo).forEach(function (el) {
      var p = acharPessoa(el.getAttribute('data-pessoa'));
      if (p) el.appendChild(criarFoto(p, 'voz-foto'));
    });
    $('#leitura-mini').innerHTML =
      '<span class="bilhete-luz"></span><span class="leitura-mini-texto">Cap. ' + c.numero + ' · <strong id="leitura-mini-restante">' + c.minutos + ' min</strong></span>' +
      '<span class="leitura-mini-barra"><span id="leitura-mini-barra"></span></span>';
    $('#leitura-mini').classList.remove('visivel');
    vigiarCabecalho();

    capituloAtual = c;
    atualizarBilhete(0);
    var pos = retomar;
    retomar = null;
    if (pos != null) {
      requestAnimationFrame(function () { irPara(pos); atualizarProgresso(); });
    } else {
      guardar.salvar(CHAVES.progresso, { numero: c.numero, posicao: 0 });
    }
  }

  /* ---------- Cabeçalho "bilhete" ---------- */

  function horaBR(min) {
    return new Date(Date.now() + min * 60000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function atualizarBilhete(pos) {
    if (!capituloAtual) return;
    var falta = Math.max(1, Math.ceil((1 - pos) * capituloAtual.minutos));
    var acabou = pos >= 0.985;
    var r = $('#bilhete-restante'), h = $('#bilhete-hora'), b = $('#bilhete-barra');
    var mr = $('#leitura-mini-restante'), mb = $('#leitura-mini-barra');
    if (r) r.textContent = acabou ? 'Você chegou ao fim do capítulo' : 'Termina em ' + falta + ' min';
    if (h) h.textContent = acabou ? '' : '· lá pelas ' + horaBR(falta);
    if (b) b.style.transform = 'scaleX(' + Math.max(0.02, pos) + ')';
    if (mr) mr.textContent = acabou ? 'fim' : 'faltam ' + falta + ' min';
    if (mb) mb.style.transform = 'scaleX(' + pos + ')';
  }

  var observador = null;
  function vigiarCabecalho() {
    if (observador) observador.disconnect();
    var cab = $('#bilhete'), mini = $('#leitura-mini');
    if (!cab || !mini || typeof IntersectionObserver === 'undefined') return;
    observador = new IntersectionObserver(function (itens) {
      mini.classList.toggle('visivel', !itens[0].isIntersecting && itens[0].boundingClientRect.top < 0);
    });
    observador.observe(cab);
  }

  setInterval(function () { if (capituloAtual) atualizarBilhete(posicaoLeitura()); }, 30000);

  function mudarFonte(delta) {
    var pos = posicaoLeitura();
    var px = Math.min(FONTE_MAX, Math.max(FONTE_MIN, fonteAtual() + delta));
    guardar.salvar(CHAVES.fonte, px);
    aplicarFonte(px);
    irPara(pos);
  }

  var barra = $('#progresso-leitura span');
  var agendado = false;
  function atualizarProgresso() {
    agendado = false;
    if (!capituloAtual) return;
    var pos = posicaoLeitura();
    barra.style.transform = 'scaleX(' + pos + ')';
    atualizarBilhete(pos);
    clearTimeout(salvarTimer);
    var numero = capituloAtual.numero;
    salvarTimer = setTimeout(function () {
      guardar.salvar(CHAVES.progresso, { numero: numero, posicao: Math.round(pos * 1000) / 1000 });
    }, 250);
  }
  window.addEventListener('scroll', function () {
    if (!agendado) { agendado = true; requestAnimationFrame(atualizarProgresso); }
  }, { passive: true });
  window.addEventListener('resize', function () { if (capituloAtual) atualizarProgresso(); });

  /* ---------- Moradoras ---------- */

  function montarPersonagens() {
    var grades = { casa: $('#grade-casa'), visitas: $('#grade-visitas') };
    grades.casa.innerHTML = ''; grades.visitas.innerHTML = '';
    personagens.forEach(function (p, i) {
      var grade = grades[p.grupo === 'casa' ? 'casa' : 'visitas'];
      var cartao = document.createElement('div');
      cartao.className = 'cartao';
      cartao.style.setProperty('--atraso', (i * 45) + 'ms');
      cartao.style.setProperty('--giro', ([-2, 1.5, -1, 2, -1.6, 1][i % 6]) + 'deg');

      var giro = document.createElement('div');
      giro.className = 'cartao-giro';
      giro.setAttribute('role', 'button');
      giro.setAttribute('tabindex', '0');
      giro.setAttribute('aria-pressed', 'false');
      giro.setAttribute('aria-label', (p.nome || '') + ', virar foto');

      var frente = document.createElement('div');
      frente.className = 'cartao-face cartao-frente';
      frente.insertAdjacentHTML('beforeend', '<span class="cartao-fita" aria-hidden="true"></span>');
      frente.appendChild(criarFoto(p, 'cartao-foto'));
      frente.insertAdjacentHTML('beforeend',
        '<div class="cartao-legenda">' +
          '<strong class="cartao-nome">' + escapar(p.apelido || p.nome || '') + '</strong>' +
          '<span class="cartao-papel">' + escapar(p.papel || '') + '</span>' +
        '</div>');

      var verso = document.createElement('div');
      verso.className = 'cartao-face cartao-verso';
      verso.innerHTML =
        '<strong class="cartao-nome">' + escapar(p.nome || '') + '</strong>' +
        '<span class="cartao-papel">' + escapar(p.papel || '') + '</span>' +
        '<p class="cartao-curta">' + formatarLinha(p.descricaoCurta || '') + '</p>' +
        (p.descricaoLonga ? '<button type="button" class="botao botao-primario botao-pequeno">Ver mais</button>' : '');

      giro.appendChild(frente);
      giro.appendChild(verso);
      cartao.appendChild(giro);
      grade.appendChild(cartao);

      function virar() {
        var virado = giro.classList.toggle('virado');
        giro.setAttribute('aria-pressed', String(virado));
      }
      giro.addEventListener('click', virar);
      giro.addEventListener('keydown', function (e) {
        if (e.target === giro && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); virar(); }
      });
      var verMais = $('button', verso);
      if (verMais) {
        verMais.addEventListener('click', function (e) { e.stopPropagation(); abrirModal(p, giro); });
        verMais.addEventListener('keydown', function (e) { e.stopPropagation(); });
      }
    });
  }

  /* ---------- Modal ---------- */

  var modal = $('#modal'), origemModal = null;

  function abrirModal(p, origem) {
    origemModal = origem;
    var foto = $('#modal-foto');
    foto.innerHTML = '';
    foto.appendChild(criarFoto(p, 'modal-imagem'));
    $('#modal-apelido').textContent = p.apelido || '';
    $('#modal-nome').textContent = p.nome || '';
    $('#modal-papel').textContent = p.papel || '';
    $('#modal-texto').innerHTML = textoParaHTML(p.descricaoLonga || '');
    modal.hidden = false;
    document.body.classList.add('sem-rolagem');
    requestAnimationFrame(function () { modal.classList.add('aberto'); $('.modal-x', modal).focus(); });
  }

  function fecharModal() {
    if (modal.hidden) return;
    modal.classList.remove('aberto');
    document.body.classList.remove('sem-rolagem');
    setTimeout(function () { modal.hidden = true; }, 220);
    if (origemModal) origemModal.focus({ preventScroll: true });
  }

  modal.addEventListener('click', function (e) { if (e.target.closest('[data-fechar]')) fecharModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!modal.hidden) fecharModal();
      else if (menu.classList.contains('aberto')) abrirMenu(false);
    }
  });

  /* ---------- Rotas (#inicio, #capitulos, #capitulo-3, #moradoras, #apartamento) ---------- */

  var paginaAtual = null;

  function navegar(hash) {
    if (location.hash === hash) rota();
    else location.hash = hash;
  }

  function mostrarPagina(nome, menuAtivo) {
    $$('.pagina').forEach(function (s) { s.classList.toggle('ativa', s.getAttribute('data-pagina') === nome); });
    $$('[data-rota]', menu).forEach(function (a) {
      if (a.getAttribute('data-rota') === menuAtivo) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.body.setAttribute('data-pagina', nome);
    if (paginaAtual === 'apartamento' && nome !== 'apartamento' && window.TPApartamento) window.TPApartamento.sair();
    paginaAtual = nome;
  }

  function rota() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, '')) || 'inicio';
    var m = h.match(/^capitulo-(\d+)$/);
    capituloAtual = null;
    barra.style.transform = 'scaleX(0)';

    if (m) {
      mostrarPagina('leitura', 'capitulos');
      var temRetomada = retomar != null;
      mostrarCapitulo(Number(m[1]));
      if (!temRetomada) window.scrollTo(0, 0);
      document.title = (capituloAtual ? 'Capítulo ' + capituloAtual.numero + ' · ' : '') + NOME_SITE;
      return;
    }

    window.scrollTo(0, 0);
    if (h === 'capitulos') { montarIndice(); mostrarPagina('capitulos', 'capitulos'); document.title = 'Capítulos · ' + NOME_SITE; }
    else if (h === 'moradoras') { mostrarPagina('moradoras', 'moradoras'); document.title = 'Moradoras · ' + NOME_SITE; }
    else if (h === 'apartamento') {
      mostrarPagina('apartamento', 'apartamento');
      document.title = 'Apartamento · ' + NOME_SITE;
      if (window.TPApartamento) window.TPApartamento.entrar();
    }
    else { montarInicio(); mostrarPagina('inicio', 'inicio'); document.title = NOME_SITE; }
  }

  // Ferramentas compartilhadas com apartamento.js
  window.TP = { personagens: personagens, capitulos: capitulos, criarFoto: criarFoto, acharPessoa: acharPessoa, toast: toast, escapar: escapar };

  montarPersonagens();
  montarMusica();
  window.addEventListener('hashchange', rota);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  rota();
})();
