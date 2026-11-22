# Agent 事务协议与本地 MCP

状态：Draft 0.1 · 2026-11-19
关联：[upgrade-plan.md](upgrade-plan.md)（R5）、[sheet-hierarchy.md](sheet-hierarchy.md)

## 1. 目的与边界

让站外 Agent（Claude Code、Codex、本地脚本等）以**类型化事务**读写原理图，而不是模拟鼠标键盘。

约束：

- 页面保持零网络请求；不内置 LLM、不内置 API key。
- Agent 只能通过 `snapshot` 读取、通过 `transact` 写入；不能执行任意代码、不能访问 DOM、不能加载 URL。
- 所有写入必须原子、可撤销、可审计。
- v1 先做**文件式**：导出项目 → Agent/MCP 修改 → 站内审阅导入。实时桥接是后续可选项。

## 2. 架构

```
┌─────────────┐   导出 .atproj.json   ┌──────────────┐
│  Web 编辑器  │ ───────────────────► │ Agent / MCP  │
│             │ ◄─────────────────── │  本地进程     │
└─────────────┘   导入 transaction    └──────────────┘
        │
        └── 站内“审阅应用”对话框：校验 → diff → 应用（一步撤销）
```

三种形态，按顺序交付：

1. **文件式（v1）**：用户导出项目 JSON；Agent 通过 MCP 或直接改文件；用户导入/粘贴 transaction；站内校验并应用。
2. **本地 MCP（v1）**：`tools/schematic-mcp` 提供 stdio 工具，读写本地 `.atproj.json`；不部署到站点。
3. **localhost 桥（后续）**：MCP 起本地 WebSocket，页面由用户点击“连接”后才连；不自动连接、不后台重连。v1 不做。

## 3. Snapshot

`snapshot` 返回只读快照，供 Agent 理解当前设计：

```jsonc
{
  "apiVersion": "1.0",
  "project": {
    "id": "prj_...",
    "name": "two-stage-amp",
    "revision": 42,
    "structureRevision": 7,
    "topSheetId": "s_amp",
    "globalNets": ["0", "VDD", "VSS"]
  },
  "sheets": [
    {
      "id": "s_amp",
      "name": "amp",
      "ports": [
        { "id": "p_in", "name": "IN", "direction": "input", "order": 0 }
      ],
      "components": [
        {
          "id": "c_m1",
          "type": "nmos",
          "ref": "M1",
          "x": 120,
          "y": 80,
          "rotation": 0,
          "mirrored": false,
          "values": { "mos:w": "1u", "mos:l": "0.15u" }
        }
      ],
      "wires": [
        { "id": "w_1", "points": [{ "x": 100, "y": 80 }, { "x": 120, "y": 80 }] }
      ]
    }
  ],
  "diagnostics": [
    {
      "code": "BULK_UNCONNECTED",
      "severity": "error",
      "sheetId": "s_amp",
      "objectId": "c_m1",
      "message": "M1 bulk is unconnected."
    }
  ]
}
```

规则：

- `revision` 每次内容事务 +1；`structureRevision` 每次 Sheet/Port/Top 变更 +1。
- `snapshot` 不包含视图状态、日志、netlist 文本缓存；netlist 用单独操作读取。
- 网络名由服务端解析后返回；Agent 不需要自己算 connectivity。
- `sheetTargetId` 等字段按需出现；空字段省略，避免噪声。
- 快照按项目整体返回；单 Sheet 可用查询参数 `sheetId` 过滤（可选）。

## 4. Transaction

### 4.1 请求

```jsonc
{
  "apiVersion": "1.0",
  "requestId": "req_01...",
  "baseRevision": 42,
  "baseStructureRevision": 7,
  "dryRun": true,
  "operations": [
    {
      "op": "add-component",
      "sheetId": "s_amp",
      "component": {
        "type": "resistor",
        "ref": "R1",
        "x": 200,
        "y": 80,
        "rotation": 0,
        "values": { "main": "1k" }
      }
    },
    {
      "op": "add-wire",
      "sheetId": "s_amp",
      "points": [{ "x": 180, "y": 80 }, { "x": 200, "y": 80 }]
    }
  ]
}
```

- `requestId` 用于幂等：相同 payload 重试返回同一结果；不同 payload 复用同一 id 拒绝。
- `baseRevision` 不匹配 → `409 REVISION_CONFLICT`；不应用任何操作。
- `baseStructureRevision` 仅结构操作需要；缺失时按当前结构版本检查。
- `dryRun: true` 只校验并返回 diff/诊断，不写、不增加 revision、不进撤销。
- 操作数上限 500；payload 上限 2 MiB。

### 4.2 响应

```jsonc
{
  "apiVersion": "1.0",
  "requestId": "req_01...",
  "applied": true,
  "revision": 43,
  "structureRevision": 7,
  "createdIds": { "component:0": "c_r1", "wire:1": "w_2" },
  "summary": { "sheets": 2, "added": 2, "removed": 0, "changed": 0 },
  "diagnostics": []
}
```

- `applied: false` + `diagnostics` 表示 dry run 或校验失败。
- 失败时错误必须带 `opIndex` 和 `op`，消息以 `operations[i] (op):` 开头。
- `createdIds` 用 `类型:索引` 映射到新 id，Agent 后续操作可引用。

## 5. 操作集（v1）

| op | 作用 | 关键校验 |
|---|---|---|
| `add-component` | 在 Sheet 中加器件 | type 在 catalog；ref 唯一；坐标 10px 网格；values/variantId 合法 |
| `set-values` | 改器件 values | 对象存在；key 合法；数值可解析 |
| `move-component` | 改 x/y/rotation/mirror | 网格；对象存在 |
| `remove-component` | 删器件 | 对象存在；只删指定对象，悬空线保留并诊断 |
| `add-wire` | 加折线 | ≥2 点；网格；端点/拐点合法 |
| `remove-wire` | 删导线 | 对象存在 |
| `add-net-label` | 加网络标签 | 名称合法；附着点存在 |
| `add-sheet` | 新建子图 | 名称唯一；端口合法 |
| `remove-sheet` | 删子图 | 非 Top；无引用 |
| `add-sheet-instance` | 在父图放子图块 | 目标存在；ref 唯一；不形成循环；端口自动派生 |
| `set-ports` | 增删改端口 | 名称唯一；顺序；删除已连接端口要 `force: true` |
| `set-top-sheet` | 改 Top | 目标存在 |
| `set-global-nets` | 改全局网 | 至少含 `0`；名称合法 |

设计原则：

- 只做声明式操作，不接受脚本、表达式、回调。
- 每个 op 独立校验；任一失败整批回滚。
- 删除类操作 v1 保守：只删指定对象，不自动清理拓扑；由用户/后续 op 处理线头。
- 需要“批量选择”时由 Agent 自己发多个 op；服务端不提供查询式批量删除，避免误删。
- 新增对象可以带 `id`（组件/导线/标签/子图），必须全局唯一且当前不存在；省略则由服务端生成。同一批里后面的 op 只能引用“已存在 id”或“本批前面显式提供的 id”，不能引用尚未返回的自动 id。
- 器件变体（电压源的 dc/sine/pulse 等）用实例字段 `variantId`，不塞进 `values`；`values` 只放数值/外观配置。

### 5.1 示例：建一个 RC + 标签

```jsonc
{
  "apiVersion": "1.0",
  "requestId": "req_rc_1",
  "baseRevision": 42,
  "operations": [
    { "op": "add-component", "sheetId": "s_top",
      "component": { "id": "c_v1", "type": "voltageSource", "ref": "V1", "x": 100, "y": 200,
        "rotation": 0, "variantId": "dc", "values": { "main": "1" } } },
    { "op": "add-component", "sheetId": "s_top",
      "component": { "id": "c_r1", "type": "resistor", "ref": "R1", "x": 260, "y": 160,
        "rotation": 90, "values": { "main": "1k" } } },
    { "op": "add-component", "sheetId": "s_top",
      "component": { "id": "c_c1", "type": "capacitor", "ref": "C1", "x": 380, "y": 240,
        "rotation": 90, "values": { "main": "1n" } } },
    { "op": "add-wire", "sheetId": "s_top", "id": "w_1",
      "points": [{ "x": 120, "y": 160 }, { "x": 260, "y": 160 }, { "x": 380, "y": 160 }] },
    { "op": "add-wire", "sheetId": "s_top", "id": "w_2",
      "points": [{ "x": 380, "y": 240 }, { "x": 380, "y": 300 }, { "x": 120, "y": 300 }, { "x": 120, "y": 240 }] },
    { "op": "add-net-label", "sheetId": "s_top",
      "label": { "name": "OUT", "wireId": "w_1", "point": { "x": 380, "y": 160 } } }
  ]
}
```

坐标、旋转、引脚连接由服务端按现有规则解析；Agent 不需要知道符号几何。示例坐标只用于说明结构，实际端点必须落在引脚或 10px 网格上，否则 `add-wire` 会被拒绝。

## 6. 版本、原子性与撤销

- 一次 transaction = 一个 undo 条目；`Ctrl+Z` 恢复整批。
- 事务提交前完成所有校验；提交时写文档、revision、日志；失败不留下半成品。
- `baseRevision` 过期：拒绝并返回当前 revision/snapshot 摘要；Agent 重读后重试，不自动合并。
- 并发：单页面单写者；MCP 文件式通过文件锁/备份避免并发写。
- 事务日志进 `Ctrl+Shift+L`：时间、requestId、op 数、结果、耗时；不记录完整文档。

## 7. 站内审阅应用

- 入口：工具栏 `Agent` 按钮；或把 JSON 文件拖进窗口。
- 对话框：
  1. 粘贴/选择 JSON。
  2. `Validate`（dry run）：显示 summary、每个 Sheet 的增删改计数、错误列表（带 opIndex）。
  3. `Apply`：一次事务，关闭对话框，切到受影响 Sheet，选中新建对象。
  4. `Cancel`：不写任何东西。
- 非法 JSON / 版本不符 / op 超限：直接拒绝，保持当前工作。
- 应用失败：保留对话框和草稿，显示错误；不部分应用。
- 成功后可 `Copy snapshot`，方便 Agent 继续。

## 8. 本地 MCP

包位置：`tools/schematic-mcp/`（本地工具，不部署到站点；是否纳入 `source/` 由实现时决定）。

- 传输：stdio。
- 配置：工作目录（只允许读写该目录下的 `.atproj.json`）、可选项目文件。
- 工具：
  - `schematic_snapshot`：读项目，返回第 3 节结构。
  - `schematic_transact`：应用第 4 节事务，写回文件（原子替换 + `.bak`）。
  - `schematic_netlist`：返回结构网表（调用同一套 core）。
  - `schematic_validate`：只校验，不写。
  - `schematic_catalog`：返回器件类型、引脚、参数元数据。
- 错误：返回 `{ code, message, opIndex? }`；不抛裸异常。
- 无网络、无遥测、无自动更新。

## 9. 安全与隐私

- 页面默认零请求；MCP/桥只能在用户本机运行。
- transaction 不允许：任意代码、URL、文件路径、DOM 选择器、指针事件、样式注入。
- 字符串字段做长度限制；ID 做格式校验；JSON 深度/大小限制。
- 不记录用户内容到日志；快照只在内存/本地文件。
- 未来若做 localhost 桥：token、短会话、仅 127.0.0.1、用户显式连接、可随时断开。

## 10. 验收

- Agent 通过 transaction 添加器件、导线、标签，应用后画面正确；`Ctrl+Z` 一次全部撤销。
- 建子图/端口/子图块，网表正确（SPICE + Spectre）。
- 过期 `baseRevision` 被拒绝；重读后重试成功。
- 非法 op（未知 type、重复 ref、越界坐标、循环）被拒绝，错误定位到 `opIndex`。
- `dryRun` 不改变文档、不增加 revision、不进撤销。
- MCP 本地 roundtrip：读 → 改 → 校验 → 写 → 再读一致。
- 页面在默认使用下零网络请求（DevTools Network 为空）。
- 审阅对话框对 2 MiB/500 ops 边界有明确错误。

## 11. 非目标（R5）

- 不做站内 LLM 对话；不内置 API key。
- 不做自动联网、后台重连、遥测。
- 不做 DOM/pointer 模拟点击；不通过 CSS/selector 改 UI。
- v1 不做实时双向同步；先文件式。
- 不做任意代码/脚本执行；不做 SPICE/Spectre 导入。
- 不做多用户协作/冲突合并。
