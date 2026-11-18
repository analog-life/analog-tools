/* WaveDrom 工具页逻辑：编辑器 + 实时预览 + 导出 + 主题/语言联动 */
"use strict";

/* ---------- 双语文案 ---------- */
window.AT_I18N = {
  manualBtn:     { zh: "使用手册", en: "User Manual" },
  intro:         { zh: "编写 WaveJSON，实时渲染数字电路时序图。所有处理均在本地完成，不上传任何数据。",
                   en: "Write WaveJSON and render digital timing diagrams live. Everything runs locally; nothing is uploaded." },
  creditPrefix:  { zh: "基于开源项目 ", en: "Built on the open-source project " },
  creditSuffix:  { zh: " （MIT 许可）· 原作者 Aliaksei Chapyzhenka", en: " (MIT License) · Original author: Aliaksei Chapyzhenka" },
  exampleLabel:  { zh: "示例", en: "Examples" },
  exportSvg:     { zh: "导出 SVG", en: "Export SVG" },
  exportPng:     { zh: "导出 PNG", en: "Export PNG" },
  editorLabel:   { zh: "代码（WaveJSON）", en: "Code (WaveJSON)" },
  previewLabel:  { zh: "预览", en: "Preview" },
  errJson:       { zh: "JSON 语法错误：", en: "JSON syntax error: " },
  errRender:     { zh: "渲染错误：", en: "Render error: " },
  errNoSvg:      { zh: "暂无可导出的图形。", en: "Nothing to export yet." }
};

/* ---------- 内置示例 ---------- */
var EXAMPLES = [
  {
    id: "basic",
    zh: "基础：时钟与数据",
    en: "Basic: clock & data",
    code: [
      '{ "signal": [',
      '  { "name": "clk",  "wave": "p......" },',
      '  { "name": "data", "wave": "x.345x.", "data": ["head", "body", "tail"] },',
      '  { "name": "req",  "wave": "0.1..0." }',
      ']}'
    ].join("\n")
  },
  {
    id: "spi",
    zh: "SPI 传输",
    en: "SPI transfer",
    code: [
      '{ "signal": [',
      '  { "name": "SCLK", "wave": "p......." },',
      '  { "name": "MOSI", "wave": "x.2.2.2.2x", "data": ["D7", "D6", "D5", "D4"] },',
      '  { "name": "MISO", "wave": "x.5.5.5.5x", "data": ["D7", "D6", "D5", "D4"] },',
      '  { "name": "CS",   "wave": "1.0......1" }',
      '],',
      '  "config": { "hscale": 2 }',
      '}'
    ].join("\n")
  },
  {
    id: "edge",
    zh: "边沿与时序标注",
    en: "Edges & timing arcs",
    code: [
      '{ "signal": [',
      '  { "name": "clk", "wave": "p.......", "node": "..a.....b" },',
      '  { "name": "d",   "wave": "x.3.4.5x", "data": ["D0", "D1", "D2"], "node": "...c....d" }',
      '],',
      '  "edge": [',
      '    "a~>c setup",',
      '    "d~>b hold"',
      '  ]',
      '}'
    ].join("\n")
  },
  {
    id: "reg",
    zh: "寄存器位域",
    en: "Register bit-fields",
    code: [
      '{ "reg": [',
      '  { "name": "EN",   "bits": 1, "attr": "rw" },',
      '  { "bits": 3 },',
      '  { "name": "MODE", "bits": 4, "attr": "rw" },',
      '  { "name": "DATA", "bits": 8, "attr": "ro" }',
      '],',
      '  "config": { "bits": 16, "lanes": 1 }',
      '}'
    ].join("\n")
  }
];

(function () {
  var editor  = document.getElementById("wd-editor");
  var errorEl = document.getElementById("wd-error");
  var exampleSel = document.getElementById("wd-example");
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  /* ---------- 主题感知 ---------- */
  function isDark() {
    var t = document.documentElement.dataset.theme;
    if (t === "dark") return true;
    if (t === "light") return false;
    return mq.matches;
  }

  function bgColor() {
    return getComputedStyle(document.body).backgroundColor;
  }

  /* ---------- 错误提示 ---------- */
  function showError(kind, msg) {
    var lang = window.AT_LANG ? window.AT_LANG.current() : "zh";
    var dict = window.AT_I18N[kind];
    errorEl.textContent = (dict ? dict[lang] : "") + msg;
    errorEl.classList.add("show");
  }
  function clearError() {
    errorEl.textContent = "";
    errorEl.classList.remove("show");
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var text = editor.value.trim();
    if (!text) {
      document.getElementById("WaveDrom_Display_0").innerHTML = "";
      clearError();
      return;
    }
    var src;
    try {
      src = JSON.parse(text);
    } catch (e) {
      showError("errJson", e.message);
      return;
    }
    /* 克隆后注入皮肤，不改动用户输入 */
    var themed = JSON.parse(JSON.stringify(src));
    themed.config = Object.assign({}, themed.config, {
      skin: isDark() ? "dark" : "default"
    });
    try {
      document.getElementById("WaveDrom_Display_0").innerHTML = "";
      wavedrom.renderWaveForm(0, themed, "WaveDrom_Display_");
      clearError();
    } catch (e) {
      showError("errRender", e.message || String(e));
    }
  }

  var timer = null;
  editor.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(render, 300);
  });

  /* ---------- 示例 ---------- */
  function rebuildExamples() {
    var lang = window.AT_LANG.current();
    var keep = exampleSel.value;
    exampleSel.innerHTML = "";
    EXAMPLES.forEach(function (ex) {
      var opt = document.createElement("option");
      opt.value = ex.id;
      opt.textContent = ex[lang];
      exampleSel.appendChild(opt);
    });
    if (EXAMPLES.some(function (ex) { return ex.id === keep; })) exampleSel.value = keep;
  }
  exampleSel.addEventListener("change", function () {
    var ex = EXAMPLES.find(function (e) { return e.id === exampleSel.value; });
    if (ex) { editor.value = ex.code; render(); }
  });
  document.addEventListener("at-lang-change", rebuildExamples);

  /* ---------- 导出 ---------- */
  function currentSvg() {
    return document.querySelector("#WaveDrom_Display_0 svg");
  }

  function serializedSvg() {
    var svg = currentSvg();
    if (!svg) return null;
    var clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var bbox;
    try { bbox = svg.getBBox(); } catch (e) { bbox = null; }
    var w = bbox ? Math.ceil(bbox.x + bbox.width + 16) : 800;
    var h = bbox ? Math.ceil(bbox.y + bbox.height + 16) : 300;
    clone.setAttribute("width", w);
    clone.setAttribute("height", h);
    clone.setAttribute("viewBox", bbox
      ? (Math.floor(bbox.x) - 8) + " " + (Math.floor(bbox.y) - 8) + " " + w + " " + h
      : "0 0 " + w + " " + h);
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", bbox ? Math.floor(bbox.x) - 8 : 0);
    rect.setAttribute("y", bbox ? Math.floor(bbox.y) - 8 : 0);
    rect.setAttribute("width", w);
    rect.setAttribute("height", h);
    rect.setAttribute("fill", bgColor());
    clone.insertBefore(rect, clone.firstChild);
    return { xml: new XMLSerializer().serializeToString(clone), w: w, h: h };
  }

  function download(href, filename) {
    var a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  document.getElementById("wd-export-svg").addEventListener("click", function () {
    var s = serializedSvg();
    if (!s) { showError("errRender", (window.AT_I18N.errNoSvg)[window.AT_LANG.current()]); return; }
    var blob = new Blob([s.xml], { type: "image/svg+xml;charset=utf-8" });
    download(URL.createObjectURL(blob), "wavedrom.svg");
  });

  document.getElementById("wd-export-png").addEventListener("click", function () {
    var s = serializedSvg();
    if (!s) { showError("errRender", (window.AT_I18N.errNoSvg)[window.AT_LANG.current()]); return; }
    var img = new Image();
    img.onload = function () {
      var scale = 2;
      var canvas = document.createElement("canvas");
      canvas.width = s.w * scale;
      canvas.height = s.h * scale;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = bgColor();
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      download(canvas.toDataURL("image/png"), "wavedrom.png");
    };
    img.onerror = function () { showError("errRender", "PNG"); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s.xml);
  });

  /* ---------- 主题变化时重渲染 ---------- */
  new MutationObserver(function () { render(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (mq.addEventListener) {
    mq.addEventListener("change", function () {
      if (!document.documentElement.dataset.theme) render();
    });
  }

  /* ---------- 初始化 ---------- */
  rebuildExamples();
  editor.value = EXAMPLES[0].code;
  render();
})();
