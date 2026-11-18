# Analog Tools · 模拟人生工具箱

`analog-life.com/tools/` 的静态小工具合集。纯 HTML / CSS / JS，无构建步骤，
所有计算均在访客浏览器本地完成，不向服务器回传任何数据。

## 目录结构

```
app/
├── index.html            ← 工具目录首页（/tools/ 的入口）
├── assets/
│   ├── css/style.css     ← 全站共享样式（浅色 / 深色主题变量）
│   ├── js/theme.js       ← 主题切换（默认跟随系统，可手动覆盖）
│   ├── js/tools.js       ← ★ 工具目录数据（添加工具改这里）
│   └── img/favicon.svg
├── rc-cutoff/index.html  ← 示例工具：RC 截止频率计算器
├── divider/index.html    ← 示例工具：电阻分压计算器
├── wavedrom/             ← WaveDrom 时序图绘制（含使用手册 manual.html）
│   └── vendor/           ← wavedrom 3.8.0 库文件（MIT 许可，附 LICENSE-wavedrom）
├── dev-server.js         ← 本地预览服务器（不要上传到服务器）
└── package.json          ← 本地预览脚本（不要上传到服务器）
```

## 第三方组件

- **WaveDrom 3.8.0**（MIT © 2011-2026 Aliaksei Chapyzhenka），
  原项目 <https://github.com/wavedrom/wavedrom>，本地化于 `wavedrom/vendor/`。

## 添加一个新工具

1. 新建文件夹，例如 `my-tool/`，在其中写 `index.html`（可参考 `rc-cutoff/` 的结构，
   通过 `../assets/css/style.css` 复用全站样式与主题）。
2. 打开 `assets/js/tools.js`，在 `TOOLS` 数组中增加一项：

   ```js
   {
     slug: "my-tool",      // 与文件夹名一致
     icon: "i-wave",       // 首页 index.html 中定义的图标 id
     name: "我的工具",
     desc: "一句话说明。"
   }
   ```

3. 完成。首页卡片会自动出现，地址为 `/tools/my-tool/`。

## 主题（深色模式）

- 默认跟随浏览器的 `prefers-color-scheme`，无需任何设置。
- 右上角按钮可手动切换；选择保存在访客浏览器的 `localStorage`
  （键名 `at-theme`，仅本浏览器生效，不上传）。清除该键即恢复跟随系统。

## 部署到主站

把 `index.html`、`assets/` 和各工具文件夹上传到 WordPress 网站根目录下的
`tools/` 文件夹即可（与 `wp-admin`、`wp-content` 同级新建 `tools/`）。
**不要上传** `dev-server.js`、`package.json`、`README.md`。
Apache / Nginx 会优先返回真实目录中的文件，WordPress 不受影响，也无需修改
`.htaccess` 或伪静态规则。

## 本地预览

```bash
npm run dev            # 默认 http://127.0.0.1:7100/
npm run dev -- --port 8080
```

也可以直接用 VS Code 的 Live Server 等任意静态服务器打开本目录。
