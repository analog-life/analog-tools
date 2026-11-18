/* ============================================================
   Schematic Editor 窄屏辅助
   上游在窄屏用「拖动边缘把手」展开侧栏，触屏上不易发现。
   这里让把手的轻点也能展开对应面板（拖动行为保持原样）。
   ============================================================ */
(function () {
  "use strict";

  function bind() {
    var resizers = document.querySelectorAll("[data-schematic-panel-resizer]");
    if (!resizers.length) return false;

    resizers.forEach(function (handle) {
      if (handle.dataset.atTapBound) return;
      handle.dataset.atTapBound = "1";
      var startX = 0;
      var startY = 0;

      handle.addEventListener("pointerdown", function (event) {
        startX = event.clientX;
        startY = event.clientY;
      });

      handle.addEventListener("click", function (event) {
        if (Math.abs(event.clientX - startX) > 4 || Math.abs(event.clientY - startY) > 4) return;
        var shell = handle.closest(".schematic-shell");
        var side = handle.dataset.schematicPanelResizer;
        if (!shell || !shell.classList.contains("is-layout-narrow")) return;
        if (side !== "left" && side !== "right") return;
        var visible = shell.classList.contains(side === "left" ? "is-left-panel-visible" : "is-right-panel-visible");
        if (visible) return;
        event.preventDefault();
        handle.focus();
        handle.dispatchEvent(new KeyboardEvent("keydown", {
          key: side === "left" ? "ArrowRight" : "ArrowLeft",
          bubbles: true,
          cancelable: true
        }));
      });
    });
    return true;
  }

  if (!bind()) {
    var timer = setInterval(function () {
      if (bind()) clearInterval(timer);
    }, 200);
    setTimeout(function () { clearInterval(timer); }, 10000);
  }
})();
