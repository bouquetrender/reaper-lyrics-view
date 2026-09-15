# LYRIC VIEW

[English](README.md) | **简体中文**

LYRIC VIEW 是用于 REAPER 的轻量网页歌词面板，通过 REAPER 内置网页服务同步显示带时间戳的 LRC 歌词，支持点击歌词定位及播放、暂停、停止和录制控制。提供中英文界面，默认英文，无需构建或额外后端；音频播放与录制均由 REAPER 完成。

> A lightweight web-based LRC lyrics viewer for REAPER, with synchronized line highlighting, click-to-seek, transport controls, and an English/Chinese interface.

## 功能

- **逐行同步**：按 REAPER 返回的工程时间高亮当前歌词并自动居中；手动滚动可暂停跟随，高亮仍继续更新。
- **双向定位**：在 REAPER 中移动时间位置后更新歌词；点击网页中的歌词可定位 REAPER。
- **播放与录制控制**：提供播放、暂停、停止和录制按钮；录制前检查是否存在已预备的录音轨。
- **时间对齐**：设置伴奏起点，或使用 REAPER 当前位置作为起点；支持 LRC `offset`。
- **歌词导入与恢复**：支持文件选择和拖入，保存当前浏览器上次使用的歌词及伴奏起点，附带英文示例。
- **界面设置**：English / 中文切换并记住选择，适配桌面与窄屏、系统深浅色及减少动态效果等偏好。

## 使用前提

- REAPER 已开启 **Web browser interface**，并保持运行。
- 使用现代浏览器，通过 **REAPER 提供的网页地址**打开本项目。
- 准备与伴奏版本匹配、包含时间戳的 UTF-8 LRC 文件。

网页本身不播放音频、不访问浏览器麦克风，也不生成歌词或时间戳。双击 HTML、普通静态服务器及 GitHub Pages 可用于界面预览，但不能直接替代 REAPER 的同步接口。

## 安装

### 1. 复制到 REAPER 用户网页目录

1. 下载或克隆本项目，将包含 `index.html` 的文件夹命名为 **`reaper-lyrics`**。
2. 打开 REAPER 的 **Preferences / Settings → Control/OSC/web**，点击 **Add**。不同版本或语言包的菜单名称可能略有差异。
3. 将 **Control surface mode** 设为 **Web browser interface**。
4. 点击 **User pages…**，把整个 `reaper-lyrics` 文件夹复制到打开的目录。

请以 **User pages…** 打开的目录为准。也可通过 **Options → Show REAPER resource path in Finder** 找到资源目录，再进入 `reaper_www_root`。macOS 常规安装的用户网页目录为：

```text
~/Library/Application Support/REAPER/reaper_www_root/
```

复制后应为以下结构，不要多套一层下载目录，也不要修改 REAPER 应用内部文件：

```text
reaper_www_root/
└── reaper-lyrics/
    ├── index.html
    ├── styles.css
    ├── lyrics-core.js
    ├── i18n.js
    ├── app.js
    └── example.lrc
```

`README.md` 和 `tests/` 不是运行必需文件。

### 2. 开启网页服务

1. 勾选 **Run web server on port**，填写可用端口，例如 **9090**。
2. 同机使用无需启用 **Use rc.reaper.fm**；Default interface 可保持原值。
3. 点击 **OK** 保存，并关闭外层首选项窗口。
4. 保持 REAPER 运行，打开 [LYRIC VIEW](http://127.0.0.1:9090/reaper-lyrics/index.html)。

页面显示 **REAPER connected / REAPER 已连接** 即表示已收到时间数据。若更换端口，请修改访问地址中的 `9090`；若修改文件夹名，也需相应修改地址路径。设置了 **Username:password** 时，浏览器会要求登录。

## 使用

### 导入与对齐

1. 在 REAPER 中打开伴奏工程。
2. 点击 **Import lyrics… / 导入歌词…**，选择 `.lrc` 文件，或直接拖入窗口。也可点击 **Use demo lyrics / 使用示例歌词** 载入英文示例；示例不附带音频。
3. 在 **Timing / 时间对齐** 中设置 **Track start / 伴奏起点**。伴奏从工程第 10 秒开始，就填写 `10`。也可先在 REAPER 中定位，再点击 **Use REAPER position / 使用 REAPER 当前位置**。
4. 播放或改变 REAPER 的时间位置，观察歌词同步。点击网页任一句歌词，可定位到该句对应的工程时间。
5. 手动滚动后，点击 **Resume follow / 回到当前歌词** 恢复自动跟随。

选择音频片段不一定会移动播放位置。播放期间，网页跟随 REAPER 返回的播放时间；仅移动编辑光标、未实际跳播时，歌词仍跟随正在播放的声音。

### 录制

1. 在 **REAPER 中自行选择录音轨、设置输入并启用 Record Arm（录音预备）**。仅选中轨道或开启监听不代表已预备。
2. 关闭其他不需要录制轨道的 Record Arm。REAPER 会录制所有已预备的轨道，网页不会选择、预备或取消预备轨道。
3. 点击 **Record / 录制**。若未检测到已预备轨道，网页仅显示提示，不启动录制。
4. 录音中禁用录制按钮，防止重复触发；使用 **Pause / 暂停** 或 **Stop / 停止** 控制进程。录音保存对话框由 REAPER 处理。

录制按钮使用 REAPER 内置网页的 `1013` 命令。断线时禁用控制，失败的命令不会在重连后自动重发。

### 语言与保存

首次打开默认 **English**。在设置的 **Language / 界面语言** 中选择 **English / 中文**；窄屏中先展开 **Lyrics & settings / 歌词与时间设置**。

界面、指南、提示与辅助功能标签随语言切换，导入的歌词原文、歌曲信息及伴奏起点保持不变。内置示例和 `example.lrc` 均为英文；恢复旧版未经修改的中文示例时，会更新为英文并保留起点。

歌词、起点与语言选择通过 `localStorage` 保存在当前浏览器。更换设备、浏览器或访问地址的主机/端口后，可能需要重新导入与设置；清除浏览器站点数据也会移除这些记录。项目不提供云端歌词存储。

## LRC 格式

```text
[ti:One More Take]
[ar:Demo lyrics]
[offset:0]
[00:05.00]Put your headphones on and listen
[00:10.00]Let every word fall into time
[00:15.00]
[00:20.00]From right here, keep singing on
```

- 支持标题 `ti`、歌手 `ar`、一句多个时间戳，以及相同时间戳的多行歌词。
- 空文本时间点显示为间奏；可在歌曲结束处添加空时间点，避免最后一句一直高亮。
- `offset` 单位为毫秒：正值提前显示，负值延后显示。页面的 **Track start** 单位为秒，正值让整首歌词在工程中延后。

时间映射：

```text
工程定位秒数 = LRC 时间戳秒数 - LRC offset / 1000 + Track start
```

若定位结果小于 0，网页将定位到工程第 0 秒。

## 同步范围与限制

- 当前为**逐行同步**，不支持逐字卡拉 OK 高亮、歌词编辑或自动打时间戳。
- 连接正常时，每次请求完成后约等待 `100ms` 再读取状态；实际延迟受网络和浏览器调度影响，不属于采样级同步。
- 页面不自行累加播放时间。循环、跳转或变速后，按 REAPER 最新返回的工程时间更新。
- 不自动识别当前歌曲、伴奏轨道或工程。切换歌曲、剪切伴奏或使用不同版本时，需要自行核对 LRC 与起点；单个起点无法修复分段错位。
- 后台标签页可能被浏览器限速，录唱时建议保持歌词页面可见。正常切句和时间定位即时更新；鼠标/触摸恢复跟随时，一屏内使用短过渡，跨屏直接定位。

## 常见问题

**无法连接或出现 404**

先访问 [REAPER 首页](http://127.0.0.1:9090/)，再检查 [时间接口](http://127.0.0.1:9090/_/TRANSPORT)。后者正常应返回包含 `TRANSPORT`、播放状态及秒数的一行文本。按实际端口修改地址；检查 REAPER 是否运行、设置是否保存、目录是否多套一层。

**Control Surface: Error opening port(s)**

先关闭错误提示，并用 OK 保存、关闭设置窗口，再测试时间接口。部分旧版环境在关闭设置后仍可正常提供服务，因此不应仅凭弹窗认定端口被其他程序占用。若仍不可用，再检查重复的网页控制条目及端口占用，避免反复新增条目或连续点击 Apply settings → OK。

**歌词整体提前或延后**

调整 Track start。例如增加 `0.3` 秒会让歌词晚 `0.3` 秒显示。若误差逐渐增大，检查歌词与伴奏是否为同一版本。

**想在平板上打开**

设备需能通过局域网访问 REAPER 电脑。使用 REAPER 配置中的 **Access URL**，追加 `/reaper-lyrics/index.html`，并在平板浏览器导入歌词。平板上的 `127.0.0.1` 指向平板自身，不能用于访问电脑。局域网使用建议配置 Username:password。

**更新后仍是旧界面**

将所有运行文件重新复制到用户网页目录，包含 `i18n.js`，然后强制刷新。页面内的连接指南会根据当前地址显示主机、端口及路径。

## 开发与验证

使用原生 HTML、CSS 和 JavaScript，无需 npm 安装或构建。

核心及控制流程测试需要 Node.js 18+，在项目目录运行：

```sh
node --test tests/core.test.cjs tests/record.test.cjs
```

测试涵盖 LRC 解析、时间映射、协议解析、录制预备检查、重复操作、断线及语言切换。控制流程使用 DOM 和 HTTP 替身，不等于真实音频录制验证。

浏览器开发验证可使用 Python 3 启动模拟服务器：

```sh
python3 tests/mock-server.py
```

打开 [模拟页面](http://127.0.0.1:9911/index.html)。在该页面控制台粘贴对应测试文件的内容后运行：

| 测试文件 | 执行命令 | 覆盖范围 |
| --- | --- | --- |
| `tests/motion.browser.js` | `await verifyMotion()` | 跟随过渡、滚动中断、键盘、减少动态效果分支、循环及断线恢复 |
| `tests/language.browser.js` | `await verifyLanguage()` | 文案切换、英文示例、歌词保留、错误提示与控制命令隔离 |

模拟测试会替换模拟页面中的歌词与播放状态，只允许在本机 `9911` 页面运行，不连接真实 REAPER。正式使用时需打开 REAPER 自己的服务器地址。

## 参考

- REAPER 安装附带的 `reaper_www_root/main.js`、`lyrics.html` 及 `index.html`：网页通信与控制命令依据。
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)：布局、字体、颜色和可访问性设计参考；本项目使用网页技术，并非原生 Apple 组件。
- [Emil Kowalski — Design Engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md)：短反馈、可中断动效和高频操作即时响应的设计参考。
