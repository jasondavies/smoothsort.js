Smoothsort.js
=============

This is a JavaScript implementation of Dijkstra's [smoothsort][1].  If the
input is already sorted to some degree, it "smoothly" approaches O(n) running
time.  It is an in-place algorithm, and only requires O(1) auxiliary storage
space.

[1]: https://en.wikipedia.org/wiki/Smoothsort

Usage
-----

```js
import smoothsort from "smoothsort";

const sort = smoothsort();
const values = [4, 2, 5, 1, 3];

sort(values); // [1, 2, 3, 4, 5]
```

`sort(array[, lo[, hi]])` sorts `array` in place and returns it.  To sort only
part of it, pass the indices of the first and last elements to sort: `hi` is
*inclusive*, unlike `Array#slice`, and defaults to the last element.  Other
elements are left untouched.  `lo` and `hi` must be safe integers, with `lo` at
least 0 and `hi` less than the array's length, or a `RangeError` is thrown.
If `hi` is less than or equal to `lo`, nothing is sorted.

Any array-like object with indexed elements and a `length` works, including
typed arrays.  Unlike `Array#sort`, holes in sparse arrays are sorted as
`undefined` and filled.  Ranges of 1,402,817,465 or more elements throw a
`RangeError`.  Ranges of 16 or fewer elements are sorted with an insertion
sort, which is faster for them.

`sort.compare(comparator)` sets the comparator, which is called like the one
passed to `Array#sort`, and returns `sort`.  `sort.compare()` returns the
current comparator.  For example, to sort in descending order:

```js
const sort = smoothsort().compare((a, b) => b - a);
```

Unlike `Array#sort`, which moves `undefined` values to the end itself, the
comparator is also called with any `undefined` values.  If the comparator
throws, the exception propagates, and the array is left with the same elements
in an unspecified order.

The default comparator orders values using `<` and `>`, so it sorts numbers
numerically, unlike `Array#sort`'s default, and strings by code unit.  Values
that aren't comparable with themselves, such as `NaN` and `undefined`, are
ordered last.  If the values mix types, such as numbers and strings, the
resulting order is unspecified.

Smoothsort is not stable: equal values may not keep their original order.

smoothsort.js is an ES module, and requires Node.js 18 or later.

Upgrading from 0.0.x
--------------------

 * smoothsort.js is now an ES module, so use `import` rather than `require` or
   a `<script>` tag.  Node.js 18 or later is required.
 * `sort` returns the array it sorted.
 * Invalid ranges throw a `RangeError`, rather than silently doing nothing, or
   writing outside the array.  Passing just `lo` now sorts to the end of the
   array.
 * The default comparator orders `NaN` and `undefined` last.
 * Arrays of up to 1,402,817,464 elements can be sorted, rather than 7,049,156.
 * A comparator that throws no longer loses or duplicates elements.
 * Only the package's main module (and `package.json`) can be imported.

Informal Benchmark
------------------

`npm run benchmark` compares smoothsort with the native `Array#sort`, using
the same comparator, `(a, b) => a - b` unless noted.  On Node.js 24:

| Input                                 | smoothsort | Array#sort |
|---------------------------------------|-----------:|-----------:|
| 1,000,000 random numbers              |     127 ms |     255 ms |
| 1,000,000 nearly sorted numbers       |      44 ms |      91 ms |
| 1,000,000 sorted numbers              |       7 ms |       7 ms |
| 1,000,000 reversed numbers            |      59 ms |       8 ms |
| 100 random numbers                    |     1.3 µs |     4.2 µs |
| 100,000 strings, default comparator   |      41 ms |      17 ms |

Smoothsort is faster here mostly because V8 can inline a short comparator into
it, which it can't do for the native sort.  The native sort needs about a third
as many comparisons for random data, so it is faster when comparisons are
expensive, as for strings.  It also takes advantage of runs, such as reversed
data, which smoothsort doesn't.

V8 only inlines the comparator while every `smoothsort()` instance in the
process has used the same comparator function.  Once a different function has
been used, even one with the same code written elsewhere, or the default
comparator, sorting is about three times slower: 1,000,000 random numbers then
take about 380 ms, slower than the native sort.  Sorting a typed array as well
as plain arrays costs about 20% more.  If speed matters, define one comparator
function and reuse it.

Credits
-------

The implementation is largely based on the Java code in the Wikipedia article.
