# Encontrei o sol nos seus olhos

Site de fã para **ler** a fanfic *Encontrei o sol nos seus olhos*, de wildshoni (Três Graças · Loquinha). Depois de ser expulsa de casa, Lorena vai dividir apartamento com Juquinha, uma policial, e com o gato dela, o Cadu.

Original no AO3: https://archiveofourown.org/works/76167671

## Páginas

- **Início**: a sala do apartamento desenhada no topo, com a lâmpada acesa, a janela com a cidade e o Cadu no tapete. Tem a polaroide das duas, "Abrir a porta" (começar a ler), "Continuar de onde parei", a música-tema, os próximos capítulos como recados na geladeira e a sinopse com as tags.
- **Capítulos**: índice automático com as plaquinhas de apartamento, o tempo de leitura, quem narra cada capítulo e o aviso quando tem bilhete da autora.
- **Leitura** (`#capitulo-3`): cabeçalho em forma de bilhete com fita, mostrando "Termina em X min", quem narra (com foto), palavras, parágrafos e o que o Cadu está fazendo. Também tem A−/A+, barra de progresso, aviso +18 na primeira vez, as notas da autora como bilhetes e as etiquetas de ponto de vista no texto.
- **Moradoras**: fotos estilo polaroide que viram. Separa quem mora no apartamento de quem aparece por lá.
- **Apartamento**: planta da casa desenhada. Toque num cômodo e o Cadu vai andando até lá. O painel mostra quantas vezes cada cômodo aparece nos capítulos, as contas divididas e os botões "Chamar o Cadu" e "Fazer carinho".

O botão de lâmpada no topo acende e apaga a luz, trocando o modo claro pelo escuro. No escuro, a sala do início fica à noite.

## Como editar o conteúdo

| O quê | Onde |
| --- | --- |
| Capítulos e notas da autora | `capitulos.js` (instruções no topo) |
| Personagens | `personagens.js` |
| Fotos | arquivo solto (sem pasta) com o mesmo nome do campo `foto` |
| Música-tema | `tema.js` |
| Cômodos, frases do Cadu | `COMODOS` e `FRASES` no topo de `apartamento.js` |
| Sinopse e tags | seção "INÍCIO" em `index.html` |

## Atualizações sem limpar o navegador

O `index.html` carrega todos os arquivos com `?v=` e um número que muda a cada minuto. Depois de subir um arquivo novo no GitHub, a mudança aparece em 1 ou 2 minutos.

## Tecnologias

HTML, CSS e JavaScript puro: sem build, sem backend, sem banco de dados. Fontes do Google Fonts (Fraunces nos títulos, Inter na interface e Lora no texto). Os desenhos da sala e da planta são feitos no próprio código. As preferências (tema, letra, +18, progresso) ficam no `localStorage` com o prefixo `esol-`.

## Publicar

GitHub Pages, a partir da branch principal e da raiz, ou Netlify (o `netlify.toml` já publica a raiz).
