// ---------- Pomocné funkce ----------

const kcFormat = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });

// 12500 -> "12 500 Kč", -3500 -> "−3 500 Kč"
function formatKc(amount, { signed = false } = {}) {
  const abs = kcFormat.format(Math.abs(amount)) + ' Kč';
  if (amount < 0) return '−' + abs;
  if (signed && amount > 0) return '+' + abs;
  return abs;
}

// Třída barvy podle výsledku: zisk / ztráta / nula
function resultClass(amount) {
  if (amount > 0) return 'positive';
  if (amount < 0) return 'negative';
  return 'neutral';
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------- Výpočty ----------

// Typy záznamů, které jsou výdajem (ostatní jsou příjmem).
const EXPENSE_TYPES = ['nakup', 'vydaj'];

// Spočítá Vloženo / Získáno / Výsledek pro seznam záznamů.
function computeTotals(entries) {
  let invested = 0;
  let earned = 0;
  for (const entry of entries) {
    if (EXPENSE_TYPES.includes(entry.type)) invested += entry.amount;
    else earned += entry.amount;
  }
  return { invested, earned, result: earned - invested };
}

function allEntries(items) {
  return items.flatMap((item) => item.entries || []);
}

// ---------- Vykreslení ----------

const app = document.getElementById('app');

function renderSummary(totals) {
  return `
    <section class="summary" aria-label="Celkový souhrn">
      <div class="summary-card summary-result">
        <div class="summary-label">Výsledek</div>
        <div class="summary-value ${resultClass(totals.result)}">${formatKc(totals.result, { signed: true })}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Vloženo</div>
        <div class="summary-value">${formatKc(totals.invested)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Získáno</div>
        <div class="summary-value">${formatKc(totals.earned)}</div>
      </div>
    </section>
  `;
}

function renderItemList(items) {
  if (items.length === 0) {
    return `<p class="empty">Zatím žádné věci. Začni tlačítkem <strong>Přidat věc</strong>.</p>`;
  }
  // Seznam věcí doplníme v dalším kroku.
  return '';
}

function renderOverview() {
  const items = DataStore.getItems();
  const totals = computeTotals(allEntries(items));

  app.innerHTML = `
    ${renderSummary(totals)}
    <div class="section-head">
      <h2>Moje věci</h2>
      <button type="button" class="btn btn-primary" id="btn-add-item">+ Přidat věc</button>
    </div>
    ${renderItemList(items)}
  `;

  document.getElementById('btn-add-item').addEventListener('click', () => {
    alert('Přidávání věcí přijde v dalším kroku.');
  });
}

renderOverview();
