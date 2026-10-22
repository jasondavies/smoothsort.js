import assert from "node:assert/strict";
import test from "node:test";
import { smoothsort } from "../smoothsort.js";

// Seeded random numbers, so failures can be reproduced with SEED=<seed>.
const seed = Number(process.env.SEED) || Math.floor(Math.random() * 2 ** 32);
console.log(`# seed ${seed}`);
let state = seed;
function random() {
  // mulberry32
  state = state + 0x6d2b79f5 | 0;
  let t = Math.imul(state ^ state >>> 15, 1 | state);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function ascending(a, b) {
  return a - b;
}

function isSorted(values) {
  for (let i = 1; i < values.length; i++) if (values[i - 1] > values[i]) return false;
  return true;
}

// Every size below 200, and some larger ones.
const sizes = Array.from({ length: 200 }, (_, i) => i).concat([1000, 4356, 4357, 10000]);

const generators = {
  "distinct": () => random(),
  "duplicates": () => Math.floor(random() * 5),
  "negative": () => Math.floor((random() - .5) * 1000)
};

const patterns = {
  "sorted": (i) => i,
  "reverse": (i, n) => n - i,
  "equal": () => 7,
  "organ pipe": (i, n) => Math.min(i, n - i),
  "sawtooth": (i) => i % 17,
  "nearly sorted": (i) => i + Math.floor(random() * 10)
};

test("sorting an empty array is a no-op", function() {
  const values = [];
  smoothsort().compare(ascending)(values);
  assert.deepEqual(values, []);
});

test("sorting a single-element range is a no-op", function() {
  const values = [3, 2, 1];
  smoothsort().compare(ascending)(values, 1, 1);
  assert.deepEqual(values, [3, 2, 1]);
});

test("sorting an invalid range does not grow the array", function() {
  const values = [1, 2];
  smoothsort().compare(ascending)(values, 2, 1);
  assert.deepEqual(values, [1, 2]);
  assert.equal(values.length, 2);
});

test("sorting a small subrange near the maximum index works", function() {
  const maxIndex = 7049155;
  const values = [];
  values.length = maxIndex + 20;
  values[maxIndex + 10] = 2;
  values[maxIndex + 11] = 1;

  smoothsort().compare(ascending)(values, maxIndex + 10, maxIndex + 11);

  assert.equal(values[maxIndex + 10], 1);
  assert.equal(values[maxIndex + 11], 2);
});

test("sorting matches the native sort", function() {
  const sort = smoothsort().compare(ascending);
  for (const [name, generate] of Object.entries(generators)) {
    for (const n of sizes) {
      const values = Array.from({ length: n }, generate);
      const expected = values.slice().sort(ascending);
      assert.deepEqual(sort(values.slice()), expected, `${name}, n = ${n}`);
    }
  }
});

test("sorting patterns matches the native sort", function() {
  const sort = smoothsort().compare(ascending);
  for (const [name, generate] of Object.entries(patterns)) {
    for (const n of sizes) {
      const values = Array.from({ length: n }, (_, i) => generate(i, n));
      const expected = values.slice().sort(ascending);
      assert.deepEqual(sort(values.slice()), expected, `${name}, n = ${n}`);
    }
  }
});

test("sorting a subrange leaves other elements untouched", function() {
  const sort = smoothsort().compare(ascending);
  for (const n of sizes.filter((n) => n > 0)) {
    for (let k = 0; k < 5; k++) {
      const values = Array.from({ length: n }, generators.duplicates);
      const lo = Math.floor(random() * n);
      const hi = lo + Math.floor(random() * (n - lo));
      const expected = values.slice(0, lo)
          .concat(values.slice(lo, hi + 1).sort(ascending), values.slice(hi + 1));
      assert.deepEqual(sort(values.slice(), lo, hi), expected, `n = ${n}, ${lo}–${hi}`);
    }
  }
});

test("sorting with only lo sorts to the end", function() {
  const values = [5, 4, 3, 2, 1];
  smoothsort().compare(ascending)(values, 2);
  assert.deepEqual(values, [5, 4, 1, 2, 3]);
});

test("sorting returns the array", function() {
  const sort = smoothsort();
  const values = [2, 1];
  assert.equal(sort(values), values);
  assert.equal(sort(values, 1, 1), values);
  const empty = [];
  assert.equal(sort(empty), empty);
});

test("invalid ranges throw a RangeError", function() {
  const sort = smoothsort();
  const values = [3, 2, 1];
  for (const [lo, hi] of [[-1, 2], [0, 3], [0.5, 2], [0, 1.5], [NaN, 2], [0, NaN], ["0", 2], [0, null]]) {
    assert.throws(() => sort(values, lo, hi), RangeError, `${lo}, ${hi}`);
  }
  assert.deepEqual(values, [3, 2, 1]);
});

test("ranges too long to sort throw a RangeError", function() {
  const sort = smoothsort();
  assert.throws(() => sort({ length: 1402817465 }), RangeError);
  assert.throws(() => sort({ length: 2 ** 32 - 1 }), RangeError);
});

test("the default comparator orders numbers, strings and dates", function() {
  const sort = smoothsort();
  assert.deepEqual(sort([10, 9, 1, -2, 1.5]), [-2, 1, 1.5, 9, 10]);
  assert.deepEqual(sort(["b", "a", "c", "ab"]), ["a", "ab", "b", "c"]);
  const dates = [new Date(2020, 1, 1), new Date(2010, 1, 1), new Date(2015, 1, 1)];
  assert.deepEqual(sort(dates.slice()), [dates[1], dates[2], dates[0]]);
});

test("the default comparator orders NaN and undefined last", function() {
  const sort = smoothsort();
  for (const n of sizes) {
    const values = Array.from({ length: n }, () => {
      const r = random();
      return r < .1 ? NaN : r < .2 ? undefined : Math.floor(r * 100);
    });
    const sorted = sort(values.slice());
    const count = values.filter((x) => x >= x).length;
    assert.ok(isSorted(sorted.slice(0, count)), `n = ${n}`);
    assert.ok(sorted.slice(count).every((x) => !(x >= x)), `n = ${n}`);
    assert.deepEqual(sorted.slice().sort(), values.slice().sort(), `n = ${n}`);
  }
  assert.ok(Number.isNaN(sort([NaN, 1])[1]));
  assert.equal(sort([undefined, 1])[1], undefined);
});

test("compare gets and sets the comparator", function() {
  const sort = smoothsort();
  assert.equal(sort.compare()(1, 2), -1);
  assert.equal(sort.compare()(2, 1), 1);
  assert.equal(sort.compare()(1, 1), 0);
  const descending = (a, b) => b - a;
  assert.equal(sort.compare(descending), sort);
  assert.equal(sort.compare(), descending);
  assert.deepEqual(sort([1, 3, 2]), [3, 2, 1]);
});

test("sorting objects with a custom comparator", function() {
  const sort = smoothsort().compare((a, b) => a.key - b.key);
  const values = Array.from({ length: 1000 }, (_, i) => ({ key: Math.floor(random() * 50), i }));
  const sorted = sort(values.slice());
  assert.ok(isSorted(sorted.map((d) => d.key)));
  assert.deepEqual(sorted.map((d) => d.i).sort(ascending), values.map((d) => d.i));
});

test("sorting typed arrays", function() {
  const sort = smoothsort();
  for (const type of [Float64Array, Float32Array, Int32Array, Uint8Array]) {
    const values = type.from({ length: 5000 }, () => Math.floor((random() - .5) * 1000));
    const expected = values.slice().sort();
    assert.deepEqual(sort(values), expected, type.name);
  }
  const floats = Float64Array.from([3, NaN, 1, 2, NaN, 0]);
  assert.deepEqual(sort(floats), Float64Array.from([0, 1, 2, 3, NaN, NaN]));
});
