# Plán vývoje – Evidence investic do věcí

Každý krok končí funkční aplikací, kterou jde vyzkoušet otevřením `index.html` v prohlížeči (dvojklikem).
Po každém kroku: vyzkoušet → potvrdit → git commit → další krok.

## Krok 1 – Kostra a vzhled
- Soubory `index.html`, `style.css`, `app.js`, `storage.js`.
- Úvodní obrazovka **Přehled**: souhrn (Vloženo / Získáno / Výsledek, zatím 0 Kč), prázdný seznam s textem „Zatím žádné věci“, tlačítko **Přidat věc** (zatím nic nedělá).
- Základní vzhled podle SPEC (světlý, zelená/červená, velká čísla) a přizpůsobení mobilu.

**Vyzkoušíš:** Otevřeš `index.html`, vidíš přehled s nulami. Zúžíš okno prohlížeče a rozložení se přizpůsobí.

## Krok 2 – Přidání věci a ukládání
- Formulář **Přidat věc** (název, datum nákupu, nákupní cena, poznámka) s kontrolou povinných polí.
- Zaokrouhlení částky na celé koruny.
- Kontrolní otázka „Je pořizovací cena … správně? Později ji už nepůjde změnit.“
- Uložení věci i automatického záznamu „Nákup“ do paměti prohlížeče.
- Seznam věcí na přehledu s výsledkem každé věci a přepočet souhrnu.

**Vyzkoušíš:** Přidáš vrtačku za 3 499,60 Kč → zobrazí se dotaz s částkou 3 500 Kč → po potvrzení přehled ukáže Vloženo 3 500 Kč a Výsledek −3 500 Kč. Zavřeš a znovu otevřeš prohlížeč → data zůstala. *(Hotovo bod 1 a 4)*

## Krok 3 – Detail věci a záznamy
- Obrazovka **Detail věci**: název, poznámka, stav, tři čísla, historie seřazená podle data.
- Formulář **Přidat záznam** (Výdaj / Příjem, datum, částka zaokrouhlená na koruny).
- Tlačítko zpět na přehled.

**Vyzkoušíš:** K vrtačce přidáš výdaj 800 Kč a příjem 500 Kč → detail i přehled ukazují Vloženo 4 300, Získáno 500, Výsledek −3 800 Kč. *(Hotovo bod 2)*

## Krok 4 – Úpravy záznamů a věci
- **Upravit věc** (jen název a poznámka).
- U výdajů a příjmů **Upravit** (typ, datum, částka, zdroj) a **Smazat** (s potvrzením).
- Záznam **Nákup** nejde upravit ani smazat.

**Vyzkoušíš:** Opravíš částku u výdaje, smažeš příjem, přejmenuješ věc → čísla se přepočítají. U nákupu nejsou tlačítka pro úpravu ani smazání.

## Krok 5 – Prodej
- Obrazovka **Prodat věc** s náhledem konečného výsledku.
- Po prodeji: stav *Prodáno*, historie jen pro čtení, výrazný konečný výsledek, tlačítko **Vrátit prodej**.
- Na přehledu jsou prodané věci dole a utlumené.

**Vyzkoušíš:** Prodáš vrtačku za 2 000 Kč → stav Prodáno, výsledek −1 800 Kč, nejde přidat záznam. Vrátíš prodej → věc je zase aktivní. *(Hotovo bod 3)*

## Krok 6 – Mazání prodaných věcí
- Na detailu prodané věci se tlačítko **Smazat věc** zobrazí až 30 dní po prodeji.
- Na přehledu tlačítko **Smazat staré prodeje** → seznam věcí prodaných před 30 a více dny, všechny zaškrtnuté → potvrzení → smazání.
- Neprodanou věc ani věc prodanou před méně než 30 dny smazat nejde.

**Vyzkoušíš:** Prodáš věc s datem prodeje před 40 dny a jinou s dnešním datem → hromadný výmaz nabídne jen tu starší. Na detailu nové prodané věci tlačítko Smazat chybí.

## Krok 7 – Doladění a závěrečná kontrola
- Vyladění pro mobil (velikost tlačítek, nic nepřetéká), drobné úpravy vzhledu.
- Projdeme spolu všech 5 bodů „Hotovo, když“ ze SPEC.md.

**Vyzkoušíš:** Celý hlavní scénář ze SPEC.md na počítači i v mobilním zobrazení. *(Hotovo bod 5)*
