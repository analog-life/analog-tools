# 结构化网表与网表 IR

状态：Draft 0.1 · 2026-11-19
关联：[upgrade-plan.md](upgrade-plan.md)（R2）、[sheet-hierarchy.md](sheet-hierarchy.md)（R4）、[agent-transaction.md](agent-transaction.md)（R5）

## 1. 目的与边界

本规格定义 **结构网表（structural netlist）**：把原理图的电气事实转换成确定性的 SPICE 或 Spectre 文本。

结构网表只包含：

- 子电路定义（`.subckt` / `subckt`）
- 器件实例与连接
- 器件参数（`w`、`l`、`m`、`nf` 等）
- 端口顺序
- 层级项目显式声明的全局网络

结构网表**不包含**：

- `.include` / `.lib` / `include`
- 模型卡（`.model`）
- 分析语句（`.op`、`.ac`、`.tran` 等）
- 激励源之外的仿真设置
- `.end`
- 任何坐标、颜色、选择、视图、图层信息

SPICE 和 Spectre 共用一套 IR。结构网表独立于本地 PDK 安装路径，可用于比较、版本管理和 Agent 的电路结构审阅。

## 2. 流程

```
SchematicDocument / Project
        │
        ▼
  电气解析（connectivity / net resolution）
        │
        ▼
     Netlist IR（纯数据，确定）
        │
        ├── SpicePrinter  ──►  .sp / .cir 文本
        └── SpectrePrinter ──►  .scs 文本
```

IR 是唯一电气事实；printer 是纯函数，不读 DOM、不读文件、不查 PDK。

## 3. IR 形状

```ts
interface NetlistDesign {
  top: string;                    // 顶层 subckt 名
  subckts: NetlistSubckt[];       // 依赖在前，顶层在后
  diagnostics: NetlistDiagnostic[];
}

interface NetlistSubckt {
  name: string;                   // ASCII，大小写不敏感唯一
  ports: string[];                // 顺序固定，来自 SheetPort.order
  instances: NetlistInstance[];
}

interface NetlistInstance {
  ref: string;                    // 原理图位号，如 M1 / R2 / X3
  master: string;                 // 模型名或被调 subckt 名
  kind: "primitive" | "subckt";
  nodes: string[];                // 已解析的网络名，顺序由器件定义决定
  params: Record<string, string>; // 原样字符串，不在这里求值
}
```

IR 中不出现：`format`、`include`、`analysis`、`x/y`、`color`、`selected`、`view`。

`format` 是 printer 的入参，不是 IR 的字段；这样同一份 IR 可以分别打印两次做一致性测试。

## 4. 规范化规则

### 4.1 网络命名

优先级从高到低：

1. 子图端口名（R4；对应 subckt 的 formal port）。
2. 网络标签（Net Label）声明的名字。
3. 全局网络：`0`，以及项目声明的 `globalNets`（R4，默认 `["0"]`）。
4. 其余未命名网络按**稳定遍历**生成 `net0`、`net1`……：
   - 组件按文档顺序（`components` 数组顺序）；
   - 每个组件的引脚按 `ComponentDef.pins` 顺序；
   - 第一次遇到该网络时分配下一个编号。
   - 不按坐标排序，避免移动器件改变网表。

### 4.2 名称合法性

- 必须匹配 `[A-Za-z_][A-Za-z0-9_]*`；不允许空格、`+`、`-`、`.`、`:`、中文。
- 名称按大小写不敏感检查。仅大小写不同的独立网络会报告错误，并为后出现的网络分配网表占位名，防止两个独立网络合并。电路标签本身保留。
- 以数字开头的名字加前缀 `n_`，并在诊断里警告。
- 保留字（`0`、`gnd`、`vdd`、`vss`、`subckt`、`ends`、`model`、`include`、`lib`、`param`、`options`、`end`）按方言处理；与端口/实例名冲突时报错。

### 4.3 器件与网络

- 单端 `gnd` 符号：其引脚并入 `0`；不生成实例。
- 单端 `vdd` 符号：其引脚并入 `VDD`（或它的标签名）；不生成实例。
- `annotation`、`note`、图形（R3）不参与网表。
- 每个实例的每个引脚必须有网络；悬空引脚是错误 `FLOATING_PIN`。
- 只有一个引脚的网络：警告 `SINGLE_PIN_NET`；不阻塞（探针、测试点可能合法）。
- 位号在同一子图内必须唯一；跨子图可以重复，因为作用域不同。

### 4.4 数值

- 参数保留用户输入的字符串（`1k`、`0.15u`、`2.5p`），printer 原样输出；不在 IR 里做数值归一化。
- 必须用现有 `engineeringUnits` 做可解析性校验；解析失败是错误 `INVALID_VALUE`。
- sky130 的 `w`/`l` 必须带单位或为纯数字（按米解释）；缺失是错误。
- `m`、`nf` 缺省为 `1`；如果用户显式写空字符串，按缺省处理并在诊断里提示。

## 5. 器件支持矩阵（v1）

| 原理图类型 | SPICE | Spectre | sky130 | 说明 |
|---|---|---|---|---|
| R / C / L | 是 | 是 | 理想 | 用原生 `R/C/L`；物理模型后续 |
| 独立电压源 V | 是 | 是 | 理想 | DC / SIN / PULSE / EXP / PWL；见 5.2 |
| 独立电流源 I | 是 | 是 | 理想 | 同上 |
| NMOS / PMOS | 是 | 是 | 是 | 4 端；`w/l/m/nf`；B 必须连接 |
| 二极管 D | 后续 | 后续 | 后续 | v1 报 `UNSUPPORTED_DEVICE` |
| NPN / PNP | 后续 | 后续 | 后续 | v1 报 `UNSUPPORTED_DEVICE` |
| 开关 / SPNT / 传输门 | 否 | 否 | 否 | 诊断 |
| 逻辑门 / DFF / 缓冲器 | 否 | 否 | 否 | 诊断；不映射标准单元 |
| ADC / DAC / 比较器 / 行为块 | 否 | 否 | 否 | 诊断 |
| iprobe | 是 | 是 | 理想 0V 源 | 用于测电流 |
| diffProbe | 否 | 否 | 否 | 诊断；后续用 `save` 表达式 |
| gnd / vdd 符号 | 是 | 是 | 全局 | 不生成实例 |

### 5.1 实例名前缀

- SPICE：sky130 MOS 是 subckt 调用，实例名必须是 `X` 开头。UI 显示 `M1`，SPICE 输出 `XM1`。映射规则：若 ref 已是 `X` 开头则保留，否则加 `X`。
- SPICE：普通 `R/C/L/V/I/D` 保留原前缀；如果用户把电阻命名成 `M1`，报 `INVALID_REF_PREFIX`，不自动改。
- Spectre：subckt 调用不要求 `X`，保留 `M1`；原生器件保留原前缀。
- 这处差异必须在 UI 的网表预览里可见，不能只在文档里说明。

### 5.2 源波形

| 变体 | SPICE | Spectre |
|---|---|---|
| dc | `DC 1` | `dc=1` |
| sine | `SIN(vo va freq td theta)` | `sine dc=vo ampl=va freq=freq` |
| pulse | `PULSE(v1 v2 td tr tf pw per)` | `pulse val0=v1 val1=v2 delay=td rise=tr fall=tf width=pw period=per` |
| exp | `EXP(v1 v2 td1 tau1 td2 tau2)` | `exp val0=...` 按字段映射 |
| pwl | `PWL(t1 v1 t2 v2 ...)` | `pwl (t1 v1 t2 v2 ...)` |
| noise / bit / ramp | 诊断 `UNSUPPORTED_SOURCE` | 同左 |

字段名以现有 `voltageSourceModel` 的 `vsource:*` 为准；printer 只做语法映射，不做物理推导。

### 5.3 MOS 参数键

MOS 的尺寸参数存放在 `ComponentInstance.values`，使用固定键名：

| 键 | 含义 | 默认 | 必填（sky130） |
|---|---|---|---|
| `mos:w` | 沟道宽度 | 缺省生成符号参数，默认值 `1u` | 可留空 |
| `mos:l` | 沟道长度 | 缺省生成符号参数，默认值 `0.15u` | 可留空 |
| `mos:m` | 并联倍数 | `1` | 否 |
| `mos:nf` | 指状数 | `1` | 否 |

- 属性面板在 MOS 选中时显示这四项；单位按工程值输入（`1u`、`0.15u`）。
- 导出时把键映射为 profile 的参数名（sky130：`w/l/m/nf`），不直接把 `mos:w` 写进网表。
- 3 端 MOS 变体（没有 B 引脚）的体端使用源极网络，并记录 `BULK_DEFAULTED` 警告。
- 4 端变体的 B 悬空时分配占位网络，记录 `BULK_UNCONNECTED` 错误，继续生成网表。
- 符号视图（`variantId`）只影响画法，不影响网表；网表按引脚角色取值，不按变体名。
- 输出规则：`w`/`l` 必须输出；`m`/`nf` 仅在用户显式设置且不是默认 `1` 时输出，避免每行都带默认值。

## 6. sky130 profile

v1 只交付 `sky130` 一个 process；`abstract`、`ihp-sg13g2`、`gf180mcu` 只留接口，不实现。

```jsonc
{
  "id": "sky130",
  "label": "SkyWater SKY130",
  "devices": {
    "nmos": {
      "master": "sky130_fd_pr__nfet_01v8",
      "terminals": ["d", "g", "s", "b"],
      "params": { "w": "w", "l": "l", "m": "m", "nf": "nf" },
      "required": ["w", "l"]
    },
    "pmos": {
      "master": "sky130_fd_pr__pfet_01v8",
      "terminals": ["d", "g", "s", "b"],
      "params": { "w": "w", "l": "l", "m": "m", "nf": "nf" },
      "required": ["w", "l"]
    }
  }
}
```

说明：

- 模型名由工艺预设提供，也可在单个器件的属性中覆盖。预设切换只更新继承工艺默认值的器件。自定义工艺允许直接输入模型名。编辑器不搜索本机 PDK。
- B 端映射沿用第 5.3 节的 MOS 体端规则。
- R/C/L 默认按原生器件输出，显式选择模型后按对应的模型实例输出。

## 7. Printer 规则

### 7.1 通用

- printer 是纯函数：`print(design, options) => string`；不读文件、不查 PDK、不访问 DOM。
- 输出使用 `\n`；结尾保留一个换行；不写时间戳、用户名、绝对路径。
- 子电路依赖在前；同一层内按文档顺序；不排序实例名（排序会改变用户阅读顺序）。
- 输出前校验标识符。生成流程同时返回可输出的结构网表和诊断。无法输出的实例由诊断标明，有可用回退的实例按相应规则输出。
- 注释只使用 ASCII，避免编码问题。

### 7.2 SPICE

```spice
* analog-tools structural netlist
.subckt amp IN OUT VDD VSS
XM1 OUT IN VSS VSS sky130_fd_pr__nfet_01v8 w=1u l=0.15u m=1 nf=1
R1 VDD OUT 1k
.ends amp
```

- 第一行是标题注释；没有 `.end`。
- 子电路调用：`X<ref> (nodes...) master params`；节点用空格分隔，不加括号。
- 原生器件：`R<ref> n1 n2 value`、`C...`、`L...`、`V...`、`I...`。
- 参数 `key=value`，按 profile 的参数顺序输出。
- 长行用 `+` 续行；每行不超过 120 字符（可配置）。

### 7.3 Spectre

```spectre
// analog-tools structural netlist
simulator lang=spectre
subckt amp (IN OUT VDD VSS)
M1 (OUT IN VSS VSS) sky130_fd_pr__nfet_01v8 w=1u l=0.15u m=1 nf=1
R1 (VDD OUT) resistor r=1k
ends amp
```

- 第一行注释；`simulator lang=spectre`；没有 `include`、分析、`end`。
- 子电路调用：`<ref> (nodes) master params`；节点带括号、逗号或空格分隔（按 Spectre 语法用空格）。
- 原生器件：`R1 (n1 n2) resistor r=1k`、`C1 (...) capacitor c=1p`、`L1 (...) inductor l=1n`、`V1 (...) vsource dc=1`、`I1 (...) isource dc=1m`。
- 参数 `key=value`；数值保留原字符串。

## 8. 诊断

```ts
interface NetlistDiagnostic {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  sheetId: string;
  objectId?: string;
  pinId?: string;
  netName?: string;
  opIndex?: number; // Agent transaction 用
}
```

| 代码 | 级别 | 含义 |
|---|---|---|
| `FLOATING_PIN` | error | 引脚没有网络 |
| `SINGLE_PIN_NET` | warning | 只有一个引脚的网络 |
| `DUPLICATE_REF` | error | 同一子图内位号重复 |
| `INVALID_REF_PREFIX` | error | 位号前缀与器件类别不符 |
| `UNSUPPORTED_DEVICE` | error | v1 不支持该器件 |
| `UNSUPPORTED_SOURCE` | error | 源波形不支持 |
| `MISSING_MODEL` | error | 没有可用的 master |
| `INVALID_MODEL` | error | 模型名不是合法的标识符 |
| `MISSING_PARAM` | error | 缺少无法使用默认值的必填参数 |
| `DEFAULT_PARAM` | warning | 参数留空，使用带默认值的符号参数 |
| `INVALID_VALUE` | error | 数值无法解析 |
| `BULK_DEFAULTED` | warning | 三端 MOS 体端使用源极网络 |
| `BULK_UNCONNECTED` | error | 显式体端未连接，使用占位网络 |
| `NAME_COLLISION` | error | 网络/端口/实例名冲突 |
| `GLOBAL_CONFLICT` | error | 全局网与端口/标签冲突 |
| `NO_TOP_SHEET` | error | 没有顶层子图（R4） |
| `CYCLE` | error | 子图循环引用（R4） |
| `MISSING_SHEET` | error | 子图实例指向不存在的子图（R4） |
| `UNBOUND_PORT` | error | 子图端口未连接（R4） |

规则：

- R2 的 error 和 warning 都不阻塞结构网表生成、复制或下载。面板同时显示生成结果和诊断。
- warning 必须在面板和日志里可见。
- 诊断必须带对象 id，用户点击后能选中并居中。
- 诊断消息模板可翻译；代码不翻译。

## 9. 右栏 Netlist 视图

R1 只做壳，R2 填满：

- 顶部提供 `SPICE / Spectre` 格式切换、`Copy` 和 `Download`。工艺设置位于 Options，支持 SKY130、GF180MCU、IHP SG13G2 和自定义。
- 状态：无生成结果时显示 `Netlist is not ready.`，并禁用复制和下载。有结果且存在错误时显示 `Generated · N error(s)`，保留复制和下载入口。警告显示在 `Ready` 状态中。
- 正文：等宽字体、行号、横向滚动；SPICE 标题行和 Spectre 语言行可见。
- 网表和诊断上下等分剩余高度，分别滚动。点击器件诊断可选中并居中定位该器件。
- 刷新：浏览器将连续的文档更新合并，在 250 ms 后重算。
- 工艺保存到原理图 JSON 的 `schematic.netlistProcess`，省略时采用 SKY130。NMOS、PMOS、NPN、PNP、R、C、L 的单器件模型保存到该器件的 `values["netlist:model"]`。
- v1 只读，不允许在面板里改网表；不做 SPICE/Spectre 导入。

## 10. 测试与验收

- 单元测试：规范化命名、引脚顺序、实例前缀、参数校验、诊断。
- Golden：RC 低通、MOS 共源、差分对；SPICE 与 Spectre 各一份；含 sky130 MOS。
- 确定性：同一文档运行两次、重载后再运行，输出逐字节一致。
- 负例：悬空引脚、重复位号、缺 W/L、显式 B 未连接、逻辑门、未知源波形。验证网表仍可生成和导出，并核对实例省略、参数回退及诊断定位。
- 不受显示影响：缩放、选择、图层、字体、跨线样式变化后网表不变。
- 语法：检查 SPICE 和 Spectre 的结构网表是否符合各自方言。R2 验收可使用离线语法检查和 golden 对拍，无需安装仿真器、加载目标 PDK 或运行仿真。
- 性能：1000 个器件的文档，网表生成 < 500ms（开发机），UI 不卡顿。

## 11. 开放问题

1. `vdd` 符号的默认网络名是 `VDD` 还是取标签？多个 `vdd` 是否自动并网？
2. sky130 的显式 B 端是否需要提供可选的默认接地设置？当前悬空时分配占位网络并报告错误。
3. Spectre 的 subckt 实例名是否保留 `M1`，还是也加 `X`？当前按“保留原 ref”。
4. 物理 R/C 映射是否进入 R2.5，还是等 v2？
