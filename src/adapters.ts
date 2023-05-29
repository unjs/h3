import { App, createEvent } from "./";

export const adapterCloudflareWorker = (app: App) => {
  const worker = {
    async fetch(request: Request, env?: any, context?: any) {
      try {
        const event = createEvent(undefined, undefined, request);
        event.context = { cloudflare: { env, context } };
        const response = (await app.handler(event)) as Response;
        return response;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    fire: () => {
      console.log("implement service worker syntax ...");
    },
  };
  return worker;
};
