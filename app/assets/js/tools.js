/* ============================================================
   工具目录数据 —— 添加新工具时，只需在数组中增加一项：
   {
     slug: "文件夹名",        // 对应 ./文件夹名/index.html
     icon: "i-wave",          // index.html 中定义的图标 id
     name: "工具名称",
     desc: "一句话说明"
   }
   ============================================================ */
(function () {
  "use strict";

  var TOOLS = [
    {
      slug: "wavedrom",
      icon: "i-wave",
      name: "WaveDrom 时序图绘制",
      desc: "编写 WaveJSON，实时渲染数字电路时序图，支持导出 SVG / PNG，中英双语。"
    },
    {
      slug: "rc-cutoff",
      icon: "i-wave",
      name: "RC 截止频率计算器",
      desc: "由电阻与电容值计算一阶 RC 滤波器的 −3 dB 截止频率。"
    },
    {
      slug: "divider",
      icon: "i-divider",
      name: "电阻分压计算器",
      desc: "输入电压与两枚电阻，求分压输出与回路电流。"
    }
  ];

  var grid = document.getElementById("tool-grid");
  var empty = document.getElementById("empty-state");
  if (!grid) return;

  if (!TOOLS.length) {
    if (empty) empty.hidden = false;
    return;
  }

  var frag = document.createDocumentFragment();
  TOOLS.forEach(function (t) {
    var a = document.createElement("a");
    a.className = "card";
    a.href = "./" + t.slug + "/";
    a.innerHTML =
      '<div class="card-head">' +
        '<svg class="card-icon" aria-hidden="true"><use href="#' + t.icon + '"/></svg>' +
        '<span class="card-name"></span>' +
      "</div>" +
      '<p class="card-desc"></p>' +
      '<span class="card-go">打开工具' +
        '<svg aria-hidden="true"><use href="#i-arrow"/></svg>' +
      "</span>";
    a.querySelector(".card-name").textContent = t.name;
    a.querySelector(".card-desc").textContent = t.desc;
    frag.appendChild(a);
  });
  grid.appendChild(frag);
})();
