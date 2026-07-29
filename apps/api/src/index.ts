import { env } from "@zomlab/env";
import { app } from "./app";

app.listen(env.API_PORT);

console.log(`🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`);
