'use strict';

const { parseLrc, findCue, parseTransport, hasArmedTrack, formatTime } = LyricsCore;
const { t } = LyricsI18n;
const $ = id => document.getElementById(id);
const storageKey = 'reaper-lyrics-session-v1';
const legacySample = '[ti:一次练习]\n[ar:示例歌词 · 请配合 REAPER 时间轴测试]\n[00:00.00]\n[00:05.00]戴上耳机，听见此刻\n[00:10.00]让每一句，落在节拍上\n[00:15.00]不必着急，再来一次\n[00:20.00]把声音，留在这一刻\n[00:25.00]\n[00:30.00]从这里，继续唱下去\n[00:35.00]每一次练习，都离自己更近\n[00:40.00]';
const sample = '[ti:One More Take]\n[ar:Demo lyrics · REAPER sync test]\n[00:00.00]\n[00:05.00]Put your headphones on and listen\n[00:10.00]Let every word fall into time\n[00:15.00]Take a breath and try again\n[00:20.00]Leave your voice inside this moment\n[00:25.00]\n[00:30.00]From right here, keep singing on\n[00:35.00]Every take brings you closer\n[00:40.00]';
let cues = [];
let rows = [];
let activeIndex = -2;
let songStart = 0;
let source = '';
let filename = '';
let transport = { state: 0, position: 0, repeat: false };
let connected = false;
let following = true;
let pendingCommands = [];
let centeredIndex = -2;
let noticeKind = '';
let noticeMessage = '';
let noticeValues = {};
let songArtist = '';
let recordPending = false;
let followAnimation = null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const pageUrl = location.protocol === 'file:' ?
  new URL('http://127.0.0.1:9090/reaper-lyrics/index.html') : new URL('./index.html', location.href);
$('server-link').href = pageUrl.href;
$('server-link').textContent = pageUrl.href;
$('server-port').textContent = pageUrl.port || (pageUrl.protocol === 'https:' ? '443' : '80');

function notice(message, kind = 'info', values = {}) {
  noticeMessage = message;
  noticeValues = values;
  const translated = t(message, values);
  if ($('notice').textContent !== translated) $('notice').textContent = translated;
  $('notice').hidden = !message;
  noticeKind = message ? kind : '';
  $('notice').dataset.kind = kind;
  requestAnimationFrame(() => centerCurrent(true));
}

function saveSession() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ source, filename, songStart }));
  } catch {
    notice('浏览器无法保存本次歌词；当前仍可使用，刷新后需重新导入。', 'storage');
  }
}

function setFollowing(value, animate = false) {
  following = value;
  $('follow-button').setAttribute('aria-pressed', String(value));
  $('follow-label').textContent = value ? t('自动跟随') : t('回到当前歌词');
  if (value) centerCurrent(true, animate);
  else cancelFollowMotion(true);
}

function cancelFollowMotion(preservePosition = false) {
  if (!followAnimation) return;
  const lyrics = $('lyrics');
  const top = preservePosition ? lyrics.getBoundingClientRect().top : 0;
  followAnimation.cancel();
  followAnimation = null;
  // 用户接管滚动时，保留动画当前的视觉位置。
  if (preservePosition) $('lyric-stage').scrollTop -= top - lyrics.getBoundingClientRect().top;
}

function centerCurrent(force = false, animate = false) {
  if (!following || !rows.length || (!force && centeredIndex === activeIndex)) return;
  cancelFollowMotion(animate);
  const target = rows[Math.max(0, activeIndex)];
  const stage = $('lyric-stage');
  const previousTop = stage.scrollTop;
  const top = stage.scrollTop + target.getBoundingClientRect().top -
    stage.getBoundingClientRect().top - stage.clientHeight / 2 + target.clientHeight / 2;
  // 同步位置始终立即写入；只有鼠标/触摸恢复跟随时补一个短暂的视觉过渡。
  stage.scrollTop = top;
  centeredIndex = activeIndex;
  const distance = stage.scrollTop - previousTop;
  const lyrics = $('lyrics');
  if (animate && !reducedMotion.matches && !document.hidden && lyrics.animate &&
      Math.abs(distance) > 1 && Math.abs(distance) <= stage.clientHeight) {
    const animation = lyrics.animate([
      { transform: `translateY(${distance}px)` },
      { transform: 'translateY(0)' },
    ], { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    followAnimation = animation;
    animation.onfinish = () => { if (followAnimation === animation) followAnimation = null; };
  }
}

function updateDisplay() {
  $('project-time').textContent = formatTime(transport.position);
  const lyricTime = transport.position - songStart;
  $('lyric-time').textContent = formatTime(lyricTime);
  const next = findCue(cues, lyricTime);
  if (next !== activeIndex) {
    activeIndex = next;
    rows.forEach((row, index) => {
      row.classList.toggle('active', index === next);
      if (index === next) row.setAttribute('aria-current', 'true');
      else row.removeAttribute('aria-current');
    });
    $('line-position').textContent = cues.length ? `${next + 1} / ${cues.length}` : '— / —';
    centerCurrent();
  }
  const playing = Boolean(transport.state & 1);
  const recording = Boolean(transport.state & 4);
  const stateNames = { 0: t('已停止'), 1: t('播放中'), 2: t('已暂停'), 5: t('录音中'), 6: t('录音已暂停') };
  $('play-state').textContent = connected ? stateNames[transport.state] : t('等待连接');
  $('repeat-state').textContent = connected && transport.repeat ? t('循环已开启') : 'REAPER';
  $('state-dot').classList.toggle('playing', connected && playing);
  $('state-dot').classList.toggle('recording', connected && recording);
  $('record-button').disabled = !connected || recording || recordPending;
  $('record-button').classList.toggle('recording', connected && recording);
  $('record-label').textContent = recordPending ? t('准备中') : connected && recording ?
    (transport.state & 2 ? t('录制暂停') : t('录制中')) : t('录制');
  $('play-icon').textContent = playing ? 'Ⅱ' : '▶';
  $('play-label').textContent = playing ? t('暂停') : t('播放');
  $('stage-caption').textContent = !cues.length ? t('在 REAPER 中播放，歌词将在这里跟随。') :
    !connected ? t('歌词已就绪，等待 REAPER 连接。') :
      activeIndex < 0 ? t('等待第一句 · 点击歌词可定位') : t('点击任一句，定位 REAPER · 滚动可自由浏览');
}

function setConnection(value) {
  if (value !== connected) {
    connected = value;
    for (const id of ['play-button', 'stop-button', 'align-button']) $(id).disabled = !value;
    rows.forEach(row => { row.disabled = !value; });
  }
  $('connection').classList.toggle('connected', value);
  const label = value ? t('REAPER 已连接') : t('REAPER 未连接');
  if ($('connection-label').textContent !== label) $('connection-label').textContent = label;
}

function loadLyrics(text, name, start = 0) {
  const parsed = parseLrc(text);
  cancelFollowMotion();
  cues = parsed.cues;
  source = text;
  filename = name;
  songStart = start;
  $('song-start').value = String(start);
  $('song-title').textContent = parsed.title || name.replace(/\.(lrc|txt)$/i, '');
  songArtist = parsed.artist;
  $('artist').textContent = songArtist || t('与 REAPER 同步');
  $('file-note').textContent = t('{name} · {count} 个时间点', { name, count: cues.length });
  $('empty-state').hidden = true;
  $('lyrics').hidden = false;
  const fragment = document.createDocumentFragment();
  rows = cues.map(cue => {
    const row = document.createElement('button');
    row.className = 'lyric-row';
    row.disabled = !connected;
    const time = document.createElement('time');
    time.textContent = formatTime(cue.time);
    const textNode = document.createElement('span');
    textNode.className = 'lyric-text';
    textNode.textContent = cue.text || t('♪ 间奏');
    row.append(time, textNode);
    row.addEventListener('click', () => {
      if (!connected) return;
      pendingCommands.push('SET/POS/' + Math.max(0, cue.time + songStart).toFixed(4));
      setFollowing(true);
    });
    fragment.append(row);
    return row;
  });
  $('lyrics').replaceChildren(fragment);
  activeIndex = -2;
  centeredIndex = -2;
  following = true;
  updateDisplay();
  setFollowing(true);
}

async function importFile(file) {
  if (!file) return;
  try {
    loadLyrics(await file.text(), file.name);
    notice('已导入歌词，伴奏起点已重置为 0。可在时间对齐中调整。');
    saveSession();
  } catch (error) { notice(error.message, 'import'); }
}

function applyLanguage() {
  cancelFollowMotion();
  LyricsI18n.translatePage();
  $('language-select').value = LyricsI18n.language;
  if (!source) {
    $('song-title').textContent = t('歌词');
    $('file-note').textContent = t('选择 LRC 文件，或将文件拖入窗口。');
  } else {
    $('file-note').textContent = t('{name} · {count} 个时间点', { name: filename, count: cues.length });
    rows.forEach((row, index) => {
      if (!cues[index].text) row.querySelector('.lyric-text').textContent = t('♪ 间奏');
    });
  }
  $('artist').textContent = songArtist || t('与 REAPER 同步');
  $('follow-label').textContent = t(following ? '自动跟随' : '回到当前歌词');
  setConnection(connected);
  updateDisplay();
  notice(noticeMessage, noticeKind, noticeValues);
}

$('language-select').addEventListener('change', event => {
  LyricsI18n.setLanguage(event.target.value);
  applyLanguage();
});

$('import-button').addEventListener('click', () => $('file-input').click());
$('file-input').addEventListener('change', event => {
  importFile(event.target.files[0]);
  event.target.value = '';
});
$('sample-button').addEventListener('click', () => {
  loadLyrics(sample, 'example.lrc');
  notice('示例歌词已载入。请在 REAPER 中播放或移动时间光标；此页面不播放音频。');
  saveSession();
});
$('song-start').addEventListener('change', event => {
  const value = event.target.valueAsNumber;
  if (!Number.isFinite(value)) {
    event.target.value = String(songStart);
    notice('伴奏起点请输入有效秒数。');
    return;
  }
  songStart = value;
  updateDisplay();
  centerCurrent(true);
  saveSession();
});
$('align-button').addEventListener('click', () => {
  if (!connected) return;
  songStart = Math.round(transport.position * 1000) / 1000;
  $('song-start').value = String(songStart);
  updateDisplay();
  centerCurrent(true);
  notice('已设置伴奏起点。切换歌曲或 REAPER 工程时，请重新核对歌词和起点。');
  saveSession();
});
$('follow-button').addEventListener('click', event => setFollowing(!following, event.detail > 0));
for (const type of ['wheel', 'touchmove']) {
  $('lyric-stage').addEventListener(type, () => setFollowing(false), { passive: true });
}
$('lyric-stage').addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) setFollowing(false);
});
$('play-button').addEventListener('click', () => {
  if (connected) pendingCommands.push(transport.state & 1 ? '1008' : '1007');
});
$('stop-button').addEventListener('click', () => {
  if (connected) pendingCommands.push('1016');
});
$('record-button').addEventListener('click', () => {
  if (!connected || recordPending || (transport.state & 4)) return;
  recordPending = true;
  if (noticeKind === 'recording') notice('');
  pendingCommands.push('1013');
  updateDisplay();
});
let dragDepth = 0;
window.addEventListener('dragenter', event => {
  if (!event.dataTransfer.types.includes('Files')) return;
  event.preventDefault();
  dragDepth++;
  document.body.classList.add('dragging');
});
window.addEventListener('dragover', event => {
  if (event.dataTransfer.types.includes('Files')) event.preventDefault();
});
window.addEventListener('dragleave', () => {
  if (--dragDepth <= 0) document.body.classList.remove('dragging');
});
window.addEventListener('drop', event => {
  event.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('dragging');
  importFile(event.dataTransfer.files[0]);
});
window.addEventListener('resize', () => centerCurrent(true));
const compactLayout = window.matchMedia('(max-width: 760px)');
function updateSettingsLayout() {
  $('session-settings').open = !compactLayout.matches;
  requestAnimationFrame(() => centerCurrent(true));
}
updateSettingsLayout();
compactLayout.addEventListener('change', updateSettingsLayout);
$('session-settings').addEventListener('toggle', () => centerCurrent(true));
document.addEventListener('visibilitychange', () => {
  cancelFollowMotion();
  if (!document.hidden) centerCurrent(true);
});
reducedMotion.addEventListener('change', () => cancelFollowMotion());
document.addEventListener('keydown', () => {
  document.body.dataset.input = 'keyboard';
  cancelFollowMotion();
});
document.addEventListener('pointerdown', () => { document.body.dataset.input = 'pointer'; });

async function poll() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  // 命令和状态读取串行执行；失败的控制命令不在重连后重放。
  let commands = pendingCommands.splice(0);
  const recordingRequested = commands.includes('1013');
  try {
    if (recordingRequested) {
      const check = await fetch('/_/TRACK;TRANSPORT', { cache: 'no-store', signal: controller.signal });
      if (!check.ok) throw new Error('无法检查录音轨，请确认 REAPER 连接正常后重试。');
      const reply = await check.text();
      const current = parseTransport(reply);
      // 只读取预备状态，不替用户选择轨道；也不切换已有的录音状态。
      if ((current.state & 4) || !hasArmedTrack(reply)) {
        commands = commands.filter(command => command !== '1013');
        if (!(current.state & 4)) {
          notice('未检测到已预备的录音轨。请在 REAPER 中选择轨道、设置输入并开启 Record Arm，再点击录制。', 'recording');
        }
      }
    }
    const response = await fetch('/_/' + [...commands, 'TRANSPORT'].join(';'), {
      cache: 'no-store', signal: controller.signal,
    });
    if (!response.ok) throw Object.assign(new Error('连接失败（HTTP {status}），请确认 REAPER 网页服务已启用。'), { values: { status: response.status } });
    const nextTransport = parseTransport(await response.text());
    const elapsed = nextTransport.position - transport.position;
    if (commands.length || nextTransport.state !== transport.state || elapsed < 0 || elapsed > 0.5) cancelFollowMotion();
    transport = nextTransport;
    setConnection(true);
    if (noticeKind === 'connection') notice('');
  } catch (error) {
    cancelFollowMotion();
    pendingCommands = [];
    setConnection(false);
    notice(error.name === 'AbortError' ? '连接超时，正在重试。请确认 REAPER 正在运行、网页服务已开启。' :
      error.message === 'Failed to fetch' ? '无法连接 REAPER，正在重试。请通过 REAPER 网页服务打开，检查地址与端口。' : error.message, 'connection', error.values);
  } finally {
    clearTimeout(timeout);
    if (recordingRequested || !connected) recordPending = false;
    updateDisplay();
    setTimeout(poll, connected ? 100 : 1500);
  }
}

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (saved && saved.source) {
    const oldSource = saved.source.replace(/\r\n/g, '\n').trim();
    const isLegacyDemo = oldSource === legacySample ||
      oldSource === legacySample.replace('请配合 REAPER 时间轴测试', '用于 REAPER 同步测试');
    loadLyrics(isLegacyDemo ? sample : saved.source, isLegacyDemo ? 'example.lrc' : saved.filename || 'lyrics.lrc',
      Number.isFinite(saved.songStart) ? saved.songStart : 0);
    if (isLegacyDemo) saveSession();
    notice('已恢复上次歌词与伴奏起点。若切换了 REAPER 工程，请重新导入对应歌词。');
  }
} catch { notice('无法恢复上次歌词，请重新导入。'); }
applyLanguage();
if (location.protocol === 'file:') {
  setConnection(false);
  notice('当前为本地预览。请按“连接 REAPER”中的说明，通过 REAPER 网页地址打开。', 'connection');
} else poll();
