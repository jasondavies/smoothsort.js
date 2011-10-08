var sort = require("./smoothsort").smoothsort();

var size = 1000000,
    mix = 100,
    a = [],
    b,
    c,
    start;

// Set up
for (var i=0; i<size; i++) a[i] = i + Math.random() * mix - mix / 2;
b = a.slice();
c = a.slice();

start = new Date;
sort(b);
console.log((new Date) - start);

start = new Date;
c.sort(function(a, b) { return a - b; });
console.log((new Date) - start);

for (var i=0; i<size; i++) if (b[i] !== c[i]) { console.log("FAIL", b[i], c[i], i, b.slice(0, i+5), c.slice(0, i+5)); break; }
