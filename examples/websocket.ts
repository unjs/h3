import { createApp, defineEventHandler, defineWebSocketHandler } from "h3";

export const app = createApp();

app.use(
  defineEventHandler(async () => await import("./_ws").then((m) => m.default)),
);

app.use(
  "/_ws",
  defineWebSocketHandler({
    open(peer) {
      peer.send({ user: "server", message: `Welcome ${peer}!` });
      peer.publish("chat", { user: "server", message: `${peer} joined!` });
      peer.subscribe("chat");
    },
    message(peer, message) {
      if (message.text().includes("ping")) {
        peer.send({ user: "server", message: "pong" });
      } else {
        const msg = {
          user: peer.toString(),
          message: message.toString(),
        };
        peer.send(msg); // echo
        peer.publish("chat", msg);
      }
    },
    close(peer) {
      peer.publish("chat", { user: "server", message: `${peer} left!` });
    },
  }),
);
