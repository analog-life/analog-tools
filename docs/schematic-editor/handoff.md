# Schematic Editor 交接文档

当前发布基线为 **1.0.1-beta**。R1–R5 已纳入发布；本版增加 Options 的 `O` 快捷键，并完善 AI 弹窗当前状态显示。文档更新于 2026-11-25。

本手册面向后续接手开发的 AI 和维护者。先结合任务阅读适用的仓库约束，再用对应版本的实现和测试核对行为。原计划或旧回归记录与当前版本不一致时，保留历史归属并更新受影响的说明。

---

## 1. 先看什么

建议顺序：

1. [站点仓库 AGENTS.md](../../AGENTS.md) 和源码仓库的 `source/schematic-editor/AGENTS.md`。
2. 本手册的发布基线和 [开发要求](#8-后续-ai-开发要求)。
3. [升级记录](upgrade-plan.md) 和本次任务对应的专项规格。
4. 按功能入口查代码和测试。从编辑器入口 `packages/schematic/src/schematic/editor.ts` 可追到各工具控制器。

---

## 2. 仓库与发布边界

| 区域 | 路径 | 说明 |
|---|---|---|
| 升级规格/交接文档 | `docs/schematic-editor/` | 本文档所在目录，不参与部署 |
| 源码 | `source/schematic-editor/` | 独立 git 仓库，origin 是 `analog-life/GmKing-schematic-editor` |
| 站点部署文件 | `app/schematic/` 和 `app/assets/css/manual.css` | 外层仓库维护的 Beta 构建资源、站点外壳及手册样式 |
| 发布包 | `outputs/` | 本地部署产物，外层仓库忽略此目录 |

- 当前源码标签 [`1.0.1-beta`](https://github.com/analog-life/GmKing-schematic-editor/tree/1.0.1-beta) 指向 `0d2d429`，发布分支为 `codex/release-1.0.0-beta`；本提交尚未合入源码仓库 `main`。上一版标签 `1.0.0-beta` 指向 `3f83781`，其发布分支已由 [PR #1](https://github.com/analog-life/GmKing-schematic-editor/pull/1) 合入 `main`，合并提交为 `0f30bb1`。
- 1.0.1-beta 站点静态资源、站点外壳和中英文手册随本次外层仓库 `main` 提交更新。上一版站点提交为 [`09e0dbe`](https://github.com/analog-life/analog-tools/commit/09e0dbe8b7bce5ac67d49cf8410ae107a313039c)。生产服务器的部署状态应单独核实，本次仅更新代码与本地发布文件。
- 本地发布包 `outputs/analog-tools-wavedrom-schematic-1.0.1-beta.zip` 含 WaveDrom、Schematic Editor 和两份手册，共 29 个文件。包内顶层为 `tools/`，解压位置是站点根目录。该包的首页仅列出这两个工具，外层仓库仍保留完整工具列表。

源码仓库：

```text
origin   https://github.com/analog-life/GmKing-schematic-editor.git
upstream https://github.com/KingsAnalog/GmKing-schematic-editor.git
```

提交信息使用中文。提交前运行 `git status`，不要提交 `apps/web/dist/`、截图或临时文件。

---

## 3. 工程结构与技术栈

TypeScript monorepo，npm workspaces：

```text
packages/schematic    核心模型、JointJS 编辑器、SVG/viewer、网表
apps/web              Vite Web 工作区（本地文档、标签页、导入/导出）
apps/obsidian         Obsidian 插件
scripts/              浏览器 smoke 测试
```

关键技术：

- 画布：JointJS 4.x，`packages/schematic/src/schematic/`
- 图/文档：`SchematicDocument` / `SchematicContent` + codec
- 渲染：JointJS cell 渲染 + 纯 SVG renderer，二者共用 `componentVisualModel`
- 网表：纯 core 的 netlist IR、SPICE/Spectre printer、ERC
- 持久化：Web localStorage；文档文件 JSON

不要让 portable core 依赖 JointJS、DOM 或浏览器存储；边界测试会检查。

---

## 4. 当前进度

### R1：面板容器与反馈 —— 验收通过

已落地：

- 左侧栏 `Library / Properties / Layers` 标签。
- Library 全器件列表、搜索、预览、单击放置。
- `i` 三栏浏览器（分类 / 器件 / 预览），保留键盘连续放置。
- 右侧 Dock：`Analysis / Netlist` 两个标签，单视图切换，可收起、调宽和恢复上次打开的视图。诊断位于 Netlist 内。
- 底部日志抽屉，`Ctrl+Shift+L` 打开；可拖动高度。
- UI 布局持久化到 `at-schematic-layout`；Web 文档持久化使用 `adc-helper-schematic:<id>`。
- 状态栏、诊断计数、日志入口。

R1 浏览器回归覆盖 375、768、1080 px 下的 Library、`i` 浏览器、右栏拖拽和重载恢复。无效 JSON 导入可在错误筛选中定位，导出的电路 JSON 不包含日志。新增跨线与字体文案已接入 i18n 键。

Options 支持 English、简体中文，以及跟随系统、亮色和暗色。点击齿轮或按 `O` 打开；组合键、重复按键、输入法组合输入、输入控件和已有弹窗不会触发该快捷键。源码独立 Web 默认英文，Analog Tools 站点默认简体中文，两者默认跟随系统颜色。设置仅存于当前浏览器，并用于对应的 Help。运行 `npm run test:preferences` 可验证真实 `O` 键、动态参数汉化、深色对比度、375 px 下的 Options、刷新恢复和网表一致性。

### R2：结构化网表 —— 已通过本轮验收

已落地：

- 整张图生成一个 subckt；画布网络标签/端口变成 subckt 端口。
- 电源/地器件生成 `VDD/GND` 端口。
- SPICE 与 Spectre 输出。
- Options 提供 SKY130、GF180MCU、IHP SG13G2 和自定义工艺。默认模型跟随工艺，工艺随当前电路保存。
- NMOS、PMOS、NPN、PNP、R、C、L 支持单器件模型覆盖。显式模型随器件保存在原理图 JSON 中，切换工艺时保留。自定义工艺允许直接填写模型名。
- MOS 的 `W/L/M/NF`；缺参数时生成带默认值的 `parameters`（Virtuoso 风格）。
- 悬空引脚仍生成 `netN`，同时保留 diagnostics。
- Netlist 面板提供格式切换、行号、复制和下载。网表与诊断上下等高，各自滚动。
- ERC：悬空引脚、重复位号、缺模型、缺参数、不支持器件等。

R2 的 error 和 warning 均保留诊断，同时允许生成、复制和下载结构网表。已补齐缺失或格式无效的模型名、名称冲突、MOS 参数边界及显式体端悬空等负例。点击器件诊断会选中并居中。RC 低通、MOS 共源和差分对的六份 golden 已通过离线语法及 JSON 重载逐字节对拍。1000 器件串联电路的 IR 构建与两种格式输出，五次测得 31.3–66.6 ms，低于 500 ms 的验收上限。详见 [网表规格](netlist-ir.md)。

### R3：显示与图形 —— 源码验收通过

当前已落地：

- 系统字体栈（含中文字体 fallback、SVG fallback），未引入 webfont。
- Layers 面板：图层增删、重命名、上下移动、可见性、锁定、活动图层、对象计数。
- **Layers 对象树与逐对象操作**：每个图层可展开完整对象列表，覆盖器件、矩形/三角形、wire、junction、label、pin、note 和 coupling；器件可继续展开全部引脚。点击对象同步画布选择，点击引脚选择父器件；隐藏或锁定图层中的对象禁止从树中选择。
- 顶层对象均可独立显隐并在同层相邻上下移动，隐藏对象仍参与排序，锁定层禁止这些编辑。对象树顶层优先的顺序同时驱动 JointJS 画布 z、note DOM 顺序和 SVG 导出顺序；显隐只影响显示，不删除对象或改变连接/网表。增量替换、导线几何刷新和变换后的 junction 重建也会保持隐藏状态与对象树顺序。
- 逐对象状态保存于可选文档字段 `layerObjectStates[id].visible/z`，新 z 优先于器件旧 `values["layer:z"]`；空状态不写入 JSON。操作支持撤销/重做、localStorage 刷新恢复和文件 round-trip。引脚不参与排序，显隐沿用 `pinVisible:<pinId>`，仅组件原本允许编辑的引脚可切换。
- 1B 统一 Layers、画布、选择和 SVG／只读查看器的图层归属、显隐及层序。器件与图形使用 `values["layer:id"]`，导线、网络标签和注释的可选 `layerId` 随文档保存。缺省与无效归属使用稳定默认层，重排只改变显示顺序。
- 引脚随父器件归层。跨层连接点归到最上方的可见相连导线所在层，所有相连导线隐藏时，该点随之隐藏。仅由引脚组成的连接点随父器件计算归属。连接点仍可逐点显隐。
- 1C 统一 Properties 的 Layer 下拉框。器件、图形、导线、网络标签、注释支持单选或批量改派；混合选择按原相对顺序移到目标层顶部，操作进入单次撤销。移入隐藏层时对象退出画布和当前选择，锁定层限制改派和新建。新导线、标签、注释以及模板器件和导线归到活动层。
- 导入样例位于源码仓库的 `scripts/fixtures/r3-1c-rc-layer-test.schematic.json`。三层 RC 电路包含跨层输出支路、网络标签、注释和锁定参考层。文档栏的 Paste schematic JSON 按钮和文件导入共用完整文档流程，打开新标签页并保留图层及逐对象状态。`test:r3:layers` 对拍此样例的两种导入结果。
- 1D 已完成。同文档复制保留图层，跨标签页复制和画布剪贴板粘贴进入目标活动层。切换标签页后恢复该文档本次会话选择的活动层。副本使用新 ID，保留逐对象显隐和相对层序，放在对应图层的现有对象上方；锁定目标层时可以解锁后继续放置。引脚随父器件归层，耦合对象可在文档中保存副本的 `layerId`，连接点仍随相连对象归层。
- 1E 已完成。文档栏 Export schematic 提供完整 JSON、SVG 和 PNG。图像默认遵循文档可见性，按次勾选「包含隐藏对象」可纳入隐藏图层及单独隐藏对象，沿用 Layers 的图层和对象顺序。SVG、PNG 与只读查看器共用整图场景规则。端点装饰按完整物理连接计算。
- 1F 已完成。以同一张三层 RC 电路贯通改派、真实布线拆分、混合复制、逐对象与整层隐藏、导出、刷新和 JSON 重导入。每一步的 SPICE、Spectre 与诊断均对拍一致，刷新后与 JSON 重导入后的完整电路和图层状态一致。
- **自由图形使用 Library 组件。** `Shapes` 分类包含闭合图形 `rectangle` / `triangle` / `circle` / `polygon` 和开放图形 `polyline` / `arc`，侧栏和 `i` 浏览器共用分类、标识和预览。

#### R3 图形当前事实

旧的自由图形体系已完整移除：

- 删除：`shapeModel.ts`、`shapeRenderer.ts`、`shapeSvgRenderer.ts`、`icons/shapes.svg`
- 删除：工具栏 Shapes 按钮与形状选择弹层
- 删除：独立形状属性表单、`shape:*` 值、`shapeRendering` 测试
- 删除：旧 `r3-shapes.mjs`

现在的行为：

- `rectangle` / `triangle` 仍然走 Library catalog，但作为纯图形使用独立的 `eda.LibraryShape` cell。
- 两种图形在定义层均无任何 pins，JointJS markup 不包含 text 节点，也不生成引脚小方框、中央文字或三角形顶点 `A/B/C` 标签；不是用 `opacity: 0` 隐藏。实际 DOM 只有轮廓和选择/缩放手柄。
- 读取旧文档时会清除这两种图形的 legacy pin、label 和 pin visibility 字段；Properties 不再显示 Name、Show label 或引脚字段，矩形只保留 Width/Height。
- 矩形：点击第一个格点，拖动/点击第二个点，拖动中显示虚线矩形，松开后创建。
- 矩形选中后显示四个顶点和四个边中点手柄。上下边中点只调整高度，左右边中点只调整宽度，对边保持固定，垂直方向的鼠标位移不会改变另一维度；旋转矩形按局部坐标处理。边拖拽不吸附未改变的中心轴，避免属性生成的半格小矩形在拖边时发生 5px 连带跳动。
- 三角形：依次点击三个格点，第三点完成后创建；放置第一个点后无连线，移动去放第二个点时只连接“第一点 → 当前点”，移动去放第三个点时保留“第一点 → 第二点”的已有边，并增加“第一点 → 当前点”和“第二点 → 当前点”，共三条独立线段；重合或零长度线段不会重复生成。
- 从首次点击前开始，鼠标移动时实时显示当前吸附点的蓝色圆环；图形虚线预览与吸附标记共用同一坐标。
- 创建图形的绘制点按 10px（一个可见画布格子）吸附，矩形拖动预览与最终尺寸均使用该步进；保存几何时仍以 20px 的 `SYMBOL_GRID_SIZE` 为单位，无引脚矩形允许 0.5 单位（10px）尺寸，已有图形的移动、缩放和顶点编辑步进不变。
- 矩形以四个轮廓顶点、三角形以三个实际轮廓顶点作为点击、拖动和缩放的吸附基准，再由顶点的共同修正量更新存储中心；中心不再直接吸附，因此半格中心不会在单击时被取整偏移。
- 三角形的世界顶点始终保持 10px 网格，但奇数格跨度产生的精确包围盒中心允许落在 5px 半格；局部坐标校验同步允许 5px。重定位顶点时不得把该中心二次吸附到 10px，否则轮廓相对 frame 偏移并出现底部越界。
- 两种纯图形的选择 frame 直接使用实际轮廓尺寸，不再经过普通器件的 `gridAlignedFrame` 网格外扩；`0.5 × 0.5` 矩形的蓝色虚线框与 10 × 10px 黑色轮廓一致，奇数格跨度的三角形在顶点半格重定位后，frame 也与新轮廓一致。
- Library 的矩形/三角形预览增加 4px 安全边距并显式等比缩放，默认预览 `viewBox` 分别为 `-4 -4 88 48`、`-4 -4 88 88`，不再贴边裁切。
- 创建的是普通 `ComponentInstance`，支持选择、移动、缩放、复制、删除、撤销/重做、图层归属。
- Properties 保留 Layer、Cell、Color、Size，矩形另有 Width/Height；Color 下提供线宽、线形，矩形另有圆角；Size 后的分隔线下提供填充开关、填充颜色和填充透明度。三角形不显示 Width/Height/圆角，无填充时填充颜色和透明度控件禁用。Fill color 复用 Color 的色板样式，白色默认色位于首格，原生自定义取色器位于最后一格。
- 图形样式使用 `libraryShapeStrokeWidth`（默认 4）、`libraryShapeLineStyle`（`solid/dashed/dotted/dashDot`，默认 `solid`）、`libraryShapeCornerRadius`（默认 0，仅矩形）、`libraryShapeFillEnabled`（默认 `false`）、`libraryShapeFillColor`（默认 `#ffffff`）、`libraryShapeFillOpacity`（默认 1）六个文档值键；缺省键表示默认值。
- 线形支持实线、虚线、点线和点划线；圆角路径钳制到短边一半，圆角为 0 时保持旧路径不变。JointJS 与纯 SVG 渲染共用相同样式语义，样式编辑支持历史撤销/重做、复制和 localStorage 持久化。
- Library 的六种图形由结构化网表的 `SKIP_TYPES` 跳过，均无电气引脚。

##### 折线操作和存储

- 在 Library 的 `Shapes` 选择 `polyline`，或按 `i` 后搜索 `polyline` / `折线`。点击 10px 网格添加顶点，至少两点后可按 Enter、双击终点或点击「完成折线」。Esc 取消当前草稿。相邻重复点不会计入，支持水平、垂直和斜线段，最多 256 个点。
- 选中后用顶点手柄拖动单个点，其他点保持原位。绘制、一次拖动和箭头开关分别进入撤销历史。移动端选择折线后自动收起 Library 抽屉，可触摸画布并用按钮完成。
- Properties 提供颜色、线宽、线形和尺寸。起点与终点可独立选择无、实心三角、实心 ASME、开放箭头、燕尾或实心菱形，各有小、中、大、特大四档。箭头默认关闭且预设为中号，服从折线颜色和端段方向。箭头尖端对齐原顶点，线身缩到箭头内部。实心 ASME 参考 Visio 第 13 号示意图和截图采用 3:2 轮廓。中号箭头长约为线宽的 6 倍，底宽约为线宽的 4 倍，细线和短端段会调整尺寸以保持可读性。JointJS、只读查看器和 SVG/PNG 导出共用这段几何。
- `values.polylinePoints` 保存以包围盒中心为原点的 `[x, y]` 数组 JSON 字符串。`libraryShapeStartArrow` / `libraryShapeEndArrow` 保存类型，`libraryShapeStartArrowSize` / `libraryShapeEndArrowSize` 保存尺寸。旧文件的 `true` 和 `false` 分别读作实心三角和无箭头。折线作为 `shape` 进入 Layers 树。

##### 弧形操作和存储

- 在 Library 的 Shapes 选择 `arc`，也可在 `i` 浏览器搜索 `arc`、`弧形` 或 `圆弧`。依次点击左、右两个端点，再点击曲线经过的第三点。端点吸附到 10px 网格，第三点以 1px 步进放置和编辑。两端固定后起始预览为直线，随后随鼠标实时弯曲。三点共线可生成平直的弧形，第三点也可移到端点范围外。Esc 取消草稿。
- 路径使用经过第三点的二次贝塞尔曲线。选中后可独立拖动圆形端点手柄和菱形弧上手柄，单次拖动可撤销。弧形可设置颜色、线宽、线形和尺寸，随活动图层保存。属性面板沿用折线的首尾箭头样式与尺寸，默认无箭头。箭尖对齐原端点，方向由箭尖与曲线接合点决定。箭头按设定的尺寸和线宽绘制，只有端点间距不足时才限制箭头长度。线身保留接合点之间的原贝塞尔曲线，端部急弯时，同一样式和尺寸档位的两个箭头仍等大。画布、查看器和导出共用曲线和箭头路径。
- `values.arcPoints` 保存 `[左端点, 右端点, 弧上第三点]` 的局部坐标，每个点用 `[x, y]` 数组表示，外层仍为组件值 JSON 字符串。旧弧形文件重载时沿用三个点，按新曲线规则绘制。箭头沿用折线的 `libraryShapeStartArrow` / `libraryShapeEndArrow` 和对应的尺寸键。

##### 圆形和多边形操作与存储

- 在 Library 的 Shapes 选择 `circle`。第一次点击确定圆心，移动指针实时预览，第二次点击确定半径。两个点按 10px 网格吸附，半径使用两点的实际距离。完成时立即显示上、右、下、左四个手柄，拖动时对边保持固定，每次只调整一个轴。文档用 `values.circleRadiusX` 和 `values.circleRadiusY` 保存两个半轴。
- 选择 `polygon` 后逐个添加顶点。放置第二个顶点后，预览保留已绘制边并连接目标点与上一顶点和起点。至少三个不共线的顶点后，点击起点、双击终点、按 Enter 或点「完成多边形」闭合，Esc 取消。选中后可独立拖动顶点。最多可画 256 个顶点，`values.polygonPoints` 保存以包围盒中心为原点的有序局部坐标。
- 两种图形沿用矩形和三角形的颜色、线宽、线形、尺寸与填充属性。填充颜色使用预设色板和自定义取色器。图形随活动图层保存，画布、查看器和导出使用相同的闭合路径。

#### R3 第二步：交叉显示与字体

- Web 工具栏的 Options 提供 Wire crossings（Plain / Hop）和 Default text font。默认使用直线交叉和无衬线系统字体。跨线桥根据可见导线的图层和对象顺序绘制，真实连接仍使用圆点，电气连接与网表不随显示选项变化。
- 单选注释或网络标签后，可在 Properties 的 Font 切换为无衬线、衬线、等宽字体，或恢复继承。字体使用含中文回退的系统字体栈。文档 JSON 保存 `display.wireCrossings`、`display.textFont`，及对象的可选 `fontFamily`。更改支持撤销、重做及刷新恢复。
- 画布、SVG、PNG 和只读查看器沿用相同的跨线规则及字体。浏览器回归命令为 `npm run test:r3:display`。
- 同一构建串跑 Library 图形、折线、弧形、闭合图形、Layers 和 Display。三层 RC 流程覆盖 Hop 及字体覆盖、层序和显隐、图片导出和 JSON 重导入，并逐步对拍 SPICE、Spectre 与诊断。

#### 放置点击修复

用户反馈“选择器件后有时点一下不能放置，需要点几次”。根因：

- JointJS `Paper` 的 `clickThreshold` 默认是 `0`。
- 鼠标按下到松开之间只要发生一次 `mousemove`，`blank:pointerclick` 就不会触发。
- 人手点击通常有 1–3px 抖动，因此表现为偶发失败。

修复位置：`editor.ts` 的 `placementPointerStart` / `pointerup` fallback。

- 放置模式下记录空白画布按下点和最大移动距离。
- 松开时移动在 `0.5–12px` 之间，直接在松开位置放置。
- 完全不动仍走 JointJS 原路径；大于 12px 视为拖动，不放置。
- 回归脚本：`scripts/placement-jitter.mjs`（`npm run test:placement`）。

### R4：子图层级、总线与项目包

- Web 右栏 Hierarchy 管理子图、引用、端口顺序、全局网络和 Top。工具栏的 Pin（`P`）设置类型、名称及自动符号中的所在边，左栏 Properties 可编辑已放置的端口。
- Library 的 Hierarchy 库提供自动生成的矩形符号和方框接线点。按 `E` 后点选实例进入子图，按 `Ctrl+E` 返回调用者。
- Pin 改名保留端口身份及接线；换边和删除保留父图导线坐标，失配线头留在原处。换边不影响网表顺序。
- Pin 和 Net Label 严格区分大小写。同一张 Sheet 中同名有效标签电气相连。总线使用 `OUT<7:0>`，单个位使用 `OUT<3>`，SPICE 和 Spectre 按书写顺序展开。
- `schematicProject.ts` 管理项目拓扑、派生符号和 v2 项目包。`schematicHierarchyPanel.ts` 管理交互。`netlist/project.ts` 生成 SPICE / Spectre 层级定义及诊断。
- R4 功能提交为 `912caee`，已纳入 Beta。可导入源码仓库 `scripts/fixtures/r4-dual-rc-test.atproj.json` 测试三级导航及两个父图实例的端口同步。
- `npm run test:r4` 验证 Pin 放置、方框接线、父图导线保留、删除与跨子图撤销、端口重排、两种网表、项目包文件和剪贴板往返、刷新恢复及 375 px 深色界面。单元测试覆盖三级调用及循环、缺失引用。
- 库、Web 和 Obsidian 构建及类型检查通过。启用长测后，Schematic 1918 项通过，Obsidian 70 项通过。浏览器验证了总线单个位的分接、层次快捷键、折叠区和 375 px 深色模式下的长路径显示。

### R5：本机 Agent 协作

- Web 编辑器支持一次性配对、最长两小时的会话、结构化快照、试运行、语义事务及修订冲突检查。连接器通过 `npm run agent:connector` 在本机启动。详见 [Agent 事务规格](agent-transaction.md)。
- 1.0.1-beta 的 AI 弹窗在状态区上方使用 `role="separator"` 的分割线，状态统一显示为“当前状态：人工编辑 / 等待 AI 配对 / AI 已连接 / 连接已暂停。/ 本机连接器离线”。文案由现有 `AgentSession.status` 驱动，每次 render 随等待、连接、暂停、离线和断开更新；非安全上下文仍优先显示 HTTPS/localhost 提示。`test:preferences` 覆盖人工编辑与离线，`test:r5` 覆盖真实配对后的已连接状态，发布包站点回归另覆盖等待配对与已连接。

### Beta 交互与 Web 性能

- 布线支持正交、45° 和自由角度，实时显示吸附点及预览。工具模式更新了指针提示、框选移动与复制、保线移动和子图实例复制。Add Instance 支持器件、图形及模板放置前的属性编辑。
- Note 使用普通文本与 TeX，支持九点定位和公式导出。MathJax 4.1.3 以本地单文件按需加载。JointJS 4.2.4 从模块化入口构建为独立的内容哈希 chunk。参见 [MathJax 构建说明](../../app/schematic/vendor/mathjax/README.md)。

---

## 5. 关键代码地图

### 编辑器/UI

| 文件 | 作用 |
|---|---|
| `packages/schematic/src/schematic/editor.ts` | 编辑器主控制器：事件、选择、放置、图层、图形绘制、放置 fallback |
| `layerObjectTreeModel.ts` | 从文档派生 Layers 对象树、同层顺序、显隐/排序能力和引脚节点 |
| `layerObjectStateModel.ts` | 逐对象 visible/z 的读取、旧 layer:z 回退、显示判定与状态写入 |
| `layerObjectCommands.ts` | 基于当前派生文档计划同层相邻交换，再应用到 transaction draft |
| `schematicTabShell.ts` | 工作区壳、标签、工具栏、Dock、日志 |
| `schematicToolbarWeb.ts` | Web 工具栏按钮与图标 |
| `toolState.ts` | 工具状态与命令映射 |
| `schematicEditorUiProjection.ts` | 左侧栏、属性区、图层区 DOM 投影 |
| `schematic.css` / `schematicCore.css` | 编辑器样式 |
| `schematicLayoutController.ts` | 面板宽度/高度、窄屏、布局持久化 |
| `sidebarLibrary.ts` | Library 标签与器件选择 |
| `instanceBrowser.ts` | `i` 浮层浏览器 |
| `rightDock.ts` | 右侧 Dock 标签 |
| `eventLog.ts` | 日志抽屉 |

### 文档/渲染

| 文件 | 作用 |
|---|---|
| `document/documentModel.ts` | 文档创建、content/document 转换 |
| `schematicDocumentCodec.ts` | 文档 JSON codec |
| `componentRenderer.ts` | JointJS 组件 cell |
| `componentVisualModel.ts` | 共用视觉模型入口 |
| `razaviComponentVisualModel.ts` | 组件几何/标签/引线/引脚视觉 |
| `componentSvgRenderer.ts` | 纯 SVG 组件渲染 |
| `documentSvgRenderer.ts` | 整图 SVG / viewer |
| `viewStyling.ts` | 选择态样式 |
| `layers.ts` | 图层默认值/规范化 |
| `rectangleComponentModel.ts` | 纯矩形宽高、legacy pin 命令拒绝 |
| `triangleComponentModel.ts` | 纯三角形顶点与尺寸 |
| `libraryShapeGeometry.ts` | 矩形、三角形、折线的轮廓顶点与共同吸附修正 |
| `polylineComponentModel.ts` / `symbols/polylineSymbols.ts` | 折线局部坐标、顶点编辑和路径 |
| `symbols/shapeArrowSymbols.ts` | 折线与弧形共用的箭头轮廓与尺寸 |
| `arcComponentModel.ts` / `arcGeometry.ts` / `symbols/arcSymbols.ts` | 三点曲线的存储、贝塞尔几何、边界和 SVG 路径 |
| `circleComponentModel.ts` / `polygonComponentModel.ts` / `symbols/closedShapeSymbols.ts` | 圆和椭圆的半轴、多边形顶点与闭合路径 |
| `libraryShapeStyleModel.ts` | 图形描边、线形、圆角、填充和端点箭头的默认值与校验 |

### 网表

| 文件 | 作用 |
|---|---|
| `netlist/build.ts` | 图 → netlist IR |
| `netlist/profiles.ts` | 工艺/器件映射 |
| `netlist/print.ts` | SPICE / Spectre printer |
| `netlist/build.ts` 的诊断分支 | ERC 与诊断来源 |
| `netlist/panel.ts` | 右栏 Netlist 视图 |

### 图形当前实现位置

- 形状选择/绘制：`editor.ts` 中的 `beginLibraryShapeDraw`、`bindLibraryShapeDrawEvents`、`finishLibraryShapeDraw`。
- 纯图形结构：`componentRenderer.ts` 的 `LibraryShapeElement`；catalog 定义层 pins 固定为空，markup 不含 text。
- 轮廓与吸附：`libraryShapeGeometry.ts`；`view-geometry.ts`、`cellGeometryModel.ts`、`selectionMoveTransaction.ts` 和 `rectangleResizeSession.ts` 共用顶点修正。
- 样式：`libraryShapeStyleModel.ts` 统一校验和生成 SVG 属性；`componentRenderer.ts`、`componentSvgRenderer.ts` 分别接入 JointJS 与纯 SVG 渲染。
- 创建值：`rectangleWidthGrid` / `rectangleHeightGrid` / `triangleVertex:*` / `polylinePoints` / `arcPoints`。
- 放置 fallback：同文件 `placementPointerStart` 附近。

---

## 6. 构建、测试与浏览器验收

### 环境

Node.js 22.13+、npm 10+。当前机器上建议先设置：

```powershell
$env:PATH="C:\Users\hydro\npm-bootstrap\bin;C:\Users\hydro\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin;$env:PATH"
$env:TEMP='D:\AI程序设计\analog-tools\.tmp-build'
$env:TMP=$env:TEMP
```

PowerShell 下使用 `npm.cmd` 避免执行策略问题。

### 常用命令

```powershell
cd source/schematic-editor

npm.cmd run typecheck
npm.cmd test
npm.cmd run build:lib
npm.cmd run build:web
```

`npm test` 会先 `build:lib`，再跑 schematic 与 obsidian 测试。

### Beta 验证入口

根据改动选用现有测试。下表中的 Node 脚本在源码仓库运行，运行前先构建库和 Web。

| 改动 | 优先检查 |
|---|---|
| 布线、移动、复制、存储 | `npm run test:interactions`、`npm run test:persistence`、`npm run test:placement` |
| Add Instance 与属性 | `node scripts/instance-browser-smoke.mjs` |
| 图形、图层和显示 | `npm run test:r3`、相关形状测试、`npm run test:r3:layers`、`npm run test:r3:display` |
| 层级与网表 | `npm run test:r4`、`npm run test:r2` |
| 本机协作 | `npm run test:r5` |
| 注释、公式与 Web 分块 | `npm run test:note`、`npm run test:web-performance`、`node scripts/web-mathjax-compat-smoke.mjs` |

### 1.0.1-beta 当前验收

- 源码 `0d2d429` 已通过 `typecheck`、`npm test`、`test:preferences`、`test:r5`、`test:web-performance` 和 `build:obsidian`。Schematic 为 163 个测试文件通过、1 个跳过，1850 项通过、2 项跳过；Obsidian 为 9 个测试文件、70 项全部通过。Vite 仍有既有的大分块提示。
- 当前站点资源为 `editor-DpbUoqQA.js`、`editor-DBBQ9ZwL.css`、`jointjs-CXOFuMno.js`、`analysis.worker-oidw_f6g.js` 和 `style-BOiV29gy.css`。JointJS 与分析 Worker 的哈希及内容未变，MathJax 按需加载与 JointJS 独立分块检查通过。
- 发布包在真实 Chromium 中按 `/tools/schematic/` 路径验收，覆盖 `O` 快捷键、AI 人工编辑/等待配对/已连接状态、状态分割线、深色模式、375 px 下 AI 与 Options 弹窗边界，并检查双工具首页、WaveDrom 和两份手册的访问。控制台零错误、资源零 404。未执行生产服务器部署。

归档并解压后曾用 Chromium 在 `/tools/` 下验证双工具首页、两个工具及手册、WaveDrom 波形、Schematic Editor 公式按需加载，以及 375 px 深色页面。以下各阶段的测试数量对应当时的提交。

### R4 启动前的历史回归

在 `e7b4824` 的功能代码上验证了库、Web 和 Obsidian 构建及工作区类型检查。启用 `RUN_SLOW_TESTS=1` 后，Schematic 167 个测试文件、1909 项通过，Obsidian 9 个测试文件、70 项通过。包含默认关闭的 RLC 符号分析和大图 SVG 性能测试。Vite 仍报告构建分块大小提醒。

Edge 共通过 13 个浏览器脚本：

- R1：`r1-smoke`、`web-preferences-smoke`。覆盖 375 / 768 / 1080 px、两种器件入口、右栏恢复、中英文和三种主题模式、中文日志和错误筛选、无效导入、Help。
- R2：`r2-smoke`。覆盖工艺与七类单器件模型、两种格式输出、撤销重做和刷新恢复、网表与诊断等高、错误定位、复制、下载。六份 golden 和离线语法由单元测试覆盖。
- R3：`r3-library-shapes`、`r3-polyline`、`r3-arc`、`r3-closed-shapes`、`r3-layers`、`r3-display`。覆盖六种图形、急弯箭头、图层显隐与锁定、导线拆分、跨线、字体、SVG/PNG 和三层 RC 电路的 SPICE/Spectre 一致性。
- 通用：`browser-smoke`、`interaction-smoke`、`persistence-smoke`、`placement-jitter`。覆盖连线与节点编辑、元件参数、符号分析、撤销重做、刷新、存储配额与跨页写入冲突。

交互测试用实际文本行检查属性标签换行。首次并行启用长测时 Vitest 的 worker 通信超时；长测单独运行通过，随后限制到四个 worker 的全量测试也通过。

图层功能的历史验证基线为源码提交 `156c903`（已推送 `origin/main`）：

- schematic：162 个测试文件（161 通过 / 1 跳过）；1850 个测试（1848 通过 / 2 跳过）
- obsidian：9 个测试文件 / 69 个测试通过
- 基线已通过 `typecheck`、`npm test`（含 `build:lib`）、`build:web`、`test:r3`、`test:r3:layers`。

折线工作区也已通过 `typecheck`、`build:web` 和全量单测。Schematic 1854 项通过、2 项跳过，Obsidian 69 项通过。折线、原有 Library 图形、Layers 和放置抖动的浏览器验收通过。

三点曲线已通过 `typecheck`、`build:web`、`test:r3:arc`、`test:r3:polyline`、`test:r3` 和全量单测。Schematic 1860 项通过、2 项跳过，Obsidian 69 项通过。

`52c6d14` 已通过类型检查、Web 构建和浏览器验收，覆盖闭合图形、折线、弧形首尾箭头、急弯修复和 375px 触屏。Schematic 1872 项通过、2 项跳过，Obsidian 69 项通过。

1B 图层归属的回归覆盖文档读写、默认层重排、框选、跨层导线拓扑、连接点显隐和 SVG 导出。

1C 已通过类型检查、Web 构建和浏览器验收，覆盖单选和混合改派、隐藏层、锁定层、活动层放置、撤销重做和 375px 深色属性菜单。Schematic 1878 项通过、2 项跳过，Obsidian 69 项通过。

1D 已通过库和 Web 构建、类型检查、Web 浏览器回归及 `test:r3:layers`。浏览器覆盖同文档复制、跨标签页放置、锁定层拦截、画布粘贴、拆分后的标签与连接关系、撤销重做和刷新恢复。Schematic 1885 项通过、2 项跳过，Obsidian 69 项通过。

1E 已通过类型检查、Web 与 Obsidian 构建和浏览器验收。`test:r3:layers` 覆盖整层与逐对象隐藏、图像层序、SVG 与 PNG 画幅及像素、只读查看器、完整 JSON、键盘关闭和 375px 深色导出对话框。Schematic 1887 项通过、2 项跳过，Obsidian 70 项通过。

1F 的全量回归通过库、Web 和 Obsidian 构建、类型检查、Schematic 1887 项（2 项跳过）和 Obsidian 70 项测试。Edge 浏览器通过 Layers、Library、折线、弧形、闭合图形、通用交互及持久化回归，覆盖浅色、深色和 375px 布局。

### 浏览器 smoke

需要 Chrome/Chromium/Edge。命令：

```powershell
npm.cmd run test:r1
npm.cmd run test:r2
npm.cmd run test:r3
npm.cmd run test:r3:polyline
npm.cmd run test:r3:arc
npm.cmd run test:r3:closed-shapes
npm.cmd run test:r3:layers
npm.cmd run test:placement
```

- `test:r1`：Library、`i` 浏览器、放置、右栏、日志、持久化。
- `test:r2`：网表、格式/工艺、诊断位置。
- `test:r3`：Library 矩形/三角形绘制、首次点击前吸附标记、10px 单格创建步进、矩形预览与最终尺寸一致、创建后单击不偏移、虚线预览、去装饰、Properties；还覆盖 `0.5 × 0.5` 矩形 frame/轮廓屏幕边界一致、四个顶点与四个边中点手柄可见、东边中点拖拽只增加宽度且对边与相邻边不移动、Library 预览 `viewBox`、三角形第一点/第二点/第三点预览分别为 0/1/3 条独立线段，第三阶段保留前两点之间的已有边、实际顶点拖拽、奇数格半格重定位后 frame 对齐且仅有三个可用顶点手柄；覆盖描边线宽/线形/圆角/填充/透明度修改、撤销/重做、localStorage 保存与刷新恢复、三角形隐藏圆角，以及 375px 移动抽屉中的完整属性面板。
- `test:r3:polyline` 检查 Library 和 `i` 的 Shapes 分类、折线吸附和预览、Enter/双击完成、Esc 取消、逐顶点拖动、首尾箭头样式和尺寸、撤销/重做、刷新恢复。在 375px 下还实测触屏完成、箭头属性控件边界及完成按钮的浅色/深色文字对比度。
- `test:r3:arc` 检查三点成弧、预览与顶点对齐、弧上点跨越弦线并拖出端点范围、首尾箭头样式和尺寸、单侧急弯时两端箭头尺寸一致、撤销重做、保存重载，以及 375px 深色触屏绘制和属性操作。
- `test:r3:closed-shapes` 检查圆形实时预览、四个手柄和单轴拉伸、多边形的动态闭合边、顶点编辑、填充、撤销、刷新恢复和 375px 深色触屏绘制。
- `test:r3:layers`：完整对象类型、对象计数、器件引脚折叠、对象/引脚与画布选择同步、整层上下移动、隐藏层禁用对象选择；实际点击 component/wire/junction/label/note 的独立显隐，检查对象上下移后的树顺序、真实 graph cell z 与保存的整数状态，覆盖撤销/重做、锁定层控件禁用、localStorage 保存和页面刷新恢复；深色模式四处文字对比度均不低于 4.5:1，375px 移动抽屉无横向溢出。
- `test:r3:layers` 还包含整张 RC 电路的 1F 流程，验证图层和层序继承、网络标签重绑、图像导出与只读查看器的一致性、完整 JSON 往返，以及每个阶段的 SPICE、Spectre 和诊断对拍。
- `test:placement`：带 1–5px 鼠标抖动的单击放置，必须每次只创建一个器件。

手动开发：

```powershell
npm.cmd run dev
```

打开 `http://127.0.0.1:8001`。修改 library 后需要 `build:lib` 并刷新。

---

## 7. 当前测试/实现中的坑

1. **JointJS 点击阈值**
   - 默认 `clickThreshold: 0`；任何 `mousemove` 都会让 `pointerclick` 失效。
   - 放置已有 pointerup fallback；其他工具如果也依赖 `pointerclick`，需要单独考虑。

2. **模型的 `[model-id]` 包含放置预览**
   - 浏览器脚本统计器件时，放置预览也是 cell。
   - 脚本里通常先按 `Escape` 取消预览，再断言数量。

3. **Library 矩形/三角形仍是组件**
   - 不要再给它们增加电气 ports 或隐藏文本；定义层 pins 必须为空，`LibraryShapeElement` markup 不得加入 text，网表也跳过。
   - 点击、拖动和缩放统一使用 `libraryShapeGeometry.ts` 的实际轮廓顶点，不要退化为存储中心吸附。
   - 不要把 `shape:*` 值重新引入。

4. **CRLF**
   - `editor.ts` 和 `schematicEditorUiProjection.ts` 在工作区是 CRLF；git 提交时转 LF 会产生提示，不是错误。

5. **站点外壳与构建资源分别维护**
   - 后续站点发布时，按 [站点发布流程](upgrade-plan.md#62-构建与发布) 更新资源、入口引用及相关手册。保留站点页头、页脚、首选项和 Help 链接。
   - 生成的 `apps/web/dist` 用于本地验证和发布准备，源码提交应保留可复现的输入。

6. **保留已有能力**
   - R3 的 Library 图形已完成矩形、三角形、折线、弧形、圆形和多边形。
   - 工艺预设覆盖 SKY130、GF180MCU、IHP SG13G2 和自定义工艺。网表改动需考虑预设模型与单器件覆盖。

7. **逐对象状态依赖实际对象 ID**
   - 导线规范化为每个实际线段记录原导线 ID。新线段继承原导线的归属和显隐层序，网络标签按原物理导线和附着点重新绑定。保留物理节点身份的 junction 随几何变换迁移显隐和层序。
   - 同层移动必须先在当前 `SchematicDocument`（含派生 junctions）生成计划，再在 transaction 的 `SchematicContent` draft 应用，不能在 draft 中重新枚举 junction。

---

## 8. 后续 AI 开发要求

1. **先核对分支和范围。** 在外层仓库和源码仓库分别运行 `git status --short --branch`、查看 HEAD 和相关 diff。保留已有改动。比较 GitHub 时区分实时远端与本地缓存的跟踪引用。
2. **做完整而最小的变更。** 从用户实际使用的入口定位问题，优先修改直接负责该行为的模块，复用已有命令、属性、序列化和渲染路径。避免顺手重构、批量格式化、升级依赖或改动无关界面。补测试用于现有覆盖无法抓住的回归。
3. **保住共享行为。** 维护稳定引脚 ID、电气拓扑、撤销边界和宿主历史语义。画布、只读查看和 SVG/PNG 尽量共用视觉规则。保持 Web 纯静态、资源本地化、MathJax 按需加载与 JointJS chunk 缓存独立性。
4. **按风险选择验证。** 局部修复先跑相关测试；改变共享模型、关键路径或准备发布时扩大回归。检查改动实际涉及的 Web、嵌入库和 Obsidian 宿主。纯文档更新核对链接、命令、路径和版本事实。
5. **按任务交付。** 功能改动记录变更和验证结果，涉及使用方式时同步手册。站点同步、重打包、提交和推送按任务授权执行。需要提交时只暂存本次相关文件，提交信息用中文。

## 9. 交接检查清单

- [ ] 已核对工作分支和已有改动，明确本次应改源码、站点还是文档。
- [ ] 已通过实际入口验证改动，核对相关撤销、保存恢复或导出行为。
- [ ] 按需求更新受影响的文档，并交代已通过的检查、未验证事项与具体原因。
- [ ] 如有发布，核对标签、站点入口资源、浏览器测试和远端提交，单独记录生产部署是否已验证。
