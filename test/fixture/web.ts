import { toWebHandler } from "../../src";
import { app } from "./app";

const webHandler = toWebHandler(app);

const res = await webHandler(new Request("http://localhost:3000/"), {});

console.log(res);
console.log(await res.text());
