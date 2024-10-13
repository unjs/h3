import { createH3, redirect, withBase } from "h3";

// Init App
export const app = createH3({ debug: true });

// Main Router
app.use("/", (event) => redirect(event, "/api/test"));

const apiRouter = createH3();
// Nested API Router
app.use("/api/**", withBase("/api", apiRouter.handler));
apiRouter.use("/test", () => "API /test");
