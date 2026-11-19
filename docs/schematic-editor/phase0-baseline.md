# Phase 0 构建/发布基线

状态：Blocked（站点产物基线已记录，源码构建未执行）· 2026-11-19

关联：[upgrade-plan.md](upgrade-plan.md)（6.2 构建与发布）

## 1. 结论

站点产物（`app/schematic/`）的基线已记录；源码构建未能开始：当前工作区没有可用的 `npm`，且出站 HTTPS 不可用，`npm ci` 无法执行。需要在一台有 `npm` 与网络（或已备好离线依赖）的机器上完成首次构建，并把结果回填到本文件。

## 2. 环境

| 项 | 值 |
|---|---|
| 工作区 | `D:\AI程序设计\analog-tools` |
| 主仓库 | `bb4ab0d`（`main`，未配置 remote） |
| 源码仓库 | `e19ca1f`（`main`，跟踪 `upstream/main`，工作区干净） |
| 操作系统 | Windows |
| Node | `v24.21.0`（DSH 运行时自带，仅 `node.exe`，未带 `npm`） |
| npm | 不可用：PATH 无、DSH 运行时无、`Program Files`/`AppData` 未找到 |
| pnpm | 可用（DSH 运行时自带） |
| pnpm store | 空（`D:\AI程序设计\analog-tools\.pnpm-store` 不存在） |
| npm cache | `C:\Users\hydro\AppData\Local\npm-cache` 仅 7 个文件，无包内容 |
| 网络 | DNS 正常；`registry.npmjs.org:443`、`github.com:443` TCP 可连；TLS 握手失败（`SEC_E_NO_CREDENTIALS` / 连接被重置）；无本地代理端口（7890/1080/8080 等均未监听） |

## 3. 站点产物基线（构建前）

清单指纹：`2F2C9C9619197E3E6ED383A26E55E0A931C717FE8B6DD0103F34A31D3C1AE1E3`

计算方式：`app/schematic/` 下除 `vendor/` 外的全部文件，按相对路径排序，逐行拼接 `path<TAB>size<TAB>sha256` 后取 SHA-256。`vendor/` 是本地化的 MathJax，本次升级不触碰。

| 文件 | 字节 | SHA-256（前 16 位） |
|---|---:|---|
| `assets/analysis.worker-DD1etQJA.js` | 514783 | `BA635AC738E7E7BF` |
| `assets/formulaSourceEditor-B80ZSq4o.js` | 298643 | `CFB32EA083B9C682` |
| `assets/index-D2LH0-RX.js` | 1586433 | `5B6D09A87079B4D9` |
| `assets/index-Dycg_2g4.css` | 42061 | `CD085C1EDE6FDBA1` |
| `index.html` | 6001 | `EF88888318086A27` |
| `LICENSE` | 1068 | `962BD57BDB54D481` |
| `manual.html` | 21512 | `C198451F2BC5AC06` |
| `schematic.css` | 27228 | `60B7F148EEC7D75A` |
| `schematic-i18n.js` | 24523 | `772DC9F113F68C2C` |
| `schematic-ui.js` | 1832 | `794670C502D4DE8A` |
| `THIRD_PARTY_LICENSES.txt` | 254972 | `DBDDF4D904C9A9EF` |

`app/schematic/assets/` 共 4 个文件，2.3 MB。

## 4. 源码基线

| 项 | 值 |
|---|---|
| 版本 | 源码 README 记录 `0.1.1`；站点登记 `0.1.0`（重建前需对拍差异） |
| `package-lock.json` SHA-256 | `767DF37066B291844CA0B1E70B565A7E8353BA19FB55F779612D97604895A947` |
| 测试文件 | 153 个（`packages/schematic/tests`） |
| 源文件 | 212 个（`packages/schematic/src` 的 `.ts`/`.css`） |
| `node_modules` | 不存在 |
| `packages/schematic/dist` | 不存在 |
| `apps/web/dist` | 不存在 |

## 5. 已尝试的步骤

1. `npm ci`：`npm` 不在 PATH，DSH 运行时也只有 `node.exe`。
2. 查找 npm：`C:\Program Files\nodejs`、`C:\Program Files (x86)\nodejs`、`%APPDATA%\npm`、DSH 运行时、`AppData\Local\Programs` 均无 `npm-cli.js` / `npm.cmd`。
3. 离线安装：pnpm store 为空，npm cache 无包内容，无法 offline install。
4. 网络：`Test-NetConnection` 对 `registry.npmjs.org:443` 与 `github.com:443` 返回可达，但 `curl`/`Invoke-WebRequest`/`git ls-remote` 的 TLS 握手均失败；未发现本地代理。

## 6. 下一步

在具备 `npm` 与网络（或离线依赖）的机器上执行，并把输出回填到本文件：

```powershell
cd source/schematic-editor
npm ci
npm run typecheck
npm test
npm run build:lib
npm run build:web
```

随后：

1. 记录 `apps/web/dist/assets` 的文件清单与 SHA-256。
2. 与第 3 节的站点产物对比，确认上游 `0.1.0 → 0.1.1` 的差异范围。
3. 更新 `app/schematic/index.html` 的 hash 引用，同步 `assets/`。
4. 跑 375px / 768px / 1080px、深色模式、SVG/PNG 导出与 JSON 往返冒烟。
5. 把“构建后清单指纹”与测试结果补进本文件。

## 7. 待决

- 构建环境：本机安装 Node + npm 并恢复网络，或在另一台机器构建后把 `dist` 带回来。
- 主仓库未配置 remote，文档与基线的推送目标待确认。
