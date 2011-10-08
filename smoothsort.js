// Based on implementation in http://en.wikipedia.org/wiki/Smoothsort
(function(exports) {
  // Leonardo numbers.
  var LP = [
    1, 1, 3, 5, 9, 15, 25, 41, 67, 109, 177, 287, 465, 753, 
    1219, 1973, 3193, 5167, 8361, 13529, 21891, 35421, 57313, 92735,
    150049, 242785, 392835, 635621, 1028457, 1664079, 2692537, 
    4356617, 7049155, 11405773, 18454929, 29860703, 48315633, 78176337,
    126491971, 204668309, 331160281, 535828591, 866988873
  ];

  exports.smoothsort = function() {
    var compare = ascending;

    function sort(m, lo, hi) {
      if (arguments.length === 1) {
        lo = 0;
        hi = m.length - 1;
      }
      if (hi > LP[32]) {
        throw {error: "Maximum length exceeded for smoothsort implementation."};
      }
      var head = lo,
          p = 1,
          pshift = 1,
          trail;

      while (head < hi) {
        if ((p & 3) === 3) {
          sift(m, pshift, head);
          p >>>= 2;
          pshift += 2;
        } else {
          if (LP[pshift - 1] >= hi - head) trinkle(m, p, pshift, head, false);
          else sift(m, pshift, head);
          if (pshift === 1) {
            p <<= 1;
            pshift--;
          } else {
            p <<= (pshift - 1);
            pshift = 1;
          }
        }
        p |= 1;
        head++;
      }
      trinkle(m, p, pshift, head, false);

      while (pshift !== 1 || p !== 1) {
        if (pshift <= 1) {
          trail = trailingzeroes(p & ~1);
          p >>>= trail;
          pshift += trail;
        } else {
          p <<= 2;
          p ^= 7;
          pshift -= 2;

          trinkle(m, p >>> 1, pshift + 1, head - LP[pshift] - 1, true);
          trinkle(m, p, pshift, head - 1, true);
        }

        head--;
      }
    }

    function trinkle(m, p, pshift, head, trusty) {
      var val = m[head],
          stepson,
          mstepson,
          rt,
          lf,
          trail;

      while (p !== 1) {
        stepson = head - LP[pshift];

        if (compare(mstepson = m[stepson], val) <= 0) break;

        if (!trusty && pshift > 1) {
          rt = head - 1;
          lf = head - 1 - LP[pshift - 2];
          if (compare(m[rt], mstepson) >= 0 || compare(m[lf], mstepson) >= 0) {
            break;
          }
        }

        m[head] = mstepson;

        head = stepson;
        trail = trailingzeroes(p & ~1);
        p >>>= trail;
        pshift += trail;
        trusty = false;
      }
      if (!trusty) {
        m[head] = val;
        sift(m, pshift, head);
      }
    }

    function sift(m, pshift, head) {
      var rt,
          lf,
          mrt,
          mlf,
          val = m[head];
      while (pshift > 1) {
        rt = head - 1;
        lf = head - 1 - LP[pshift - 2];
        mrt = m[rt];
        mlf = m[lf];

        if (compare(val, mlf) >= 0 && compare(val, mrt) >= 0) break;

        if (compare(mlf, mrt) >= 0) {
          m[head] = mlf;
          head = lf;
          pshift--;
        } else {
          m[head] = mrt;
          head = rt;
          pshift -= 2;
        }
      }
      m[head] = val;
    }

    sort.compare = function(x) {
      if (!arguments.length) return compare;
      compare = x;
      return sort;
    };

    return sort;
  };

  // Solution for determining number of trailing zeroes of a number's binary representation.
  // Taken from http://www.0xe3.com/text/ntz/ComputingTrailingZerosHOWTO.html
  var MultiplyDeBruijnBitPosition = [
     0,  1, 28,  2, 29, 14, 24, 3,
    30, 22, 20, 15, 25, 17,  4, 8,
    31, 27, 13, 23, 21, 19, 16, 7,
    26, 12, 18,  6, 11,  5, 10, 9];

  function trailingzeroes(v) {
    return MultiplyDeBruijnBitPosition[(((v & -v) * 0x077CB531) >> 27) & 0x1f];
  }

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

})(typeof exports !== "undefined" ? exports : window);
