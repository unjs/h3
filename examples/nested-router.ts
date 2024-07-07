import { createApp, createRouter, useBase, redirect } from "h3";

// Init App
export const app = createApp({ debug: true });

// Main Router
const router = createRouter();
router.use("/", (event) => redirect(event, "/api/test"));
app.use(router);

// Nested API Router
const apiRouter = createRouter();
router.use("/api/**", useBase("/api", apiRouter.handler));
apiRouter.use("/test", () => "API /test");
