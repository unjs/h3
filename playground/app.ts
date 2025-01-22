import {
  createApp,
  defineEventHandler,
  defineWebSocketHandler,
  useSession,
  type SessionConfig,
} from "h3";

export const app = createApp();

const sessionConfig: SessionConfig = {
  password: "oee aaa ee o ee aa eeo ee aaa ee o ee",
};

app.use(
  "/ws",
  defineWebSocketHandler({
    async upgrade(request) {
      const session = await useSession(request, sessionConfig);
      console.log(`[upgrade] Session id: ${session.id}`);
      return {};
    },
    async open(peer) {
      const session = await useSession(peer, sessionConfig);
      console.log(`[open] Session id: ${session.id}`);
      peer.send(`Hello, ${session.id}!`);
    },
  }),
);

app.use(
  defineEventHandler(async (event) => {
    // [IMPORTANT] init the session before first WebSocket upgrade
    const session = await useSession(event, sessionConfig);

    return /* html */ `
    <div>Session id: ${session.id}</div>
    <pre id="output"></pre>
    <script type="module">
      const log = (...args) => {
        console.log(...args);
        output.textContent += args.join(' ') + '\\n';
      };
      const output = document.getElementById('output');
      const url = new URL('ws', location).href.replace(/^http/, 'ws')
      const ws = new WebSocket(url);
      ws.onopen = () => { log('[ws] Opened'); };
      ws.onclose = () => { log('[ws] Closed'); };
      ws.onmessage = (event) => { log('[ws] Message:', event.data); };
    </script>
  `;
  }),
);
