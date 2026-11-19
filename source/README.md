# source —— 开源源码工作区

本目录下的两个子目录是**独立的 Git 仓库**，分别对应网站上两个小工具的上游源码。
根仓库通过 `.gitignore` 忽略它们，只保留本说明文件，避免嵌套仓库被误提交成 submodule。

| 目录 | 上游仓库 | 当前分支 | 当前版本 |
|---|---|---|---|
| `wavedrom/` | <https://github.com/wavedrom/wavedrom> | `trunk` | 3.8.0（`5f44f7d`） |
| `schematic-editor/` | <https://github.com/KingsAnalog/GmKing-schematic-editor> | `main` | 0.1.3（`ddbfb69`） |

## 已完成的初始化

两个仓库均已保留完整上游历史，并完成以下配置：

- `upstream`：指向上游原始仓库，用于拉取官方更新。
- `origin`：指向 `analog-life` 账号下的 fork 地址，作为后续推送目标：
  - `https://github.com/analog-life/wavedrom.git`
  - `https://github.com/analog-life/GmKing-schematic-editor.git`
- `schematic-editor` 的分支已跟踪 `origin/main`，可直接推送；上游更新仍从 `upstream` 拉取。
- 本地提交身份已设置为 `analog-life <51410082+analog-life@users.noreply.github.com>`，可在各仓库内按需修改。
- `remote.pushDefault` 已设为 `origin`。

## 首次推送前：先创建 fork

`schematic-editor` 的 fork 已创建：<https://github.com/analog-life/GmKing-schematic-editor>。`wavedrom` 的 fork 如尚未创建，按下面步骤创建：

- <https://github.com/wavedrom/wavedrom/fork>
- <https://github.com/KingsAnalog/GmKing-schematic-editor/fork>

选择 `analog-life` 账号创建 fork。如果实际使用的不是 `analog-life`，在各仓库中修改 `origin`：

```bash
git -C source/wavedrom remote set-url origin https://github.com/<你的账号>/wavedrom.git
git -C source/schematic-editor remote set-url origin https://github.com/<你的账号>/GmKing-schematic-editor.git
```

## 提交与推送

在对应工具目录内修改源码后：

```bash
git -C source/wavedrom status
git -C source/wavedrom add .
git -C source/wavedrom commit -m "说明本次修改"

# wavedrom 默认分支是 trunk
git -C source/wavedrom push -u origin trunk
```

```bash
git -C source/schematic-editor status
git -C source/schematic-editor add .
git -C source/schematic-editor commit -m "说明本次修改"

# schematic-editor 默认分支是 main
git -C source/schematic-editor push -u origin main
```

首次推送会要求 GitHub 认证。HTTPS 方式可使用 Git Credential Manager 或 Personal Access Token；
如果已配置 SSH，可把 `origin` 改成 `git@github.com:<账号>/<仓库>.git` 后再推送。

## 同步上游更新

推送过 fork 后，分支可能会改为跟踪 `origin`；上游更新仍可通过 `upstream` 拉取：

```bash
git -C source/wavedrom fetch upstream
git -C source/wavedrom merge upstream/trunk

git -C source/schematic-editor fetch upstream
git -C source/schematic-editor merge upstream/main
```

合并后重新构建、验证，再提交并推送自己的 fork。

## 与网站部署的关系

`source/` 只用于维护源码，不参与 `app/` 的部署。修改源码后，需要重新构建/整理产物并更新
`app/` 中对应工具的文件，再把新的发布包放入 `outputs/`。
