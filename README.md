Smoothsort.js
=============

This is a JavaScript implementation of Dikstra's [smoothsort][1].  If the input
is already sorted to some degree, it "smoothly" approaches O(n) running time.
It is an in-place algorithm, and only requires O(1) auxiliary storage space.

```js
import smoothsort from "smoothsort";

const sort = smoothsort();
const values = [4, 2, 5, 1, 3];

sort(values);
```

[1]: https://en.wikipedia.org/wiki/Smoothsort

Credits
-------

The implementation is largely based on the Java code in the Wikipedia article.
