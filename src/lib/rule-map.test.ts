import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { drawLine } from "./yarrow.ts";
import {
  FAMILY_SHA256,
  OPEN_RULES,
  RING_TABLE_SHA256,
  RULE_110_CYCLE,
  SETTLE_RULES,
  paintBackground,
  paintTape,
  readWindow,
  ruleForZhi,
  temperamentOf,
} from "./rule-map.ts";

function ringNext(rule: number, state: number): number {
  let out = 0;
  for (let i = 0; i < 6; i++) {
    const left = (state >> ((i + 5) % 6)) & 1;
    const center = (state >> i) & 1;
    const right = (state >> ((i + 1) % 6)) & 1;
    if ((rule >> ((left << 2) | (center << 1) | right)) & 1) out |= 1 << i;
  }
  return out;
}

describe("阳数补全", () => {
  it("keeps pure permutations out of the additive family and still reaches every chosen rule", () => {
    for (const rule of [15, 51, 85, 170, 204, 240]) {
      assert.equal(OPEN_RULES.includes(rule), false);
      assert.equal(SETTLE_RULES.includes(rule), false);
    }
    const seen = { settle: new Set<number>(), open: new Set<number>() };
    for (let key = 0; key < 64; key++) {
      const rule = ruleForZhi(key);
      seen[temperamentOf(key)].add(rule);
    }
    assert.deepEqual([...seen.open].sort((a, b) => a - b), [...OPEN_RULES]);
    assert.deepEqual([...seen.settle].sort((a, b) => a - b), [...SETTLE_RULES]);
  });

  it("changes the window only on the planted tape", () => {
    const background = paintBackground(128, "cycle");
    const planted = paintTape(128, 0b101001, "cycle");
    assert.notEqual(readWindow(planted), readWindow(background));
    assert.equal(readWindow(paintTape(128, readWindow(background), "cycle")), readWindow(background));
  });

  it("hashes the 256 by 64 ring table to the stored value", () => {
    const table = Buffer.alloc(256 * 64);
    for (let rule = 0; rule < 256; rule++) {
      for (let state = 0; state < 64; state++) table[rule * 64 + state] = ringNext(rule, state);
    }
    const hash = createHash("sha256").update(table).digest("hex");
    assert.equal(hash, RING_TABLE_SHA256);
  });

  it("hashes the chosen families, the index, and the background phase", () => {
    const text = [
      `settle:${SETTLE_RULES.join(",")}`,
      `open:${OPEN_RULES.join(",")}`,
      "index:(zhi*17+3)%family",
      `cycle:${RULE_110_CYCLE.join("")}`,
      "phase:window-origin-0",
      "boundary:periodic-when-cycle",
    ].join("\n");
    assert.equal(createHash("sha256").update(text).digest("hex"), FAMILY_SHA256);
  });

  it("draws a yarrow line from the sixteen classical tickets", () => {
    const counts = { 6: 0, 7: 0, 8: 0, 9: 0 };
    let state = 110;
    const rng = () => {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < 16000; i++) counts[drawLine(rng)] += 1;
    assert.ok(Math.abs(counts[6] / 16000 - 1 / 16) < 0.01);
  });
});
