import { Hono } from "hono";

const app = new Hono();

app.get("/api/health", (context) => context.json({ status: "scaffold" }));

export default app;
