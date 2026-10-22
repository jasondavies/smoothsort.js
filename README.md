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
elements are left untouched.  `lo` and `hi` must be integers, with `lo` at
least 0 and `hi` less than the array's length, or a `RangeError` is thrown.
If `hi` is less than or equal to `lo`, nothing is sorted.

Any array-like object with indexed elements and a `length` works, including
typed arrays.  Ranges of 1,402,817,465 or more elements throw a `RangeError`.

`sort.compare(comparator)` sets the comparator, which works like the one passed
to `Array#sort`, and returns `sort`.  `sort.compare()` returns the current
comparator.  For example, to sort in descending order:

```js
const sort = smoothsort().compare((a, b) => b - a);
```

The default comparator orders values using `<` and `>`, so it sorts numbers
numerically, unlike `Array#sort`'s default, and strings by code unit.  Values
that aren't comparable with themselves, such as `NaN` and `undefined`, are
ordered last.  The order of mixed types that can't be compared with each other,
such as numbers and non-numeric strings, is unspecified.

Smoothsort is not stable: equal values may not keep their original order.

smoothsort.js is an ES module, and requires Node.js 18 or later.

Upgrading from 0.0.x
--------------------

 * `sort` returns the array it sorted.
 * Invalid ranges throw a `RangeError`, rather than silently doing nothing, or
   writing outside the array.  Passing just `lo` now sorts to the end of the
   array.
 * The default comparator orders `NaN` and `undefined` last.
 * Arrays of up to 1,402,817,464 elements can be sorted, rather than 7,049,156.
 * Only the package's main module (and `package.json`) can be imported.

Informal Benchmark
------------------

`npm run benchmark` sorts a million numbers in an array, comparing against the
native `Array#sort` with the same comparator.  On Node.js 24:

 * Random: smoothsort ~**135** ms, native ~**250** ms.
 * Nearly sorted, with each value at most 100 places out: smoothsort ~**45**
   ms, native ~**90** ms.
 * Sorted: both ~**8** ms.

Credits
-------

The implementation is largely based on the Java code in the Wikipedia article.
