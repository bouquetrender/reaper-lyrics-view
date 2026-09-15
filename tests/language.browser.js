// 在 9911 模拟网页控制台粘贴本文件后，执行 await verifyLanguage()。
async function verifyLanguage() {
  if (location.origin !== 'http://127.0.0.1:9911') throw new Error('请使用本机模拟服务器');
  const results = [];
  const check = (name, passed) => { if (!passed) throw new Error(name); results.push(name); };
  const select = document.getElementById('language-select');
  const change = value => { select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); };
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const history = (await (await fetch('/__test')).json()).history;
  change('en');
  check('英文覆盖所有静态文案和辅助标签', [...document.querySelectorAll('[data-i18n], [data-i18n-aria-label], [data-i18n-title]')].every(element =>
    !/[\u4e00-\u9fff]/.test(element.hasAttribute('data-i18n') ? element.textContent : element.getAttribute('aria-label') || element.title)));
  document.getElementById('sample-button').click();
  await wait(100);
  const demo = await (await fetch('example.lrc')).text();
  check('内置示例与 example.lrc 相同且全英文', source === demo.trim() && !/[\u4e00-\u9fff]/.test(demo));
  const nodes = [...document.querySelectorAll('.lyric-row')];
  const stage = document.getElementById('lyric-stage');
  stage.dispatchEvent(new WheelEvent('wheel'));
  stage.scrollTop += 50;
  const scrollTop = stage.scrollTop;
  const original = source;
  change('zh-CN');
  await wait(50);
  check('中文切换即时生效并记住偏好', document.documentElement.lang === 'zh-CN' &&
    localStorage.getItem('lyric-view-language') === 'zh-CN' && document.getElementById('import-button').textContent === '导入歌词…');
  check('切换不重建歌词，不重置浏览模式和滚动位置', source === original &&
    nodes.every((node, index) => node === document.querySelectorAll('.lyric-row')[index]) &&
    !following && Math.abs(stage.scrollTop - scrollTop) < 1);
  check('当前提示和间奏标签同步翻译', /示例歌词已载入/.test(document.getElementById('notice').textContent) && nodes[0].textContent.includes('间奏'));
  change('en');
  await importFile(new File(['ordinary lyrics'], 'invalid.lrc'));
  check('LRC 解析错误使用英文', /No timestamped lyrics/.test(document.getElementById('notice').textContent));
  change('zh-CN');
  check('现有错误可即时切回中文', /没有找到带时间戳/.test(document.getElementById('notice').textContent));
  loadLyrics('[ti:我的歌曲]\n[ar:我的名字]\n[00:01.00]保留这句中文\n[00:05.00]Keep this line', '我的歌词.lrc', 12.5);
  change('en');
  check('用户歌词及元数据和起点不随语言改变', document.getElementById('song-title').textContent === '我的歌曲' &&
    document.getElementById('artist').textContent === '我的名字' && songStart === 12.5 &&
    document.querySelector('.lyric-text').textContent === '保留这句中文');
  check('切换不发送 REAPER 控制命令', JSON.stringify((await (await fetch('/__test')).json()).history) === JSON.stringify(history));
  document.getElementById('sample-button').click();
  await wait(100);
  check('英文手机布局没有横向溢出', document.documentElement.scrollWidth <= innerWidth);
  return results;
}
