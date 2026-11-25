# Schematic Editor 1.0.1-beta 升级记录（R1–R5）

R1–R5 已纳入 1.0.0-beta；1.0.1-beta 增加 Options 的 `O` 快捷键，并完善 AI 弹窗的当前状态显示。文档更新于 2026-11-25。

关联规格：[netlist-ir.md](netlist-ir.md)、[sheet-hierarchy.md](sheet-hierarchy.md)、[agent-transaction.md](agent-transaction.md)

## 1. 发布状态

R1 面板与反馈、R2 结构网表、R3 显示与图形、R4 层级与总线、R5 本机 Agent 协作已经随 Beta 发布。原理图编辑器提供结构化网表和符号分析，仿真由独立工具另行规划。

以下保留各阶段的交付目标和验收依据。当前发布提交、实现入口与后续开发要求见 [交接手册](handoff.md)。

## 2. Beta 实现概览

| 区域 | 当前实现 |
|---|---|
| 面板 | 左栏为 Library、Properties、Layers；右栏为 Hierarchy、Analysis、Netlist；状态栏可打开日志 |
| 放置 | `I` 打开三栏 Add Instance，可预览及预设器件、图形和模板属性 |
| 电气模型 | 子图与稳定端口、区分大小写的标签、同名连通、总线位展开、双格式结构网表与诊断 |
| 图形与显示 | 六种 Library 无引脚图形、图层和对象显隐与层序、字体覆盖、跨线桥 |
| 文案 | 源码按 i18n 键渲染；站点外壳使用 `editor-preferences.js`，默认简体中文并跟随系统主题 |
| 构建 | 带内容哈希的 Vite 资源、独立 JointJS chunk、按需加载的本地 MathJax 单文件 |

## 3. 界面决策

本节保留各阶段的界面设计依据，Beta 的实际操作以交接手册和使用手册为准。

### 3.1 左栏：tab 容器

左栏改为可扩展的 tab 容器：

- R1：`Library`、`Properties` 两个 tab；`Library` 默认。
- R3：增加 `Layers`。
- tab 顺序为 `Library / Properties / Layers`；窄屏仍为抽屉，tab 横向可滚动。
- R4 在 `Library` 中增加 `Hierarchy` 库，在 `Properties` 中加入 Pin 属性。
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

### 3.3 右栏

- 以 `Analysis`、`Netlist` 两个标签切换视图。Netlist 上下等高显示网表和诊断，各自滚动。
- R4 在 `Analysis` 左侧增加 `Hierarchy`，集中展示和管理项目层级。
- 右栏默认收起。可通过工具栏按钮或右侧把手打开，恢复上次选中的标签。桌面可拖动调整宽度，窄屏使用抽屉。
- 布局保存在 `at-schematic-layout`，随浏览器刷新恢复。

### 3.4 日志/通知

- 快捷键：**只用 `Ctrl+Shift+L`**。不实现 F12，也不做 F12 别名；浏览器对 F12 的拦截不可靠。
- 形态：底部抽屉，位于状态栏上方；可拖动高度（180–400px），默认 220px。
- 内容：时间、级别（info/warn/error）、来源（命令、保存、导入、导出、网表、层级、Agent）、消息、可选对象链接。
- 能力：按级别过滤、搜索、复制、清空；点击对象链接选中并居中。
- 容量：会话内环形缓冲 500 条；不持久化，不记录文档内容（隐私）。
- 入口：快捷键、状态栏右侧的“日志”按钮；`Esc` 在抽屉聚焦时关闭。
- 状态栏同时保留最后一条消息；点击状态栏也可打开日志。

### 3.5 工具栏与状态栏

- `Options` 在 `Library` 前，`Help` 后是 `AI`。工具栏保留 `Analysis` 和 `Netlist`。
- 状态栏保留操作提示和日志入口。Netlist 面板用文字显示生成状态和诊断计数。

## 4. 路线图

| 批次 | 内容 | 对应原计划 | 规模 | 依赖 |
|---|---|---|---|---|
| R1 | 面板容器与反馈 | 3、8、4a | M | — |
| R2 | 结构化网表与查看器 | 2、4b | L+ | R1 |
| R3 | 显示与图形 | 1、7、5a | M+ | R1 |
| R4 | 子图层级 | 5b | XL | R2、R3 |
| R5 | Agent | 6b | L | R2、R4 |

### R1 面板容器与反馈

交付：

- 左栏 tab 容器 + `Library` 全部器件。
- `i` 浮层搜索，保留连续放置。
- 右栏标签容器承载 `Analysis` 和 `Netlist`。
- 日志抽屉与 `Ctrl+Shift+L`。
- 状态栏日志入口和操作反馈。

验收：

- 现有快捷键、放置、连线、选择、撤销/重做无回归。
- `Library` 与 `i` 面板对同一器件的名称、预览、放置结果一致。
- 右栏默认折叠，两个按钮可打开相应视图，把手能恢复上次视图。
- 日志能记录一次“导入失败”并定位到消息；日志不写入文档内容。
- 375px、768px、1080px 三个断点可用；深色模式对比度合格。
- 界面与操作日志随中英文切换；公式、缩写和用户填写的标识符保留原样。

### R2 结构化网表

交付：

- 网表 IR、规范化、诊断。
- SPICE printer（输出符合 SPICE 方言的结构网表）。
- Options 的工艺预设与器件属性中的模型覆盖；MOS 的 W/L/M/NF 参数。
- Spectre printer。
- 右栏 `Netlist` 视图提供格式选择、实时预览、行号、复制、下载、生成状态和诊断计数。
- Netlist 诊断区提供错误与警告列表，点击器件诊断可选中并居中。
- ERC：悬空引脚、单引脚网络、重复位号、缺模型、缺参数、不支持器件、数值解析失败。

**结构网表**记录器件、子电路和连接，范围详见 [网表规格](netlist-ir.md)。

验收：

- RC 低通、MOS 共源、差分对三组电路在 SPICE/Spectre 下各有一份 golden。
- 同一文档重载后输出逐字节一致；输出不依赖坐标、选择、视图、图层。
- SPICE 和 Spectre 的结构网表通过各自的语法检查。R2 验收无需安装仿真器、加载目标 PDK 或运行仿真。
- sky130 MOS 卡输出正确的 master 和 `w/l`，以及适用的 `m/nf`。缺 W/L 时生成带默认值的符号参数和警告；显式 B 悬空时使用占位网络并报告可定位的错误。
- 不支持的器件（逻辑门、DFF、ADC/DAC、行为块、开关）必须出现在 `Diagnostics`，不能静默丢弃。
- 出现 error 或 warning 时继续生成结构网表，保留复制和下载入口，并显示对应诊断。

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

- 项目 schema v2：`Project → Sheets → Ports`；当前单图使用层次功能或导出项目包时按需包装。
- 项目包导入/导出（`.atproj.json`）。
- 右栏 `Hierarchy`：子图树、引用、导航、端口顺序和 Top 标记。
- 工具栏在 Net Label 后增加 Pin（`P`）。放置后在左栏 Properties 编辑名称、类型和 Symbol 所在边。
- 自动生成带方框接线点的子图 Symbol，通过 `Library → Hierarchy` 放置。支持标量 Pin、`OUT<7:0>` 总线及 `OUT<3>` 单个位。
- 层级网表：每个子图一个 subckt，实例化表达，不做名字展平；SPICE/Spectre 双格式。
- 循环、缺失子图、端口不匹配、未绑定端口的诊断。

验收：

- 三级嵌套在两种格式下正确；子图修改反映到父图网表。
- 导出 → 导入 → 结构与网表一致；当前格式的单图 JSON 仍可独立打开。
- 循环/自引用/缺失子图被拒绝并定位到对象。
- 改名同步更新子图、父图 Symbol 和网表，保持端口 ID 与接线点。
- 换边和删除保持父图导线几何原样，对不上引脚的线头留在原处，由设计者重新接线。换边保持网表端口顺序，顺序可在 Hierarchy 中单独调整。

### R5 Agent

交付：

- Snapshot / Transaction 协议（v1.0）。
- 工具栏通过一次性配对提示词发起协作，顶栏提供连接状态、暂停、断开和收回编辑权。
- 本机连接器转发结构化快照、带修订号的语义动作和事务回执。
- Agent 可先试运行获取差异，然后提交一个可单步撤销的事务。

验收：

- Agent 能通过 transaction 添加器件/导线/标签/子图并原子应用；一次撤销恢复。
- 非法/过期 transaction 被拒绝，错误定位到 op index。
- 本机连接器完成配对、快照读取、事务提交和令牌撤销。工程数据通过本地回环接口交换。
- 拒绝基于旧修订号或与人工编辑并发的写入。
- 不支持 DOM/pointer 控制、任意脚本、URL 加载。

## 5. 非目标

以下内容明确不在对应版本内，避免范围蔓延。需要时单独立项。

### 全局

- 不做云端项目、账号、Gallery、社区器件库。
- 不做版图/工艺层编辑；Layers 只指显示层。
- 不复制任何第三方项目的代码、样式、文档或资源。

### R1

- 不做 F12 快捷键，也不做 F12 别名。
- 不做浮动面板、标签拖拽重排或全屏视图。
- 不做日志持久化、跨会话搜索、导出日志文件。

### R2

- 网表视图只读；不做在面板里直接编辑网表再回写（后续再评估）。
- 不做 SPICE/Spectre 导入。
- 结构网表不加 `.include`、`.lib`、模型卡、分析、`.end`。
- R/C/L 默认生成原生器件，也支持显式指定模型；二极管模型映射留待后续。
- 不做逻辑门/DFF/行为块到标准单元的映射。

### R3

- 不做工艺层/掩膜层。
- 不做字体文件上传/内嵌 webfont；只用系统字体栈。
- SVG 导出保留普通文本和字体 fallback，TeX 公式使用 MathJax 生成的字形路径。
- 不做图形组合/布尔运算/对齐分布（后续可加）。

### R4

- 不做跨子图复制粘贴。
- 子图实例可复制为同一子图的新实例。替换定义和展平到父图仍在 Beta 范围之外。
- 不做子图参数/实例覆盖。
- 不做外部 subckt/SPICE 模型导入。
- 不做 flatten into parent；网表也不做名字展平。
- 不做 back-annotation。
- 不做部分层级/局部展开。

### R5

- 不做站内 LLM 对话、不内置 API key、不自动联网。
- 不做 DOM/pointer 模拟点击；Agent 只走 typed transaction。
- 页面是唯一工程写入方；Agent 通过显式读取和语义事务协作。
- 不做任意代码执行、URL 加载、文件系统任意路径。

## 6. 跨切面约束

### 6.1 i18n

- 新 UI 和日志文案使用源码中的 i18n 键和消息模板，随改动补齐中英文。
- 器件名、网络名、用户输入不进翻译；单位、方向、诊断消息要翻译。
- 诊断码（`MISSING_MODEL` 等）不翻译，消息模板翻译。

### 6.2 构建与发布

1. 在源码仓库确认目标版本，按需执行 `npm ci`，运行 `npm run build:lib` 与 `npm run build:web`。
2. 发布到站点时同步 `apps/web/dist/` 中实际引用的资源至 `app/schematic/`，更新入口的 JS、CSS、预加载路径和版本。核对 worker、本地 MathJax 和许可证。站点的 `index.html`、`editor-preferences.js`、`schematic.css` 与手册继续由站点维护。
3. 检查类型、相关单测及 Chromium 回归。按发布范围覆盖 `/tools/` 路径、375 px、浅色与深色、手册、导入导出和公式按需加载。
4. 如需交付发布包，核对 `tools/` 顶层、工具首页范围和资源引用。将源码版本、站点提交和生产部署分别记录。

### 6.3 文档 schema 与迁移

- R3 的图形字段用可选字段加入，缺省为空，不升项目版本。
- R4 项目包使用 v2。当前单图 JSON 可独立打开，也可包装为单 Sheet 项目。
- 内测期间按仓库 `AGENTS.md` 更新当前文档格式与校验。公开发布前重新评估旧格式兼容以及未知字段处理规则。
- 每个 schema 版本配 golden JSON 往返测试。

### 6.4 撤销/重做

- 一次用户手势 = 一步撤销；一次 Agent transaction = 一步撤销。
- 新增可编辑状态（图形顶点、端口、子图块位置）必须接入现有 history。
- 缩放、面板宽度、右栏激活视图等视图设置独立于撤销历史。图层和对象的显隐随文档保存，并进入编辑历史。

### 6.5 导出与只读 viewer

- 图形、字体、跨线、图层可见性必须同时进入 SVG/PNG 导出与只读 viewer；不允许“编辑器里对、导出的图不对”。
- SVG/PNG 图像导出默认跟随当前可见性，每次导出可以包含隐藏图层及单独隐藏的对象。完整文档 JSON 保存图层和逐对象显隐、层序。
- 网表不受任何显示状态影响。

### 6.6 隐私与许可

- 页面通过同源静态资源提供功能，工程数据保存在浏览器。Agent 本机回环连接器由用户显式启动和连接。
- 不引入新的第三方 CDN；新增依赖必须本地化并附 LICENSE。
- 不复制第三方代码、文档、样式或资源。

### 6.7 性能

- 网表预览合并连续更新；大文档不在每次指针移动时重算。
- 保持空白或纯文本场景零 MathJax 请求，保留 JointJS 独立分块。改动相关构建配置时核对库 chunk 依赖方向和跨版本哈希。
- 层级树懒加载子图；循环检测在结构变更时做一次，不每次渲染都做。
- 日志环形缓冲固定上限，避免长时间会话内存增长。

## 7. 历史风险与维护关注点

| 风险 | 影响 | 缓解 |
|---|---|---|
| R4 schema 与层级网表 | 全计划最大单期，可能拖垮排期 | 先做“电阻分压子图”纵向切片；schema 先评审再写 UI |
| 双仿真器语法差异 | SPICE/Spectre 逻辑分叉、测试翻倍 | 强制 IR + 纯 printer；先 SPICE 后 Spectre；golden 锁格式 |
| i18n 漏翻 | 界面与日志中英文混杂 | 使用统一键和双语消息模板 |
| 构建/发布链 | hash 引用、CSS 覆盖、手册不同步 | 写发布脚本 + 基线截图；每期只发一次 |
| Agent 范围蔓延 | 做成聊天/自动化平台 | 只做 typed transaction + 审阅；不做站内 LLM |
| 第三方来源污染 | 许可风险 | 提交评审检查来源；不复制外部项目代码/文档 |

## 8. 历史决策

- 显式 B 端悬空时使用占位网络并报告错误。
- 工程的共享网络在 Hierarchy 的 Global nets 中声明。
- SPICE 的 MOS 子电路调用加 `X` 前缀，UI 仍显示原位号。
- 日志仅在会话内保留。

## 9. 发布批次

| 批次 | 内容 | 出口条件 |
|---|---|---|
| R1 | 3 + 8 + 4a | 现有功能无回归；三视图壳可用；日志可用 |
| R2 | 2a + 2b + 4b | 双格式 golden；sky130 MOS 可导出；诊断可用 |
| R3 | 1 + 7 + 5a | 图形/字体/跨线/图层与导出一致 |
| R4 | 5b | 三级层级双格式正确；项目包往返 |
| R5 | 6b | 本机配对、修订号冲突检查和 Agent transaction 原子应用 |

各阶段验收记录保留在交接手册，R1–R5 的站点交付统一纳入 1.0.0-beta。

## 10. 原计划的代码落点

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
| Agent | `src/schematic/agent/` 与 `tools/schematic-agent/` | 页面复用原理图模型和撤销历史；连接器在本机运行 |

表中路径是原计划。查当前入口时使用 [交接手册的代码地图](handoff.md#5-关键代码地图) 和源码。
