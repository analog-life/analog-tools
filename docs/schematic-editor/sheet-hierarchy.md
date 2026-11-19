# 子图层级与项目包 schema v2

状态：Draft 0.1 · 2026-11-19
关联：[upgrade-plan.md](upgrade-plan.md)（R4）、[netlist-ir.md](netlist-ir.md)

## 1. 目的与术语

本规格定义“子图（sheet）层级”：一张原理图可以放置另一张原理图的符号，形成可复用的层级设计，并导出为层级 subckt 网表。

| 术语 | 含义 |
|---|---|
| Project | 一个项目，包含若干 Sheet、一个 Top、可选的 TB；对应一个 `.atproj.json` |
| Sheet | 子图，等于现在的一份原理图文档 + 一组端口 |
| Port | 子图的正式端口，有名字、方向、顺序；对应 subckt 的 formal |
| SheetBlock | 子图块实例，放在父图里，引脚由目标 Sheet 的 Port 派生 |
| Top | 项目默认入口子图；Hierarchy 树里标 `TOP` |
| Occurrence | 某个 SheetBlock 在父图中的一次具体使用 |

本规格统一使用 `Sheet` / `SheetPort` / `SheetBlock` 作为术语。

## 2. Schema v2

### 2.1 项目包

```jsonc
{
  "format": "analog-tools/schematic-project",
  "version": 2,
  "id": "prj_...",
  "name": "two-stage-amp",
  "topSheetId": "s_top",
  "globalNets": ["0", "VDD", "VSS"],
  "sheets": [
    {
      "id": "s_top",
      "name": "top",
      "ports": [],
      "content": { /* 现有 SchematicContent */ }
    },
    {
      "id": "s_amp",
      "name": "amp",
      "ports": [
        { "id": "p_in",  "name": "IN",  "direction": "input",  "order": 0 },
        { "id": "p_out", "name": "OUT", "direction": "output", "order": 1 },
        { "id": "p_vdd", "name": "VDD", "direction": "passive", "order": 2 },
        { "id": "p_vss", "name": "VSS", "direction": "passive", "order": 3 }
      ],
      "content": { /* 现有 SchematicContent */ }
    }
  ],
  "testbenches": []
}
```

规则：

- `format` + `version` 必须存在；`version > 2` 拒绝导入，并保持当前工作不变。
- `sheets[].content` 沿用现有 `SchematicContent`（components / wires / connections / netLabels / notes / inductorCouplings / junctionAppearances 等）；不复制字段定义。
- `ports` 是 Sheet 的一等公民，不塞进 `content`。
- `globalNets` 至少包含 `"0"`；顺序不影响输出，输出时排序。示例中的 `VDD`/`VSS` 只是展示“可以声明为全局”，默认策略见第 9 节开放问题。
- `testbenches` 为 R5 预留，v2 允许为空数组；R4 不填。
- 视图状态（缩放、面板、图层可见性、右栏视图）**不进项目包**。

### 2.2 SheetBlock 实例

在现有 `ComponentInstance` 上增加可选字段：

```jsonc
{
  "id": "c_x1",
  "type": "sheetBlock",
  "ref": "X1",
  "x": 400,
  "y": 200,
  "rotation": 0,
  "mirrored": false,
  "values": {},
  "sheetTargetId": "s_amp"
}
```

- `type: "sheetBlock"` 是新组件类型，加入 catalog；`sheetTargetId` 指向目标 Sheet。
- 引脚不在实例里存，由目标 Sheet 的 `ports` 动态派生（类似现有 rectangle 的动态引脚）。
- 端口方向决定默认摆位：input 在左，output 在右，passive/inout 在上下均衡；v1 不允许手工改符号布局。
- 端口名变化只改标签；端口 id 稳定，已连线的端点不丢。
- 端口被删除时，SheetBlock 的对应引脚消失；父图中落在该引脚上的导线变成悬空线头，并在诊断里提示。

### 2.3 动态引脚解析（实现约束）

SheetBlock 的引脚来自另一个 Sheet，不能靠静态 catalog 直接得出。现有 `resolveComponentDef(instance)` 只接收实例，没有项目上下文；R4 必须解决这一点。

建议：

- 引入 **project-scoped resolver**：`resolveComponentDef(instance, project)`，由 document host / connectivity / renderer / netlist 在调用时传入当前项目。不要用全局可变单例，否则多标签页会串。
- 或者：在 SheetBlock 实例上缓存派生引脚（`values["sheet:pins"]`），但必须满足：
  - 目标端口变化、项目加载、导入后立即重建；
  - 缓存只是优化，权威仍是目标 Sheet 的 `ports`；
  - 网表/连通性不得读取过期缓存。
- 推荐前者；如果实现成本过高，再用缓存方案，并在规格里写清楚失效点。
- 端口 id 是连接身份；端口名只是显示/网表 formal。重命名不改 id，不重建导线。

## 3. 存储与迁移

### 3.1 localStorage

沿用 `at-` 前缀：

| 键 | 内容 |
|---|---|
| `at-schematic-workspace` | 项目列表：`id`、`name`、`topSheetId`、`updatedAt` |
| `at-schematic-project:<projectId>` | 完整项目包（所有 Sheet） |
| `at-schematic-view:<projectId>` | 每个 Sheet 的视图状态（缩放/平移/图层/右栏） |

- 旧键 `at-schematic:<id>` 继续可读；首次打开时包装成单 Sheet 项目，写新键，不删除旧键（一次性迁移标记）。
- 项目包可能超过 localStorage 配额；保存失败要显示错误并提供“导出备份”，不能静默丢数据。
- 导出仍是唯一可靠的备份方式；清除站点数据会删除本地项目。

### 3.2 导入

- 识别三种输入：
  1. v2 项目包：校验后作为新项目打开。
  2. 旧单图文档（没有 `format`/`version`，或 `version: 1`）：包装成 `{ topSheetId: "s1", sheets: [{ id:"s1", name:"sheet1", ports: [], content: doc }] }`。
  3. 其他/未来版本：拒绝，保持当前工作不变，错误写日志。
- 迁移函数必须是纯函数，并配 golden：旧 JSON → v2 → 导出 → 再导入，结构一致。
- 不认识的顶层字段：保留在项目包的 `extensions` 里（可选），避免第三方工具写回时丢数据；不认识的 Sheet 字段同理。v1 可以先不实现 `extensions`，但必须“拒绝未来版本”而不是猜。

## 4. 交互

### 4.1 Hierarchy 视图（左栏）

- 树结构：根 = 没有被任何 SheetBlock 引用的 Sheet；`TOP` 标记在 topSheetId 上。
- 行内容：实例位号 + 目标 Sheet 名；`×N` 表示同一 Sheet 被引用多次（点击展开所有 occurrence）。
- 过滤框：按 Sheet 名、实例位号搜索。
- 点击行：选中对应 SheetBlock（如果在当前图）或进入该 Sheet。
- 双击行 / 双击画布上的 SheetBlock：进入子图。
- 右键/菜单：`Enter`、`Show callers`、`Set as Top`、`Rename`、`Delete`、`Place`。
- `+`：新建 Sheet；输入名字和端口（可粘贴 `IN OUT VDD VSS` 自动猜方向），创建后可选择“立即放置到当前图”。
- 拖动行到画布：放置一个 SheetBlock（可选，R4 后做）。

### 4.2 导航

- 进入子图时显示面包屑：`top / amp / bias`；点击任一级返回。
- `↑` 或 `Shift+E`：返回调用者，并选中刚才的 SheetBlock。
- `Top` 按钮：回到 topSheetId，不改变编辑路径以外的状态。
- 导航本身不写文档、不进撤销历史；`fit` 与 `F` 行为一致。
- 每个项目标签页记住当前路径；重开页面恢复到最近路径；路径失效时回到最近的父级。

### 4.3 端口编辑

- 选中 Sheet（在 Hierarchy 中点 Sheet 行）→ 属性面板显示端口表：
  - 名称、方向（input/output/inout/passive）、顺序（上/下移）。
  - 新增、删除、重命名。
- 名称必须合法（网表标识符规则）；大小写不敏感唯一。
- 删除已连接端口：确认对话框说明“父图对应导线会变成线头”；确认后执行，一次撤销可恢复。
- 重命名端口：只改显示名，端口 id 不变；已连线不受影响；网表 formal 名更新。
- 端口顺序决定 subckt formal 顺序，也决定 SheetBlock 引脚的默认顺序。

### 4.4 Top 与循环

- `Set as Top`：写 `topSheetId`，一次撤销；不移动树行、不改变当前路径。
- 建 SheetBlock 时检查循环：不能直接或间接引用祖先；自引用拒绝。
- 检测在结构变更时做一次，结果缓存；渲染时不重复遍历。

### 4.5 重命名/删除

- Sheet 重命名：改 `name`，subckt 名随之变化；如果新名字与现有 Sheet 冲突，自动加 `_2` 并提示。
- Sheet 删除：
  - 被引用：拒绝，列出引用它的 SheetBlock。
  - 是 Top：拒绝，先 `Set as Top` 到别的 Sheet。
  - 未被引用且非 Top：确认后删除，一次撤销。
- 删除 SheetBlock：只删实例，不删目标 Sheet；父图导线变成线头。

## 5. 层级网表

### 5.1 规则

- 每个 Sheet 生成一个 subckt；名称 = Sheet 名做 ASCII 规范化，大小写不敏感唯一，冲突加 `_2`。
- 子电路依赖在前：先输出最底层，再输出调用者，最后输出 Top。
- formal 顺序 = `ports[].order`，再按名称稳定排序。
- SheetBlock 生成 subckt 调用：
  - SPICE：`X<ref> (nodes...) <sheetSubckt>`；ref 已以 `X` 开头则不再加。
  - Spectre：`<ref> (nodes...) <sheetSubckt>`；保留 ref。
- 全局网：`0` 与 `globalNets` 不加层级前缀；其余网络属于各自 subckt。
- **不做名字展平**：让仿真器处理层级。这样 SPICE 与 Spectre 的命名差异最小，也保留调试层级。
- 端口未绑定（父图实例的某个引脚没接）：error `UNBOUND_PORT`。
- 端口在子图内部没有连接：warning `PORT_UNCONNECTED`，不阻塞。
- 循环：error `CYCLE`；缺失目标：error `MISSING_SHEET`。

### 5.2 示例

```spice
.subckt amp IN OUT VDD VSS
XM1 OUT IN VSS VSS sky130_fd_pr__nfet_01v8 w=1u l=0.15u m=1 nf=1
R1 VDD OUT 1k
.ends amp

.subckt top IN OUT VDD VSS
X1 IN OUT VDD VSS amp
.ends top
```

- Top 也是一个 subckt；R5 的 TB deck 再实例化它。
- 结构网表仍然不加 `.include`、`.lib`、分析、`.end`（见 netlist-ir.md）。

## 6. 导出/导入

- 导出文件名：`<projectName>.atproj.json`；内容为 v2 项目包，缩进 2 空格，键顺序稳定。
- 导出不包含视图状态、日志、netlist 缓存。
- 导入必须全量校验后再替换当前项目；校验失败保持当前工作不变。
- 项目包内 Sheet 顺序固定为 `sheets` 数组顺序；不按名称排序，避免改变用户阅读顺序。
- 单 Sheet 也可以单独导出为旧格式吗？v1 不提供；只导出项目包。需要单图时用“复制为 JSON”另说。

## 7. 验收

- 三级嵌套（top → amp → bias）在 SPICE 与 Spectre 下各生成正确 subckt；端口顺序、实例名、全局网正确。
- 修改子图内部电路，父图网表相应变化；父图不需要重新放置。
- 项目导出 → 导入 → 结构、端口、网表一致；golden 通过。
- 旧单图 JSON 仍可导入，自动包装为单 Sheet；旧文件不丢字段。
- 循环、自引用、缺失 Sheet、未绑定端口、重复 Sheet 名均被拒绝并定位到对象。
- 重命名端口不破坏连线；删除已连接端口有确认，撤销可恢复。
- Hierarchy 树、面包屑、`↑`、`Top`、`Set as Top` 行为符合 4.2/4.4。
- 项目包超过配额时保存失败有明确提示，导出可用。

## 8. 非目标（R4）

- 不做跨子图复制粘贴。
- 不做子图实例的独立复制、替换定义、展平到父图。
- 不做子图参数/实例覆盖。
- 不做外部 subckt / SPICE 模型导入。
- 不做自定义 SheetBlock 符号布局；v1 自动摆位。
- 不做部分层级/局部展开；网表不展平。
- 不做 back-annotation（从网表改原理图）。
- 不做多个 Top 或 per-instance entry；一个项目一个 Top。

## 9. 开放问题

1. `globalNets` 默认是否包含 `VDD`/`VSS`，还是只含 `0`、由用户声明？
2. 端口方向是否需要 `power` 类型（用于 VDD/VSS 自动排到顶部/底部）？
3. Sheet 名与 subckt 名不一致时，是否允许单独设置 `netlistName`？（v1 建议不允许，保持可预测。）
4. 项目包是否需要 `extensions` 保留未知字段？v1 可以先拒绝未来版本。
5. 删除端口后，父图线头是保留为普通导线，还是自动删除？
