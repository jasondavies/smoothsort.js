import assert from "node:assert/strict";
import test from "node:test";
import { smoothsort } from "../smoothsort.js";

function ascending(a, b) {
  return a - b;
}

test("sorting an empty array is a no-op", function() {
  var values = [];
  smoothsort().compare(ascending)(values);
  assert.deepEqual(values, []);
});

test("sorting a single-element range is a no-op", function() {
  var values = [3, 2, 1];
  smoothsort().compare(ascending)(values, 1, 1);
  assert.deepEqual(values, [3, 2, 1]);
});

test("sorting an invalid range does not grow the array", function() {
  var values = [1, 2];
  smoothsort().compare(ascending)(values, 2, 1);
  assert.deepEqual(values, [1, 2]);
  assert.equal(values.length, 2);
});

test("sorting a small subrange near the maximum index works", function() {
  var maxIndex = 7049155;
  var values = [];
  values.length = maxIndex + 20;
  values[maxIndex + 10] = 2;
  values[maxIndex + 11] = 1;

  smoothsort().compare(ascending)(values, maxIndex + 10, maxIndex + 11);

  assert.equal(values[maxIndex + 10], 1);
  assert.equal(values[maxIndex + 11], 2);
});
