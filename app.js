/* ─────────────────────────────────────────
   One Step — personal health log
   Plain HTML/CSS/JS. Data stays on the device (localStorage).

   Built on self-tracking research:
   • Logging often beats logging in detail → one-tap logs, hand portions, a treats count.
   • Guilt makes people quit → no streaks, just "days logged" per week.
   • Patterns shown as simple before/after comparisons, not statistics.
   ───────────────────────────────────────── */
'use strict';

/* ===== Helpers ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
const iso = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
var DAY_START = 0; // hours after midnight when a new day begins (Settings)
const today = () => iso(new Date(Date.now() - DAY_START * 3600e3));
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const nowTime = () => new Date().toTimeString().slice(0, 5);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const r1 = (n) => Math.round(n * 10) / 10;
const fmt = (n) => (n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString());
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
var DATE_STYLE = 'us', TIME_STYLE = '12';
const pretty = (d, o = { weekday: 'long', month: 'short', day: 'numeric' }) => {
  const opts = { ...o };
  if (DATE_STYLE === 'num' && opts.day && opts.month) opts.month = 'numeric';
  return new Date(d + 'T12:00:00').toLocaleDateString(DATE_STYLE === 'intl' ? 'en-GB' : 'en-US', opts);
};
const fmtTime = (hm) => {
  if (!hm || TIME_STYLE === '24') return hm || '';
  const [h, m] = hm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v));
const half = (n) => Math.round(n * 2) / 2;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/* ===== Solid icons ===== */
const ICONS = {
  move: '<svg viewBox="0 0 24 24"><circle cx="15.5" cy="3.8" r="2.6"/><path d="M9.6 6.9 5.3 8.6a1.4 1.4 0 0 0-.8.8L3.3 12.6l2.5 1 1-2.5 2.1-.8-1.9 6.1-3.8 4.7 2.1 1.7 4.2-5.2 2.4 2.3V24h2.7v-5.6l-2.5-2.7.8-3.1 1.1 1.8c.3.4.7.6 1.2.6H20V12.3h-3.1L14.6 8.5a2.7 2.7 0 0 0-2.4-1.3c-.9 0-1.8-.1-2.6-.3z"/></svg>',
  meal: '<svg viewBox="0 0 24 24"><path d="M2 11.5h20c0 5.5-4.5 10-10 10s-10-4.5-10-10z"/><path d="M7 2.5c1.2 1.3 1.2 2.7 0 4s-1.2 2.7 0 4M12 1.5c1.2 1.3 1.2 2.7 0 4s-1.2 2.7 0 4M17 2.5c1.2 1.3 1.2 2.7 0 4s-1.2 2.7 0 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  drink: '<svg viewBox="0 0 24 24"><path d="M4.5 2h15l-1.8 19.2A2 2 0 0 1 15.7 23H8.3a2 2 0 0 1-2-1.8z"/></svg>',
  feel: '<svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21zM8.5 7.5a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zm7 0a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zM7 13.5h10a5 5 0 0 1-10 0z"/></svg>',
  recover: '<svg viewBox="0 0 24 24"><path d="M12 1.5s7.5 8 7.5 13.2a7.5 7.5 0 0 1-15 0C4.5 9.5 12 1.5 12 1.5z"/></svg>',
  steps: '<svg viewBox="0 0 24 24"><path d="M2 22v-6h6v-6h6V4h8v18z"/></svg>',
  workout: '<svg viewBox="0 0 24 24"><path d="M4 7h3v10H4zM1 9.5h2.5v5H1zM17 7h3v10h-3zM20.5 9.5H23v5h-2.5zM7.5 10.5h9v3h-9z"/></svg>',
  scale: '<svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4zm6 3.5A6.5 6.5 0 0 0 5.5 12h4.1l3.3-3.6 1.3 1.2-2.2 2.4h6.5A6.5 6.5 0 0 0 12 5.5z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5.5"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M21.5 14.6A9.8 9.8 0 1 1 9.4 2.5a7.6 7.6 0 0 0 12.1 12.1z"/></svg>',
};
const CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>';

/* ===== Reference tables ===== */
// One portion = your own hand. Rough averages — good enough without knowing the food.
const PORTIONS = {
  protein: { name: 'Protein',     unit: 'palm',        hint: 'meat, eggs, beans', p: 22,  c: 2,   f: 4.5, fib: 0 },
  carb:    { name: 'Carbs',       unit: 'cupped hand', hint: 'rice, bread, pasta', p: 3,  c: 25,  f: 1,   fib: 2 },
  veg:     { name: 'Veggies',     unit: 'fist',        hint: 'veggies or fruit',  p: 1.5, c: 7,   f: 0.2, fib: 2.5 },
  fat:     { name: 'Fats',        unit: 'thumb',       hint: 'oil, nuts, cheese', p: 1.5, c: 1.5, f: 9,   fib: 0.5 },
  treat:   { name: 'Treats',      unit: 'handful',     hint: 'candy, chips, fries', p: 2, c: 25,  f: 10,  fib: 0.5 },
};
// Drinks, per 100 ml. hyd = counts toward water goal.
const DRINKS = {
  water:   { name: 'Water',    kcal: 0,  p: 0,   c: 0,  f: 0,   hyd: 1 },
  coffee:  { name: 'Coffee/tea', kcal: 2, p: 0.2, c: 0, f: 0,   hyd: 1 },
  milk:    { name: 'Milk',     kcal: 50, p: 3.4, c: 5,  f: 2,   hyd: 1 },
  juice:   { name: 'Soda/juice', kcal: 44, p: 0,  c: 11, f: 0,  hyd: 1 },
  sports:  { name: 'Sports drink', kcal: 24, p: 0, c: 6, f: 0,  hyd: 1 },
  shake:   { name: 'Shake',    kcal: 62, p: 8,   c: 4,  f: 1.5, hyd: 1 },
  alcohol: { name: 'Alcohol',  kcal: 65, p: 0,   c: 3,  f: 0,   hyd: 0 },
};
const ACTIVITIES = {
  walk:     { name: 'Walk',    met: 3.5 },
  run:      { name: 'Run',     met: 9.5 },
  workout:  { name: 'Workout', met: 5 },
  sport:    { name: 'Sports',  met: 7 },
  cycle:    { name: 'Bike',    met: 7 },
  mobility: { name: 'Stretch', met: 2.5 },
  exercise: { name: 'Other',   met: 6 },
};
const EFFORT = { 1: { name: 'Easy', hint: 'can sing', k: 0.8 }, 2: { name: 'Medium', hint: 'can talk', k: 1 }, 3: { name: 'Hard', hint: "can't talk", k: 1.25 } };
const FEEL = {
  energy:   ['Dead', 'Low', 'Okay', 'Good', 'Great'],
  mood:     ['Awful', 'Down', 'Okay', 'Good', 'Great'],
  soreness: ['None', 'A bit', 'Some', 'Sore', 'Very'],
};
const KIND_SHEET = { activity: 'move', food: 'meal', drink: 'drink', checkin: 'feel', compress: 'recover', steps: 'steps', workout: 'workout' };

const METRICS = {
  activeMin:   { l: 'Move time',  u: 'min' },
  steps:       { l: 'Steps',      u: '' },
  kcal:        { l: 'Calories',   u: 'cal', fuel: 1 },
  protein:     { l: 'Protein',    u: 'g',   fuel: 1 },
  produce:     { l: 'Veggies',    u: '',    fuel: 1 },
  treats:      { l: 'Treats',     u: '',    fuel: 1 },
  water:       { l: 'Drinks',     u: 'vol', drink: 1 },
  alcohol:     { l: 'Alcohol',    u: 'vol', drink: 1 },
  compressMin: { l: 'Ice/heat',   u: 'min' },
  sleep:       { l: 'Sleep',      u: 'hrs' },
  energy:      { l: 'Energy',     u: '/5' },
  mood:        { l: 'Mood',       u: '/5' },
  soreness:    { l: 'Soreness',   u: '/5' },
  weight:      { l: 'Weight',     u: 'wt' },
};

/* ===== State ===== */
const KEY = 'nays-health.v1';
const DEFAULT_PROFILE = { units: 'imperial', sex: 'female', age: 30, weightKg: 70, heightCm: 170, activity: 1.55, goal: 'maintain', meals: 3 };
const DEFAULT_STEPS = [
  { id: 'move',    type: 'auto', metric: 'activeMin', target: 30,   on: true },
  { id: 'water',   type: 'auto', metric: 'water',     target: 1920, on: true },
  { id: 'produce', type: 'auto', metric: 'produce',   target: 5,    on: true },
  { id: 'sleep',   type: 'auto', metric: 'sleep',     target: 7,    on: true },
  { id: 'checkin', type: 'auto', metric: 'checkin',   target: 1,    on: true },
  { id: 'protein', type: 'auto', metric: 'protein',   target: null, on: false },
  { id: 'steps',   type: 'auto', metric: 'steps',     target: 8000, on: false },
  { id: 'treats',  type: 'auto', metric: 'treats',    target: 1,    on: false },
];
const DEFAULT_SETTINGS = { accent: 'orange', text: 'normal', time: '12', date: 'us', dayStart: 0, start: 'today' };
const fresh = () => ({ v: 3, name: "Nay's Health", theme: 'auto', folds: {}, settings: { ...DEFAULT_SETTINGS }, lastBackup: null, profile: { ...DEFAULT_PROFILE }, steps: DEFAULT_STEPS.map((s) => ({ ...s })), done: {}, entries: [] });
function migrate(s) {
  const f = fresh();
  const steps = Array.isArray(s.steps) ? s.steps : f.steps;
  for (const d of DEFAULT_STEPS) if (!steps.some((x) => x.id === d.id)) steps.push({ ...d, on: false });
  return { v: 3, name: typeof s.name === 'string' ? s.name : f.name, theme: ['auto', 'light', 'dark'].includes(s.theme) ? s.theme : 'auto',
    profile: { ...f.profile, ...s.profile }, steps, done: s.done || {}, folds: s.folds || {},
    settings: { ...DEFAULT_SETTINGS, ...s.settings }, lastBackup: s.lastBackup || null, entries: s.entries };
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.entries)) return migrate(s); } catch (_) {}
  return fresh();
}
let state = load();
DAY_START = state.settings.dayStart; DATE_STYLE = state.settings.date; TIME_STYLE = state.settings.time;
let day = today();
let slide = 0; // -1 / +1 = which way the day strip just moved
let byDate = new Map();
let view = 'today';

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { toast("Couldn't save"); }
  render();
}
// Every change goes through commit() so it can be undone.
function commit(change, message) {
  const before = JSON.stringify(state);
  change();
  save();
  toast(message, () => { state = migrate(JSON.parse(before)); save(); toast('Undone'); });
}

/* ===== Theme ===== */
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const isDark = () => state.theme === 'dark' || (state.theme === 'auto' && darkQuery.matches);
function applyTheme() {
  const root = document.documentElement;
  if (state.theme === 'auto') delete root.dataset.theme; else root.dataset.theme = state.theme;
  $('#theme-color').setAttribute('content', isDark() ? '#000000' : '#F2F2F2');
  $('#theme-btn').innerHTML = isDark() ? ICONS.sun : ICONS.moon;
}
darkQuery.addEventListener?.('change', () => { applyTheme(); render(); });

/* ===== Units ===== */
const imp = () => state.profile.units === 'imperial';
const wOut = (kg) => (imp() ? kg / 0.453592 : kg);
const wIn = (v) => (imp() ? v * 0.453592 : v);
const wUnit = () => (imp() ? 'lb' : 'kg');
const vOut = (ml) => (imp() ? ml / 29.5735 : ml);
const vIn = (v) => (imp() ? v * 29.5735 : v);
const vUnit = () => (imp() ? 'oz' : 'ml');
const dOut = (km) => (imp() ? km / 1.60934 : km);
const dIn = (v) => (imp() ? v * 1.60934 : v);
const dUnit = () => (imp() ? 'mi' : 'km');
const CUP = 240;
const fluid = (ml) => (imp() ? `${r1(ml / CUP)} cups` : `${r1(ml / 1000)} L`);
const fluidN = (ml) => (imp() ? r1(ml / CUP) : r1(ml / 1000));
const fluidU = () => (imp() ? 'cups' : 'L');
const unitOf = (k) => { const u = METRICS[k].u; return u === 'vol' ? fluidU() : u === 'wt' ? wUnit() : u; };
const shown = (k, v) => (v == null ? null : METRICS[k].u === 'vol' ? fluidN(v) : METRICS[k].u === 'wt' ? r1(wOut(v)) : v);
const sizes = () => imp()
  ? [[240, 'Cup', '8 oz'], [355, 'Can', '12 oz'], [500, 'Bottle', '17 oz'], [946, 'Big', '32 oz']]
  : [[250, 'Glass', '250 ml'], [330, 'Can', '330 ml'], [500, 'Bottle', '500 ml'], [1000, 'Big', '1 L']];

/* ===== Calculations ===== */
function foodMacros(e) {
  const n = e.portions || {};
  let p = 0, c = 0, f = 0, fib = 0;
  for (const k in PORTIONS) { const q = n[k] || 0; p += PORTIONS[k].p * q; c += PORTIONS[k].c * q; f += PORTIONS[k].f * q; fib += PORTIONS[k].fib * q; }
  if (e.exact) {
    p = e.exact.p ?? p; c = e.exact.c ?? c; f = e.exact.f ?? f;
    return { kcal: e.exact.kcal ?? p * 4 + c * 4 + f * 9, p, c, f, fib, produce: n.veg || 0, treats: n.treat || 0 };
  }
  return { kcal: p * 4 + c * 4 + f * 9, p, c, f, fib, produce: n.veg || 0, treats: n.treat || 0 };
}
function drinkMacros(e) {
  const d = DRINKS[e.type] || DRINKS.water, k = e.ml / 100;
  return { kcal: d.kcal * k, p: d.p * k, c: d.c * k, f: d.f * k, hyd: d.hyd ? e.ml : 0 };
}
const activityBurn = (e) => (ACTIVITIES[e.type] || ACTIVITIES.exercise).met * state.profile.weightKg * (e.minutes / 60) * (EFFORT[e.intensity || 2]?.k || 1);

// Mifflin-St Jeor → daily needs
function targets(p = state.profile) {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const tdee = bmr * Number(p.activity);
  const kcal = tdee * (1 + ({ lose: -0.15, maintain: 0, gain: 0.1 }[p.goal] || 0));
  const protein = p.weightKg * ({ lose: 2.0, maintain: 1.6, gain: 1.8 }[p.goal] || 1.6);
  const fat = Math.max((kcal * 0.28) / 9, p.weightKg * 0.6);
  const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  return { bmr, tdee, kcal, protein, fat, carbs, fiber: (kcal / 1000) * 14, water: p.weightKg * 35 };
}
function handPlan(t = targets(), meals = state.profile.meals || 3) {
  const palms = t.protein / PORTIONS.protein.p;
  const fists = Math.max(5, t.fiber / 3);
  const cupped = Math.max(0, (t.carbs - fists * PORTIONS.veg.c - palms * PORTIONS.protein.c) / PORTIONS.carb.c);
  const thumbs = Math.max(0, (t.fat - palms * PORTIONS.protein.f - cupped * PORTIONS.carb.f) / PORTIONS.fat.f);
  return { protein: palms / meals, veg: fists / meals, carb: cupped / meals, fat: thumbs / meals };
}
function micros(p = state.profile) {
  const m = p.sex === 'male', a = p.age;
  return [
    ['Calcium', `${a > 70 || (!m && a > 50) ? '1,200' : a < 19 ? '1,300' : '1,000'} mg`, 'milk, yogurt, cheese'],
    ['Iron', `${a < 19 ? (m ? 11 : 15) : !m && a <= 50 ? 18 : 8} mg`, 'meat, beans, cereal'],
    ['Potassium', `${m ? '3,400' : '2,600'} mg`, 'potatoes, bananas'],
    ['Magnesium', `${m ? (a > 30 ? 420 : 400) : a > 30 ? 320 : 310} mg`, 'nuts, seeds, beans'],
    ['Zinc', `${m ? 11 : a < 19 ? 9 : 8} mg`, 'meat, seeds, beans'],
    ['Vitamin D', `${a > 70 ? 20 : 15} µg`, 'sun, fish, milk'],
    ['Vitamin C', `${m ? 90 : 75} mg`, 'oranges, berries'],
    ['Vitamin B12', '2.4 µg', 'meat, eggs, milk'],
    ['Folate', '400 µg', 'greens, beans'],
    ['Omega-3', `${m ? 1.6 : 1.1} g`, 'fish, walnuts'],
    ['Salt', 'under 2,300 mg', 'chips, fast food'],
  ];
}

/* ===== Daily totals ===== */
function indexEntries() {
  byDate = new Map();
  for (const e of state.entries) { if (!byDate.has(e.date)) byDate.set(e.date, []); byDate.get(e.date).push(e); }
}
function dayRaw(date) {
  const es = byDate.get(date) || [];
  const d = { any: es.length > 0, food: false, drink: false, checkin: false, activeMin: 0, burn: 0, sessions: 0, steps: null,
    kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, meals: 0, produce: 0, treats: 0, water: 0, alcohol: 0, drinks: 0,
    compressMin: 0, sleep: null, energy: null, mood: null, soreness: null, weight: null };
  for (const e of es) {
    if (e.kind === 'activity') { d.activeMin += e.minutes; d.sessions++; d.burn += activityBurn(e); }
    else if (e.kind === 'food') { const m = foodMacros(e); d.food = true; d.meals++; d.kcal += m.kcal; d.protein += m.p; d.carbs += m.c; d.fat += m.f; d.fiber += m.fib; d.produce += m.produce; d.treats += m.treats; }
    else if (e.kind === 'drink') { const m = drinkMacros(e); d.drink = true; d.drinks++; d.kcal += m.kcal; d.protein += m.p; d.carbs += m.c; d.fat += m.f; d.water += m.hyd; if (e.type === 'alcohol') d.alcohol += e.ml; }
    else if (e.kind === 'workout') { const w = workoutStats(e); d.activeMin += Math.round(w.min); d.sessions++; d.burn += w.kcal; }
    else if (e.kind === 'compress') d.compressMin += e.minutes;
    else if (e.kind === 'steps') d.steps = e.count;
    else if (e.kind === 'checkin') { d.checkin = true; for (const k of ['sleep', 'energy', 'mood', 'soreness', 'weight']) if (e[k] != null) d[k] = e[k]; }
  }
  return d;
}
// "Didn't log it" means unknown (null), not zero.
function metricValue(d, k) {
  if (!d.any) return null;
  const m = METRICS[k];
  if (m.fuel && !d.food) return null;
  if (m.drink && !d.drink) return null;
  return d[k];
}
const loggedDays = (dates) => dates.filter((x) => byDate.has(x)).length;

/* ===== Goals (check off each day) ===== */
const AUTO = {
  activeMin: { label: (t) => `Move ${t} min`, cur: (d) => d.activeMin, prog: (c, t) => `${fmt(c)} / ${t} min`, open: 'move', u: 'min' },
  water:     { label: (t) => `Drink ${fluid(t)}`, cur: (d) => d.water, prog: (c, t) => `${fluidN(c)} / ${fluid(t)}`, open: 'drink', u: () => fluidU() },
  produce:   { label: (t) => `Eat ${t} veggies`, cur: (d) => d.produce, prog: (c, t) => `${c} / ${t} fists`, open: 'meal', u: 'fists' },
  sleep:     { label: (t) => `Sleep ${t}+ hrs`, cur: (d) => d.sleep, prog: (c) => (c == null ? 'Add in check-in' : `${c} hrs`), open: 'feel', u: 'hrs' },
  checkin:   { label: () => 'Check in', cur: (d) => (d.checkin ? 1 : 0), prog: (c) => (c ? 'Done' : '10 seconds'), open: 'feel', noBar: 1 },
  protein:   { label: (t) => `Eat ${fmt(t)} g protein`, cur: (d) => d.protein, prog: (c, t) => `${fmt(c)} / ${fmt(t)} g`, open: 'meal', auto: (t) => Math.round(t.protein), u: 'g' },
  steps:     { label: (t) => `Walk ${fmt(t)} steps`, cur: (d) => d.steps, prog: (c) => (c == null ? 'Add from phone' : `${fmt(c)} steps`), open: 'steps', u: 'steps' },
  treats:    { label: (t) => `${plural(t, 'treat')} max`, cur: (d) => d.treats, prog: (c, t, d) => (d.food ? `${c} today` : 'Log a meal first'), open: 'meal', max: 1, noBar: 1, u: 'max' },
};
function stepTarget(s) { const def = AUTO[s.metric]; return s.target ?? (def.auto ? def.auto(targets()) : 1); }
function stepStatus(s, d, date) {
  if (s.type === 'manual') {
    const done = (state.done[date] || []).includes(s.id);
    return { done, label: s.label || 'My goal', prog: done ? 'Done' : 'Tap when done', pct: null };
  }
  const def = AUTO[s.metric], t = stepTarget(s), c = def.cur(d);
  const done = def.max ? d.food && c <= t : c != null && c >= t;
  return { done, label: def.label(t), prog: def.prog(c, t, d), pct: def.noBar || c == null ? null : clamp(c / t, 0, 1), open: def.open };
}

/* ===== Render ===== */
const FOLD_DEFAULT = { freq: true, vitamins: true, iphone: true, data: false, why: true };
const isFolded = (id) => state.folds?.[id] ?? FOLD_DEFAULT[id] ?? false;
function applyFolds() {
  $$('section[data-fold]').forEach((sec) => {
    const id = sec.dataset.fold, head = $('.tile-head', sec);
    let btn = $('.fold', head);
    if (!btn) { btn = document.createElement('button'); btn.className = 'fold'; btn.dataset.fold = id; head.appendChild(btn); }
    const folded = isFolded(id);
    sec.classList.toggle('folded', folded);
    btn.textContent = folded ? '+' : '−';
    btn.setAttribute('aria-expanded', String(!folded));
    btn.setAttribute('aria-label', `${folded ? 'Show' : 'Hide'} ${$('h2', head).textContent}`);
  });
}
function render() {
  applySettings();
  indexEntries();
  const lastWeigh = weighIns().at(-1);
  if (lastWeigh) state.profile.weightKg = lastWeigh.weight; // latest weigh-in is the one true weight
  applyFolds();
  applyTheme();
  $('#hello').textContent = state.name.trim() || 'One Step';
  renderToday();
  renderPatterns();
  renderPlan();
  renderMe();
  renderSettings();
  renderWorkout();
}

/* Day strip: swipe left/right through past days. The day in the middle is the one you're on;
   days fade the further they are from the middle. */
const STRIP_BACK = 180;
let stripTimer = null;
function renderWeek() {
  const wrap = $('#week'), t = today(), first = addDays(t, -STRIP_BACK);
  let strip = $('.days', wrap);
  const fresh = !strip || strip.dataset.first !== first;
  if (fresh) {
    const all = Array.from({ length: STRIP_BACK + 4 }, (_, i) => addDays(first, i));
    wrap.innerHTML = `<div class="days" data-first="${first}">${all.map((d) => `<button class="day" data-day="${d}" ${d > t ? 'disabled' : ''} aria-label="${pretty(d)}"><span class="dow"></span><span class="num">${Number(d.slice(8))}</span><span class="dot"></span></button>`).join('')}</div>`;
    strip = $('.days', wrap);
    sizeStrip();
    strip.addEventListener('scroll', onStripScroll, { passive: true });
  }
  $$('.day', strip).forEach((btn) => {
    const d = btn.dataset.day;
    btn.classList.toggle('on', d === day);
    btn.classList.toggle('today', d === t);
    btn.classList.toggle('logged', byDate.has(d));
    $('.dow', btn).textContent = d === t ? 'Today' : d.slice(8) === '01' ? pretty(d, { month: 'short' }) : pretty(d, { weekday: 'short' });
  });
  centerStrip(day, fresh ? 'instant' : 'smooth');
}
function sizeStrip() {
  const strip = $('#week .days'); if (!strip || !strip.clientWidth) return; // hidden: size it when Today shows
  strip.style.setProperty('--dw', `${strip.clientWidth / 7}px`);
}
function centerStrip(d, behavior = 'smooth') {
  const strip = $('#week .days'), btn = strip && $(`[data-day="${d}"]`, strip);
  if (!btn) return;
  const left = btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2;
  if (Math.abs(strip.scrollLeft - left) > 1) strip.scrollTo({ left, behavior });
  fadeStrip();
}
function fadeStrip() {
  const strip = $('#week .days'); if (!strip) return;
  const mid = strip.scrollLeft + strip.clientWidth / 2, w = strip.clientWidth / 7;
  $$('.day', strip).forEach((btn) => {
    const dist = Math.abs(btn.offsetLeft + btn.offsetWidth / 2 - mid) / w;
    if (dist > 5) { btn.style.opacity = 0; return; }
    btn.style.opacity = Math.max(0.12, 1 - dist * 0.27).toFixed(2);
    btn.style.transform = `scale(${Math.max(0.84, 1 - dist * 0.04).toFixed(3)})`;
  });
}
function onStripScroll() {
  requestAnimationFrame(fadeStrip);
  clearTimeout(stripTimer);
  stripTimer = setTimeout(() => {
    const strip = $('#week .days'), mid = strip.scrollLeft + strip.clientWidth / 2;
    let best = null, bestD = Infinity;
    $$('.day', strip).forEach((btn) => { const dd = Math.abs(btn.offsetLeft + btn.offsetWidth / 2 - mid); if (dd < bestD) { bestD = dd; best = btn; } });
    if (!best) return;
    const d = best.dataset.day;
    if (d > today()) { centerStrip(today()); if (day !== today()) { day = today(); render(); } return; }
    if (d !== day) { day = d; render(); }
  }, 140);
}

function renderToday() {
  renderWeek();
  const d = dayRaw(day), t = targets();
  const statuses = state.steps.filter((s) => s.on).map((s) => ({ s, ...stepStatus(s, d, day) }));
  const done = statuses.filter((x) => x.done).length, total = statuses.length;

  const pct = total ? done / total : 0, C = 2 * Math.PI * 40;
  const last7 = loggedDays(Array.from({ length: 7 }, (_, i) => addDays(today(), -i)));
  const msg = !total ? 'Add a goal.' : done === 0 ? "Let's start!" : done === total ? 'All done! 🔥' : done / total >= 0.5 ? 'Over halfway!' : 'Nice start!';
  const RC = 2 * Math.PI * 44;
  $('#hero').innerHTML = `
    <div class="hero-top">
      <div><h2>${day === today() ? 'Today' : pretty(day, { weekday: 'short', month: 'short', day: 'numeric' })}</h2><p>${msg}</p></div>
      <div class="hero-days"><b>${last7}<small>/7</small></b><span>days logged</span></div>
    </div>
    <div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" style="stroke:var(--line)" stroke-width="7"/>
      <circle cx="50" cy="50" r="44" fill="none" stroke-width="7" stroke-linecap="round" stroke-dasharray="${RC}" stroke-dashoffset="${RC * (1 - pct)}" style="stroke:var(--orange);transition:stroke-dashoffset .7s cubic-bezier(.3,1.3,.5,1)"/></svg>
      <div class="count"><b>${done}<small>/${total}</small></b><span>goals done</span></div></div>`;

  $('#steps').innerHTML = statuses.length ? statuses.map(({ s, done: ok, label, prog, pct: p, open }) => `
    <li><button class="row-btn ${ok ? 'done' : ''}" ${s.type === 'manual' ? `data-toggle="${s.id}"` : `data-open="${open}"`}>
      <span class="lead check">${CHECK}</span>
      <span class="row-txt"><b>${esc(label)}</b><small>${esc(prog)}</small>${p != null && !ok ? `<span class="mini-bar"><i style="width:${p * 100}%"></i></span>` : ''}</span>
      ${s.type === 'manual' ? '' : '<span class="row-end">›</span>'}
    </button></li>`).join('') : '<li class="empty">No goals yet. Tap Edit.</li>';

  const stat = (el, k, v, unit, goal, goalTxt) => {
    const p = goal ? clamp(v / goal, 0, 1) : 0;
    $(el).innerHTML = `<span class="eyebrow">${k}</span><span class="v">${unit === 'fluid' ? fluidN(v) : fmt(v)}<small>${unit === 'fluid' ? fluidU() : unit}</small></span>
      <span class="of">${goalTxt}</span><span class="bar"><i class="${p >= 1 ? 'full' : ''}" style="width:${p * 100}%"></i></span>`;
  };
  stat('#st-food', 'Food', d.kcal, 'cal', t.kcal, `of ${fmt(t.kcal)}`);
  stat('#st-protein', 'Protein', d.protein, 'g', t.protein, `of ${fmt(t.protein)} g`);
  stat('#st-drink', 'Drinks', d.water, 'fluid', t.water, `of ${fluid(t.water)}`);
  stat('#st-move', 'Move', d.activeMin, 'min', 30, `of 30 min`);

  const es = (byDate.get(day) || []).slice().sort(sortEntries);
  $('#log').innerHTML = es.length ? es.map(logLi).join('') : '<li class="empty">Nothing yet. Tap the + on the right.</li>';

  // Nudge the peeking + when nothing is logged today
  $('#rail-toggle').classList.toggle('nudge', day === today() && !es.length);
}

const sortEntries = (a, b) => (a.time || '00:00').localeCompare(b.time || '00:00');
function summary(e) {
  if (e.kind === 'activity') {
    const a = ACTIVITIES[e.type] || { name: e.type };
    return [a.name, `${e.minutes} min · ${EFFORT[e.intensity || 2]?.name.toLowerCase()}${e.km ? ` · ${r1(dOut(e.km))} ${dUnit()}` : ''}`];
  }
  if (e.kind === 'food') { const m = foodMacros(e); return [e.meal || 'Meal', `${fmt(m.kcal)} cal · ${fmt(m.p)} g protein`]; }
  if (e.kind === 'drink') return [(DRINKS[e.type] || { name: e.type }).name, imp() ? `${fmt(vOut(e.ml))} oz` : `${fmt(e.ml)} ml`];
  if (e.kind === 'compress') return [e.temp === 'hot' ? 'Heat' : 'Ice', `${e.minutes} min${e.area ? ' · ' + e.area : ''}`];
  if (e.kind === 'steps') return ['Steps', fmt(e.count)];
  if (e.kind === 'workout') { const w = workoutStats(e); return [e.name || 'Workout', `${plural(w.count, 'exercise')} · ${fmt(w.min)} min · ${fmt(w.kcal)} cal`]; }
  if (e.kind === 'checkin') {
    const bits = [];
    if (e.sleep != null) bits.push(`${e.sleep} hrs sleep`);
    if (e.energy != null) bits.push(`energy ${FEEL.energy[e.energy - 1].toLowerCase()}`);
    if (e.mood != null) bits.push(`mood ${FEEL.mood[e.mood - 1].toLowerCase()}`);
    if (e.weight != null) bits.push(`${r1(wOut(e.weight))} ${wUnit()}`);
    return ['Check-in', bits.join(' · ')];
  }
  return [e.kind, ''];
}
function logLi(e) {
  const k = KIND_SHEET[e.kind] || 'feel', [title, detail] = summary(e);
  return `<li><button class="row-btn" data-edit="${e.id}"><span class="lead ico">${ICONS[k]}</span>
    <span class="row-txt"><b>${esc(title)}</b><small>${esc(detail)}</small></span><span class="row-end">${esc(fmtTime(e.time))}</span></button></li>`;
}

/* --- Trends --- */
const CAUSES = [
  { k: 'sleep',       name: () => 'Sleep 7+ hrs',            lo: 'Less',    ask: 'sleep 7+ hrs',    th: () => 7, lags: [0] },
  { k: 'activeMin',   name: () => 'Move 30+ min',            lo: 'Less',    ask: 'move 30+ min',    th: () => 30, lags: [0, 1] },
  { k: 'steps',       name: (t) => `${fmt(t)}+ steps`,       lo: 'Fewer',   ask: 'walk more',       th: (v) => Math.round(median(v) / 500) * 500, lags: [0, 1] },
  { k: 'water',       name: (t) => `${fluid(t)}+ drinks`,    lo: 'Less',    ask: 'drink more',      th: (v) => Math.round(median(v) / CUP) * CUP, lags: [0] },
  { k: 'produce',     name: (t) => `${t}+ veggies`,          lo: 'Fewer',   ask: 'eat more veggies', th: (v) => Math.max(1, half(median(v))), lags: [0, 1] },
  { k: 'protein',     name: (t) => `${fmt(t)}+ g protein`,   lo: 'Less',    ask: 'eat more protein', th: (v) => Math.round(median(v) / 10) * 10, lags: [0, 1] },
  { k: 'treats',      name: () => 'Treats',                  lo: 'None',    ask: 'eat treats',      any: 1, lags: [0, 1] },
  { k: 'alcohol',     name: () => 'Alcohol',                 lo: 'None',    ask: 'drink alcohol',   any: 1, lags: [0, 1] },
  { k: 'compressMin', name: () => 'Ice/heat',                lo: 'None',    ask: 'use ice/heat',    any: 1, lags: [1] },
];
const OUTCOMES = [
  { k: 'energy', good: 1, up: 'more energy', down: 'less energy' },
  { k: 'mood', good: 1, up: 'better mood', down: 'worse mood' },
  { k: 'soreness', good: -1, up: 'more sore', down: 'less sore' },
  { k: 'sleep', good: 1, up: 'more sleep', down: 'less sleep' },
];
function median(v) { const s = v.filter((x) => x != null).sort((a, b) => a - b); if (!s.length) return 0; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
function rangeDates(n) { const end = today(); return Array.from({ length: n }, (_, i) => addDays(end, i - n + 1)); }
function seriesFor(dates) { const raws = dates.map(dayRaw); return Object.fromEntries(Object.keys(METRICS).map((k) => [k, raws.map((d) => metricValue(d, k))])); }
function compare(S, cause, out, lag) {
  if (cause.k === out.k) return null;
  const xs = S[cause.k], ys = S[out.k], th = cause.any ? 0 : cause.th(xs), hi = [], lo = [];
  for (let i = 0; i + lag < xs.length; i++) {
    const x = xs[i], y = ys[i + lag];
    if (x == null || y == null) continue;
    (cause.any ? x > 0 : x >= th) ? hi.push(y) : lo.push(y);
  }
  if (hi.length < 3 || lo.length < 3) return { short: true, nHi: hi.length, nLo: lo.length };
  const all = hi.concat(lo), m = mean(all), sd = Math.sqrt(mean(all.map((v) => (v - m) ** 2)));
  const a = mean(hi), b = mean(lo);
  return { th, hi: a, lo: b, nHi: hi.length, nLo: lo.length, effect: sd ? (a - b) / sd : 0, good: (a - b) * out.good > 0 };
}
// Sleep logged on day D = the night before D, so "sleep after X" uses the next day's entry.
function findingHTML(cause, out, lag, r, badge) {
  const when = out.k === 'sleep' ? ' that night' : lag ? ' next day' : '';
  const head = `${esc(cause.name(r.th))} → ${r.hi >= r.lo ? out.up : out.down}${when}`;
  const max = out.k === 'sleep' ? Math.max(r.hi, r.lo, 9) : 5;
  const unit = out.k === 'sleep' ? ' hrs' : '/5';
  const b = badge || (r.good ? '<span class="badge good">Helps</span>' : '<span class="badge bad">Hurts</span>');
  return `<div class="finding">${b}<p class="head">${head}</p>
    <div class="cmp"><span>${esc(cause.name(r.th))}</span><span class="track"><i class="hi" style="width:${(r.hi / max) * 100}%"></i></span><span class="val">${r1(r.hi)}${unit}</span>
    <span>${cause.lo}</span><span class="track"><i style="width:${(r.lo / max) * 100}%"></i></span><span class="val">${r1(r.lo)}${unit}</span></div>
    <p class="caption">${r.nHi + r.nLo} days</p></div>`;
}
function renderPatterns() {
  const n = Number($('input[name=range]:checked').value), dates = rangeDates(n), S = seriesFor(dates);

  const weeks = [3, 2, 1, 0].map((w) => Array.from({ length: 7 }, (_, i) => addDays(today(), -(w * 7) - i)));
  const RC = 2 * Math.PI * 40;
  $('#weeks').innerHTML = weeks.map((ws, i) => {
    const c = loggedDays(ws), met = c >= 6;
    return `<div class="wk ${met ? 'met' : ''}"><div class="r"><svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" style="stroke:var(--soft)" stroke-width="12"/>
        <circle cx="50" cy="50" r="40" fill="none" style="stroke:${met ? 'var(--orange)' : 'var(--ink)'}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${RC}" stroke-dashoffset="${c ? RC * (1 - c / 7) : RC}"/></svg>
      <span>${c}<small>/7</small></span></div><span class="lbl">${i === 3 ? 'This week' : `${3 - i} wk ago`}</span></div>`;
  }).join('');

  const found = [];
  for (const c of CAUSES) for (const o of OUTCOMES) {
    let best = null;
    for (const lag of c.lags) {
      if (o.k === 'sleep' && lag === 0) continue;
      const r = compare(S, c, o, o.k === 'sleep' ? 1 : lag);
      if (r && !r.short && (!best || Math.abs(r.effect) > Math.abs(best.r.effect))) best = { c, o, lag, r };
    }
    if (best && Math.abs(best.r.effect) >= 0.35 && Math.abs(best.r.hi - best.r.lo) >= 0.3) found.push(best);
  }
  found.sort((a, b) => Math.abs(b.r.effect) - Math.abs(a.r.effect));
  // Top finds become one-tap questions inside "Ask a question"
  const top = found.slice(0, 4);
  if (!askPicked && top[0]) setAsk(top[0].c.k, top[0].o.k, top[0].lag);
  const cur = `${$('#ask-cause').value}|${$('#ask-out').value}|${$('#ask-out').value === 'sleep' ? 1 : $('input[name=asklag]:checked').value}`;
  const logged = loggedDays(dates);
  $('#ask-top').innerHTML = top.length
    ? `<div class="eyebrow">Top finds</div><div class="finds">${top.map((f) => {
        const key = `${f.c.k}|${f.o.k}|${f.o.k === 'sleep' ? 1 : f.lag}`;
        return `<button class="${key === cur ? 'on' : ''}" data-ask="${f.c.k}|${f.o.k}|${f.lag}">${esc(f.c.name(f.r.th))} → ${f.r.hi >= f.r.lo ? f.o.up : f.o.down}</button>`;
      }).join('')}</div><div class="eyebrow" style="margin-top:var(--s4)">Or pick your own</div>`
    : `<p class="empty">${logged < 7 ? `${plural(logged, 'day')} logged. Check in for a week to see top finds.` : 'No clear finds yet. Pick your own below.'}</p>`;

  renderTryThis(rangeDates(30).length ? seriesFor(rangeDates(30)) : S);
  renderAsk(S);
  renderChart(dates, S);
  renderFreq(dates);
}
let askPicked = false;
function setAsk(cause, out, lag) {
  $('#ask-cause').value = cause; $('#ask-out').value = out;
  const r = $(`input[name=asklag][value="${Number(lag) ? 1 : 0}"]`); if (r) r.checked = true;
}
function renderAsk(S) {
  const c = CAUSES.find((x) => x.k === $('#ask-cause').value) || CAUSES[0];
  const o = OUTCOMES.find((x) => x.k === $('#ask-out').value) || OUTCOMES[0];
  const lag = o.k === 'sleep' ? 1 : Number($('input[name=asklag]:checked').value);
  const r = compare(S, c, o, lag);
  $('#ask-result').innerHTML = !r ? '<p class="empty">Pick two different things.</p>'
    : r.short ? `<p class="empty">Need 3+ days each way. You have ${r.nHi} and ${r.nLo}.</p>`
    : findingHTML(c, o, lag, r, Math.abs(r.effect) < 0.35 ? '<span class="badge meh">No big change</span>' : null);
}
function renderChart(dates, S) {
  const k = $('#chart-metric').value, vals = S[k].map((v) => shown(k, v));
  const W = 300, H = 160, top = 10, bottom = 22, n = vals.length, bw = W / n;
  const nums = vals.filter((v) => v != null);
  const css = getComputedStyle(document.documentElement), orange = css.getPropertyValue('--orange').trim(), faint = css.getPropertyValue('--faint').trim(), ink = css.getPropertyValue('--ink').trim(), line = css.getPropertyValue('--line').trim(), muted = css.getPropertyValue('--muted').trim();
  if (!nums.length) { $('#chart').innerHTML = `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="13" fill="${muted}">No data yet</text>`; $('#chart-note').textContent = ''; return; }
  const max = Math.max(...nums) || 1, avg = mean(nums), y = (v) => top + (1 - v / max) * (H - top - bottom);
  const bars = vals.map((v, i) => v == null ? '' : `<rect x="${i * bw + bw * 0.16}" y="${y(v)}" width="${bw * 0.68}" height="${Math.max(1, H - bottom - y(v))}" rx="${Math.min(4, bw * 0.3)}" fill="${dates[i] === today() ? orange : faint}"/>`).join('');
  const lbl = (i, a) => `<text x="${a === 'end' ? W : a === 'middle' ? i * bw + bw / 2 : 0}" y="${H - 6}" font-size="11" fill="${muted}" text-anchor="${a}" font-family="Arial">${pretty(dates[i], { month: 'short', day: 'numeric' })}</text>`;
  $('#chart').innerHTML = `<line x1="0" x2="${W}" y1="${H - bottom}" y2="${H - bottom}" stroke="${line}"/>${bars}
    <line x1="0" x2="${W}" y1="${y(avg)}" y2="${y(avg)}" stroke="${ink}" stroke-dasharray="4 4" stroke-width="1.5"/>
    ${lbl(0, 'start')}${lbl(Math.floor(n / 2), 'middle')}${lbl(n - 1, 'end')}`;
  $('#chart-note').textContent = `Dashed line = your average (${r1(avg)} ${unitOf(k)})`;
}
function renderFreq(dates) {
  const set = new Set(dates), weeks = dates.length / 7, es = state.entries.filter((e) => set.has(e.date)), rows = [];
  for (const [k, a] of Object.entries(ACTIVITIES)) {
    const xs = es.filter((e) => e.kind === 'activity' && e.type === k);
    if (xs.length) rows.push([a.name, `${r1(xs.length / weeks)}× / wk`, `${fmt(mean(xs.map((e) => e.minutes)))} min each`]);
  }
  const days = dates.filter((x) => byDate.has(x)).map(dayRaw), food = days.filter((x) => x.food), drink = days.filter((x) => x.drink);
  const avg = (a, k) => mean(a.map((x) => x[k]));
  if (food.length) rows.push(['Meals', `${r1(avg(food, 'meals'))} / day`, `${fmt(avg(food, 'kcal'))} cal a day`]);
  if (food.length) rows.push(['Treats', `${r1(avg(food, 'treats'))} / day`, '']);
  if (drink.length) rows.push(['Drinks', `${fluid(avg(drink, 'water'))} / day`, '']);
  const alc = drink.filter((x) => x.alcohol > 0).length;
  if (alc) rows.push(['Alcohol', `${r1(alc / weeks)} days / wk`, '']);
  const comp = es.filter((e) => e.kind === 'compress');
  if (comp.length) rows.push(['Ice/heat', `${r1(comp.length / weeks)}× / wk`, '']);
  const sl = days.filter((x) => x.sleep != null);
  if (sl.length) rows.push(['Sleep', `${r1(avg(sl, 'sleep'))} hrs`, '']);
  $('#freq').innerHTML = rows.length ? rows.map(([a, b, c]) => `<li><span>${a}${c ? `<small>${c}</small>` : ''}</span><b>${b}</b></li>`).join('') : '<li class="empty">Nothing logged yet.</li>';
}


/* --- "Try this": 1–3 recovery tips based on the last 3 check-ins ---
   Each tip can point at a cause in your own data. If your logs show it helps you,
   the tip gets a "Works for you" tag and moves to the top. */
const TIPS = {
  sore: { q: 'Feeling sore?', tips: [
    { t: 'Ice or heat', p: 'Ice for swelling. Heat for tight muscles. 15 minutes.', open: 'recover', btn: 'Log ice/heat', cause: 'compressMin', dir: 'do', lag: 1, out: 'soreness' },
    { t: 'Go easy today', p: 'Walk or stretch for 20 minutes instead of a hard workout.', open: 'move', btn: 'Log a walk', cause: 'activeMin', dir: 'avoid', lag: 1, out: 'soreness' },
    { t: 'Eat protein', p: 'A palm of protein at each meal helps muscles heal.', open: 'meal', btn: 'Log a meal', cause: 'protein', dir: 'do', lag: 1, out: 'soreness' },
    { t: 'Sleep 8 hours', p: 'Your muscles fix themselves while you sleep.', cause: 'sleep', dir: 'do', lag: 0, out: 'soreness' },
  ] },
  tired: { q: 'Feeling tired?', tips: [
    { t: 'Drink water', p: 'Tired can mean thirsty. Have a big glass now.', quick: 'water', btn: '+1 cup', cause: 'water', dir: 'do', lag: 0, out: 'energy' },
    { t: 'Go to bed earlier', p: 'Try 30 minutes earlier tonight.', cause: 'sleep', dir: 'do', lag: 0, out: 'energy' },
    { t: 'Take a quick walk', p: 'Ten minutes outside wakes you up.', open: 'move', btn: 'Log a walk', cause: 'activeMin', dir: 'do', lag: 0, out: 'energy' },
    { t: 'Swap a treat', p: 'Have fruit instead of candy or chips.', cause: 'treats', dir: 'avoid', lag: 0, out: 'energy' },
    { t: 'Skip alcohol tonight', p: 'It makes the next day harder.', cause: 'alcohol', dir: 'avoid', lag: 1, out: 'energy' },
  ] },
  mood: { q: 'Feeling down?', tips: [
    { t: 'Get outside', p: 'A short walk in daylight can lift your mood.', open: 'move', btn: 'Log a walk', cause: 'activeMin', dir: 'do', lag: 0, out: 'mood' },
    { t: 'Talk to someone', p: 'Text or call a friend. You don’t have to fix anything.' },
    { t: 'Eat some color', p: 'Add a fist of veggies or fruit to your next meal.', open: 'meal', btn: 'Log a meal', cause: 'produce', dir: 'do', lag: 0, out: 'mood' },
    { t: 'Sleep more', p: 'Low sleep makes everything feel harder.', cause: 'sleep', dir: 'do', lag: 0, out: 'mood' },
  ] },
  sleep: { q: 'Short on sleep?', tips: [
    { t: 'Screens off early', p: 'Put your phone away 30 minutes before bed.' },
    { t: 'Skip alcohol', p: 'It makes sleep lighter.', cause: 'alcohol', dir: 'avoid', lag: 1, out: 'sleep' },
    { t: 'No caffeine after 2 pm', p: 'Coffee, tea, soda, and energy drinks count.' },
    { t: 'Move in the day', p: 'Being active helps you fall asleep.', open: 'move', btn: 'Log activity', cause: 'activeMin', dir: 'do', lag: 1, out: 'sleep' },
  ] },
  good: { q: "You're doing great!", tips: [
    { t: 'Keep checking in', p: 'Daily check-ins make these tips smarter.', open: 'feel', btn: 'Check in' },
    { t: 'Drink a glass of water', p: 'Easy win. Do it now.', quick: 'water', btn: '+1 cup' },
    { t: 'Try a new goal', p: 'Pick one small thing to add.', go: 'me', to: 'goals', btn: 'Edit goals' },
  ] },
};
function recentFeel() {
  const cis = [0, 1, 2].map((i) => dayRaw(addDays(today(), -i))).filter((d) => d.checkin);
  const avg = (k) => { const v = cis.map((d) => d[k]).filter((x) => x != null); return v.length ? mean(v) : null; };
  return { n: cis.length, energy: avg('energy'), mood: avg('mood'), soreness: avg('soreness'), sleep: avg('sleep') };
}
function renderTryThis(S) {
  const f = recentFeel();
  if (!f.n) {
    $('#try-title').textContent = 'How do you feel?';
    $('#try-state').innerHTML = '';
    $('#try-list').innerHTML = `<li class="tip"><span class="num">1</span><span class="tx"><b>Check in first</b><small>Then you’ll get tips made for you.</small></span><button class="do" data-open="feel">Check in</button></li>`;
    $('#try-foot').classList.add('hidden');
    return;
  }
  const issues = [];
  if (f.soreness != null && f.soreness >= 3) issues.push(['sore', f.soreness - 2.5]);
  if (f.energy != null && f.energy <= 2.5) issues.push(['tired', 3.5 - f.energy]);
  if (f.mood != null && f.mood <= 2.5) issues.push(['mood', 3.5 - f.mood]);
  if (f.sleep != null && f.sleep < 7) issues.push(['sleep', (7 - f.sleep) / 1.5]);
  issues.sort((a, b) => b[1] - a[1]);
  const keys = issues.length ? issues.map((x) => x[0]) : ['good'];

  const pool = [], seen = new Set();
  keys.forEach((k, rank) => TIPS[k].tips.forEach((tip, i) => {
    if (seen.has(tip.t)) return; seen.add(tip.t);
    let proof = false;
    if (tip.cause) {
      const c = CAUSES.find((x) => x.k === tip.cause), o = OUTCOMES.find((x) => x.k === tip.out);
      const r = c && o ? compare(S, c, o, tip.out === 'sleep' ? 1 : tip.lag) : null;
      if (r && !r.short && Math.abs(r.effect) >= 0.35) proof = tip.dir === 'do' ? r.good : !r.good;
    }
    pool.push({ ...tip, proof, score: (proof ? 0 : 10) + rank * 3 + i });
  }));
  pool.sort((a, b) => a.score - b.score);
  const picks = pool.slice(0, keys[0] === 'good' ? 2 : 3);

  const word = (k, v) => FEEL[k][clamp(Math.round(v), 1, 5) - 1].toLowerCase();
  const chip = (label, v, bad, txt) => (v == null ? '' : `<span class="${bad ? 'flag' : ''}">${label} <b>${txt}</b></span>`);
  $('#try-title').textContent = TIPS[keys[0]].q;
  $('#try-state').innerHTML =
    chip('Energy', f.energy, keys.includes('tired'), f.energy != null ? word('energy', f.energy) : '') +
    chip('Mood', f.mood, keys.includes('mood'), f.mood != null ? word('mood', f.mood) : '') +
    chip('Body', f.soreness, keys.includes('sore'), f.soreness != null ? (f.soreness < 1.5 ? 'fine' : word('soreness', f.soreness)) : '') +
    chip('Sleep', f.sleep, keys.includes('sleep'), f.sleep != null ? `${r1(f.sleep)}h` : '');
  $('#try-list').innerHTML = picks.map((tip, i) => {
    const action = tip.quick ? `data-quick="${tip.quick}"` : tip.open ? `data-open="${tip.open}"` : tip.go ? `data-go="${tip.go}" data-to="${tip.to}"` : '';
    return `<li class="tip"><span class="num">${i + 1}</span>
      <span class="tx"><b>${tip.t}${tip.proof ? ' <em>✓ works for you</em>' : ''}</b><small>${tip.p}</small></span>
      ${action ? `<button class="do" ${action}>${tip.btn}</button>` : '<span></span>'}</li>`;
  }).join('');
  $('#try-foot').classList.toggle('hidden', !keys.includes('sore'));
}

/* --- Weight tracker (Me) --- */
const weighIns = () => state.entries.filter((e) => e.kind === 'checkin' && e.weight != null).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
const signed = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${r1(Math.abs(n))}`;
function setWeight(kg, date = today()) {
  const prev = state.entries.find((e) => e.kind === 'checkin' && e.date === date);
  if (prev) prev.weight = r1(kg);
  else state.entries.push({ id: uid(), date, time: nowTime(), kind: 'checkin', sleep: null, energy: null, mood: null, soreness: null, weight: r1(kg) });
  state.profile.weightKg = r1(kg);
}

/* --- Weight chart: a smooth 7-day trend curve with a soft fill.
   Faint dots = each weigh-in. Drag across it to read any day. --- */
let wtChartKey = '', wtPts = [];
function smoothPath(p) {
  // Monotone cubic curve through the points: smooth, but never overshoots the real values
  if (p.length < 2) return p.length ? `M${p[0][0]},${p[0][1]}` : '';
  const n = p.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((p[i + 1][1] - p[i][1]) / ((p[i + 1][0] - p[i][0]) || 1));
  m.push(d[0]);
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  let path = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (p[i + 1][0] - p[i][0]) / 3;
    path += ` C${(p[i][0] + dx).toFixed(1)},${(p[i][1] + m[i] * dx).toFixed(1)} ${(p[i + 1][0] - dx).toFixed(1)},${(p[i + 1][1] - m[i + 1] * dx).toFixed(1)} ${p[i + 1][0].toFixed(1)},${p[i + 1][1].toFixed(1)}`;
  }
  return path;
}
function drawWeightChart(w, goal) {
  const svg = $('#wt-chart'), css = getComputedStyle(document.documentElement), C = (v) => css.getPropertyValue(v).trim();
  const days = Number($('input[name=wtrange]:checked')?.value || 90);
  const from = days >= 9999 ? (w[0]?.date || today()) : addDays(today(), -(days - 1));
  const pts = w.filter((e) => e.date >= from);
  if (!pts.length) {
    svg.innerHTML = `<text x="150" y="88" text-anchor="middle" font-size="13" font-family="Arial" fill="${C('--muted')}">No weigh-ins in this range</text>`;
    $('#wt-legend').textContent = '';
    wtPts = [];
    return;
  }
  // 7-day trend: average of the weigh-ins in the week up to each day
  const trend = pts.map((e) => {
    const win = w.filter((x) => x.date <= e.date && x.date >= addDays(e.date, -6));
    return { date: e.date, raw: wOut(e.weight), t: wOut(mean(win.map((x) => x.weight))) };
  });
  const W = 300, H = 170, padL = 8, padR = 14, top = 24, bot = 24;
  // Scale to the trend (not single odd weigh-ins) so the curve keeps its shape
  const vals = trend.map((p) => p.t).concat(goal ? [wOut(goal)] : []);
  const span = Math.max(...vals) - Math.min(...vals), padY = Math.max(1, span * 0.18);
  const lo = Math.min(...vals) - padY, hi = Math.max(...vals) + padY;
  const start = pts[0].date > from ? pts[0].date : from; // don't leave empty space before the first weigh-in
  const t0 = new Date(start).getTime(), t1 = Math.max(new Date(today()).getTime(), t0 + 864e5);
  const x = (d) => padL + ((new Date(d).getTime() - t0) / (t1 - t0)) * (W - padL - padR);
  const y = (v) => top + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (H - top - bot);
  const P = trend.map((p) => [x(p.date), y(p.t)]);
  const line = smoothPath(P), base = H - bot;
  const area = `${line} L${P[P.length - 1][0].toFixed(1)},${base} L${P[0][0].toFixed(1)},${base} Z`;
  const last = trend[trend.length - 1], lx = P[P.length - 1][0], ly = P[P.length - 1][1];
  const acc = C('--orange');
  const key = `${days}|${pts.length}|${last.raw}|${goal}|${acc}`;
  const animate = key !== wtChartKey; wtChartKey = key;
  wtPts = trend.map((p, i) => ({ ...p, x: P[i][0], y: P[i][1] }));

  svg.innerHTML = `
    <defs><linearGradient id="wt-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${acc}" stop-opacity=".32"/><stop offset="100%" stop-color="${acc}" stop-opacity="0"/>
    </linearGradient></defs>
    ${goal ? `<line x1="0" x2="${W}" y1="${y(wOut(goal)).toFixed(1)}" y2="${y(wOut(goal)).toFixed(1)}" stroke="${C('--ink')}" stroke-opacity=".35" stroke-dasharray="3 5" stroke-width="1.5" stroke-linecap="round"/>
      <text x="${padL}" y="${(y(wOut(goal)) - 6).toFixed(1)}" font-size="10" font-weight="700" font-family="Arial" fill="${C('--muted')}">goal ${r1(wOut(goal))}</text>` : ''}
    <path class="${animate ? 'wt-area draw' : 'wt-area'}" d="${area}" fill="url(#wt-fill)"/>
    ${trend.map((p) => `<circle cx="${x(p.date).toFixed(1)}" cy="${y(p.raw).toFixed(1)}" r="1.8" fill="${C('--ink')}" fill-opacity=".22"/>`).join('')}
    <path class="${animate ? 'wt-line draw' : 'wt-line'}" d="${line}" pathLength="1" fill="none" stroke="${acc}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle class="wt-halo" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="9" fill="${acc}" fill-opacity=".22"/>
    <circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4.5" fill="${acc}" stroke="${C('--card')}" stroke-width="2"/>
    <g id="wt-scrub" opacity="0">
      <line id="wt-scrub-line" y1="${top - 8}" y2="${base}" stroke="${C('--ink')}" stroke-opacity=".25" stroke-width="1"/>
      <circle id="wt-scrub-dot" r="5" fill="${C('--card')}" stroke="${acc}" stroke-width="2.5"/>
      <text id="wt-scrub-txt" y="${top - 12}" font-size="11" font-weight="900" font-family="Arial" fill="${C('--ink')}"></text>
    </g>
    <text x="${padL}" y="${H - 6}" font-size="10" font-family="Arial" fill="${C('--muted')}">${pretty(start, { month: 'short', day: 'numeric' })}</text>
    <text x="${W - padR}" y="${H - 6}" font-size="10" font-family="Arial" fill="${C('--muted')}" text-anchor="end">today</text>`;

  const change = last.t - trend[0].t;
  $('#wt-legend').innerHTML = trend.length > 1
    ? `Trend: <b class="o">${signed(change)} ${wUnit()}</b> in this range. Drag the chart to see a day.`
    : 'Add more weigh-ins to see your trend.';
}
function scrubWeight(ev) {
  if (!wtPts.length) return;
  const svg = $('#wt-chart'), r = svg.getBoundingClientRect();
  const px = ((ev.clientX - r.left) / r.width) * 300;
  let best = wtPts[0];
  for (const p of wtPts) if (Math.abs(p.x - px) < Math.abs(best.x - px)) best = p;
  const g = $('#wt-scrub'); if (!g) return;
  g.setAttribute('opacity', '1');
  $('#wt-scrub-line').setAttribute('x1', best.x); $('#wt-scrub-line').setAttribute('x2', best.x);
  $('#wt-scrub-dot').setAttribute('cx', best.x); $('#wt-scrub-dot').setAttribute('cy', best.y);
  const t = $('#wt-scrub-txt');
  t.textContent = `${r1(best.raw)} ${wUnit()} · ${pretty(best.date, { month: 'short', day: 'numeric' })}`;
  t.setAttribute('x', Math.min(296, Math.max(4, best.x)));
  t.setAttribute('text-anchor', best.x < 60 ? 'start' : best.x > 240 ? 'end' : 'middle');
}
function endScrub() { $('#wt-scrub')?.setAttribute('opacity', '0'); }

function renderWeight() {
  const w = weighIns(), u = wUnit(), goal = state.profile.goalWeightKg ?? null;
  $('#wt-input').placeholder = `Today's weight (${u})`;
  $('#wt-goal-label').textContent = `Goal weight (${u})`;
  if (document.activeElement !== $('#wt-goal-input')) $('#wt-goal-input').value = goal ? r1(wOut(goal)) : '';
  const css = getComputedStyle(document.documentElement), C = (n) => css.getPropertyValue(n).trim();

  if (!w.length) {
    $('#wt-top').innerHTML = ['Start', 'Now', 'Change'].map((l) => `<div><span class="eyebrow">${l}</span><div class="n">—</div></div>`).join('');
    $('#wt-goal').innerHTML = '';
    $('#wt-pace').textContent = '';
    $('#wt-chart').innerHTML = `<text x="150" y="88" text-anchor="middle" font-size="13" font-family="Arial" fill="${C('--muted')}">Add your first weight below</text>`;
    $('#wt-legend').innerHTML = '';
    $('#wt-list').innerHTML = '';
    return;
  }
  const start = w[0], now = w[w.length - 1], change = now.weight - start.weight;
  const losing = goal ? goal < start.weight : true;
  $('#wt-top').innerHTML = `
    <div><span class="eyebrow">Start</span><div class="n">${r1(wOut(start.weight))}</div><small class="caption">${pretty(start.date, { month: 'short', day: 'numeric' })}</small></div>
    <div><span class="eyebrow">Now</span><div class="n">${r1(wOut(now.weight))}</div><small class="caption">${u}</small></div>
    <div><span class="eyebrow">Change</span><div class="n ${(losing ? change < 0 : change > 0) ? 'down' : ''}">${signed(wOut(change))}</div><small class="caption">${u}</small></div>`;

  // pace over the last 4 weeks
  const recent = w.filter((e) => e.date >= addDays(today(), -28));
  if (recent.length >= 2) {
    const days = (new Date(recent[recent.length - 1].date) - new Date(recent[0].date)) / 864e5;
    $('#wt-pace').textContent = days >= 6 ? `${signed(wOut((recent[recent.length - 1].weight - recent[0].weight) / (days / 7)))} ${u} / week` : '';
  } else $('#wt-pace').textContent = '';

  if (goal) {
    const total = start.weight - goal, done = start.weight - now.weight;
    const pct = total ? clamp(done / total, 0, 1) : 1, RC = 2 * Math.PI * 40, left = Math.abs(now.weight - goal);
    const reached = (total >= 0 && now.weight <= goal) || (total < 0 && now.weight >= goal);
    $('#wt-goal').innerHTML = `<div class="r"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" style="stroke:var(--soft)" stroke-width="12"/>
      <circle cx="50" cy="50" r="40" fill="none" style="stroke:var(--orange)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${RC}" stroke-dashoffset="${RC * (1 - pct)}"/></svg><span>${Math.round(pct * 100)}%</span></div>
      <div><b>${reached ? 'Goal reached!' : `${r1(wOut(left))} ${u} to go`}</b><small>Goal: ${r1(wOut(goal))} ${u}. A safe pace is about 1–2 lb a week.</small></div>`;
  } else $('#wt-goal').innerHTML = `<p class="caption" style="grid-column:1/-1;text-align:center">Set a goal weight below to see your progress.</p>`;

  drawWeightChart(w, goal);

  // recent weigh-ins (tap to change)
  const last = w.slice(-5).reverse();
  $('#wt-list').innerHTML = last.map((e, i) => {
    const before = w[w.length - 1 - i - 1];
    const diff = before ? signed(wOut(e.weight - before.weight)) : '';
    return `<li><button class="row-btn" data-edit="${e.id}"><span class="lead ico">${ICONS.scale}</span>
      <span class="row-txt"><b>${r1(wOut(e.weight))} ${u}</b><small>${pretty(e.date, { weekday: 'short', month: 'short', day: 'numeric' })}</small></span><span class="row-end">${diff}</span></button></li>`;
  }).join('');
}

/* --- Food plan --- */
function renderPlan() {
  const p = state.profile, t = targets(), h = handPlan(t);
  const goalTxt = { lose: 'To lose fat slowly.', maintain: 'To stay the same.', gain: 'To build muscle.' }[p.goal];
  $('#fuel').innerHTML = `<div class="eyebrow">Fuel per day</div>
    <div class="big">${fmt(t.kcal)} <small>cal</small></div><p class="sub">${goalTxt}</p>
    <div class="macro"><span><b>Protein</b><small>Builds muscle</small></span><span class="g">${fmt(t.protein)} g</span></div>
    <div class="macro"><span><b>Carbs</b><small>Gives energy</small></span><span class="g">${fmt(t.carbs)} g</span></div>
    <div class="macro"><span><b>Fats</b><small>Helps your body work</small></span><span class="g">${fmt(t.fat)} g</span></div>
    ${p.age < 18 ? '<p class="alert">Still growing? Ask a doctor before eating less.</p>' : ''}`;
  const hand = (k, one, many, sub) => { const v = half(h[k]) || 0.5; return `<div class="module"><div class="n">${v}</div><b>${v === 1 ? one : many}</b><small>${sub}</small></div>`; };
  $('#hands').innerHTML =
    hand('protein', 'Palm', 'Palms', 'protein') +
    hand('veg', 'Fist', 'Fists', 'veggies or fruit') +
    hand('carb', 'Cupped hand', 'Cupped hands', 'carbs') +
    hand('fat', 'Thumb', 'Thumbs', 'fats');
  $('#duo').innerHTML = `<div class="module"><div class="n">${fluidN(t.water)}</div><b>${imp() ? 'Cups' : 'Liters'}</b><small>to drink</small></div><div class="module"><div class="n">${fmt(t.fiber)}</div><b>Grams</b><small>of fiber</small></div>`;
  renderTrack();
  $('#micros').innerHTML = micros().map(([n, v, s]) => `<tr><td>${n}<small>${s}</small></td><td>${v}</td></tr>`).join('');

  const f = $('#f-body');
  if (f.contains(document.activeElement)) return;
  const inches = p.heightCm / 2.54;
  f.innerHTML = `
    ${chips('sex', [['female', 'Female'], ['male', 'Male']], p.sex, 'g2', 'b')}
    <div class="pair"><label class="field">Age<input type="number" inputmode="numeric" name="age" min="13" max="100" value="${p.age}"></label>
      <label class="field">Weight (${wUnit()})<input type="number" inputmode="decimal" name="weight" step="0.1" value="${r1(wOut(p.weightKg))}"></label></div>
    ${imp() ? `<div class="pair"><label class="field">Height (ft)<input type="number" inputmode="numeric" name="ft" value="${Math.floor(inches / 12)}"></label>
      <label class="field">+ inches<input type="number" inputmode="numeric" name="in" min="0" max="11" value="${Math.round(inches % 12) % 12}"></label></div>`
      : `<label class="field">Height (cm)<input type="number" inputmode="numeric" name="cm" value="${Math.round(p.heightCm)}"></label>`}
    <label class="field">How active?<select name="activity">
      ${ACT_LABELS
        .map(([v, l]) => `<option value="${v}" ${Number(p.activity) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <p class="q">Goal</p>
    ${chips('goal', [['lose', 'Lose fat'], ['maintain', 'Stay same'], ['gain', 'Gain muscle']], p.goal, 'g3', 'b')}
    <p class="q">Meals a day</p>
    ${chips('meals', [[2, '2'], [3, '3'], [4, '4'], [5, '5']], p.meals, 'g4', 'b')}`;
}


/* --- Food: how you're doing (averages vs. your plan) --- */
function renderTrack() {
  const n = Number($('input[name=trange]:checked')?.value || 7), dates = rangeDates(n), raws = dates.map(dayRaw), t = targets();
  const foodDays = raws.filter((d) => d.food).length;
  const css = getComputedStyle(document.documentElement), C = (v) => css.getPropertyValue(v).trim();
  if (!foodDays) {
    $('#radar').innerHTML = '';
    $('#track-sum').textContent = '';
    $('#track-list').innerHTML = '<li class="empty" style="padding-top:var(--s4)">Log a meal to see how you’re doing.</li>';
    return;
  }
  const rows = [
    { k: 'kcal', name: 'Calories', target: t.kcal, mode: 'band', unit: 'cal' },
    { k: 'protein', name: 'Protein', target: t.protein, mode: 'min', unit: 'g' },
    { k: 'produce', name: 'Veggies', target: 5, mode: 'min', unit: 'fists' },
    { k: 'treats', name: 'Treats', target: 1, mode: 'max', unit: '' },
    { k: 'water', name: 'Drinks', target: t.water, mode: 'min', unit: 'fluid', drink: 1 },
  ].map((row) => {
    const got = raws.map((d) => (row.drink ? (d.drink ? d[row.k] : null) : d.food ? d[row.k] : null)).filter((v) => v != null);
    if (!got.length) return { ...row, score: 0, avg: null };
    const avg = mean(got), ratio = avg / row.target;
    // score: 1 = right on your goal, 0 = far off
    const score = row.mode === 'max' ? (avg <= row.target ? 1 : row.target / avg)
      : row.mode === 'band' ? Math.max(0, 1 - Math.abs(1 - ratio) * 2) : Math.min(1, ratio);
    let status, good;
    if (row.mode === 'max') { good = avg <= row.target; status = good ? 'On track' : 'Too many'; }
    else if (row.mode === 'band') { good = ratio >= 0.9 && ratio <= 1.1; status = good ? 'On track' : ratio < 0.9 ? 'Low' : 'High'; }
    else { good = ratio >= 0.9; status = good ? 'On track' : ratio >= 0.7 ? 'A bit low' : 'Low'; }
    return { ...row, avg, score, good, status };
  });

  // radar: one spoke per area; the dashed outline is "100% on goal"
  const cx = 150, cy = 128, R = 88, N = rows.length;
  const pt = (i, r) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / N; return [cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r]; };
  const poly = (r) => rows.map((_, i) => pt(i, typeof r === 'function' ? r(i) : r).map((v) => v.toFixed(1)).join(',')).join(' ');
  const rings = [0.5, 1].map((r) => `<polygon points="${poly(r)}" fill="none" stroke="${C('--line')}" stroke-width="${r === 1 ? 1.5 : 1}" ${r === 1 ? 'stroke-dasharray="4 4"' : ''}/>`).join('');
  const spokes = rows.map((_, i) => { const [x, y] = pt(i, 1); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${C('--line')}"/>`; }).join('');
  const shape = `<polygon points="${poly((i) => Math.max(0.06, rows[i].score))}" fill="${C('--orange')}" fill-opacity=".22" stroke="${C('--orange')}" stroke-width="2.5" stroke-linejoin="round"/>`;
  const dots = rows.map((row, i) => { const [x, y] = pt(i, Math.max(0.06, row.score)); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${row.good ? C('--orange') : C('--card')}" stroke="${C('--orange')}" stroke-width="2"/>`; }).join('');
  const labels = rows.map((row, i) => {
    const [x, y] = pt(i, 1.24), anchor = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end';
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}" font-size="12" font-weight="800" fill="${row.good ? C('--orange') : C('--ink')}" font-family="Outfit, Arial">${row.name}</text>`;
  }).join('');
  $('#radar').innerHTML = rings + spokes + shape + dots + labels;

  const onTrack = rows.filter((r) => r.good).length;
  const worst = rows.filter((r) => !r.good && r.avg != null).sort((a, b) => a.score - b.score)[0];
  $('#track-sum').innerHTML = `<b>${onTrack} of ${rows.length}</b> on track${worst ? ` · work on <b class="o">${worst.name.toLowerCase()}</b>` : ' · nice work!'} · ${foodDays}/${n} days logged`;
  const show = (row, v) => (row.unit === 'fluid' ? fluidN(v) : row.k === 'produce' || row.k === 'treats' ? r1(v) : fmt(v));
  $('#track-list').innerHTML = rows.map((row) => row.avg == null ? '' : `<li class="trk-row"><b>${row.name}</b>
    <span>${show(row, row.avg)}<small> / ${row.mode === 'max' ? 'max ' : ''}${show(row, row.target)} ${row.unit === 'fluid' ? fluidU() : row.unit}</small></span>
    <span class="tag ${row.good ? 'good' : ''}">${row.status}</span></li>`).join('');
}

/* --- Me: "You" shows a short summary; tap Edit to change it --- */
let youOpen = false;
const ACT_LABELS = [[1.2, 'Mostly sitting'], [1.375, 'Exercise 1–3 days/wk'], [1.55, 'Exercise 3–5 days/wk'], [1.725, 'Exercise 6–7 days/wk'], [1.9, 'Athlete']];
function renderYou() {
  const p = state.profile, inches = p.heightCm / 2.54;
  $('#you-form').classList.toggle('hidden', !youOpen);
  $('#you-sum').classList.toggle('hidden', youOpen);
  $('#you-edit').textContent = youOpen ? 'Done' : 'Edit';
  const items = [
    ['Name', state.name.trim() || '—'],
    ['Body', `${p.sex === 'male' ? 'Male' : 'Female'} · ${p.age}`],
    ['Height', imp() ? `${Math.floor(inches / 12)}′ ${Math.round(inches % 12) % 12}″` : `${Math.round(p.heightCm)} cm`],
    ['Weight', `${r1(wOut(p.weightKg))} ${wUnit()}`],
    ['Goal', { lose: 'Lose fat', maintain: 'Stay same', gain: 'Gain muscle' }[p.goal]],
    ['Active', (ACT_LABELS.find(([v]) => v === Number(p.activity)) || [0, '—'])[1]],
    ['Meals', `${p.meals} a day`],
  ];
  $('#you-sum').innerHTML = items.map(([k, v]) => `<button data-you="toggle"><span class="eyebrow">${k}</span><b>${esc(v)}</b></button>`).join('');
}


/* --- Me: "Your goals" shows the goals you have on; tap Edit to change them --- */
let goalsOpen = false;
function renderGoalsSum() {
  $('#goals-form').classList.toggle('hidden', !goalsOpen);
  $('#goals-sum').classList.toggle('hidden', goalsOpen);
  $('#goals-edit').textContent = goalsOpen ? 'Done' : 'Edit';
  const on = state.steps.filter((x) => x.on);
  const name = (x) => (x.type === 'manual' ? x.label || 'My goal' : AUTO[x.metric].label(stepTarget(x)));
  $('#goals-sum').innerHTML = on.length
    ? `<div class="pills">${on.map((x) => `<button data-goals="toggle">${esc(name(x))}</button>`).join('')}</div>
       <p class="caption" style="margin-top:var(--s3)">${on.length} of ${state.steps.length} goals on · tap to change</p>`
    : '<p class="empty">No goals on. Tap Edit to pick some.</p>';
}


/* --- Settings --- */
const ACCENTS = { orange: 'Orange', red: 'Red', pink: 'Pink', purple: 'Purple', blue: 'Blue', green: 'Green' };
const APP_VERSION = '0.14';
function applySettings() {
  const x = state.settings, root = document.documentElement;
  if (x.accent && x.accent !== 'orange') root.dataset.accent = x.accent; else delete root.dataset.accent;
  if (x.text === 'large') root.dataset.text = 'large'; else delete root.dataset.text;
  DAY_START = Number(x.dayStart) || 0; DATE_STYLE = x.date; TIME_STYLE = x.time;
}
function renderSettings() {
  const x = state.settings, set = (name, v) => { const i = $(`input[name="${name}"][value="${v}"]`); if (i) i.checked = true; };
  set('theme', state.theme); set('textsize', x.text); set('timefmt', x.time); set('datefmt', x.date);
  set('daystart', x.dayStart); set('startview', x.start); set('units', state.profile.units);
  $('#set-accent').innerHTML = Object.entries(ACCENTS).map(([k, n]) =>
    `<input type="radio" name="accent" id="ac-${k}" value="${k}" ${x.accent === k ? 'checked' : ''}><label for="ac-${k}" class="sw-${k}" title="${n}" aria-label="${n}"></label>`).join('');
  // backup reminder
  const n = state.entries.length, lb = state.lastBackup, ago = lb ? Math.floor((Date.now() - lb) / 864e5) : null;
  const note = $('#backup-note');
  note.textContent = !n ? 'Nothing to back up yet.' : ago == null ? 'You haven’t saved a backup yet.' : ago === 0 ? 'Last backup: today.' : `Last backup: ${plural(ago, 'day')} ago.`;
  note.classList.toggle('warn', n > 20 && (ago == null || ago > 30));
  const days = byDate.size, first = [...byDate.keys()].sort()[0];
  $('#about-ver').textContent = `One Step v${APP_VERSION}`;
  $('#about-stats').textContent = n ? `${n.toLocaleString()} logs over ${plural(days, 'day')}${first ? ` · since ${pretty(first, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}` : 'No logs yet.';
}

/* --- Me --- */
function renderMe() {
  renderYou();
  renderGoalsSum();
  renderWeight();
  if (document.activeElement !== $('#name')) $('#name').value = state.name;
  $(`#units input[value=${state.profile.units}]`).checked = true;

  const ed = $('#edit-steps');
  if (!ed.contains(document.activeElement)) {
    ed.innerHTML = state.steps.map((s) => {
      if (s.type === 'manual') return `<li data-id="${s.id}"><span class="row-txt"><input type="text" data-label value="${esc(s.label)}" placeholder="Name it"></span>
        <button class="rm" data-rm="${s.id}" aria-label="Remove">×</button><label class="switch"><input type="checkbox" data-on ${s.on ? 'checked' : ''} aria-label="On"><span></span></label></li>`;
      const def = AUTO[s.metric], t = stepTarget(s), unit = typeof def.u === 'function' ? def.u() : def.u || '';
      const shownT = s.metric === 'water' ? fluidN(t) : t;
      return `<li data-id="${s.id}"><span class="row-txt">${esc(def.label(t))}</span>
        ${s.metric !== 'checkin' ? `<input type="number" inputmode="decimal" data-target value="${shownT}" aria-label="Goal in ${unit}" step="${s.metric === 'water' && !imp() ? 0.25 : s.metric === 'sleep' ? 0.5 : 1}"><span class="u">${unit}</span>` : ''}
        <label class="switch"><input type="checkbox" data-on ${s.on ? 'checked' : ''} aria-label="On"><span></span></label></li>`;
    }).join('');
  }

  const base = location.origin + location.pathname;
  const L = [
    ['+1 cup water', 'log=drink&type=water&cups=1'],
    ['30 min walk', 'log=move&type=walk&min=30&effort=1'],
    ['Steps', 'log=steps&count=8000'],
    ['Sleep', 'log=sleep&hours=7.5'],
    ['Weight', imp() ? 'log=weight&lb=150' : 'log=weight&kg=68'],
  ];
  $('#links').innerHTML = L.map(([n, q]) => `<li><span class="row-txt">${n}<code>${esc(base)}?${esc(q)}</code></span><button data-copy="${esc(base + '?' + q)}">Copy</button></li>`).join('');
}

/* ===== Toolbar ===== */
// Hidden until the peeking + is tapped; overlays the page instead of pushing it.
function setRail(open) {
  const rail = $('#rail'), btn = $('#rail-toggle');
  rail.classList.toggle('open', open);
  $('#rail-scrim').classList.toggle('hidden', !open);
  btn.setAttribute('aria-expanded', String(open));
  btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
const railOpen = () => $('#rail').classList.contains('open');
function go(v, scrollTo) {
  view = v;
  setRail(false);
  $$('main.view').forEach((m) => m.classList.toggle('hidden', m.dataset.view !== v));
  $$('.rail [data-go]').forEach((b) => b.classList.toggle('on', b.dataset.go === v));
  if (v === 'today') { sizeStrip(); centerStrip(day, 'instant'); }
  if (scrollTo) $('#' + scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); else window.scrollTo({ top: 0 });
}

/* ===== UI building blocks ===== */
function chips(name, opts, sel, cls = '', prefix = 's') {
  return `<div class="chips ${cls}">${opts.map(([v, l, sub]) => {
    const id = `${prefix}-${name}-${String(v).replace(/\W/g, '')}`;
    return `<input type="radio" name="${name}" id="${id}" value="${v}" ${String(v) === String(sel) ? 'checked' : ''}><label for="${id}">${l}${sub ? `<small>${sub}</small>` : ''}</label>`;
  }).join('')}</div>`;
}
const counter = (name, title, sub, val = 0, step = 0.5) =>
  `<div class="counter"><div><b>${title}</b><small>${sub}</small></div><div class="ctl">
    <button type="button" data-step="${-step}" aria-label="Less ${title}">−</button><output>${val}</output>
    <input type="hidden" name="${name}" value="${val}"><button type="button" class="plus" data-step="${step}" aria-label="More ${title}">+</button></div></div>`;
const radio = (f, n) => { const c = $(`input[name="${n}"]:checked`, f); return c ? c.value : null; };
const guessMeal = () => { const h = new Date().getHours(); return h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 21 ? 'Dinner' : 'Snack'; };
const timeField = (e) => `<label class="field">Time<input type="time" name="time" value="${e.time || nowTime()}"></label>`;

/* ===== Sheets (add + edit) ===== */
const SHEETS = {
  move: {
    title: 'Move', cta: 'Add', kind: 'activity',
    html: (e) => {
      const mins = [10, 15, 20, 30, 45, 60], m = e.minutes;
      return `<p class="q">What?</p>${chips('type', Object.entries(ACTIVITIES).map(([k, a]) => [k, a.name]), e.type || 'walk', 'g4')}
        <p class="q">How long?</p>${chips('minutes', mins.map((v) => [v, `${v} min`]), mins.includes(m) ? m : m ? '' : 30, 'g3')}
        <label class="field" style="margin-top:10px">Other (min)<input type="number" inputmode="numeric" name="custom" min="1" value="${m && !mins.includes(m) ? m : ''}"></label>
        <p class="q">How hard?</p>${chips('intensity', Object.entries(EFFORT).map(([k, x]) => [k, x.name, x.hint]), e.intensity || 2, 'g3')}
        <details class="more"><summary>More</summary><div>
          <div class="pair"><label class="field">Distance (${dUnit()})<input type="number" inputmode="decimal" name="dist" step="0.01" value="${e.km ? r1(dOut(e.km)) : ''}"></label>${timeField(e)}</div>
        </div></details>`;
    },
    read: (f) => {
      const minutes = num(f.custom.value) || num(radio(f, 'minutes'));
      if (!minutes) return 'Pick the minutes';
      return { kind: 'activity', type: radio(f, 'type'), minutes, intensity: Number(radio(f, 'intensity')), km: f.dist.value ? dIn(Number(f.dist.value)) : null, time: f.time.value };
    },
    done: (r) => `${ACTIVITIES[r.type].name} added!`,
  },
  meal: {
    title: 'Meal', cta: 'Add', kind: 'food',
    html: (e) => {
      const n = e.portions || {}, x = e.exact || {};
      return `<p class="q">Which?</p>${chips('meal', ['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((v) => [v, v]), e.meal || guessMeal(), 'g4')}
        <p class="q">Count with your hand</p>
        <div class="counters">${Object.entries(PORTIONS).map(([k, p]) => counter(k, p.name, `1 ${p.unit} · ${p.hint}`, n[k] || 0)).join('')}</div>
        <div class="estimate" id="estimate"></div>
        <details class="more" ${e.exact ? 'open' : ''}><summary>Know exact numbers?</summary><div>
          <div class="pair"><label class="field">Calories<input type="number" inputmode="numeric" name="kcal" value="${x.kcal ?? ''}"></label><label class="field">Protein (g)<input type="number" inputmode="numeric" name="p" value="${x.p ?? ''}"></label></div>
          <div class="pair"><label class="field">Carbs (g)<input type="number" inputmode="numeric" name="c" value="${x.c ?? ''}"></label><label class="field">Fat (g)<input type="number" inputmode="numeric" name="f" value="${x.f ?? ''}"></label></div>
          ${timeField(e)}
        </div></details>`;
    },
    read: (f) => {
      const portions = {};
      for (const k in PORTIONS) { const v = Number(f[k].value); if (v) portions[k] = v; }
      const ex = { kcal: num(f.kcal.value), p: num(f.p.value), c: num(f.c.value), f: num(f.f.value) };
      const exact = Object.values(ex).some((v) => v != null) ? ex : undefined;
      if (!Object.keys(portions).length && !exact) return 'Tap + on a food';
      return { kind: 'food', meal: radio(f, 'meal'), portions, exact, time: f.time.value };
    },
    init: (f) => {
      const up = () => { const r = SHEETS.meal.read(f); const m = foodMacros(typeof r === 'string' ? {} : r);
        $('#estimate', f).innerHTML = `≈ <b>${fmt(m.kcal)}</b> cal · ${fmt(m.p)} g protein`; };
      f.addEventListener('input', up); up();
    },
    done: (r) => `${r.meal} added!`,
  },
  drink: {
    title: 'Drink', cta: 'Add', kind: 'drink',
    html: (e) => {
      const sz = sizes(), hit = sz.find(([ml]) => ml === e.ml);
      return `<p class="q">What?</p>${chips('type', Object.entries(DRINKS).map(([k, d]) => [k, d.name]), e.type || 'water', 'g3')}
        <p class="q">How much?</p>${chips('size', sz, hit ? e.ml : e.ml ? '' : sz[0][0], 'g4')}
        <label class="field" style="margin-top:10px">Other (${vUnit()})<input type="number" inputmode="decimal" name="custom" value="${e.ml && !hit ? fmt(vOut(e.ml)) : ''}"></label>
        <details class="more"><summary>More</summary><div>${timeField(e)}</div></details>`;
    },
    read: (f) => {
      const ml = f.custom.value ? Math.round(vIn(Number(f.custom.value))) : num(radio(f, 'size'));
      if (!ml) return 'Pick how much';
      return { kind: 'drink', type: radio(f, 'type'), ml, time: f.time.value };
    },
    done: (r) => `${DRINKS[r.type].name} added!`,
  },
  feel: {
    title: 'How do you feel?', cta: 'Save', kind: 'checkin', onePerDay: true,
    html: (e) => {
      const scale = (k, q) => `<p class="q">${q}</p>${chips(k, FEEL[k].map((w, i) => [i + 1, `<b>${i + 1}</b>${w}`]), e[k] ?? '', 'g5')}`;
      return `<div class="counters">${counter('sleep', 'Sleep', 'hours last night', e.sleep ?? 7, 0.5)}</div>
        ${scale('energy', 'Energy')}${scale('mood', 'Mood')}${scale('soreness', 'Sore?')}
        <details class="more" ${e.weight ? 'open' : ''}><summary>Weight</summary><div>
          <label class="field">Weight (${wUnit()})<input type="number" inputmode="decimal" name="weight" step="0.1" value="${e.weight ? r1(wOut(e.weight)) : ''}"></label>
          <p class="caption">Optional. Best in the morning.</p>
        </div></details>`;
    },
    read: (f) => {
      const g = (k) => { const v = radio(f, k); return v ? Number(v) : null; };
      return { kind: 'checkin', sleep: Number(f.sleep.value), energy: g('energy'), mood: g('mood'), soreness: g('soreness'), weight: f.weight.value ? wIn(Number(f.weight.value)) : null, time: nowTime() };
    },
    done: () => 'Check-in saved!',
  },
  recover: {
    title: 'Ice or heat', cta: 'Add', kind: 'compress',
    html: (e) => {
      const mins = [5, 10, 15, 20], areas = ['knee', 'back', 'shoulder', 'legs', 'neck', 'ankle'];
      return `<p class="q">Which?</p>${chips('temp', [['cold', 'Ice', 'for swelling'], ['hot', 'Heat', 'for tightness']], e.temp || 'cold', 'g3')}
        <p class="q">How long?</p>${chips('minutes', mins.map((v) => [v, `${v} min`]), mins.includes(e.minutes) ? e.minutes : e.minutes ? '' : 15, 'g4')}
        <label class="field" style="margin-top:10px">Other (min)<input type="number" inputmode="numeric" name="custom" value="${e.minutes && !mins.includes(e.minutes) ? e.minutes : ''}"></label>
        <p class="q">Where?</p>${chips('area', areas.map((v) => [v, v[0].toUpperCase() + v.slice(1)]), e.area || '', 'g3')}
        <details class="more"><summary>More</summary><div>
          <label class="field">Somewhere else<input type="text" name="other" value="${e.area && !areas.includes(e.area) ? esc(e.area) : ''}"></label>${timeField(e)}
        </div></details>`;
    },
    read: (f) => {
      const minutes = num(f.custom.value) || num(radio(f, 'minutes'));
      if (!minutes) return 'Pick the minutes';
      return { kind: 'compress', temp: radio(f, 'temp'), minutes, area: f.other.value.trim() || radio(f, 'area') || '', time: f.time.value };
    },
    done: (r) => `${r.temp === 'hot' ? 'Heat' : 'Ice'} added!`,
  },
  steps: {
    title: 'Steps', cta: 'Save', kind: 'steps', onePerDay: true,
    html: (e) => `<label class="field">Steps today<input type="number" inputmode="numeric" name="count" min="0" value="${e.count ?? ''}" placeholder="7500"></label>
      <p class="caption" style="margin-top:var(--s2)">Find it in the Health app.</p>`,
    read: (f) => { const c = num(f.count.value); return c == null ? 'Type your steps' : { kind: 'steps', count: Math.round(c), time: nowTime() }; },
    done: () => 'Steps saved!',
  },
};

function openSheet(name, entry) {
  if (name === 'workout') { openWorkout(entry); return; }
  const body = $('#sheet-body');
  if (name === 'add') {
    const tiles = [['workout', 'Workout', 'sets, reps, muscles'], ['move', 'Move', 'walk, run, sport'], ['meal', 'Meal', 'use your hand'], ['drink', 'Drink', 'water, soda…'],
      ['feel', 'Check-in', 'sleep, mood'], ['recover', 'Ice/heat', 'for sore spots'], ['steps', 'Steps', 'from phone']];
    body.innerHTML = `<div class="sheet-head"><h2 id="sheet-title">Add</h2><button class="close" data-close aria-label="Close">×</button></div>
      <button class="one-tap" data-quick="water"><b>+1 ${imp() ? 'cup' : 'glass'} of water</b>${ICONS.plus}</button>
      <div class="add-grid">${tiles.map(([k, n, s]) => `<button data-open="${k}"><span class="lead ico">${ICONS[k]}</span><span><b>${n}</b><small>${s}</small></span></button>`).join('')}</div>
      <p class="caption" style="margin-top:var(--s4)">For: <b>${day === today() ? 'today' : pretty(day)}</b></p>`;
  } else {
    const S = SHEETS[name];
    if (!entry && S.onePerDay) entry = state.entries.find((e) => e.kind === S.kind && e.date === day);
    body.innerHTML = `<div class="sheet-head"><h2 id="sheet-title">${S.title}</h2><button class="close" data-close aria-label="Close">×</button></div>
      <form id="sheet-form" novalidate>${S.html(entry || {})}
        <button class="primary" type="submit">${entry ? 'Save' : S.cta}</button>
        ${entry ? '<button type="button" class="danger" data-delete>Delete</button>' : ''}</form>`;
    const f = $('#sheet-form');
    S.init?.(f, entry);
    f.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const r = S.read(f);
      if (typeof r === 'string') return toast(r);
      if (entry) {
        const id = entry.id;
        commit(() => { const x = state.entries.find((e) => e.id === id); if (x) { for (const k of Object.keys(x)) if (!['id', 'date'].includes(k)) delete x[k]; Object.assign(x, r); } }, 'Saved!');
      } else commit(() => state.entries.push({ id: uid(), date: day, ...r }), S.done(r));
      closeSheet();
    });
    if (entry) $('[data-delete]', f).addEventListener('click', () => {
      const id = entry.id;
      commit(() => { state.entries = state.entries.filter((e) => e.id !== id); }, 'Deleted');
      closeSheet();
    });
  }
  $('#sheet').classList.remove('hidden');
  document.body.classList.add('locked');
}
function closeSheet() { $('#sheet').classList.add('hidden'); document.body.classList.remove('locked'); }

/* ===== Integrations: links, paste, CSV — all use applyAction() ===== */
function applyAction(p) {
  const get = (k) => p[k] ?? null, n = (k) => num(get(k));
  const date = isDate(get('date')) && get('date') <= today() ? get('date') : day;
  const time = /^\d{2}:\d{2}$/.test(get('time') || '') ? get('time') : nowTime();
  let what = String(get('log') || '').toLowerCase().trim();
  const amount = n('amount'), unit = String(get('unit') || '').toLowerCase();
  const push = (e) => state.entries.push({ id: uid(), date, time, ...e });
  const mergeCheckin = (data) => {
    const prev = state.entries.find((e) => e.kind === 'checkin' && e.date === date);
    if (prev) Object.assign(prev, data); else push({ kind: 'checkin', sleep: null, energy: null, mood: null, soreness: null, weight: null, ...data });
  };
  if (DRINKS[what] || ['soda', 'tea'].includes(what)) { p = { ...p, type: { soda: 'juice', tea: 'coffee' }[what] || what }; what = 'drink'; }
  if (what === 'workout') { p = { ...p, type: 'workout' }; what = 'move'; }
  if (ACTIVITIES[what]) { p = { ...p, type: what }; what = 'move'; }

  if (what === 'drink') {
    const type = DRINKS[p.type] ? p.type : 'water';
    let ml = n('ml') ?? (n('oz') != null ? n('oz') * 29.5735 : n('cups') != null ? n('cups') * CUP : null);
    if (ml == null && amount != null) ml = unit === 'oz' ? amount * 29.5735 : unit.startsWith('cup') ? amount * CUP : unit === 'l' ? amount * 1000 : amount;
    if (!(ml > 0 && ml < 5000)) throw new Error('drink');
    push({ kind: 'drink', type, ml: Math.round(ml) });
    return `${DRINKS[type].name}`;
  }
  if (what === 'move') {
    const type = ACTIVITIES[p.type] ? p.type : 'exercise', min = n('min') ?? n('minutes') ?? amount;
    if (!(min > 0 && min < 1000)) throw new Error('minutes');
    const km = n('km') ?? (n('mi') != null ? n('mi') * 1.60934 : null);
    push({ kind: 'activity', type, minutes: Math.round(min), intensity: clamp(n('effort') || 2, 1, 3), km });
    return `${ACTIVITIES[type].name} ${Math.round(min)} min`;
  }
  if (what === 'steps') {
    const c = n('count') ?? amount;
    if (!(c >= 0 && c < 200000)) throw new Error('steps');
    state.entries = state.entries.filter((e) => !(e.kind === 'steps' && e.date === date));
    push({ kind: 'steps', count: Math.round(c) });
    return `${fmt(c)} steps`;
  }
  if (what === 'sleep') {
    const h = n('hours') ?? amount;
    if (!(h >= 0 && h <= 24)) throw new Error('sleep');
    mergeCheckin({ sleep: r1(h) });
    return `${r1(h)} hrs sleep`;
  }
  if (what === 'weight') {
    const kg = n('kg') ?? (n('lb') != null ? n('lb') * 0.453592 : amount != null ? (unit === 'kg' ? amount : unit === 'lb' ? amount * 0.453592 : wIn(amount)) : null);
    if (!(kg > 20 && kg < 400)) throw new Error('weight');
    mergeCheckin({ weight: r1(kg) });
    state.profile.weightKg = r1(kg);
    return 'Weight';
  }
  if (['energy', 'mood', 'soreness', 'feel'].includes(what)) {
    const data = {};
    for (const k of ['energy', 'mood', 'soreness']) { const v = n(k) ?? (what === k ? amount : null); if (v != null) data[k] = clamp(Math.round(v), 1, 5); }
    if (!Object.keys(data).length) throw new Error('rating');
    mergeCheckin(data);
    return 'Check-in';
  }
  if (what === 'meal' || what === 'food') {
    const portions = {};
    for (const k of Object.keys(PORTIONS)) { const v = n(k) ?? n(k === 'carb' ? 'carbs' : k === 'treat' ? 'treats' : k); if (v) portions[k] = v; }
    const kcal = n('kcal') ?? amount;
    if (!Object.keys(portions).length && kcal == null) throw new Error('meal');
    push({ kind: 'food', meal: get('meal') || guessMeal(), portions, exact: kcal != null ? { kcal, p: n('p'), c: n('c'), f: n('f') } : undefined });
    return 'Meal';
  }
  if (what === 'compress') {
    const min = n('min') ?? amount;
    if (!(min > 0)) throw new Error('compress');
    push({ kind: 'compress', temp: get('temp') === 'hot' ? 'hot' : 'cold', minutes: Math.round(min), area: get('area') || '' });
    return 'Ice/heat';
  }
  throw new Error(`unknown "${what}"`);
}
function applyLines(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean), ok = [], bad = [], before = JSON.stringify(state);
  for (const line of lines) {
    try { ok.push(applyAction(Object.fromEntries(new URLSearchParams(line.replace(/^.*\?/, ''))))); } catch (_) { bad.push(line); }
  }
  if (ok.length) { save(); toast(`Added ${ok.length}${bad.length ? ` · ${bad.length} skipped` : ''}`, () => { state = migrate(JSON.parse(before)); save(); toast('Undone'); }); }
  else toast("Couldn't read that");
  return { ok, bad };
}
function handleUrl() {
  const q = new URLSearchParams(location.search);
  if (![...q.keys()].length) return;
  const p = Object.fromEntries(q);
  history.replaceState(null, '', location.pathname);
  if (p.open && SHEETS[p.open]) { openSheet(p.open); return; }
  if (p.log) {
    const before = JSON.stringify(state);
    try { const what = applyAction(p); save(); toast(`Added: ${what}`, () => { state = migrate(JSON.parse(before)); save(); toast('Undone'); }); }
    catch (_) { toast('That link is broken'); }
  }
}

const csvCell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function toCSV() {
  const rows = [['date', 'time', 'log', 'amount', 'unit', 'note']];
  for (const e of state.entries.slice().sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))) {
    const R = (log, amount, unit, note = '') => rows.push([e.date, e.time || '', log, amount, unit, note]);
    if (e.kind === 'activity') R(e.type, e.minutes, 'min', `${EFFORT[e.intensity || 2].name}${e.km ? `; ${r1(e.km)} km` : ''}`);
    if (e.kind === 'food') { const m = foodMacros(e); R('meal', Math.round(m.kcal), 'kcal', `${e.meal}; protein ${Math.round(m.p)}g; treats ${m.treats}; veggies ${m.produce}`); }
    if (e.kind === 'drink') R(e.type, e.ml, 'ml');
    if (e.kind === 'compress') R('compress', e.minutes, 'min', `${e.temp}${e.area ? '; ' + e.area : ''}`);
    if (e.kind === 'steps') R('steps', e.count, 'steps');
    if (e.kind === 'workout') { const w = workoutStats(e); R('workout', Math.round(w.min), 'min', `${e.name}; ${Math.round(w.kcal)} kcal; ${(e.items || []).map((it) => exOf(it)?.n).join(' + ')}`); }
    if (e.kind === 'checkin') {
      if (e.sleep != null) R('sleep', e.sleep, 'hours');
      for (const k of ['energy', 'mood', 'soreness']) if (e[k] != null) R(k, e[k], 'of 5');
      if (e.weight != null) R('weight', e.weight, 'kg');
    }
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}
function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}
function importCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return toast('Empty file');
  const head = rows[0].map((h) => h.trim().toLowerCase()), hasHead = head.includes('date');
  const col = (name, i) => (hasHead ? head.indexOf(name) : i);
  const ix = { date: col('date', 0), time: col('time', -1), log: hasHead ? Math.max(head.indexOf('log'), head.indexOf('item')) : 1, amount: col('amount', 2), unit: col('unit', 3) };
  const before = JSON.stringify(state);
  let ok = 0, bad = 0;
  for (const r of rows.slice(hasHead ? 1 : 0)) {
    const g = (i) => (i >= 0 ? (r[i] || '').trim() : '');
    try { applyAction({ date: g(ix.date), time: g(ix.time), log: g(ix.log).toLowerCase(), amount: g(ix.amount), unit: g(ix.unit).toLowerCase() }); ok++; } catch (_) { bad++; }
  }
  save();
  toast(`Added ${ok}${bad ? ` · ${bad} skipped` : ''}`, () => { state = migrate(JSON.parse(before)); save(); toast('Undone'); });
}
function download(name, text, type) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ===== Toast with Undo ===== */
let toastTimer, undoFn = null;
function toast(msg, undo) {
  const t = $('#toast');
  $('span', t).textContent = msg;
  undoFn = undo || null;
  t.classList.toggle('has-undo', !!undo);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); undoFn = null; }, undo ? 5000 : 2000);
}

/* ===== Wiring ===== */
function wire() {
  $('#ask-cause').innerHTML = CAUSES.map((c) => `<option value="${c.k}">${c.ask}</option>`).join('');
  $('#ask-out').innerHTML = OUTCOMES.map((o) => `<option value="${o.k}">${METRICS[o.k].l.toLowerCase()}</option>`).join('');
  $('#chart-metric').innerHTML = Object.entries(METRICS).map(([k, m]) => `<option value="${k}">${m.l}</option>`).join('');
  $('#chart-metric').value = 'energy';

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, [data-close], [data-rail]');
    if (!t) return;
    const ds = t.dataset;
    if (ds.go) { if (ds.to === 'goals') goalsOpen = true; go(ds.go, ds.to); renderGoalsSum(); return; }
    if (ds.ask) { const [c, o, l] = ds.ask.split('|'); setAsk(c, o, l); askPicked = true; renderPatterns(); return; }
    if (ds.goals) {
      goalsOpen = ds.goals === 'done' ? false : !goalsOpen;
      if (!goalsOpen) document.activeElement?.blur();
      renderGoalsSum();
      if (goalsOpen) $('#goals').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (ds.you) {
      youOpen = ds.you === 'done' ? false : !youOpen;
      if (!youOpen) document.activeElement?.blur();
      renderYou();
      if (youOpen) $('#you').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (ds.rail) { setRail(ds.rail === 'toggle' ? !railOpen() : false); return; }
    if (ds.open) { setRail(false); openSheet(ds.open); return; }
    if ('close' in ds) { closeSheet(); return; }
    if (ds.day) { slide = ds.day < day ? -1 : ds.day > day ? 1 : 0; day = ds.day; render(); return; }
    if (ds.shift) { const n = addDays(day, Number(ds.shift)); if (n <= today()) { slide = Number(ds.shift); day = n; render(); } return; }
    if (ds.fold) { state.folds[ds.fold] = !isFolded(ds.fold); save(); return; }
    if (ds.edit) { const en = state.entries.find((x) => x.id === ds.edit); if (en) openSheet(KIND_SHEET[en.kind], en); return; }
    if (ds.toggle) {
      const id = ds.toggle, was = (state.done[day] || []).includes(id);
      commit(() => { const list = state.done[day] || (state.done[day] = []); const i = list.indexOf(id); i >= 0 ? list.splice(i, 1) : list.push(id); }, was ? 'Unchecked' : 'Done! 🎉');
      return;
    }
    if (ds.quick === 'water') { const ml = imp() ? CUP : 250; commit(() => state.entries.push({ id: uid(), date: day, time: nowTime(), kind: 'drink', type: 'water', ml }), 'Water added!'); closeSheet(); return; }
    if (ds.step) {
      const box = t.parentElement, inp = $('input', box), out = $('output', box);
      const v = Math.max(0, r1(Number(inp.value) + Number(ds.step)));
      inp.value = v; out.textContent = v; inp.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    if (ds.copy) { navigator.clipboard?.writeText(ds.copy).then(() => toast('Copied!'), () => toast('Press and hold to copy')); return; }
    if (ds.rm) { const id = ds.rm; commit(() => { state.steps = state.steps.filter((s) => s.id !== id); }, 'Goal removed'); return; }
  });
  $('#toast-undo').addEventListener('click', () => { const f = undoFn; undoFn = null; $('#toast').classList.remove('show'); f?.(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSheet(); setRail(false); } });
  window.addEventListener('resize', () => { sizeStrip(); centerStrip(day, 'instant'); });

  // Header light/dark button: flips to the opposite of what you see now
  $('#theme-btn').addEventListener('click', () => { state.theme = isDark() ? 'light' : 'dark'; save(); });

  $$('input[name=range]').forEach((i) => i.addEventListener('change', renderPatterns));
  $$('input[name=asklag]').forEach((i) => i.addEventListener('change', () => { askPicked = true; renderPatterns(); }));
  ['#ask-cause', '#ask-out'].forEach((s) => $(s).addEventListener('change', () => { askPicked = true; renderPatterns(); }));
  $('#chart-metric').addEventListener('change', renderPatterns);
  $$('input[name=trange]').forEach((i) => i.addEventListener('change', renderTrack));

  $('#f-body').addEventListener('input', () => {
    const f = $('#f-body'), p = state.profile;
    p.sex = radio(f, 'sex') || p.sex; p.goal = radio(f, 'goal') || p.goal; p.meals = Number(radio(f, 'meals')) || p.meals;
    if (num(f.age.value)) p.age = clamp(Number(f.age.value), 13, 100);
    // Weight typed here counts as today's weigh-in, so every screen shows the same number
    if (num(f.weight.value) && wIn(Number(f.weight.value)) > 20 && Math.abs(wIn(Number(f.weight.value)) - p.weightKg) > 0.05) setWeight(wIn(Number(f.weight.value)));
    if (imp()) { const ft = num(f.ft.value) || 0, inch = num(f.in.value) || 0; if (ft || inch) p.heightCm = (ft * 12 + inch) * 2.54; }
    else if (num(f.cm.value)) p.heightCm = Number(f.cm.value);
    p.activity = Number(f.activity.value);
    save();
  });
  $('#f-body').addEventListener('change', (e) => { if (e.target.type === 'radio') { document.activeElement?.blur(); render(); } });


  // Settings
  $$('input[name=theme]').forEach((i) => i.addEventListener('change', () => { state.theme = i.value; save(); }));
  $('#set-accent').addEventListener('change', (e) => { state.settings.accent = e.target.value; save(); });
  const setOpt = (name, key, cast = (v) => v) => $$(`input[name=${name}]`).forEach((i) => i.addEventListener('change', () => { state.settings[key] = cast(i.value); save(); }));
  setOpt('textsize', 'text'); setOpt('timefmt', 'time'); setOpt('datefmt', 'date'); setOpt('startview', 'start');
  $$('input[name=daystart]').forEach((i) => i.addEventListener('change', () => { state.settings.dayStart = Number(i.value); DAY_START = Number(i.value); day = today(); save(); }));
  $('#folds-open').addEventListener('click', () => { $$('section[data-fold]').forEach((sec) => { state.folds[sec.dataset.fold] = false; }); save(); toast('All sections open'); });
  $('#folds-reset').addEventListener('click', () => { state.folds = {}; save(); toast('Sections reset'); });
  $('#name').addEventListener('input', (e) => { state.name = e.target.value; save(); });
  $$('#units input').forEach((i) => i.addEventListener('change', () => { state.profile.units = i.value; save(); }));
  $('#edit-steps').addEventListener('change', (e) => {
    const li = e.target.closest('li'); if (!li) return;
    const s = state.steps.find((x) => x.id === li.dataset.id); if (!s) return;
    if ('on' in e.target.dataset) s.on = e.target.checked;
    if ('target' in e.target.dataset) { const v = num(e.target.value); if (v != null && v > 0) s.target = s.metric === 'water' ? Math.round(imp() ? v * CUP : v * 1000) : v; }
    if ('label' in e.target.dataset) s.label = e.target.value.trim() || 'My goal';
    e.target.blur(); save();
  });
  $('#add-step').addEventListener('click', () => {
    const id = uid();
    goalsOpen = true;
    commit(() => state.steps.push({ id, type: 'manual', label: '', on: true }), 'Name your goal');
    setTimeout(() => $(`#edit-steps li[data-id="${id}"] input[type=text]`)?.focus(), 50);
  });

  const wc = $('#wt-chart');
  wc.addEventListener('pointerdown', (e) => { scrubWeight(e); });
  wc.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) scrubWeight(e); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => wc.addEventListener(t, () => setTimeout(endScrub, 900)));
  $$('input[name=wtrange]').forEach((i) => i.addEventListener('change', () => renderWeight()));
  $('#wt-save').addEventListener('click', () => {
    const v = num($('#wt-input').value);
    if (!v || wIn(v) < 20 || wIn(v) > 400) return toast('Type your weight');
    commit(() => setWeight(wIn(v)), 'Weight saved!');
    $('#wt-input').value = '';
  });
  $('#wt-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#wt-save').click(); });
  $('#wt-goal-input').addEventListener('change', (e) => {
    const v = num(e.target.value);
    state.profile.goalWeightKg = v && wIn(v) > 20 ? r1(wIn(v)) : null;
    e.target.blur(); save();
  });
  $('#paste-btn').addEventListener('click', async () => {
    try { const txt = await navigator.clipboard.readText(); if (!txt.trim()) return toast('Nothing copied'); applyLines(txt); }
    catch (_) { toast('Paste in the box instead'); $('#paste-box').focus(); }
  });
  $('#paste-add').addEventListener('click', () => { const r = applyLines($('#paste-box').value); if (r.ok.length) $('#paste-box').value = r.bad.join('\n'); });

  $('#export-csv').addEventListener('click', () => { download(`one-step-${today()}.csv`, toCSV(), 'text/csv'); });
  $('#export-json').addEventListener('click', () => { state.lastBackup = Date.now(); download(`one-step-backup-${today()}.json`, JSON.stringify(state, null, 2), 'application/json'); save(); toast('Backup saved'); });
  $('#import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text(); e.target.value = '';
    if (/\.csv$/i.test(file.name) || !text.trim().startsWith('{')) return importCSV(text);
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data.entries)) throw new Error();
      if (!confirm('Replace everything with this backup?')) return;
      commit(() => { state = migrate(data); }, 'Backup loaded');
    } catch (_) { toast('Not a One Step backup'); }
  });
  $('#sample').addEventListener('click', () => {
    if (state.entries.length && !confirm('Replace your logs with sample data? You can undo right after.')) return;
    commit(() => { state.entries = sampleData(); }, 'Sample loaded');
  });
  $('#clear').addEventListener('click', () => {
    if (!confirm('Erase all logs? You can undo right after.')) return;
    commit(() => { state.entries = []; state.done = {}; }, 'Erased');
  });
}

/* ===== Sample data (6 weeks with patterns built in) ===== */
function sampleData() {
  const out = [], R = Math.random, pick = (a) => a[Math.floor(R() * a.length)];
  const push = (date, e) => out.push({ id: uid(), date, ...e });
  let prevAlc = 0, prevHard = 0, prevCompress = 0, weight = 72;
  for (let i = 41; i >= 0; i--) {
    const d = addDays(today(), -i);
    if (R() < 0.1 && i > 0) continue;
    const ran = R() < 0.3, lifted = !ran && R() < 0.4, walked = R() < 0.7;
    const alc = R() < 0.18 ? 350 + Math.round(R() * 400) : 0;
    const fluids = 1200 + Math.round(R() * 1800);
    const steps = 3000 + Math.round(R() * 5000) + (walked ? 4000 : 0) + (ran ? 5000 : 0);
    const sleep = half(clamp(7.2 + (R() - 0.5) * 1.8 - (prevAlc ? 1 : 0), 4.5, 9.5));
    const treats = pick([0, 0, 1, 1, 2, 3]);
    const soreness = clamp(Math.round(1.3 + prevHard * 2.2 - prevCompress * 1.2 + R()), 1, 5);
    const energy = clamp(Math.round((sleep - 5) * 0.9 + fluids / 1500 - treats * 0.25 + (R() - 0.5) * 1.2), 1, 5);
    const mood = clamp(Math.round(energy * 0.6 + (walked ? 1 : 0) + R() * 1.3), 1, 5);
    weight += (R() - 0.5) * 0.3;
    push(d, { kind: 'checkin', time: '07:10', sleep, energy, mood, soreness, weight: r1(weight) });
    push(d, { kind: 'steps', time: '21:30', count: steps });
    if (walked) push(d, { kind: 'activity', type: 'walk', time: '07:30', minutes: 20 + Math.round(R() * 30), intensity: 1, km: r1(1.5 + R() * 2) });
    if (ran) push(d, { kind: 'activity', type: 'run', time: '17:45', minutes: 25 + Math.round(R() * 25), intensity: pick([2, 3]), km: r1(4 + R() * 4) });
    if (lifted) push(d, { kind: 'activity', type: 'workout', time: '18:00', minutes: 40 + Math.round(R() * 25), intensity: pick([2, 3]) });
    const hard = ran || lifted ? 1 : 0, compress = hard && R() < 0.55;
    if (compress) push(d, { kind: 'compress', temp: pick(['cold', 'hot']), time: '20:30', minutes: pick([10, 15, 20]), area: pick(['knee', 'legs', 'back', 'shoulder']) });
    [['Breakfast', '08:15'], ['Lunch', '12:30'], ['Dinner', '19:00']].forEach(([meal, time], j) => {
      push(d, { kind: 'food', meal, time, portions: { protein: hard ? pick([1, 1.5, 2]) : pick([0.5, 1, 1.5]), carb: pick([0.5, 1, 1.5, 2]), veg: pick([0, 1, 1, 2]), fat: pick([0.5, 1, 1.5]), ...(j === 2 && treats ? { treat: treats } : {}) } });
    });
    let left = fluids, hr = 8;
    if (R() < 0.8) { push(d, { kind: 'drink', type: 'coffee', time: '07:45', ml: 300 }); left -= 300; }
    while (left > 0) { const ml = Math.min(left, pick([240, 355, 500])); push(d, { kind: 'drink', type: 'water', time: `${String(hr).padStart(2, '0')}:00`, ml }); left -= ml; hr = Math.min(22, hr + 2); }
    if (alc) push(d, { kind: 'drink', type: 'alcohol', time: '21:00', ml: alc });
    prevAlc = alc; prevHard = hard; prevCompress = compress ? 1 : 0;
  }
  return out;
}

/* ===== Boot ===== */
wire();
render();
if (state.settings.start && state.settings.start !== 'today') go(state.settings.start);
handleUrl();

// Offline mode: works without internet once opened. Only on https (or localhost while testing).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
