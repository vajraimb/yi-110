/**
 * Exact 4^6 = 4096 casts. Two tapes: the 之卦 is planted in one,
 * the other keeps the same background phase and the same rule.
 * Families come from the six-cell ring (see scripts/ring64.ml).
 * The six pure permutations 15, 51, 85, 170, 204, 240 are not used
 * as the unsettled family. 204 may still sit in the fixed-point family.
 *
 * JS has run this acceptance. OCaml has not been compiled here.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const PERM = new Set([15, 51, 85, 170, 204, 240]);
const CYCLE = [0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1];
const WIDTH = 126;
const LINES = [6, 7, 8, 9];
const SAFE_STEPS = WIDTH - 6;

function ringNext(rule, state) {
  let out = 0;
  for (let i = 0; i < 6; i++) {
    const left = (state >> ((i + 5) % 6)) & 1;
    const center = (state >> i) & 1;
    const right = (state >> ((i + 1) % 6)) & 1;
    if ((rule >> ((left << 2) | (center << 1) | right)) & 1) out |= 1 << i;
  }
  return out;
}

function analyze(rule) {
  const image = new Set();
  const reaches = new Uint8Array(64);
  let maxCycle = 1;
  for (let s = 0; s < 64; s++) {
    image.add(ringNext(rule, s));
    const seen = new Map();
    let x = s;
    for (let t = 0; t < 96; t++) {
      if (x === 0) reaches[s] = 1;
      if (seen.has(x)) {
        maxCycle = Math.max(maxCycle, t - seen.get(x));
        break;
      }
      seen.set(x, t);
      x = ringNext(rule, x);
    }
  }
  let basin = 0;
  let moves = 0;
  for (let s = 0; s < 64; s++) {
    basin += reaches[s];
    if (ringNext(rule, s) !== s) moves += 1;
  }
  const late = new Set();
  for (let s = 0; s < 64; s++) {
    let x = s;
    for (let t = 0; t < 45; t++) x = ringNext(rule, x);
    late.add(x);
  }
  return { image: image.size, basin, maxCycle, late: late.size, moves };
}

const table = Buffer.alloc(256 * 64);
for (let rule = 0; rule < 256; rule++) {
  for (let state = 0; state < 64; state++) table[rule * 64 + state] = ringNext(rule, state);
}
const tableHash = createHash("sha256").update(table).digest("hex");

const analyzed = Array.from({ length: 256 }, (_, rule) => ({ rule, ...analyze(rule) }));
const settleRing = analyzed
  .filter(
    (a) =>
      a.basin <= 1 &&
      a.maxCycle === 1 &&
      a.late >= 16 &&
      a.moves >= 32 &&
      a.rule !== 0 &&
      a.rule !== 255 &&
      a.rule !== 204,
  )
  .map((a) => a.rule);
let settle = [196, 236];
if (settle.some((rule) => !settleRing.includes(rule))) {
  throw new Error("chosen fixed-point rules left the ring list");
}
const open = analyzed
  .filter(
    (a) =>
      !PERM.has(a.rule) &&
      a.basin <= 4 &&
      a.maxCycle === 6 &&
      a.image === 32 &&
      a.late === 16,
  )
  .map((a) => a.rule);

function yang(value) {
  return value === 7 || value === 9;
}
function changes(value) {
  return value === 6 || value === 9;
}
function pop(key) {
  let n = 0;
  for (let i = 0; i < 6; i++) n += (key >> i) & 1;
  return n;
}
function ruleFor(zhi) {
  const family = pop(zhi) >= 4 ? open : settle;
  return family[(Math.imul(zhi, 17) + 3) % family.length];
}
function decode(index) {
  const lines = [];
  let x = index;
  for (let i = 0; i < 6; i++) {
    lines.push(LINES[x % 4]);
    x = Math.floor(x / 4);
  }
  let zhi = 0;
  for (let i = 0; i < 6; i++) {
    const bit = changes(lines[i]) ? !yang(lines[i]) : yang(lines[i]);
    if (bit) zhi |= 1 << i;
  }
  return { zhi, clock: lines.reduce((sum, n) => sum + n, 0) };
}

function paint(zhi, background, plant) {
  const row = new Uint8Array(WIDTH);
  const origin = (WIDTH - 6) >> 1;
  if (background === "cycle") {
    for (let i = 0; i < WIDTH; i++) {
      const phase = (i - origin) % CYCLE.length;
      row[i] = CYCLE[(phase + CYCLE.length) % CYCLE.length];
    }
  }
  if (plant) {
    for (let i = 0; i < 6; i++) row[origin + i] = (zhi >> i) & 1;
  }
  return row;
}
function step(row, rule, periodic) {
  const next = new Uint8Array(WIDTH);
  for (let i = 0; i < WIDTH; i++) {
    const left = periodic ? row[(i + WIDTH - 1) % WIDTH] : i > 0 ? row[i - 1] : 0;
    const right = periodic ? row[(i + 1) % WIDTH] : i + 1 < WIDTH ? row[i + 1] : 0;
    next[i] = (rule >> ((left << 2) | (row[i] << 1) | right)) & 1;
  }
  return next;
}
function read(row) {
  const origin = (WIDTH - 6) >> 1;
  let key = 0;
  for (let i = 0; i < 6; i++) if (row[origin + i]) key |= 1 << i;
  return key;
}
function entropy(counts, total) {
  let h = 0;
  for (const count of counts) {
    if (!count) continue;
    const p = count / total;
    h -= p * Math.log2(p);
  }
  return h;
}

function blankRule() {
  return {
    n: 0,
    differStop: 0,
    planted: 0,
    plantedDiffer: 0,
    differSteps: 0,
    steps: 0,
    counts: new Uint32Array(64),
    zhis: new Set(),
    values: new Set(),
    moved: 0,
  };
}

function run(background) {
  const byRule = new Map();
  for (const rule of [...settle, ...open]) byRule.set(rule, blankRule());
  const familyCounts = { settle: new Uint32Array(64), open: new Uint32Array(64) };
  const familyN = { settle: 0, open: 0 };
  const hit = new Set();
  for (let index = 0; index < 4096; index++) {
    const cast = decode(index);
    const kind = pop(cast.zhi) >= 4 ? "open" : "settle";
    const rule = ruleFor(cast.zhi);
    hit.add(rule);
    const bucket = byRule.get(rule);
    const periodic = background === "cycle";
    let planted = paint(cast.zhi, background, true);
    let control = paint(cast.zhi, background, false);
    const plantedAtStart = read(planted) !== read(control);
    if (plantedAtStart) bucket.planted += 1;
    for (let g = 0; g < cast.clock; g++) {
      planted = step(planted, rule, periodic);
      control = step(control, rule, periodic);
      bucket.steps += 1;
      if (read(planted) !== read(control)) bucket.differSteps += 1;
    }
    const value = read(planted);
    const other = read(control);
    bucket.n += 1;
    if (value !== other) bucket.differStop += 1;
    if (plantedAtStart && value !== other) bucket.plantedDiffer += 1;
    bucket.counts[value] += 1;
    bucket.zhis.add(cast.zhi);
    bucket.values.add(value);
    if (value !== cast.zhi) bucket.moved += 1;
    familyCounts[kind][value] += 1;
    familyN[kind] += 1;
  }
  const rules = {};
  for (const [rule, bucket] of byRule) {
    let max = 0;
    for (const count of bucket.counts) if (count > max) max = count;
    rules[rule] = {
      n: bucket.n,
      diffStop: Number((bucket.differStop / bucket.n).toFixed(4)),
      diffIfPlanted: Number((bucket.planted ? bucket.plantedDiffer / bucket.planted : 0).toFixed(4)),
      diffAlong: Number((bucket.differSteps / bucket.steps).toFixed(4)),
      maxShare: Number((max / bucket.n).toFixed(4)),
      zhiN: bucket.zhis.size,
      valueN: bucket.values.size,
      moved: Number((bucket.moved / bucket.n).toFixed(4)),
    };
  }
  return {
    background,
    settle: {
      n: familyN.settle,
      entropy: Number(entropy(familyCounts.settle, familyN.settle).toFixed(3)),
    },
    open: {
      n: familyN.open,
      entropy: Number(entropy(familyCounts.open, familyN.open).toFixed(3)),
    },
    rules,
    missed: [...settle, ...open].filter((rule) => !hit.has(rule)),
  };
}

function carries(row) {
  return row.diffIfPlanted >= 0.95 && row.moved >= 0.5 && (row.zhiN <= 1 || row.valueN > 1);
}

let cycle = run("cycle");
const zero = run("zero");
if (cycle.missed.length || zero.missed.length) {
  throw new Error(`unselected rules cycle=${cycle.missed.join(",")} zero=${zero.missed.join(",")}`);
}
for (const rule of open) {
  if (!carries(cycle.rules[rule])) {
    throw new Error(`open rule ${rule} loses the plant ${JSON.stringify(cycle.rules[rule])}`);
  }
}
for (const rule of settle) {
  if (!carries(cycle.rules[rule])) {
    throw new Error(`settle rule ${rule} loses the plant ${JSON.stringify(cycle.rules[rule])}`);
  }
}

const report = {
  status: "JS 版已跑验收，OCaml 版的一致性待验证",
  tableHash,
  width: WIDTH,
  safeSteps: SAFE_STEPS,
  inputs: 4096,
  cyclePattern: "00010011011111",
  settleRing,
  settle,
  open,
  index: "(zhi * 17 + 3) mod familySize",
  cycle,
  zero,
};
console.log(JSON.stringify(report, null, 2));
writeFileSync(new URL("./accept-report.json", import.meta.url), JSON.stringify(report, null, 2));
writeFileSync(new URL("../src/lib/ring-table.sha256", import.meta.url), `${tableHash}\n`);
