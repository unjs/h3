import { createApp, eventHandler, toPlainHandler } from "./dist/index.mjs";

export const app = createApp();

app.use(eventHandler(() => "Hello world!"));

const handlerRequest = toPlainHandler(app);

const response = await handlerRequest({
  method: "GET",
  path: "/",
  headers: {
    "x-test": "test"
  },
  body: undefined,
  context: {},
})

/**
{
  status: 200,
  statusText: '',
  headers: [ [ 'content-type', 'text/html' ] ],
  body: 'Hello world!'
}
 */
