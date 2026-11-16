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
  let match;
  if (route === '/pridat') renderAddItem();
  else if ((match = route.match(/^\/vec\/([^/]+)\/zaznam$/))) renderAddEntry(decodeURIComponent(match[1]));
  else if ((match = route.match(/^\/vec\/([^/]+)$/))) renderDetail(decodeURIComponent(match[1]));
  else renderOverview();
  window.scrollTo(0, 0);
}

function itemHash(id, suffix = '') {
  return `#/vec/${encodeURIComponent(id)}${suffix}`;
}

window.addEventListener('hashchange', render);

// ---------- Obrazovka: Přehled ----------

function renderSummary(totals, label = 'Celkový souhrn') {
  return `
    <section class="summary" aria-label="${escapeHtml(label)}">
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
    <li>
      <a class="item-row${sold ? ' is-sold' : ''}" href="${itemHash(item.id)}">
        <div class="item-main">
          <div class="item-name">${escapeHtml(item.name)}</div>
          ${statusBadge(item)}
        </div>
        <div class="item-result ${resultClass(totals.result)}">${formatKc(totals.result, { signed: true })}</div>
      </a>
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

function statusBadge(item) {
  const sold = item.status === 'sold';
  return `<span class="badge${sold ? ' badge-sold' : ''}">${sold ? 'Prodáno' : 'Vlastním'}</span>`;
}

function renderNotFound() {
  app.innerHTML = `
    <a class="back-link" href="#/">← Přehled</a>
    <p class="empty">Tato věc neexistuje.</p>
  `;
}

// ---------- Obrazovka: Detail věci ----------

const ENTRY_LABELS = { nakup: 'Nákup', vydaj: 'Výdaj', prijem: 'Příjem', prodej: 'Prodej' };

function renderEntryRow(entry) {
  const isExpense = EXPENSE_TYPES.includes(entry.type);
  const amount = isExpense ? -entry.amount : entry.amount;
  return `
    <li class="entry-row">
      <div>
        <div class="entry-type">${ENTRY_LABELS[entry.type] || entry.type}</div>
        <div class="entry-date">${formatDate(entry.date)}</div>
      </div>
      <div class="entry-amount ${resultClass(amount)}">${formatKc(amount, { signed: true })}</div>
    </li>
  `;
}

function renderDetail(id) {
  const item = DataStore.getItem(id);
  if (!item) return renderNotFound();

  const totals = computeTotals(item.entries);
  // Nejnovější nahoře; při stejném datu později přidaný výš.
  const history = item.entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => b.entry.date.localeCompare(a.entry.date) || b.index - a.index)
    .map(({ entry }) => entry);

  app.innerHTML = `
    <a class="back-link" href="#/">← Přehled</a>
    <div class="detail-head">
      <h2 class="page-title">${escapeHtml(item.name)}</h2>
      ${statusBadge(item)}
    </div>
    ${item.note ? `<p class="detail-note">${escapeHtml(item.note)}</p>` : ''}
    ${renderSummary(totals, 'Souhrn věci')}
    <div class="section-head">
      <h2>Historie</h2>
      ${item.status === 'owned' ? '<button type="button" class="btn btn-primary" id="btn-add-entry">+ Přidat záznam</button>' : ''}
    </div>
    <ul class="entry-list">${history.map(renderEntryRow).join('')}</ul>
  `;

  const addBtn = document.getElementById('btn-add-entry');
  if (addBtn) addBtn.addEventListener('click', () => navigate(itemHash(item.id, '/zaznam')));
}

// ---------- Obrazovka: Přidat záznam ----------

function renderAddEntry(id) {
  const item = DataStore.getItem(id);
  if (!item) return renderNotFound();
  if (item.status !== 'owned') return navigate(itemHash(id));

  app.innerHTML = `
    <a class="back-link" href="${itemHash(item.id)}">← ${escapeHtml(item.name)}</a>
    <h2 class="page-title">Přidat záznam</h2>
    <form id="entry-form" class="card form" novalidate>
      <fieldset class="field segmented">
        <legend>Typ *</legend>
        <label><input type="radio" name="type" value="vydaj" checked><span>Výdaj</span></label>
        <label><input type="radio" name="type" value="prijem"><span>Příjem</span></label>
      </fieldset>
      <div class="field-row">
        <div class="field">
          <label for="f-date">Datum *</label>
          <input id="f-date" type="date" value="${todayIso()}" max="${todayIso()}">
          <div class="error" data-for="date"></div>
        </div>
        <div class="field">
          <label for="f-amount">Částka (Kč) *</label>
          <input id="f-amount" type="text" inputmode="decimal" autocomplete="off" placeholder="např. 800">
          <div class="error" data-for="amount"></div>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="btn-cancel">Zrušit</button>
        <button type="submit" class="btn btn-primary">Uložit</button>
      </div>
    </form>
  `;

  const form = document.getElementById('entry-form');
  document.getElementById('btn-cancel').addEventListener('click', () => navigate(itemHash(item.id)));
  document.getElementById('f-amount').focus();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const values = {
      type: form.querySelector('input[name="type"]:checked').value,
      date: document.getElementById('f-date').value,
      amount: parseKc(document.getElementById('f-amount').value),
    };

    const errors = {};
    if (!values.date) errors.date = 'Vyplň datum.';
    else if (values.date > todayIso()) errors.date = 'Datum nemůže být v budoucnu.';
    if (values.amount === null) errors.amount = 'Zadej částku číslem.';
    else if (values.amount <= 0) errors.amount = 'Částka musí být alespoň 1 Kč.';

    form.querySelectorAll('.error').forEach((el) => {
      el.textContent = errors[el.dataset.for] || '';
    });
    if (Object.keys(errors).length > 0) return;

    try {
      DataStore.addEntry(item.id, values);
    } catch (err) {
      console.error(err);
      alert('Záznam se nepodařilo uložit. Zkus to prosím znovu.');
      return;
    }
    navigate(itemHash(item.id));
  });
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
