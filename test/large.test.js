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

// Run separately from the other tests, which would make sort's property accesses
// and comparator calls megamorphic, and this test many times slower.

function ascending(a, b) {
  return a - b;
}

function isSorted(values) {
  for (let i = 1; i < values.length; i++) if (values[i - 1] > values[i]) return false;
  return true;
}

// Ranges past 7,049,156 elements need more than 32 bits of heap bitmap, and
// past 11,405,773 shift words of the bitmap by 32 or more.
test("sorting arrays that need a 64-bit heap bitmap", function() {
  const sort = smoothsort().compare(ascending);
  const n1 = 7049157;
  const values = new Float64Array(n1);
  for (let i = 0; i < n1; i++) values[i] = random();
  assert.ok(isSorted(sort(values)), `random, n = ${n1}`);

  const n2 = 11405775;
  const reversed = new Float64Array(n2);
  for (let i = 0; i < n2; i++) reversed[i] = n2 - i;
  assert.ok(isSorted(sort(reversed)), `reverse, n = ${n2}`);
});
