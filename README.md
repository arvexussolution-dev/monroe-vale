# MONROE & VALE — Eclipse

Cinematic 3D-scroll sajt za lansiranje Eclipse tourbillon hronografa.

## Pokretanje (localhost)

U folderu projekta:

```
python3 -m http.server 8080
```

zatim otvori **http://localhost:8080** u browseru.
(Može i `npx serve`, ili bilo koji statički server — bitno je da NE otvaraš
index.html direktno kao fajl, jer video scrubbing zahteva HTTP server.)

## Kako radi scroll-scrub

Tri Seedance 2.0 klipa (orbit, macro, exploded) učitavaju se sa CDN-a.
Sajt odmah scrubuje video preko `currentTime`, a u pozadini izvlači
frejmove u canvas keš — čim je keš spreman, scrubbing se prebacuje na
canvas frejmove (glatko kao frame-sekvenca, bez seek kašnjenja).

## Preporuka za produkciju

CDN linkovi generacija mogu vremenom isteći. Skini tri MP4 fajla
(linkovi su u `config.js`), stavi ih u `assets/` kao:

- `assets/orbit.mp4`
- `assets/macro.mp4`
- `assets/engine.mp4`

pa u `config.js` odkomentariši `orbitLocal/macroLocal/engineLocal` putanje.

## Struktura

- `index.html` — struktura svih sekcija
- `styles.css` — dizajn sistem (off-black + zlato, Cormorant Garamond + Inter)
- `main.js` — Lenis smooth scroll, scrub engine, pinned reveals, meridian progres
- `config.js` — URL-ovi video klipova
- `vendor/lenis.min.js` — lokalno vendorovan Lenis
- `test/scroll-test.js` — headless test (potrebno: `npm i jsdom`, pa `node test/scroll-test.js`)

## Sekcije

1. Hero — 360° orbit scroll-scrub + brand name tracking-in
2. Crafted in Darkness — pinned tekstualna priča
3. Macro — scroll-scrub klipa detalja brojčanika
4. Engineering — exploded assembly + spec callouts (42 mm Ti, 72 h, 217 komponenti)
5. Edition of 88 — $48,000
6. Private waitlist — CTA forma
7. The Collection — Hudson, Manhattan, Pacific, Aspen, Liberty No. 01
