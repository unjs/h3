import { createH3, defineWebSocketHandler } from "h3";

export const app = createH3();

app.use(() =>
  fetch(
    "https://raw.githubusercontent.com/unjs/crossws/main/examples/h3/public/index.html",
  ).then((r) => r.text()),
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
