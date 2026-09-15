# LYRIC VIEW

[English](README.md) | **简体中文**

用于 REAPER 的轻量网页歌词面板，通过 REAPER 内置网页服务同步 LRC 歌词。无需构建或额外后端，音频播放与录制由 REAPER 完成。

## 功能

- 逐行高亮、自动跟随，点击歌词定位 REAPER。
- 播放、暂停、停止和录制控制。
- 导入或拖入 LRC 文件，调整伴奏起点，支持 LRC `offset`。
- 中英文界面、深浅色适配；在当前浏览器保存歌词、起点和语言选择。

## 安装

### 1. 复制文件

1. 下载或克隆项目。包含 `index.html` 的文件夹可自定义名称，以下以 `reaper-lyrics` 为例。
2. 在 REAPER 中打开 **Preferences / Settings → Control/OSC/web → Add**，将 **Control surface mode** 设为 **Web browser interface**。
3. 点击 **User pages…**，将上述文件夹整体复制到打开的目录。

目录结构示例（`reaper-lyrics` 替换为你的文件夹名），避免多套一层下载文件夹：

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

以 **User pages…** 打开的目录为准。`README` 和 `tests/` 无需复制。

### 2. 开启网页服务

1. 勾选 **Run web server on port**，填写可用端口，并记下这个数字。
2. 同机使用无需启用 **Use rc.reaper.fm**，**Default interface** 可保持原值。
3. 点击 **OK** 保存并关闭首选项，保持 REAPER 运行。

### 3. 拼接访问地址

在运行 REAPER 的电脑上，按以下格式填写地址，再粘贴到浏览器地址栏：

```text
http://127.0.0.1:端口号/文件夹名/index.html
```

- **端口号**：替换为上一步 **Run web server on port** 中填写的数字。
- **文件夹名**：替换为复制到用户网页目录的实际文件夹名称，须与自定义名称一致。
- 例如端口设为 `8080`，文件夹为 `reaper-lyrics`，完整地址就是：

```text
http://127.0.0.1:8080/reaper-lyrics/index.html
```

修改端口或文件夹名后，相应修改地址。页面显示 **REAPER connected / REAPER 已连接** 即表示连接成功；配置了 **Username:password** 时，按浏览器提示登录。

**手机或平板访问**：连接同一局域网，使用 REAPER 配置中 **Access URL** 的 `http://电脑地址:端口号` 部分，再接上 `/文件夹名/index.html`，将文件夹名替换为实际名称（不要重复 `/`）。例如电脑地址为 `192.168.1.20`、端口为 `8080`、文件夹名为 `reaper-lyrics`：

```text
http://192.168.1.20:8080/reaper-lyrics/index.html
```

手机或平板上的 `127.0.0.1` 指向设备自身，需换成 REAPER 电脑的局域网地址。局域网使用建议配置 **Username:password**。

## 使用

1. 在 REAPER 中打开伴奏工程，向网页导入或拖入匹配伴奏版本的 UTF-8 `.lrc` 文件。内置示例不含音频。
2. 设置 **Track start / 伴奏起点**：伴奏从工程第 10 秒开始就填 `10`；也可先在 REAPER 中定位，再点击 **Use REAPER position / 使用 REAPER 当前位置**。
3. 播放后歌词自动跟随，点击歌词可跳转；手动滚动后点击 **Resume follow / 回到当前歌词** 恢复跟随。
4. 录制前，在 REAPER 中设置输入并启用目标轨道的 **Record Arm（录音预备）**，取消其他轨道的预备。网页的 **Record / 录制** 会录制所有已预备轨道，保存对话框在 REAPER 中处理。

在设置的 **Language / 界面语言** 中切换中英文；窄屏先展开 **Lyrics & settings / 歌词与时间设置**。歌词与设置保存在当前浏览器，更换浏览器、设备或地址的主机/端口后可能需要重新导入；清除站点数据会删除记录。

## LRC 格式

```text
[ti:One More Take]
[ar:Demo lyrics]
[offset:0]
[00:05.00]Put your headphones on and listen
[00:10.00]Let every word fall into time
[00:15.00]
```

支持一句多个时间戳；空文本时间点表示间奏，也可用于结束最后一句高亮。`offset` 单位为毫秒，正值提前、负值延后；**伴奏起点**单位为秒，正值延后。

## 常见问题

- **无法连接 / 404**：用实际地址访问 `http://电脑地址:端口号/_/TRANSPORT`，正常应返回含 `TRANSPORT` 的文本。检查 REAPER 是否运行、端口是否一致、设置是否保存，以及文件夹是否多套一层。直接打开 HTML 或使用普通静态服务器只能预览界面，无法同步 REAPER。
- **Error opening port(s)**：用 OK 保存并关闭设置后重试；仍不可用时，检查重复的网页控制条目或换一个可用端口，并更新浏览器地址。
- **歌词提前或延后**：调整伴奏起点，增加 `0.3` 秒即晚 `0.3` 秒显示。若误差逐渐增大，检查歌词与伴奏版本是否匹配。
- **更新后仍是旧界面**：重新复制全部运行文件，再强制刷新浏览器。

当前仅支持逐行同步，不支持逐字高亮、歌词编辑或自动打时间戳。切换工程后需自行核对歌词与起点；录唱时保持页面可见，避免后台标签页限速影响同步。

## 开发与验证

原生 HTML、CSS、JavaScript，无需安装依赖或构建。核心与控制流程测试需要 Node.js 18+：

```sh
node --test tests/core.test.cjs tests/record.test.cjs
```

浏览器验证使用 Python 3 启动模拟服务器：

```sh
python3 tests/mock-server.py
```

打开 [模拟页面](http://127.0.0.1:9911/index.html)，在控制台粘贴 `tests/motion.browser.js` 或 `tests/language.browser.js` 的内容，分别执行 `await verifyMotion()` 或 `await verifyLanguage()`。模拟测试不连接真实 REAPER，也不验证实际音频录制。
