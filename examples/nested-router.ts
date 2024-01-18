import {
  createApp,
  defineEventHandler,
  createRouter,
  useBase,
  sendRedirect,
} from "h3";

// Init App
export const app = createApp({ debug: true });

// Main Router
const router = createRouter();
router.use(
  "/",
  defineEventHandler((event) => sendRedirect(event, "/api/test")),
);
app.use(router);

// Nested API Ruter
const apiRouter = createRouter();
router.use("/api/**", useBase("/api", apiRouter.handler));
apiRouter.use(
  "/test",
  defineEventHandler(() => "API /test"),
);
