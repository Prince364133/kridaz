# Reels & Stories Performance — Backend Action Plan

**Audience:** Kridaz backend team
**Author:** Mobile (Flutter) team
**Date:** 2026-06-02
**Status:** Ready to action

---

## TL;DR

Three things to do, in order. Everything else is fine.

1. **Put Cloudflare in front of R2.** ~15 min. Biggest perceived-speed win available.
2. **Verify reels aren't marked `ready` before `hlsUrl` is populated.** One SQL check + (if non-zero) a pipeline fix.
3. **Clean up the unused `cf_reel_token` cookie code** in `reels.controller.js` (or wire it to a real Edge Auth Worker once Cloudflare is in place).

The HLS transcode pipeline itself is well-tuned — don't change it.

---

## Context

The Flutter mobile client at `C:\Users\Hp\Desktop\bms\bms` consumes the same `/api/reels/feed` and `/api/story/feed` endpoints the web client does. It uses `package:video_player` (Flutter wrapper around ExoPlayer/AVPlayer), which behaves like `hls.js`: prefers `hlsUrl` and falls back to `rawVideoUrl` MP4.

The client-side perceived-speed work is already shipped (preload of next reel, thumbnail precache, story-viewer prefetch). What's left to optimize is on the backend.

---

## Current backend setup (confirmed)

For reference — no changes recommended for these, but they shape the conclusions below.

| Component | What's there |
|---|---|
| Transcode | FFmpeg via fluent-ffmpeg + ffmpeg-static, inline BullMQ worker (`server/utils/reelWorker.js`, `server/queues/media.queue.js`). One `mediaQueue` handles reel / story / community. |
| Encoding ladder | 3 ABR renditions (360p / 480p / 720p), libx264 preset `veryfast`, CRF 26, `hls_time=4`, mpegts segments, AAC 128k. **This is fine; do not change.** |
| Serving | Direct from R2's bare public URL (`https://pub-cc243bd179ab45ee94097baeca380dd4.r2.dev`). Express is **not** in the read path. |
| CDN | **None.** R2 public origin is hit directly by every viewer. |
| Auth on playback | None enforced. There's a signed `cf_reel_token` HMAC cookie set on `.kridaz.com` (`reels.controller.js:236-243, 534-537`) but since playback hits `*.r2.dev` the cookie is never sent — it's stub code for an Edge Auth Worker that doesn't exist. |

---

## Ask 1 — Put Cloudflare in front of R2 (HIGHEST IMPACT)

### Problem

Every reel viewer TCP-handshakes to R2's bucket region (APAC, judging by the bucket ID). First-byte latency = round-trip distance + R2 origin TTFB. For users in NA/EU, that's 200-400ms before the first HLS segment even starts arriving.

There is no caching layer. Reel #1 watched by 1,000 users = 1,000 round-trips to R2, every time.

### Fix

Bind a custom domain to the R2 bucket via Cloudflare:

1. Cloudflare Dashboard → R2 → your bucket → **Settings** → **Public access** → **Connect Domain** → `cdn.kridaz.com` (or `media.kridaz.com`)
2. Cloudflare auto-provisions a DNS record + SSL cert + proxies the bucket
3. Swap one env var:
   ```diff
   - REELS_CDN_URL=https://pub-cc243bd179ab45ee94097baeca380dd4.r2.dev
   + REELS_CDN_URL=https://cdn.kridaz.com
   ```
4. Redeploy. New reels will have `hlsUrl: https://cdn.kridaz.com/...` — existing reels keep working too since R2 is still the origin.

### Why this is the top ask

- **Cloudflare → R2 egress is $0.** This is the explicit point of R2's pricing model. You currently pay $0 because nothing is hitting it, but the moment traffic grows it stays $0 with Cloudflare in front.
- **Cache hit ratio for HLS segments will be ~95%+.** Segments are content-addressed and immutable — perfect cache subjects.
- **2nd viewer in a POP gets sub-100ms TTFB globally.** This is the single change that makes reels feel like Instagram.
- **Setup time: ~15 minutes.** No code changes beyond the env var.

### Cache headers (do this at the same time)

Once Cloudflare is fronting R2, set these on transcode output:

```
Content-Type: application/vnd.apple.mpegurl     (for .m3u8)
Content-Type: video/mp2t                         (for .ts segments)
Content-Type: image/jpeg                         (for posters)
Cache-Control: public, max-age=31536000, immutable
```

Set them on the `s3.send(new PutObjectCommand({ CacheControl: ... }))` call inside the FFmpeg upload step in `reelWorker.js`. The `.m3u8` playlist itself can be shorter (`max-age=60`) so updates propagate, but `.ts` segments and posters are content-hashed and should be 1-year + immutable.

### Verification after deploy

```bash
# Should show cf-cache-status header
curl -I https://cdn.kridaz.com/reels/<some-id>/master.m3u8
curl -I https://cdn.kridaz.com/reels/<some-id>/720p/segment-0.ts

# Expect:
# cf-cache-status: HIT       (after the first request from your region)
# cache-control: public, max-age=31536000, immutable
# content-type: video/mp2t
```

---

## Ask 2 — Verify reels aren't marked `ready` before HLS exists

### Problem

The Flutter client falls back to raw MP4 when `hlsUrl` is null:

```dart
String? get playableUrl => hlsUrl ?? rawVideoUrl;   // lib/services/reel_api_service.dart:103
```

A 30-second 1080p MP4 is 8-15 MB. Even from a CDN, that's a few seconds to first-frame because the player needs the MOOV atom + a leading chunk before it can render. HLS streams the first segment in 300-500ms.

If reels are flipped to `status: ready` before the HLS pipeline finishes (or fails silently), mobile users see the slow MP4 path even though the system "thinks" everything is fine.

### Check

```sql
SELECT id, status, "hlsUrl", "rawVideoUrl", "createdAt"
FROM reels
WHERE status IN ('ready', 'published')
  AND ("hlsUrl" IS NULL OR "hlsUrl" = '')
ORDER BY "createdAt" DESC
LIMIT 50;
```

**Expected result: zero rows.**

If non-zero:
- The HLS worker is either (a) marking ready too early or (b) silently failing without setting `status: failed`
- In `reelWorker.js`, the order should be: upload all renditions to R2 → write `master.m3u8` → atomically update DB with `{ status: 'ready', hlsUrl: ... }`. If `hlsUrl` is set in one place and `status` flipped in another, race conditions can leave them inconsistent.
- If the worker is failing without setting `failed`, wrap the whole job in a try/catch that updates `status: failed` + logs to Sentry. Don't let exceptions bubble up to BullMQ's default retry without state being updated.

### Fix

- DB constraint (Postgres): `CHECK (status NOT IN ('ready', 'published') OR "hlsUrl" IS NOT NULL)` — prevents the bad state from ever being written
- Backfill script: for existing rows matching the query above, either re-enqueue them through the HLS pipeline or set `status: failed` if the raw video is gone

---

## Ask 3 — Remove or wire up the dead `cf_reel_token` cookie

### Problem

`reels.controller.js:236-243` and `:534-537` set an HMAC-signed cookie:

```js
res.cookie('cf_reel_token', signed, {
  domain: '.kridaz.com',
  httpOnly: true,
  secure: true,
  // ...
});
```

But since reel playback hits `pub-cc243bd179ab45ee94097baeca380dd4.r2.dev`, the cookie is never sent to the origin. It does nothing. It looks like the intent was to gate playback through a Cloudflare Worker that validates the cookie, but the Worker doesn't exist.

### Fix — pick one

**Option A — delete it (5 min)**
Remove the cookie-setting code and `REELS_COOKIE_SECRET` env var. Cleanest.

**Option B — wire it up (only worth doing if you want private reels)**
Once Ask #1 is done and reels are served from `cdn.kridaz.com`, write a Cloudflare Worker that:
1. Reads the `cf_reel_token` cookie on requests to `cdn.kridaz.com/reels/*`
2. Verifies the HMAC + expiry
3. Returns 401 if invalid, otherwise proxies to R2

This gives you the foundation for private reels / paywalls / DRM down the road.

If you don't have a concrete need for private reels in the next 3 months: Option A.

---

## Non-issues — please don't spend time on these

The original perf doc raised concerns that, given the actual setup, are non-issues:

| Original concern | Why it's a non-issue |
|---|---|
| HLS encoding settings tuning | CRF 26 / veryfast / 4s segments / 3 renditions is industry-standard. Leave it. |
| MP4 range-request support | R2's public URLs support ranges natively; Express isn't in the read path stripping them. Fine. |
| `processingProgress` not used in UI | That was a Flutter-side observation. The web client (`ReelItem.jsx:215,221`, `PostItem.jsx:257-262`) uses it correctly. Mobile will add it; no backend change needed. |

---

## Optional follow-ups (after the top 3 ship)

### Move FFmpeg out of the API process

Current setup runs libx264 transcodes in the same Node process as the HTTP server (`media.processor.js` comment: "INLINE BullMQ processor — NOT sandboxed"). At low traffic this is fine. At scale, CPU spikes during transcode will add tail latency to every concurrent API request on that instance.

Two paths when it becomes a problem:

1. **Split worker service** — `server.js` already supports `ENABLE_WORKERS=false`. Run an `api` service with workers off, plus a separate `worker` service with workers on. Same codebase, different env. Recommended path.

2. **Outsource entirely** — Cloudflare Stream (auto HLS + global CDN built-in) or AWS MediaConvert. Bigger change but removes the entire transcode pipeline as something you own + operate.

### Backend metrics worth adding

If not already in Prometheus:

| Metric | Why |
|---|---|
| `reel_hls_transcode_duration_seconds` (histogram) | Catch slow transcodes |
| `reel_hls_transcode_failures_total` (counter, labeled by reason) | Catch silent failures |
| `reel_feed_responses_with_null_hls_total` (counter) | Should be 0 after Ask 2 |
| `r2_egress_bytes_total` (counter) | Track CDN cost before/after Ask 1 |

---

## Quick triage order

1. **Run the SQL from Ask 2.** Tells you immediately if Ask 2 is a real problem or already correct.
2. **Set up the Cloudflare → R2 custom domain (Ask 1).** Single biggest user-facing speedup.
3. **Add the `Cache-Control` headers in the worker upload step.** Same PR as #2.
4. **Decide on the `cf_reel_token` cookie (delete or wire up).**

If you do #1 + #2 you'll have done >90% of the available speedup. Everything else is polish.

---

## Mobile client reference (for diagnosing client-side symptoms)

| File | Purpose |
|---|---|
| `lib/services/reel_api_service.dart` | API + Reel model + `playableUrl = hlsUrl ?? rawVideoUrl` |
| `lib/screens/reels_screen.dart` | Player + preload (reel 0+1, thumbnail of reel 2) |
| `lib/providers/reels_feed_provider.dart` | Feed state + cursor pagination |
| `lib/services/story_service.dart` | Story API |
| `lib/screens/new_home_dashboard.dart:1170+` | Story viewer with media precache |

Mobile contact: see CODEOWNERS.
