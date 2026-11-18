/* WaveDrom 工具页逻辑：编辑器 + 实时预览 + 导出 + 主题/语言联动 */
"use strict";

/* ---------- 双语文案 ---------- */
window.AT_I18N = {
  back:          { zh: "返回工具列表", en: "Back to tools" },
  manualBtn:     { zh: "使用手册", en: "User Manual" },
  intro:         { zh: "编写 WaveJSON，实时渲染数字电路时序图。所有处理均在本地完成，不上传任何数据。",
                   en: "Write WaveJSON and render digital timing diagrams live. Everything runs locally; nothing is uploaded." },
  creditPrefix:  { zh: "基于开源项目", en: "Built on the open-source project" },
  creditSuffix:  { zh: "（MIT 许可）· 原作者 Aliaksei Chapyzhenka", en: "(MIT License) · Original author: Aliaksei Chapyzhenka" },
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
      '  { "name": "SCLK", "wave": "p........." },',
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

/* ---------- 深色皮肤（参考 WaveTrace 配色，由 default 皮肤变换生成） ----------
   官方 dark 皮肤将波形线画成黑色、数据砖近乎纯黑，在深色背景上不可读。
   这里以 default 皮肤为基底做整体换色：
   线条与文字 → 暖白；彩色数据砖 → 低亮度高对比深色；强调色 → 亮蓝。 */
var DARK_MAP = [
  [/#0041c4/gi, "#6ea8ff"],  // 强调蓝（边沿箭头、间隙）
  [/#ffffb4/gi, "#8f7b26"],  // 数据砖：黄
  [/#ffe0b9/gi, "#8f5e2a"],  // 数据砖：橙
  [/#b9e0ff/gi, "#2b5b8f"],  // 数据砖：蓝
  [/#ccfdfe/gi, "#1f6b74"],  // 数据砖：青
  [/#cdfdc5/gi, "#3a6b32"],  // 数据砖：绿
  [/#f0c1fb/gi, "#6e3585"],  // 数据砖：紫
  [/#f5c2c0/gi, "#8f3a38"],  // 数据砖：红
  [/#f6b900/gi, "#e8b93c"],  // warning 标签
  [/#f60000/gi, "#ff5a4e"],  // error 标签
  [/#00ab00/gi, "#3ec46d"],  // success 标签
  [/#aaa(?![0-9a-f])/gi, "#8a8578"],  // 辅助灰
  [/#888(?![0-9a-f])/gi, "#8a8578"],  // 库内硬编码的网格灰
  [/#fff(?![0-9a-f])/gi, "#4c463a"],  // 白色数据砖 → 深灰砖
  [/#000(?![0-9a-f])/gi, "#e3ddcf"]   // 波形线条与文字 → 暖白
];

/* 预览面板底色（库会在波形下垫一个 fill:white 的背景矩形，需替换为面板色） */
function paneColor() {
  var pane = document.querySelector(".wd-pane");
  return pane ? getComputedStyle(pane).backgroundColor
              : getComputedStyle(document.body).backgroundColor;
}

function recolor(str) {
  var out = str;
  DARK_MAP.forEach(function (p) { out = out.replace(p[0], p[1]); });
  /* 皮肤 text 规则默认不显式给 fill（SVG 默认黑），补成暖白 */
  return out.split("text{").join("text{fill:#e3ddcf;");
}

function mapStrings(node, fn) {
  if (Array.isArray(node)) {
    return node.map(function (x) { return mapStrings(x, fn); });
  }
  if (node && typeof node === "object") {
    var o = {};
    for (var k in node) { o[k] = mapStrings(node[k], fn); }
    return o;
  }
  return typeof node === "string" ? fn(node) : node;
}

/* 寄存器图等渲染路径在库内硬编码了 #000，渲染后对 SVG 再做一次换色兜底 */
function fixSvgForDark(container) {
  var svg = container.querySelector("svg");
  if (!svg) return;
  var pane = paneColor();
  svg.querySelectorAll("style").forEach(function (st) {
    st.textContent = recolor(st.textContent);
  });
  svg.querySelectorAll("[style]").forEach(function (el) {
    var s = recolor(el.getAttribute("style"));
    s = s.replace(/(fill|stroke)\s*:\s*white/gi, "$1:" + pane);
    el.setAttribute("style", s);
  });
  ["fill", "stroke"].forEach(function (attr) {
    svg.querySelectorAll("[" + attr + '="#000"]').forEach(function (el) {
      el.setAttribute(attr, "#e3ddcf");
    });
    svg.querySelectorAll("[" + attr + '="white"],[' + attr + '="#fff"],[' + attr + '="#FFF"]').forEach(function (el) {
      el.setAttribute(attr, pane);
    });
  });
  /* 边沿标注的节点圆点（defs 中无 fill 的黑色 socket） */
  svg.querySelectorAll("#socket rect").forEach(function (el) {
    el.setAttribute("fill", "#e3ddcf");
  });
  /* 寄存器图：库未走皮肤体系，全部元素依赖 SVG 默认黑色，整体提亮 */
  if (!svg.querySelector("style")) {
    svg.querySelectorAll("line").forEach(function (el) {
      if (!el.getAttribute("stroke") && !/stroke/.test(el.getAttribute("style") || "")) {
        el.style.stroke = "#e3ddcf";
      }
    });
    svg.querySelectorAll("text, tspan").forEach(function (el) {
      if (!el.getAttribute("fill")) el.setAttribute("fill", "#e3ddcf");
    });
    svg.querySelectorAll("rect").forEach(function (el) {
      var st = el.getAttribute("style") || "";
      if (!el.getAttribute("fill") && !/fill\s*:/.test(st) && /fill-opacity/.test(st)) {
        el.setAttribute("fill", "#e3ddcf");
      }
    });
  }
}

(function () {
  var editor  = document.getElementById("wd-editor");
  var errorEl = document.getElementById("wd-error");
  var exampleSel = document.getElementById("wd-example");
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  /* 生成深色皮肤：atdark（源自 default）、atnarrow（源自 narrow） */
  if (window.WaveSkin) {
    if (WaveSkin.default && !WaveSkin.atdark) {
      WaveSkin.atdark = mapStrings(WaveSkin.default, recolor);
    }
    if (WaveSkin.narrow && !WaveSkin.atnarrow) {
      WaveSkin.atnarrow = mapStrings(WaveSkin.narrow, recolor);
    }
  }

  /* ---------- 主题感知 ---------- */
  function isDark() {
    var t = document.documentElement.dataset.theme;
    if (t === "dark") return true;
    if (t === "light") return false;
    return mq.matches;
  }

  function bgColor() {
    return paneColor();
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
    /* 克隆后注入皮肤，不改动用户输入；浅色模式尊重用户自选的 skin */
    var themed = JSON.parse(JSON.stringify(src));
    var cfg = Object.assign({}, themed.config);
    if (isDark()) {
      cfg.skin = cfg.skin === "narrow" ? "atnarrow" : "atdark";
    } else if (!cfg.skin) {
      cfg.skin = "default";
    }
    themed.config = cfg;
    try {
      var container = document.getElementById("WaveDrom_Display_0");
      container.innerHTML = "";
      wavedrom.renderWaveForm(0, themed, "WaveDrom_Display_");
      if (isDark()) fixSvgForDark(container);
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
