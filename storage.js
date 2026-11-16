// Jediné místo v aplikaci, které čte a zapisuje data.
// Zbytek aplikace na localStorage nesahá přímo. Až se data přesunou
// do vzdáleného úložiště, vymění se jen tento soubor.

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

  return {
    // Vrátí všechny věci včetně jejich záznamů.
    getItems() {
      return load().items;
    },
  };
})();
