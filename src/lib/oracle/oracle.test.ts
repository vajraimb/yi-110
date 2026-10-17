import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { HEX_BY_KEY, HEX_BY_KING } from "../iching.ts";
import { caCast, parseCastId, yarrowCast, yarrowId } from "./cast.ts";
import { FUXI_GRID, fuxiOrdinal } from "./fuxi.ts";
import { readCast } from "./reading.ts";
import { nuclearKey, oppositeKey, reverseKey } from "./relations.ts";
import { sha256, toHex } from "./sha256.ts";
import { lineTitle, textOf } from "./texts.ts";
import {
  initialRing,
  keyOfLines,
  readHead,
  seedFromHex,
  seedFromQuestion,
  stepRing,
} from "./universe.ts";

describe("sha256", () => {
  it("matches node for a few inputs", () => {
    for (const input of ["", "abc", "问：今日宜否出行？\n2026-10-17T07:00:00.000Z\nabcd1234"]) {
      assert.equal(toHex(sha256(input)), createHash("sha256").update(input).digest("hex"));
    }
  });
});

describe("texts", () => {
  it("has a judgment, an image and six lines for every hexagram", () => {
    for (let king = 1; king <= 64; king++) {
      const t = textOf(king);
      assert.ok(t.judgment.length > 0, `${king} judgment`);
      assert.ok(t.image.length > 0, `${king} image`);
      assert.equal(t.lines.length, 6);
      for (const line of t.lines) assert.ok(line.length > 0, `${king} line`);
      assert.ok(t.keyword.length >= 2);
    }
    assert.ok(textOf(1).extra?.startsWith("用九"));
    assert.ok(textOf(2).extra?.startsWith("用六"));
    assert.equal(textOf(3).extra, undefined);
  });

  it("names the image after the hexagram (乾 says 天行健 instead)", () => {
    for (let king = 2; king <= 64; king++) {
      const hex = HEX_BY_KING[king];
      assert.ok(
        textOf(king).image.includes(hex.name),
        `${king} ${hex.name}: ${textOf(king).image}`,
      );
    }
  });

  it("titles lines by position and polarity", () => {
    assert.equal(lineTitle(0, true), "初九");
    assert.equal(lineTitle(1, false), "六二");
    assert.equal(lineTitle(5, false), "上六");
  });
});

describe("relations", () => {
  it("computes 互卦 错卦 综卦", () => {
    const qian = 63;
    assert.equal(nuclearKey(qian), qian);
    assert.equal(oppositeKey(qian), 0);
    assert.equal(reverseKey(qian), qian);
    const tai = HEX_BY_KING[11];
    const pi = HEX_BY_KING[12];
    assert.equal(HEX_BY_KEY[reverseKey(keyOfLines(tai.lines))].king, pi.king);
    assert.equal(HEX_BY_KEY[oppositeKey(keyOfLines(tai.lines))].king, pi.king);
    // 屯 (lower 震 upper 坎) → 互卦 剥
    assert.equal(HEX_BY_KEY[nuclearKey(keyOfLines(HEX_BY_KING[3].lines))].king, 23);
  });
});

describe("fuxi", () => {
  it("places 乾 first and 坤 last, with every hexagram once", () => {
    assert.equal(FUXI_GRID.length, 64);
    assert.equal(new Set(FUXI_GRID.map((c) => c.key)).size, 64);
    assert.equal(HEX_BY_KEY[FUXI_GRID[0].key].king, 1);
    assert.equal(HEX_BY_KEY[FUXI_GRID[63].key].king, 2);
    assert.equal(fuxiOrdinal(63), 0);
  });
});

describe("reading", () => {
  it("follows 朱熹's rules by number of changing lines", () => {
    const qian = HEX_BY_KING[1];
    const kun = HEX_BY_KING[2];
    assert.equal(
      readCast(qian, qian, [false, false, false, false, false, false]).passages[0].kind,
      "judgment",
    );
    const one = readCast(qian, HEX_BY_KING[44], [true, false, false, false, false, false]);
    assert.equal(one.passages[0].line, 0);
    assert.equal(one.passages[0].from, "ben");
    const six = readCast(qian, kun, [true, true, true, true, true, true]);
    assert.equal(six.passages[0].kind, "extra");
    assert.ok(six.passages[0].text.includes("群龙无首"));
    const four = readCast(qian, kun, [true, true, true, true, false, false]);
    assert.equal(four.passages[0].from, "zhi");
    assert.equal(four.passages[0].line, 4);
  });
});

describe("universe", () => {
  it("replays deterministically from the hex", () => {
    const seed = seedFromQuestion("要不要换工作", new Date(0));
    const again = seedFromHex(seed.hex);
    assert.ok(again);
    assert.deepEqual(initialRing(seed), initialRing(again));
    const cast = caCast(seed, 37);
    let row = initialRing(seed);
    for (let g = 0; g < 37; g++) row = stepRing(row);
    assert.deepEqual(cast.benLines, readHead(row, seed.head));
    assert.deepEqual(cast.zhiLines, readHead(stepRing(row), seed.head));
    assert.equal(cast.history.rows.length <= 320, true);
  });

  it("parses both id shapes", () => {
    const y = yarrowCast([6, 7, 8, 9, 7, 8]);
    assert.equal(y.changing.filter(Boolean).length, 2);
    assert.equal(parseCastId(yarrowId([6, 7, 8, 9, 7, 8]))?.method, "yarrow");
    assert.equal(parseCastId("a".repeat(64))?.method, "ca");
    assert.equal(parseCastId("nope"), null);
  });
});
