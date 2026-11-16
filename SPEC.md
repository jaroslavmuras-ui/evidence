# Evidence investic do věcí – specifikace první verze

## Cíl a pro koho

Aplikace pro jednoho člověka, který si chce hlídat, kolik peněz vložil do věcí, které koupil (nářadí, elektronika, sběratelské předměty, auto…), a kolik mu vynesly. U každé věci i za všechny dohromady má vždy vidět, jestli je v plusu, nebo v minusu. Používá se na počítači i na mobilu, ideálně hned ve chvíli, kdy za věc zaplatí nebo z ní něco získá.

## Hlavní scénář

1. Uživatel si koupí věc (např. vrtačku za 3 500 Kč).
2. Otevře aplikaci a klikne na **Přidat věc**.
3. Vyplní název, datum nákupu, nákupní cenu a případně krátkou poznámku. Uloží a aplikace se zeptá: „Je pořizovací cena 3 500 Kč správně? Později ji už nepůjde změnit.“ Potvrdí.
4. Věc se objeví v seznamu. Nákup se automaticky zapsal jako první výdaj.
5. Později věc opraví za 800 Kč. Otevře ji, klikne na **Přidat záznam**, zvolí **Výdaj**, zadá datum a částku a uloží.
6. Věc půjčí za úplatu 500 Kč. Přidá záznam typu **Příjem** s datem a částkou.
7. Na detailu věci i na přehledu hned vidí aktualizovaná čísla: vloženo, získáno a rozdíl.
8. Nakonec věc prodá za 2 000 Kč. Na detailu klikne na **Prodat**, zadá datum a prodejní cenu.
9. Věc se označí jako **Prodaná**. Historie se uzavře, už k ní nejde nic přidat a zobrazí se konečný výsledek (např. „Celkem: −1 800 Kč“).
10. Na hlavním přehledu uživatel kdykoli vidí, jak si stojí celkově.

## Obrazovky

### 1. Přehled (úvodní obrazovka)
- **Souhrn nahoře:** tři velká čísla za všechny věci dohromady:
  - **Vloženo** (součet všech výdajů),
  - **Získáno** (součet všech příjmů včetně prodejů),
  - **Výsledek** (získáno minus vloženo), zeleně při zisku, červeně při ztrátě.
- **Seznam věcí:** každý řádek ukazuje název, stav (*Vlastním* / *Prodáno*) a výsledek dané věci (zeleně/červeně).
- Věci, které uživatel vlastní, jsou nahoře. Prodané jsou pod nimi a vizuálně utlumené.
- Tlačítko **Přidat věc**.
- Tlačítko **Smazat staré prodeje** (zobrazí se, jen když existují věci prodané před 30 a více dny). Otevře seznam těchto věcí, všechny předem zaškrtnuté. Uživatel může některé odškrtnout a po potvrzení se vybrané věci smažou i s historií.
- Kliknutím na řádek se otevře detail věci.

### 2. Přidat / upravit věc
- Pole: **Název** (povinný), **Datum nákupu** (povinné, předvyplněné dnešním dnem), **Nákupní cena v Kč** (povinná, celé koruny), **Poznámka** (nepovinná).
- Tlačítka **Uložit** a **Zrušit**.
- Před uložením nové věci se zobrazí kontrolní otázka na správnost pořizovací ceny (a data nákupu). Po potvrzení už nákupní cenu ani datum nákupu **nejde změnit**.
- Při úpravě existující věci jde změnit jen název a poznámku.

### 3. Detail věci
- Nahoře název, poznámka a stav (*Vlastním* / *Prodáno*).
- Tři čísla za tuto věc: **Vloženo**, **Získáno**, **Výsledek**.
- **Historie:** seznam všech záznamů seřazený podle data. U každého je datum, typ (Výdaj / Příjem / Nákup / Prodej) a částka. Výdaje se zobrazují s mínusem, příjmy s plusem.
- Tlačítka (jen dokud je věc ve stavu *Vlastním*):
  - **Přidat záznam**,
  - **Prodat**,
  - **Upravit věc**.
- Záznamy typu Výdaj a Příjem jde upravit nebo smazat (smazání vyžaduje potvrzení). Záznam **Nákup** nejde upravit ani smazat.
- U prodané věci je historie jen pro čtení a nahoře je výrazně zobrazen konečný výsledek.
- **Mazání věci:** věc jde smazat až **30 dní po prodeji** (např. prodáno 1. 3. → smazat jde od 31. 3.). Pak se na detailu objeví tlačítko **Smazat věc** (s potvrzením: „Opravdu smazat věc i celou její historii?“). Neprodanou věc smazat nejde.

### 4. Přidat / upravit záznam
- Volba typu: **Výdaj**, nebo **Příjem**.
- **Datum** (povinné, předvyplněné dnešním dnem).
- **Částka v Kč** (povinná, vždy kladné číslo; podle typu ji aplikace sama bere jako mínus, nebo plus).

**Pravidlo pro všechny částky:** evidují se jen celé koruny. Když uživatel zadá částku s haléři, aplikace ji zaokrouhlí na celé koruny (od 0,50 nahoru).
- Tlačítka **Uložit** a **Zrušit**.

### 5. Prodat věc
- **Datum prodeje** (předvyplněné dnešním dnem) a **Prodejní cena v Kč**.
- Před uložením se zobrazí náhled konečného výsledku („Po prodeji budete celkem na +1 200 Kč“).
- Tlačítka **Potvrdit prodej** a **Zrušit**.
- Po potvrzení se věc uzavře. Pro případ omylu jde prodej zrušit tlačítkem **Vrátit prodej** na detailu věci.

## Data

Aplikace si pamatuje:

- **Věci:** název, poznámka, stav (vlastním / prodáno).
- **Záznamy u každé věci:** typ (nákup, výdaj, příjem, prodej), datum a částka v Kč.

Všechny součty (vloženo, získáno, výsledek) se vždy dopočítávají ze záznamů, takže jsou pořád aktuální. Data se po zavření aplikace nesmí ztratit.

## Vzhled

- **Styl:** čistý a střízlivý, jako jednoduchá bankovní aplikace. Hodně volného místa, žádné zbytečné ozdoby.
- **Barvy:** světlé pozadí, tmavý text, jedna klidná doplňková barva pro tlačítka (např. modrá). **Zelená** pro zisk, **červená** pro ztrátu, šedá pro prodané věci.
- **Písmo a čísla:** dobře čitelné. Hlavní čísla jsou velká, aby byla vidět na první pohled. Částky mají oddělené tisíce a měnu („12 500 Kč“).
- **Nálada:** klidná, přehledná, důvěryhodná.
- **Zařízení:** stejně dobře použitelné na počítači i na mobilu. Na mobilu se vše skládá pod sebe a tlačítka jsou dost velká na palec.

## První verze NEobsahuje

- Více uživatelů, přihlašování ani sdílení.
- **Synchronizaci mezi zařízeními** (aby se záznam z mobilu objevil na počítači). Plánuje se do budoucna, takže prosím aplikaci navrhni tak, aby se dala později přidat bez přepisování všeho.
- Odhad současné tržní hodnoty věcí, které uživatel stále vlastní.
- Jinou měnu než Kč.
- Fotky, účtenky a přílohy.
- Kategorie, štítky, vyhledávání a filtrování.
- Záznamy bez částky (samotné poznámky k událostem).
- Grafy, statistiky v čase a export do Excelu či PDF.
- Prodej jen části věci. Prodej vždy uzavírá celou věc.

## Hotovo, když

1. Přidám věc s nákupní cenou 3 500 Kč a na přehledu se hned ukáže **Vloženo 3 500 Kč** a **Výsledek −3 500 Kč**.
2. Přidám k ní výdaj 800 Kč a příjem 500 Kč a čísla na detailu i na přehledu se správně přepočítají (vloženo 4 300, získáno 500, výsledek −3 800 Kč).
3. Věc prodám za 2 000 Kč. Označí se jako *Prodáno*, nejde k ní přidat další záznam a ukazuje konečný výsledek −1 800 Kč. Smazat ji jde až 30 dní po prodeji. Nákupní cenu nejde nikdy změnit.
4. Zavřu aplikaci, znovu ji otevřu a všechna data jsou na místě.
5. Aplikace se pohodlně ovládá na mobilu i na počítači. Nic nepřetéká z obrazovky a všechna tlačítka jdou snadno stisknout.
