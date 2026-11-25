# 子图层级与项目包 schema v2

适用版本为 1.0.1-beta。项目包使用 schema v2；产品版本与项目包版本分别维护。
关联：[upgrade-plan.md](upgrade-plan.md)（R4）、[netlist-ir.md](netlist-ir.md)

## 1. 目的与术语

本规格定义“子图（sheet）层级”：一张原理图可以放置另一张原理图的符号，形成可复用的层级设计，并导出为层级 subckt 网表。

| 术语 | 含义 |
|---|---|
| Project | 一个项目，包含若干 Sheet 和一个 Top，对应一个 `.atproj.json` |
| Sheet | 子图，等于现在的一份原理图文档 + 一组端口 |
| Port | 通过 Pin 工具放置的正式端口，有稳定 ID、名称、类型、Symbol 所在边和网表顺序 |
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
        { "id": "p_in",  "name": "IN",  "type": "input",  "direction": "left",   "order": 0, "slot": 0 },
        { "id": "p_out", "name": "OUT", "type": "output", "direction": "right",  "order": 1, "slot": 0 },
        { "id": "p_vdd", "name": "VDD", "type": "supply", "direction": "top",    "order": 2, "slot": 0 },
        { "id": "p_vss", "name": "VSS", "type": "ground", "direction": "bottom", "order": 3, "slot": 0 }
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
- 每个 Pin 在 `content.components` 中有一项 `sheetPort`。项目包中的 `ports` 是从这些组件导出的端口表，导入时校验两者一致。
- `type` 表示端口类型，`direction` 表示 Symbol 所在边，`slot` 决定在该边的位置，`order` 表示网表位置。新 Pin 按创建顺序分配 `order`，后续可在 Hierarchy 中调整。
- `globalNets` 默认只含 `"0"`。在 Hierarchy 的全局网络设置中可添加 `VDD`、`VSS` 等名称。
- 当前 v2 项目包的校验要求 `testbenches` 固定为空数组。
- 项目包保留 `SchematicContent` 中的图层和逐对象显隐。缩放、平移和面板状态保存在浏览器。

### 2.2 SheetBlock 实例

SheetBlock 沿用 `ComponentInstance` 的数据结构，目标和派生引脚保存在 `values` 中。

```jsonc
{
  "id": "c_x1",
  "type": "sheetBlock",
  "ref": "X1",
  "x": 400,
  "y": 200,
  "rotation": 0,
  "mirrored": false,
  "values": {
    "sheet:target": "s_amp",
    "sheet:name": "amp",
    "sheet:ports": "[...]"
  }
}
```

- `type: "sheetBlock"` 是新组件类型。`values["sheet:target"]` 指向目标 Sheet。
- 引脚与矩形 Symbol 由目标 Sheet 的 `ports` 动态派生。每个引脚按 `direction` 排布，框内显示名称，短引线末端用方框标记电气接线点。
- 端口改名同步更新子图、父图 Symbol 和网表中的名称。端口 ID 和接线点保持稳定。
- 端口换边或删除后，父图只更新 Symbol、连接解析和诊断。父图导线的形状、顶点和端点坐标保持原样。原线头与对应引脚接线点对不上时，在原处显示为悬空线头，由设计者重新接线。

### 2.3 动态引脚解析（实现约束）

SheetBlock 缓存目标子图的名称和端口表，供连通性、画布和图像导出使用。目标子图的 Pin 定义是权威来源。端口编辑、项目导入和项目加载会同步实例缓存。
- 父图连接需要匹配稳定端口 ID 和实际接线位置。换边或删除后，原连接可失效。坐标重合本身不足以让原线头自动绑定到其他端口。

## 3. 存储与迁移

### 3.1 localStorage

- 项目和导航路径保存在现有工作区的标签页快照里。单图在使用 Hierarchy 或导出项目包时可包装为单 Sheet 项目。每次导入项目都会使用独立的标签页快照。
- 项目包可能超过 localStorage 配额；保存失败要显示错误并提供“导出备份”，不能静默丢数据。
- 导出仍是唯一可靠的备份方式；清除站点数据会删除本地项目。

### 3.2 导入

- 导入或粘贴当前单图 JSON 可打开独立的原理图标签页。导入 v2 项目包时，校验后在新标签页打开项目的 Top。
- 不支持的项目版本和校验错误写入日志，保持当前工作不变。

## 4. 交互

### 4.1 Hierarchy 视图（右栏）

- 右栏标签顺序为 `Hierarchy / Analysis / Netlist`。Hierarchy 集中展示子图、引用、导航路径和端口列表。
- 每个 Sheet 可展开，展示直接实例和端口。`TOP` 标记在入口子图上。
- 子图操作下方依次显示可折叠的「包含的子图」「端口列表」和「查看引用」。实例行显示位号和目标 Sheet 名。通过「查看引用」可定位到对应父图的实例。
- 过滤框：按 Sheet 名、实例位号搜索。
- 点击行：选中对应 SheetBlock（如果在当前图）或进入该 Sheet。
- 双击行 / 双击画布上的 SheetBlock：进入子图。
- 子图操作包括 `Enter`、`Show callers`、`Set as Top`、`Rename`、`Delete`、`Place`。
- 使用「新建子图」创建 Sheet，随后通过 Pin 工具放置正式端口。
- Library 增加 `Hierarchy` 库。当前项目中的每张 Sheet 自动提供 Symbol，可在其他 Sheet 中放置。违反循环引用规则的条目禁用放置。
- 拖动行到画布：放置一个 SheetBlock（可选，R4 后做）。

### 4.2 导航

- 「当前层次」以面包屑显示路径，空间不足时优先显示靠近当前子图的部分。点击路径中的子图可返回该层。
- 按 `E` 后点选实例进入子图。按 `Ctrl+E` 或点击「返回上一层」回到调用者，并选中刚才的 SheetBlock。
- 点击「返回顶层」回到 `topSheetId` 对应的入口图纸。
- 导航路径保存在浏览器，不进入电路编辑的撤销历史。
- 每个项目标签页记住当前路径；重开页面恢复到最近路径；路径失效时回到最近的父级。

### 4.3 Pin 放置和编辑

- 工具栏在 Net Label 后提供 Pin，快捷键为 `P`。打开初始属性窗口，确认后在子图画布上放置。后续在左栏 Properties 编辑所选 Pin。
- 属性包括 `Pin Name`、`Type` 和 `Direction`。类型支持 Supply、Ground、Input、Output、InOut、Passive。Direction 支持上、下、左、右，仅控制生成 Symbol 的所在边。
- 子图中的 Input、Output 用箭头区分，其余四种类型使用六边形。父图 Symbol 统一使用方框接线点。
- Pin Name 支持标量名称、单个位（`OUT<3>`）和总线范围（`OUT<7:0>`）。同一张 Sheet 内的正式端口名和总线位不得完全相同，`OUT` 与 `out` 是两个端口。
- Hierarchy 端口列表提供上移、下移操作以显式调整网表顺序。换边只改 Symbol 排布，保留网表端口位置。
- 换边与删除保留父图导线原样，失去匹配接线点的线头留在原处，供设计者重新接线。撤销恢复原端口定义，再重新解析连接。

### 4.4 Top 与循环

- `Set as Top`：写 `topSheetId`，一次撤销；不移动树行、不改变当前路径。
- 建 SheetBlock 时检查循环：不能直接或间接引用祖先；自引用拒绝。
- 选择可放置的子图时检查引用路径。项目结构发生变化及导入时，检查全部子图的依赖关系。

### 4.5 重命名/删除

- Sheet 重命名会更新 subckt 名。遇到重名时提示输入另一名称。
- Sheet 删除：
  - 被引用：拒绝，列出引用它的 SheetBlock。
  - 是 Top：拒绝，先 `Set as Top` 到别的 Sheet。
  - 未被引用且非 Top：确认后删除，一次撤销。
- 删除 SheetBlock：只删实例，不删目标 Sheet；父图导线变成线头。

## 5. 层级网表

### 5.1 规则

- 每个 Sheet 生成一个 subckt。子图名按标量标识符校验，大小写不敏感唯一。
- 有依赖关系时先输出被调用的子图，再输出调用者。
- subckt 定义与实例调用都按 `ports[].order` 排列。网表顺序由端口创建顺序及后续显式排序决定，与名称、类型、所在边无关。
- 总线在自身范围内按书写顺序展开，例如 `OUT<7:0>` 导出为 `OUT_7 … OUT_0`。`OUT<0:7>` 从第 0 位开始。父图的连线按本地范围与目标端口的位置对应，带位标记的名称与已有标量名冲突时分配唯一名称。
- SheetBlock 生成 subckt 调用：
  - SPICE：`X<ref> nodes... <sheetSubckt>`；ref 已以 `X` 开头则直接使用。
  - Spectre：`<ref> (nodes...) <sheetSubckt>`；保留 ref。
- 全局网由项目规则统一决定。`0` 与 `globalNets` 不加层级前缀，其余网络属于各自 subckt。Supply 和 Ground 类型本身不会将所在网络声明为项目全局网。
- **不做名字展平**：让仿真器处理层级。这样 SPICE 与 Spectre 的命名差异最小，也保留调试层级。
- 端口未绑定（父图实例的某个引脚没接）：error `UNBOUND_PORT`。
- 端口在子图内部没有连接：warning `PORT_UNCONNECTED`，不阻塞。
- 循环：error `CYCLE`；缺失目标：error `MISSING_SHEET`。
- 直接相连的端子和导线位宽不符时输出 `BUS_WIDTH_MISMATCH`，并为失配端子保留独立的网表节点。

#### 总线与 Net Label

- 同一张 Sheet 内相同名称的有效 Net Label 会连接各自的导线。名称区分大小写，子图之间由实例端口建立连接。
- SPICE 导出为仅大小写不同的节点分配不同的节点名。Spectre 导出保留大小写。
- 在导线上放置 `OUT<7:0>` 标签，或连接到同宽的总线端口，可形成粗线显示的总线。总线范围最多 256 位。可通过 `OUT<4:2>` 等标签取子范围。
- 将单独的导线标为 `OUT<3>`，它会接入 `OUT<7:0>` 的第 3 位。两个分离的范围有重叠时，相同位号相连。

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

- Top 以子电路定义输出。
- 结构网表仍然不加 `.include`、`.lib`、分析、`.end`（见 netlist-ir.md）。

## 6. 导出/导入

- 导出文件名：`<projectName>.atproj.json`；内容为 v2 项目包，缩进 2 空格，键顺序稳定。
- 导出不包含视图状态、日志、netlist 缓存。
- 导入或粘贴前校验整个项目包，成功后在新标签页打开；校验失败保持当前工作不变。
- 项目包内 Sheet 顺序固定为 `sheets` 数组顺序；不按名称排序，避免改变用户阅读顺序。
- 通过「项目 JSON」导出包含全部子图的项目包。仍可通过 SVG 或 PNG 导出当前子图的图像。
- 当前图引用其他子图时，选择「原理图 JSON」也会导出项目包，以便保留被引用的子图。

## 7. 验收

- 三级嵌套（top → amp → bias）在 SPICE 与 Spectre 下各生成正确 subckt；端口顺序、实例名、全局网正确。
- 修改子图内部电路，父图网表相应变化；父图不需要重新放置。
- 项目导出 → 导入 → 结构、端口、网表一致；golden 通过。
- 当前格式的单图 JSON 可打开独立标签页，使用层次功能或导出项目包时可包装为单 Sheet。
- 循环、自引用、缺失 Sheet 和重复 Sheet 名均被拒绝并定位到对象。未绑定端口报告可定位的诊断，父图可继续编辑。
- 改名后，子图、父图 Symbol 和网表的名称同步更新，端口 ID 和接线点一致。
- 换边及删除端口前后，父图导线的标识、形状、顶点和端点坐标一致。失去匹配接线点的线头悬空且可继续编辑；换边后的网表端口顺序一致。撤销后按原端口定义恢复有效连接。
- 通过 `P` 放置标量 Pin、通过 Properties 编辑。Library 的 Hierarchy 库可放置自动生成的 Symbol，方框中心可被导线吸附。
- Hierarchy 树、面包屑、`↑`、`Top`、`Set as Top` 行为符合 4.2/4.4。
- 项目包超过配额时保存失败有明确提示，导出可用。

## 8. 非目标（R4）

- 不做跨子图复制粘贴。
- 复制子图符号会创建同一子图的新实例。替换定义和展平到父图仍在 Beta 范围之外。
- 不做子图参数/实例覆盖。
- 不做外部 subckt / SPICE 模型导入。
- 不做自定义 SheetBlock 符号布局；v1 自动摆位。
- 不做部分层级/局部展开；网表不展平。
- 不做 back-annotation（从网表改原理图）。
- 不做多个 Top 或 per-instance entry；一个项目一个 Top。

## 9. 开放问题

1. 后续是否允许单独设置子图的 `netlistName`。
2. 后续是否需要通过 `extensions` 保存项目包的未知字段。
