/* ─────────────────────────────────────────
   One Step — Workout log
   Build a workout from exercises; the app works out
   time, calories burned, and which muscles you hit.

   Loaded before app.js. Everything here runs only when called,
   so it can use app.js helpers ($, state, commit, …) at call time.
   ───────────────────────────────────────── */
'use strict';

const MUSCLES = {
  chest: 'Chest', shoulders: 'Shoulders', triceps: 'Triceps', biceps: 'Biceps', back: 'Back', core: 'Core',
  glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves', cardio: 'Heart',
};

/* Exercise library
   p = main muscles · s = helper muscles · met = effort (MET) · u = reps | min | sec · spr = seconds per rep */
const EX = [
  // Bodyweight
  { id: 'pushup', n: 'Push-ups', cat: 'body', p: ['chest', 'triceps'], s: ['shoulders', 'core'], met: 3.8, u: 'reps', spr: 3 },
  { id: 'pullup', n: 'Pull-ups', cat: 'body', p: ['back', 'biceps'], s: ['shoulders'], met: 8, u: 'reps', spr: 4 },
  { id: 'chinup', n: 'Chin-ups', cat: 'body', p: ['biceps', 'back'], s: ['shoulders'], met: 8, u: 'reps', spr: 4 },
  { id: 'squat', n: 'Squats', cat: 'body', p: ['quads', 'glutes'], s: ['hamstrings', 'core'], met: 5, u: 'reps', spr: 3 },
  { id: 'lunge', n: 'Lunges', cat: 'body', p: ['quads', 'glutes'], s: ['hamstrings', 'calves'], met: 4, u: 'reps', spr: 3 },
  { id: 'dip', n: 'Dips', cat: 'body', p: ['triceps', 'chest'], s: ['shoulders'], met: 4, u: 'reps', spr: 3 },
  { id: 'burpee', n: 'Burpees', cat: 'body', p: ['quads', 'chest', 'cardio'], s: ['core', 'shoulders'], met: 8, u: 'reps', spr: 4 },
  { id: 'bridge', n: 'Glute bridges', cat: 'body', p: ['glutes', 'hamstrings'], s: ['core'], met: 3, u: 'reps', spr: 3 },
  { id: 'calfraise', n: 'Calf raises', cat: 'body', p: ['calves'], s: [], met: 3, u: 'reps', spr: 2 },
  { id: 'jumpjack', n: 'Jumping jacks', cat: 'body', p: ['cardio', 'calves'], s: ['shoulders'], met: 7.7, u: 'reps', spr: 1 },
  { id: 'stepup', n: 'Step-ups', cat: 'body', p: ['quads', 'glutes'], s: ['calves'], met: 6, u: 'reps', spr: 3 },
  // Weights
  { id: 'bench', n: 'Bench press', cat: 'strength', p: ['chest', 'triceps'], s: ['shoulders'], met: 5, u: 'reps', spr: 3 },
  { id: 'ohp', n: 'Shoulder press', cat: 'strength', p: ['shoulders', 'triceps'], s: ['core'], met: 5, u: 'reps', spr: 3 },
  { id: 'row', n: 'Rows', cat: 'strength', p: ['back', 'biceps'], s: ['shoulders'], met: 5, u: 'reps', spr: 3 },
  { id: 'pulldown', n: 'Lat pulldown', cat: 'strength', p: ['back', 'biceps'], s: [], met: 4.5, u: 'reps', spr: 3 },
  { id: 'curl', n: 'Bicep curls', cat: 'strength', p: ['biceps'], s: [], met: 3.5, u: 'reps', spr: 3 },
  { id: 'tricepext', n: 'Tricep extensions', cat: 'strength', p: ['triceps'], s: [], met: 3.5, u: 'reps', spr: 3 },
  { id: 'lateral', n: 'Lateral raises', cat: 'strength', p: ['shoulders'], s: [], met: 3.5, u: 'reps', spr: 3 },
  { id: 'deadlift', n: 'Deadlift', cat: 'strength', p: ['hamstrings', 'glutes', 'back'], s: ['core', 'quads'], met: 6, u: 'reps', spr: 4 },
  { id: 'bbsquat', n: 'Barbell squat', cat: 'strength', p: ['quads', 'glutes'], s: ['hamstrings', 'core'], met: 6, u: 'reps', spr: 4 },
  { id: 'legpress', n: 'Leg press', cat: 'strength', p: ['quads', 'glutes'], s: ['hamstrings'], met: 5, u: 'reps', spr: 3 },
  { id: 'legcurl', n: 'Leg curls', cat: 'strength', p: ['hamstrings'], s: [], met: 4, u: 'reps', spr: 3 },
  { id: 'kbswing', n: 'Kettlebell swings', cat: 'strength', p: ['glutes', 'hamstrings', 'cardio'], s: ['core', 'shoulders'], met: 9.8, u: 'reps', spr: 2 },
  // Core
  { id: 'plank', n: 'Plank', cat: 'core', p: ['core'], s: ['shoulders', 'glutes'], met: 3, u: 'sec' },
  { id: 'situp', n: 'Sit-ups', cat: 'core', p: ['core'], s: [], met: 3.8, u: 'reps', spr: 2 },
  { id: 'crunch', n: 'Crunches', cat: 'core', p: ['core'], s: [], met: 3.8, u: 'reps', spr: 2 },
  { id: 'climber', n: 'Mountain climbers', cat: 'core', p: ['core', 'cardio'], s: ['shoulders', 'quads'], met: 8, u: 'reps', spr: 1 },
  { id: 'legraise', n: 'Leg raises', cat: 'core', p: ['core'], s: [], met: 3.5, u: 'reps', spr: 3 },
  { id: 'russian', n: 'Russian twists', cat: 'core', p: ['core'], s: [], met: 3.8, u: 'reps', spr: 2 },
  // Cardio
  { id: 'run', n: 'Running', cat: 'cardio', p: ['cardio', 'quads', 'calves'], s: ['hamstrings', 'glutes'], met: 9.5, u: 'min' },
  { id: 'walk', n: 'Walking', cat: 'cardio', p: ['cardio'], s: ['calves', 'quads'], met: 3.5, u: 'min' },
  { id: 'bike', n: 'Cycling', cat: 'cardio', p: ['cardio', 'quads'], s: ['calves', 'glutes'], met: 7, u: 'min' },
  { id: 'rower', n: 'Rowing machine', cat: 'cardio', p: ['cardio', 'back'], s: ['quads', 'biceps'], met: 7, u: 'min' },
  { id: 'rope', n: 'Jump rope', cat: 'cardio', p: ['cardio', 'calves'], s: ['shoulders'], met: 11, u: 'min' },
  { id: 'swim', n: 'Swimming', cat: 'cardio', p: ['cardio', 'back', 'shoulders'], s: ['chest', 'core'], met: 7, u: 'min' },
  { id: 'stairs', n: 'Stairs', cat: 'cardio', p: ['cardio', 'glutes', 'quads'], s: ['calves'], met: 9, u: 'min' },
  { id: 'elliptical', n: 'Elliptical', cat: 'cardio', p: ['cardio', 'quads'], s: ['glutes'], met: 5, u: 'min' },
  { id: 'hiit', n: 'HIIT class', cat: 'cardio', p: ['cardio', 'quads'], s: ['core', 'shoulders'], met: 8, u: 'min' },
  { id: 'sport', n: 'Sports game', cat: 'cardio', p: ['cardio', 'quads'], s: ['calves', 'core'], met: 7, u: 'min' },
  // Stretch
  { id: 'yoga', n: 'Yoga', cat: 'stretch', p: ['core'], s: ['hamstrings', 'shoulders'], met: 2.5, u: 'min' },
  { id: 'stretch', n: 'Stretching', cat: 'stretch', p: [], s: ['hamstrings', 'quads', 'back'], met: 2.3, u: 'min' },
  { id: 'foamroll', n: 'Foam rolling', cat: 'stretch', p: [], s: ['quads', 'back', 'calves'], met: 2, u: 'min' },
  // More bodyweight
  { id: 'diamond', n: 'Diamond push-ups', cat: 'body', p: ['triceps', 'chest'], s: ['shoulders', 'core'], met: 4, u: 'reps', spr: 3 },
  { id: 'incline', n: 'Incline push-ups', cat: 'body', p: ['chest', 'triceps'], s: ['shoulders'], met: 3.5, u: 'reps', spr: 3 },
  { id: 'wallpush', n: 'Wall push-ups', cat: 'body', p: ['chest', 'triceps'], s: ['shoulders'], met: 2.5, u: 'reps', spr: 3 },
  { id: 'pike', n: 'Pike push-ups', cat: 'body', p: ['shoulders', 'triceps'], s: ['chest', 'core'], met: 4, u: 'reps', spr: 3 },
  { id: 'sumo', n: 'Sumo squats', cat: 'body', p: ['glutes', 'quads'], s: ['hamstrings', 'core'], met: 5, u: 'reps', spr: 3 },
  { id: 'jumpsquat', n: 'Jump squats', cat: 'body', p: ['quads', 'glutes', 'cardio'], s: ['calves'], met: 8, u: 'reps', spr: 2.5 },
  { id: 'bulgarian', n: 'Bulgarian split squat', cat: 'body', p: ['quads', 'glutes'], s: ['hamstrings', 'core'], met: 5.5, u: 'reps', spr: 3.5 },
  { id: 'latlunge', n: 'Side lunges', cat: 'body', p: ['quads', 'glutes'], s: ['hamstrings', 'core'], met: 4.5, u: 'reps', spr: 3 },
  { id: 'wallsit', n: 'Wall sit', cat: 'body', p: ['quads', 'glutes'], s: ['calves'], met: 3.5, u: 'sec' },
  { id: 'boxjump', n: 'Box jumps', cat: 'body', p: ['quads', 'glutes', 'cardio'], s: ['calves'], met: 8, u: 'reps', spr: 3 },
  // More weights
  { id: 'goblet', n: 'Goblet squat', cat: 'strength', p: ['quads', 'glutes'], s: ['core', 'biceps'], met: 5.5, u: 'reps', spr: 3 },
  { id: 'rdl', n: 'Romanian deadlift', cat: 'strength', p: ['hamstrings', 'glutes'], s: ['back', 'core'], met: 5.5, u: 'reps', spr: 4 },
  { id: 'hipthrust', n: 'Hip thrust', cat: 'strength', p: ['glutes', 'hamstrings'], s: ['core', 'quads'], met: 5, u: 'reps', spr: 3 },
  { id: 'fly', n: 'Chest fly', cat: 'strength', p: ['chest'], s: ['shoulders'], met: 4, u: 'reps', spr: 3 },
  { id: 'hammer', n: 'Hammer curls', cat: 'strength', p: ['biceps'], s: [], met: 3.5, u: 'reps', spr: 3 },
  { id: 'kickback', n: 'Tricep kickbacks', cat: 'strength', p: ['triceps'], s: ['shoulders'], met: 3.5, u: 'reps', spr: 3 },
  { id: 'frontraise', n: 'Front raises', cat: 'strength', p: ['shoulders'], s: ['chest'], met: 3.5, u: 'reps', spr: 3 },
  { id: 'shrug', n: 'Shrugs', cat: 'strength', p: ['shoulders', 'back'], s: [], met: 3, u: 'reps', spr: 2 },
  { id: 'pullapart', n: 'Band pull-aparts', cat: 'strength', p: ['back', 'shoulders'], s: [], met: 3, u: 'reps', spr: 2 },
  { id: 'farmer', n: 'Farmer carry', cat: 'strength', p: ['core', 'shoulders'], s: ['back', 'quads'], met: 6, u: 'min' },
  // More core
  { id: 'deadbug', n: 'Dead bug', cat: 'core', p: ['core'], s: ['shoulders'], met: 3, u: 'reps', spr: 3 },
  { id: 'bikecrunch', n: 'Bicycle crunches', cat: 'core', p: ['core'], s: [], met: 4, u: 'reps', spr: 1.5 },
  { id: 'superman', n: 'Superman', cat: 'core', p: ['back', 'glutes'], s: ['hamstrings', 'shoulders'], met: 3, u: 'reps', spr: 3 },
  // More cardio
  { id: 'highknees', n: 'High knees', cat: 'cardio', p: ['cardio', 'quads'], s: ['core', 'calves'], met: 8, u: 'min' },
  { id: 'boxing', n: 'Boxing', cat: 'cardio', p: ['cardio', 'shoulders'], s: ['core', 'chest'], met: 7.8, u: 'min' },
  { id: 'battlerope', n: 'Battle ropes', cat: 'cardio', p: ['shoulders', 'cardio'], s: ['core', 'biceps'], met: 9, u: 'min' },
  { id: 'hike', n: 'Hiking', cat: 'cardio', p: ['cardio', 'quads', 'glutes'], s: ['calves'], met: 6, u: 'min' },
  { id: 'dance', n: 'Dancing', cat: 'cardio', p: ['cardio'], s: ['quads', 'calves'], met: 5, u: 'min' },
  { id: 'pilates', n: 'Pilates', cat: 'stretch', p: ['core'], s: ['glutes', 'shoulders'], met: 3, u: 'min' },

];
const EXI = Object.fromEntries(EX.map((x) => [x.id, x]));
/* Ready-made plans — tap one to start with these exercises */
const PLANS = [
  { n: 'Beginner full body', d: 'Easy start · no gear', items: [['squat', 3, 10], ['incline', 3, 8], ['bridge', 3, 12], ['plank', 3, 0, 30], ['walk', 0, 0, 0, 10]] },
  { n: 'Home, no gear', d: '20 min · bodyweight', items: [['jumpjack', 3, 30], ['squat', 3, 15], ['pushup', 3, 10], ['lunge', 3, 10], ['deadbug', 3, 10], ['plank', 3, 0, 30]] },
  { n: 'Push day', d: 'Chest · shoulders · triceps', items: [['bench', 4, 8], ['ohp', 3, 10], ['fly', 3, 12], ['tricepext', 3, 12], ['lateral', 3, 12]] },
  { n: 'Pull day', d: 'Back · biceps', items: [['pullup', 3, 6], ['row', 4, 10], ['pullapart', 3, 15], ['curl', 3, 12], ['hammer', 3, 12]] },
  { n: 'Leg day', d: 'Quads · glutes · hamstrings', items: [['bbsquat', 4, 8], ['rdl', 3, 10], ['bulgarian', 3, 8], ['hipthrust', 3, 10], ['calfraise', 3, 15]] },
  { n: 'Core 10', d: '10 min abs', items: [['crunch', 2, 15], ['deadbug', 2, 10], ['bikecrunch', 2, 20], ['russian', 2, 20], ['plank', 2, 0, 40]] },
  { n: 'Cardio 20', d: 'Sweat · heart', items: [['walk', 0, 0, 0, 5], ['run', 0, 0, 0, 10], ['rope', 0, 0, 0, 5]] },
  { n: 'Stretch & recover', d: 'Rest day', items: [['stretch', 0, 0, 0, 10], ['foamroll', 0, 0, 0, 8], ['yoga', 0, 0, 0, 10]] },
];
const planItems = (pl) => pl.items.map(([ex, sets, reps, sec, min]) => (EXI[ex].u === 'min' ? { ex, min } : EXI[ex].u === 'sec' ? { ex, sets, sec } : { ex, sets, reps }));

const WK_CATS = [['all', 'All'], ['body', 'Bodyweight'], ['strength', 'Weights'], ['cardio', 'Cardio'], ['core', 'Core'], ['stretch', 'Stretch']];
const WK_EFFORT = { 1: 0.85, 2: 1, 3: 1.2 };

/* ===== Math ===== */
function exOf(it) {
  if (it.custom) return { n: it.custom.n || 'My exercise', cat: 'custom', p: it.custom.p || [], s: [], met: it.custom.u === 'min' ? 6 : 4.5, u: it.custom.u || 'reps', spr: 3 };
  return EXI[it.ex];
}
function itemStats(it, kg, effort) {
  const x = exOf(it);
  if (!x) return { min: 0, kcal: 0, sets: 0, load: {}, volume: 0 };
  let active = 0, rest = 0, sets = 0, volume = 0;
  if (x.u === 'min') { active = it.min || 0; sets = Math.max(1, active / 5); }
  else if (x.u === 'sec') { sets = it.sets || 0; active = (sets * (it.sec || 0)) / 60; rest = Math.max(0, sets - 1); }
  else {
    sets = it.sets || 0; active = (sets * (it.reps || 0) * x.spr) / 60; rest = Math.max(0, sets - 1) * 1.25;
    if (it.wt) volume = sets * (it.reps || 0) * it.wt;
  }
  const heavy = it.wt ? Math.min(1.3, 1 + (it.wt / kg) * 0.15) : 1; // heavier lifts cost a bit more
  const kcal = ((x.met * (WK_EFFORT[effort] || 1) * heavy * active + 1.5 * rest) * kg) / 60;
  const load = {};
  x.p.forEach((m) => { load[m] = (load[m] || 0) + sets; });
  x.s.forEach((m) => { load[m] = (load[m] || 0) + sets * 0.5; });
  return { min: active + rest, kcal, sets, load, volume };
}
function workoutStats(e) {
  const kg = state.profile.weightKg, out = { min: 0, kcal: 0, sets: 0, load: {}, volume: 0, count: (e.items || []).length };
  for (const it of e.items || []) {
    const s = itemStats(it, kg, e.effort || 2);
    out.min += s.min; out.kcal += s.kcal; out.sets += s.sets; out.volume += s.volume;
    for (const m in s.load) out.load[m] = (out.load[m] || 0) + s.load[m];
  }
  if (e.duration) { out.kcal *= Math.max(0.6, Math.min(1.6, e.duration / (out.min || e.duration))); out.min = e.duration; }
  return out;
}
const topMuscles = (load, n = 3) => Object.entries(load).sort((a, b) => b[1] - a[1]).slice(0, n).map(([m]) => m);
function autoName(d) {
  const st = workoutStats(d), top = topMuscles(st.load, 3).filter((m) => m !== 'cardio');
  if (!d.items.length) return 'Workout';
  if ((st.load.cardio || 0) >= Math.max(...Object.values(st.load))) return 'Cardio';
  const legs = ['quads', 'glutes', 'hamstrings', 'calves'];
  if (top.length && top.every((m) => legs.includes(m))) return 'Leg day';
  return top.slice(0, 2).map((m) => MUSCLES[m]).join(' & ') || 'Workout';
}
function muscleChips(load, cls = '') {
  const items = Object.entries(load).sort((a, b) => b[1] - a[1]);
  if (!items.length) return '';
  const max = items[0][1];
  return `<div class="mchips ${cls}">${items.map(([m, v]) => `<span class="${v >= max * 0.5 ? 'main' : ''}">${MUSCLES[m]}</span>`).join('')}</div>`;
}

/* ===== Workout page ===== */
function renderWorkout() {
  if (!$('#wk-history')) return;
  const all = state.entries.filter((e) => e.kind === 'workout').sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  $('#wk-date').textContent = day === today() ? 'Logging for today' : `Logging for ${pretty(day, { weekday: 'short', month: 'short', day: 'numeric' })}`;
  $('#wk-plans').innerHTML = PLANS.map((pl, i) => `<button data-wk="plan" data-p="${i}"><b>${pl.n}</b><small>${pl.d}</small><span>${plural(pl.items.length, 'exercise')}</span></button>`).join('');
  $('#wk-repeat').disabled = !all.length;
  $('#wk-repeat').textContent = all.length ? `Repeat “${all[0].name}”` : 'Repeat last';

  // this week (last 7 days)
  const from = addDays(today(), -6), week = all.filter((e) => e.date >= from);
  const sum = { min: 0, kcal: 0, load: {} };
  week.forEach((e) => { const s = workoutStats(e); sum.min += s.min; sum.kcal += s.kcal; for (const m in s.load) sum.load[m] = (sum.load[m] || 0) + s.load[m]; });
  $('#wk-stats').innerHTML = `
    <div><b>${week.length}</b><span>workouts</span></div>
    <div><b>${fmt(sum.min)}</b><span>minutes</span></div>
    <div><b>${fmt(sum.kcal)}</b><span>cal burned</span></div>`;
  const max = Math.max(1, ...Object.values(sum.load));
  $('#wk-muscles').innerHTML = Object.entries(MUSCLES).map(([m, name]) => {
    const v = sum.load[m] || 0, pct = Math.round(15 + (v / max) * 85);
    return `<div class="mtile ${v ? 'on' : ''} ${v / max > 0.55 ? 'hot' : ''}" style="${v ? `background:color-mix(in srgb, var(--orange) ${pct}%, var(--soft))` : ''}"><b>${name}</b><span>${v ? `${fmt(v)} sets` : '—'}</span></div>`;
  }).join('');
  const missing = Object.keys(MUSCLES).filter((m) => m !== 'cardio' && !sum.load[m]).map((m) => MUSCLES[m]);
  $('#wk-tip').textContent = !week.length ? 'Log a workout to see which muscles you worked.'
    : missing.length ? `Not worked yet this week: ${missing.slice(0, 4).join(', ')}.` : 'Every muscle group got work this week. Rest well!';

  $('#wk-history').innerHTML = all.length ? all.slice(0, 40).map((e) => {
    const s = workoutStats(e);
    return `<li><button class="row-btn" data-edit="${e.id}"><span class="lead ico">${ICONS.workout}</span>
      <span class="row-txt"><b>${esc(e.name || 'Workout')}</b><small>${pretty(e.date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${plural(s.count, 'exercise')} · ${fmt(s.min)} min</small></span>
      <span class="row-end"><b class="kcal">${fmt(s.kcal)}</b> cal</span></button></li>`;
  }).join('') : '<li class="empty">No workouts yet. Tap “Start a workout”.</li>';
}

/* ===== Workout editor (bottom sheet) ===== */
let wkDraft = null, wkEditId = null, wkCat = 'all', wkQuery = '';
const wkHow = new WeakSet(); // exercises with the how-to open
const wkView = new WeakMap(); // side / angle / front chosen per exercise
function openWorkout(entry, preset, presetName) {
  wkEditId = entry?.id || null;
  wkDraft = entry
    ? JSON.parse(JSON.stringify({ name: entry.name || '', time: entry.time || nowTime(), effort: entry.effort || 2, duration: entry.duration || null, items: entry.items || [] }))
    : { name: presetName || '', time: nowTime(), effort: 2, duration: null, items: preset ? JSON.parse(JSON.stringify(preset)) : [] };
  wkCat = 'all'; wkQuery = '';
  $('#sheet-body').innerHTML = `
    <div class="sheet-head"><h2 id="sheet-title">${entry ? 'Edit workout' : 'New workout'}</h2><button class="close" data-close aria-label="Close">×</button></div>
    <div class="wk-sum" id="wk-sum"></div>
    <p class="q">Exercises</p>
    <div id="wk-items"></div>
    <div class="wk-add">
      <input type="text" id="wk-search" placeholder="Add an exercise — try “push-ups”" autocomplete="off" enterkeyhint="search">
      <div class="wk-cats" id="wk-cats"></div>
      <div class="wk-results" id="wk-results"></div>
    </div>
    <p class="q">How hard?</p>
    ${chips('wkeffort', [[1, 'Easy', 'can sing'], [2, 'Medium', 'can talk'], [3, 'Hard', "can't talk"]], wkDraft.effort, 'g3', 'wk')}
    <details class="more"><summary>Name & time</summary><div>
      <label class="field">Name<input type="text" id="wk-name" placeholder="Auto: picks from your muscles" value="${esc(wkDraft.name)}"></label>
      <div class="pair"><label class="field">Start time<input type="time" id="wk-time" value="${wkDraft.time}"></label>
      <label class="field">Total minutes<input type="number" inputmode="numeric" id="wk-duration" placeholder="Auto" value="${wkDraft.duration || ''}"></label></div>
    </div></details>
    <button class="primary" data-wk="save">${entry ? 'Save' : 'Save workout'}</button>
    ${entry ? '<button class="danger" data-wk="delete">Delete</button>' : ''}`;
  renderWkItems(); renderWkPicker(); renderWkSum();
  $('#sheet').classList.remove('hidden');
  document.body.classList.add('locked');
}
function renderWkSum() {
  const el = $('#wk-sum'); if (!el) return;
  const st = workoutStats(wkDraft);
  el.innerHTML = `<div class="wk-nums">
      <div><b>${fmt(st.kcal)}</b><span>cal burned</span></div>
      <div><b>${fmt(st.min)}</b><span>minutes</span></div>
      <div><b>${fmt(st.sets)}</b><span>sets</span></div>
    </div>
    ${st.count ? `<div class="wk-hits"><span class="eyebrow">Working</span>${muscleChips(st.load)}</div>` : '<p class="caption" style="text-align:center;margin-top:var(--s2)">Add exercises. We’ll work out the rest.</p>'}
    ${st.volume ? `<p class="caption" style="text-align:center;margin-top:var(--s2)">Total lifted: <b>${fmt(wOut(st.volume))} ${wUnit()}</b></p>` : ''}`;
}
const wkCounter = (i, f, label, v, step, unit = '') => `<div class="wk-ctl"><span>${label}</span>
  <div class="ctl"><button type="button" data-wk="step" data-i="${i}" data-f="${f}" data-d="${-step}" aria-label="Less ${label}">−</button>
  <output>${v}${unit}</output><button type="button" class="plus" data-wk="step" data-i="${i}" data-f="${f}" data-d="${step}" aria-label="More ${label}">+</button></div></div>`;
function renderWkItems() {
  const el = $('#wk-items'); if (!el) return;
  if (!wkDraft.items.length) { el.innerHTML = '<p class="empty">No exercises yet. Search or pick below.</p>'; return; }
  el.innerHTML = wkDraft.items.map((it, i) => {
    const x = exOf(it), st = itemStats(it, state.profile.weightKg, wkDraft.effort);
    let ctl = '';
    if (x.u === 'min') ctl = wkCounter(i, 'min', 'Minutes', it.min || 0, 5);
    else if (x.u === 'sec') ctl = wkCounter(i, 'sets', 'Sets', it.sets || 0, 1) + wkCounter(i, 'sec', 'Seconds', it.sec || 0, 10);
    else ctl = wkCounter(i, 'sets', 'Sets', it.sets || 0, 1) + wkCounter(i, 'reps', 'Reps', it.reps || 0, 1) +
      `<div class="wk-ctl"><span>Weight</span><input type="number" inputmode="decimal" class="wk-wt" data-i="${i}" placeholder="optional" value="${it.wt ? r1(wOut(it.wt)) : ''}"><em>${wUnit()}</em></div>`;
    const custom = it.custom ? `<div class="wk-mpick">${Object.entries(MUSCLES).map(([m, n]) => `<button type="button" class="${(it.custom.p || []).includes(m) ? 'on' : ''}" data-wk="mus" data-i="${i}" data-m="${m}">${n}</button>`).join('')}</div>
      <div class="seg mini" style="margin-top:var(--s2)"><input type="radio" name="wku${i}" id="wku${i}r" ${it.custom.u !== 'min' ? 'checked' : ''} data-wk-u="reps" data-i="${i}"><label for="wku${i}r">Sets & reps</label>
      <input type="radio" name="wku${i}" id="wku${i}m" ${it.custom.u === 'min' ? 'checked' : ''} data-wk-u="min" data-i="${i}"><label for="wku${i}m">Minutes</label></div>` : '';
    return `<div class="wk-item">
      <div class="wk-item-head"><span class="num">${i + 1}</span><div class="row-txt"><b>${esc(x.n)}${it.ex && HOW[it.ex] ? ` <button type="button" class="how-btn ${wkHow.has(it) ? 'on' : ''}" data-wk="how" data-i="${i}" aria-expanded="${wkHow.has(it)}">${wkHow.has(it) ? 'Hide' : 'How to'}</button>` : ''}</b><small>${x.p.length ? x.p.map((m) => MUSCLES[m]).join(', ') : it.custom ? 'Tap the muscles it works' : 'Recovery'}${x.s.length ? ` · also ${x.s.map((m) => MUSCLES[m].toLowerCase()).join(', ')}` : ''}</small></div>
      <span class="wk-kcal">${fmt(st.kcal)} cal</span><button type="button" class="rm" data-wk="rm" data-i="${i}" aria-label="Remove">×</button></div>
      ${it.ex && wkHow.has(it) ? howPanel(it.ex, wkView.get(it), i) : ''}${custom}<div class="wk-ctls">${ctl}</div></div>`;
  }).join('');
}
function renderWkPicker() {
  const cats = $('#wk-cats'), res = $('#wk-results'); if (!res) return;
  cats.innerHTML = WK_CATS.map(([k, n]) => `<button type="button" class="${wkCat === k ? 'on' : ''}" data-wk="cat" data-c="${k}">${n}</button>`).join('');
  const q = wkQuery.trim().toLowerCase();
  const list = EX.filter((x) => (wkCat === 'all' || x.cat === wkCat) &&
    (!q || x.n.toLowerCase().includes(q) || x.p.concat(x.s).some((m) => MUSCLES[m].toLowerCase().startsWith(q))));
  const exact = q && EX.some((x) => x.n.toLowerCase() === q);
  res.innerHTML = list.slice(0, q ? 12 : 9).map((x) => `<button type="button" data-wk="add" data-ex="${x.id}"><b>${x.n}</b><small>${x.p.map((m) => MUSCLES[m]).join(', ') || 'Recovery'}</small></button>`).join('') +
    (q && !exact ? `<button type="button" class="custom" data-wk="custom"><b>+ Add “${esc(wkQuery.trim())}”</b><small>Your own exercise</small></button>` : '');
}
function addExercise(it) {
  const x = exOf(it);
  if (x.u === 'min') it.min = it.min || 20;
  else if (x.u === 'sec') { it.sets = it.sets || 3; it.sec = it.sec || 30; }
  else { it.sets = it.sets || 3; it.reps = it.reps || 10; }
  wkDraft.items.push(it);
  wkQuery = ''; const s = $('#wk-search'); if (s) s.value = '';
  renderWkItems(); renderWkPicker(); renderWkSum();
}
function saveWorkout() {
  if (!wkDraft.items.length) return toast('Add an exercise first');
  const st = workoutStats(wkDraft);
  const data = { kind: 'workout', name: wkDraft.name.trim() || autoName(wkDraft), time: wkDraft.time || nowTime(), effort: wkDraft.effort,
    duration: wkDraft.duration || null, items: wkDraft.items, minutes: Math.round(st.min), kcal: Math.round(st.kcal) };
  const id = wkEditId;
  if (id) commit(() => { const x = state.entries.find((e) => e.id === id); if (x) { for (const k of Object.keys(x)) if (!['id', 'date'].includes(k)) delete x[k]; Object.assign(x, data); } }, 'Workout saved!');
  else commit(() => state.entries.push({ id: uid(), date: day, ...data }), `${data.name} · ${fmt(st.kcal)} cal 🔥`);
  closeSheet();
}

/* ===== Events ===== */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-wk]'); if (!t) return;
  const ds = t.dataset, i = Number(ds.i);
  switch (ds.wk) {
    case 'new': openWorkout(); break;
    case 'repeat': {
      const last = state.entries.filter((x) => x.kind === 'workout').sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))[0];
      if (last) openWorkout(null, last.items);
      break;
    }
    case 'cat': wkCat = ds.c; renderWkPicker(); break;
    case 'add': addExercise({ ex: ds.ex }); break;
    case 'custom': addExercise({ custom: { n: wkQuery.trim(), p: [], u: 'reps' } }); break;
    case 'view': { const it = wkDraft.items[i]; if (it) { wkView.set(it, ds.v); renderWkItems(); } break; }
    case 'plan': { const pl = PLANS[Number(ds.p)]; if (pl) openWorkout(null, planItems(pl), pl.n); break; }
    case 'how': { const it = wkDraft.items[i]; wkHow.has(it) ? wkHow.delete(it) : wkHow.add(it); renderWkItems(); break; }
    case 'rm': wkDraft.items.splice(i, 1); renderWkItems(); renderWkSum(); break;
    case 'step': {
      const it = wkDraft.items[i]; if (!it) break;
      it[ds.f] = Math.max(0, (it[ds.f] || 0) + Number(ds.d));
      renderWkItems(); renderWkSum(); break;
    }
    case 'mus': {
      const p = wkDraft.items[i].custom.p, k = p.indexOf(ds.m);
      k >= 0 ? p.splice(k, 1) : p.push(ds.m);
      renderWkItems(); renderWkSum(); break;
    }
    case 'save': saveWorkout(); break;
    case 'delete': {
      const id = wkEditId;
      commit(() => { state.entries = state.entries.filter((x) => x.id !== id); }, 'Workout deleted');
      closeSheet(); break;
    }
  }
});
document.addEventListener('input', (e) => {
  if (!wkDraft) return;
  const t = e.target;
  if (t.id === 'wk-search') { wkQuery = t.value; renderWkPicker(); }
  else if (t.id === 'wk-name') wkDraft.name = t.value;
  else if (t.id === 'wk-time') wkDraft.time = t.value;
  else if (t.id === 'wk-duration') { wkDraft.duration = Number(t.value) || null; renderWkSum(); }
});
document.addEventListener('change', (e) => {
  if (!wkDraft) return;
  const t = e.target;
  if (t.classList.contains('wk-wt')) { const v = Number(t.value); wkDraft.items[Number(t.dataset.i)].wt = v > 0 ? wIn(v) : null; renderWkItems(); renderWkSum(); }
  else if (t.name === 'wkeffort') { wkDraft.effort = Number(t.value); renderWkItems(); renderWkSum(); }
  else if (t.dataset.wkU) { wkDraft.items[Number(t.dataset.i)].custom.u = t.dataset.wkU; const it = wkDraft.items[Number(t.dataset.i)]; if (t.dataset.wkU === 'min') it.min = it.min || 20; renderWkItems(); renderWkSum(); }
});
document.addEventListener('keydown', (e) => {
  if (e.target.id === 'wk-search' && e.key === 'Enter') { e.preventDefault(); const first = $('#wk-results button'); first?.click(); }
});
