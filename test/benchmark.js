import { performance } from "node:perf_hooks";
import { smoothsort } from "../smoothsort.js";

const n = 1000000;
const rounds = 10;
const ascending = (a, b) => a - b;
const sort = smoothsort().compare(ascending);

// All doubles, so that sort only ever sees one kind of array.
const inputs = {
  "random": Array.from({ length: n }, () => Math.random() * n),
  "nearly sorted": Array.from({ length: n }, (_, i) => i + Math.random() * 100 - 50),
  "sorted": Array.from({ length: n }, (_, i) => i + 0.5)
};

// Sorts a fresh copy each round, since both sorts modify their input.
function milliseconds(f, data) {
  for (let i = 0; i < 3; i++) f(data.slice());
  let elapsed = 0;
  for (let i = 0; i < rounds; i++) {
    const copy = data.slice();
    const start = performance.now();
    f(copy);
    elapsed += performance.now() - start;
  }
  return (elapsed / rounds).toFixed(1);
}

for (const [name, data] of Object.entries(inputs)) {
  console.log(`${name}: smoothsort ${milliseconds((a) => sort(a), data)} ms, Array#sort ${milliseconds((a) => a.sort(ascending), data)} ms.`);
}

console.log("correct?", Object.values(inputs).every((data) => {
  const expected = data.slice().sort(ascending);
  return sort(data.slice()).every((x, i) => x === expected[i]);
}));
