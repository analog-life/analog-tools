# Schematic Editor 1.0.1-beta 开发文档

R1–R5 已纳入 1.0.1-beta。本版增加 Options 的 `O` 快捷键；AI 弹窗以分割线隔开状态区，并以“当前状态：”前缀显示人工编辑、等待配对、已连接、暂停或离线。后续开发从交接手册开始，再查阅相关专项规格和发布前的历史记录。

## 文档

| 文件 | 内容 | 状态 |
|---|---|---|
| [handoff.md](handoff.md) | 发布基线、源码入口、验证方法、后续 AI 开发要求 | 当前交接 |
| [upgrade-plan.md](upgrade-plan.md) | R1–R5 的交付与验收、作用范围、站点发布流程 | Beta 记录 |
| [netlist-ir.md](netlist-ir.md) | 网表 IR、规范化、SPICE/Spectre、工艺模型和诊断 | Beta 规格 |
| [sheet-hierarchy.md](sheet-hierarchy.md) | 项目包 schema v2、子图与端口、导航、层级网表 | Beta 规格 |
| [agent-transaction.md](agent-transaction.md) | Snapshot / Transaction 协议及本机回环连接器 | Beta 规格 |
| [phase0-baseline.md](phase0-baseline.md) | 升级前的环境、构建、测试结果及产物指纹 | 历史记录 |

建议阅读顺序：`handoff.md`（先了解代码现状）→ 本文件 → `upgrade-plan.md` → 按需要读三份专项规格。

## 规范用语

- **必须**：验收必须满足，否则不算完成。
- **应当**：默认这样做；偏离要在实现说明里写理由。
- **可以**：可选项，允许排到后续版本。
- **不做**：明确排除在本期之外，见 `upgrade-plan.md` 的“非目标”。

## 范围

- 源码：`source/schematic-editor/`（独立 git 仓库，跟踪上游 `KingsAnalog/GmKing-schematic-editor`，推送到 `analog-life` fork）。
- 站点：`app/schematic/` 包含 Vite 构建产物，以及站点维护的 `index.html`、`schematic.css`、`editor-preferences.js`、`manual.html`。
- 本目录是开发资料，用户手册随站点部署。

## 与当前代码的关系

规格里提到的现有模块，以源码为准：

- 画布与编辑器：`packages/schematic/src/schematic/`
- 可移植 core 与命令面：`editorHandle.ts`、`schematicEditorFacade.ts`
- 左侧栏投影：`schematicEditorUiProjection.ts`
- 右栏与标签壳：`schematicTabShell.ts`
- 布局与窄屏：`schematicLayoutController.ts`
- 结构网表：`netlist/`；项目、端口和自动符号：`schematicProject.ts`、`schematicHierarchyPanel.ts`
- 编辑器文案：`schematicI18n.ts`、`schematicUiText.ts`；站点默认语言与颜色模式：`app/schematic/editor-preferences.js`

## 独立实现与许可

本目录的规格与后续实现均为独立设计，不包含任何第三方项目的代码、文案、样式、图标或测试资源。

新增第三方依赖必须本地化到工具的 `vendor/`（或等价目录），附 LICENSE，并在 `THIRD_PARTY_LICENSES.txt` 登记；不得引入与现有 MIT / MPL-2.0 / Apache-2.0 分发不兼容的代码。
