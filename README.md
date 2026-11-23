# Evidence věcí

Jednoduchá aplikace pro evidenci věcí, do kterých investuji: nářadí, elektronika, sběratelské předměty, auto…
U každé věci i za všechny dohromady ukazuje, kolik jsem do ní **vložil**, kolik mi **vynesla** a jestli jsem v **zisku**, nebo ve **ztrátě**.

Funguje na počítači i na mobilu, bez instalace a bez internetu.

## Jak spustit

1. Stáhni projekt (tlačítko **Code → Download ZIP**) a rozbal ho.
2. Otevři soubor **`index.html`** v prohlížeči (dvojklikem).

Hotovo. Nic dalšího se instalovat nemusí.

## Co aplikace umí

- **Přehled:** celkem vloženo, získáno a výsledek; seznam věcí s výsledkem každé z nich.
- **Přidání věci:** název, datum nákupu, nákupní cena a poznámka. Před uložením se aplikace zeptá, jestli je cena správně, protože ji později nejde změnit.
- **Výdaje a příjmy:** u každé věci datum, částka a nepovinný zdroj (např. *oprava*, *pronájem*) s našeptáváním dříve použitých hodnot. Lze je upravit i smazat.
- **Prodej:** náhled konečného výsledku, uzavření historie a možnost prodej vrátit.
- **Mazání:** prodanou věc jde smazat až 30 dní po prodeji, jednotlivě i hromadně. Neprodanou věc smazat nejde.
- Všechny částky jsou v celých korunách (Kč).

## Kde jsou data

Data se ukládají **jen v prohlížeči**, ve kterém aplikaci používáš. Nikam se neodesílají.

- Každý prohlížeč a každé zařízení má **vlastní data**. Mezi počítačem a mobilem se zatím nesynchronizují.
- **Vymazáním dat prohlížeče se smaže i evidence.** Zálohu aplikace zatím neumí.

## Technologie

Čisté HTML, CSS a JavaScript, bez knihoven a bez sestavování.

| Soubor | Co obsahuje |
|---|---|
| `index.html` | stránka aplikace |
| `style.css` | vzhled |
| `app.js` | obrazovky, výpočty a ovládání |
| `storage.js` | ukládání dat (jediné místo, které pracuje s úložištěm) |

## Dokumentace

- [SPEC.md](SPEC.md): zadání první verze
- [PLAN.md](PLAN.md): plán vývoje po krocích
- [CLAUDE.md](CLAUDE.md): technická a obchodní pravidla projektu

## Plánováno do dalších verzí

- synchronizace mezi zařízeními
- záloha a obnova dat
- odhad současné hodnoty vlastněných věcí
- fotky účtenek, kategorie, vyhledávání a grafy
