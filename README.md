# LYRIC VIEW

**English** | [简体中文](README.zh-CN.md)

LYRIC VIEW is a lightweight web-based lyrics panel for REAPER. It uses REAPER’s built-in web server to synchronize timestamped LRC lyrics, with click-to-seek and play, pause, stop, and record controls. The interface supports English and Chinese, defaults to English, and requires no build step or additional backend. REAPER handles all audio playback and recording.

## Features

- **Line-by-line synchronization**: Highlights and centers the current lyric using REAPER’s project time. Manual scrolling pauses automatic following while highlighting continues.
- **Two-way navigation**: Changes to REAPER’s time position update the lyrics; clicking a lyric line seeks REAPER to that line.
- **Transport and recording controls**: Play, pause, stop, and record. Recording checks for an armed track before starting.
- **Timing adjustment**: Set the backing track’s start time manually or use REAPER’s current position. LRC `offset` is also supported.
- **Import and restore**: Import or drop a lyrics file, restore the last lyrics and track start saved in the current browser, or try the included English demo.
- **Interface preferences**: Switch between English and Chinese, with the choice remembered. Responsive layouts follow system preferences for light/dark appearance, reduced motion, and related accessibility settings.

## Requirements

- REAPER must be running with its **Web browser interface** enabled.
- Open this project in a modern browser through the **URL served by REAPER**.
- Use a timestamped, UTF-8 LRC file matching your backing track.

The page does not play audio, access the browser’s microphone, or generate lyrics or timestamps. Opening the HTML directly, using a generic static server, or hosting it on GitHub Pages allows an interface preview, but does not replace REAPER’s synchronization API.

## Installation

### 1. Copy the project into REAPER’s user web directory

1. Download or clone this project. Name the folder containing `index.html` **`reaper-lyrics`**.
2. In REAPER, open **Preferences / Settings → Control/OSC/web** and click **Add**. Menu names may vary by version or language pack.
3. Set **Control surface mode** to **Web browser interface**.
4. Click **User pages…** and copy the entire `reaper-lyrics` folder into the directory that opens.

Use the directory opened by **User pages…**. You can also locate the resource directory through **Options → Show REAPER resource path in Finder**, then open `reaper_www_root`. On a standard macOS installation, the user web directory is:

```text
~/Library/Application Support/REAPER/reaper_www_root/
```

The resulting structure should look like this. Avoid an extra nested download folder, and do not modify files inside the REAPER application:

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

The README files and `tests/` are not required to run the page.

### 2. Enable the web server

1. Enable **Run web server on port** and enter an available port, such as **9090**.
2. **Use rc.reaper.fm** is not required for use on the same computer. You can leave **Default interface** unchanged.
3. Click **OK** to save, then close the outer preferences window.
4. Keep REAPER running and open [LYRIC VIEW](http://127.0.0.1:9090/reaper-lyrics/index.html).

**REAPER connected** means the page has received timing data. If you change the port, replace `9090` in the URL. If you rename the folder, update the URL path as well. When **Username:password** is configured, the browser will ask you to sign in.

## Usage

### Import and align lyrics

1. Open your backing-track project in REAPER.
2. Click **Import lyrics…** and select an `.lrc` file, or drop it into the window. **Use demo lyrics** loads the English example; no audio is included.
3. Under **Timing**, set **Track start**. If the backing track begins at project time 10 seconds, enter `10`. Alternatively, position REAPER first, then click **Use REAPER position**.
4. Play or change the time position in REAPER to follow the lyrics. Click any lyric line on the page to seek to its corresponding project time.
5. After scrolling manually, click **Resume follow** to restore automatic following.

Selecting an audio item does not necessarily change the playback position. During playback, the page follows the playback time returned by REAPER. Moving only the edit cursor without seeking does not redirect the lyrics away from the audio currently playing.

### Record

1. **Choose a recording track in REAPER, configure its input, and enable Record Arm.** Selecting a track or enabling monitoring alone does not arm it.
2. Disarm any tracks you do not want to record. REAPER records all armed tracks; the page does not select, arm, or disarm tracks for you.
3. Click **Record**. If no armed track is detected, the page shows a message without starting a recording.
4. The Record button is disabled during recording to prevent repeated triggering. Use **Pause** or **Stop** as needed. Handle recording-save dialogs in REAPER.

The Record button uses command `1013`, as used by REAPER’s built-in web interface. Controls are disabled when disconnected, and failed commands are not automatically replayed after reconnection.

### Language and storage

The interface defaults to **English** on first use. Choose **English / 中文** under **Language** in settings. On narrow screens, expand **Lyrics & settings** first.

Changing the language updates the interface, guides, messages, and accessibility labels. Imported lyrics, song metadata, and the track start remain unchanged. The built-in demo and `example.lrc` are in English. Restoring an unmodified Chinese demo from an older version replaces it with the English demo while preserving its track start.

Lyrics, track start, and language preference are stored in the current browser using `localStorage`. Changing devices, browsers, or the hostname/port in the URL may require importing and configuring them again. Clearing site data also removes these records. The project does not provide cloud storage for lyrics.

## LRC format

```text
[ti:One More Take]
[ar:Demo lyrics]
[offset:0]
[00:05.00]Put your headphones on and listen
[00:10.00]Let every word fall into time
[00:15.00]
[00:20.00]From right here, keep singing on
```

- Supports title `ti`, artist `ar`, multiple timestamps on one line, and multiple lyric lines sharing a timestamp.
- An empty timestamped line marks an instrumental section. Add one at the end of a song to prevent the final lyric from staying highlighted.
- LRC `offset` is in milliseconds: positive values display lyrics earlier, negative values later. **Track start** is in seconds; a positive value shifts the whole song’s lyrics later in the project.

Time mapping:

```text
Seek position in project seconds = LRC timestamp in seconds - LRC offset / 1000 + Track start
```

If the result is negative, the page seeks to project time 0.

## Synchronization and limitations

- Synchronization is **line by line**. Word-by-word karaoke highlighting, lyrics editing, and automatic timestamp generation are not supported.
- While connected, the page waits about `100ms` after each request completes before reading the next state. Actual latency depends on the network and browser scheduling; this is not sample-accurate synchronization.
- The page does not advance a local playback clock. After a loop, seek, or playback-rate change, it updates from the latest project time returned by REAPER.
- It does not automatically identify the current song, backing track, or project. Check the LRC file and track start when switching songs, editing the backing track, or using another version. A single start offset cannot correct separate sections that are out of alignment.
- Browsers may throttle background tabs. Keep the lyrics page visible while recording or singing. Normal line changes and seeks update immediately. Resuming follow with a mouse or touch uses a short transition within one screen; longer jumps are immediate.

## Troubleshooting

**Cannot connect, or the page returns 404**

First open the [REAPER home page](http://127.0.0.1:9090/), then check the [timing endpoint](http://127.0.0.1:9090/_/TRANSPORT). The endpoint should return a text line containing `TRANSPORT`, a playback state, and a position in seconds. Substitute your actual port. Check that REAPER is running, preferences are saved, and the folder is not nested one level too deep.

**Control Surface: Error opening port(s)**

Dismiss the error, save and close preferences with OK, then test the timing endpoint. Some older setups can still serve pages after preferences are closed, so the dialog alone does not prove another application owns the port. If the endpoint remains unavailable, check for duplicate web control-surface entries and port conflicts. Avoid repeatedly adding entries or clicking Apply settings followed by OK.

**All lyrics appear early or late**

Adjust Track start. Adding `0.3` seconds makes lyrics appear `0.3` seconds later. If the error grows over time, check that the lyrics and backing track are the same version.

**Using a tablet**

The tablet must be able to reach the REAPER computer over the local network. Use the **Access URL** shown in REAPER’s configuration, append `/reaper-lyrics/index.html`, and import the lyrics in the tablet’s browser. On a tablet, `127.0.0.1` refers to the tablet itself, not the computer. Configure Username:password when using the interface over a local network.

**The old interface remains after updating**

Copy all runtime files into the user web directory again, including `i18n.js`, then force-refresh the page. The in-page connection guide uses the hostname, port, and path from the current page URL.

## Development and testing

Built with plain HTML, CSS, and JavaScript. No npm install or build step is required.

Core and control-flow tests require Node.js 18+. Run these from the project directory:

```sh
node --test tests/core.test.cjs tests/record.test.cjs
```

Tests cover LRC parsing, time mapping, protocol parsing, recording-arm checks, repeated actions, disconnection, and language switching. Control-flow tests use DOM and HTTP substitutes; they do not validate real audio recording.

For browser testing, start the mock server with Python 3:

```sh
python3 tests/mock-server.py
```

Open the [mock page](http://127.0.0.1:9911/index.html). Paste the relevant test file into that page’s browser console, then run its command:

| Test file | Command | Coverage |
| --- | --- | --- |
| `tests/motion.browser.js` | `await verifyMotion()` | Follow transitions, scroll interruption, keyboard input, reduced-motion branches, loops, and reconnection |
| `tests/language.browser.js` | `await verifyLanguage()` | Translations, English demo, lyric preservation, error messages, and isolation from control commands |

Mock tests replace the mock page’s lyrics and playback state. They run only on the local `9911` page and do not connect to real REAPER. For actual use, open the page through REAPER’s own server.

## References

- `reaper_www_root/main.js`, `lyrics.html`, and `index.html` included with REAPER: references for web communication and control commands.
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines): references for layout, typography, color, and accessibility. This project uses web technologies, not native Apple components.
- [Emil Kowalski — Design Engineering](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md): references for brief feedback, interruptible motion, and immediate responses to frequent actions.
