# Schematic Editor 升级计划（R1–R6）

状态：Draft 0.1 · 2026-11-19
关联规格：[netlist-ir.md](netlist-ir.md)、[sheet-hierarchy.md](sheet-hierarchy.md)、[agent-transaction.md](agent-transaction.md)

## 1. 结论

顺序固定为：

**R1 面板容器与反馈 → R2 结构化网表 → R3 显示与图形 → R4 子图层级 → R5 TB → R6 Agent。**

原则：

1. 先做容器，再做内容。左侧栏、右侧栏、日志区是后面所有功能的落点；先拆一次 DOM，避免每期返工。
2. 先做数据，再做消费。网表是右栏查看器、层级、TB、Agent 的公共底座。
3. 关键路径优先，独立项做缓冲。R1→R2→R4→R5→R6 是关键路径；R3 不在关键路径上，可以提前或延后，但不能插进 R4 的 schema 变更中间。
4. 一期只改一次文档 schema。R3 加图形字段，R4 加项目/层级字段；不要在同一期里既改 schema 又做大 UI。

## 2. 现状（代码事实）

| 区域 | 现状 |
|---|---|
| 左栏 | 符号模板选择 + `Add Instance` 组合框 + Property Editor；没有器件总览 |
| `i` 键 | 进入放置模式并把左栏查询框选中；不是弹窗；支持边打字边补全、连续放置 |
| 右栏 | 只有 `Symbolic Analysis`；默认折叠（`rightCollapsed: true`）；宽度 260–680 |
| 网表 | 仅“复制选中对象为网表”，输出 subckt，端口为空，器件参数是 TODO |
| 层级/图层 | 无。`SchematicContent` 是单张平面图；没有 sheet/port 概念 |
| 字体/交叉 | 字体硬编码 Arial；跨线没有 hop/gap 选项，节点圆点只由连接关系决定 |
| 图形 | 矩形、三角形已有：可放引脚、改宽高、四角拖拽；缺折线/多边形/圆/弧 |
| 命令面 | `SchematicEditorHandle` 已有 `execute` / `transact` / `getContent` / `subscribe`，可作为 Agent 的落点 |
| 文案 | `app/schematic/schematic-i18n.js` 是 631 行的 DOM 文本精确匹配字典 |
| 构建 | Vite 产出带 hash 的 `assets/`；站点 `index.html` 手工引用 hash |

结论：第 1、2、3 项原计划都需要改写成“基于现有能力做扩展”，不能当成从零开发。

## 3. 界面决策

### 3.1 左栏：tab 容器

左栏改为可扩展的 tab 容器：

- R1：`Library`、`Properties` 两个 tab；`Library` 默认。
- R3：增加 `Layers`。
- R4：增加 `Hierarchy`。
- tab 顺序建议：`Library / Properties / Hierarchy / Layers`；窄屏仍为抽屉，tab 横向可滚动。
- 宽度范围沿用 210–520；`Properties` 需要更宽时按 tab 记忆宽度（可以后续再做，R1 先全局一个宽度）。

`Library` 必须展示全部器件和模板：

- 分组：Sources / Passives / Transistors / Amplifiers / Digital / Blocks / Shapes / Templates。
- 每项有预览图、英文名、别名；搜索覆盖 `hotLabel`、`aliases` 和中文名。
- 单击进入放置；键盘 Enter 等价；`Esc` 退出。
- 预览复用现有 `paletteItemPreview`，不新写一套符号渲染。

### 3.2 `i` 面板

`i` 改为浮层/模态搜索，但不是“另一套选择器”：

- 与 `Library` 共用 catalog、匹配函数、预览和放置逻辑。
- 必须保留现有键盘流：`i` → 输入 → `Enter` → 画布点击连续放置；`Esc` 取消。
- 打开时默认聚焦搜索框，显示最近使用、分类和全部器件。
- 窄屏全屏；宽屏居中浮层，最大高度 70vh。
- 选择器件后关闭浮层，回到画布放置；再按 `i` 可重新选择。

### 3.3 右栏：可层叠的视图栈

右栏从“单一 Analysis 面板”改为 **view stack（视图栈）**：

- 视图：`Analysis`、`Netlist`、`Diagnostics`。
- 顶部有视图切换按钮（图标 + 文案；窄屏只留图标和 tooltip）。
- 每个视图是一个可折叠 section；标题栏始终可见，形成“层叠”的视觉结构。
- **v1 允许同时展开多个视图**：点击按钮展开/收起对应 section；展开的 section 在右栏内纵向排列，整体可滚动；每个展开的 body 最小高度 140px。状态用 `expanded: ViewId[]` 表示，顺序即展示顺序。
- **默认不展开**。以下两种方式打开：
  1. 点击工具栏的 `Analysis` / `Netlist` / `Check` 按钮：打开右栏并展开对应视图；再次点击收起该视图；最后一个展开项收起时右栏关闭。
  2. 拖动/轻点右侧把手：打开右栏；若没有任何展开项，恢复上次激活的视图（默认 `Analysis`）。
- 宽度范围从 260–680 调整为 320–900；网表视图需要更宽。窄屏（<1080）仍为抽屉，一次只显示一个展开项（抽屉内切换，不做多 section 堆叠）；从窄屏回到宽屏时恢复之前的 `expanded` 列表。
- 状态并入现有 `at-schematic-layout`：`rightCollapsed`、`rightWidth`、`rightActiveView`、`rightExpanded`。
- 关闭时保留各视图内部状态（滚动位置、格式选择、诊断过滤）。

R1 只交付壳：

- `Analysis`：迁移现有内容，行为不变。
- `Netlist`：占位，显示“R2 提供”和禁用的格式/工艺选择。
- `Diagnostics`：占位，显示“R2 提供”。

R2 把 `Netlist` 和 `Diagnostics` 填满；TB（R5）不新增右栏视图，继续复用 `Netlist` 的预览/下载能力。

### 3.4 日志/通知

- 快捷键：**只用 `Ctrl+Shift+L`**。不实现 F12，也不做 F12 别名；浏览器对 F12 的拦截不可靠。
- 形态：底部抽屉，位于状态栏上方；可拖动高度（180–400px），默认 220px。
- 内容：时间、级别（info/warn/error）、来源（命令、保存、导入、导出、网表、层级、Agent）、消息、可选对象链接。
- 能力：按级别过滤、搜索、复制、清空；点击对象链接选中并居中。
- 容量：会话内环形缓冲 500 条；不持久化，不记录文档内容（隐私）。
- 入口：快捷键、状态栏右侧的“日志”按钮；`Esc` 在抽屉聚焦时关闭。
- 状态栏同时保留最后一条消息；点击状态栏也可打开日志。

### 3.5 工具栏与状态栏

- 工具栏新增：`Library`（打开左栏 Library）、`Analysis`、`Netlist`、`Check`、`Log`。
- 现有工具按钮（选择、导线、标签、注释、撤销等）位置不变。
- 状态栏：左侧保留操作提示；右侧增加日志入口和诊断计数（错误/警告）。
- 网表未生成/被阻塞时，`Netlist` 按钮显示小圆点或计数，但不要用颜色作为唯一信号。

## 4. 路线图

| 批次 | 内容 | 对应原计划 | 规模 | 依赖 |
|---|---|---|---|---|
| R1 | 面板容器与反馈 | 3、8、4a | M | — |
| R2 | 结构化网表与查看器 | 2、4b | L+ | R1 |
| R3 | 显示与图形 | 1、7、5a | M+ | R1 |
| R4 | 子图层级 | 5b | XL | R2、R3 |
| R5 | TB | 6a | L | R4 |
| R6 | Agent | 6b | L | R2、R4 |

### R1 面板容器与反馈

交付：

- 左栏 tab 容器 + `Library` 全部器件。
- `i` 浮层搜索，保留连续放置。
- 右栏 view stack 壳，`Analysis` 迁入，`Netlist`/`Diagnostics` 占位。
- 日志抽屉与 `Ctrl+Shift+L`。
- 状态栏日志入口、诊断计数占位。

验收：

- 现有快捷键、放置、连线、选择、撤销/重做无回归。
- `Library` 与 `i` 面板对同一器件的名称、预览、放置结果一致。
- 右栏默认折叠；三个按钮分别能展开/收起对应视图；多个视图可以同时展开；把手能恢复上次视图。
- 日志能记录一次“导入失败”并定位到消息；日志不写入文档内容。
- 375px、768px、1080px 三个断点可用；深色模式对比度合格。
- 所有新增文案都有 i18n 键，不再往 631 行精确匹配字典里追加裸文本。

### R2 结构化网表

交付：

- 网表 IR、规范化、诊断。
- SPICE printer（ngspice 可读）。
- sky130 器件映射；MOS 的 W/L/M/NF 参数。
- Spectre printer。
- 右栏 `Netlist` 视图：格式/工艺选择、实时预览、行号、复制/下载、阻塞状态。
- 右栏 `Diagnostics` 视图：错误/警告列表、点击选中。
- ERC：悬空引脚、单引脚网络、重复位号、缺模型、缺参数、不支持器件、数值解析失败。

边界：**结构网表**只包含器件、子电路和连接；不包含 `.include`、`.lib`、模型卡、分析语句、`.end`。这些属于 R5 的 simulation deck。详见 [netlist-ir.md](netlist-ir.md)。

验收：

- RC 低通、MOS 共源、差分对三组电路在 SPICE/Spectre 下各有一份 golden。
- 同一文档重载后输出逐字节一致；输出不依赖坐标、选择、视图、图层。
- 装有 ngspice 的机器上 `ngspice -b` 无语法错误；Spectre 至少通过目标 PDK 的语法检查（按本地安装实测）。
- sky130 MOS 卡包含 `w/l/m/nf` 和正确的 master 名；缺 W/L 或 B 未连接必须阻塞并指出对象。
- 不支持的器件（逻辑门、DFF、ADC/DAC、行为块、开关）必须出现在 `Diagnostics`，不能静默丢弃。
- 网表视图的复制/下载在阻塞时禁用；警告不阻塞但必须可见。

### R3 显示与图形

交付：

- 自由图形：折线、多边形、圆、弧；绘制、顶点编辑、线宽/虚线/填充/颜色、z-order。
- 字体：文档级默认 + 注释/标注覆盖；系统字体栈（含中文）；SVG 导出带 fallback。
- 交叉显示：`plain` / `hop` 两种；节点圆点仍由真实连接决定。
- 左栏 `Layers`：wire / junction / label / component / pin / note / shape 的可见性（可选锁定）。
- 导出与只读 viewer 同步支持以上四项。

验收：

- 图形 JSON roundtrip；一次拖拽一步撤销；导出与画布一致。
- 中文注释、中文标签正常显示；不引入 webfont。
- 跨线不产生电气连接；切换 hop/plain 不改变网表。
- 隐藏图层退出渲染与选择，仍参与网表。文档 JSON 保存图层及逐对象显示状态。
- 375px 下图形工具可用（可以收进“更多”菜单）。

### R4 子图层级

交付：

- 项目 schema v2：`Project → Sheets → Ports`；旧单图自动包装。
- 项目包导入/导出（`.atproj.json`）。
- 左栏 `Hierarchy`：树、创建子图、端口编辑、放置子图块、进入/退出、面包屑、Top 标记。
- 层级网表：每个子图一个 subckt，实例化表达，不做名字展平；SPICE/Spectre 双格式。
- 循环、缺失子图、端口不匹配、未绑定端口的诊断。

验收：

- 三级嵌套在两种格式下正确；子图修改反映到父图网表。
- 导出 → 导入 → 结构与网表一致；旧单图 JSON 仍可打开。
- 循环/自引用/缺失子图被拒绝并定位到对象。
- 重命名端口不破坏已连线；删除已连接端口有确认并留下可编辑的线头。

### R5 TB

交付：

- TB 子图：普通 Sheet，项目用 `testbenches` 元数据标记；内容是 DUT 子图实例、源、负载。
- TB 设置对话框（工具栏 `TB` 按钮）：选择 DUT、分析列表（`.op/.dc/.ac/.tran/.noise`）、corner、温度、电源、`.save`；写入项目元数据。
- Deck 生成：DUT 结构网表 + TB top + PDK include/lib + 分析 + `.end`；SPICE 与 Spectre。
- 右栏 `Netlist` 增加 `Deck` 模式，不新增右栏视图；下载 `.cir`/`.scs`。
- 校验：无 DUT、无源、无分析、端口未绑定、corner 未知。

验收：

- sky130 反相器、差分对的 TB deck 能在 ngspice 跑通；Spectre 按本地 PDK 实测。
- corner/温度/电源写入正确；端口映射正确。
- 浏览器内不做仿真；不引入 ngspice wasm。

### R6 Agent

交付：

- Snapshot / Transaction 协议（v1.0）。
- 站内“Agent 审阅”：粘贴/导入 JSON → 校验 → diff 摘要 → 单步撤销应用。
- 本地 MCP server（stdio）：读项目、取网表、校验、应用 transaction。
- 可选 localhost 桥（用户显式连接，非 v1 必做）。

验收：

- Agent 能通过 transaction 添加器件/导线/标签/子图并原子应用；一次撤销恢复。
- 非法/过期 transaction 被拒绝，错误定位到 op index。
- MCP 本地 roundtrip 成功；页面默认零网络请求。
- 不支持 DOM/pointer 控制、任意脚本、URL 加载。

## 5. 非目标

以下内容明确不在对应版本内，避免范围蔓延。需要时单独立项。

### 全局

- 不做云端项目、账号、Gallery、社区器件库。
- 不做浏览器内仿真（不引入 ngspice/Spectre wasm）。
- 不做版图/工艺层编辑；Layers 只指显示层。
- 不复制任何第三方项目的代码、样式、文档或资源。

### R1

- 不做 F12 快捷键，也不做 F12 别名。
- 不做可拖出/浮动的独立面板；右栏只有 view stack。
- 不做视图拖拽重排（v1 顺序固定为 Analysis / Netlist / Diagnostics）；不做全屏视图。
- 不做日志持久化、跨会话搜索、导出日志文件。

### R2

- 网表视图只读；不做在面板里直接编辑网表再回写（后续再评估）。
- 不做 SPICE/Spectre 导入。
- 不做 abstract/IHP/GF180 profile；v1 只有 sky130。
- 结构网表不加 `.include`、`.lib`、模型卡、分析、`.end`。
- 不做物理电阻/电容/MIM/二极管模型映射；v1 先理想 R/C/L + sky130 MOS。
- 不做逻辑门/DFF/行为块到标准单元的映射。

### R3

- 不做工艺层/掩膜层。
- 不做字体文件上传/内嵌 webfont；只用系统字体栈。
- 不做文字转路径；SVG 导出保留文本和 fallback。
- 不做图形组合/布尔运算/对齐分布（后续可加）。

### R4

- 不做跨子图复制粘贴。
- 不做子图实例的独立复制、替换定义、展平到父图。
- 不做子图参数/实例覆盖。
- 不做外部 subckt/SPICE 模型导入。
- 不做 flatten into parent；网表也不做名字展平。
- 不做 back-annotation。
- 不做部分层级/局部展开。

### R5

- 不做仿真执行、扫参、Monte Carlo、测量语句、波形查看。
- 不做多 TB 并行/批量 corner 扫描；v1 一个 TB、一个 corner。
- 不做 PDK 安装/下载；只生成 include/lib 路径模板。

### R6

- 不做站内 LLM 对话、不内置 API key、不自动联网。
- 不做 DOM/pointer 模拟点击；Agent 只走 typed transaction。
- v1 不做实时双向同步；先文件式（导出→MCP→导入）。
- 不做任意代码执行、URL 加载、文件系统任意路径。

## 6. 跨切面约束

### 6.1 i18n

- 新 UI 必须用 key（例如 `data-i18n="netlist.title"`），由统一的字典渲染；不要继续扩大 `app/schematic/schematic-i18n.js` 的精确文本匹配表。
- 旧文案可以继续走兼容层；新增文案必须走新机制。
- 器件名、网络名、用户输入不进翻译；单位、方向、诊断消息要翻译。
- 诊断码（`MISSING_MODEL` 等）不翻译，消息模板翻译。

### 6.2 构建与发布

- 源码改动在 `source/schematic-editor`，构建 `build:lib` + `build:web`，把 `apps/web/dist/assets` 同步到 `app/schematic/assets`，并更新 `app/schematic/index.html` 的 hash 引用。
- 每次发布必须同步：`manual.html`、`schematic.css`、`schematic-i18n.js`、`THIRD_PARTY_LICENSES.txt`（如有新依赖）。
- 发布前跑：typecheck、单测（当前 153 个测试文件）、浏览器冒烟、375px/深色/导出回归。
- 先在本地把 `npm ci` 与构建跑通；源码版本为 0.1.3，站点登记为 0.1.1，两者暂不同步，重建前先对拍差异。

### 6.3 文档 schema 与迁移

- R3 的图形字段用可选字段加入，缺省为空，不升项目版本。
- R4 升项目格式到 v2；旧的单图 JSON 导入时包装成一张无端口子图。
- 内测期间按仓库 `AGENTS.md` 更新当前文档格式与校验。公开发布前重新评估旧格式兼容以及未知字段处理规则。
- 每个 schema 版本配 golden JSON 往返测试。

### 6.4 撤销/重做

- 一次用户手势 = 一步撤销；一次 Agent transaction = 一步撤销。
- 新增可编辑状态（图形顶点、端口、子图块位置、TB 参数）必须接入现有 history。
- 缩放、面板宽度、右栏激活视图等视图设置独立于撤销历史。图层和对象的显隐随文档保存，并进入编辑历史。

### 6.5 导出与只读 viewer

- 图形、字体、跨线、图层可见性必须同时进入 SVG/PNG 导出与只读 viewer；不允许“编辑器里对、导出的图不对”。
- SVG/PNG 图像导出默认跟随当前可见性，每次导出可以包含隐藏图层及单独隐藏的对象。完整文档 JSON 保存图层和逐对象显隐、层序。
- 网表不受任何显示状态影响。

### 6.6 隐私与许可

- 页面保持零网络请求；Agent 本地 MCP/桥只能由用户显式启动和连接。
- 不引入新的第三方 CDN；新增依赖必须本地化并附 LICENSE。
- 不复制第三方代码、文档、样式或资源。

### 6.7 性能

- 网表预览 debounce 200–500ms；大文档不在每次指针移动时重算。
- 层级树懒加载子图；循环检测在结构变更时做一次，不每次渲染都做。
- 日志环形缓冲固定上限，避免长时间会话内存增长。

## 7. 风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| R4 schema 与层级网表 | 全计划最大单期，可能拖垮排期 | 先做“电阻分压子图”纵向切片；schema 先评审再写 UI |
| 双仿真器语法差异 | SPICE/Spectre 逻辑分叉、测试翻倍 | 强制 IR + 纯 printer；先 SPICE 后 Spectre；golden 锁格式 |
| sky130 Spectre 模型可用性 | 本地 PDK 可能没有 Spectre 模型 | include 路径可配置；v1 硬指标是 ngspice，Spectre 实测后标定 |
| i18n 精确匹配字典 | 新 UI 文案爆炸、漏翻 | R1 起改用 key；旧表只做兼容 |
| 构建/发布链 | hash 引用、CSS 覆盖、手册不同步 | 写发布脚本 + 基线截图；每期只发一次 |
| Agent 范围蔓延 | 做成聊天/自动化平台 | 只做 typed transaction + 审阅；不做站内 LLM |
| 第三方来源污染 | 许可风险 | 提交评审检查来源；不复制外部项目代码/文档 |

## 8. 开放问题

1. sky130 的 Spectre 模型库在你本地 PDK 中是否可用？不可用时，Spectre v1 是“语法正确 + 用户自填 include”还是延后？
2. sky130 MOS 的 B 端未连接时：阻塞（推荐）还是默认接地并警告？
3. 全局网策略：除 `0` 外，`VDD`/`VSS` 默认全局还是按项目声明？
4. TB 是否允许多个？v1 建议一个项目一个 TB，但 schema 预留数组。
5. 结构网表的实例名前缀：SPICE 下 sky130 MOS 是 subckt，必须 `XM1`；UI 仍显示 `M1`，是否接受这个差异？
6. 日志是否需要跨会话保留最近 100 条？当前定为仅会话内。

## 9. 发布批次

| 批次 | 内容 | 出口条件 |
|---|---|---|
| R1 | 3 + 8 + 4a | 现有功能无回归；三视图壳可用；日志可用 |
| R2 | 2a + 2b + 4b | 双格式 golden；sky130 MOS 可导出；诊断可用 |
| R3 | 1 + 7 + 5a | 图形/字体/跨线/图层与导出一致 |
| R4 | 5b | 三级层级双格式正确；项目包往返 |
| R5 | 6a | TB deck 可在 ngspice 跑通 |
| R6 | 6b | Agent transaction 原子应用；MCP 本地往返 |

每批独立发布、独立回滚；不要把 R2 和 R4 合并发布。

## 10. 代码落点（建议）

| 能力 | 主要落点 | 说明 |
|---|---|---|
| 左栏 tab / Library | `schematicEditorUiProjection.ts`、`schematicTabShell.ts`、`schematic.css` | 复用现有投影函数，新增 tab 容器与 Library 视图 |
| `i` 浮层 | `instanceSelector.ts`、`toolState.ts`、`editor.ts` | 共用匹配/预览/放置，不复制状态机 |
| 右栏 view stack | `schematicLayoutController.ts`、`schematicTabShell.ts`、新增 `rightDockController.ts` | 布局控制器扩展宽度与展开状态 |
| 日志 | 新增 `eventLog.ts`；`status`、`editorHandle` 的 `origin/reason/revision` | 命令/保存/导入/导出统一发事件 |
| 网表 IR / printer | 新增 `src/schematic/netlist/`（`ir.ts`、`canonicalize.ts`、`spicePrinter.ts`、`spectrePrinter.ts`、`diagnostics.ts`） | 复用 `extractNetlist`、`connectivity`、`netResolution` |
| sky130 profile | 新增 `src/schematic/netlist/profiles/sky130.ts`；`catalog.ts`、`propertyPanelModel.ts` | MOS 参数键与属性面板 |
| 自由图形 | `catalog.ts`、`shapeResizeSession.ts`、`renderer.ts`/`svgRenderer.ts`、`schematicDocumentCodec.ts` | 新图形类型 + 序列化 + 导出 |
| 字体/交叉/图层 | `renderer.ts`、`svgRenderer.ts`、`viewStyling.ts`、`schematicLayoutController.ts` | 图层状态进 view state |
| 子图层级 | `document/documentModel.ts`、`schematicDocumentCodec.ts`、`workspacePersistence.ts`、新增 `hierarchyController.ts` | 需要 project-scoped resolver；见 sheet-hierarchy 2.3 |
| TB | 新增 `src/schematic/testbench/`（`model.ts`、`deckBuilder.ts`、`validate.ts`） | 结构网表 + deck 拼装 |
| Agent | 新增 `src/schematic/agent/`（`snapshot.ts`、`transaction.ts`、`validate.ts`）；`tools/schematic-mcp/` | 复用 `SchematicEditorHandle`；MCP 不部署 |

这张表是建议，不是硬性目录约束；实现时可以按实际依赖调整，但“IR 与 printer 分离”“层级 resolver 不全局”“Agent 不碰 DOM”这三条不能破。
