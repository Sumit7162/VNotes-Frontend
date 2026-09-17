/**
 * The document rendered inside the RecursiveErosionBackground iframe.
 *
 * NOTE: this is a stand-in. The upstream component ships its own
 * `recursive-erosion-source` module, which was not included with the component
 * we were given, so this is an original implementation written to the same
 * contract. If you obtain the real one, replace this file wholesale - nothing
 * else has to change, because the only thing recursive-erosion.tsx requires of
 * it is a complete HTML document containing `</head>`, `</body>` and an element
 * with id `stage`.
 *
 * Self-contained on purpose: the iframe is sandboxed with `allow-scripts` and
 * no `allow-same-origin`, so pulling a library off a CDN is one more thing that
 * can fail at runtime for what is only decoration. Everything below is plain
 * canvas 2D.
 *
 * The effect: points are spread evenly over a sphere, then a drifting noise
 * field decides which of them still belong to it. Points below the threshold
 * are eroded - pushed outward and faded - and because the threshold breathes,
 * the sphere dissolves and reassembles continuously.
 */
export const recursiveErosionSource = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Recursive Erosion</title>
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #0a0908; }
  #stage { position: relative; width: 100%; height: 100%; }
  #field { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="stage"><canvas id="field"></canvas></div>
<script>
(function () {
  var stage = document.getElementById('stage');
  var canvas = document.getElementById('field');
  var ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  var W = 1, H = 1, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth || window.innerWidth || 1;
    H = stage.clientHeight || window.innerHeight || 1;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- integer hash noise -----------------------------------------------
  // A shuffled permutation table rather than sin() hashing: this runs a few
  // thousand times per frame, and table lookups keep that affordable where
  // trigonometry would not.
  var PERM = new Uint8Array(512);
  (function () {
    var p = new Uint8Array(256), i;
    for (i = 0; i < 256; i++) p[i] = i;
    var s = 1013904223;
    function rnd() { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; }
    for (i = 255; i > 0; i--) {
      var j = (rnd() * (i + 1)) | 0, t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (i = 0; i < 512; i++) PERM[i] = p[i & 255];
  })();

  function h3(x, y, z) {
    return PERM[(PERM[(PERM[x & 255] + (y & 255)) & 255] + (z & 255)) & 255] / 255;
  }

  function noise3(x, y, z) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    var xf = x - xi, yf = y - yi, zf = z - zi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    var c000 = h3(xi, yi, zi), c100 = h3(xi + 1, yi, zi);
    var c010 = h3(xi, yi + 1, zi), c110 = h3(xi + 1, yi + 1, zi);
    var c001 = h3(xi, yi, zi + 1), c101 = h3(xi + 1, yi, zi + 1);
    var c011 = h3(xi, yi + 1, zi + 1), c111 = h3(xi + 1, yi + 1, zi + 1);
    var x00 = c000 + (c100 - c000) * u, x10 = c010 + (c110 - c010) * u;
    var x01 = c001 + (c101 - c001) * u, x11 = c011 + (c111 - c011) * u;
    var y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
    return y0 + (y1 - y0) * w;
  }

  // ---- the sphere --------------------------------------------------------
  // A Fibonacci lattice, which spaces points evenly without the pole crowding
  // a naive lat/long grid produces.
  var COUNT = 2600;
  var sx = new Float32Array(COUNT), sy = new Float32Array(COUNT), sz = new Float32Array(COUNT);
  var tint = new Uint8Array(COUNT);
  var golden = Math.PI * (3 - Math.sqrt(5));
  for (var i = 0; i < COUNT; i++) {
    var y = 1 - (i / (COUNT - 1)) * 2;
    var r = Math.sqrt(Math.max(0, 1 - y * y));
    var th = golden * i;
    sx[i] = Math.cos(th) * r; sy[i] = y; sz[i] = Math.sin(th) * r;
    tint[i] = i % 3;
  }

  // ---- palette -----------------------------------------------------------
  // Three hues from the product logo gradient - blue, violet, cyan - each
  // pre-rendered across eight alpha steps. Building rgba strings per particle
  // per frame is the one thing that reliably makes a canvas field stutter, so
  // every string a frame can need exists before the first frame runs.
  var HUES_DARK = [[74, 128, 236], [138, 104, 226], [58, 200, 208]];
  var HUES_LIGHT = [[28, 62, 150], [72, 48, 140], [20, 110, 122]];
  var STEPS = 8;
  var LUT_DARK = [], LUT_LIGHT = [], hi, ai;
  for (hi = 0; hi < 3; hi++) {
    LUT_DARK[hi] = []; LUT_LIGHT[hi] = [];
    for (ai = 0; ai < STEPS; ai++) {
      var a = ((ai + 1) / STEPS).toFixed(3);
      var d = HUES_DARK[hi], l = HUES_LIGHT[hi];
      LUT_DARK[hi][ai] = 'rgba(' + d[0] + ',' + d[1] + ',' + d[2] + ',' + a + ')';
      LUT_LIGHT[hi][ai] = 'rgba(' + l[0] + ',' + l[1] + ',' + l[2] + ',' + a + ')';
    }
  }

  function isLight() { return document.documentElement.dataset.sfMode === 'light'; }

  var reduce = false;
  try {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { reduce = false; }

  var start = performance.now();

  function frame(now) {
    var time = reduce ? 6 : (now - start) / 1000;
    var light = isLight();
    var LUT = light ? LUT_LIGHT : LUT_DARK;

    ctx.fillStyle = light ? '#f4f3f1' : '#0a0908';
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2, cy = H / 2;
    var radius = Math.min(W, H) * 0.36;

    // A soft core behind the points, so the sphere reads as a volume rather
    // than a flat scatter of dots.
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.9);
    glow.addColorStop(0, light ? 'rgba(80,110,200,0.13)' : 'rgba(70,110,220,0.16)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    var ry = time * 0.17;
    var rx = 0.42 + Math.sin(time * 0.21) * 0.16;
    var cosY = Math.cos(ry), sinY = Math.sin(ry);
    var cosX = Math.cos(rx), sinX = Math.sin(rx);

    // The threshold breathes, so the sphere erodes and reassembles rather than
    // settling into one fixed silhouette.
    var thr = 0.44 + Math.sin(time * 0.33) * 0.17;
    var drift = time * 0.14;
    var camZ = 3.05, fov = 2.05;

    for (var i = 0; i < COUNT; i++) {
      var x = sx[i], y0 = sy[i], z = sz[i];

      // Two octaves: the coarse one carves continents, the fine one frays
      // their edges so the boundary never looks like a clean cut.
      var n =
        noise3(x * 1.85 + drift, y0 * 1.85, z * 1.85 + drift * 0.6) * 0.68 +
        noise3(x * 4.3 - drift * 0.9, y0 * 4.3, z * 4.3) * 0.32;

      var eroded = n < thr;
      var push = eroded ? 1 + (thr - n) * 2.4 : 1;
      if (eroded && push > 1.85) continue;

      var ex = x * push, ey = y0 * push, ez = z * push;

      var x1 = ex * cosY - ez * sinY;
      var z1 = ex * sinY + ez * cosY;
      var y2 = ey * cosX - z1 * sinX;
      var z2 = ey * sinX + z1 * cosX;

      var denom = camZ - z2;
      if (denom <= 0.05) continue;
      var k = fov / denom;
      var px = cx + x1 * k * radius;
      var py = cy + y2 * k * radius;
      if (px < -8 || px > W + 8 || py < -8 || py > H + 8) continue;

      // Depth drives both size and opacity, which is what sells the volume.
      var depth = (z2 + 1) / 2;
      var alpha = 0.20 + depth * 0.78;
      if (eroded) alpha *= Math.max(0, 1 - (push - 1) * 1.25);
      if (alpha <= 0.02) continue;

      var step = (alpha * STEPS) | 0;
      if (step > STEPS - 1) step = STEPS - 1;
      if (step < 0) step = 0;

      var size = 0.7 + depth * 1.7;
      ctx.fillStyle = LUT[tint[i]][step];
      ctx.fillRect(px, py, size, size);
    }

    if (!reduce) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
</script>
</body>
</html>`;
