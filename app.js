'use strict';
const $ = s => document.querySelector(s);
const KEY = 'examrunway-v1';
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DIFF = ['', 'Easy', 'Medium', 'Hard'], CONF = ['', 'Low', 'Okay', 'High'];
const blank = () => ({ name: '', date: '', hours: 3, rest: [], topics: [], plan: null });
let S = blank();
try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && Array.isArray(r.topics)) S = Object.assign(blank(), r); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const esc = t => String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day0 = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const fmtH = q => q / 4 + ' h';
const fmtD = s => parse(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

function toast(msg) { const t = $('#toast'); t.textContent = msg; clearTimeout(toast.t); toast.t = setTimeout(() => t.textContent = '', 3500); }
function showErr(id, list, field) {
  const b = $('#' + id);
  b.hidden = !list.length;
  b.innerHTML = list.length ? 'Fix this:<ul>' + list.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul>' : '';
  if (field) field.forEach(f => f.setAttribute('aria-invalid', 'false'));
}

function show(id) {
  document.querySelectorAll('.screen').forEach(e => e.hidden = e.id !== id);
  $('#steps').hidden = id === 'landing';
  document.querySelectorAll('#steps li').forEach(li => {
    li.classList.toggle('on', li.dataset.s === id);
    if (li.dataset.s === id) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });
  if (id === 'setup') fillSetup();
  if (id === 'topics') renderTopics();
  if (id === 'plan') renderPlan();
  if (id === 'landing') $('#resumeBtn').hidden = !S.plan;
  const h = $('#' + id + ' h1, #' + id + ' h2'); h.tabIndex = -1; h.focus(); window.scrollTo(0, 0);
}

/* ---------- Setup ---------- */
$('#rest').innerHTML = DAYS.map((d, i) => `<label><input type="checkbox" name="rest" value="${i}"> ${d}</label>`).join('');
function fillSetup() {
  $('#name').value = S.name; $('#date').value = S.date; $('#hours').value = S.hours;
  document.querySelectorAll('[name=rest]').forEach(c => c.checked = S.rest.includes(+c.value));
  const t = day0(new Date()); t.setDate(t.getDate() + 1); $('#date').min = key(t);
  showErr('setupErr', []);
}
function studyDays(dateStr, rest) {
  const out = [], t = day0(new Date()), ex = parse(dateStr);
  for (let d = new Date(t); d < ex; d.setDate(d.getDate() + 1)) if (!rest.includes(d.getDay())) out.push(new Date(d));
  return out;
}
$('#setupForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#name').value.trim(), date = $('#date').value, hours = parseFloat($('#hours').value);
  const rest = [...document.querySelectorAll('[name=rest]:checked')].map(c => +c.value);
  const errs = [];
  if (!name) errs.push('Enter an exam name.');
  if (!date) errs.push('Pick your exam date.');
  else if (parse(date) <= day0(new Date())) errs.push('The exam date must be after today.');
  else if (!studyDays(date, rest).length) errs.push('Your rest days remove every study day. Untick a rest day or pick a later date.');
  if (!(hours >= 0.5 && hours <= 12)) errs.push('Study hours per day must be between 0.5 and 12.');
  $('#name').setAttribute('aria-invalid', !name); $('#date').setAttribute('aria-invalid', !date || parse(date) <= day0(new Date()));
  $('#hours').setAttribute('aria-invalid', !(hours >= 0.5 && hours <= 12));
  showErr('setupErr', errs);
  if (errs.length) { $('#setupErr').scrollIntoView({ block: 'center' }); return; }
  Object.assign(S, { name, date, hours: Math.round(hours * 2) / 2, rest }); save(); show('topics');
});

/* ---------- Topics ---------- */
function renderTopics() {
  $('#topicList').innerHTML = S.topics.length ? S.topics.map((t, i) =>
    `<li><span><strong>${esc(t.name)}</strong><br><small class="muted">${DIFF[t.diff]} difficulty, ${CONF[t.conf]} confidence</small></span>
     <button type="button" class="btn small" data-del="${i}" aria-label="Delete ${esc(t.name)}">Delete</button></li>`).join('')
    : '<li class="empty" style="display:block">No topics yet. Add your first one above.</li>';
  showErr('topicErr', []); showErr('topicErr2', []);
}
$('#topicForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#tname').value.trim(), errs = [];
  if (!name) errs.push('Enter a topic name.');
  else if (S.topics.some(t => t.name.toLowerCase() === name.toLowerCase())) errs.push('"' + name + '" is already in your list.');
  else if (S.topics.length >= 20) errs.push('You can add up to 20 topics.');
  $('#tname').setAttribute('aria-invalid', errs.length > 0);
  showErr('topicErr', errs);
  if (errs.length) { $('#tname').focus(); return; }
  S.topics.push({ name, diff: +$('#diff').value, conf: +$('#conf').value });
  save(); renderTopics(); $('#tname').value = ''; $('#tname').focus(); toast('Added ' + name);
});
$('#topicList').addEventListener('click', e => {
  const b = e.target.closest('[data-del]'); if (!b) return;
  const [r] = S.topics.splice(+b.dataset.del, 1); save(); renderTopics(); toast('Removed ' + r.name); $('#tname').focus();
});

/* ---------- Planner ---------- */
function generate() {
  const days = studyDays(S.date, S.rest), n = days.length, T = S.topics.length;
  const rev = n >= 6 ? 2 : n >= 3 ? 1 : 0, learn = n - rev, cap = Math.round(S.hours * 4);
  const w = S.topics.map(t => t.diff * (4 - t.conf)), W = w.reduce((a, b) => a + b, 0);
  const H = learn * cap;                          // learning time in quarter-hours
  if (H < T * 2) return null;                     // under 30 min per topic
  const order = w.map((_, i) => i).sort((a, b) => w[b] - w[a]);
  const R = H - 2 * T, extra = w.map(x => Math.floor(R * x / W));
  const q = extra.map(x => x + 2);
  for (let left = R - extra.reduce((a, b) => a + b, 0), i = 0; left > 0; left--, i++) q[order[i % T]]++;
  let ti = 0, id = 0; const rem = q.slice();
  return days.map((d, di) => {
    const day = { date: key(d), revision: di >= learn, tasks: [] };
    if (!day.revision) {
      let c = cap;
      while (c > 0 && ti < T) {
        const i = order[ti], take = Math.min(c, rem[i]);
        day.tasks.push({ id: id++, text: 'Study ' + S.topics[i].name, q: take, done: false });
        rem[i] -= take; c -= take; if (!rem[i]) ti++;
      }
    } else {
      const share = Math.floor(cap / T);
      if (share >= 1) order.forEach(i => day.tasks.push({ id: id++, text: 'Revise ' + S.topics[i].name, q: share, done: false }));
      else day.tasks.push({ id: id++, text: 'Revise all topics', q: cap, done: false });
    }
    return day;
  });
}
$('#makePlan').addEventListener('click', () => {
  if (!S.topics.length) { showErr('topicErr2', ['Add at least one topic to build a plan.']); return; }
  const plan = generate();
  if (!plan) {
    showErr('topicErr2', ['There are too few study days for ' + S.topics.length + ' topics at ' + S.hours + ' h a day. Add study hours, remove topics, untick a rest day, or move the exam date later.']);
    return;
  }
  S.plan = plan; save(); show('plan'); toast('Plan ready: ' + plan.length + ' study days.');
});

/* ---------- Plan + progress ---------- */
function renderPlan() {
  const tk = key(day0(new Date()));
  $('#planTitle').textContent = S.name + ': your plan';
  $('#days').innerHTML = S.plan.map(d => {
    const complete = d.tasks.every(t => t.done);
    return `<article class="card day${d.date === tk ? ' today' : ''}${complete ? ' complete' : ''}">
      <h3>${fmtD(d.date)}${d.date === tk ? '<span class="badge b-today">Today</span>' : ''}${d.revision ? '<span class="badge b-rev">Revision</span>' : ''}<span class="badge b-done">Done</span></h3>
      <ul>${d.tasks.map(t => `<li class="${t.done ? 'checked' : ''}"><label><input type="checkbox" data-id="${t.id}" ${t.done ? 'checked' : ''}><span>${esc(t.text)}</span><em>${fmtH(t.q)}</em></label></li>`).join('')}</ul></article>`;
  }).join('') + `<article class="card"><h3>Exam day: ${esc(S.name)} (${fmtD(S.date)})</h3><p class="muted">No new topics. Sleep well and trust your plan.</p></article>`;
  updateProgress();
}
function updateProgress() {
  const all = S.plan.flatMap(d => d.tasks), done = all.filter(t => t.done).length, pct = Math.round(done / all.length * 100);
  $('#bar').style.width = pct + '%'; $('.progress').setAttribute('aria-valuenow', pct);
  $('#pct').textContent = pct + '% complete (' + done + ' of ' + all.length + ' tasks)';
  $('#done').hidden = pct < 100;
}
$('#days').addEventListener('change', e => {
  const c = e.target; if (!c.dataset.id) return;
  const day = S.plan.find(d => d.tasks.some(t => t.id == c.dataset.id));
  day.tasks.find(t => t.id == c.dataset.id).done = c.checked;
  c.closest('li').classList.toggle('checked', c.checked);
  c.closest('.day').classList.toggle('complete', day.tasks.every(t => t.done));
  save(); updateProgress();
});

/* ---------- Actions ---------- */
$('#copyBtn').addEventListener('click', async () => {
  const txt = S.name + ' (exam ' + fmtD(S.date) + ')\n\n' + S.plan.map(d => fmtD(d.date) + (d.revision ? ' (revision)' : '') + '\n' +
    d.tasks.map(t => `  [${t.done ? 'x' : ' '}] ${t.text} (${fmtH(t.q)})`).join('\n')).join('\n\n');
  try { await navigator.clipboard.writeText(txt); toast('Plan copied to clipboard.'); }
  catch (e) { toast('Copy is blocked in this browser. Use Print instead.'); }
});
$('#printBtn').addEventListener('click', () => window.print());
$('#resetBtn').addEventListener('click', () => {
  if (!confirm('Delete your plan and topics? This cannot be undone.')) return;
  S = blank(); try { localStorage.removeItem(KEY); } catch (e) {} show('landing'); toast('Plan deleted.');
});
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) show(g.dataset.go); });
$('#startBtn').addEventListener('click', () => show('setup'));
$('#resumeBtn').addEventListener('click', () => show('plan'));
$('#resumeBtn').hidden = !S.plan;
