/* 中英文切换：默认按浏览器语言，手动选择存入 localStorage（at-lang，仅存本浏览器）
   用法：页面先定义 window.AT_I18N = { key: { zh: "...", en: "..." } }，
   元素加 data-i18n="key"；大段内容用 data-lang-block="zh|en" 分块。 */
(function () {
  "use strict";
  var KEY = "at-lang";

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function detect() {
    var n = (navigator.language || "en").toLowerCase();
    return n.indexOf("zh") === 0 ? "zh" : "en";
  }

  function current() {
    var s = stored();
    return s === "zh" || s === "en" ? s : detect();
  }

  function apply(lang) {
    document.documentElement.dataset.lang = lang;
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    var dict = window.AT_I18N || {};
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var entry = dict[el.getAttribute("data-i18n")];
      if (entry && entry[lang] != null) el.textContent = entry[lang];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var entry = dict[el.getAttribute("data-i18n-placeholder")];
      if (entry && entry[lang] != null) el.placeholder = entry[lang];
    });
    var btn = document.getElementById("lang-toggle");
    if (btn) {
      btn.textContent = lang === "zh" ? "EN" : "中";
      btn.setAttribute("aria-label", lang === "zh" ? "Switch to English" : "切换到中文");
    }
    var ev;
    try { ev = new CustomEvent("at-lang-change", { detail: { lang: lang } }); }
    catch (e) { ev = document.createEvent("CustomEvent"); ev.initCustomEvent("at-lang-change", false, false, { lang: lang }); }
    document.dispatchEvent(ev);
  }

  window.AT_LANG = { current: current, apply: apply };

  document.addEventListener("DOMContentLoaded", function () {
    apply(current());
    var btn = document.getElementById("lang-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var next = current() === "zh" ? "en" : "zh";
        try { localStorage.setItem(KEY, next); } catch (e) { /* 忽略 */ }
        apply(next);
      });
    }
  });
})();
