(function () {
  function normalPlot(canvas, sigma, title, xMin, xMax, color) {
    const c = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
    const L = 45, R = w - 15, T = 40, B = h - 35;
    c.clearRect(0, 0, w, h); c.fillStyle = "white"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#111"; c.textAlign = "center"; c.font = "bold 17px sans-serif"; c.fillText(title, w / 2, 22);
    c.strokeStyle = "#333"; c.lineWidth = 1; c.beginPath(); c.moveTo(L, T); c.lineTo(L, B); c.lineTo(R, B); c.stroke();
    const mx = L + (100 - xMin) / (xMax - xMin) * (R - L);
    c.setLineDash([6, 5]); c.strokeStyle = "#191970"; c.beginPath(); c.moveTo(mx, T); c.lineTo(mx, B); c.stroke(); c.setLineDash([]);
    c.strokeStyle = color; c.lineWidth = 4; c.beginPath();
    for (let i = 0; i <= 400; i += 1) {
      const x = xMin + i / 400 * (xMax - xMin);
      const y = Math.exp(-0.5 * ((x - 100) / sigma) ** 2);
      const px = L + i / 400 * (R - L), py = B - y * (B - T - 8);
      if (i) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.stroke(); c.fillStyle = "#333"; c.font = "12px sans-serif";
    c.fillText(String(xMin), L, B + 16); c.fillText("100", mx, B + 16); c.fillText(String(xMax), R, B + 16);
  }

  function initSigmaApp() {
    const slider = document.getElementById("population-sd-control");
    if (!slider || slider.dataset.ready) return;
    const label = document.getElementById("population-sd-label");
    const output = document.getElementById("vary-sigma-se");
    const formula = document.getElementById("vary-sigma-formula");
    const population = document.getElementById("population-curve");
    const means = document.getElementById("mean-curve");
    if (!label || !output || !formula || !population || !means) return;
    function update() {
      const sigma = Number(slider.value), se = sigma / Math.sqrt(50);
      label.textContent = sigma; output.textContent = se.toFixed(2);
      formula.textContent = "SE = " + sigma + " / sqrt(50)";
      normalPlot(population, sigma, "Population", 0, 200, "#555");
      normalPlot(means, se, "Sampling distribution of the mean", 70, 130, "#6495ed");
    }
    slider.dataset.ready = "1"; slider.addEventListener("input", update); update();
  }

  function randn() {
    let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function oneMean(n) { let total = 0; for (let i = 0; i < n; i += 1) total += 100 + 20 * randn(); return total / n; }
  function sampleSD(x) {
    const m = x.reduce((a, b) => a + b, 0) / x.length;
    return Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - 1));
  }
  function histogram(canvas, values, se, n) {
    const c = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
    const L = 55, R = w - 18, T = 42, B = h - 38, min = 70, max = 130, bins = 30;
    const counts = Array(bins).fill(0);
    values.forEach(v => { const j = Math.floor((v - min) / (max - min) * bins); if (j >= 0 && j < bins) counts[j] += 1; });
    const peak = Math.max(...counts), bw = (R - L) / bins;
    c.clearRect(0, 0, w, h); c.fillStyle = "white"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#111"; c.textAlign = "center"; c.font = "bold 18px sans-serif";
    c.fillText("Sampling distribution from 1,000 samples of n = " + n, w / 2, 23);
    c.fillStyle = "#6495ed"; counts.forEach((v, i) => { const bh = v / peak * (B - T); c.fillRect(L + i * bw, B - bh, Math.max(1, bw - 1), bh); });
    c.strokeStyle = "#333"; c.lineWidth = 1; c.beginPath(); c.moveTo(L, T); c.lineTo(L, B); c.lineTo(R, B); c.stroke();
    c.strokeStyle = "#191970"; c.lineWidth = 4; c.beginPath();
    for (let i = 0; i <= 400; i += 1) {
      const x = min + i / 400 * (max - min), y = Math.exp(-0.5 * ((x - 100) / se) ** 2);
      const px = L + i / 400 * (R - L), py = B - y * (B - T); if (i) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.stroke(); c.fillStyle = "#333"; c.font = "12px sans-serif";
    c.fillText("70", L, B + 16); c.fillText("100", (L + R) / 2, B + 16); c.fillText("130", R, B + 16);
  }

  function initNApp() {
    const slider = document.getElementById("sample-size-se-control");
    if (!slider || slider.dataset.ready) return;
    const button = document.getElementById("draw-sample-means"), label = document.getElementById("sample-size-se-label");
    const theoretical = document.getElementById("theoretical-se"), observed = document.getElementById("observed-se");
    const formula = document.getElementById("vary-n-formula"), canvas = document.getElementById("sample-means-hist");
    if (!button || !label || !theoretical || !observed || !formula || !canvas) return;
    function draw() {
      const n = Number(slider.value), se = 20 / Math.sqrt(n);
      const values = Array.from({ length: 1000 }, () => oneMean(n));
      theoretical.textContent = se.toFixed(2); observed.textContent = sampleSD(values).toFixed(2);
      formula.textContent = "SE = 20 / sqrt(" + n + ")"; histogram(canvas, values, se, n);
    }
    slider.dataset.ready = "1"; slider.addEventListener("input", () => { label.textContent = slider.value; });
    button.addEventListener("click", draw); label.textContent = slider.value; draw();
  }

  let ciSample = null;

  function drawGeneSample(n) {
    const source = window.module03GeneLengths;
    const pool = source.slice();
    const result = [];
    for (let i = 0; i < n; i += 1) {
      const j = i + Math.floor(Math.random() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
      result.push(pool[i]);
    }
    return result;
  }

  function drawCIChart(canvas, sample, mean, lower, upper, level) {
    const populationMean = 2622.03;
    const c = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
    const L = 62, R = w - 22, T = 35, B = h - 35;
    let min = Math.min(...sample, lower, populationMean);
    let max = Math.max(...sample, upper, populationMean);
    const padding = Math.max(100, (max - min) * 0.08);
    min -= padding; max += padding;
    const xMap = value => L + (value - min) / (max - min) * (R - L);

    c.clearRect(0, 0, w, h); c.fillStyle = "white"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#111"; c.textAlign = "center"; c.font = "bold 18px sans-serif";
    c.fillText(level + "% confidence interval from one sample", w / 2, 22);

    c.strokeStyle = "#c62828"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(xMap(populationMean), T); c.lineTo(xMap(populationMean), B); c.stroke();
    c.fillStyle = "#c62828"; c.font = "bold 13px sans-serif";
    c.fillText("Population mean", xMap(populationMean), T + 14);

    c.fillStyle = "rgba(100,149,237,0.72)";
    sample.slice().sort((a, b) => a - b).forEach((value, index) => {
      c.beginPath(); c.arc(xMap(value), 73 + (index % 5) * 10, 3.5, 0, 2 * Math.PI); c.fill();
    });
    c.fillStyle = "#333"; c.textAlign = "left"; c.font = "12px sans-serif"; c.fillText("Sampled values", L, 48);

    const intervalY = 168;
    c.strokeStyle = "#191970"; c.lineWidth = 8;
    c.beginPath(); c.moveTo(xMap(lower), intervalY); c.lineTo(xMap(upper), intervalY); c.stroke();
    c.lineWidth = 2;
    [lower, upper].forEach(value => { c.beginPath(); c.moveTo(xMap(value), intervalY - 12); c.lineTo(xMap(value), intervalY + 12); c.stroke(); });
    c.fillStyle = "#191970"; c.beginPath(); c.arc(xMap(mean), intervalY, 7, 0, 2 * Math.PI); c.fill();
    c.textAlign = "center"; c.font = "12px sans-serif";
    c.fillText("lower", xMap(lower), intervalY + 30); c.fillText("sample mean", xMap(mean), intervalY - 15); c.fillText("upper", xMap(upper), intervalY + 30);

    c.strokeStyle = "#333"; c.lineWidth = 1; c.beginPath(); c.moveTo(L, B); c.lineTo(R, B); c.stroke();
    c.fillStyle = "#333"; c.fillText(Math.round(min).toLocaleString(), L, B + 17); c.fillText(Math.round(max).toLocaleString(), R, B + 17);
  }

  function updateCIApps() {
    if (!ciSample) return;
    const populationMean = 2622.03, populationSD = 2036.97;
    const mean = ciSample.reduce((a, b) => a + b, 0) / ciSample.length;
    const se = populationSD / Math.sqrt(ciSample.length);
    document.querySelectorAll(".ci-single-app").forEach(app => {
      const z = Number(app.dataset.z), level = app.dataset.level;
      const margin = z * se, lower = mean - margin, upper = mean + margin;
      app.querySelector(".ci-n").value = ciSample.length;
      app.querySelector(".ci-n-label").textContent = ciSample.length;
      app.querySelector(".ci-mean").textContent = mean.toFixed(2);
      app.querySelector(".ci-se").textContent = se.toFixed(2);
      app.querySelector(".ci-moe").textContent = margin.toFixed(2);
      app.querySelector(".ci-interval").textContent = "(" + lower.toFixed(2) + ", " + upper.toFixed(2) + ")";
      const captures = lower <= populationMean && populationMean <= upper;
      const result = app.querySelector(".ci-result");
      result.textContent = captures ? "This interval includes the population mean." : "This interval misses the population mean.";
      result.style.color = captures ? "#1b6e3c" : "#c62828";
      app.querySelector(".ci-values span").textContent = ciSample.slice().sort((a, b) => a - b).map(v => Math.round(v).toLocaleString()).join(", ");
      drawCIChart(app.querySelector("canvas"), ciSample, mean, lower, upper, level);
    });
  }

  function initCIApps() {
    const apps = Array.from(document.querySelectorAll(".ci-single-app"));
    if (!apps.length || !window.module03GeneLengths || apps[0].dataset.ready) return;
    apps.forEach(app => {
      const slider = app.querySelector(".ci-n");
      slider.addEventListener("input", () => {
        apps.forEach(other => {
          other.querySelector(".ci-n").value = slider.value;
          other.querySelector(".ci-n-label").textContent = slider.value;
        });
      });
      slider.addEventListener("change", () => { ciSample = drawGeneSample(Number(slider.value)); updateCIApps(); });
      app.querySelector(".ci-draw").addEventListener("click", () => { ciSample = drawGeneSample(Number(slider.value)); updateCIApps(); });
      app.dataset.ready = "1";
    });
    ciSample = drawGeneSample(30);
    updateCIApps();
  }

  function wilsonInterval(x, n, z) {
    const phat = x / n;
    const denominator = 1 + z * z / n;
    const center = (phat + z * z / (2 * n)) / denominator;
    const half = z / denominator * Math.sqrt(phat * (1 - phat) / n + z * z / (4 * n * n));
    return { phat, lower: center - half, upper: center + half };
  }

  function proportionInterval(x, n, z, method) {
    const phat = x / n;
    if (method === "wald") {
      const half = z * Math.sqrt(phat * (1 - phat) / n);
      return { phat, lower: phat - half, upper: phat + half };
    }
    if (method === "agresti") {
      const adjustedN = n + z * z;
      const adjustedP = (x + z * z / 2) / adjustedN;
      const half = z * Math.sqrt(adjustedP * (1 - adjustedP) / adjustedN);
      return { phat, lower: adjustedP - half, upper: adjustedP + half };
    }
    return wilsonInterval(x, n, z);
  }

  function drawProportionCalculator(canvas, interval, methodLabel) {
    const c = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
    const L = 55, R = w - 22, y = 155, xMap = value => L + value * (R - L);
    c.clearRect(0, 0, w, h); c.fillStyle = "white"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#111"; c.textAlign = "center"; c.font = "bold 18px sans-serif";
    c.fillText(methodLabel + " confidence interval", w / 2, 25);
    c.setLineDash([6, 5]); c.strokeStyle = "#666"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(xMap(0.5), 45); c.lineTo(xMap(0.5), y); c.stroke(); c.setLineDash([]);
    c.fillStyle = "#555"; c.font = "13px sans-serif"; c.fillText("50% majority threshold", xMap(0.5), 58);
    c.strokeStyle = "#333"; c.lineWidth = 1; c.beginPath(); c.moveTo(L, y); c.lineTo(R, y); c.stroke();
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const px = xMap(p); c.beginPath(); c.moveTo(px, y - 4); c.lineTo(px, y + 4); c.stroke();
      c.fillStyle = "#333"; c.fillText(p.toFixed(1), px, y + 20);
    }
    const lo = Math.max(0, interval.lower), hi = Math.min(1, interval.upper);
    c.strokeStyle = "#191970"; c.lineWidth = 10; c.beginPath(); c.moveTo(xMap(lo), y - 35); c.lineTo(xMap(hi), y - 35); c.stroke();
    c.lineWidth = 2; [lo, hi].forEach(value => { c.beginPath(); c.moveTo(xMap(value), y - 47); c.lineTo(xMap(value), y - 23); c.stroke(); });
    c.fillStyle = "#191970"; c.beginPath(); c.arc(xMap(interval.phat), y - 35, 7, 0, 2 * Math.PI); c.fill();
    c.fillText("p̂", xMap(interval.phat), y - 52);
  }

  function initProportionCalculator() {
    document.querySelectorAll(".prop-calc-app:not([data-ready])").forEach(app => {
      const xInput = app.querySelector(".calc-x"), nInput = app.querySelector(".calc-n");
      const level = app.querySelector(".calc-level");
      function render() {
        let n = Math.max(1, Math.round(Number(nInput.value) || 1));
        let x = Math.max(0, Math.min(n, Math.round(Number(xInput.value) || 0)));
        nInput.value = n; xInput.max = n; xInput.value = x;
        const interval = proportionInterval(x, n, Number(level.value), "wilson");
        const methodLabel = "Wilson";
        app.querySelector(".calc-phat").textContent = interval.phat.toFixed(3);
        app.querySelector(".calc-interval").textContent = "(" + interval.lower.toFixed(3) + ", " + interval.upper.toFixed(3) + ")";
        app.querySelector(".calc-percent").textContent = "(" + (100 * interval.lower).toFixed(1) + "%, " + (100 * interval.upper).toFixed(1) + "%)";
        const result = app.querySelector(".calc-result");
        if (interval.lower > 0.5) result.textContent = "The interval indicates majority support for consolidation.";
        else if (interval.upper < 0.5) result.textContent = "The interval indicates majority opposition to consolidation.";
        else result.textContent = "The interval includes 0.50, so the sample does not establish a majority position.";
        result.style.color = interval.lower > 0.5 || interval.upper < 0.5 ? "#1b6e3c" : "#191970";
        drawProportionCalculator(app.querySelector("canvas"), interval, methodLabel);
      }
      [xInput, nInput].forEach(input => input.addEventListener("input", render));
      level.addEventListener("change", render);
      app.dataset.ready = "1"; render();
    });
  }

  function initProportionHomeworkCalculator() {
    document.querySelectorAll(".prop-homework-app:not([data-ready])").forEach(app => {
      const xInput = app.querySelector(".homework-x"), nInput = app.querySelector(".homework-n");
      const level = app.querySelector(".homework-level");
      function render() {
        const n = Math.max(1, Math.round(Number(nInput.value) || 1));
        const x = Math.max(0, Math.min(n, Math.round(Number(xInput.value) || 0)));
        nInput.value = n; xInput.max = n; xInput.value = x;
        app.querySelector(".homework-phat").textContent = (x / n).toFixed(3);
        ["wilson", "wald", "agresti"].forEach(method => {
          const interval = proportionInterval(x, n, Number(level.value), method);
          const row = app.querySelector('tr[data-method="' + method + '"]');
          row.querySelector(".lower").textContent = interval.lower.toFixed(3);
          row.querySelector(".upper").textContent = interval.upper.toFixed(3);
          row.querySelector(".width").textContent = (interval.upper - interval.lower).toFixed(3);
        });
        const note = app.querySelector(".homework-note");
        note.textContent = (x === 0 || x === n)
          ? "Notice the Wald result at the boundary. This is one reason Wilson is the default."
          : "Wilson is highlighted as the recommended reporting interval.";
      }
      [xInput, nInput].forEach(input => input.addEventListener("input", render));
      level.addEventListener("change", render);
      app.dataset.ready = "1"; render();
    });
  }

  const tCritical95 = [null, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262,
    2.228, 2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093,
    2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];

  function criticalT95(df) {
    if (df <= 30) return tCritical95[df];
    const z = 1.959964;
    return z + (z ** 3 + z) / (4 * df) + (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df * df);
  }

  function logGamma(z) {
    const coefficients = [0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531,
      -176.6150291621406, 12.5073432786869, -0.13857109526572, 0.00000998436957802, 0.000000150563273515];
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    z -= 1; let x = coefficients[0];
    for (let i = 1; i < coefficients.length; i += 1) x += coefficients[i] / (z + i);
    const t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }

  function tDensity(x, df) {
    return Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2)) /
      Math.sqrt(df * Math.PI) * (1 + x * x / df) ** (-(df + 1) / 2);
  }

  function drawTNeedChart(canvas, df, tCritical) {
    const c = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
    const L = 45, R = w - 18, T = 35, B = h - 32, min = -4.5, max = 4.5;
    const xMap = x => L + (x - min) / (max - min) * (R - L), yMap = y => B - y / 0.42 * (B - T);
    c.clearRect(0, 0, w, h); c.fillStyle = "white"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#111"; c.textAlign = "center"; c.font = "bold 17px sans-serif";
    c.fillText("Why t is wider when sigma is estimated (df = " + df + ")", w / 2, 21);
    c.strokeStyle = "#333"; c.lineWidth = 1; c.beginPath(); c.moveTo(L, B); c.lineTo(R, B); c.stroke();
    function curve(color, density) {
      c.strokeStyle = color; c.lineWidth = 3; c.beginPath();
      for (let i = 0; i <= 500; i += 1) {
        const x = min + i / 500 * (max - min), px = xMap(x), py = yMap(density(x));
        if (i) c.lineTo(px, py); else c.moveTo(px, py);
      } c.stroke();
    }
    curve("#999", x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI));
    curve("#191970", x => tDensity(x, df));
    [[1.96, "#999"], [tCritical, "#191970"]].forEach(([value, color]) => {
      c.setLineDash([5, 4]); c.strokeStyle = color; c.lineWidth = 2;
      [-value, value].forEach(v => { c.beginPath(); c.moveTo(xMap(v), T + 10); c.lineTo(xMap(v), B); c.stroke(); }); c.setLineDash([]);
    });
    c.font = "13px sans-serif"; c.fillStyle = "#777"; c.textAlign = "left"; c.fillText("z", L + 8, T + 15);
    c.fillStyle = "#191970"; c.fillText("t", L + 28, T + 15);
    c.textAlign = "center"; c.fillStyle = "#333";
    [-4, -2, 0, 2, 4].forEach(v => c.fillText(String(v), xMap(v), B + 17));
  }

  function initTNeedApp() {
    document.querySelectorAll(".t-need-app:not([data-ready])").forEach(app => {
      const nInput = app.querySelector(".t-n"), xbarInput = app.querySelector(".t-xbar");
      const sInput = app.querySelector(".t-s"), muInput = app.querySelector(".t-mu");
      function render() {
        const n = Number(nInput.value), xbar = Number(xbarInput.value), s = Math.max(0.1, Number(sInput.value));
        const mu = Number(muInput.value), df = n - 1, se = s / Math.sqrt(n), statistic = (xbar - mu) / se;
        const tc = criticalT95(df), zHalf = 1.96 * se, tHalf = tc * se;
        app.querySelector(".t-n-label").textContent = n;
        app.querySelector(".t-se").textContent = se.toFixed(3);
        app.querySelector(".t-value").textContent = statistic.toFixed(3);
        app.querySelector(".z-critical").textContent = "1.960";
        app.querySelector(".t-critical").textContent = tc.toFixed(3);
        app.querySelector(".z-ci").textContent = "(" + (xbar - zHalf).toFixed(2) + ", " + (xbar + zHalf).toFixed(2) + ")";
        app.querySelector(".t-ci").textContent = "(" + (xbar - tHalf).toFixed(2) + ", " + (xbar + tHalf).toFixed(2) + ")";
        const includes = xbar - tHalf <= mu && mu <= xbar + tHalf;
        app.querySelector(".t-result").textContent = includes
          ? "The correct t interval includes the 15-day benchmark; this audit does not clearly show a different mean."
          : "The correct t interval excludes the 15-day benchmark; this audit provides evidence of a different mean.";
        drawTNeedChart(app.querySelector("canvas"), df, tc);
      }
      [nInput, xbarInput, sInput, muInput].forEach(input => input.addEventListener("input", render));
      app.dataset.ready = "1"; render();
    });
  }

  function drawTConvergenceChart(canvas, df, tc) {
    const c = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
    const L = 52, R = w - 18, T = 42, B = h - 38, min = -4.5, max = 4.5;
    const xMap = x => L + (x - min) / (max - min) * (R - L), yMap = y => B - y / 0.42 * (B - T);
    c.clearRect(0, 0, w, h); c.fillStyle = "white"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#111"; c.textAlign = "center"; c.font = "bold 18px sans-serif";
    c.fillText("Standard normal and Student's t (df = " + df + ")", w / 2, 24);
    c.strokeStyle = "#333"; c.lineWidth = 1; c.beginPath(); c.moveTo(L, B); c.lineTo(R, B); c.stroke();
    function curve(color, density) {
      c.strokeStyle = color; c.lineWidth = 4; c.beginPath();
      for (let i = 0; i <= 600; i += 1) {
        const x = min + i / 600 * (max - min), px = xMap(x), py = yMap(density(x));
        if (i) c.lineTo(px, py); else c.moveTo(px, py);
      } c.stroke();
    }
    curve("#999", x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI));
    curve("#191970", x => tDensity(x, df));
    [[1.96, "#999"], [tc, "#191970"]].forEach(([value, color]) => {
      c.setLineDash([6, 5]); c.strokeStyle = color; c.lineWidth = 2;
      [-value, value].forEach(v => { c.beginPath(); c.moveTo(xMap(v), T + 8); c.lineTo(xMap(v), B); c.stroke(); }); c.setLineDash([]);
    });
    c.font = "bold 13px sans-serif"; c.textAlign = "left";
    c.fillStyle = "#999"; c.fillText("Standard normal z", L + 10, T + 15);
    c.fillStyle = "#191970"; c.fillText("Student's t", L + 10, T + 34);
    c.textAlign = "center"; c.font = "12px sans-serif"; c.fillStyle = "#333";
    [-4, -2, 0, 2, 4].forEach(v => c.fillText(String(v), xMap(v), B + 18));
    c.fillStyle = "#777"; c.fillText("z* = 1.960", xMap(1.96), B - 8);
    c.fillStyle = "#191970"; c.fillText("t* = " + tc.toFixed(3), xMap(tc), B - 24);
  }

  function initTConvergenceApp() {
    document.querySelectorAll(".t-convergence-app:not([data-ready])").forEach(app => {
      const slider = app.querySelector(".tc-slider");
      function render() {
        const n = Number(slider.value), df = n - 1, tc = criticalT95(df);
        app.querySelector(".tc-n").textContent = n;
        app.querySelector(".tc-df").textContent = df;
        app.querySelector(".tc-critical").textContent = tc.toFixed(3);
        app.querySelector(".tc-extra").textContent = ((tc / 1.959964 - 1) * 100).toFixed(1) + "%";
        drawTConvergenceChart(app.querySelector("canvas"), df, tc);
      }
      slider.addEventListener("input", render); app.dataset.ready = "1"; render();
    });
  }

  function drawProportionChart(canvas, outcomes, interval, trueP, context) {
    const c = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
    const L = 55, R = w - 22, T = 38, B = h - 36;
    const xMap = value => L + value * (R - L);
    c.clearRect(0, 0, w, h); c.fillStyle = "white"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#111"; c.textAlign = "center"; c.font = "bold 18px sans-serif";
    c.fillText(context === "election" ? "Sampled voters and Wilson interval" : "Sampled riders and Wilson interval", w / 2, 23);

    const columns = 40, dotGapX = (R - L) / columns, dotGapY = 10;
    outcomes.forEach((success, index) => {
      const col = index % columns, row = Math.floor(index / columns);
      c.fillStyle = success ? "#3977b8" : "#c9c9c9";
      c.beginPath(); c.arc(L + col * dotGapX + dotGapX / 2, 52 + row * dotGapY, 3.5, 0, 2 * Math.PI); c.fill();
    });
    c.fillStyle = "#333"; c.textAlign = "left"; c.font = "12px sans-serif";
    c.fillText("Blue = yes/satisfied; gray = no/not satisfied", L, 45);

    const y = 238;
    c.strokeStyle = "#333"; c.lineWidth = 1; c.beginPath(); c.moveTo(L, y); c.lineTo(R, y); c.stroke();
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const px = xMap(p); c.beginPath(); c.moveTo(px, y - 4); c.lineTo(px, y + 4); c.stroke();
      c.textAlign = "center"; c.fillText(p.toFixed(1), px, y + 18);
    }

    if (context === "election") {
      c.setLineDash([5, 5]); c.strokeStyle = "#666"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(xMap(0.5), T); c.lineTo(xMap(0.5), y); c.stroke(); c.setLineDash([]);
      c.fillStyle = "#555"; c.fillText("50%", xMap(0.5), T + 13);
    }
    c.strokeStyle = "#c62828"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(xMap(trueP), T); c.lineTo(xMap(trueP), y); c.stroke();
    c.fillStyle = "#c62828"; c.fillText("True p", xMap(trueP), T + 29);

    c.strokeStyle = "#191970"; c.lineWidth = 9;
    c.beginPath(); c.moveTo(xMap(interval.lower), y - 28); c.lineTo(xMap(interval.upper), y - 28); c.stroke();
    c.lineWidth = 2;
    [interval.lower, interval.upper].forEach(value => { c.beginPath(); c.moveTo(xMap(value), y - 39); c.lineTo(xMap(value), y - 17); c.stroke(); });
    c.fillStyle = "#191970"; c.beginPath(); c.arc(xMap(interval.phat), y - 28, 7, 0, 2 * Math.PI); c.fill();
    c.fillText("p̂", xMap(interval.phat), y - 44);
  }

  function initProportionApps() {
    document.querySelectorAll(".prop-ci-app:not([data-ready])").forEach(app => {
      const slider = app.querySelector(".prop-n"), label = app.querySelector(".prop-n-label");
      const level = app.querySelector(".prop-level"), button = app.querySelector(".prop-draw");
      const trueP = Number(app.dataset.trueP), context = app.dataset.context;
      let outcomes = [];

      function render() {
        const n = outcomes.length, x = outcomes.filter(Boolean).length, z = Number(level.value);
        const interval = wilsonInterval(x, n, z);
        app.querySelector(".prop-x").textContent = x;
        app.querySelector(".prop-phat").textContent = interval.phat.toFixed(3);
        app.querySelector(".prop-z").textContent = z.toFixed(3);
        app.querySelector(".prop-interval").textContent = "(" + interval.lower.toFixed(3) + ", " + interval.upper.toFixed(3) + ")";
        const captures = interval.lower <= trueP && trueP <= interval.upper;
        let message = captures ? "The interval includes the true population proportion." : "The interval misses the true population proportion.";
        if (context === "election") {
          if (interval.lower > 0.5) message += " It indicates majority support.";
          else if (interval.upper < 0.5) message += " It indicates majority opposition.";
          else message += " It does not clearly establish a majority.";
        }
        const result = app.querySelector(".prop-result"); result.textContent = message; result.style.color = captures ? "#1b6e3c" : "#c62828";
        drawProportionChart(app.querySelector("canvas"), outcomes, interval, trueP, context);
      }
      function draw() {
        const n = Number(slider.value);
        outcomes = Array.from({ length: n }, () => Math.random() < trueP);
        render();
      }
      slider.addEventListener("input", () => { label.textContent = slider.value; });
      slider.addEventListener("change", draw); button.addEventListener("click", draw); level.addEventListener("change", render);
      app.dataset.ready = "1"; label.textContent = slider.value; draw();
    });
  }

  function typesetCIApps() {
    if (!window.MathJax || !window.MathJax.Hub) return;
    document.querySelectorAll(".ci-single-app:not([data-math-ready]), .prop-ci-app:not([data-math-ready]), .prop-calc-app:not([data-math-ready]), .prop-homework-app:not([data-math-ready]), .t-need-app:not([data-math-ready]), .t-convergence-app:not([data-math-ready])").forEach(app => {
      app.dataset.mathReady = "1";
      window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, app]);
    });
  }

  function initGeneApp() {
    document.querySelectorAll("script.slide-app-script:not([data-app-ran])").forEach(script => {
      if (!script.textContent.includes("const genes")) return;
      script.dataset.appRan = "1"; try { Function(script.textContent)(); } catch (e) { console.error(e); }
    });
  }
  function init() { initSigmaApp(); initNApp(); initGeneApp(); initCIApps(); initProportionApps(); initProportionCalculator(); initProportionHomeworkCalculator(); initTNeedApp(); initTConvergenceApp(); typesetCIApps(); }
  window.addEventListener("load", init); document.addEventListener("DOMContentLoaded", init);
  let tries = 0; const timer = setInterval(() => { init(); tries += 1; if (tries === 24) clearInterval(timer); }, 250);
})();
