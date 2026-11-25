# source —— 开源源码工作区

本目录存放各工具源码。其中 `wavedrom/` 和 `schematic-editor/` 两个子目录是**独立的 Git 仓库**，分别对应网站上两个小工具的上游源码。
根仓库通过 `.gitignore` 忽略各源码目录，只保留本说明文件，避免嵌套仓库被误提交成 submodule。

| 目录 | 上游仓库 | 主分支 | 版本基线 |
|---|---|---|---|
| `wavedrom/` | <https://github.com/wavedrom/wavedrom> | `trunk` | 3.8.0（`5f44f7d`） |
| `schematic-editor/` | <https://github.com/KingsAnalog/GmKing-schematic-editor> | `main` | `1.0.1-beta`（`0d2d429`，发布分支与标签；是否合入 `main` 见[交接手册](../docs/schematic-editor/handoff.md)） |
| `s-parameter-viewer/` | 本地新项目（尚未初始化 Git 或设置远端） | — | 初始目录骨架 |

## 已完成的初始化

两个仓库均已保留完整上游历史，并完成以下配置：

- `upstream`：指向上游原始仓库，用于拉取官方更新。
- `origin`：指向 `analog-life` 账号下的 fork 地址，作为后续推送目标：
  - `https://github.com/analog-life/wavedrom.git`
  - `https://github.com/analog-life/GmKing-schematic-editor.git`
- 源码 fork 的默认分支为 `main`。本地可能位于发布分支或功能分支，操作前用 `git status --short --branch` 确认实际分支及跟踪关系。上游更新仍从 `upstream` 获取。
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
git -C source/wavedrom add -- path/to/changed-file
git -C source/wavedrom commit -m "说明本次修改"

# wavedrom 默认分支是 trunk
git -C source/wavedrom push -u origin trunk
```

```bash
git -C source/schematic-editor status
git -C source/schematic-editor add -- path/to/changed-file
git -C source/schematic-editor commit -m "说明本次修改"

# 核对当前分支和目标分支后再推送
git -C source/schematic-editor push -u origin HEAD
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

有同步上游的任务时，先查看上游改动与本仓库的差异，再在目标分支上合并、构建和验证。

## 与网站部署的关系

`source/` 用于维护源码。站点发布时，从目标版本构建并更新 `app/` 中相应工具的静态资源。需要发布包时再写入 `outputs/`。Schematic Editor 的版本对应与维护要求见 [交接手册](../docs/schematic-editor/handoff.md)。
