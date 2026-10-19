/**
 * 四柱干支 for the moment of a cast. The hour is the 梅花易数「时」;
 * the year turns at 立春 and the months at the twelve 节, approximated to
 * the day with the 寿星 formula (valid 2001–2099). 子时 begins at 23:00 and
 * belongs to the next day's pillar.
 */

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
] as const;

export type Pillar = { stem: number; branch: number; text: string };

export type FourPillars = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  /** 节气 name that opened the current month. */
  term: string;
  /** Local wall-clock used for the computation. */
  local: string;
};

function pillar(stem: number, branch: number): Pillar {
  const s = ((stem % 10) + 10) % 10;
  const b = ((branch % 12) + 12) % 12;
  return { stem: s, branch: b, text: `${STEMS[s]}${BRANCHES[b]}` };
}

function sexagenary(index: number): Pillar {
  const i = ((index % 60) + 60) % 60;
  return pillar(i % 10, i % 12);
}

/** Julian day number of a civil date (proleptic Gregorian). */
export function julianDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/** 日柱：甲子 falls on JDN ≡ 11 (mod 60). */
export function dayPillar(year: number, month: number, day: number): Pillar {
  return sexagenary(julianDay(year, month, day) + 49);
}

/** The twelve 节 by month (1 = January), with 21st-century 寿星 constants. */
const TERMS: readonly { name: string; c: number }[] = [
  { name: "小寒", c: 5.4055 },
  { name: "立春", c: 3.87 },
  { name: "惊蛰", c: 5.63 },
  { name: "清明", c: 4.81 },
  { name: "立夏", c: 5.52 },
  { name: "芒种", c: 5.678 },
  { name: "小暑", c: 7.108 },
  { name: "立秋", c: 7.5 },
  { name: "白露", c: 7.646 },
  { name: "寒露", c: 8.318 },
  { name: "立冬", c: 7.438 },
  { name: "大雪", c: 7.18 },
];

/** Day of month on which the 节 of `month` falls. */
export function termDay(year: number, month: number): number {
  const y = year % 100;
  const { c } = TERMS[month - 1];
  return Math.floor(y * 0.2422 + c) - Math.floor(y / 4);
}

/**
 * Index of the solar month, 0 = 寅月 (from 立春) … 11 = 丑月, plus the 节
 * that opened it. Before 立春 the date still belongs to the previous year.
 */
export function solarMonth(
  year: number,
  month: number,
  day: number,
): { index: number; term: string; yearOffset: number } {
  const passed = day >= termDay(year, month);
  // The 节 of calendar month m opens solar month (m - 2) mod 12 when passed, else the one before.
  let idx = month - 2 - (passed ? 0 : 1);
  const termMonth = passed ? month : month === 1 ? 12 : month - 1;
  idx = ((idx % 12) + 12) % 12;
  const yearOffset = month < 2 || (month === 2 && !passed) ? -1 : 0;
  return { index: idx, term: TERMS[termMonth - 1].name, yearOffset };
}

export function fourPillars(date: Date): FourPillars {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  const hour = date.getHours();
  const local = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  // 晚子时 belongs to the next day.
  if (hour >= 23) {
    const next = new Date(year, month - 1, day + 1);
    year = next.getFullYear();
    month = next.getMonth() + 1;
    day = next.getDate();
  }

  const sm = solarMonth(year, month, day);
  const yearIndex = year + sm.yearOffset - 4;
  const yearP = sexagenary(yearIndex);
  // 甲己之年丙作首：寅月's stem from the year stem.
  const monthStem = ((yearP.stem % 5) * 2 + 2 + sm.index) % 10;
  const monthP = pillar(monthStem, sm.index + 2);
  const dayP = dayPillar(year, month, day);
  const hourBranch = Math.floor((hour + 1) / 2) % 12;
  // 甲己还加甲：子时's stem from the day stem.
  const hourP = pillar((dayP.stem % 5) * 2 + hourBranch, hourBranch);

  return { year: yearP, month: monthP, day: dayP, hour: hourP, term: sm.term, local };
}

export const HOUR_RANGES: readonly string[] = [
  "23–1",
  "1–3",
  "3–5",
  "5–7",
  "7–9",
  "9–11",
  "11–13",
  "13–15",
  "15–17",
  "17–19",
  "19–21",
  "21–23",
];
