// Jediné místo v aplikaci, které čte a zapisuje data.
// Zbytek aplikace na localStorage nesahá přímo. Až se data přesunou
// do vzdáleného úložiště, vymění se jen tento soubor.
//
// Tvar dat:
// {
//   items: [{
//     id, name, note, status: 'owned' | 'sold', createdAt,
//     entries: [{ id, type: 'nakup' | 'vydaj' | 'prijem' | 'prodej', date: 'RRRR-MM-DD', amount: celé kladné Kč }]
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
  };
})();
