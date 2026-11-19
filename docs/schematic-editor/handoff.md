# Schematic Editor 交接文档

状态：交接基线 · 2026-11-20
源码仓库：`source/schematic-editor/`（独立 git 仓库）
源码提交：`aecafb7` `改用 Library 矩形/三角形并修复放置点击抖动`

这份文档面向后续接手的 Agent，目标是先建立正确的工作上下文，再开始改代码。**规格文档描述目标；本文档描述代码事实和当前进度。两者冲突时以代码和测试为准，并在完成变更后更新本文件。**

---

## 1. 先看什么

建议顺序：

1. 本文件。
2. [upgrade-plan.md](upgrade-plan.md)：R1–R6 的目标、验收与非目标。
3. [netlist-ir.md](netlist-ir.md)、[sheet-hierarchy.md](sheet-hierarchy.md)、[agent-transaction.md](agent-transaction.md)：按任务选读。
4. 源码入口：`source/schematic-editor/packages/schematic/src/schematic/editor.ts`。

当前最重要的约束：

- **不要恢复上一版自定义自由图形实现。** `shapeModel.ts`、`shapeRenderer.ts`、`shapeSvgRenderer.ts` 已删除，也不再使用 `annotation + shape:*` 表示图形。
- 自由图形现在直接使用 Library 已有的 `rectangle` / `triangle` 器件类型；当前只完成第一步。
- 不要直接改站点 `app/schematic/`。源码和站点发布是待人工同步的两个区域。

---

## 2. 仓库与发布边界

| 区域 | 路径 | 说明 |
|---|---|---|
| 升级规格/交接文档 | `docs/schematic-editor/` | 本文档所在目录，不参与部署 |
| 源码 | `source/schematic-editor/` | 独立 git 仓库，origin 是 `analog-life/GmKing-schematic-editor` |
| 站点现有发布 | `app/schematic/` | 当前仍是 0.1.1 构建产物；本次改动**尚未同步**到这里 |
| 主站工程 | 仓库根目录 | 主站文档、部署脚本、发布包 |

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

### R1：面板容器与反馈 —— 已完成

已落地：

- 左侧栏 `Library / Properties / Layers` 标签。
- Library 全器件列表、搜索、预览、单击放置。
- `i` 三栏浏览器（分类 / 器件 / 预览），保留键盘连续放置。
- 右侧 Dock：`Analysis / Netlist / Diagnostics` 标签，可收起/调宽。
- 底部日志抽屉，`Ctrl+Shift+L` 打开；可拖动高度。
- UI 布局持久化到 `at-schematic-layout`；Web 文档持久化使用 `adc-helper-schematic:<id>`。
- 状态栏、诊断计数、日志入口。

### R2：结构化网表 —— 大体完成

已落地：

- 整张图生成一个 subckt；画布网络标签/端口变成 subckt 端口。
- 电源/地器件生成 `VDD/GND` 端口。
- SPICE 与 Spectre 输出。
- sky130 / GF180MCU / IHP SG13G2 / Custom 工艺选择。
- NMOS/PMOS/NPN/PNP/R/C/L 器件类型选择。
- MOS 的 `W/L/M/NF`；缺参数时生成带默认值的 `parameters`（Virtuoso 风格）。
- 悬空引脚仍生成 `netN`，同时保留 diagnostics。
- Netlist 面板：格式/工艺选择、行号、复制/下载、诊断直接显示在网表下方。
- ERC：悬空引脚、重复位号、缺模型、缺参数、不支持器件等。

仍需按 [netlist-ir.md](netlist-ir.md) 做验收补齐，例如 golden 电路、真实 ngspice 验证、更多 ERC 细节。不要仅因为面板能显示网表就认为 R2 全部验收完成。

### R3：显示与图形 —— 进行中，已重置图形路线

当前已落地：

- 系统字体栈（含中文字体 fallback、SVG fallback），未引入 webfont。
- Layers 面板：图层增删、重命名、上下移动、可见性、锁定、活动图层、对象计数。
- 右侧 Dock 与 SVG/viewer 的隐藏图层过滤已覆盖普通器件。
- **自由图形第一步：直接使用 Library 的 `rectangle` / `triangle`。**

#### R3 图形当前事实

旧的自由图形体系已完整移除：

- 删除：`shapeModel.ts`、`shapeRenderer.ts`、`shapeSvgRenderer.ts`、`icons/shapes.svg`
- 删除：工具栏 Shapes 按钮与形状选择弹层
- 删除：独立形状属性表单、`shape:*` 值、`shapeRendering` 测试
- 删除：旧 `r3-shapes.mjs`

现在的行为：

- `rectangle` / `triangle` 仍然走 Library catalog 和普通组件属性。
- 渲染时隐藏了矩形/三角形的引脚引线、引脚小方框、中央文字、三角形顶点 `A/B/C` 标签；只保留外形轮廓。
- 矩形：点击第一个格点，拖动/点击第二个点，拖动中显示虚线矩形，松开后创建。
- 三角形：依次点击三个格点，每段显示虚线引导，第三点完成后创建。
- 绘制点按 20px（`SYMBOL_GRID_SIZE`）吸附，因为 Library 矩形/三角形的原生尺寸单位是 20px。
- 创建的是普通 `ComponentInstance`，支持选择、移动、缩放、复制、删除、撤销/重做、图层归属。
- `rectangle` / `triangle` 仍被网表 `SKIP_TYPES` 跳过，不参与电气网表。

当前已知不足：

- Properties 里仍会出现矩形/三角形的器件字段（三角形还会显示 AB/BC/CA pins、Pin A/B/C），尚未按“纯图形”精简。
- 只有矩形和三角形；折线、多边形、圆、圆弧尚未恢复/重做。
- 没有独立的填充、描边颜色、线宽、虚线、箭头属性。
- 旧实现中“图形”的顶点编辑、z-order 等能力目前由 Library 组件自身的 resize/图层机制部分承担，尚未完成 R3 目标。

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

### R4–R6：未开始

- R4：Project/Sheet/Ports、层级、项目包。
- R5：TB deck。
- R6：Agent transaction / MCP。

不要把 R3 的图形字段或 R4 的 schema 变更混在一起做。

---

## 5. 关键代码地图

### 编辑器/UI

| 文件 | 作用 |
|---|---|
| `packages/schematic/src/schematic/editor.ts` | 编辑器主控制器：事件、选择、放置、图层、图形绘制、放置 fallback |
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
| `rectangleComponentModel.ts` | 矩形尺寸、pin 布局 |
| `triangleComponentModel.ts` | 三角形顶点、边 pin、尺寸 |

### 网表

| 文件 | 作用 |
|---|---|
| `netlist/build.ts` | 图 → netlist IR |
| `netlist/profiles.ts` | 工艺/器件映射 |
| `netlist/spice.ts` / `spectre.ts` | printer |
| `netlist/erc.ts` | 诊断 |
| `netlist/panel.ts` | 右栏 Netlist 视图 |

### 图形当前实现位置

- 形状选择/绘制：`editor.ts` 中的 `beginLibraryShapeDraw`、`bindLibraryShapeDrawEvents`、`finishLibraryShapeDraw`。
- 去装饰：`razaviComponentVisualModel.ts` 的 `freeLibraryShape` 分支；`componentRenderer.ts` 跳过图形 ports；`editor.ts` 强制隐藏三角形顶点文字。
- 创建值：`rectangleWidthGrid` / `rectangleHeightGrid` / `triangleVertex:*` / `trianglePinCount:*`。
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

当前基线（`aecafb7`）：

- schematic：158 个测试文件（157 通过 / 1 跳过）；1827 个测试（1825 通过 / 2 跳过）
- obsidian：9 个测试文件 / 69 个测试通过
- `typecheck`、`build:lib`、`build:web` 通过

### 浏览器 smoke

需要 Chrome/Chromium/Edge。命令：

```powershell
npm.cmd run test:r1
npm.cmd run test:r2
npm.cmd run test:r3
npm.cmd run test:placement
```

- `test:r1`：Library、`i` 浏览器、放置、右栏、日志、持久化。
- `test:r2`：网表、格式/工艺、诊断位置。
- `test:r3`：Library 矩形/三角形绘制、虚线预览、去装饰、Properties。
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
   - 不要再给它们增加电气 ports；当前 `componentRenderer` 对这两种类型跳过 ports，网表也跳过。
   - 不要把 `shape:*` 值重新引入。

4. **CRLF**
   - `editor.ts` 和 `schematicEditorUiProjection.ts` 在工作区是 CRLF；git 提交时转 LF 会产生提示，不是错误。

5. **站点未同步**
   - `app/schematic/` 仍是旧版本；完成源码验收后另行构建、复制产物并更新站点版本/指纹。
   - 不要把 `apps/web/dist` 直接提交进源码仓库。

6. **规格与代码不一致**
   - R3 规格仍描述折线/多边形/顶点编辑等目标，当前代码只完成 Library 矩形/三角形第一步。
   - R2 也已超出旧规格的 sky130-only 范围（增加了 GF180/IHP/Custom），验收时以当前产品和代码为准。

---

## 8. 建议的下一步

按“一小步一小步”的方式继续，不要一次性恢复旧的 8 种自定义图形。

优先级建议：

1. **确认并完成 R3 图形第一步的收尾**
   - 矩形/三角形 Properties 隐藏电气 pin 字段。
   - 补充/确认填充、描边、线宽是否属于下一步。
   - 为 Library 图形增加更明确的视觉标识（当前与器件同列）。
2. **再决定后续图形**
   - 若继续使用 Library 组件，需要为折线/多边形等新增 catalog 类型或明确新的组件模型。
   - 不要恢复 `annotation + shape:*` 的旧路线。
3. **R3 剩余独立项**
   - 全对象图层（wire/junction/label/note/pin）。
   - `plain/hop` 交叉显示。
   - 注释/标签字体覆盖。
4. **R3 完成后再进入 R4**，避免 schema 和 UI 同时大改。

---

## 9. 交接检查清单

接手后先跑：

```powershell
git -C source/schematic-editor status --short
git -C source/schematic-editor log --oneline -3
cd source/schematic-editor
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:r3
npm.cmd run test:placement
```

确认：

- [ ] 工作区干净（或明确知道未提交改动属于谁）。
- [ ] `test:r3` 能绘制矩形/三角形且无引线/文字。
- [ ] `test:placement` 通过，单击不会重复放置。
- [ ] `app/schematic/` 未被误改。
- [ ] 新改动有中文 commit，并已推送 `origin/main`。
