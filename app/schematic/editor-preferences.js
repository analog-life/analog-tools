(() => {
  const html = document.documentElement;
  const system = matchMedia("(prefers-color-scheme: dark)");
  const manualTitle = html.dataset.manualTitle;
  function apply() {
    let language;
    let theme;
    try {
      language = localStorage.getItem("at-lang");
      theme = localStorage.getItem("at-theme");
      // The beta editor reads this preference during startup.
      if (!manualTitle && language !== "en" && language !== "zh") localStorage.setItem("at-lang", "zh");
    } catch {
      if (!manualTitle && language !== "en") html.dataset.siteLanguageFallback = "zh";
    }
    html.dataset.schematicLanguage = language === "en" ? "en" : "zh";
    html.lang = language === "en" ? "en" : "zh-CN";
    if (manualTitle) document.title = language === "en" ? "Schematic Editor Help · Analog Tools" : manualTitle;
    if (theme === "dark" || theme === "light") html.dataset.theme = theme;
    else delete html.dataset.theme;
    html.dataset.effectiveTheme = html.dataset.theme ?? (system.matches ? "dark" : "light");
  }
  apply();
  if (manualTitle) {
    system.addEventListener("change", apply);
    addEventListener("storage", event => {
      if (!event.key || event.key === "at-lang" || event.key === "at-theme") apply();
    });
  }
})();
