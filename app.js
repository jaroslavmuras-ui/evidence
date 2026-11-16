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
  else if (route === '/smazat-prodeje') renderCleanup();
  else if ((match = route.match(/^\/vec\/([^/]+)\/zaznam$/))) renderEntryForm(decodeURIComponent(match[1]));
  else if ((match = route.match(/^\/vec\/([^/]+)\/zaznam\/([^/]+)$/))) renderEntryForm(decodeURIComponent(match[1]), decodeURIComponent(match[2]));
  else if ((match = route.match(/^\/vec\/([^/]+)\/upravit$/))) renderEditItem(decodeURIComponent(match[1]));
  else if ((match = route.match(/^\/vec\/([^/]+)\/prodat$/))) renderSell(decodeURIComponent(match[1]));
  else if ((match = route.match(/^\/vec\/([^/]+)$/))) renderDetail(decodeURIComponent(match[1]));
  else renderOverview();
  window.scrollTo(0, 0);
}

function itemHash(id, suffix = '') {
  return `#/vec/${encodeURIComponent(id)}${suffix}`;
}

window.addEventListener('hashchange', render);

// ---------- Obrazovka: Přehled ----------

function renderSummary(totals, label = 'Celkový souhrn', resultLabel = 'Výsledek') {
  return `
    <section class="summary" aria-label="${escapeHtml(label)}">
      <div class="summary-card summary-result">
        <div class="summary-label">${escapeHtml(resultLabel)}</div>
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

  const deletableCount = items.filter(DataStore.canDelete).length;

  app.innerHTML = `
    ${renderSummary(totals)}
    <div class="section-head">
      <h2>Moje věci</h2>
      <button type="button" class="btn btn-primary" id="btn-add-item">+ Přidat věc</button>
    </div>
    ${renderItemList(items)}
    ${deletableCount > 0 ? `
      <div class="list-footer">
        <button type="button" class="btn-link btn-link-danger" id="btn-cleanup">Smazat staré prodeje (${deletableCount})</button>
      </div>` : ''}
  `;

  document.getElementById('btn-add-item').addEventListener('click', () => navigate('#/pridat'));
  const cleanupBtn = document.getElementById('btn-cleanup');
  if (cleanupBtn) cleanupBtn.addEventListener('click', () => navigate('#/smazat-prodeje'));
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

// Jen tyto záznamy jde upravovat a mazat (nákup je neměnný).
const EDITABLE_TYPES = ['vydaj', 'prijem'];

function renderEntryRow(entry, editable) {
  const isExpense = EXPENSE_TYPES.includes(entry.type);
  const amount = isExpense ? -entry.amount : entry.amount;
  return `
    <li class="entry-row">
      <div class="entry-info">
        <div class="entry-type">${ENTRY_LABELS[entry.type] || entry.type}${entry.source ? `<span class="entry-source"> · ${escapeHtml(entry.source)}</span>` : ''}</div>
        <div class="entry-date">${formatDate(entry.date)}</div>
      </div>
      <div class="entry-amount ${resultClass(amount)}">${formatKc(amount, { signed: true })}</div>
      ${editable && EDITABLE_TYPES.includes(entry.type) ? `
        <div class="entry-actions">
          <button type="button" class="btn-link" data-edit="${escapeHtml(entry.id)}">Upravit</button>
          <button type="button" class="btn-link btn-link-danger" data-delete="${escapeHtml(entry.id)}">Smazat</button>
        </div>` : ''}
    </li>
  `;
}

function renderDetail(id) {
  const item = DataStore.getItem(id);
  if (!item) return renderNotFound();

  const totals = computeTotals(item.entries);
  const owned = item.status === 'owned';
  const sale = item.entries.find((e) => e.type === 'prodej');
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
    ${renderSummary(totals, 'Souhrn věci', owned ? 'Výsledek' : 'Konečný výsledek')}
    ${owned ? `
      <div class="detail-actions">
        <button type="button" class="btn btn-secondary" id="btn-edit-item">Upravit věc</button>
        <button type="button" class="btn btn-secondary" id="btn-sell">Prodat</button>
      </div>` : `
      <div class="sold-banner">
        <span>Prodáno ${sale ? `${formatDate(sale.date)} za <strong>${formatKc(sale.amount)}</strong>` : ''}. Historie je uzavřená.</span>
        <button type="button" class="btn-link" id="btn-undo-sale">Vrátit prodej</button>
      </div>
      <div class="detail-actions">
        ${DataStore.canDelete(item)
          ? '<button type="button" class="btn btn-danger-outline" id="btn-delete-item">Smazat věc</button>'
          : `<p class="form-hint">Smazat věc půjde od ${formatDate(DataStore.deletableFrom(item))}.</p>`}
      </div>`}
    <div class="section-head">
      <h2>Historie</h2>
      ${owned ? '<button type="button" class="btn btn-primary" id="btn-add-entry">+ Přidat záznam</button>' : ''}
    </div>
    <ul class="entry-list">${history.map((e) => renderEntryRow(e, owned)).join('')}</ul>
  `;

  if (!owned) {
    document.getElementById('btn-undo-sale').addEventListener('click', () => {
      confirmDialog({
        title: 'Vrátit prodej?',
        message: 'Prodej se zruší a věc bude znovu ve stavu <strong>Vlastním</strong>. Záznam o prodeji se z historie odstraní.',
        confirmText: 'Vrátit prodej',
        cancelText: 'Ponechat',
      }).then((ok) => {
        if (!ok) return;
        try {
          DataStore.undoSale(item.id);
        } catch (err) {
          console.error(err);
          alert('Prodej se nepodařilo vrátit.');
        }
        render();
      });
    });

    const deleteBtn = document.getElementById('btn-delete-item');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        confirmDialog({
          title: 'Smazat věc?',
          message: `Opravdu smazat <strong>${escapeHtml(item.name)}</strong> i celou její historii? Tuto akci nejde vrátit.`,
          confirmText: 'Smazat',
          cancelText: 'Ponechat',
          danger: true,
        }).then((ok) => {
          if (!ok) return;
          try {
            DataStore.deleteItems([item.id]);
          } catch (err) {
            console.error(err);
            alert('Věc se nepodařilo smazat.');
            return render();
          }
          navigate('#/');
        });
      });
    }
    return;
  }

  document.getElementById('btn-add-entry').addEventListener('click', () => navigate(itemHash(item.id, '/zaznam')));
  document.getElementById('btn-edit-item').addEventListener('click', () => navigate(itemHash(item.id, '/upravit')));
  document.getElementById('btn-sell').addEventListener('click', () => navigate(itemHash(item.id, '/prodat')));

  app.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(itemHash(item.id, '/zaznam/' + encodeURIComponent(btn.dataset.edit))));
  });

  app.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const entry = item.entries.find((e) => e.id === btn.dataset.delete);
      if (!entry) return;
      const label = ENTRY_LABELS[entry.type].toLowerCase();
      confirmDialog({
        title: 'Smazat záznam?',
        message: `Opravdu smazat ${label} <strong>${formatKc(entry.amount)}</strong> ze dne ${formatDate(entry.date)}${entry.source ? ` (${escapeHtml(entry.source)})` : ''}?`,
        confirmText: 'Smazat',
        cancelText: 'Ponechat',
        danger: true,
      }).then((ok) => {
        if (!ok) return;
        try {
          DataStore.deleteEntry(item.id, entry.id);
        } catch (err) {
          console.error(err);
          alert('Záznam se nepodařilo smazat.');
        }
        render();
      });
    });
  });
}

// ---------- Obrazovka: Přidat / upravit záznam ----------

function renderEntryForm(id, entryId) {
  const item = DataStore.getItem(id);
  if (!item) return renderNotFound();
  if (item.status !== 'owned') return navigate(itemHash(id));

  // Úprava existujícího záznamu, nebo nový záznam.
  let entry = null;
  if (entryId) {
    entry = item.entries.find((e) => e.id === entryId);
    if (!entry || !EDITABLE_TYPES.includes(entry.type)) return navigate(itemHash(id));
  }
  const type = entry ? entry.type : 'vydaj';

  app.innerHTML = `
    <a class="back-link" href="${itemHash(item.id)}">← ${escapeHtml(item.name)}</a>
    <h2 class="page-title">${entry ? 'Upravit záznam' : 'Přidat záznam'}</h2>
    <form id="entry-form" class="card form" novalidate>
      <fieldset class="field segmented">
        <legend>Typ *</legend>
        <label><input type="radio" name="type" value="vydaj"${type === 'vydaj' ? ' checked' : ''}><span>Výdaj</span></label>
        <label><input type="radio" name="type" value="prijem"${type === 'prijem' ? ' checked' : ''}><span>Příjem</span></label>
      </fieldset>
      <div class="field-row">
        <div class="field">
          <label for="f-date">Datum *</label>
          <input id="f-date" type="date" value="${entry ? entry.date : todayIso()}" max="${todayIso()}">
          <div class="error" data-for="date"></div>
        </div>
        <div class="field">
          <label for="f-amount">Částka (Kč) *</label>
          <input id="f-amount" type="text" inputmode="decimal" autocomplete="off" placeholder="např. 800" value="${entry ? entry.amount : ''}">
          <div class="error" data-for="amount"></div>
        </div>
      </div>
      <div class="field">
        <label for="f-source">Zdroj</label>
        <input id="f-source" type="text" maxlength="100" autocomplete="off" list="source-list" placeholder="např. oprava, pronájem" value="${entry ? escapeHtml(entry.source || '') : ''}">
        <datalist id="source-list">
          ${DataStore.getSources().map((s) => `<option value="${escapeHtml(s)}"></option>`).join('')}
        </datalist>
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
      source: document.getElementById('f-source').value.trim(),
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
      if (entry) DataStore.updateEntry(item.id, entry.id, values);
      else DataStore.addEntry(item.id, values);
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

// ---------- Obrazovka: Upravit věc ----------

function renderEditItem(id) {
  const item = DataStore.getItem(id);
  if (!item) return renderNotFound();
  if (item.status !== 'owned') return navigate(itemHash(id));
  const purchase = item.entries.find((e) => e.type === 'nakup');

  app.innerHTML = `
    <a class="back-link" href="${itemHash(item.id)}">← ${escapeHtml(item.name)}</a>
    <h2 class="page-title">Upravit věc</h2>
    <form id="item-form" class="card form" novalidate>
      <div class="field">
        <label for="f-name">Název *</label>
        <input id="f-name" type="text" maxlength="100" autocomplete="off" value="${escapeHtml(item.name)}">
        <div class="error" data-for="name"></div>
      </div>
      <div class="field">
        <label for="f-note">Poznámka</label>
        <textarea id="f-note" rows="2" maxlength="500">${escapeHtml(item.note || '')}</textarea>
      </div>
      ${purchase ? `
        <p class="form-hint">Nákup ${formatDate(purchase.date)} za ${formatKc(purchase.amount)} už nejde změnit.</p>` : ''}
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="btn-cancel">Zrušit</button>
        <button type="submit" class="btn btn-primary">Uložit</button>
      </div>
    </form>
  `;

  const form = document.getElementById('item-form');
  document.getElementById('btn-cancel').addEventListener('click', () => navigate(itemHash(item.id)));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('f-name').value.trim();
    const note = document.getElementById('f-note').value.trim();
    const error = form.querySelector('[data-for="name"]');
    error.textContent = name ? '' : 'Vyplň název.';
    if (!name) return;

    try {
      DataStore.updateItem(item.id, { name, note });
    } catch (err) {
      console.error(err);
      alert('Změny se nepodařilo uložit. Zkus to prosím znovu.');
      return;
    }
    navigate(itemHash(item.id));
  });
}

// ---------- Obrazovka: Prodat věc ----------

function renderSell(id) {
  const item = DataStore.getItem(id);
  if (!item) return renderNotFound();
  if (item.status !== 'owned') return navigate(itemHash(id));

  const before = computeTotals(item.entries);
  const purchase = item.entries.find((e) => e.type === 'nakup');
  const minDate = purchase ? purchase.date : '';

  app.innerHTML = `
    <a class="back-link" href="${itemHash(item.id)}">← ${escapeHtml(item.name)}</a>
    <h2 class="page-title">Prodat věc</h2>
    <form id="sell-form" class="card form" novalidate>
      <div class="field-row">
        <div class="field">
          <label for="f-date">Datum prodeje *</label>
          <input id="f-date" type="date" value="${todayIso()}" min="${minDate}" max="${todayIso()}">
          <div class="error" data-for="date"></div>
        </div>
        <div class="field">
          <label for="f-amount">Prodejní cena (Kč) *</label>
          <input id="f-amount" type="text" inputmode="decimal" autocomplete="off" placeholder="např. 2 000">
          <div class="error" data-for="amount"></div>
        </div>
      </div>
      <div class="sell-preview" id="sell-preview" aria-live="polite"></div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="btn-cancel">Zrušit</button>
        <button type="submit" class="btn btn-primary">Potvrdit prodej</button>
      </div>
    </form>
  `;

  const form = document.getElementById('sell-form');
  const amountInput = document.getElementById('f-amount');
  const preview = document.getElementById('sell-preview');

  // Náhled konečného výsledku podle zadané ceny.
  function updatePreview() {
    const amount = parseKc(amountInput.value);
    const result = before.result + (amount && amount > 0 ? amount : 0);
    preview.innerHTML = `Po prodeji budeš celkem na <strong class="${resultClass(result)}">${formatKc(result, { signed: true })}</strong>`;
  }
  amountInput.addEventListener('input', updatePreview);
  updatePreview();

  document.getElementById('btn-cancel').addEventListener('click', () => navigate(itemHash(item.id)));
  amountInput.focus();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const values = {
      date: document.getElementById('f-date').value,
      amount: parseKc(amountInput.value),
    };

    const errors = {};
    if (!values.date) errors.date = 'Vyplň datum prodeje.';
    else if (values.date > todayIso()) errors.date = 'Datum nemůže být v budoucnu.';
    else if (minDate && values.date < minDate) errors.date = `Datum prodeje nemůže být před nákupem (${formatDate(minDate)}).`;
    if (values.amount === null) errors.amount = 'Zadej částku číslem.';
    else if (values.amount <= 0) errors.amount = 'Částka musí být alespoň 1 Kč.';

    form.querySelectorAll('.error').forEach((el) => {
      el.textContent = errors[el.dataset.for] || '';
    });
    if (Object.keys(errors).length > 0) return;

    try {
      DataStore.sellItem(item.id, values);
    } catch (err) {
      console.error(err);
      alert('Prodej se nepodařilo uložit. Zkus to prosím znovu.');
      return;
    }
    navigate(itemHash(item.id));
  });
}

// ---------- Obrazovka: Smazat staré prodeje ----------

function renderCleanup() {
  const candidates = DataStore.getItems()
    .filter(DataStore.canDelete)
    .map((item) => ({ item, sale: item.entries.find((e) => e.type === 'prodej') }))
    .sort((a, b) => a.sale.date.localeCompare(b.sale.date));

  if (candidates.length === 0) return navigate('#/');

  app.innerHTML = `
    <a class="back-link" href="#/">← Přehled</a>
    <h2 class="page-title">Smazat staré prodeje</h2>
    <p class="form-hint page-hint">Věci prodané před 30 a více dny. Vybrané věci se smažou i s celou historií a nepůjdou obnovit.</p>
    <form id="cleanup-form" novalidate>
      <ul class="check-list">
        ${candidates.map(({ item, sale }) => {
          const result = computeTotals(item.entries).result;
          return `
            <li>
              <label class="check-row">
                <input type="checkbox" value="${escapeHtml(item.id)}" checked>
                <span class="check-main">
                  <span class="item-name">${escapeHtml(item.name)}</span>
                  <span class="entry-date">Prodáno ${formatDate(sale.date)}</span>
                </span>
                <span class="item-result ${resultClass(result)}">${formatKc(result, { signed: true })}</span>
              </label>
            </li>`;
        }).join('')}
      </ul>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="btn-cancel">Zrušit</button>
        <button type="submit" class="btn btn-danger" id="btn-submit"></button>
      </div>
    </form>
  `;

  const form = document.getElementById('cleanup-form');
  const submit = document.getElementById('btn-submit');
  const selectedIds = () => [...form.querySelectorAll('input[type=checkbox]:checked')].map((c) => c.value);

  function updateButton() {
    const n = selectedIds().length;
    submit.textContent = `Smazat vybrané (${n})`;
    submit.disabled = n === 0;
  }
  form.addEventListener('change', updateButton);
  updateButton();

  document.getElementById('btn-cancel').addEventListener('click', () => navigate('#/'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ids = selectedIds();
    if (ids.length === 0) return;
    confirmDialog({
      title: 'Smazat vybrané věci?',
      message: `Opravdu smazat <strong>${ids.length}</strong> ${ids.length === 1 ? 'věc' : ids.length < 5 ? 'věci' : 'věcí'} i s celou historií? Tuto akci nejde vrátit.`,
      confirmText: 'Smazat',
      cancelText: 'Ponechat',
      danger: true,
    }).then((ok) => {
      if (!ok) return;
      try {
        DataStore.deleteItems(ids);
      } catch (err) {
        console.error(err);
        alert('Věci se nepodařilo smazat.');
        return render();
      }
      navigate('#/');
    });
  });
}

// ---------- Potvrzovací okno ----------

function confirmDialog({ title, message, confirmText, cancelText, danger = false }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'dialog';
    dialog.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p>${message}</p>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" data-answer="no">${escapeHtml(cancelText)}</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-answer="yes">${escapeHtml(confirmText)}</button>
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
