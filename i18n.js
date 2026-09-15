'use strict';

const LyricsI18n = (() => {
  const english = {
  "正在连接": "Connecting…",
  "歌词设置": "Lyrics settings",
  "歌词与时间设置": "Lyrics & settings",
  "歌词文件": "Lyrics file",
  "导入歌词…": "Import lyrics…",
  "选择 LRC 文件，或将文件拖入窗口。": "Choose an LRC file, or drop it into this window.",
  "使用示例歌词": "Use demo lyrics",
  "时间对齐": "Timing",
  "伴奏起点": "Track start",
  "工程时间": "Project time",
  "秒": "s",
  "伴奏从第 10 秒开始，就填 10。正数让歌词整体延后。": "If the backing track starts at 10 seconds, enter 10. Positive values delay the lyrics.",
  "使用 REAPER 当前位置": "Use REAPER position",
  "歌词时间": "Lyric time",
  "连接 REAPER": "Connect to REAPER",
  "在 REAPER 设置中添加 Web browser interface。": "Add a Web browser interface in REAPER preferences.",
  "点击 User pages，将整个项目文件夹放入打开的目录。": "Click User pages and copy the entire project folder into that directory.",
  "启用端口": "Enable port",
  "，点击 OK 保存并关闭设置窗口，通过下方地址打开。": ", click OK to save and close preferences, then open the address below.",
  "旧版 REAPER 请避免连续点击 Apply settings → OK。若报端口错误，关闭设置窗口后再检查连接。": "On older REAPER versions, avoid Apply settings followed by OK. If a port error appears, close preferences before checking the connection.",
  "完整说明见 README.md。音频由 REAPER 播放。": "See README.md for full instructions. Audio plays in REAPER.",
  "如何录制": "How to record",
  "先在 REAPER 中选择录音轨，设置输入，并开启该轨的录音预备（Record Arm）。仅选中轨道还不够。": "In REAPER, choose a recording track, set its input, and enable Record Arm. Selecting the track alone is not enough.",
  "网页会录制所有已预备的轨道；请自行关闭不需要录制轨道的预备。结束录制请点击停止，录音保存按 REAPER 提示处理。": "REAPER records all armed tracks. Disarm any tracks you do not want to record. Click Stop to finish, then follow REAPER’s prompts to save the recording.",
  "歌词仅保存在此浏览器": "Lyrics are saved only in this browser",
  "歌词": "Lyrics",
  "与 REAPER 同步": "Synced with REAPER",
  "自动跟随": "Follow",
  "回到当前歌词": "Resume follow",
  "歌词，可滚动浏览": "Lyrics, scroll to browse",
  "添加歌词，开始跟随": "Add lyrics to follow along",
  "导入带时间戳的 LRC 歌词，": "Import a timestamped LRC file,",
  "在 REAPER 中定位或播放即可同步。": "then seek or play in REAPER to sync.",
  "歌词列表": "Lyrics list",
  "在 REAPER 中播放，歌词将在这里跟随。": "Play in REAPER to follow the lyrics here.",
  "播放控制": "Transport controls",
  "等待连接": "Waiting for REAPER",
  "停止": "Stop",
  "播放": "Play",
  "暂停": "Pause",
  "录制": "Record",
  "请先在 REAPER 中选择录音轨并开启录音预备": "Choose a recording track and enable Record Arm in REAPER first",
  "界面语言": "Language",
  "松开以导入歌词": "Drop to import lyrics",
  "浏览器无法保存本次歌词；当前仍可使用，刷新后需重新导入。": "Your browser could not save these lyrics. You can still use them, but will need to import them again after reloading.",
  "已停止": "Stopped",
  "播放中": "Playing",
  "已暂停": "Paused",
  "录音中": "Recording",
  "录音已暂停": "Recording paused",
  "循环已开启": "Repeat on",
  "准备中": "Preparing",
  "录制暂停": "Paused",
  "录制中": "Recording",
  "歌词已就绪，等待 REAPER 连接。": "Lyrics are ready. Waiting for REAPER.",
  "等待第一句 · 点击歌词可定位": "Waiting for the first line · Click a line to seek",
  "点击任一句，定位 REAPER · 滚动可自由浏览": "Click a line to seek in REAPER · Scroll to browse",
  "REAPER 已连接": "REAPER connected",
  "REAPER 未连接": "REAPER disconnected",
  "{name} · {count} 个时间点": "{name} · {count} cues",
  "♪ 间奏": "♪ Instrumental",
  "已导入歌词，伴奏起点已重置为 0。可在时间对齐中调整。": "Lyrics imported. Track start is reset to 0. Adjust it in Timing if needed.",
  "示例歌词已载入。请在 REAPER 中播放或移动时间光标；此页面不播放音频。": "Demo lyrics loaded. Play or move the cursor in REAPER to test sync. This page does not play audio.",
  "伴奏起点请输入有效秒数。": "Enter a valid track start time in seconds.",
  "已设置伴奏起点。切换歌曲或 REAPER 工程时，请重新核对歌词和起点。": "Track start set. Check the lyrics and start time when switching songs or REAPER projects.",
  "无法检查录音轨，请确认 REAPER 连接正常后重试。": "Could not check recording tracks. Check the REAPER connection and try again.",
  "未检测到已预备的录音轨。请在 REAPER 中选择轨道、设置输入并开启 Record Arm，再点击录制。": "No armed track found. Choose a track in REAPER, set its input, and enable Record Arm before clicking Record.",
  "连接失败（HTTP {status}），请确认 REAPER 网页服务已启用。": "Connection failed (HTTP {status}). Check that the REAPER web server is enabled.",
  "连接超时，正在重试。请确认 REAPER 正在运行、网页服务已开启。": "Connection timed out. Retrying… Check that REAPER and its web server are running.",
  "无法连接 REAPER，正在重试。请通过 REAPER 网页服务打开，检查地址与端口。": "Cannot connect to REAPER. Retrying… Open this page through the REAPER web server and check the address and port.",
  "已恢复上次歌词与伴奏起点。若切换了 REAPER 工程，请重新导入对应歌词。": "Previous lyrics and track start restored. Import the matching lyrics if you have switched REAPER projects.",
  "无法恢复上次歌词，请重新导入。": "Could not restore your previous lyrics. Please import them again.",
  "当前为本地预览。请按“连接 REAPER”中的说明，通过 REAPER 网页地址打开。": "This is a local preview. Follow “Connect to REAPER” and open the page through the REAPER web server.",
  "LRC 的 offset 必须是毫秒数。": "The LRC offset must be a number in milliseconds.",
  "没有找到带时间戳的歌词。请导入包含 [00:12.50]歌词 的 UTF-8 LRC 文件。": "No timestamped lyrics found. Import a UTF-8 LRC file containing lines such as [00:12.50]Start from this line.",
  "未收到 REAPER 时间数据，请通过 REAPER 网页服务器打开此页面。": "No REAPER timing data received. Open this page through the REAPER web server.",
  "REAPER 返回的播放状态或时间无效。": "REAPER returned an invalid playback state or time."
};

  const key = 'lyric-view-language';
  let language = 'en';
  try { if (localStorage.getItem(key) === 'zh-CN') language = 'zh-CN'; } catch {}

  function t(message, values = {}) {
    const text = language === 'en' ? (english[message] || message) : message;
    return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  }

  function setLanguage(value) {
    language = value === 'zh-CN' ? 'zh-CN' : 'en';
    try { localStorage.setItem(key, language); } catch {}
  }

  function translatePage() {
    document.documentElement.lang = language;
    for (const attribute of ['text', 'aria-label', 'title']) {
      const marker = attribute === 'text' ? 'data-i18n' : 'data-i18n-' + attribute;
      document.querySelectorAll('[' + marker + ']').forEach(element => {
        const value = t(element.getAttribute(marker));
        if (attribute === 'text') element.textContent = value;
        else element.setAttribute(attribute, value);
      });
    }
    document.body.dataset.dropLabel = t('松开以导入歌词');
  }

  return { t, setLanguage, translatePage, get language() { return language; } };
})();
