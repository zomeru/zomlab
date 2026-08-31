export { RealtimeHub } from "~/realtime/realtime-hub";

export default {
  fetch() {
    return new Response("Realtime Worker test entry");
  },
} satisfies ExportedHandler<Cloudflare.Env>;
