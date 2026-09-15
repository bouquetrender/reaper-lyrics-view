(function (root) {
  'use strict';

  function parseLrc(source) {
    const metadata = {};
    const entries = [];
    const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
    for (const line of lines) {
      const tag = line.match(/^\s*\[(ti|ar|al|offset):([^\]]*)\]/i);
      if (tag) metadata[tag[1].toLowerCase()] = tag[2].trim();
    }
    const offset = Number(metadata.offset || 0);
    if (!Number.isFinite(offset)) throw new Error('LRC 的 offset 必须是毫秒数。');
    for (const line of lines) {
      const pattern = /\[(\d+):([0-5]\d)(?:[.:](\d{1,3}))?\]/g;
      const stamps = [...line.matchAll(pattern)];
      if (!stamps.length) continue;
      const text = line.replace(pattern, '').trim();
      for (const stamp of stamps) {
        const time = Number(stamp[1]) * 60 + Number(stamp[2]) +
          Number('0.' + (stamp[3] || '0')) - offset / 1000;
        entries.push({ time, text });
      }
    }
    entries.sort((a, b) => a.time - b.time);
    const cues = [];
    for (const entry of entries) {
      const previous = cues[cues.length - 1];
      if (previous && previous.time === entry.time) {
        if (entry.text) previous.text += (previous.text ? '\n' : '') + entry.text;
      } else cues.push({ ...entry });
    }
    if (!cues.some(cue => cue.text)) {
      throw new Error('没有找到带时间戳的歌词。请导入包含 [00:12.50]歌词 的 UTF-8 LRC 文件。');
    }
    return { title: metadata.ti || '', artist: metadata.ar || '', cues };
  }

  function findCue(cues, time) {
    let low = 0;
    let high = cues.length - 1;
    let index = -1;
    while (low <= high) {
      const middle = (low + high) >>> 1;
      if (cues[middle].time <= time) {
        index = middle;
        low = middle + 1;
      } else high = middle - 1;
    }
    return index;
  }

  function parseTransport(body) {
    const line = body.split('\n').find(row => row.startsWith('TRANSPORT\t'));
    if (!line) throw new Error('未收到 REAPER 时间数据，请通过 REAPER 网页服务器打开此页面。');
    const fields = line.trim().split('\t');
    const state = Number(fields[1]);
    const position = Number(fields[2]);
    if (fields.length < 4 || ![0, 1, 2, 5, 6].includes(state) ||
        !fields[1] || !fields[2] || !Number.isFinite(position)) {
      throw new Error('REAPER 返回的播放状态或时间无效。');
    }
    return { state, position, repeat: fields[3] !== '0' };
  }

  function formatTime(seconds) {
    const negative = seconds < 0;
    const ticks = Math.round(Math.abs(seconds) * 100);
    const minutes = Math.floor(ticks / 6000);
    const secs = Math.floor(ticks / 100) % 60;
    return (negative ? '−' : '') + String(minutes).padStart(2, '0') + ':' +
      String(secs).padStart(2, '0') + '.' + String(ticks % 100).padStart(2, '0');
  }

  function hasArmedTrack(body) {
    return body.split('\n').some(line => {
      const fields = line.split('\t');
      return fields[0] === 'TRACK' && Number(fields[1]) > 0 && (Number(fields[3]) & 64) !== 0;
    });
  }

  const api = { parseLrc, findCue, parseTransport, hasArmedTrack, formatTime };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LyricsCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
