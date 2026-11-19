# Phase 0 构建/发布基线

状态：Done（构建、单测、浏览器冒烟已跑通）· 2026-11-19

关联：[upgrade-plan.md](upgrade-plan.md)（6.2 构建与发布）

## 1. 结论

源码 `source/schematic-editor` 已在当前机器完成首次构建、类型检查、单元测试与浏览器冒烟，基线记录如下。站点 `app/schematic/` **尚未替换**：本次只记录基线，R1 发布时再同步 `assets/` 与 `index.html` 的 hash 引用。

线上登记版本为 0.1.1（维护者确认），但当前部署包仍是旧构建；本次构建与部署包的差异集中在主 JS 与公式编辑器 chunk，CSS、analysis worker 逐字节一致。

## 2. 环境

| 项 | 值 |
|---|---|
| 工作区 | `D:\AI程序设计\analog-tools` |
| 主仓库 | `main`（本地提交，推送状态以 git 为准） |
| 源码仓库 | `e19ca1f`（`main`，跟踪 `upstream/main`，工作区干净） |
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

## 4. 本次构建结果

| 步骤 | 命令 | 结果 |
|---|---|---|
| 安装依赖 | `npm ci` | 262 packages，8s；npm 12 阻止了 2 个 install script（esbuild postinstall），但平台二进制包可用，构建正常 |
| 类型检查 | `npm run typecheck` | 退出码 0 |
| 单元测试（schematic） | `npm test` 第一阶段 | 153 个测试文件：152 passed / 1 skipped；1809 个测试：1807 passed / 2 skipped；32.9s |
| 单元测试（obsidian） | `npm test` 第二阶段 | 9 个文件、69 个测试全部通过；5.9s |
| 库构建 | `npm run build:lib` | 成功，生成 ESM、声明、样式、analysis worker 与许可文本 |
| Web 构建 | `npm run build:web` | 成功；Vite 7.3.6，1095 modules，7.6s |
| 浏览器冒烟 | `npm run test:browser` | 退出码 0；vsource、note-colors、disabled-pins、schematic-web 四组通过 |

## 5. 构建产物清单

`source/schematic-editor/apps/web/dist/`：

| 文件 | 字节 | SHA-256（前 16 位） |
|---|---:|---|
| `assets/analysis.worker-DD1etQJA.js` | 514783 | `BA635AC738E7E7BF` |
| `assets/formulaSourceEditor-CG1EbUjc.js` | 294225 | `A36D36CE85C42817` |
| `assets/index-Bs3Esb1t.js` | 1625550 | `0C71826ABA4AC35D` |
| `assets/index-Dycg_2g4.css` | 42061 | `CD085C1EDE6FDBA1` |
| `index.html` | 4153 | `6D9098FBB0BE5DC8` |
| `LICENSE` | 1068 | `962BD57BDB54D481` |
| `THIRD_PARTY_LICENSES.txt` | 249625 | `AF1A8853C784C277` |

### 5.1 与当前部署包的差异

| 项 | 线上 | 本次构建 | 结论 |
|---|---|---|---|
| analysis worker | `BA635AC7…` | `BA635AC7…` | 逐字节一致 |
| 编辑器 CSS | `CD085C1E…` | `CD085C1E…` | 逐字节一致 |
| 主 JS | 1,586,433 B | 1,625,550 B | +39,117 B（+2.5%），hash 变化 |
| 公式编辑器 chunk | 298,643 B | 294,225 B | −4,418 B，hash 变化 |
| 许可文本 | 254,972 B | 249,625 B | 上游 0.1.1 的依赖闭包不同 |

线上登记已对齐到 `0.1.1`，但部署包仍是旧构建；差异可能来自上游升级、站点定制或构建参数。R1 发布前需逐项确认，不能默认都是上游变更。

## 6. 构建注意事项

1. **临时目录**：`TEMP`/`TMP` 必须指向工作区内目录（例如 `.tmp-build`）。指向用户临时目录时，esbuild 服务删除临时文件会报 `Access is denied`，`vite build` 失败。
2. **npm script 链**：根脚本会再次调用 `npm`，因此 PATH 里必须有 `npm` 与 `node`；只设置 `NODE` 路径不够。
3. **构建顺序**：先 `build:lib` 再 `build:web`。Web 构建的 `closeBundle` 会从 `packages/schematic/dist/` 复制 `LICENSE`，库未构建时会 `ENOENT`。
4. **npm 12 的 install-scripts 策略**：esbuild 的 postinstall 被阻止，但 `@esbuild/win32-x64` 可选依赖提供了二进制，当前不受影响。为可复现，建议 CI 固定 npm 10/11，或在 npm 12 下显式批准 `esbuild` 的安装脚本。
5. **站点 `index.html` 不要用构建产物覆盖**：`dist/index.html` 是 Vite 默认壳（4,153 B），站点使用的是带页头/页脚/主题脚本的自定义 `index.html`（6,001 B）。发布时只同步 `assets/` 并更新其中的 hash 引用。

## 7. 发布前仍需

- 用构建产物替换 `app/schematic/assets/`，更新 `app/schematic/index.html` 中 `index-*.js` 与 `index-*.css` 的引用。
- 同步 `manual.html`、`schematic.css`、`schematic-i18n.js`（R1 起新 UI 走 key，不再扩精确匹配表）。
- 跑 375px / 768px / 1080px、深色模式、SVG/PNG 导出与 JSON 往返检查。
- 记录“构建后清单指纹”，与本文件的第 3 节对比。
- 每次发布更新 `outputs/` 压缩包。

## 8. 待决

- 远程仓库已建立：`analog-tools` 存放主站代码，`GmKing-schematic-editor` 存放源码 fork；remote 配置与推送状态以 git 为准，不在本文档记录。
- 站点部署包与 0.1.1 源码构建仍有差异；R1 发布时是否需要一并替换并对拍，需在开始 R1 前确认。
