import {
  createApp,
  eventHandler,
  upgradeWebSocket,
  isWebSocketUpgradeRequest,
  isWebSocketEvent,
  toWebSocketEvent,
} from "h3";
export const app = createApp();

app.use(
  "/",
  eventHandler((event) => {
    if (isWebSocketEvent(event)) {
      const wsEvent = toWebSocketEvent(event);
      if (wsEvent.type === "connection") {
        wsEvent.connection.send("pong");
      } else if (wsEvent.type === "message") {
        console.log("got", new TextDecoder().decode(wsEvent.message));
      }
    }
    if (isWebSocketUpgradeRequest(event)) {
      return upgradeWebSocket(event);
    }

    return `<h1>Hello World!</h1><script type="module">
      const ws = new WebSocket("ws://localhost:3000");
      await new Promise((resolve) => ws.addEventListener("open", resolve));
      ws.addEventListener("message", (event) => {
        console.log(event.data);
        ws.send("ping from client");
      });
      ws.send("pong");
    </script>`;
  }),
);
