import { describe, expect, test } from "bun:test";
import type { Thread } from "@/entities/thread";
import {
  floorOekakiThreads,
  MIN_SOUDANE_FOR_FLOOR,
} from "./floorOekakiThreads";

/** is_oekaki と OP そうだね数を持つ最小の Thread を生成する(そうだねは既定でフロア対象の下限) */
function mk(
  id: number,
  isOekaki: boolean,
  soudane: number = MIN_SOUDANE_FOR_FLOOR,
): Thread {
  return {
    id,
    soudane_count: soudane,
    attachment: { is_oekaki: isOekaki },
  } as unknown as Thread;
}

/** 添付なし(画像なし)の Thread を生成する */
function mkNoAttachment(id: number): Thread {
  return { id, attachment: null } as unknown as Thread;
}

/** 添付はあるが is_oekaki フィールドが欠落している Thread を生成する(?? false の経路検証用) */
function mkAttachmentNoFlag(id: number): Thread {
  return { id, attachment: {} } as unknown as Thread;
}

/** お絵描きだが soudane_count が欠落している Thread を生成する(欠損時の防御検証用) */
function mkOekakiMissingSoudane(id: number): Thread {
  return { id, attachment: { is_oekaki: true } } as unknown as Thread;
}

function ids(threads: Thread[]): number[] {
  return threads.map((t) => t.id);
}

describe("floorOekakiThreads", () => {
  test("returns an empty array unchanged", () => {
    expect(floorOekakiThreads([])).toEqual([]);
  });

  test("keeps order when there are no oekaki threads", () => {
    const input = [mk(1, false), mk(2, false), mk(3, false), mk(4, false)];
    expect(ids(floorOekakiThreads(input))).toEqual([1, 2, 3, 4]);
  });

  test("keeps order when oekaki threads are already in the top half", () => {
    // n=8, topCount=4. お絵描きは index0,1 で既に上半分 → 動かさない
    const input = [
      mk(1, true),
      mk(2, true),
      mk(3, false),
      mk(4, false),
      mk(5, false),
      mk(6, false),
      mk(7, false),
      mk(8, false),
    ];
    expect(ids(floorOekakiThreads(input))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test("lifts a below-midline oekaki thread to just above the midline", () => {
    // n=8, topCount=4. O1=index1(上半分), O2=index5(下半分)
    // O2 だけ中間ライン直前(index3)へ。O1 は据え置き。
    const input = [
      mk(1, false), // N1
      mk(2, true), // O1 (上半分・据え置き)
      mk(3, false), // N2
      mk(4, false), // N3
      mk(5, false), // N4
      mk(6, true), // O2 (下半分・引き上げ対象)
      mk(7, false), // N5
      mk(8, false), // N6
    ];
    expect(ids(floorOekakiThreads(input))).toEqual([1, 2, 3, 6, 4, 5, 7, 8]);
  });

  test("preserves relative order among lifted oekaki threads", () => {
    // n=6, topCount=3. お絵描きは index3,5 の2件で残り上半分枠は1
    const input = [
      mk(1, false),
      mk(2, false),
      mk(3, false),
      mk(4, true),
      mk(5, false),
      mk(6, true),
    ];
    expect(ids(floorOekakiThreads(input))).toEqual([1, 4, 6, 2, 3, 5]);
  });

  test("uses ceil(n/2) for the top half on odd-length lists", () => {
    // n=5, topCount=ceil(5/2)=3. お絵描きは最下部 index4
    const input = [
      mk(1, false),
      mk(2, false),
      mk(3, false),
      mk(4, false),
      mk(5, true),
    ];
    expect(ids(floorOekakiThreads(input))).toEqual([1, 2, 5, 3, 4]);
  });

  test("overflow: fills top with oekaki and places excess oekaki just below the line", () => {
    // n=4, topCount=2. お絵描き3件 > 上半分枠2 → あふれ1件は中間ライン直下、通常スレ最下部
    const input = [
      mk(1, true), // O1
      mk(2, false), // N1
      mk(3, true), // O2
      mk(4, true), // O3
    ];
    expect(ids(floorOekakiThreads(input))).toEqual([1, 3, 4, 2]);
  });

  test("treats threads without an attachment as non-oekaki", () => {
    // 添付なしスレは引き上げ対象にならない
    const input = [mk(1, false), mk(2, false), mk(3, false), mkNoAttachment(4)];
    expect(ids(floorOekakiThreads(input))).toEqual([1, 2, 3, 4]);
  });

  test("treats an attachment without is_oekaki as non-oekaki (?? false path)", () => {
    // attachment はあるが is_oekaki フィールド欠落 → 通常スレ扱い(引き上げない)
    // n=4, topCount=2。id2 は欠落フラグ(通常扱い)、id4 のみお絵描き
    const input = [
      mk(1, false),
      mkAttachmentNoFlag(2),
      mk(3, false),
      mk(4, true),
    ];
    expect(ids(floorOekakiThreads(input))).toEqual([1, 4, 2, 3]);
  });

  test("n=2 boundary: lifts a bottom oekaki into the single top slot", () => {
    // n=2, topCount=ceil(2/2)=1。お絵描きが index1(下半分) → index0 へ
    expect(ids(floorOekakiThreads([mk(1, false), mk(2, true)]))).toEqual([
      2, 1,
    ]);
    // 既に上半分(index0)なら据え置き
    expect(ids(floorOekakiThreads([mk(1, true), mk(2, false)]))).toEqual([
      1, 2,
    ]);
  });

  test("n=3 boundary: lifts a bottom oekaki just above the midline", () => {
    // n=3, topCount=ceil(3/2)=2。お絵描きは最下部 index2
    // ceil を floor に取り違えると [3,1,2] になり検出される
    const input = [mk(1, false), mk(2, false), mk(3, true)];
    expect(ids(floorOekakiThreads(input))).toEqual([1, 3, 2]);
  });

  test("overflow with excess >= 2: excess oekaki sit just below the line, normal goes last", () => {
    // n=6, topCount=3。お絵描き5件 > 枠3 → 先頭3件が上半分、あふれ2件が直下、通常スレ最下部
    const input = [
      mk(1, false),
      mk(2, true),
      mk(3, true),
      mk(4, true),
      mk(5, true),
      mk(6, true),
    ];
    expect(ids(floorOekakiThreads(input))).toEqual([2, 3, 4, 5, 6, 1]);
  });

  test("overflow pushes multiple normal threads to the bottom in order", () => {
    // n=6, topCount=3。お絵描き4件 > 枠3、通常2件は最下部へ元の順で
    const input = [
      mk(1, true),
      mk(2, true),
      mk(3, false),
      mk(4, true),
      mk(5, true),
      mk(6, false),
    ];
    expect(ids(floorOekakiThreads(input))).toEqual([1, 2, 4, 5, 3, 6]);
  });

  test("does not floor an oekaki thread whose soudane is below the threshold (treated as normal)", () => {
    // n=8, topCount=4。O1(閾値ちょうど)は優遇、O2(閾値未満)は優遇対象外＝自然順のまま
    const input = [
      mk(1, false),
      mk(2, true, MIN_SOUDANE_FOR_FLOOR), // 優遇される(>=閾値)・既に上半分で据え置き
      mk(3, false),
      mk(4, false),
      mk(5, false),
      mk(6, true, MIN_SOUDANE_FOR_FLOOR - 1), // 閾値未満 → 優遇されず自然順(引き上げない)
      mk(7, false),
      mk(8, false),
    ];
    expect(ids(floorOekakiThreads(input))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test("soudane threshold is inclusive (>=threshold floored, <threshold not)", () => {
    // n=4, topCount=2。下半分(index3)のお絵描き
    // そうだね=閾値ちょうど → 優遇(中間ライン直前へ引き上げ)
    expect(
      ids(
        floorOekakiThreads([
          mk(1, false),
          mk(2, false),
          mk(3, false),
          mk(4, true, MIN_SOUDANE_FOR_FLOOR),
        ]),
      ),
    ).toEqual([1, 4, 2, 3]);
    // そうだね=閾値未満(1つ下) → 優遇されず自然順(引き上げない)
    expect(
      ids(
        floorOekakiThreads([
          mk(1, false),
          mk(2, false),
          mk(3, false),
          mk(4, true, MIN_SOUDANE_FOR_FLOOR - 1),
        ]),
      ),
    ).toEqual([1, 2, 3, 4]);
  });

  test("treats an oekaki thread with missing soudane_count as normal (not floored)", () => {
    // n=4, topCount=2。soudane 欠損のお絵描きを下半分(index3)に置く。
    // 優遇対象外＝引き上げないので自然順のまま(引き上げるなら [1,4,2,3] になる)。
    const input = [
      mk(1, false),
      mk(2, false),
      mk(3, false),
      mkOekakiMissingSoudane(4),
    ];
    expect(ids(floorOekakiThreads(input))).toEqual([1, 2, 3, 4]);
  });

  test("property: permutation, relative-order, and floor invariant hold for all n=2..8", () => {
    for (let n = 2; n <= 8; n++) {
      const topCount = Math.ceil(n / 2);
      for (let mask = 0; mask < 1 << n; mask++) {
        const isOek = (id: number): boolean => (mask & (1 << id)) !== 0;
        const input: Thread[] = [];
        for (let i = 0; i < n; i++) input.push(mk(i, isOek(i)));

        const outIds = ids(floorOekakiThreads(input));
        const allIds = Array.from({ length: n }, (_, i) => i);

        // 順列であること(欠落・重複・長さ変化なし)
        expect(outIds.length).toBe(n);
        expect([...outIds].sort((a, b) => a - b)).toEqual(allIds);

        // お絵描き同士・通常スレ同士の相対順が保たれること
        expect(outIds.filter((id) => isOek(id))).toEqual(
          allIds.filter((id) => isOek(id)),
        );
        expect(outIds.filter((id) => !isOek(id))).toEqual(
          allIds.filter((id) => !isOek(id)),
        );

        // K<=topCount のとき全お絵描きが上半分(index<topCount)に収まること
        const oekakiCount = allIds.filter((id) => isOek(id)).length;
        if (oekakiCount <= topCount) {
          outIds.forEach((id, pos) => {
            if (isOek(id)) expect(pos).toBeLessThan(topCount);
          });
        }
      }
    }
  });
});
