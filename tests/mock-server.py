"""仅用于开发验证：模拟 REAPER HTTP 协议，不连接真实 REAPER。"""
import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
state = {"state": 0, "position": 0.0, "cursor": 0.0, "repeat": False, "offline": False, "armed": False}
last_time = time.monotonic()
history = []


def advance():
    global last_time
    now = time.monotonic()
    if state["state"] & 1:
        state["position"] += now - last_time
        if state["repeat"] and state["position"] >= 20:
            state["position"] = 5.0
    last_time = now


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass

    def reply(self, body, status=200):
        data = body.encode()
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        advance()
        if self.path == '/__test':
            self.reply(json.dumps({**state, "history": history}))
        elif self.path.startswith('/_/'):
            if state['offline']:
                self.reply('Service offline', 503)
                return
            for command in unquote(self.path[3:]).split(';'):
                if command not in ('TRANSPORT', 'TRACK'):
                    history.append(command)
                if command.startswith('SET/POS/'):
                    state['position'] = state['cursor'] = float(command[8:])
                elif command == '1007':
                    state['state'] = 5 if state['state'] & 4 else 1
                elif command == '1008':
                    state['state'] = 6 if state['state'] & 4 else 2
                elif command == '1013':
                    state['state'] = 5
                elif command == '1016':
                    state['state'] = 0
                    state['position'] = state['cursor']
            tracks = f"TRACK\t1\tRecording track\t{64 if state['armed'] else 2}\n" if 'TRACK' in self.path[3:].split(';') else ''
            self.reply(tracks + f"TRANSPORT\t{state['state']}\t{state['position']:.6f}\t{int(state['repeat'])}\t00:00\t1.1.00\n")
        else:
            super().do_GET()

    def do_POST(self):
        if self.path != '/__test':
            self.reply('Not found', 404)
            return
        advance()
        data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        state.update({key: value for key, value in data.items() if key in state})
        self.reply('OK')


print('Mock REAPER: http://127.0.0.1:9911/index.html (不连接真实 REAPER)', flush=True)
HTTPServer(('127.0.0.1', 9911), Handler).serve_forever()
