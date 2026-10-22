// Based on implementation in https://en.wikipedia.org/wiki/Smoothsort

// Leonardo numbers.  These stop below 2^30 so that V8 keeps them as small
// integers; a larger one would make it use floating point for every index.
const LP = [
  1, 1, 3, 5, 9, 15, 25, 41, 67, 109, 177, 287, 465, 753,
  1219, 1973, 3193, 5167, 8361, 13529, 21891, 35421, 57313, 92735,
  150049, 242785, 392835, 635621, 1028457, 1664079, 2692537,
  4356617, 7049155, 11405773, 18454929, 29860703, 48315633, 78176337,
  126491971, 204668309, 331160281, 535828591, 866988873
];

// Ranges this long or longer would need a heap of order 43, beyond LP.
const MAX_LENGTH = LP[41] + LP[42] + 1;

// The bitmap of heap orders, p in the Wikipedia version, needs up to 43 bits,
// so it is held in two 32-bit words: pl (low) and ph (high).  Shift counts must
// stay below 32, as JavaScript only uses the low five bits of a shift count.
// While ph is 0, which it is for ranges below about 7 million elements,
// trinkle32 uses pl alone.

// Each of sift, trinkle32 and trinkle is called from as few places as possible,
// so that V8 can inline them all into sort within its inlining budget; this is
// 5-30% faster than calling each from where it is needed.

// Elements move by swapping, so that the array is always a permutation of its
// original elements, even if the comparator throws.

export function smoothsort() {
  let compare = ascending;

  function sort(m, lo = 0, hi = m.length - 1) {
    if (!Number.isSafeInteger(lo) || !Number.isSafeInteger(hi) || lo < 0 || hi >= m.length) {
      throw new RangeError("Invalid range for smoothsort.");
    }
    if (hi <= lo) return m;
    if (hi - lo + 1 >= MAX_LENGTH) {
      throw new RangeError("Maximum length exceeded for smoothsort implementation.");
    }

    // Insertion sort is faster for short ranges, and is also in place and
    // adaptive.  Longer ranges would need many more comparisons when reversed.
    if (hi - lo < 16) {
      for (let i = lo + 1, j, x; i <= hi; i++) {
        x = m[i];
        for (j = i; j > lo && compare(m[j - 1], x) > 0; j--) m[j] = m[j - 1], m[j - 1] = x;
      }
      return m;
    }

    let head = lo;
    let pl = 1;
    let ph = 0;
    let pshift = 1;
    let shift;
    let merge;

    for (;;) {
      merge = (pl & 3) === 3;
      if (head < hi && (merge || LP[pshift - 1] < hi - head)) sift(m, pshift, head);
      else if (ph === 0) trinkle32(m, pl, pshift, head, false);
      else trinkle(m, pl, ph, pshift, head, false);
      if (head === hi) break;
      if (merge) {
        pl = (pl >>> 2) | (ph << 30);
        ph >>>= 2;
        pshift += 2;
      } else {
        shift = pshift === 1 ? 1 : pshift - 1;
        if (shift < 32) {
          ph = (ph << shift) | (pl >>> (32 - shift));
          pl <<= shift;
        } else {
          ph = pl << (shift - 32);
          pl = 0;
        }
        pshift = pshift === 1 ? 0 : 1;
      }
      pl |= 1;
      head++;
    }

    while (pshift !== 1 || pl !== 1 || ph !== 0) {
      if (pshift <= 1) {
        shift = trailingzeroes(pl & ~1, ph);
        if (shift < 32) {
          pl = (pl >>> shift) | (ph << (32 - shift));
          ph >>>= shift;
        } else {
          pl = ph >>> (shift - 32);
          ph = 0;
        }
        pshift += shift;
      } else {
        ph = (ph << 2) | (pl >>> 30);
        pl = (pl << 2) ^ 7;
        pshift -= 2;

        if (ph === 0) {
          // The left heap, then the right, from one call site.  pl >>> 0 would
          // be a double whenever bit 31 is set, so pl is passed unshifted.
          for (shift = 1; shift >= 0; shift--) {
            trinkle32(m, shift ? pl >>> 1 : pl, pshift + shift, head - 1 - shift * LP[pshift], true);
          }
        } else {
          trinkle(m, (pl >>> 1) | (ph << 31), ph >>> 1, pshift + 1, head - LP[pshift] - 1, true);
          trinkle(m, pl, ph, pshift, head - 1, true);
        }
      }

      head--;
    }

    return m;
  }

  // As trinkle, for bitmaps that fit in pl.
  function trinkle32(m, pl, pshift, head, trusty) {
    const val = m[head];
    let stepson;
    let mstepson;
    let rt;
    let lf;
    let shift;

    while (pl !== 1) {
      stepson = head - LP[pshift];

      if (compare((mstepson = m[stepson]), val) <= 0) break;

      if (!trusty && pshift > 1) {
        rt = head - 1;
        lf = head - 1 - LP[pshift - 2];
        if (compare(m[rt], mstepson) >= 0 || compare(m[lf], mstepson) >= 0) {
          break;
        }
      }

      m[head] = mstepson;
      m[stepson] = val;

      head = stepson;
      shift = trailingzeroes32(pl & ~1);
      pl >>>= shift;
      pshift += shift;
      trusty = false;
    }

    if (!trusty) sift(m, pshift, head);
  }

  function trinkle(m, pl, ph, pshift, head, trusty) {
    const val = m[head];
    let stepson;
    let mstepson;
    let rt;
    let lf;
    let shift;

    while (pl !== 1 || ph !== 0) {
      stepson = head - LP[pshift];

      if (compare((mstepson = m[stepson]), val) <= 0) break;

      if (!trusty && pshift > 1) {
        rt = head - 1;
        lf = head - 1 - LP[pshift - 2];
        if (compare(m[rt], mstepson) >= 0 || compare(m[lf], mstepson) >= 0) {
          break;
        }
      }

      m[head] = mstepson;
      m[stepson] = val;

      head = stepson;
      shift = trailingzeroes(pl & ~1, ph);
      if (shift < 32) {
        pl = (pl >>> shift) | (ph << (32 - shift));
        ph >>>= shift;
      } else {
        pl = ph >>> (shift - 32);
        ph = 0;
      }
      pshift += shift;
      trusty = false;
    }

    if (!trusty) sift(m, pshift, head);
  }

  function sift(m, pshift, head) {
    let rt;
    let lf;
    let mrt;
    let mlf;
    const val = m[head];

    while (pshift > 1) {
      rt = head - 1;
      lf = head - 1 - LP[pshift - 2];
      mrt = m[rt];
      mlf = m[lf];

      if (compare(val, mlf) >= 0 && compare(val, mrt) >= 0) break;

      if (compare(mlf, mrt) >= 0) {
        m[head] = mlf;
        m[lf] = val;
        head = lf;
        pshift--;
      } else {
        m[head] = mrt;
        m[rt] = val;
        head = rt;
        pshift -= 2;
      }
    }
  }

  sort.compare = function(x) {
    if (!arguments.length) return compare;
    compare = x;
    return sort;
  };

  return sort;
}

function trailingzeroes32(v) {
  return 31 - Math.clz32(v & -v);
}

// Trailing zeroes of the 64-bit value with words lo and hi, which mustn't be 0.
function trailingzeroes(lo, hi) {
  return lo ? 31 - Math.clz32(lo & -lo) : 63 - Math.clz32(hi & -hi);
}

// Values that aren't comparable with themselves, such as NaN and undefined,
// are ordered last.
function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : unordered(a, b);
}

// Kept out of ascending, which is slower with it inline.
function unordered(a, b) {
  return (a >= a ? 0 : 1) - (b >= b ? 0 : 1);
}

export default smoothsort;
