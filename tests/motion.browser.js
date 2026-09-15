// 启动 mock-server.py 后，在该页面的浏览器控制台执行 verifyMotion()。
// 只允许模拟服务器；不会发送真实 REAPER 控制命令。
async function verifyMotion() {
  if (location.origin !== 'http://127.0.0.1:9911') throw new Error('请在本机 9911 模拟服务器运行');
  const results = [];
  const check = (name, ok) => { if (!ok) throw new Error(name); results.push(name); };
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
  const state = value => fetch('/__test', { method: 'POST', body: JSON.stringify(value) });
  const stage = document.getElementById('lyric-stage');
  const lyrics = document.getElementById('lyrics');
  const button = document.getElementById('follow-button');
  const active = () => lyrics.querySelector('[aria-current="true"]');
  const centered = () => Math.abs(active().getBoundingClientRect().top + active().clientHeight / 2 -
    stage.getBoundingClientRect().top - stage.clientHeight / 2) < 1;
  const recover = (distance = 80, detail = 1) => {
    setFollowing(true);
    stage.dispatchEvent(new WheelEvent('wheel'));
    stage.scrollTop += distance;
    document.dispatchEvent(new PointerEvent('pointerdown'));
    button.dispatchEvent(new MouseEvent('click', { detail, bubbles: true }));
    return lyrics.getAnimations()[0];
  };
  await state({ state: 0, position: 10, offline: false });
  document.getElementById('sample-button').click();
  await wait(300);

  let animation = recover();
  check('鼠标恢复跟随使用 180ms transform 过渡', animation?.effect.getTiming().duration === 180 &&
    animation.effect.getKeyframes().every(key => typeof key.transform === 'string'));
  await animation.finished;
  await frame();
  check('结束时当前歌词精确居中且没有残留动画', centered() && lyrics.getAnimations().length === 0);

  animation = recover();
  animation.pause();
  animation.currentTime = 60;
  const visualTop = active().getBoundingClientRect().top;
  stage.dispatchEvent(new WheelEvent('wheel'));
  check('滚动打断动画并保留视觉位置', lyrics.getAnimations().length === 0 &&
    Math.abs(active().getBoundingClientRect().top - visualTop) < 1 && button.getAttribute('aria-pressed') === 'false');

  animation = recover();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  check('键盘输入立即清除运动和按钮过渡', lyrics.getAnimations().length === 0 &&
    getComputedStyle(button).transitionDuration === '0s');
  setFollowing(false);
  stage.scrollTop += 80;
  button.dispatchEvent(new MouseEvent('click', { detail: 0, bubbles: true }));
  check('键盘恢复跟随即时居中', centered() && lyrics.getAnimations().length === 0);

  animation = recover(stage.clientHeight + 40);
  check('跨屏恢复直接定位', !animation && centered());

  const media = reducedMotion;
  try {
    animation = recover();
    Object.defineProperty(media, 'matches', { configurable: true, value: true });
    media.dispatchEvent(new Event('change'));
    check('开启减少动态效果立即停止运动', lyrics.getAnimations().length === 0);
    check('减少动态效果下恢复跟随不位移', !recover() && centered());
  } finally {
    delete media.matches;
  }

  animation = recover();
  animation.pause();
  animation.currentTime = 60;
  window.dispatchEvent(new Event('resize'));
  check('窗口调整清除旧运动并重新居中', lyrics.getAnimations().length === 0 && centered());

  await state({ state: 1, position: 14.98 });
  await wait(250);
  check('正常播放切句即时高亮和居中', active().querySelector('time').textContent === '00:15.00' &&
    centered() && lyrics.getAnimations().length === 0);
  await state({ position: 5, repeat: true });
  await wait(150);
  check('循环跳回即时定位', active().querySelector('time').textContent === '00:05.00' && centered());
  await state({ state: 0, position: 10, repeat: false });
  await wait(150);

  animation = recover();
  animation.pause();
  await state({ offline: true });
  await wait(300);
  check('断线清除运动且禁用录制', lyrics.getAnimations().length === 0 &&
    document.getElementById('record-button').disabled);
  await state({ offline: false });
  await wait(1700);
  check('重连后定位准确', centered() && document.getElementById('connection-label').textContent === t('REAPER 已连接'));

  const row = active();
  const before = row.getBoundingClientRect().height;
  row.classList.remove('active');
  const after = row.getBoundingClientRect().height;
  row.classList.add('active');
  check('歌词高亮切换不改变行高', before === after);
  check('页面没有横向溢出', document.documentElement.scrollWidth <= innerWidth);
  return results;
}
