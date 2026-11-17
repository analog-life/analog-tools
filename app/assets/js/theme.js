/* 主题切换：默认跟随系统，手动选择后写入 localStorage（仅存于本浏览器） */
(function () {
  "use strict";
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;

  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  function stored() {
    try { return localStorage.getItem("at-theme"); } catch (e) { return null; }
  }

  function effective() {
    return document.documentElement.dataset.theme || (mq.matches ? "dark" : "light");
  }

  function update() {
    var dark = effective() === "dark";
    btn.classList.toggle("is-dark", dark);
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", dark ? "切换到浅色模式" : "切换到深色模式");
  }

  btn.addEventListener("click", function () {
    var next = effective() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("at-theme", next); } catch (e) { /* 忽略 */ }
    update();
  });

  /* 未手动选择时，跟随系统主题变化 */
  if (mq.addEventListener) {
    mq.addEventListener("change", function () { if (!stored()) update(); });
  }

  update();
})();
