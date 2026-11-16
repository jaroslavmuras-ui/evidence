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
  };
})();
