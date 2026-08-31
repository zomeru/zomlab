import handler from "@tanstack/react-start/server-entry";

export { RealtimeHub } from "~/realtime/realtime-hub";

export default {
  async fetch(request) {
    return handler.fetch(request);
  },
} satisfies ExportedHandler<Cloudflare.Env>;
