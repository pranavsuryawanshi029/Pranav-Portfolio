/* Smart Expense Tracker — vanilla JavaScript, data saved in localStorage */
(function () {
  'use strict';

  var KEY = 'pranav.expenseTracker.v1';
  var CATS = {
    expense: ['Food', 'Rent', 'Transport', 'Shopping', 'Bills', 'Health', 'Education', 'Entertainment', 'Other'],
    income: ['Salary', 'Freelance', 'Scholarship', 'Gift', 'Other']
  };
  var COLORS = {
    Food: '#4f46e5', Rent: '#9333ea', Transport: '#06b6d4', Shopping: '#f97316', Bills: '#ef4444',
    Health: '#10b981', Education: '#eab308', Entertainment: '#ec4899', Other: '#6b7280',
    Salary: '#10b981', Freelance: '#06b6d4', Scholarship: '#eab308', Gift: '#ec4899'
  };

  var state = { tx: [], budget: 0 };
  var formType = 'expense';
  var editId = null;
  var viewMonth = monthKey(today());

  function $(id) { return document.getElementById(id); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function monthKey(dateStr) { return dateStr.slice(0, 7); }
  function monthLabel(key) {
    var p = key.split('-');
    return new Date(+p[0], +p[1] - 1, 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
  }
  function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
  function newId() { return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00')); }

  /* ---------- storage ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d && Array.isArray(d.tx)) {
        state.tx = d.tx.filter(function (t) {
          return t && (t.type === 'expense' || t.type === 'income') && isFinite(t.amount) && isDate(t.date);
        });
        state.budget = Number(d.budget) > 0 ? Number(d.budget) : 0;
      }
    } catch (e) { /* storage unavailable or corrupt: start fresh */ }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast('Could not save (browser storage is blocked).'); } }

  var toastTimer;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- helpers ---------- */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function monthTx() { return state.tx.filter(function (t) { return viewMonth === 'all' || monthKey(t.date) === viewMonth; }); }
  function sum(list, type) { return list.reduce(function (a, t) { return a + (t.type === type ? t.amount : 0); }, 0); }
  function budgetMonth() { return viewMonth === 'all' ? monthKey(today()) : viewMonth; }

  /* ---------- form ---------- */
  function fillCategories(sel, list, withAll) {
    var keep = sel.value;
    sel.innerHTML = '';
    if (withAll) { var o = el('option', '', 'All categories'); o.value = 'all'; sel.appendChild(o); }
    list.forEach(function (c) { var o = el('option', '', c); o.value = c; sel.appendChild(o); });
    if (keep && Array.prototype.some.call(sel.options, function (o) { return o.value === keep; })) sel.value = keep;
  }
  function setType(type) {
    formType = type;
    document.querySelectorAll('.seg-btn').forEach(function (b) {
      var on = b.dataset.type === type; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
    });
    fillCategories($('category'), CATS[type]);
  }
  function resetForm() {
    editId = null;
    $('title').value = ''; $('amount').value = ''; $('note').value = ''; $('date').value = today();
    $('formErr').textContent = ''; $('submitBtn').textContent = 'Add transaction'; $('cancelEdit').hidden = true;
    $('formTitle').textContent = 'Add transaction';
  }
  function submitForm(e) {
    e.preventDefault();
    var title = $('title').value.trim(), amount = parseFloat($('amount').value), date = $('date').value,
        cat = $('category').value, note = $('note').value.trim(), err = $('formErr');
    if (!title) { err.textContent = 'Please enter a title.'; $('title').focus(); return; }
    if (!isFinite(amount) || amount <= 0) { err.textContent = 'Enter an amount greater than 0.'; $('amount').focus(); return; }
    if (amount > 1e9) { err.textContent = 'Amount is too large.'; $('amount').focus(); return; }
    if (!isDate(date)) { err.textContent = 'Please choose a valid date.'; $('date').focus(); return; }
    amount = Math.round(amount * 100) / 100;
    var rec = { id: editId || newId(), type: formType, title: title, amount: amount, category: cat, date: date, note: note };
    if (editId) {
      state.tx = state.tx.map(function (t) { return t.id === editId ? rec : t; });
      toast('Transaction updated');
    } else {
      state.tx.push(rec);
      toast(formType === 'income' ? 'Income added' : 'Expense added');
    }
    save(); viewMonth = viewMonth === 'all' ? 'all' : monthKey(date);
    resetForm(); render();
  }
  function startEdit(id) {
    var t = state.tx.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    editId = id; setType(t.type);
    $('title').value = t.title; $('amount').value = t.amount; $('date').value = t.date;
    $('category').value = t.category; $('note').value = t.note || '';
    $('submitBtn').textContent = 'Save changes'; $('cancelEdit').hidden = false;
    $('formTitle').textContent = 'Edit transaction'; $('formErr').textContent = '';
    $('title').focus(); $('txForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function removeTx(id) {
    var t = state.tx.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    if (!confirm('Delete "' + t.title + '"?')) return;
    state.tx = state.tx.filter(function (x) { return x.id !== id; });
    if (editId === id) resetForm();
    save(); render(); toast('Transaction deleted');
  }

  /* ---------- render ---------- */
  function renderMonths() {
    var sel = $('viewMonth'), set = {};
    state.tx.forEach(function (t) { set[monthKey(t.date)] = 1; });
    set[monthKey(today())] = 1;
    var keys = Object.keys(set).sort().reverse();
    sel.innerHTML = '';
    var all = el('option', '', 'All time'); all.value = 'all'; sel.appendChild(all);
    keys.forEach(function (k) { var o = el('option', '', monthLabel(k)); o.value = k; sel.appendChild(o); });
    if (viewMonth !== 'all' && keys.indexOf(viewMonth) === -1) viewMonth = keys[0];
    sel.value = viewMonth;
  }
  function renderSummary() {
    var list = monthTx(), inc = sum(list, 'income'), exp = sum(list, 'expense'), bal = inc - exp;
    $('sumBalance').textContent = (bal < 0 ? '-' : '') + fmt(Math.abs(bal));
    $('sumBalance').className = bal < 0 ? 'neg' : '';
    $('sumIncome').textContent = fmt(inc); $('sumExpense').textContent = fmt(exp);
    $('sumCount').textContent = list.length + (list.length === 1 ? ' transaction' : ' transactions');
    $('sumRate').textContent = inc > 0 ? 'Savings rate: ' + Math.round(((inc - exp) / inc) * 100) + '%' : 'Savings rate: -';
  }
  function renderBudget() {
    var bm = budgetMonth(), spent = sum(state.tx.filter(function (t) { return monthKey(t.date) === bm; }), 'expense');
    var bar = $('budgetBar'), txt = $('budgetText'), track = $('budgetTrack');
    $('budgetInput').value = state.budget || '';
    if (!state.budget) { bar.style.width = '0'; bar.className = ''; txt.textContent = 'No budget set'; track.setAttribute('aria-valuenow', 0); return; }
    var pct = (spent / state.budget) * 100, shown = Math.min(100, pct);
    bar.style.width = shown + '%'; bar.className = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '';
    track.setAttribute('aria-valuenow', Math.round(shown));
    txt.textContent = monthLabel(bm) + ': ' + fmt(spent) + ' of ' + fmt(state.budget) + ' (' + Math.round(pct) + '%)' +
      (pct >= 100 ? ' - over budget!' : pct >= 80 ? ' - nearing limit' : '');
  }

  function setupCanvas(c, w, h) {
    var dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    var ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    return ctx;
  }
  function renderPie() {
    var c = $('pie'), size = 240, ctx = setupCanvas(c, size, size), legend = $('pieLegend');
    var totals = {}, total = 0;
    monthTx().forEach(function (t) { if (t.type === 'expense') { totals[t.category] = (totals[t.category] || 0) + t.amount; total += t.amount; } });
    var cats = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; });
    var cx = size / 2, cy = size / 2, R = 108, r = 70;
    legend.innerHTML = '';
    if (!total) {
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.arc(cx, cy, r, 0, Math.PI * 2, true); ctx.fillStyle = '#eef2ff'; ctx.fill('evenodd');
      ctx.fillStyle = '#6b7280'; ctx.font = '500 13px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('No expenses', cx, cy + 4);
      legend.appendChild(el('li', 'empty-note', 'Add an expense to see the breakdown.')); return;
    }
    var a = -Math.PI / 2;
    cats.forEach(function (k) {
      var ang = (totals[k] / total) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(cx, cy, R, a, a + ang); ctx.arc(cx, cy, r, a + ang, a, true); ctx.closePath();
      ctx.fillStyle = COLORS[k] || '#6b7280'; ctx.fill(); a += ang;
      var li = el('li'), dot = el('i'); dot.style.background = COLORS[k] || '#6b7280';
      li.appendChild(dot); li.appendChild(el('span', '', k)); li.appendChild(el('span', 'amt', fmt(totals[k])));
      li.appendChild(el('span', 'pct', Math.round((totals[k] / total) * 100) + '%')); legend.appendChild(li);
    });
    ctx.fillStyle = '#6b7280'; ctx.font = '500 12px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Total spent', cx, cy - 8);
    ctx.fillStyle = '#111827'; ctx.font = '700 18px Poppins, sans-serif'; ctx.fillText(fmt(total), cx, cy + 14);
  }
  function short(n) { return n >= 1e5 ? (n / 1e5).toFixed(n % 1e5 ? 1 : 0) + 'L' : n >= 1e3 ? (n / 1e3).toFixed(n % 1e3 ? 1 : 0) + 'k' : String(n); }
  function renderBars() {
    var c = $('bars'), w = Math.max(280, c.clientWidth), h = 230, ctx = setupCanvas(c, w, h);
    var now = new Date(), months = [];
    for (var i = 5; i >= 0; i--) { var d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push(d.getFullYear() + '-' + pad(d.getMonth() + 1)); }
    var data = months.map(function (m) {
      var l = state.tx.filter(function (t) { return monthKey(t.date) === m; }); return { m: m, inc: sum(l, 'income'), exp: sum(l, 'expense') };
    });
    var max = Math.max.apply(null, data.map(function (d) { return Math.max(d.inc, d.exp); }).concat([1]));
    var step = Math.pow(10, Math.floor(Math.log(max) / Math.LN10)), nice = Math.ceil(max / step) * step;
    var L = 46, B = 28, T = 10, W = w - L - 8, H = h - B - T;
    ctx.font = '400 11px Poppins, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#6b7280'; ctx.strokeStyle = '#eef0f4'; ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var y = T + H - (H * g) / 4; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + W, y); ctx.stroke(); ctx.fillText(short(Math.round((nice * g) / 4)), L - 6, y + 4);
    }
    var slot = W / data.length, bw = Math.min(22, slot / 3.2);
    data.forEach(function (d, i) {
      var x = L + slot * i + slot / 2, hi = (d.inc / nice) * H, he = (d.exp / nice) * H;
      ctx.fillStyle = '#10b981'; ctx.fillRect(x - bw - 1, T + H - hi, bw, hi);
      ctx.fillStyle = '#6366f1'; ctx.fillRect(x + 1, T + H - he, bw, he);
      ctx.fillStyle = d.m === viewMonth ? '#4f46e5' : '#6b7280'; ctx.font = (d.m === viewMonth ? '600' : '400') + ' 11px Poppins, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(monthLabel(d.m).split(' ')[0], x, h - 8);
    });
  }

  function renderList() {
    var q = $('q').value.trim().toLowerCase(), ft = $('fType').value, fc = $('fCat').value, ul = $('list');
    var rows = monthTx().filter(function (t) {
      return (ft === 'all' || t.type === ft) && (fc === 'all' || t.category === fc) &&
        (!q || (t.title + ' ' + (t.note || '')).toLowerCase().indexOf(q) !== -1);
    }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1); });
    ul.innerHTML = '';
    $('listCount').textContent = '(' + rows.length + ')';
    if (!rows.length) {
      var li = el('li', 'empty', state.tx.length ? 'No transactions match these filters.' : 'No transactions yet. Add one, or click "Load sample data".'); ul.appendChild(li); return;
    }
    rows.forEach(function (t) {
      var li = el('li', 'tx'), dot = el('span', 'dot'); dot.style.background = COLORS[t.category] || '#6b7280';
      var main = el('div', 'tx-main'); main.appendChild(el('div', 'tx-title', t.title));
      var d = new Date(t.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      main.appendChild(el('div', 'tx-meta', t.category + ' · ' + d + (t.note ? ' · ' + t.note : '')));
      var amt = el('div', 'tx-amt ' + (t.type === 'income' ? 'pos' : 'neg'), (t.type === 'income' ? '+' : '-') + fmt(t.amount));
      var act = el('div', 'tx-actions'), ed = el('button', 'icon-btn', 'Edit'), dl = el('button', 'icon-btn del', 'Delete');
      ed.type = dl.type = 'button'; ed.setAttribute('aria-label', 'Edit ' + t.title); dl.setAttribute('aria-label', 'Delete ' + t.title);
      ed.onclick = function () { startEdit(t.id); }; dl.onclick = function () { removeTx(t.id); };
      act.appendChild(ed); act.appendChild(dl);
      li.appendChild(dot); li.appendChild(main); li.appendChild(amt); li.appendChild(act); ul.appendChild(li);
    });
  }
  function renderFilterCats() {
    var all = CATS.expense.concat(CATS.income.filter(function (c) { return CATS.expense.indexOf(c) === -1; }));
    fillCategories($('fCat'), all, true);
  }
  function render() { renderMonths(); renderSummary(); renderBudget(); renderPie(); renderBars(); renderList(); }

  /* ---------- actions ---------- */
  function exportCsv() {
    if (!state.tx.length) { toast('Nothing to export yet.'); return; }
    function cell(v) {
      v = String(v == null ? '' : v);
      if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;            // block spreadsheet formula injection
      return '"' + v.replace(/"/g, '""') + '"';
    }
    var lines = [['Date', 'Type', 'Category', 'Title', 'Amount (INR)', 'Note'].map(cell).join(',')];
    state.tx.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (t) {
      lines.push([t.date, t.type, t.category, t.title, t.amount, t.note].map(cell).join(','));
    });
    var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'expenses-' + today() + '.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
    toast('CSV exported');
  }
  function loadSample() {
    if (state.tx.length && !confirm('Add sample data to your existing transactions?')) return;
    var now = new Date(), td = now.getDate(), out = [];
    var plan = [
      [1, 'income', 'Monthly stipend', 28000, 'Scholarship'], [12, 'income', 'Freelance website', 9500, 'Freelance'],
      [2, 'expense', 'Room rent', 8500, 'Rent'], [3, 'expense', 'Grocery shopping', 1850, 'Food'], [5, 'expense', 'Metro and bus pass', 900, 'Transport'],
      [6, 'expense', 'Mobile recharge', 599, 'Bills'], [8, 'expense', 'Online course', 1999, 'Education'], [9, 'expense', 'Lunch with friends', 640, 'Food'],
      [11, 'expense', 'Movie tickets', 520, 'Entertainment'], [14, 'expense', 'Headphones', 2499, 'Shopping'], [16, 'expense', 'Pharmacy', 380, 'Health'],
      [18, 'expense', 'Electricity bill', 1240, 'Bills'], [20, 'expense', 'Dinner and snacks', 780, 'Food'], [22, 'expense', 'Cab rides', 460, 'Transport']
    ];
    for (var m = 2; m >= 0; m--) {
      var d0 = new Date(now.getFullYear(), now.getMonth() - m, 1), dim = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
      plan.forEach(function (p, i) {
        var day = Math.min(p[0], dim); if (m === 0 && day > td) return;
        var factor = 1 + (((i * 7 + m * 3) % 9) - 4) / 40;      // small month-to-month variation
        var amt = p[1] === 'expense' && p[4] !== 'Rent' ? Math.round(p[3] * factor) : p[3];
        out.push({ id: newId(), type: p[1], title: p[2], amount: amt, category: p[4], date: d0.getFullYear() + '-' + pad(d0.getMonth() + 1) + '-' + pad(day), note: '' });
      });
    }
    state.tx = state.tx.concat(out); if (!state.budget) state.budget = 25000;
    viewMonth = monthKey(today()); save(); render(); toast('Sample data loaded');
  }
  function clearAll() {
    if (!state.tx.length && !state.budget) { toast('Already empty.'); return; }
    if (!confirm('Delete ALL transactions and the budget? This cannot be undone.')) return;
    state = { tx: [], budget: 0 }; save(); resetForm(); render(); toast('All data cleared');
  }
  function saveBudget() {
    var v = parseFloat($('budgetInput').value);
    if ($('budgetInput').value === '' || v === 0) { state.budget = 0; save(); renderBudget(); toast('Budget removed'); return; }
    if (!isFinite(v) || v < 0 || v > 1e9) { toast('Enter a valid budget amount.'); return; }
    state.budget = Math.round(v); save(); renderBudget(); toast('Budget saved');
  }

  /* ---------- init ---------- */
  function init() {
    load(); renderFilterCats(); setType('expense'); resetForm();
    document.querySelectorAll('.seg-btn').forEach(function (b) { b.addEventListener('click', function () { setType(b.dataset.type); }); });
    $('txForm').addEventListener('submit', submitForm);
    $('cancelEdit').addEventListener('click', resetForm);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && editId) resetForm(); });
    $('viewMonth').addEventListener('change', function (e) { viewMonth = e.target.value; render(); });
    ['q', 'fType', 'fCat'].forEach(function (id) { $(id).addEventListener(id === 'q' ? 'input' : 'change', renderList); });
    $('exportBtn').addEventListener('click', exportCsv);
    $('sampleBtn').addEventListener('click', loadSample);
    $('clearBtn').addEventListener('click', clearAll);
    $('budgetSave').addEventListener('click', saveBudget);
    $('budgetInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); saveBudget(); } });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { renderPie(); renderBars(); }, 120); });
    render();
  }
  init();
})();
