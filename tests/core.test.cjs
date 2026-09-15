const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLrc, findCue, parseTransport, hasArmedTrack, formatTime } = require('../lyrics-core.js');

test('解析标题、BOM、不同精度的时间戳和重复段落', () => {
  const song = parseLrc('\uFEFF[ti:测试]\r\n[ar:作者]\r\n[00:10.5][01:00.050]重复句\r\n[00:00.12]第一句');
  assert.equal(song.title, '测试');
  assert.equal(song.artist, '作者');
  assert.deepEqual(song.cues, [
    { time: .12, text: '第一句' }, { time: 10.5, text: '重复句' }, { time: 60.05, text: '重复句' },
  ]);
});

test('LRC 正 offset 提前显示，负 offset 延后显示', () => {
  assert.equal(parseLrc('[offset:500]\n[00:01.00]一句').cues[0].time, .5);
  assert.equal(parseLrc('[offset:-500]\n[00:01.00]一句').cues[0].time, 1.5);
});

test('同一时间的双语歌词合并，保留空时间点作为间奏', () => {
  assert.deepEqual(parseLrc('[00:01.00]中文\n[00:01.00]Translation\n[00:05.00]').cues,
    [{ time: 1, text: '中文\nTranslation' }, { time: 5, text: '' }]);
});

test('无时间戳或全部空白的歌词被拒绝', () => {
  for (const text of ['普通歌词', '[ti:歌曲]', '[00:00.00]', '[00:99.00]错误']) {
    assert.throws(() => parseLrc(text));
  }
});

test('第一句之前、精确边界、循环跳回和最后一句之后', () => {
  const cues = [{ time: 5 }, { time: 10 }, { time: 20 }];
  assert.deepEqual([0, 5, 9.999, 10, 100, 5].map(time => findCue(cues, time)), [-1, 0, 0, 1, 2, 0]);
  assert.equal(findCue([], 10), -1);
});

test('伴奏起点和 LRC 内置 offset 的双向时间映射', () => {
  const cue = parseLrc('[offset:200]\n[00:05.00]一句').cues[0];
  const start = 10;
  const seekPosition = cue.time + start;
  assert.equal(seekPosition, 14.8);
  assert.equal(findCue([cue], seekPosition - start), 0);
  assert.equal(findCue([cue], 14 - start), -1);
});

test('解析实际协议中的停止、播放、暂停、录音和循环标志', () => {
  for (const state of [0, 1, 2, 5, 6]) {
    assert.deepEqual(parseTransport(`TRANSPORT\t${state}\t65.2\t1\t1:05.2\t3.1.00\n`),
      { state, position: 65.2, repeat: true });
  }
  assert.equal(parseTransport('OTHER\t1\nTRANSPORT\t0\t0\t0\n').repeat, false);
});

test('拒绝错误页面、损坏协议和无效时间', () => {
  for (const text of ['<html>404</html>', 'TRANSPORT\t1\tNaN\t0', 'TRANSPORT\t9\t0\t0', 'TRANSPORT\t0\t\t0']) {
    assert.throws(() => parseTransport(text));
  }
});

test('时间显示正确进位并支持负值', () => {
  assert.equal(formatTime(59.999), '01:00.00');
  assert.equal(formatTime(-1.25), '−00:01.25');
});

test('录音预备检查区分选中、监听和预备，不把主轨当录音轨', () => {
  assert.equal(hasArmedTrack('TRACK\t1\tVocal\t2\n'), false);
  assert.equal(hasArmedTrack('TRACK\t1\tVocal\t128\n'), false);
  assert.equal(hasArmedTrack('TRACK\t0\tMASTER\t64\n'), false);
  assert.equal(hasArmedTrack('TRACK\t1\tVocal\t194\n'), true);
  assert.equal(hasArmedTrack('TRACK\t1\tMusic\t2\nTRACK\t2\tVocal\t64\n'), true);
  assert.equal(hasArmedTrack('TRANSPORT\t0\t0\t0\n'), false);
});
