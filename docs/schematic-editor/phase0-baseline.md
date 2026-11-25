# Phase 0 构建/发布基线（历史记录）

状态：Done（基于源码 0.1.3 完成构建、单测、浏览器冒烟）· 2026-11-19

本文记录升级前的环境和测量值。当前 1.0.1-beta 发布信息见 [交接文档](handoff.md)，当前发布步骤见 [升级记录](upgrade-plan.md#62-构建与发布)。

关联：[upgrade-plan.md](upgrade-plan.md)（6.2 构建与发布）

## 1. 结论

Phase 0 将源码从 0.1.1 更新到 0.1.3（`ddbfb69`），并完成首次构建、类型检查、单元测试和浏览器冒烟。测量时站点 `app/schematic/` 仍使用 0.1.1 资源。

当时 0.1.3 构建产物与 0.1.1 站点产物的差异为主 JS +64,312 B、公式编辑器 −4,418 B、编辑器 CSS +316 B、analysis worker −2 B。差异来自 0.1.2/0.1.3 的上游改动。

## 2. 环境

| 项 | 值 |
|---|---|
| 工作区 | `D:\AI程序设计\analog-tools` |
| 主仓库 | `main`（跟踪 `origin/main`） |
| 源码仓库 | `ddbfb69`（`main`，跟踪 `origin/main`，工作区干净） |
| 操作系统 | Windows |
| Node | `v24.21.0`（DSH 运行时自带） |
| npm | `12.2.3`，从 registry 下载到 `C:\Users\hydro\npm-bootstrap`，通过 `npm.cmd` shim 使用 |
| 网络 | 沙箱内不可用；完全访问下 `registry.npmjs.org` 与 `github.com` 均可达 |
| 临时目录 | 构建时 `TEMP`/`TMP` 指向工作区内目录，避免 esbuild 临时文件删除被拒 |

### 2.1 npm 引导方式

沙箱内没有 npm，且受限进程无法完成 TLS 握手。本次在完全访问下从 registry 下载 npm CLI：

```powershell
# 下载并解压 npm 到 C:\Users\hydro\npm-bootstrap
# 生成 bin\npm.cmd、bin\npx.cmd，指向 DSH 运行时的 node.exe
$env:PATH = "C:\Users\hydro\npm-bootstrap\bin;<DSH node bin>;$env:PATH"
```

这不是仓库的一部分，只用于本机构建；CI 或换机时应使用正式安装的 Node + npm。

## 3. 站点产物基线（未改动）

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

## 4. 本次构建结果（0.1.3）

| 步骤 | 命令 | 结果 |
|---|---|---|
| 安装依赖 | `npm ci` | 527 packages，14s；npm 12 阻止了 2 个 esbuild install script，但平台二进制包可用 |
| 库构建 | `npm run build:lib` | 成功，生成 ESM、声明、样式、analysis worker 与许可文本 |
| 类型检查 | `npm run typecheck` | 退出码 0（须先 `build:lib`） |
| 单元测试（schematic） | `npm test` 第一阶段 | 156 个测试文件：155 passed / 1 skipped；1814 个测试：1812 passed / 2 skipped；30.2s |
| 单元测试（obsidian） | `npm test` 第二阶段 | 9 个文件、69 个测试全部通过；5.5s |
| Web 构建 | `npm run build:web` | 成功；Vite 7.3.6，1098 modules，7.3s |
| 浏览器冒烟 | `npm run test:browser` | 退出码 0；vsource、note-colors、disabled-pins、schematic-web 四组通过 |

## 5. 构建产物清单（0.1.3）

`source/schematic-editor/apps/web/dist/`：

| 文件 | 字节 | SHA-256（前 16 位） |
|---|---:|---|
| `assets/analysis.worker-vGwouHZQ.js` | 514781 | `D0A141A4A98EC3C9` |
| `assets/formulaSourceEditor-C_xCByUf.js` | 294225 | `263F80BC0BB18AA3` |
| `assets/index-BF_4zHu8.css` | 42377 | `4ED110ACD5EFBE83` |
| `assets/index-Cn95nlFN.js` | 1650745 | `7F4BB6DAE9904F2C` |
| `index.html` | 4153 | `4AA540F997B8A49D` |
| `LICENSE` | 1068 | `962BD57BDB54D481` |
| `THIRD_PARTY_LICENSES.txt` | 249625 | `ADB257BC3C7E9145` |

### 5.1 与线上 0.1.1 部署包的差异

| 项 | 线上 | 0.1.3 构建 | 差异 |
|---|---|---|---|
| analysis worker | 514,783 B | 514,781 B | −2 B |
| 编辑器 CSS | 42,061 B | 42,377 B | +316 B |
| 主 JS | 1,586,433 B | 1,650,745 B | +64,312 B（+4.1%） |
| 公式编辑器 chunk | 298,643 B | 294,225 B | −4,418 B |
| 许可文本 | 254,972 B | 249,625 B | −5,347 B |

差异来自 0.1.2/0.1.3 的上游改动，以及站点自行维护的 `app/schematic/` 外壳。R1 发布前必须确认哪些差异要保留、哪些要随上游同步，不能默认全部替换。

## 6. 构建注意事项

1. **临时目录**：`TEMP`/`TMP` 必须指向工作区内目录（例如 `.tmp-build`）。指向用户临时目录时，esbuild 服务删除临时文件会报 `Access is denied`，`vite build` 失败。
2. **npm script 链**：根脚本会再次调用 `npm`，因此 PATH 里必须有 `npm` 与 `node`；只设置 `NODE` 路径不够。
3. **构建顺序**：先 `build:lib`，再 `typecheck`/`test`，最后 `build:web`。obsidian workspace 的类型检查依赖库的新导出，未先构建库会报 `TS2305`；Web 构建的 `closeBundle` 还会从 `packages/schematic/dist/` 复制 `LICENSE`。
4. **npm 12 的 install-scripts 策略**：esbuild 的 postinstall 被阻止，但 `@esbuild/win32-x64` 可选依赖提供了二进制。为可复现，建议 CI 固定 npm 10/11，或在 npm 12 下显式批准 `esbuild` 的安装脚本。
5. **站点 `index.html` 不要用构建产物覆盖**：`dist/index.html` 是 Vite 默认壳（4,153 B），站点使用的是带页头/页脚/主题脚本的自定义 `index.html`（6,001 B）。发布时只同步 `assets/` 并更新其中的 hash 引用。

## 7. 当时拟定的发布步骤

- 用构建产物替换 `app/schematic/assets/`，更新 `app/schematic/index.html` 中 `index-*.js` 与 `index-*.css` 的引用。
- 同步 `manual.html`、`schematic.css`、`schematic-i18n.js`（R1 起新 UI 走 key，不再扩精确匹配表）。
- 跑 375px / 768px / 1080px、深色模式、SVG/PNG 导出与 JSON 往返检查。
- 记录“构建后清单指纹”，与本文件第 3 节对比。
- 每次发布更新 `outputs/` 压缩包。

## 8. 当时的仓库状态

- 远程仓库已建立：`analog-tools` 存放主站代码，`GmKing-schematic-editor` 存放源码 fork；remote 配置与推送状态以 git 为准。
- R1 从 0.1.3 开始开发。源码与站点于 1.0.0-beta 同步，发布提交见交接文档。
- 推送已改用 GitHub noreply 地址（`51410082+analog-life@users.noreply.github.com`），主站与源码仓库均已配置，不再使用个人邮箱。
