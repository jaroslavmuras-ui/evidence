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

// Dnešní datum ve tvaru RRRR-MM-DD (místní čas)
function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "2026-11-16" -> "16. 11. 2026"
function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${m}. ${y}`;
}

// Převede text z formuláře na celé koruny.
// Přijme "3500", "3 500", "3499,60", "3499.6". Vrátí null, když to není číslo.
function parseKc(text) {
  const cleaned = String(text).replace(/\s/g, '').replace(',', '.');
  if (cleaned === '' || !/^-?\d*\.?\d+$/.test(cleaned)) return null;
  return Math.round(Number(cleaned));
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

// ---------- Navigace ----------
// Obrazovky jsou v adrese za #, takže funguje i tlačítko Zpět v prohlížeči.

const app = document.getElementById('app');

function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function render() {
  const route = location.hash.replace(/^#/, '') || '/';
  if (route === '/pridat') renderAddItem();
  else renderOverview();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);

// ---------- Obrazovka: Přehled ----------

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

function renderItemRow(item) {
  const totals = computeTotals(item.entries);
  const sold = item.status === 'sold';
  return `
    <li class="item-row${sold ? ' is-sold' : ''}">
      <div class="item-main">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <span class="badge${sold ? ' badge-sold' : ''}">${sold ? 'Prodáno' : 'Vlastním'}</span>
      </div>
      <div class="item-result ${resultClass(totals.result)}">${formatKc(totals.result, { signed: true })}</div>
    </li>
  `;
}

function renderItemList(items) {
  if (items.length === 0) {
    return `<p class="empty">Zatím žádné věci. Začni tlačítkem <strong>Přidat věc</strong>.</p>`;
  }
  // Vlastněné nahoře, prodané dole; v rámci skupiny nejnovější první.
  const sorted = [...items].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'owned' ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return `<ul class="item-list">${sorted.map(renderItemRow).join('')}</ul>`;
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

  document.getElementById('btn-add-item').addEventListener('click', () => navigate('#/pridat'));
}

// ---------- Obrazovka: Přidat věc ----------

function renderAddItem() {
  app.innerHTML = `
    <h2 class="page-title">Přidat věc</h2>
    <form id="item-form" class="card form" novalidate>
      <div class="field">
        <label for="f-name">Název *</label>
        <input id="f-name" name="name" type="text" maxlength="100" autocomplete="off">
        <div class="error" data-for="name"></div>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="f-date">Datum nákupu *</label>
          <input id="f-date" name="date" type="date" value="${todayIso()}" max="${todayIso()}">
          <div class="error" data-for="date"></div>
        </div>
        <div class="field">
          <label for="f-price">Nákupní cena (Kč) *</label>
          <input id="f-price" name="price" type="text" inputmode="decimal" autocomplete="off" placeholder="např. 3 500">
          <div class="error" data-for="price"></div>
        </div>
      </div>
      <div class="field">
        <label for="f-note">Poznámka</label>
        <textarea id="f-note" name="note" rows="2" maxlength="500"></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="btn-cancel">Zrušit</button>
        <button type="submit" class="btn btn-primary">Uložit</button>
      </div>
    </form>
  `;

  const form = document.getElementById('item-form');
  document.getElementById('btn-cancel').addEventListener('click', () => navigate('#/'));
  document.getElementById('f-name').focus();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const field = (id) => document.getElementById(id).value;
    const values = {
      name: field('f-name').trim(),
      purchaseDate: field('f-date'),
      purchasePrice: parseKc(field('f-price')),
      note: field('f-note').trim(),
    };

    const errors = {};
    if (!values.name) errors.name = 'Vyplň název.';
    if (!values.purchaseDate) errors.date = 'Vyplň datum nákupu.';
    else if (values.purchaseDate > todayIso()) errors.date = 'Datum nákupu nemůže být v budoucnu.';
    if (values.purchasePrice === null) errors.price = 'Zadej částku číslem.';
    else if (values.purchasePrice <= 0) errors.price = 'Částka musí být alespoň 1 Kč.';

    form.querySelectorAll('.error').forEach((el) => {
      el.textContent = errors[el.dataset.for] || '';
    });
    if (Object.keys(errors).length > 0) return;

    confirmDialog({
      title: 'Zkontroluj nákup',
      message: `Je pořizovací cena <strong>${formatKc(values.purchasePrice)}</strong> a datum nákupu <strong>${formatDate(values.purchaseDate)}</strong> správně?<br>Později je už nepůjde změnit.`,
      confirmText: 'Ano, uložit',
      cancelText: 'Opravit',
    }).then((ok) => {
      if (!ok) return;
      try {
        DataStore.addItem(values);
      } catch (err) {
        console.error(err);
        alert('Věc se nepodařilo uložit. Zkus to prosím znovu.');
        return;
      }
      navigate('#/');
    });
  });
}

// ---------- Potvrzovací okno ----------

function confirmDialog({ title, message, confirmText, cancelText }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'dialog';
    dialog.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p>${message}</p>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" data-answer="no">${escapeHtml(cancelText)}</button>
        <button type="button" class="btn btn-primary" data-answer="yes">${escapeHtml(confirmText)}</button>
      </div>
    `;
    document.body.appendChild(dialog);

    let answered = false;
    const finish = (ok) => {
      if (answered) return;
      answered = true;
      dialog.close();
      dialog.remove();
      resolve(ok);
    };
    dialog.querySelectorAll('[data-answer]').forEach((btn) => {
      btn.addEventListener('click', () => finish(btn.dataset.answer === 'yes'));
    });
    dialog.addEventListener('cancel', () => finish(false)); // klávesa Esc
    dialog.showModal();
  });
}

render();
