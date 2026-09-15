# LYRIC VIEW

<img width="100%" height="auto" src="https://github.com/user-attachments/assets/48e02922-51ea-45e4-93e5-5829838c430c" />

**English** | [简体中文](README.zh-CN.md)

A lightweight lyrics panel that synchronizes LRC lyrics through REAPER’s built-in web server. No build step or additional backend is needed. REAPER handles audio playback and recording.

## Features

- Line-by-line highlighting, automatic following, and click-to-seek.
- Play, pause, stop, and record controls.
- LRC file import and drag-and-drop, adjustable track start, and LRC `offset` support.
- English/Chinese interface and light/dark appearance; lyrics, track start, and language saved in the current browser.

## Installation

### 1. Copy the files

1. Download or clone this project. The folder containing `index.html` can have a custom name; the examples below use `reaper-lyrics`.
2. In REAPER, open **Preferences / Settings → Control/OSC/web → Add** and set **Control surface mode** to **Web browser interface**.
3. Click **User pages…** and copy that entire folder into the directory that opens.

Example structure (replace `reaper-lyrics` with your folder name); avoid an extra nested download folder:

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

Use the directory opened by **User pages…**. The README files and `tests/` do not need to be copied.

### 2. Enable the web server

1. Enable **Run web server on port**, enter an available port, and note the number.
2. For use on the same computer, **Use rc.reaper.fm** is unnecessary and **Default interface** can remain unchanged.
3. Click **OK** to save and close preferences. Keep REAPER running.

### 3. Build your URL

On the computer running REAPER, fill in this template and paste it into your browser’s address bar:

```text
http://127.0.0.1:PORT/FOLDER/index.html
```

- **PORT**: Replace with the number entered in **Run web server on port**.
- **FOLDER**: Replace with the actual folder name copied into the user web directory, matching your custom name.
- For example, with port `8080` and folder `reaper-lyrics`, the complete URL is:

```text
http://127.0.0.1:8080/reaper-lyrics/index.html
```

Update the URL whenever you change the port or folder name. **REAPER connected** confirms a successful connection. If **Username:password** is configured, sign in when the browser prompts you.

**Phone or tablet access**: Connect to the same local network. Take the `http://COMPUTER_ADDRESS:PORT` portion of the **Access URL** shown in REAPER and append `/FOLDER/index.html`, replacing `FOLDER` with your actual folder name and avoiding a duplicate `/`. For example, with computer address `192.168.1.20`, port `8080`, and folder `reaper-lyrics`:

```text
http://192.168.1.20:8080/reaper-lyrics/index.html
```

On a phone or tablet, `127.0.0.1` refers to that device itself; use the REAPER computer’s local network address instead. Configure **Username:password** for local network use.

## Usage

1. Open your backing-track project in REAPER, then import or drop a matching UTF-8 `.lrc` file onto the page. The included demo has no audio.
2. Set **Track start**: enter `10` if the backing track starts at project time 10 seconds. Alternatively, position REAPER first, then click **Use REAPER position**.
3. Start playback to follow the lyrics, or click a lyric to seek. After scrolling manually, click **Resume follow**.
4. Before recording, configure the input and enable **Record Arm** on the intended tracks in REAPER; disarm other tracks. The page’s **Record** button records all armed tracks. Handle save dialogs in REAPER.

Switch languages under **Language** in settings; on narrow screens, expand **Lyrics & settings** first. Lyrics and settings are saved in the current browser. Changing browsers, devices, or the URL’s hostname/port may require importing again; clearing site data removes saved records.

## LRC format

```text
[ti:One More Take]
[ar:Demo lyrics]
[offset:0]
[00:05.00]Put your headphones on and listen
[00:10.00]Let every word fall into time
[00:15.00]
```

Multiple timestamps per line are supported. An empty timestamped line marks an instrumental section or ends the final highlight. LRC `offset` is in milliseconds: positive values show lyrics earlier, negative values later. **Track start** is in seconds; positive values shift lyrics later.

## Troubleshooting

- **Cannot connect / 404**: Open `http://COMPUTER_ADDRESS:PORT/_/TRANSPORT` using your actual address; it should return text containing `TRANSPORT`. Check that REAPER is running, the port matches, settings are saved, and the folder is not nested too deeply. Opening the HTML directly or using a generic static server only previews the interface; it cannot synchronize with REAPER.
- **Error opening port(s)**: Save and close preferences with OK, then retry. If it still fails, check for duplicate web control-surface entries or choose another available port and update the browser URL.
- **Lyrics are early or late**: Adjust Track start. Adding `0.3` seconds delays lyrics by `0.3` seconds. If the error grows over time, check that the lyrics and backing track are the same version.
- **Old interface after updating**: Copy all runtime files again, then force-refresh the browser.

Synchronization is line by line; word highlighting, lyrics editing, and automatic timestamp generation are not supported. Check lyrics and track start after switching projects. Keep the page visible while singing or recording to avoid background-tab throttling.

## Development and testing

Plain HTML, CSS, and JavaScript; no dependency installation or build step. Core and control-flow tests require Node.js 18+:

```sh
node --test tests/core.test.cjs tests/record.test.cjs
```

For browser testing, start the mock server with Python 3:

```sh
python3 tests/mock-server.py
```

Open the [mock page](http://127.0.0.1:9911/index.html). Paste `tests/motion.browser.js` or `tests/language.browser.js` into its console, then run `await verifyMotion()` or `await verifyLanguage()`, respectively. Mock tests do not connect to real REAPER or validate actual audio recording.
