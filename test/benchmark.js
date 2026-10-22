import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { smoothsort } from "../smoothsort.js";

const ascending = (a, b) => a - b;

// Each case runs in its own process, as using more than one comparator in a
// process stops V8 inlining it into smoothsort.
const cases = {
  "random": [1000000, () => Math.random() * 1000000, ascending],
  "nearly sorted": [1000000, (i) => i + Math.random() * 100 - 50, ascending],
  "sorted": [1000000, (i) => i + 0.5, ascending],
  "reversed": [1000000, (i) => 1000000 - i + 0.5, ascending],
  "small random": [100, () => Math.random() * 100, ascending],
  "random strings, default comparator": [100000, () => Math.random().toString(36), undefined]
};

const name = process.argv[2];

if (name === undefined) {
  for (const name of Object.keys(cases)) {
    process.stdout.write(execFileSync(process.execPath, [fileURLToPath(import.meta.url), name]));
  }
} else {
  const [n, value, compare] = cases[name];
  const data = Array.from({ length: n }, (_, i) => value(i));
  const sort = compare ? smoothsort().compare(compare) : smoothsort();
  const rounds = Math.max(10, Math.min(10000, 1e7 / n));

  // The median time to sort a fresh copy, since both sorts modify their input.
  const median = (f) => {
    for (let i = 0; i < rounds; i++) f(data.slice());
    const times = [];
    for (let i = 0; i < rounds; i++) {
      const copy = data.slice();
      const start = performance.now();
      f(copy);
      times.push(performance.now() - start);
    }
    return times.sort(ascending)[rounds >> 1];
  };

  const format = (ms) => ms < 1 ? `${(ms * 1000).toFixed(1)} µs` : `${ms.toFixed(1)} ms`;
  const expected = data.slice().sort(compare);
  const correct = sort(data.slice()).every((x, i) => x === expected[i]);
  console.log(`${name} (${n.toLocaleString("en")}): smoothsort ${format(median(sort))}, Array#sort ${format(median((a) => a.sort(compare)))}${correct ? "" : " INCORRECT"}`);
}
