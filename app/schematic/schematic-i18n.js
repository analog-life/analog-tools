/* ============================================================
   Schematic Editor 中英文切换
   - 语言选择保存在 localStorage 的 at-lang（仅存于本浏览器）
   - 编辑器由上游代码动态生成，因此对 UI 区域做 DOM 级翻译；
     不触碰画布、注释内容、输入框数值和用户自定义的文档名。
   ============================================================ */
(function () {
  "use strict";

  var KEY = "at-lang";
  var html = document.documentElement;

  /* 静态页面文案（页头、页脚、工具介绍、手册） */
  var PAGE = {
    back: { zh: "← 返回工具列表", en: "← Back to tools" },
    manual: { zh: "使用手册", en: "User Manual" },
    tagline: { zh: "快速、简洁地绘制模拟电路原理图", en: "Draw clean analog schematics, fast." },
    creditPrefix: { zh: "基于开源项目", en: "Built on the open-source" },
    creditSuffix: { zh: "（MIT 许可）· 原作者 RarityBrown", en: "project (MIT License) · Original author: RarityBrown" },
    privacy: {
      zh: "绘制内容仅保存在本浏览器，不会上传。",
      en: "Drawings stay in this browser. Nothing is uploaded."
    },
    siteLink: { zh: "返回主站", en: "Main site" },
    manualBack: { zh: "← 返回编辑器", en: "← Back to editor" },
    openEditor: { zh: "打开编辑器", en: "Open editor" },
    manualIntro: { zh: "使用手册", en: "User Manual" },
    langAria: { zh: "Language：切换语言（当前中文）", en: "Language: switch language (current English)" },
    themeAria: { zh: "切换深色模式", en: "Toggle dark mode" }
  };

  /* 编辑器固定文案 */
  var TEXT = {
    "Schematic controls": "原理图控制",
    "Schematic symbol template": "原理图符号模板",
    "Symbol template": "符号模板",
    "Symbol template for this schematic": "此原理图使用的符号模板",
    "razavi": "Razavi",
    "abidi (not ready)": "Abidi（未就绪）",
    "Add instance palette": "添加元件面板",
    "Add Instance": "添加元件",
    "i opens, Esc cancels": "i 打开，Esc 取消",
    "Add instance": "添加元件",
    "No matching instance": "没有匹配的元件",
    "Property Editor": "属性编辑器",
    "No object selected.": "未选中对象。",
    "No object selected": "未选中对象",
    "Cell": "类型",
    "Name": "名称",
    "Show label": "显示标签",
    "Show value": "显示数值",
    "Color": "颜色",
    "Label": "标签",
    "Net Name": "网络名称",
    "Width": "线宽",
    "Wire line width": "导线线宽",
    "Start": "起点",
    "Wire start marker": "导线起点标记",
    "End": "终点",
    "Wire end marker": "导线终点标记",
    "Digital": "数字总线",
    "Show digital wire slash": "显示数字总线斜线",
    "Bits": "位宽",
    "Digital wire bit label": "数字总线位标签",
    "Resistance": "阻值",
    "Polarity": "极性",
    "Gain polarity": "增益极性",
    "Default": "默认",
    "Same I/O polarity": "输入输出同极性",
    "Use the same top and bottom polarity order for differential inputs and outputs": "差分输入与输出使用相同的上下极性顺序",
    "Center tap": "中心抽头",
    "Inductor center tap side": "电感中心抽头方向",
    "None": "无",
    "Top": "上",
    "Bot": "下",
    "Dot": "同名端",
    "Inductor dotted terminal": "电感同名端",
    "Couple": "耦合",
    "Add": "添加",
    "AB pins": "AB 引脚",
    "BC pins": "BC 引脚",
    "CA pins": "CA 引脚",
    "Width (grid)": "宽度（网格）",
    "Height (grid)": "高度（网格）",
    "Left pins": "左侧引脚",
    "Right pins": "右侧引脚",
    "Top pins": "顶部引脚",
    "Bottom pins": "底部引脚",
    "Domain": "域",
    "Function block domain": "功能块域",
    "Size": "尺寸",
    "Component size": "元件尺寸",
    "View": "视图",
    "Fixed": "固定",
    "Variable": "可变",
    "Component view": "元件视图",
    "Layout": "版图",
    "Inductor layout": "电感版图",
    "Clock": "时钟",
    "Component clock": "元件时钟",
    "DFF clock edge": "DFF 时钟边沿",
    "Rising": "上升沿",
    "Falling": "下降沿",
    "Set": "置位",
    "DFF set mode": "DFF 置位模式",
    "Off": "关闭",
    "Sync": "同步",
    "Async": "异步",
    "Set active": "置位有效电平",
    "DFF set active level": "DFF 置位有效电平",
    "High": "高电平",
    "Low": "低电平",
    "Reset": "复位",
    "DFF reset mode": "DFF 复位模式",
    "Reset active": "复位有效电平",
    "DFF reset active level": "DFF 复位有效电平",
    "Filter": "滤波器",
    "Filter kind": "滤波器类型",
    "Pins": "引脚",
    "MOS pin count": "MOS 引脚数",
    "Gate style": "栅极样式",
    "Thick gate": "厚栅",
    "Arrow": "箭头",
    "MOS arrow": "MOS 箭头",
    "Circle": "圆圈",
    "Transistor circle": "晶体管圆圈",
    "On": "开",
    "Pair": "配对",
    "Parameter": "参数",
    "Auto": "自动",
    "Coupling label": "耦合标签",
    "Arc": "弧线",
    "Show coupling arc": "显示耦合弧线",
    "Flip arc": "翻转弧线",
    "Core": "磁芯",
    "Create coupling": "创建耦合",
    "Format": "格式",
    "Plain": "纯文本",
    "Markdown": "Markdown",
    "Note format": "注释格式",
    "Text color": "文字颜色",
    "Fill": "填充",
    "No fill": "无填充",
    "Black": "黑色",
    "Black (default)": "黑色（默认）",
    "Red": "红色",
    "Blue": "蓝色",
    "Green": "绿色",
    "Purple": "紫色",
    "White": "白色",
    "Gray": "灰色",
    "IEEE blue": "IEEE 蓝",
    "Vermilion": "朱红",
    "Bluish green": "蓝绿",
    "Reddish purple": "紫红",
    "Sky blue": "天蓝",
    "Orange": "橙色",
    "Light yellow": "浅黄",
    "Light orange": "浅橙",
    "Light green": "浅绿",
    "Light blue": "浅蓝",
    "Light pink": "浅粉",
    "Light gray": "浅灰",
    "Custom color": "自定义颜色",
    "Custom wire or junction color": "自定义导线或节点颜色",
    "Custom symbol color": "自定义符号颜色",
    "Custom coupling color": "自定义耦合颜色",
    "Custom text color": "自定义文字颜色",
    "Custom note text color": "自定义注释文字颜色",
    "Custom note fill color": "自定义注释填充颜色",
    "Drag to resize or collapse controls": "拖动以调整宽度或收起控制面板",
    "Resize or reveal controls panel": "调整宽度或展开控制面板",
    "Schematic drawing area": "原理图绘制区",
    "Open schematics": "打开的原理图",
    "Schematic documents": "原理图文档",
    "New schematic": "新建原理图",
    "Import schematic": "导入原理图",
    "Paste schematic JSON from clipboard": "从剪贴板粘贴原理图 JSON",
    "Export schematic": "导出原理图",
    "Undo": "撤销",
    "Redo": "重做",
    "Mirror Y": "垂直镜像",
    "Retry save": "重试保存",
    "Dismiss": "关闭",
    "Dismiss storage error": "关闭存储错误提示",
    "Presentation Mode": "演示模式",
    "Schematic canvas": "原理图画布",
    "Drag to resize or collapse analysis": "拖动以调整宽度或收起分析面板",
    "Resize or reveal analysis panel": "调整宽度或展开分析面板",
    "Symbolic analysis": "符号分析",
    "Symbolic Analysis": "符号分析",
    "Uses component values from the Property Editor.": "使用属性编辑器中的元件参数。",
    "Selected:": "已选择：",
    "Input +": "输入 +",
    "Input -": "输入 −",
    "Output +": "输出 +",
    "Output -": "输出 −",
    "Select net": "选择网络",
    "Pick": "拾取",
    "Compute H(s), Zin(s), Zout(s)": "计算 H(s)、Zin(s)、Zout(s)",
    "Symbolic analysis progress": "符号分析进度",
    "Solving symbolic MNA...": "正在求解符号 MNA…",
    "No netlist diagnostics.": "无网表诊断信息。",
    "Transfer Function": "传递函数",
    "Input Impedance": "输入阻抗",
    "Output Impedance": "输出阻抗",
    "Close side panel": "关闭侧边面板",
    "Schematic selection copy menu": "原理图选区复制菜单",
    "Copy as SVG": "复制为 SVG",
    "Copy as PNG": "复制为 PNG",
    "Copy as Netlist": "复制为网表",
    "Copy as JSON": "复制为 JSON",
    "Paste schematic from clipboard": "从剪贴板粘贴原理图",
    "Edit schematic note": "编辑原理图注释",
    "Schematic Markdown note": "原理图 Markdown 注释",
    "Resize note width": "调整注释宽度",
    "Empty formula": "空公式",
    "Multiple label states.": "多个标签状态。",
    "Use black (default) network color": "使用黑色（默认）网络颜色",
    "Use black (default) symbol color": "使用黑色（默认）符号颜色",
    "Use black (default) coupling color": "使用黑色（默认）耦合颜色",
    "Select a tool or press i to add an instance.": "选择工具，或按 i 添加元件。",
    "Tool canceled.": "已取消当前工具。",
    "Note updated.": "注释已更新。",
    "Note added.": "已添加注释。",
    "Note deleted.": "已删除注释。",
    "Delete mode: click an object to delete it, drag a box to delete enclosed objects, Esc cancels.":
      "删除模式：点击对象删除，拖动框选删除框内对象，Esc 取消。",
    "Temporary Delete mode: click a component or wire to toggle it, drag a box to toggle enclosed components and wires, Esc cancels.":
      "临时删除模式：点击元件或导线切换删除状态，拖动框选切换框内对象，Esc 取消。",
    "Wire mode: click a pin or grid point to start; empty clicks add bends; pin click or Enter terminates.":
      "导线模式：点击引脚或网格点开始；空白处点击添加拐点；点击引脚或按 Enter 结束。",
    "Wide wire mode: click a pin or grid point to start; empty clicks add bends; pin click or Enter terminates.":
      "宽导线模式：点击引脚或网格点开始；空白处点击添加拐点；点击引脚或按 Enter 结束。",
    "Stretch move active: moved components pull attached wire endpoints. Shift+M switches to move-only.":
      "拉伸移动：移动元件会带动相连导线端点。Shift+M 切换到仅移动。",
    "Move-only active: moved components do not pull attached wires. M switches back to stretch move.":
      "仅移动：移动元件不会带动相连导线。M 切换回拉伸移动。",
    "Copy mode: click an object to copy, or Esc cancels.": "复制模式：点击对象复制，Esc 取消。",
    "Press i for instances, w for wire, r to rotate, f to fit. Wheel/pinch zooms; middle mouse or touch-drag pans.":
      "按 i 放置元件，w 绘制导线，r 旋转，f 适应画布。滚轮/双指缩放，中键拖动或触摸拖动平移。",
    "Selection cleared.": "已取消选择。",
    "Fit view: canvas is empty.": "适应视图：画布为空。",
    "Type a valid component or template name before placing.": "请先输入有效的元件或模板名称。",
    "Coupling selection cancelled.": "已取消耦合选择。",
    "Shape resize cancelled.": "已取消形状调整。",
    "The clipboard schematic does not contain copyable objects.": "剪贴板中的原理图没有可复制的对象。",
    "Label mode: enter a net name, press Enter, then click wires or junctions. Esc cancels.":
      "标签模式：输入网络名称，按 Enter，然后点击导线或节点。Esc 取消。",
    "Label move canceled: drop it on an active wire or junction.": "标签移动已取消：请放到有效导线或节点上。",
    "Select at least one object before rotating.": "请先选择至少一个对象再旋转。",
    "Select at least one object before mirroring.": "请先选择至少一个对象再镜像。",
    "Place the template, then rotate or mirror the selected objects.": "放置模板后，再旋转或镜像所选对象。"
  };

  var COMPONENTS = {
    gnd: "地",
    vdd: "电源",
    resistor: "电阻",
    capacitor: "电容",
    inductor: "电感",
    diode: "二极管",
    impedance: "阻抗",
    vsource: "电压源",
    isource: "电流源",
    battery: "电池",
    iprobe: "电流探针",
    diffprobe: "差分探针",
    plus: "加号",
    multiply: "乘号",
    adc: "ADC",
    dac: "DAC",
    integrator: "积分器",
    differentiator: "微分器",
    delay: "延时",
    filter: "滤波器",
    vcvs: "压控电压源",
    vccs: "压控电流源",
    cccs: "流控电流源",
    ccvs: "流控电压源",
    opamp: "运算放大器",
    ota: "OTA",
    comparator: "比较器",
    slicer: "限幅器",
    diffamp: "差分放大器",
    diffota: "差分 OTA",
    diffcomparator: "差分比较器",
    idealgm: "理想 gm",
    inverter: "反相器",
    dbuffer: "数字缓冲器",
    and: "与门",
    nand: "与非门",
    or: "或门",
    nor: "或非门",
    xor: "异或门",
    xnor: "同或门",
    dff: "D 触发器",
    abuffer: "模拟缓冲器",
    amp: "放大器",
    gm: "跨导",
    switch: "开关",
    spnt: "单刀多掷开关",
    transmission_gate: "传输门",
    rectangle: "矩形",
    triangle: "三角形",
    nmos: "NMOS",
    pmos: "PMOS",
    npn: "NPN",
    pnp: "PNP",
    common_source_nmos: "共源 NMOS",
    inverter_mos: "MOS 反相器",
    flipped_amp_diff: "翻转差分放大器"
  };

  var COLOR_NAMES = {
    Red: "红色",
    Blue: "蓝色",
    Green: "绿色",
    Purple: "紫色",
    White: "白色",
    Black: "黑色",
    Gray: "灰色",
    "IEEE blue": "IEEE 蓝",
    Vermilion: "朱红",
    "Bluish green": "蓝绿",
    "Reddish purple": "紫红",
    "Sky blue": "天蓝",
    Orange: "橙色",
    "Light yellow": "浅黄",
    "Light orange": "浅橙",
    "Light green": "浅绿",
    "Light blue": "浅蓝",
    "Light pink": "浅粉",
    "Light gray": "浅灰"
  };

  var TOOL_LABELS = {
    Instance: "放置元件",
    Wire: "绘制导线",
    "Net Label": "网络标签",
    Note: "注释",
    Rotate: "旋转",
    "Mirror X": "水平镜像",
    "Mirror Y": "垂直镜像",
    Delete: "删除",
    "Temporary Delete": "临时删除",
    "Presentation Mode": "演示模式",
    Fit: "适应画布",
    Reset: "重置视图",
    Undo: "撤销",
    Redo: "重做"
  };

  var ATTR_PATTERNS = [
    {
      re: /^Set (network|symbol|coupling) color (.+)$/,
      fn: function (m, c) {
        var noun = { network: "网络", symbol: "符号", coupling: "耦合" }[m[1]];
        return "设置" + noun + "颜色：" + c(m[2]);
      }
    },
    {
      re: /^Use black \(default\) (network|symbol|coupling) color$/,
      fn: function (m) {
        var noun = { network: "网络", symbol: "符号", coupling: "耦合" }[m[1]];
        return "使用黑色（默认）" + noun + "颜色";
      }
    },
    { re: /^Set note text color (.+)$/, fn: function (m, c) { return "设置注释文字颜色：" + c(m[1]); } },
    { re: /^Set note fill (.+)$/, fn: function (m, c) { return "设置注释填充：" + c(m[1]); } },
    { re: /^Set note text color Black$/, fn: function () { return "设置注释文字颜色：黑色"; } },
    {
      re: /^(.+) \(([^)]+)\)$/,
      fn: function (m) {
        var label = TOOL_LABELS[m[1]];
        return label ? label + " (" + m[2] + ")" : null;
      }
    }
  ];

  var TEXT_PATTERNS = [
    {
      re: /^(.+) placed\. Continue moving and clicking to place more (.+) instances\.$/,
      fn: function (m) {
        return "已放置 " + m[1] + "。继续移动并点击可放置更多" + componentName(m[2]) + "。";
      }
    },
    {
      re: /^Selected (.+)\. M\/stretch move pulls attached wires; Shift-click adds; Ctrl-click deselects\.$/,
      fn: function (m) {
        return "已选择 " + m[1] + "。M/拉伸移动会带动相连导线；Shift 点击加选，Ctrl 点击取消选择。";
      }
    },
    { re: /^Switched to (.+)$/, fn: function (m) { return "已切换到 " + m[1]; } },
    {
      re: /^Copy mode: (\d+) objects? selected\. Click a reference point; Esc cancels\.$/,
      fn: function (m) { return "复制模式：已选择 " + m[1] + " 个对象。点击参考点；Esc 取消。"; }
    },
    {
      re: /^Copy mode: (\d+) objects? attached to cursor\. Click to place; Esc cancels\.$/,
      fn: function (m) { return "复制模式：" + m[1] + " 个对象跟随光标。点击放置；Esc 取消。"; }
    },
    { re: /^Moved label (.+)\.$/, fn: function (m) { return "已移动标签 " + m[1] + "。"; } },
    { re: /^Preview rotation (\d+) deg\. Click to place\.$/, fn: function (m) { return "预览旋转 " + m[1] + "°。点击放置。"; } },
    {
      re: /^Preview mirrored (left-right|up-down)\. Click to place\.$/,
      fn: function (m) { return "预览已" + (m[1] === "left-right" ? "水平" : "垂直") + "镜像。点击放置。"; }
    },
    { re: /^Symbol template: (.+)\.$/, fn: function (m) { return "符号模板：" + m[1] + "。"; } },
    {
      re: /^Label (.+): click a wire or junction to place; Esc cancels\.$/,
      fn: function (m) { return "标签 " + m[1] + "：点击导线或节点放置；Esc 取消。"; }
    },
    {
      re: /^(.+) \(([^)]+)\)$/,
      fn: function (m) {
        var label = TOOL_LABELS[m[1]];
        return label ? label + " (" + m[2] + ")" : null;
      }
    }
  ];

  var textNodes = new WeakMap();
  var attrNodes = new WeakMap();
  var observer = null;
  var current = "zh";

  function componentName(name) {
    return COMPONENTS[name] || name;
  }

  function translateText(value) {
    var parts = String(value).match(/^(\s*)([\s\S]*?)(\s*)$/);
    var lead = parts[1], core = parts[2], tail = parts[3];
    if (!core) return value;
    var result = TEXT[core] || COMPONENTS[core];
    if (!result) {
      for (var i = 0; i < TEXT_PATTERNS.length; i++) {
        var m = core.match(TEXT_PATTERNS[i].re);
        if (m) {
          var candidate = TEXT_PATTERNS[i].fn(m);
          if (candidate) { result = candidate; break; }
        }
      }
    }
    return result ? lead + result + tail : value;
  }

  function translateAttr(value) {
    if (!value) return value;
    var result = TEXT[value] || COLOR_NAMES[value];
    if (result) return result;
    for (var i = 0; i < ATTR_PATTERNS.length; i++) {
      var m = value.match(ATTR_PATTERNS[i].re);
      if (m) {
        var candidate = ATTR_PATTERNS[i].fn(m, function (name) { return COLOR_NAMES[name] || name; });
        if (candidate) return candidate;
      }
    }
    return value;
  }

  function shouldSkip(node) {
    var el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return true;
    if (el.closest(".joint-paper, .schematic-note-layer, .schematic-note-document-layer, .schematic-document-tab-label, .milkdown, .ProseMirror, textarea, [contenteditable='true'], script, style")) {
      return true;
    }
    return false;
  }

  function localizeTextNode(node) {
    var cur = node.nodeValue;
    var state = textNodes.get(node);
    if (!state) {
      state = { en: cur, zh: translateText(cur) };
      textNodes.set(node, state);
    } else if (cur !== state.en && cur !== state.zh) {
      state.en = cur;
      state.zh = translateText(cur);
    }
    var next = current === "zh" ? state.zh : state.en;
    if (cur !== next) node.nodeValue = next;
  }

  function localizeAttributes(el) {
    ["title", "aria-label", "placeholder"].forEach(function (attr) {
      if (!el.hasAttribute(attr)) return;
      var cur = el.getAttribute(attr);
      var map = attrNodes.get(el);
      if (!map) {
        map = {};
        attrNodes.set(el, map);
      }
      var state = map[attr];
      if (!state) {
        state = { en: cur, zh: translateAttr(cur) };
        map[attr] = state;
      } else if (cur !== state.en && cur !== state.zh) {
        state.en = cur;
        state.zh = translateAttr(cur);
      }
      var next = current === "zh" ? state.zh : state.en;
      if (cur !== next) el.setAttribute(attr, next);
    });
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      if (!shouldSkip(root)) localizeTextNode(root);
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) localizeAttributes(root);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (!shouldSkip(node)) localizeTextNode(node);
    }
    if (root.querySelectorAll) {
      root.querySelectorAll("[title], [aria-label], [placeholder]").forEach(localizeAttributes);
    }
  }

  function applyPageText() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var entry = PAGE[el.getAttribute("data-i18n")];
      if (entry) el.textContent = entry[current];
    });
    document.querySelectorAll("[data-lang-block]").forEach(function (el) {
      el.hidden = el.getAttribute("data-lang-block") !== current;
    });
    var langBtn = document.getElementById("lang-toggle");
    if (langBtn) {
      langBtn.setAttribute("aria-label", PAGE.langAria[current]);
      var value = document.getElementById("lang-value");
      if (value) value.textContent = current === "zh" ? "EN" : "中文";
    }
    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      var dark = themeBtn.classList.contains("is-dark");
      themeBtn.setAttribute("aria-label", current === "zh"
        ? (dark ? "切换到浅色模式" : "切换到深色模式")
        : (dark ? "Switch to light mode" : "Switch to dark mode"));
    }
    if (document.body.classList.contains("manual-page")) {
      document.title = current === "zh"
        ? "Schematic Editor 使用手册 · Analog Tools"
        : "Schematic Editor User Manual · Analog Tools";
    }
  }

  function apply() {
    html.dataset.lang = current;
    html.lang = current === "zh" ? "zh-CN" : "en";
    applyPageText();
    walk(document.getElementById("app"));
    var menu = document.querySelector(".schematic-context-menu");
    if (menu) walk(menu);
  }

  function observe() {
    var root = document.getElementById("app");
    if (!root || observer) return;
    observer = new MutationObserver(function (mutations) {
      if (current !== "zh") return;
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        if (mutation.type === "attributes") {
          localizeAttributes(mutation.target);
        } else if (mutation.type === "characterData") {
          if (!shouldSkip(mutation.target)) localizeTextNode(mutation.target);
        } else {
          for (var j = 0; j < mutation.addedNodes.length; j++) walk(mutation.addedNodes[j]);
        }
      }
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["title", "aria-label", "placeholder"]
    });

    /* 右键菜单挂在 body 下，且可能在使用时才创建 */
    new MutationObserver(function (mutations) {
      if (current !== "zh") return;
      for (var i = 0; i < mutations.length; i++) {
        for (var j = 0; j < mutations[i].addedNodes.length; j++) {
          var node = mutations[i].addedNodes[j];
          if (node.nodeType === 1 && node.classList && node.classList.contains("schematic-context-menu")) {
            walk(node);
          }
        }
      }
    }).observe(document.body, { childList: true });
  }

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function detect() {
    var n = (navigator.language || "zh").toLowerCase();
    return n.indexOf("zh") === 0 ? "zh" : "en";
  }

  function init() {
    var saved = stored();
    current = saved === "zh" || saved === "en" ? saved : detect();
    apply();
    observe();
    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) themeBtn.addEventListener("click", applyPageText);
    var btn = document.getElementById("lang-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        current = current === "zh" ? "en" : "zh";
        try { localStorage.setItem(KEY, current); } catch (e) { /* 忽略 */ }
        apply();
      });
    }
  }

  window.AT_LANG = { current: function () { return current; }, apply: apply };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
