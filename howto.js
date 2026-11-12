/* ─────────────────────────────────────────
   One Step — "How to" figures for exercises
   A jointed 3D figure with real limb lengths, drawn in perspective.
   Each move is a few key poses; elbows and knees are solved with 2-bone IK
   so joints bend the natural way. You can view a move from the side,
   at an angle, or from the front. Moves play slowly with a pause at each end.
   Loaded before workout.js.
   ───────────────────────────────────────── */
'use strict';

/* ===== 3D math ===== */
const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
};
V.norm = (a) => { const l = V.len(a) || 1; return V.mul(a, 1 / l); };

/* Body (x = forward, y = down, z = sideways; floor at y = 91; box ≈ 120 wide) */
const BONE = { torso: 24, neck: 9, upper: 13, fore: 12, thigh: 18, shin: 17, foot: 6 };
const SHOULDER_W = 7, HIP_W = 4.5;
const HINT = { right: [1, 0, 0], left: [-1, 0, 0], up: [0, -1, 0], down: [0, 1, 0] };
const hintVec = (name, side) => (name === 'out' ? [0, 0, side] : name === 'in' ? [0, 0, -side] : HINT[name] || HINT.right);

// 2-bone IK in 3D: joint bends toward the hint direction
function ik3(A, T, l1, l2, hint) {
  let d = V.sub(T, A), dist = V.len(d);
  const max = l1 + l2 - 0.05;
  if (dist > max) { T = V.add(A, V.mul(d, max / dist)); d = V.sub(T, A); dist = max; }
  dist = Math.max(dist, Math.abs(l1 - l2) + 0.05);
  const u = V.norm(d);
  let n = V.sub(hint, V.mul(u, V.dot(hint, u)));
  if (V.len(n) < 1e-4) n = Math.abs(u[1]) < 0.9 ? [0, -1, 0] : [1, 0, 0];
  n = V.norm(n);
  const a = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist))));
  return [V.add(A, V.add(V.mul(u, l1 * Math.cos(a)), V.mul(n, l1 * Math.sin(a)))), T];
}

/* Pose → 3D joints.
   hip [x,y] · sh [x,y] (shoulder) or t (torso lean°, 0 = upright, + = forward) · z = shift whole body sideways
   hands / feet: [x,y] or [x,y,z] for both sides, or [[side A],[side B]] · {rel:[dx,dy,z?]} = from that shoulder
   elbow / knee: bend direction (right = forward, left = back, up, down, out, in) — one value or [A, B]
   toe: foot angle° (0 = flat forward, 90 = pointing down) · splay: toes turned out° */
const both = (v) => (Array.isArray(v) && v.length === 2 && (Array.isArray(v[0]) || (v[0] && v[0].rel)) ? v : [v, v]);
const pair = (v, d) => (Array.isArray(v) ? v : [v ?? d, v ?? d]);
function solve(p) {
  const z0 = p.z || 0, side = [1, -1];
  const H = [p.hip[0], p.hip[1], z0];
  let S;
  if (p.sh) S = [p.sh[0], p.sh[1], z0];
  else { const t = ((p.t || 0) * Math.PI) / 180; S = [H[0] + Math.sin(t) * BONE.torso, H[1] - Math.cos(t) * BONE.torso, z0]; }
  const up = V.norm(V.sub(S, H));
  const Hd = V.add(S, V.mul(up, BONE.neck));
  const Sx = side.map((s) => [S[0], S[1], z0 + s * SHOULDER_W]);
  const Hx = side.map((s) => [H[0], H[1], z0 + s * HIP_W]);
  const hands = both(p.hands).map((h, i) => (h.rel
    ? [Sx[i][0] + h.rel[0], Sx[i][1] + h.rel[1], h.rel[2] != null ? h.rel[2] : Sx[i][2]]
    : [h[0], h[1], h[2] != null ? h[2] : z0 + side[i] * SHOULDER_W]));
  const feet = both(p.feet).map((f, i) => [f[0], f[1], f[2] != null ? f[2] : z0 + side[i] * HIP_W]);
  const elbow = pair(p.elbow, 'down'), knee = pair(p.knee, 'right'), toe = pair(p.toe, 0), splay = p.splay || 0;
  const E = [], W = [], K = [], A = [], T = [];
  for (let i = 0; i < 2; i++) {
    [E[i], W[i]] = ik3(Sx[i], hands[i], BONE.upper, BONE.fore, hintVec(elbow[i], side[i]));
    [K[i], A[i]] = ik3(Hx[i], feet[i], BONE.thigh, BONE.shin, hintVec(knee[i], side[i]));
    const r = (toe[i] * Math.PI) / 180, sp = (splay * Math.PI) / 180;
    T[i] = V.add(A[i], [Math.cos(r) * Math.cos(sp) * BONE.foot, Math.sin(r) * BONE.foot, side[i] * Math.sin(sp) * BONE.foot]);
  }
  return { Hd, S, H, Sx, Hx, E, W, K, A, T };
}

/* ===== Equipment (3D lines) ===== */
const box3 = (x0, x1, y0, y1, z0, z1) => [
  [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y0, z0]],
  [[x0, y0, z0], [x0, y1, z0]], [[x1, y0, z0], [x1, y1, z0]], [[x1, y0, z1], [x1, y1, z1]], [[x0, y0, z1], [x0, y1, z1]],
];
const ring = (cx, cy, r, z = 0, n = 16) => [Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos((i / n) * 2 * Math.PI) * r, cy + Math.sin((i / n) * 2 * Math.PI) * r, z])];
const wall = (x) => [[[x, -6, -22], [x, 91, -22], [x, 91, 22], [x, -6, 22], [x, -6, -22]]];
const PROPS = {
  bar: [[[60, 4, -20], [60, 4, 20]], [[60, 4, -20], [60, 91, -20]], [[60, 4, 20], [60, 91, 20]]],
  dipbars: [[[44, 53, -11], [78, 53, -11]], [[44, 53, 11], [78, 53, 11]], [[48, 53, -11], [48, 91, -11]], [[74, 53, -11], [74, 91, -11]], [[48, 53, 11], [48, 91, 11]], [[74, 53, 11], [74, 91, 11]]],
  bench: box3(20, 68, 72, 91, -8, 8),
  hipbench: box3(8, 38, 70, 91, -9, 9),
  splitbench: box3(22, 42, 75, 91, -9, 9),
  box: box3(66, 96, 75, 91, -12, 12),
  incline: box3(80, 104, 75, 91, -14, 14),
  jumpbox: box3(70, 98, 75, 91, -12, 12),
  wallR: wall(95), wallL: wall(37),
  bike: [...ring(36, 80, 10), ...ring(94, 80, 10), [[36, 80, 0], [64, 74, 0], [84, 44, 0], [94, 80, 0]], [[64, 74, 0], [52, 50, 0]], [[46, 50, -3], [56, 50, 3]], [[52, 52, 0], [84, 46, 0]], [[84, 41, -8], [84, 41, 8]]],
  rower: [[[12, 86, 0], [70, 86, 0]], [[58, 78, -5], [62, 90, -5]], [[58, 78, 5], [62, 90, 5]], ...ring(86, 76, 8)],
  water: [Array.from({ length: 25 }, (_, i) => [4 + i * 4.7, 58 + (i % 2 ? -1.5 : 1.5), 0])],
  roller: [[[80, 87, -11], [80, 87, 11]]],
};

/* ===== The moves =====
   frames: key positions (1 → 2 → … → back to 1) · move/hold: seconds
   gear: db = dumbbells, bb = barbell, kb = kettlebell, cable · props: equipment · view: best starting angle */
const STAND = { hip: [60, 54], t: 0, hands: { rel: [1, 24.5] }, feet: [61, 89] };
const PUSH_UP = { hip: [59.7, 72.9], sh: [82, 64], hands: [[82, 89, 9], [82, 89, -9]], elbow: 'up', feet: [27.3, 86], toe: 78 };
const PUSH_DOWN = { hip: [62.1, 82.5], sh: [86, 80], hands: [[82, 89, 9], [82, 89, -9]], elbow: ['out', 'out'], feet: [27.3, 86], toe: 78 };
const BACK = { hip: [60, 86], sh: [36, 86] };
const PRONE = { hip: [60, 86], sh: [36, 86] };

const FIG = {
  /* — Legs — */
  squat: { move: 1.6, hold: 0.5, frames: [
    { ...STAND, hands: [66, 50] },
    { hip: [45, 70], t: 38, hands: [84, 50], feet: [62, 89] }] },
  goblet: { move: 1.6, hold: 0.5, gear: 'kb', frames: [
    { ...STAND, hands: [[67, 42, 3], [67, 42, -3]], elbow: 'down' },
    { hip: [46, 70], t: 30, hands: [[68, 58, 3], [68, 58, -3]], elbow: 'down', feet: [62, 89], splay: 15 }] },
  bbsquat: { move: 1.6, hold: 0.5, gear: 'bb', frames: [
    { ...STAND, hands: [[57, 32, 13], [57, 32, -13]], elbow: 'down' },
    { hip: [45, 70], t: 38, hands: { rel: [-3, 3] }, elbow: 'down', feet: [62, 89] }] },
  sumo: { move: 1.6, hold: 0.5, view: 'front', frames: [
    { hip: [60, 56], t: 0, hands: [[68, 40, 2], [68, 40, -2]], feet: [[61, 89, 14], [61, 89, -14]], knee: 'out', splay: 35 },
    { hip: [58, 69], t: 12, hands: [[70, 52, 2], [70, 52, -2]], feet: [[61, 89, 14], [61, 89, -14]], knee: 'out', splay: 35 }] },
  jumpsquat: { move: 0.55, hold: 0.15, frames: [
    { ...STAND },
    { hip: [46, 70], t: 38, hands: [44, 66], elbow: 'down', feet: [62, 89] },
    { hip: [60, 44], t: 0, hands: { rel: [2, -24] }, feet: [61, 80], toe: 55 }] },
  stepup: { move: 1.3, hold: 0.4, props: ['box'], frames: [
    { hip: [52, 54], t: 0, hands: { rel: [1, 24.5] }, feet: [52, 89] },
    { hip: [58, 55], t: 12, hands: { rel: [1, 24.5] }, feet: [[76, 73], [52, 89]] },
    { hip: [74, 38], t: 0, hands: { rel: [1, 24.5] }, feet: [76, 73] },
    { hip: [58, 55], t: 12, hands: { rel: [1, 24.5] }, feet: [[76, 73], [52, 89]] }] },
  lunge: { move: 1.6, hold: 0.5, frames: [
    { ...STAND, hands: [[62, 54, 10], [62, 54, -10]], elbow: 'out' },
    { hip: [62, 72], t: 0, hands: [[63, 72, 10], [63, 72, -10]], elbow: 'out', feet: [[80, 89], [37, 85]], knee: ['right', 'down'], toe: [0, 70] }] },
  bulgarian: { move: 1.6, hold: 0.5, props: ['splitbench'], frames: [
    { hip: [60, 56], t: 5, hands: { rel: [1, 24.5] }, feet: [[70, 89], [38, 75]], knee: ['right', 'down'], toe: [0, 70] },
    { hip: [60, 70], t: 8, hands: { rel: [2, 24] }, feet: [[70, 89], [38, 75]], knee: ['right', 'down'], toe: [0, 70] }] },
  latlunge: { move: 1.5, hold: 0.5, view: 'front', frames: [
    { hip: [60, 54], t: 0, hands: [[68, 42, 2], [68, 42, -2]], feet: [[61, 89, 5], [61, 89, -5]] },
    { hip: [58, 66], t: 18, z: 9, hands: [[70, 52, 11], [70, 52, 7]], feet: [[61, 89, 27], [61, 89, -8]], knee: ['out', 'right'], splay: 20 }] },
  wallsit: { move: 1.6, hold: 1.2, props: ['wallL'], frames: [
    { hip: [44, 72], sh: [44, 48], hands: [57, 70], feet: [62, 89], knee: 'up' },
    { hip: [44, 72.6], sh: [44, 48.4], hands: [57, 70.4], feet: [62, 89], knee: 'up' }] },
  calf: { move: 1.2, hold: 0.6, frames: [
    { ...STAND },
    { hip: [60, 49], t: 0, hands: { rel: [1, 24.5] }, feet: [61, 84], toe: 58 }] },
  bridge: { move: 1.4, hold: 0.8, frames: [
    { hip: [58, 86], sh: [34, 86], hands: [56, 89], elbow: 'up', feet: [75, 89], knee: 'up' },
    { hip: [55, 73], sh: [34, 86], hands: [56, 89], elbow: 'up', feet: [75, 89], knee: 'up' }] },
  hipthrust: { move: 1.4, hold: 0.7, gear: 'bb', props: ['hipbench'], frames: [
    { hip: [50, 84], sh: [34, 70], hands: [[52, 81, 10], [52, 81, -10]], feet: [72, 89], knee: 'up' },
    { hip: [56, 68], sh: [34, 70], hands: [[57, 65, 10], [57, 65, -10]], feet: [72, 89], knee: 'up' }] },
  legcurl: { move: 1.4, hold: 0.5, frames: [
    { ...PRONE, hands: [12, 88], feet: [90, 86], toe: 90 },
    { ...PRONE, hands: [12, 88], feet: [62, 63], knee: 'down', toe: -40 }] },

  /* — Push — */
  pushup: { move: 1.6, hold: 0.5, frames: [PUSH_UP, PUSH_DOWN] },
  diamond: { move: 1.6, hold: 0.5, frames: [
    { ...PUSH_UP, hands: [[82, 89, 2.5], [82, 89, -2.5]] },
    { ...PUSH_DOWN, hands: [[82, 89, 2.5], [82, 89, -2.5]], elbow: 'up' }] },
  incline: { move: 1.6, hold: 0.5, props: ['incline'], frames: [
    { hip: [65.3, 65.1], sh: [84, 50], hands: [[85, 75, 9], [85, 75, -9]], elbow: 'out', feet: [38, 87], toe: 75 },
    { hip: [70.2, 73.4], sh: [92.3, 64], hands: [[85, 75, 9], [85, 75, -9]], elbow: 'out', feet: [38, 87], toe: 75 }] },
  wallpush: { move: 1.6, hold: 0.5, props: ['wallR'], frames: [
    { hip: [59.1, 57.6], sh: [68, 36], hands: [[94, 37, 9], [94, 37, -9]], feet: [46, 89], toe: 15 },
    { hip: [65, 59.9], sh: [80, 40], hands: [[94, 37, 9], [94, 37, -9]], elbow: 'out', feet: [46, 89], toe: 15 }] },
  pike: { move: 1.6, hold: 0.5, frames: [
    { hip: [56, 56], sh: [79, 64], hands: [[81, 89, 9], [81, 89, -9]], feet: [40, 87], toe: 70 },
    { hip: [62, 58], sh: [80, 76], hands: [[82, 89, 9], [82, 89, -9]], elbow: 'out', feet: [40, 87], toe: 70 }] },
  bench: { move: 1.6, hold: 0.5, gear: 'bb', props: ['bench'], frames: [
    { ...BACK, hip: [58, 69], sh: [34, 69], hands: [[37, 58, 12], [37, 58, -12]], elbow: 'down', feet: [78, 89], knee: 'up' },
    { ...BACK, hip: [58, 69], sh: [34, 69], hands: [[35, 45, 12], [35, 45, -12]], elbow: 'down', feet: [78, 89], knee: 'up' }] },
  fly: { move: 1.6, hold: 0.5, gear: 'db', props: ['bench'], frames: [
    { hip: [58, 69], sh: [34, 69], hands: [[36, 70, 29], [36, 70, -29]], elbow: 'down', feet: [78, 89], knee: 'up' },
    { hip: [58, 69], sh: [34, 69], hands: [[36, 46, 4], [36, 46, -4]], elbow: 'out', feet: [78, 89], knee: 'up' }] },
  press: { move: 1.4, hold: 0.5, gear: 'db', frames: [
    { ...STAND, hands: [[63, 27, 13], [63, 27, -13]], elbow: 'down' },
    { ...STAND, hands: [[61, 6, 9], [61, 6, -9]], elbow: 'out' }] },
  tricepext: { move: 1.6, hold: 0.5, gear: 'kb', frames: [
    { ...STAND, hands: [[52, 20, 2], [52, 20, -2]], elbow: 'up' },
    { ...STAND, hands: [[61, 6, 2], [61, 6, -2]], elbow: 'up' }] },
  kickback: { move: 1.3, hold: 0.5, gear: 'db', frames: [
    { hip: [54, 56], t: 50, hands: { rel: [-3, 16] }, elbow: 'left', feet: [61, 89] },
    { hip: [54, 56], t: 50, hands: { rel: [-24, 4] }, elbow: 'up', feet: [61, 89] }] },
  dip: { move: 1.6, hold: 0.5, props: ['dipbars'], frames: [
    { hip: [60, 51], sh: [60, 27], hands: [[61, 53, 11], [61, 53, -11]], feet: [50, 77], knee: 'right', toe: 60 },
    { hip: [61, 64], sh: [61, 40], hands: [[61, 53, 11], [61, 53, -11]], elbow: 'left', feet: [51, 88], knee: 'right', toe: 60 }] },
  lateral: { move: 1.4, hold: 0.5, gear: 'db', view: 'front', frames: [
    { ...STAND, hands: [[61, 55, 10], [61, 55, -10]] },
    { ...STAND, hands: [[61, 31, 31], [61, 31, -31]], elbow: 'down' }] },
  frontraise: { move: 1.4, hold: 0.5, gear: 'db', frames: [
    { ...STAND },
    { ...STAND, hands: { rel: [24, 1] } }] },

  /* — Pull — */
  pull: { move: 1.6, hold: 0.5, props: ['bar'], frames: [
    { hip: [60, 54], t: 0, hands: [[60, 5, 14], [60, 5, -14]], feet: [50, 81], knee: 'right', toe: 70 },
    { hip: [61, 33], t: -3, hands: [[60, 5, 14], [60, 5, -14]], elbow: 'down', feet: [51, 60], knee: 'right', toe: 70 }] },
  row: { move: 1.3, hold: 0.5, gear: 'db', frames: [
    { hip: [52, 56], t: 62, hands: { rel: [1, 24] }, feet: [60, 89] },
    { hip: [52, 56], t: 62, hands: { rel: [-9, 10] }, elbow: 'up', feet: [60, 89] }] },
  curl: { move: 1.4, hold: 0.5, gear: 'db', frames: [
    { ...STAND },
    { ...STAND, hands: { rel: [5, 0] }, elbow: 'down' }] },
  shrug: { move: 1, hold: 0.6, gear: 'db', frames: [
    { ...STAND },
    { hip: [60, 54], sh: [60, 26.5], hands: { rel: [1, 24.5] }, feet: [61, 89] }] },
  pullapart: { move: 1.3, hold: 0.5, view: 'front', frames: [
    { ...STAND, hands: [[85, 30, 4], [85, 30, -4]] },
    { ...STAND, hands: [[64, 30, 31], [64, 30, -31]], elbow: 'down' }] },
  deadlift: { move: 1.6, hold: 0.5, gear: 'bb', frames: [
    { hip: [46, 66], t: 50, hands: { rel: [1, 24] }, feet: [62, 89] },
    { ...STAND, hands: { rel: [1, 24] } }] },
  rdl: { move: 1.7, hold: 0.5, gear: 'bb', frames: [
    { ...STAND, hands: { rel: [1, 24] } },
    { hip: [50, 55], t: 75, hands: { rel: [1, 24] }, feet: [61, 89] }] },
  kbswing: { move: 0.8, hold: 0.15, gear: 'kb', frames: [
    { hip: [50, 58], t: 62, hands: [[58, 66, 2], [58, 66, -2]], feet: [[61, 89, 9], [61, 89, -9]] },
    { ...STAND, hands: [[85, 31, 2], [85, 31, -2]], feet: [[61, 89, 9], [61, 89, -9]] }] },
  farmer: { move: 0.8, hold: 0, gear: 'db', view: 'side', frames: [
    { hip: [60, 54], t: 2, hands: { rel: [1, 24.5] }, feet: [[71, 89], [50, 89]], toe: [0, 20] },
    { hip: [60, 53], t: 2, hands: { rel: [1, 24.5] }, feet: [[50, 89], [71, 89]], toe: [20, 0] }] },

  /* — Core — */
  plank: { move: 1.6, hold: 0.8, frames: [
    { hip: [56.4, 79.5], sh: [80, 75], hands: [[93, 89, 6], [93, 89, -6]], elbow: 'down', feet: [22, 86], toe: 78 },
    { hip: [56.4, 80.3], sh: [80, 75], hands: [[93, 89, 6], [93, 89, -6]], elbow: 'down', feet: [22, 86], toe: 78 }] },
  situp: { move: 1.6, hold: 0.5, frames: [
    { ...BACK, hands: [[44, 82, 3], [44, 82, -3]], elbow: 'up', feet: [77, 89], knee: 'up' },
    { hip: [60, 86], sh: [52, 63], hands: [[60, 69, 3], [60, 69, -3]], elbow: 'down', feet: [77, 89], knee: 'up' }] },
  crunch: { move: 1.3, hold: 0.5, frames: [
    { ...BACK, hands: [[44, 82, 3], [44, 82, -3]], elbow: 'up', feet: [77, 89], knee: 'up' },
    { hip: [60, 86], sh: [41, 76], hands: [[49, 74, 3], [49, 74, -3]], elbow: 'up', feet: [77, 89], knee: 'up' }] },
  bikecrunch: { move: 0.8, hold: 0.2, frames: [
    { hip: [60, 86], sh: [42, 76], hands: [[36, 70, 10], [36, 70, -10]], elbow: 'out', feet: [[66, 70], [92, 80]], knee: ['up', 'up'], z: 0 },
    { hip: [60, 86], sh: [42, 76], hands: [[36, 70, 10], [36, 70, -10]], elbow: 'out', feet: [[92, 80], [66, 70]], knee: ['up', 'up'] }] },
  russian: { move: 1, hold: 0.25, frames: [
    { hip: [60, 85], sh: [50, 63], hands: [[57, 74, -4], [57, 74, -11]], feet: [82, 78], knee: 'up' },
    { hip: [60, 85], sh: [50, 63], hands: [[57, 74, 11], [57, 74, 4]], feet: [82, 78], knee: 'up' }] },
  legraise: { move: 1.8, hold: 0.5, frames: [
    { ...BACK, hands: [58, 89], elbow: 'up', feet: [94, 87] },
    { ...BACK, hands: [58, 89], elbow: 'up', feet: [66, 52], toe: -80 }] },
  deadbug: { move: 1.3, hold: 0.4, frames: [
    { ...BACK, hands: [36, 60], feet: [77, 68], knee: 'up', toe: -60 },
    { ...BACK, hands: [[12, 84, 7], [36, 60, -7]], feet: [[77, 68, 4.5], [94, 84, -4.5]], knee: 'up', toe: [-60, 0] },
    { ...BACK, hands: [36, 60], feet: [77, 68], knee: 'up', toe: -60 },
    { ...BACK, hands: [[36, 60, 7], [12, 84, -7]], feet: [[94, 84, 4.5], [77, 68, -4.5]], knee: 'up', toe: [0, -60] }] },
  superman: { move: 1.4, hold: 0.8, frames: [
    { ...PRONE, hands: [[12, 88, 8], [12, 88, -8]], feet: [94, 87] },
    { ...PRONE, sh: [37, 80], hands: [[14, 74, 8], [14, 74, -8]], feet: [93, 78] }] },
  climber: { move: 0.45, hold: 0.05, frames: [
    { ...PUSH_UP, feet: [[62, 83], [27.3, 86]], knee: ['down', 'right'], toe: [60, 78] },
    { ...PUSH_UP, feet: [[27.3, 86], [62, 83]], knee: ['right', 'down'], toe: [78, 60] }] },

  /* — Cardio & full body — */
  burpee: { move: 0.6, hold: 0.15, frames: [
    { ...STAND },
    { hip: [52, 74], t: 55, hands: [[80, 89, 9], [80, 89, -9]], elbow: 'up', feet: [62, 89] },
    { ...PUSH_UP, hands: [[80, 89, 9], [80, 89, -9]] },
    { hip: [52, 74], t: 55, hands: [[80, 89, 9], [80, 89, -9]], elbow: 'up', feet: [62, 89] },
    { hip: [60, 46], t: 0, hands: { rel: [1, -24] }, feet: [61, 82], toe: 55 }] },
  jack: { move: 0.45, hold: 0.08, view: 'front', frames: [
    { hip: [60, 54], t: 0, hands: [[60, 55, 10], [60, 55, -10]], feet: [[61, 89, 5], [61, 89, -5]] },
    { hip: [60, 56], t: 0, hands: [[60, 6, 13], [60, 6, -13]], feet: [[61, 89, 16], [61, 89, -16]], knee: 'out' }] },
  boxjump: { move: 0.45, hold: 0.15, props: ['jumpbox'], frames: [
    { hip: [46, 70], t: 40, hands: [40, 64], elbow: 'down', feet: [56, 89] },
    { hip: [62, 44], t: 10, hands: { rel: [6, -22] }, feet: [64, 66], toe: 30 },
    { hip: [74, 60], t: 30, hands: { rel: [14, 8] }, feet: [80, 75] },
    { hip: [80, 40], t: 0, hands: { rel: [1, 24.5] }, feet: [80, 75] }] },
  highknees: { move: 0.32, hold: 0.03, frames: [
    { hip: [60, 52], t: 2, hands: [{ rel: [-8, 12] }, { rel: [10, -2] }], feet: [[66, 64], [60, 89]], knee: 'right', toe: [30, 0] },
    { hip: [60, 52], t: 2, hands: [{ rel: [10, -2] }, { rel: [-8, 12] }], feet: [[60, 89], [66, 64]], knee: 'right', toe: [0, 30] }] },
  boxing: { move: 0.28, hold: 0.12, frames: [
    { hip: [60, 56], t: 6, hands: { rel: [9, -3] }, elbow: 'down', feet: [[68, 89], [52, 89]], toe: [0, 20] },
    { hip: [60, 56], t: 8, hands: [{ rel: [25, -2] }, { rel: [9, -3] }], elbow: 'down', feet: [[68, 89], [52, 89]], toe: [0, 20] },
    { hip: [60, 56], t: 6, hands: { rel: [9, -3] }, elbow: 'down', feet: [[68, 89], [52, 89]], toe: [0, 20] },
    { hip: [60, 56], t: 8, hands: [{ rel: [9, -3] }, { rel: [25, -2] }], elbow: 'down', feet: [[68, 89], [52, 89]], toe: [0, 20] }] },
  battlerope: { move: 0.25, hold: 0, frames: [
    { hip: [54, 64], t: 25, hands: [[78, 46, 7], [78, 64, -7]], feet: [62, 89] },
    { hip: [54, 64], t: 25, hands: [[78, 64, 7], [78, 46, -7]], feet: [62, 89] }] },
  rope: { move: 0.35, hold: 0.05, frames: [
    { hip: [60, 52], t: 0, hands: [[67, 72, 12], [67, 72, -12]], feet: [61, 86], toe: 50 },
    { hip: [60, 47], t: 0, hands: [[67, 67, 12], [67, 67, -12]], feet: [61, 81], toe: 50 }] },
  run: { move: 0.42, hold: 0, view: 'side', frames: [
    { hip: [60, 55], t: 12, hands: [[55, 44], [74, 36]], elbow: ['left', 'down'], feet: [[72, 88], [44, 80]], toe: [0, 40] },
    { hip: [60, 53], t: 12, hands: [[74, 36], [55, 44]], elbow: ['down', 'left'], feet: [[44, 80], [72, 88]], toe: [40, 0] }] },
  walk: { move: 0.75, hold: 0, view: 'side', frames: [
    { hip: [60, 54], t: 4, hands: [[56, 54], [68, 53]], feet: [[71, 89], [50, 89]], toe: [0, 20] },
    { hip: [60, 53], t: 4, hands: [[68, 53], [56, 54]], feet: [[50, 89], [71, 89]], toe: [20, 0] }] },
  bike: { move: 0.2, hold: 0, view: 'side', props: ['bike'], frames: [-90, -45, 0, 45, 90, 135, 180, 225].map((a) => {
    const r = (a * Math.PI) / 180, c = [64, 74], R = 7;
    return { hip: [52, 49], t: 28, hands: [84, 41], feet: [[c[0] + Math.cos(r) * R, c[1] + Math.sin(r) * R], [c[0] - Math.cos(r) * R, c[1] - Math.sin(r) * R]] };
  }) },
  rower: { move: 1.1, hold: 0.2, view: 'side', props: ['rower'], gear: 'cable', frames: [
    { hip: [40, 82], t: 25, hands: [72, 64], feet: [60, 84], knee: 'up', toe: -60 },
    { hip: [27, 82], t: -25, hands: { rel: [9, 8] }, elbow: 'down', feet: [60, 84], knee: 'up', toe: -60 }] },
  swim: { move: 0.7, hold: 0, view: 'side', props: ['water'], frames: [
    { hip: [50, 62], sh: [74, 62], hands: [[98, 61], [56, 68]], elbow: ['up', 'down'], feet: [[17, 60], [17, 66]], toe: [180, 180] },
    { hip: [50, 62], sh: [74, 62], hands: [[56, 68], [98, 61]], elbow: ['down', 'up'], feet: [[17, 66], [17, 60]], toe: [180, 180] }] },

  /* — Stretch — */
  stretch: { move: 1.8, hold: 1.2, frames: [
    { ...STAND, hands: { rel: [1, -24] } },
    { hip: [56, 54], t: 140, hands: [75, 90], feet: [60, 89] }] },
  foamroll: { move: 1.4, hold: 0.2, props: ['roller'], frames: [
    { hip: [48, 82], t: -38, hands: [30, 89], elbow: 'left', feet: [83, 82], knee: 'up' },
    { hip: [60, 82], t: -38, hands: [42, 89], elbow: 'left', feet: [95, 82], knee: 'up' }] },
};

/* Which move each exercise uses + 3 short steps */
const HOW = {
  pushup:    ['pushup', 'Hands under shoulders. Body straight like a board.', 'Bend your elbows back. Lower your chest close to the floor.', 'Push back up. Don’t let your hips sag.'],
  diamond:   ['diamond', 'Hands close together under your chest.', 'Lower slowly, elbows tight to your sides.', 'Push back up. Keep your body straight.'],
  incline:   ['incline', 'Hands on a bench or step, body straight.', 'Lower your chest to the edge.', 'Push back up. Easier than floor push-ups.'],
  wallpush:  ['wallpush', 'Hands on the wall at shoulder height.', 'Lean in and bend your elbows.', 'Push back to start. Great for beginners.'],
  pike:      ['pike', 'Hips high, body like an upside-down V.', 'Bend your elbows to bring your head toward the floor.', 'Push back up through your shoulders.'],
  pullup:    ['pull', 'Hang from the bar, palms facing away.', 'Pull until your chin is over the bar.', 'Lower slowly all the way down.'],
  chinup:    ['pull', 'Hang from the bar, palms facing you.', 'Pull until your chin is over the bar.', 'Lower slowly all the way down.'],
  squat:     ['squat', 'Feet shoulder-width apart, arms out.', 'Sit back like into a chair. Chest up.', 'Push through your heels to stand.'],
  goblet:    ['goblet', 'Hold a weight at your chest.', 'Sit down between your knees. Chest up.', 'Push through your heels to stand.'],
  sumo:      ['sumo', 'Feet wide, toes turned out.', 'Sit straight down. Push knees out.', 'Stand up and squeeze your glutes.'],
  jumpsquat: ['jumpsquat', 'Squat down, arms back.', 'Jump up as high as you can.', 'Land softly and go right into the next squat.'],
  lunge:     ['lunge', 'Stand tall, hands on hips.', 'Step forward. Drop your back knee toward the floor.', 'Push back up. Switch legs.'],
  bulgarian: ['bulgarian', 'Back foot up on a bench behind you.', 'Lower straight down on your front leg.', 'Push up through your front heel.'],
  latlunge:  ['latlunge', 'Stand with feet together.', 'Step wide to one side and sit into that hip.', 'Keep the other leg straight. Push back.'],
  wallsit:   ['wallsit', 'Back flat against a wall.', 'Slide down until knees are bent 90°.', 'Hold. Keep knees over ankles.'],
  dip:       ['dip', 'Hold the bars with straight arms.', 'Bend your elbows back to lower your body.', 'Press back up until arms are straight.'],
  burpee:    ['burpee', 'Squat down and put your hands on the floor.', 'Jump your feet back to a push-up spot.', 'Jump feet in, then jump up tall.'],
  bridge:    ['bridge', 'Lie on your back, knees bent, feet flat.', 'Squeeze your glutes and lift your hips.', 'Hold a second, then lower down.'],
  hipthrust: ['hipthrust', 'Upper back on a bench, weight on your hips.', 'Drive your hips up until your body is flat.', 'Squeeze at the top. Lower slowly.'],
  calfraise: ['calf', 'Stand tall with feet hip-width.', 'Rise up onto your toes.', 'Pause, then lower your heels slowly.'],
  jumpjack:  ['jack', 'Stand with feet together, arms down.', 'Jump feet out and swing arms overhead.', 'Jump back in. Keep a steady beat.'],
  stepup:    ['stepup', 'Face a sturdy step or bench.', 'Step up and stand all the way tall.', 'Step down slowly. Switch legs.'],
  boxjump:   ['boxjump', 'Stand facing a sturdy box.', 'Swing your arms and jump onto it.', 'Land softly. Step down. Repeat.'],
  bench:     ['bench', 'Lie on the bench, feet flat on the floor.', 'Lower the bar to your mid chest.', 'Press it straight back up.'],
  fly:       ['fly', 'Lie on a bench, weights above your chest.', 'Open your arms wide with a soft bend.', 'Squeeze them back together, like a hug.'],
  ohp:       ['press', 'Hold weights at your shoulders.', 'Press straight up overhead.', 'Lower back to your shoulders.'],
  row:       ['row', 'Bend at the hips, back flat.', 'Pull the weight up to your hip.', 'Lower it slowly. Don’t round your back.'],
  pulldown:  ['pull', 'Sit tall and grab the bar wide.', 'Pull the bar down to your upper chest.', 'Let it rise slowly.'],
  curl:      ['curl', 'Stand tall, elbows at your sides.', 'Curl the weight up to your shoulders.', 'Lower slowly. Don’t swing.'],
  hammer:    ['curl', 'Hold weights with palms facing in.', 'Curl up, keeping thumbs on top.', 'Lower slowly. Elbows stay still.'],
  tricepext: ['tricepext', 'Hold one weight overhead with both hands.', 'Bend your elbows to lower it behind your head.', 'Straighten your arms back up.'],
  kickback:  ['kickback', 'Bend forward, elbow up by your side.', 'Straighten your arm back.', 'Bend it back in slowly.'],
  lateral:   ['lateral', 'Stand tall, weights at your sides.', 'Lift your arms out to shoulder height.', 'Lower slowly.'],
  frontraise:['frontraise', 'Stand tall, weights in front of your legs.', 'Lift straight arms to shoulder height.', 'Lower slowly. No swinging.'],
  shrug:     ['shrug', 'Stand tall, weights at your sides.', 'Lift your shoulders up to your ears.', 'Hold a second, then drop them.'],
  pullapart: ['pullapart', 'Hold a band straight out in front.', 'Pull it apart until arms are out wide.', 'Squeeze your shoulder blades. Return slowly.'],
  deadlift:  ['deadlift', 'Feet under the bar, back flat.', 'Push hips back and grab the bar.', 'Stand up tall by driving your hips forward.'],
  rdl:       ['rdl', 'Stand tall holding the bar.', 'Push hips back, knees soft, bar close to your legs.', 'Stop at mid-shin. Stand back up.'],
  bbsquat:   ['bbsquat', 'Bar rests on your upper back.', 'Sit back and down, chest up.', 'Push through your heels to stand.'],
  legpress:  ['squat', 'Feet flat on the plate, hip-width.', 'Bend your knees to about 90°.', 'Push back. Don’t lock your knees.'],
  legcurl:   ['legcurl', 'Lie face down, pad behind your ankles.', 'Curl your heels toward your butt.', 'Lower slowly.'],
  kbswing:   ['kbswing', 'Feet wide, kettlebell between your legs.', 'Snap your hips forward to swing it up.', 'Let it swing back and repeat.'],
  farmer:    ['farmer', 'Hold heavy weights at your sides.', 'Stand tall, shoulders back.', 'Walk with short, steady steps.'],
  plank:     ['plank', 'Forearms on the floor under your shoulders.', 'Body straight from head to heels.', 'Hold. Breathe. Don’t let hips drop.'],
  situp:     ['situp', 'Lie down, knees bent, hands on chest.', 'Curl up until you’re sitting.', 'Lower back down slowly.'],
  crunch:    ['crunch', 'Lie down, knees bent, hands on chest.', 'Lift your shoulders off the floor.', 'Lower slowly. Keep your neck relaxed.'],
  bikecrunch:['bikecrunch', 'Lie down, hands behind your head.', 'Bring one knee in as you lift your shoulders.', 'Switch sides like pedaling a bike.'],
  deadbug:   ['deadbug', 'Lie on your back, arms up, knees bent over hips.', 'Lower one arm and the other leg toward the floor.', 'Come back and switch. Keep your back flat.'],
  superman:  ['superman', 'Lie face down, arms stretched forward.', 'Lift your arms, chest, and legs a little.', 'Hold 2 seconds. Lower slowly.'],
  climber:   ['climber', 'Start in a push-up spot.', 'Drive one knee to your chest.', 'Switch fast, like running in place.'],
  legraise:  ['legraise', 'Lie flat, hands by your sides.', 'Lift straight legs up toward the ceiling.', 'Lower slowly. Keep your back flat.'],
  russian:   ['russian', 'Sit, lean back a little, feet up.', 'Twist your hands to one side.', 'Twist to the other side. Keep it slow.'],
  highknees: ['highknees', 'Stand tall.', 'Run in place, knees up to hip height.', 'Pump your arms. Stay on your toes.'],
  boxing:    ['boxing', 'Stand sideways a bit, hands up by your face.', 'Punch straight out, then pull back fast.', 'Switch hands. Keep moving your feet.'],
  battlerope:['battlerope', 'Half squat, a rope end in each hand.', 'Whip your arms up and down, one at a time.', 'Keep your core tight and breathe.'],
  run:       ['run', 'Stand tall, relaxed shoulders.', 'Land softly under your hips.', 'Swing your arms. Breathe steady.'],
  walk:      ['walk', 'Stand tall, look ahead.', 'Swing your arms as you walk.', 'Walk fast enough to breathe a bit harder.'],
  hike:      ['walk', 'Wear good shoes. Bring water.', 'Take shorter steps going uphill.', 'Lean forward a little on climbs.'],
  bike:      ['bike', 'Seat at hip height.', 'Push the pedals in smooth circles.', 'Keep a pace you can hold.'],
  rower:     ['rower', 'Push with your legs first.', 'Then lean back and pull the handle in.', 'Reverse: arms, body, then legs.'],
  rope:      ['rope', 'Hold handles at hip height.', 'Small jumps on the balls of your feet.', 'Turn the rope with your wrists.'],
  swim:      ['swim', 'Pick a stroke you know.', 'Long, smooth pulls with your arms.', 'Breathe every few strokes.'],
  stairs:    ['stepup', 'Stand tall, light grip on the rail.', 'Step with your whole foot.', 'Keep a steady pace.'],
  elliptical:['walk', 'Stand tall, hold the handles.', 'Push and pull in smooth strides.', 'Keep a pace you can hold.'],
  hiit:      ['jack', 'Short bursts of hard work.', 'Then short rests.', 'Repeat. Go hard but stay safe.'],
  dance:     ['jack', 'Pick music you like.', 'Keep moving the whole song.', 'Bigger moves burn more.'],
  sport:     ['run', 'Warm up first.', 'Play hard, drink water.', 'Cool down and stretch after.'],
  pilates:   ['deadbug', 'Move slow and controlled.', 'Keep your belly pulled in.', 'Breathe out on the hard part.'],
  yoga:      ['stretch', 'Move slowly into each pose.', 'Breathe deep through your nose.', 'Never push into pain.'],
  stretch:   ['stretch', 'Warm up a little first.', 'Reach up tall, then fold forward slowly.', 'Hold 20–30 seconds. No bouncing.'],
  foamroll:  ['foamroll', 'Put the roller under a tight muscle.', 'Roll slowly back and forth.', 'Pause on sore spots for a few breaths.'],
};

/* ===== Camera ===== */
const VIEWS = { side: 8, angle: 40, front: 90 };
const FOCAL = 240;
function cam(view) {
  const th = ((VIEWS[view] ?? VIEWS.angle) * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  return (p) => {
    const x = p[0] - 60, z = p[2], D = x * s + z * c, f = FOCAL / (FOCAL - D);
    return { X: 60 + (x * c - z * s) * f, Y: 52 + (p[1] - 52) * f, D, f };
  };
}

/* ===== Build the animated SVG ===== */
function howSVG(kind, view) {
  const fig = FIG[kind]; if (!fig) return '';
  view = view || fig.view || 'angle';
  const P = cam(view), poses = fig.frames.map(solve);
  // timeline: hold at each pose, move to the next, … and back to the first
  const seq = [], times = []; let t = 0;
  poses.forEach((_, i) => { seq.push(i); times.push(t); if (fig.hold) { t += fig.hold; seq.push(i); times.push(t); } t += fig.move; });
  seq.push(0); times.push(t);
  const keyTimes = times.map((x) => (x / t).toFixed(4)).join(';'), splines = seq.slice(1).map(() => '.45 0 .55 1').join(';');
  const anim = (attr, vals) => `<animate attributeName="${attr}" values="${vals.join(';')}" keyTimes="${keyTimes}" calcMode="spline" keySplines="${splines}" dur="${t.toFixed(2)}s" repeatCount="indefinite"/>`;
  const pts = (arr) => arr.map((q) => { const r = P(q); return `${r.X.toFixed(1)},${r.Y.toFixed(1)}`; }).join(' ');
  const depth = (arr) => arr.reduce((s, q) => s + P(q).D, 0) / arr.length;

  // body parts (each a polyline of 3D joints), drawn back to front
  const parts = [
    { get: (p) => [p.Sx[0], p.Sx[1]], w: 4 }, { get: (p) => [p.S, p.H], w: 5 }, { get: (p) => [p.Hx[0], p.Hx[1]], w: 4 },
    { get: (p) => [p.Sx[0], p.E[0], p.W[0]] }, { get: (p) => [p.Sx[1], p.E[1], p.W[1]] },
    { get: (p) => [p.Hx[0], p.K[0], p.A[0], p.T[0]] }, { get: (p) => [p.Hx[1], p.K[1], p.A[1], p.T[1]] },
  ];
  const items = parts.map((pt) => {
    const d = depth(pt.get(poses[0]));
    const vals = seq.map((i) => pts(pt.get(poses[i])));
    return { d, svg: `<polyline class="${d < -2 ? 'far' : ''}" ${pt.w ? `style="stroke-width:${pt.w}"` : ''} points="${vals[0]}">${anim('points', vals)}</polyline>` };
  });
  const headVals = seq.map((i) => P(poses[i].Hd));
  items.push({ d: depth([poses[0].Hd]) + 0.5, svg: `<circle class="head" r="${(5.5 * headVals[0].f).toFixed(1)}" cx="${headVals[0].X.toFixed(1)}" cy="${headVals[0].Y.toFixed(1)}">${anim('cx', headVals.map((h) => h.X.toFixed(1)))}${anim('cy', headVals.map((h) => h.Y.toFixed(1)))}</circle>` });

  // gear in the hands
  const dot = (get, r, cls, d = 0) => {
    const v = seq.map((i) => P(get(poses[i])));
    items.push({ d: depth([get(poses[0])]) + d, svg: `<circle class="${cls}" r="${(r * v[0].f).toFixed(1)}" cx="${v[0].X.toFixed(1)}" cy="${v[0].Y.toFixed(1)}">${anim('cx', v.map((q) => q.X.toFixed(1)))}${anim('cy', v.map((q) => q.Y.toFixed(1)))}</circle>` });
  };
  const mid = (p) => V.mul(V.add(p.W[0], p.W[1]), 0.5);
  if (fig.gear === 'db') { dot((p) => p.W[0], 3.2, 'gear', 0.3); dot((p) => p.W[1], 3.2, 'gear', 0.3); }
  if (fig.gear === 'kb') dot((p) => V.add(mid(p), [0, 4, 0]), 4.5, 'gear', 0.3);
  if (fig.gear === 'bb') {
    const ends = (p) => { const m = mid(p); return [V.add(m, [0, 0, 18]), V.add(m, [0, 0, -18])]; };
    const vals = seq.map((i) => pts(ends(poses[i])));
    items.push({ d: 99, svg: `<polyline class="barbell" points="${vals[0]}">${anim('points', vals)}</polyline>` });
    const th = ((VIEWS[view] ?? 40) * Math.PI) / 180, rx = Math.max(1.6, 8 * Math.abs(Math.cos(th)));
    [0, 1].forEach((k) => {
      const v = seq.map((i) => P(ends(poses[i])[k]));
      items.push({ d: v[0].D, svg: `<ellipse class="plate" rx="${rx.toFixed(1)}" ry="8" cx="${v[0].X.toFixed(1)}" cy="${v[0].Y.toFixed(1)}">${anim('cx', v.map((q) => q.X.toFixed(1)))}${anim('cy', v.map((q) => q.Y.toFixed(1)))}</ellipse>` });
    });
  }
  if (fig.gear === 'cable') {
    const vals = seq.map((i) => pts([mid(poses[i]), [86, 76, 0]]));
    items.push({ d: -50, svg: `<polyline class="cable" points="${vals[0]}">${anim('points', vals)}</polyline>` });
  }
  items.sort((a, b) => a.d - b.d);

  const floor = pts([[2, 91, -30], [118, 91, -30], [118, 91, 30], [2, 91, 30]]);
  const props = (fig.props || []).flatMap((k) => PROPS[k]).map((line) => `<polyline points="${pts(line)}"/>`).join('');
  return `<svg class="how-fig" viewBox="0 -14 120 112" aria-hidden="true">
    <polygon class="floor" points="${floor}"/>
    <g class="props">${props}</g>
    ${items.map((x) => x.svg).join('')}
  </svg>`;
}

/* Panel shown under an exercise: figure + view switch + steps */
function howPanel(exId, view, i) {
  const h = HOW[exId]; if (!h) return '';
  const fig = FIG[h[0]], v = view || (fig && fig.view) || 'angle', slow = fig && fig.move >= 1;
  const btn = (k, label) => `<button type="button" class="${v === k ? 'on' : ''}" data-wk="view" data-i="${i}" data-v="${k}">${label}</button>`;
  return `<div class="how">${howSVG(h[0], v)}
    <div class="how-views">${btn('side', 'Side')}${btn('angle', 'Angle')}${btn('front', 'Front')}</div>
    <ol>${h.slice(1).map((s) => `<li>${s}</li>`).join('')}</ol>
    ${slow ? '<p class="how-tempo">Slow and controlled. Pause at each end.</p>' : ''}</div>`;
}
