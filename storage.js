// Jediné místo v aplikaci, které čte a zapisuje data.
// Zbytek aplikace na localStorage nesahá přímo. Až se data přesunou
// do vzdáleného úložiště, vymění se jen tento soubor.
//
// Tvar dat:
// {
//   items: [{
//     id, name, note, status: 'owned' | 'sold', createdAt,
//     entries: [{ id, type: 'nakup' | 'vydaj' | 'prijem' | 'prodej', date: 'RRRR-MM-DD', amount: celé kladné Kč,
//                 source?: text (jen výdaj a příjem) }]
//   }]
// }

const DataStore = (() => {
  const KEY = 'evidence-veci-v1';

  function emptyData() {
    return { items: [] };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyData();
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.items)) return emptyData();
      return data;
    } catch (err) {
      console.error('Nepodařilo se načíst data:', err);
      return emptyData();
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function newId() {
    if (window.crypto && typeof crypto.randomUUID === 'function') {
      try { return crypto.randomUUID(); } catch (e) { /* fallback níže */ }
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  // Kolik dní musí uplynout od prodeje, než jde věc smazat.
  const DELETE_AFTER_DAYS = 30;

  // Počet dní mezi dvěma daty 'RRRR-MM-DD' (bez vlivu časových pásem).
  function daysBetween(fromIso, toIso) {
    const toUtc = (iso) => {
      const [y, m, d] = iso.split('-').map(Number);
      return Date.UTC(y, m - 1, d);
    };
    return Math.round((toUtc(toIso) - toUtc(fromIso)) / 86400000);
  }

  function localTodayIso() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function saleOf(item) {
    return item.entries.find((e) => e.type === 'prodej') || null;
  }

  // Datum 'RRRR-MM-DD', od kterého jde věc smazat (null u neprodané věci).
  function deletableFrom(item) {
    const sale = item.status === 'sold' ? saleOf(item) : null;
    if (!sale) return null;
    const [y, m, d] = sale.date.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + DELETE_AFTER_DAYS));
    return date.toISOString().slice(0, 10);
  }

  function canDelete(item) {
    const sale = item.status === 'sold' ? saleOf(item) : null;
    return !!sale && daysBetween(sale.date, localTodayIso()) >= DELETE_AFTER_DAYS;
  }

  function findEditableEntry(data, itemId, entryId) {
    const item = data.items.find((i) => i.id === itemId);
    if (!item) throw new Error('Věc nenalezena');
    if (item.status !== 'owned') throw new Error('Záznamy prodané věci nejde měnit');
    const entry = item.entries.find((e) => e.id === entryId);
    if (!entry) throw new Error('Záznam nenalezen');
    if (!['vydaj', 'prijem'].includes(entry.type)) throw new Error('Tento záznam nejde měnit');
    return { item, entry };
  }

  return {
    // Vrátí všechny věci včetně jejich záznamů.
    getItems() {
      return load().items;
    },

    // Založí novou věc a k ní záznam Nákup. Vrátí založenou věc.
    addItem({ name, note, purchaseDate, purchasePrice }) {
      const data = load();
      const item = {
        id: newId(),
        name,
        note: note || '',
        status: 'owned',
        createdAt: new Date().toISOString(),
        entries: [
          { id: newId(), type: 'nakup', date: purchaseDate, amount: purchasePrice },
        ],
      };
      data.items.push(item);
      save(data);
      return item;
    },

    // Vrátí dříve použité zdroje (bez duplicit, abecedně) pro našeptávání.
    getSources() {
      const seen = new Map();
      for (const item of load().items) {
        for (const entry of item.entries) {
          const s = (entry.source || '').trim();
          if (s && !seen.has(s.toLocaleLowerCase('cs'))) seen.set(s.toLocaleLowerCase('cs'), s);
        }
      }
      return [...seen.values()].sort((a, b) => a.localeCompare(b, 'cs'));
    },

    // Vrátí jednu věc podle ID, nebo null.
    getItem(id) {
      return load().items.find((item) => item.id === id) || null;
    },

    // Přidá k věci záznam (výdaj / příjem). Vrátí přidaný záznam.
    addEntry(itemId, { type, date, amount, source }) {
      const data = load();
      const item = data.items.find((i) => i.id === itemId);
      if (!item) throw new Error('Věc nenalezena');
      if (item.status !== 'owned') throw new Error('K prodané věci nejde přidat záznam');
      const entry = { id: newId(), type, date, amount, source: source || '' };
      item.entries.push(entry);
      save(data);
      return entry;
    },

    // Změní název a poznámku věci (nákup se měnit nedá).
    updateItem(itemId, { name, note }) {
      const data = load();
      const item = data.items.find((i) => i.id === itemId);
      if (!item) throw new Error('Věc nenalezena');
      if (item.status !== 'owned') throw new Error('Prodanou věc nejde upravit');
      item.name = name;
      item.note = note || '';
      save(data);
      return item;
    },

    // Upraví výdaj nebo příjem. Nákup a prodej upravit nejde.
    updateEntry(itemId, entryId, { type, date, amount, source }) {
      const data = load();
      const { item, entry } = findEditableEntry(data, itemId, entryId);
      if (!['vydaj', 'prijem'].includes(type)) throw new Error('Neplatný typ záznamu');
      Object.assign(entry, { type, date, amount, source: source || '' });
      save(data);
      return entry;
    },

    // Prodá věc: přidá záznam Prodej a uzavře historii.
    sellItem(itemId, { date, amount }) {
      const data = load();
      const item = data.items.find((i) => i.id === itemId);
      if (!item) throw new Error('Věc nenalezena');
      if (item.status !== 'owned') throw new Error('Věc už je prodaná');
      item.entries.push({ id: newId(), type: 'prodej', date, amount });
      item.status = 'sold';
      save(data);
      return item;
    },

    // Zruší prodej: odstraní záznam Prodej a věc znovu otevře.
    undoSale(itemId) {
      const data = load();
      const item = data.items.find((i) => i.id === itemId);
      if (!item) throw new Error('Věc nenalezena');
      if (item.status !== 'sold') throw new Error('Věc není prodaná');
      item.entries = item.entries.filter((e) => e.type !== 'prodej');
      item.status = 'owned';
      save(data);
      return item;
    },

    // Pravidla mazání (věc jde smazat až 30 dní po prodeji).
    canDelete,
    deletableFrom,

    // Smaže věci i s historií. Smaže jen ty, které už smazat jde; vrátí jejich počet.
    deleteItems(itemIds) {
      const data = load();
      const ids = new Set(itemIds);
      const blocked = data.items.filter((i) => ids.has(i.id) && !canDelete(i));
      if (blocked.length > 0) throw new Error('Některé věci zatím nejde smazat');
      const before = data.items.length;
      data.items = data.items.filter((i) => !ids.has(i.id));
      save(data);
      return before - data.items.length;
    },

    // Smaže výdaj nebo příjem. Nákup a prodej smazat nejde.
    deleteEntry(itemId, entryId) {
      const data = load();
      const { item, entry } = findEditableEntry(data, itemId, entryId);
      item.entries = item.entries.filter((e) => e !== entry);
      save(data);
    },
  };
})();
