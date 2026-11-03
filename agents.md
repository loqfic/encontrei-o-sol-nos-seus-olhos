# AGENTS.md

Static fan site (pt-BR) for reading the fanfic "Encontrei o sol nos seus olhos" (wildshoni, AO3 76167671). Theme: sharing an apartment. **Plain HTML/CSS/JS, no framework, no build step, no backend.** Built from the "Trajeto Perfeito" template; keep it that way.

## Structure

- `index.html`: every page shell (`section.pagina[data-pagina=...]`), the illustrated living-room SVG on the home page, header/menu, modal and footer. An inline script sets `window.VERSAO` (changes every minute) and loads `style.css` and the scripts in order with `?v=` for cache busting: tema, capitulos, personagens, app, apartamento (`async = false`).
- `capitulos.js`: `const CAPITULOS = [{ numero, titulo, notaInicio?, notaFim?, texto }]`, generated from the EPUB and hand-edited by the owner. Keep the Portuguese instructions comment.
- `personagens.js`: `const PERSONAGENS = [{ id, grupo: "casa"|"visitas", nome, apelido, papel, descricaoCurta, descricaoLonga?, foto }]`. The ids `lorena`, `eduarda` and `cadu` are used by the reading header and the apartment page.
- `tema.js`: `MUSICA_TEMA` (theme song "Espetáculo estranho", ANAVITÓRIA). Filling `spotifyId` embeds the Spotify player. Otherwise it shows Spotify/YouTube search links. Never include lyrics or audio files.
- `app.js`: hash router (`#inicio`, `#capitulos`, `#capitulo-N`, `#moradoras`, `#apartamento`) and the text parser. In the parser, a blank line starts a paragraph, a dash line is its own paragraph, `*x*` is italic, `**x**` is bold and `***` is a divider. A line that is only `**Name**` becomes a point-of-view tag (`p.voz`), and the names are collected per chapter as `vozes`. A line `***text***` becomes a time stamp. The file also handles the reading header "bilhete", reader prefs, the polaroid grid, the modal and the theme song. It exposes `window.TP`.
- `apartamento.js`: SVG floor plan. `COMODOS` (names, details, regex `busca` used to count mentions in all chapters at runtime) and `FRASES` sit at the top. `GEO` holds the room boxes and the path from the corridor (y = 300). Cadu walks along those paths. It exposes `window.TPApartamento.entrar()` and calls it itself if the page is already active (it loads after app.js).
- `style.css`: all styles. The theme comes from `html[data-tema="dia"|"noite"]` variables, and the illustration colors are the `--a-*` variables.
- Photos in the repo root: `casal.jpg` (home polaroid), `lorena.jpg`, `eduarda.jpg`, `cadu.jpg`, cropped from the owner's reference photo. Missing photos fall back to an initial.

## Conventions

- Identifiers and comments in Portuguese.
- localStorage keys: `esol-tema`, `esol-fonte`, `esol-maior-18`, `esol-progresso`.
- Look: warm apartment at night, taken from the owner's reference photos. Cream walls, wood, plants, an olive checkered rug, a moss-green sofa, terracotta cushions, an amber bulb glow and dusty pink. Fraunces for headings, Lora for prose, Inter for UI.
- Content facts (characters, rooms) must come from the fic; don't invent plot.
