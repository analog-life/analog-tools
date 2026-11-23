# R5 本机 Agent 协作协议

关联 [升级计划](upgrade-plan.md) 与 [图层级协议](sheet-hierarchy.md)。

## 开始协作

在 `source/schematic-editor/` 用 Node.js 22.13 或更高版本运行 `npm run agent:connector`。通过 HTTPS 或 localhost 打开编辑器，依次选择 **AI → 交给 AI 修改 → 复制文本**，将提示词粘贴给本机 Agent。浏览器询问本地网络访问时需允许连接。连接器只监听 `127.0.0.1:43765`，无需部署到网站。

提示词包含站点地址、工程 ID、图页 ID、一次性配对码和协议用法。码在两分钟内有效，配对后即作废。令牌自配对成功起最长有效 2 小时，仅用于当前浏览器会话。配对后顶栏变绿，等待、暂停、离线状态用琥珀色表示。暂停时保留会话，恢复后 Agent 需要重新读取快照。取消连接、收回编辑权、切换工程和会话过期均会使令牌失效。

浏览器生成配对码并校验令牌、修订号和事务。连接器在本机内存中逐条转交请求与回执，工程数据交由页面继续持有与保存。配对提示词不含电路数据。连接器不读浏览器存储或文件，不写日志或磁盘中的工程副本。Agent 只应通过下述接口在本机处理工程数据。

## 请求与回应

API 端点为 `http://127.0.0.1:43765/agent`。每个请求是一个 `Content-Type: application/json` 的 POST。浏览器按已登记的页面来源从单独的转发接口取消息。Agent API 供本机进程调用。

| method | 请求字段 | 成功响应 |
|---|---|---|
| `pair` | `code` | `ok`、`token`、`expiresAt` |
| `snapshot` | `token` | 修订号、当前图页、工程与图页标识、器件和引脚、网络、导线、标签、端口、器件目录及支持的操作 |
| `transact` | `token`、`transaction` | `requestId`、`applied`、`dryRun`、新修订号、按图页的对象差异和网表诊断 |
| `disconnect` | `token` | `ok`、`disconnected` |

事务请求示例

```json
{
  "method": "transact",
  "token": "<session token>",
  "transaction": {
    "apiVersion": "1.0",
    "requestId": "resistor-preview-1",
    "baseRevision": 12,
    "dryRun": true,
    "operations": [
      {
        "op": "add-component",
        "sheetId": "top",
        "component": {
          "type": "resistor",
          "ref": "R1",
          "x": 300,
          "y": 200,
          "values": { "main": "1k" }
        }
      }
    ]
  }
}
```

## 事务与修订号

- 每次写入前调用 `snapshot`，把当次读到的修订号带回 `baseRevision`。人工编辑、AI 写入、撤销和重做均推进修订号。只要旧修订号与当前不符，就返回 `REVISION_CONFLICT` 与最新修订号，Agent 应重新读取和规划。
- 人在布线、放置、拖动或编辑属性时，Agent 收到 `HUMAN_BUSY`。页面在同一同步过程内校验、计算差异并提交，事件循环在事务完成后才处理下一笔人工输入。
- 每次提交 1–500 个动作。校验使用现有的器件定义、接线和图层级规则，任一动作失败时返回 `opIndex`，整批不写入。成功修改使用原理图工程的撤销历史，界面标记 AI 来源。
- `dryRun: true` 会返回差异和诊断。正式提交使用新的请求号。不确定是否成功时，可以按原样重试原请求，同一会话会返回原回执，避免重复应用。请求号不能重用于不同内容。

## 语义动作

| 动作 | 作用 |
|---|---|
| `add-component` | 放置目录器件，支持指定变体、朝向和参数 |
| `add-wire` | 通过网格坐标画导线，可选总线样式 |
| `add-net-label` | 将严格区分大小写的网络名称绑定到导线位置 |
| `set-values` | 修改现有器件支持的属性 |
| `add-sheet` | 新建子图 |
| `add-sheet-instance` | 在父图放置子图符号，校验循环引用 |
| `set-port` | 放置或修改端口名称、类型、所在边及网表顺序 |
| `remove-port` | 删除端口，父图保留原有线头 |

具体字段随 `snapshot.actions` 返回。坐标以各图页自己的 10px 网格为准，引脚绝对坐标由快照提供。器件、网络和子图连接均使用编辑器已有模型。

## 验证

`npm run test:r5` 启动本机连接器和 Chromium，覆盖配对、剪贴板、快照拓扑、试运行、事务失败回滚、原子撤销、人工与 AI 修订冲突、暂停恢复、收回编辑权与配对码过期。
