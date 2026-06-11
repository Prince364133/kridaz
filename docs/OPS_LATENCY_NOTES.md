# Scoring Latency — Deployment Checklist

Code-level fixes for the 6-7s scoring lag are committed (lite HTTP ack,
`setImmediate` snapshot recompute, Redis cache preserved, Flutter viewer
tabs socket-driven). The remaining win is in the deployment topology —
none of it is in the repo. Run this checklist for every prod/staging
deploy that handles live scoring.

---

## 1. DB region matches app region  (fix #4)

`server/config/prisma.js` uses `pg.Pool(connectionString)` against
`process.env.DATABASE_URL`. Every ball write spans 3-4 Postgres
round-trips inside `prisma.$transaction`, so a 70ms cross-region RTT
becomes ~300ms before the first byte of work happens.

Action items per environment:

- [ ] Confirm the app server region (Render/Railway/Fly/etc. dashboard).
- [ ] Confirm the Postgres region (Neon/Supabase/RDS dashboard).
- [ ] If they differ: either move the DB or move the app server. There
      is no software workaround that closes a cross-region gap.
- [ ] Sanity test from inside the app server:
  ```sh
  psql "$DATABASE_URL" -c "select now();"
  ```
  Repeat 5x. Median should be < 30ms intra-region.

## 2. Use the pooler URL, not the direct URL  (fix #5)

Neon / Supabase / managed Postgres providers expose two connection
strings:

- Direct: opens a brand-new TCP+TLS handshake per checkout.
- Pooler (PgBouncer): keeps warm connections, hands them out in ms.

We already cap our local pool at `max: 20`. That cap is per Node
process. Behind PM2/cluster or Kubernetes replicas, total open
connections = `replicas × 20`. PgBouncer fans that down to the DB's
real limit.

Action items:

- [ ] `DATABASE_URL` points at the **pooler** host (look for `-pooler`
      in the hostname for Neon, port `6543` for Supabase).
- [ ] Append `?pgbouncer=true&connection_limit=5` (or similar — drop
      `connection_limit` low so PgBouncer manages fanout instead of us).
- [ ] Migrations script (Prisma `migrate deploy`) uses the **direct**
      URL — pooler doesn't support advisory locks. Keep that as
      `DIRECT_DATABASE_URL` if you split them.

## 3. HTTP/2 + keep-alive on the reverse proxy  (fix #7)

`scoring/update` is a 1-2KB request → ~200B ack response. Under HTTP/1.1
without keep-alive, every ball pays the TLS handshake again (~80-150ms
on cellular). Even with keep-alive enabled, HTTP/1.1 head-of-line
blocking serializes balls behind earlier requests on the same socket.

Action items (Nginx example — translate to your proxy of choice):

- [ ] HTTP/2 enabled on the public listener:
  ```nginx
  listen 443 ssl http2;
  ```
- [ ] Keep-alive between proxy and Node:
  ```nginx
  upstream kridaz_api {
    server 127.0.0.1:5000;
    keepalive 64;
  }
  location / {
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_pass http://kridaz_api;
  }
  ```
- [ ] If you use Cloudflare / Render / Railway: HTTP/2 to the client is
      on by default. Verify the proxy→origin hop is also pooled — Render
      and Railway are; Cloudflare in front of a raw VM is **not** unless
      Argo Smart Routing is on.
- [ ] Confirm from the client side:
  ```sh
  curl -I --http2 https://<api-host>/healthz
  ```
  Look for `HTTP/2 200`.

## Verification after deploy

Open `scoring_screen` on one device, `match_live_tab` on another (both
real devices on cellular if possible). Score 10 balls back-to-back. The
viewer's snapshot should update within ~500ms of each tap. If it's still
multi-second:

1. Open Chrome DevTools / Flutter DevTools network panel — measure HTTP
   round-trip on `POST /scoring/update`. Target < 400ms p95.
2. If HTTP RTT is fine but the snapshot is late → Socket.IO emit is
   slow. Check `[Scoring] Background snapshot refresh failed:` in the
   server logs.
3. If HTTP RTT is the culprit → revisit #1 (region) and #2 (pooler).
   These two account for the vast majority of cross-region pain.

---

Updated: 2026-06-11
