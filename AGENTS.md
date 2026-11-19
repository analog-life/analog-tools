# AGENTS.md — Analog Tools 开发约束

本文件是此仓库的长期开发约束。**每次在本仓库中进行开发（新增工具、修改页面、调整样式）之前，都必须先阅读本文件，并保证交付物满足以下全部要求。**

## 项目定位

本仓库是 `analog-life.com/tools/` 的静态小工具合集，部署时 `app/` 目录下的
`index.html`、`assets/` 与各工具文件夹会被原样上传到 WordPress 站点根目录的
`tools/` 文件夹中。Web 服务器优先返回真实目录，与 WordPress 互不干扰。

## 目录约定

- `outputs/`：存放打包好的、可直接上传到服务器解压的发布压缩包。该目录只用于存放发布产物，不属于 `app/` 的部署内容。
- `source/`：存放从 GitHub 下载的开源程序源码。后续在该目录中维护和更新小工具相关的开源程序，并推送到 GitHub。该目录同样不属于 `app/` 的部署内容。

## 公共要求（每个工具都必须满足）

1. **完全静态，纯前端**
   - 所有功能与计算均在访客浏览器中完成，**禁止向服务器回传任何数据**。
   - 禁止依赖外部 CDN / 第三方接口 / 后端服务；第三方库必须本地化到工具的
     `vendor/` 目录，并附带其 LICENSE 文件。
   - 需要保存用户偏好时只能使用 `localStorage`（键名统一加 `at-` 前缀），
     并在文档中说明仅存于本浏览器。
2. **自动深色模式**
   - 默认跟随浏览器 `prefers-color-scheme`，并提供手动切换（复用
     `assets/js/theme.js`，按钮 id 为 `theme-toggle`，含 `icon-sun` / `icon-moon` 两个 svg）。
   - 手动选择写入 `localStorage` 的 `at-theme` 键；浅色、深色两种模式下
     文字对比度与可读性都必须实测合格。
3. **简约美观**
   - 复用 `assets/css/style.css` 的设计体系（OKLCH 主题变量、铜色 accent、
     衬线标题、卡片与面板样式），新样式优先追加到该文件或工具自有 css，
     不得另起一套风格。
   - 所有资源使用**相对路径**（`./`、`../`），保证整站部署在 `/tools/` 子路径下可用。
   - 每个工具一个文件夹，入口为 `文件夹名/index.html`；新工具必须在
     `assets/js/tools.js` 的 `TOOLS` 数组中登记后才会出现在首页。

## 页面公共元素

- 页头：左上角 `← 返回工具列表`（链接 `../`），右上角主题切换按钮。
- 页脚：版权行 + 备案行（`鲁ICP备2022011627号-1`、`陕公网安备61010302000906号`，
  样式 class 为 `beian`），从现有页面复制，不得遗漏。
- `<head>` 中必须包含主题防闪烁脚本（从现有页面复制），以及
  `<meta name="viewport">`、`<meta name="color-scheme" content="light dark">`。

## 第三方组件

| 组件 | 版本 | 许可 | 位置 |
|---|---|---|---|
| WaveDrom | 3.8.0 | MIT © 2011-2026 Aliaksei Chapyzhenka | `app/wavedrom/vendor/` |
| GmKing Schematic Editor | 0.1.1 | MIT © 2026 RarityBrown | `app/schematic/`（含 LICENSE 与 THIRD_PARTY_LICENSES.txt） |
| JointJS | 4.2.4 | MPL-2.0 | 已打包进 `app/schematic/assets/` |
| MathJax | 4.1.3 | Apache-2.0 | `app/schematic/vendor/mathjax/` |

使用第三方组件的页面必须在显著位置标明原作者与原项目链接。

## 工程约束

- 无构建步骤：不引入打包器；本地预览用 `npm run dev`（`app/dev-server.js`）。
- `dev-server.js`、`package.json`、`README.md` 不上传服务器。
- 交付前必须在浏览器中实测：页面渲染、交互、深色模式、375px 移动端。
- git 提交信息使用中文，概括改动要点；提交前 `git status` 确认无多余文件。
