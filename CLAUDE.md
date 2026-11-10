# CLAUDE.md — nicolarivo.co.uk

Sito statico, senza build. GitHub Pages serve `main` di questo repo (pubblico); il file `CNAME` dice `nicolarivo.co.uk`. Quello che sta su `main` è online in un minuto: **niente push su `main` senza l'ok di Nico**, si lavora su un branch (o su un worktree, es. `~/Developer/Web/sito-c9`).

## Mappa
- `index.html` — landing (metà Teacher, metà Sound). Font in `assets/fonts/`.
- `teacher/` — lezioni di musica. Il front end non si cambia nell'aspetto.
- `sound/` — portfolio sound. È l'uscita di `~/Developer/Web/sound-proiettore/build.py --public`: si modifica lì e si ricopia qui, non a mano. I lavori vengono dalle schede di `~/lavoro` (vetrina), non da `lavori.json`.
- `creative-coding/` — sezione vecchia, da ritirare: non si tocca.
- `videos.json`, `config.json`, `robots.txt`, `sitemap.xml`, `css/`, `js/` — file di supporto.

## Flusso
1. Spazi di lavoro in `~/Developer/Web/{landing,teacher,sound,sound-proiettore}`; l'anteprima sullo Studio si apre con `siti NOME` e si aggiorna con `siti sync` (pagina `comandi siti`).
2. Branch nuovo da `origin/main`, modifica, prova in locale (`python3 -m http.server`) con Playwright a 375 e 1440 px.
3. `chiavi check .`, poi ok di Nico, poi unione in `main` e push.
4. Annullare = `git revert` del commit e push.

## Regole
- **Nessuna richiesta a server Google** al caricamento: font in locale (OFL), analytics solo GoatCounter, YouTube solo `youtube-nocookie.com` caricato al clic.
- Nessun segreto nel repo. La chiave Web3Forms è pubblica per costruzione. Nella storia c'è una vecchia `ADMIN_PASSWORD` del pannello admin rimosso: non riusarla.
- `sound/`: la versione pubblica non contiene la sezione Restoration video né il demo A/B sintetico (la scritta «Not for Redistribution» nei `.mov`); l'audio del restauro resta per scelta di Nico.
- Dominio, DNS e posta sono in C7 (`~/casa`), il cantiere di questo sito è C9.
