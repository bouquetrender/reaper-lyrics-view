const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../lyrics-core.js');

// 执行实际 app.js；DOM 和 HTTP 使用最小替身，验证按钮到协议命令的流程。
async function setup(url = 'http://127.0.0.1:9090/reaper-lyrics/index.html', savedLanguage = null) {
  const elements = {};
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  for (const [, id] of html.matchAll(/id="([^"]+)"/g)) {
    const attributes = {};
    elements[id] = {
      textContent: '', hidden: false, disabled: false, dataset: {}, events: {},
      classList: { toggle() {} },
      setAttribute(name, value) { attributes[name] = value; },
      getAttribute(name) { return attributes[name]; },
      addEventListener(name, handler) { this.events[name] = handler; },
      click() { if (!this.disabled) this.events.click?.({}); },
    };
  }
  let counter = 0;
  const timers = new Map();
  const server = { flags: 2, state: 0, offline: false, commands: [], requests: [] };
  const context = {
    LyricsCore: core, URL, AbortController, console, location: new URL(url),
    document: { getElementById: id => elements[id], addEventListener() {}, querySelectorAll: () => [], documentElement: {}, body: { dataset: {} } },
    window: { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) },
    localStorage: { getItem: key => key === 'lyric-view-language' ? savedLanguage : null, setItem(key, value) { if (key === 'lyric-view-language') savedLanguage = value; } },
    requestAnimationFrame: fn => fn(),
    setTimeout: (fn, delay) => { const id = ++counter; timers.set(id, { fn, delay }); return id; },
    clearTimeout: id => timers.delete(id),
    fetch: async route => {
      server.requests.push(route);
      if (server.offline) throw new Error('Failed to fetch');
      const commands = route.slice(3).split(';');
      for (const command of commands) {
        if (['1013', '1016', '1007', '1008'].includes(command)) server.commands.push(command);
        if (command === '1013') server.state = 5;
        if (command === '1016') server.state = 0;
        if (command === '1008') server.state = server.state & 4 ? 6 : 2;
        if (command === '1007') server.state = server.state & 4 ? 5 : 1;
      }
      const body = (commands.includes('TRACK') ? `TRACK\t1\tVoice\t${server.flags}\n` : '') +
        `TRANSPORT\t${server.state}\t10\t0\n`;
      return { ok: true, text: async () => body };
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../i18n.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8'), context);
  const settle = () => new Promise(resolve => setImmediate(resolve));
  await settle();
  async function poll() {
    const next = [...timers].find(([, timer]) => timer.fn.name === 'poll');
    assert.ok(next, '应用应继续轮询');
    timers.delete(next[0]);
    await next[1].fn();
    await settle();
  }
  return { elements, server, poll, get savedLanguage() { return savedLanguage; } };
}

test('连接指南使用实际主机、端口和路径，文件预览使用9090', async () => {
  const a = await setup('http://192.168.2.198:9123/custom/index.html');
  assert.equal(a.elements['server-link'].href, 'http://192.168.2.198:9123/custom/index.html');
  assert.equal(a.elements['server-port'].textContent, '9123');
  const b = await setup('file:///Users/ve/Desktop/reaper-lyrics/index.html');
  assert.equal(b.elements['server-link'].href, 'http://127.0.0.1:9090/reaper-lyrics/index.html');
});

test('仅选中轨道时不发送录制命令，并显示预备提示', async () => {
  const { elements: e, server, poll } = await setup();
  e['record-button'].click();
  assert.equal(e['record-button'].disabled, true);
  await poll();
  assert.deepEqual(server.commands, []);
  assert.match(e.notice.textContent, /Record Arm/);
  assert.equal(e['record-button'].disabled, false);
});

test('预备后录制只发送一次，暂停和停止状态正确，不修改轨道', async () => {
  const { elements: e, server, poll } = await setup();
  server.flags = 64;
  e['record-button'].click();
  e['record-button'].click();
  await poll();
  assert.deepEqual(server.commands, ['1013']);
  assert.equal(e['record-label'].textContent, 'Recording');
  assert.equal(e['record-button'].disabled, true);
  e['play-button'].click();
  await poll();
  assert.equal(e['record-label'].textContent, 'Paused');
  assert.equal(e['record-button'].disabled, true);
  e['stop-button'].click();
  await poll();
  assert.equal(e['record-label'].textContent, 'Record');
  assert.equal(e['record-button'].disabled, false);
  assert.ok(server.requests.every(route => !route.includes('SET/TRACK')));
});

test('预检发现 REAPER 已在录音时，不重复切换录音状态', async () => {
  const { elements: e, server, poll } = await setup();
  e['record-button'].click();
  server.state = 5;
  server.flags = 64;
  await poll();
  assert.deepEqual(server.commands, []);
  assert.equal(e['record-label'].textContent, 'Recording');
});

test('录制预检断线后不在重连时重放命令', async () => {
  const { elements: e, server, poll } = await setup();
  server.flags = 64;
  e['record-button'].click();
  server.offline = true;
  await poll();
  assert.equal(e['record-button'].disabled, true);
  server.offline = false;
  await poll();
  assert.deepEqual(server.commands, []);
  assert.equal(e['record-button'].disabled, false);
});


test('首次默认英文，可切中文并即时翻译当前提示，切换不发送控制命令', async () => {
  const app = await setup();
  const { elements: e, server, poll } = app;
  assert.equal(e['language-select'].value, 'en');
  assert.equal(e['play-label'].textContent, 'Play');
  e['record-button'].click();
  await poll();
  assert.match(e.notice.textContent, /No armed track/);
  e['language-select'].events.change({ target: { value: 'zh-CN' } });
  assert.equal(e['play-label'].textContent, '播放');
  assert.match(e.notice.textContent, /未检测到已预备/);
  assert.equal(app.savedLanguage, 'zh-CN');
  e['language-select'].events.change({ target: { value: 'en' } });
  assert.match(e.notice.textContent, /No armed track/);
  assert.equal(app.savedLanguage, 'en');
  assert.deepEqual(server.commands, []);
});

test('恢复保存的中文偏好，未知语言回退英文', async () => {
  const zh = await setup(undefined, 'zh-CN');
  assert.equal(zh.elements['play-label'].textContent, '播放');
  assert.equal(zh.elements['language-select'].value, 'zh-CN');
  const other = await setup(undefined, 'fr');
  assert.equal(other.elements['play-label'].textContent, 'Play');
});
