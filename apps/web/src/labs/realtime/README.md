# Realtime labs architecture

The Realtime section uses the primitives that match ZomLab's Cloudflare Workers deployment.

- `RealtimeHub` is a hibernating Durable Object WebSocket server. The namespace is sharded by
  coordination atom: the WebSocket demo, each chat room, each presence room, and each authenticated
  notification recipient receive separate objects.
- The browser never supplies an authoritative user, connection ID, or timestamp. The Hono upgrade
  route validates the same-origin request and authenticated Better Auth session before forwarding a
  minimal internal request to the Durable Object.
- Per-connection state is stored in serialized WebSocket attachments so it survives hibernation.
  Presence is ephemeral; application heartbeats plus a Durable Object alarm expire stale sessions.
- Chat messages are validated, trimmed, rate limited, persisted to PostgreSQL, then broadcast. The
  bounded history endpoint provides reconnect recovery.
- Notifications are created and mutated through authenticated HTTP endpoints. Each operation writes
  PostgreSQL first and then publishes to the recipient's Durable Object. Clients deduplicate by the
  database ID and refetch after reconnects.
- SSE remains a separate abort-aware Hono HTTP stream. It demonstrates named events, JSON payloads,
  IDs, heartbeats, EventSource retries, and cancellation. `Last-Event-ID` resumes the demo sequence;
  it is not a durable event replay log.

WebSocket delivery is at-most-once. Persistent chat and notification state closes the delivery gap
after reconnect, while transient demo and presence events are intentionally not replayed. Local
development uses Wrangler's Durable Object simulation; production uses the same binding and
hibernation API. A single object still has per-shard practical throughput limits, so a high-volume
production system would choose finer room sharding or a dedicated fan-out layer rather than a global
singleton.
