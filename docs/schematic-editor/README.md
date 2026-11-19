# Schematic Editor 升级规格

状态：Draft 0.1 · 2026-11-19

本目录保存 Schematic Editor 下一阶段（R1–R6）的计划与规格。规格描述“应当做成什么样”，不描述当前代码“已经是什么”；两者不一致时，先看代码，再更新规格。

## 文档

| 文件 | 内容 | 状态 |
|---|---|---|
| [upgrade-plan.md](upgrade-plan.md) | 总体路线图、界面决策、验收标准、非目标、风险 | Draft |
| [netlist-ir.md](netlist-ir.md) | 网表 IR、规范化、SPICE/Spectre printer、sky130 profile、诊断 | Draft |
| [sheet-hierarchy.md](sheet-hierarchy.md) | 项目包 schema v2、子图/端口、导航、层级网表 | Draft |
| [agent-transaction.md](agent-transaction.md) | 站外 Agent 的 snapshot/transaction 协议、站内审阅、本地 MCP | Draft |
| [phase0-baseline.md](phase0-baseline.md) | 构建/发布基线：环境、产物指纹、阻塞项与下一步 | Blocked |

建议阅读顺序：本文件 → `upgrade-plan.md` → 按需要读三份专项规格。

## 规范用语

- **必须**：验收必须满足，否则不算完成。
- **应当**：默认这样做；偏离要在实现说明里写理由。
- **可以**：可选项，允许排到后续版本。
- **不做**：明确排除在本期之外，见 `upgrade-plan.md` 的“非目标”。

## 范围

- 源码：`source/schematic-editor/`（独立 git 仓库，跟踪上游 `KingsAnalog/GmKing-schematic-editor`，推送到 `analog-life` fork）。
- 站点：`app/schematic/`（Vite 构建产物 + 站点自有的 `index.html`、`schematic.css`、`schematic-i18n.js`、`manual.html`）。
- 本目录只做计划与规格，不参与部署；不要放进 `app/`。

## 与当前代码的关系

规格里提到的现有模块，以源码为准：

- 画布与编辑器：`packages/schematic/src/schematic/`
- 可移植 core 与命令面：`editorHandle.ts`、`schematicEditorFacade.ts`
- 左侧栏投影：`schematicEditorUiProjection.ts`
- 右栏与标签壳：`schematicTabShell.ts`
- 布局与窄屏：`schematicLayoutController.ts`
- 网表雏形：`selection/selectionNetlist.ts`（仅选中对象、端口为空、参数 TODO）
- 站点文案：`app/schematic/schematic-i18n.js`（DOM 文本精确匹配）

## 独立实现与许可

本目录的规格与后续实现均为独立设计，不包含任何第三方项目的代码、文案、样式、图标或测试资源。

新增第三方依赖必须本地化到工具的 `vendor/`（或等价目录），附 LICENSE，并在 `THIRD_PARTY_LICENSES.txt` 登记；不得引入与现有 MIT / MPL-2.0 / Apache-2.0 分发不兼容的代码。
