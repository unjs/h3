import { H3, serve, proxy, defineWebSocketHandler } from "h3";

export const app = new H3();

const websocketDemoURL =
  "https://raw.githubusercontent.com/unjs/crossws/main/examples/h3/public/index.html";

app.get("/", (event) =>
  proxy(event, websocketDemoURL, { headers: { "Content-Type": "text/html" } }),
);

app.use(
  "/_ws",
  defineWebSocketHandler({
    open(peer) {
      console.log("[ws] open", peer);
    },

    message(peer, message) {
      console.log("[ws] message", peer, message);
      if (message.text().includes("ping")) {
        peer.send("pong");
      }
    },

    close(peer, event) {
      console.log("[ws] close", peer, event);
    },

    error(peer, error) {
      console.log("[ws] error", peer, error);
    },
  }),
);

await serve(app)
  .ready()
  .then((s) => console.log(`Server running at ${s.url}`));
