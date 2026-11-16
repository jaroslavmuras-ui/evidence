# Evidence investic do věcí

Zadání je v `SPEC.md`, plán po krocích v `PLAN.md`.

## Technologie
- Čisté **HTML + CSS + JavaScript** bez knihoven, bez sestavování a bez instalace. Aplikace se spouští otevřením `index.html` v prohlížeči.
- Data se ukládají do paměti prohlížeče (`localStorage`).
- Soubory: `index.html`, `style.css`, `app.js` (případně `storage.js`).
- Žádné externí zdroje (CDN, webová písma), aplikace musí fungovat offline.

## Architektura
- Veškeré čtení a zápis dat jde **jen přes `storage.js`**. Zbytek aplikace nesmí na `localStorage` sahat přímo. V budoucnu se data přesunou do vzdáleného úložiště (server/cloud) se synchronizací mezi zařízeními a vymění se jen `storage.js`. Proto jsou jeho funkce navržené tak, aby šly později přepsat na asynchronní (Promise).
- Součty (vloženo, získáno, výsledek) se neukládají, vždy se dopočítávají ze záznamů.
- Částky se ukládají jako kladná čísla. Znaménko určuje typ záznamu (nákup a výdaj = minus, příjem a prodej = plus).
- Každá věc i záznam má jednoznačné ID.

## Obchodní pravidla (dohodnuto)
- Částky jsou vždy **celé koruny**. Zadaná částka s haléři se zaokrouhlí (od 0,50 nahoru).
- **Nákup** se zadává jen jednou při vytvoření věci, s kontrolní otázkou. Poté jeho cenu ani datum **nejde změnit ani smazat**.
- Věc jde smazat **až 30 dní po datu prodeje**, jednotlivě i hromadně (hromadně se nabídnou všechny takové věci předem zaškrtnuté). Neprodanou věc smazat nejde vůbec, ani když byla založena omylem.
- Prodej uzavírá věc. Historie je jen pro čtení a jde ji znovu otevřít tlačítkem **Vrátit prodej**. Při novém prodeji se lhůta 30 dní počítá od nového data prodeje.

## Pravidla spolupráce
- Celé UI, texty i komunikace jsou **česky**. Částky se zobrazují ve formátu „12 500 Kč“.
- Postupuje se **po jednom kroku z PLAN.md**. Po každém kroku napsat, co vyzkoušet, a **počkat na potvrzení**.
- Až po potvrzení udělat **git commit** s krátkým českým popisem a pokračovat dalším krokem.
- Každý krok musí končit funkční aplikací.
- Od SPEC.md se neodchylovat bez předchozího dotazu.
- Nic nepřidávat nad rámec aktuálního kroku.
