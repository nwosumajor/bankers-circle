# CLAUDE.md — Banker'sCircle

This file is the source of truth for building **Banker'sCircle** (web app, iOS app, Android app, admin portal and backend).
Read it fully at the start of every session. When code and this file disagree, stop and ask; do not silently pick one.
Keep it current: when a decision changes, update this file in the same pull request.

---

## 1. Product in one paragraph

Banker'sCircle is a **private, verified social community for financial-services professionals**, launching in **Lagos** (Victoria Island, Ikoyi, Lekki, Ikeja), then Abuja. Members build friendships, professional
connections, mentorship and serious relationships through **verified profiles, opt-in communities, curated offline events
and safe messaging**. It is **not** marketed as a dating app: romance is one optional intention among several.

The moat is trust, not code: verified membership, "hide me from my colleagues" privacy controls, strong moderation,
good offline events, and minimal retention of identity documents. Every technical decision must protect those.

### 1.1 Non-negotiable product rules

1. **Intentions gate everything.** Each member picks one or more intentions at onboarding: `FRIENDSHIP`, `NETWORKING`,
   `MENTORSHIP`, `COMMUNITY`, `SERIOUS_RELATIONSHIP`, `MARRIAGE_MINDED`, `EVENTS_ONLY`, `PRIVATE_BROWSING`.
   Members are only ever recommended to members with compatible intentions. Nobody is shown as a dating prospect by default.
2. **No messaging without consent.** One-to-one chat opens only after mutual interest or an accepted introduction.
3. **Hard restrictions always beat the score**: blocks, incompatible intentions, age range, same-institution exclusion,
   country restrictions, suspensions.
4. **Safety and privacy features are free.** Blocking, reporting, deleting your account, hiding from your institution,
   pausing discovery and private browsing must never be behind a paywall.
   *(The source draft listed private browsing and same-bank exclusion as premium; that is overruled here.)*
5. **Minimum age 18.** Enforced at registration (date of birth) and in verification.
6. **Employer visibility is opt-in.** Joining an institution-named community or showing an employer is always the member's choice.
7. **No confidential work talk.** Community rules forbid customer data, internal investigations, confidential
   transactions and proprietary employer information. Moderation tooling must support enforcing this.
8. **No implied endorsement.** Never use institution names or logos in a way that suggests sponsorship. Institution names
   are plain text from our own reference table; no logos unless written permission is recorded in the admin portal.
9. **No false security claims.** Do not describe messaging as "end-to-end encrypted" anywhere (UI, marketing, store listing)
   unless E2EE is implemented and independently reviewed. Current design: TLS in transit, encryption at rest.
10. **No single public reputation score.** Show trust *badges* only (see §6.7).
11. **Never sell personal data**, and never let advertisers target by relationship intention, religion or employer.

### 1.2 Eligibility is data, not code

Membership is **financial services only** for now: commercial, merchant and microfinance banks, fintechs, payment
companies, insurers, asset managers, stockbrokers, pension administrators, development finance institutions and
regulators. The sector list lives in the `eligible_sectors` table (launch value: `FINANCIAL_SERVICES` with sub-sectors) and
institutions in the `institutions` table, so the audience can widen later without code changes. Never hard-code
"banker" in logic; it may appear in content and branding only.

The brand is a generic description, not an affiliation: never imply that any bank sponsors or endorses the app (§1.1 rule 8).

---

## 2. Decisions on the source draft

These resolve gaps and conflicts found when reviewing the original draft. Do not reopen them without the owner's approval.

| # | Draft said | Decision |
|---|---|---|
| D1 | Private browsing and same-bank exclusion are premium | Free for everyone (§1.1 rule 4) |
| D2 | "Basic subscription payment" | Web: Paystack. iOS/Android: Apple/Google in-app purchase for digital subscriptions (store rules). Physical event tickets may use Paystack in all clients. Use RevenueCat (or equivalent) to unify entitlements; the backend is the only source of truth for entitlements. Re-check current store rules before launch. |
| D3 | "Disable screenshots where technically possible" | Android: block with `FLAG_SECURE` on sensitive screens. iOS cannot fully block screenshots: detect and, where useful, notify the other party. Never promise users screenshots are impossible. |
| D4 | Low-cost hosting (Render/Railway/Supabase/Upstash) | **Low-cost stack for MVP and early growth** (§3.1): Supabase Pro (PostgreSQL only), Cloudflare R2 for media, Render for API + worker, fixed-price managed Redis. Every piece sits behind a port or a standard protocol (PostgreSQL, S3 API, Redis), so moving to AWS later (§3.2) is a data copy and config change, not a rewrite. Region chosen after legal review of NDPA cross-border transfer (§12). |
| D4a | — | Supabase is used as a **managed PostgreSQL database only**. Do not use Supabase Auth, Storage, Realtime, Edge Functions or the auto-generated Data API (PostgREST). Auth, privacy policy and business logic stay in the NestJS backend. |
| D5 | Search engine box in architecture | PostgreSQL full-text search + `pg_trgm` until measured need. Then Meilisearch or OpenSearch behind a `SearchPort` interface. |
| D6 | "Location clustering" | Store **city and area only** (e.g. Lagos / Lekki). Never store continuous GPS for members. Event venues have coordinates; members do not. |
| D7 | Referral verification (two members vouch) | Allowed only as a *supporting* signal with manual review, never as sole proof; vouchers are rate-limited and accountable. |
| D8 | Draft section numbering skips §9; MVP cost says "cheap" | Ignore; cost model lives in `docs/cost-model.md` and is owned by the founder. |
| D9 | Microservices later | Modular monolith now. Module boundaries (§5) are enforced so extraction later is mechanical. |
| D10 | Hosting region open | **Frankfurt (EU Central)** for Supabase (`eu-central-1`), Render and Redis, co-located (§3.1). Neither Supabase nor Render offers an African region or London+Render together; Frankfurt is the only region where both run side by side. Lagos round trips to Europe are roughly 110–150 ms; AWS Cape Town measures roughly 55–85 ms, so it is the upgrade path if measured latency misses budget (§3.2, §9.6). |
| D11 | Identity vendor open | **Dojah** as primary (pay-as-you-go, no minimum, NIN lookup + selfie liveness/face match, Nigerian data sources). Get written quotes from Dojah and Prembly before launch and keep the cheaper; Smile ID as the fallback if liveness accuracy is a problem. Behind `IdentityVerificationPort`, so switching is config. |
| D12 | SMS provider open | **Termii** as primary (Nigerian, OTP token API, DND route for numbers on the Do-Not-Disturb list, voice and WhatsApp fallback). A second provider (e.g. BulkSMS Nigeria) behind the same `SmsPort` for automatic failover when delivery fails within 30–60 s. |
| D13 | Draft price ranges | Final launch prices in §6.10, anchored to what Nigerian store users pay for comparable apps. Prices stay in config. |
| D14 | Same-institution communities? | **Yes**, under strict rules in §6.6.1: private, verified-staff only, membership hidden from outsiders, no dating features inside, "unofficial" label. |

---

## 3. Tech stack

Use the **latest stable** versions at project start, then pin exact versions in lockfiles. Upgrade deliberately (§15).

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Language | TypeScript everywhere, `strict: true`, `noUncheckedIndexedAccess: true` |
| Mobile | React Native + Expo (New Architecture, Hermes), Expo Router, TanStack Query, Zustand, React Hook Form + Zod, Socket.IO client, Expo Notifications, Expo Image / Image Picker, `@shopify/flash-list`, `expo-secure-store`, Sentry |
| Member web app | Next.js (App Router, React Server Components), Tailwind CSS, shadcn/ui, TanStack Query (client islands only), React Hook Form + Zod |
| Admin portal | Separate Next.js app, same UI kit, Recharts for dashboards. Deployed separately, not reachable from the member domain |
| API | NestJS (modular monolith), REST + OpenAPI, class-validator **or** Zod via `nestjs-zod` (pick Zod; share schemas) |
| Realtime | Socket.IO with Redis adapter, websocket-only transport (no sticky sessions needed) |
| Database | **Supabase Pro** — PostgreSQL (use the newest major version Supabase offers), Prisma ORM, `pg_trgm`, `citext`. App connects through the Supavisor pooler; migrations use the direct connection (§3.1) |
| Cache / queues | **Fixed-price managed Redis** (Render Key Value by default, same region as the API), BullMQ |
| Object storage | **Cloudflare R2** (S3-compatible API, private buckets, no egress fees), served through short-lived presigned GET URLs |
| API and worker hosting | **Render**: one Docker web service (API + Socket.IO) and one Docker background worker, same region as Supabase |
| Media processing | Worker service: `sharp` for images, `ffmpeg` for video/voice |
| Payments | Paystack (web + event tickets), Apple/Google IAP via RevenueCat (in-app subscriptions) |
| SMS / OTP | **Termii** (primary, DND route for OTPs) + secondary provider for failover, behind `SmsPort` (D12) |
| Email | Resend (or another transactional provider) behind `EmailPort` |
| Identity verification | **Dojah** (NIN match + selfie liveness/face match) behind `IdentityVerificationPort` (D11); store result + vendor reference only |
| Push | Expo Push Service (APNs/FCM) |
| Observability | Sentry (errors), OpenTelemetry traces + metrics exported to Grafana Cloud (free tier at first), Render and Supabase built-in metrics, structured JSON logs (pino) shipped to Grafana Loki or Better Stack |
| Infra as code | Terraform (modular) with the Supabase, Cloudflare and Render providers; remote state in an R2 bucket (S3 backend) with locking. Settings a provider can't manage are listed in `docs/runbooks/manual-settings.md` |
| Secrets | Render environment groups (encrypted) for runtime secrets; GitHub Actions secrets/environments for CI. Field-level encryption master keys stored there, versioned (§10) |
| CI/CD | GitHub Actions, immutable commit-SHA image tags pushed to GitHub Container Registry, Render deploy triggered by API with that exact tag, EAS Build + EAS Update for mobile |
| Testing | Vitest (unit), Testcontainers PostgreSQL + Redis (integration), Supertest (API e2e), Playwright (web), Maestro (mobile e2e), k6 (load) |

### 3.1 Hosting setup rules (low-cost stack)

**Region: Frankfurt (D10).** Supabase project (`eu-central-1`), Render services and Render Key Value all in
**Frankfurt**. Never split them across regions: a request that makes 5 database queries across regions pays the
cross-region delay 5 times. The NDPA cross-border transfer assessment (§12) must cover Germany (EU); if legal review rules
it out, move everything together.

**Cloudflare in front of everything public.** `api.`, `www.`/web app and admin domains use Cloudflare DNS with proxying on.
Cloudflare has edge locations in Lagos, so the TLS handshake finishes close to the member and Cloudflare reuses warm
connections to Frankfurt; this saves round trips on every new connection. WebSockets pass through Cloudflare. Static web
assets are cached at the edge. Never cache API responses at Cloudflare unless the route is public and
permission-independent.
Environments: `dev` uses Supabase Free + a local Redis; `staging` and `prod` are separate Supabase Pro projects
(never share a database between environments).

**Supabase (database only)**
- Free plan is for development only: it pauses after about a week of inactivity and has a 500 MB limit.
  Production starts on Pro (Micro compute). Move up a compute size when CPU or memory stays above 70% at peak, not before.
- **Disable the Data API** (PostgREST) in project settings, and revoke `anon` and `authenticated` privileges on all
  application schemas. The app tables must not be reachable with Supabase's public keys. Never ship Supabase keys in the
  web or mobile apps; clients only ever talk to our API.
- Application tables live in a dedicated schema `app` (not `public`).
- Connections: Prisma `DATABASE_URL` → Supavisor **transaction-mode** pooler (port 6543, `?pgbouncer=true&connection_limit=<n>`);
  `DIRECT_URL` → direct/session connection, used only by `prisma migrate` and long-running maintenance jobs.
  Do not rely on session-level state (`SET` without `LOCAL`, session advisory locks, `LISTEN/NOTIFY`) through the pooler.
- Create separate database roles: `app_api` (statement timeout 5 s), `app_worker` (statement timeout 60 s),
  `app_migrator` (DDL). Set timeouts with `ALTER ROLE ... SET statement_timeout`.
- Turn on `pg_stat_statements`; review the slowest queries weekly from the Supabase query performance view.
- Partition maintenance: use `pg_partman` if available on the project, otherwise the worker's scheduled job creates
  future monthly partitions (§9.1). Either way, partitions for the next 3 months must always exist; alert if not.
- Backups: Supabase daily backups (7-day retention on Pro) **plus** our own nightly encrypted `pg_dump` to a private R2
  bucket (keep 30 days). Add point-in-time recovery as an add-on before public launch if budget allows. Test a full
  restore quarterly (§11).
- Watch the bill drivers: database disk beyond the included amount, egress, and extra compute. Set spend alerts.

**Cloudflare R2 (photos, videos, voice notes, documents, backups)**
- Buckets: `media-quarantine`, `media` (processed variants), `verification-docs` (separate, stricter access, 30-day
  lifecycle delete), `backups`, `tf-state`. All private; public bucket access and `r2.dev` URLs disabled.
- Accessed through the S3-compatible API with the AWS SDK v3 S3 client behind a `StoragePort`, so switching to S3 is config only.
- Separate R2 API tokens per service, scoped to the buckets that service needs (API: presign only; worker: read/write
  media; backup job: backups only).
- Serving: short-lived presigned GET URLs (e.g. 1 h) generated by the API after the visibility policy check. Image variants
  are small (§8), so direct R2 delivery is fine at launch; add Cloudflare CDN caching later only for content that is not
  permission-dependent (e.g. public event banners).
- Upload completion: R2 does not need to notify us. The client calls `POST /v1/media/upload-sessions/:id/complete`,
  the API checks the object exists, then enqueues the processing job. A scheduled job deletes quarantine objects older
  than 24 h that were never completed.

**Render (API and worker)**
- `api` web service: NestJS HTTP + Socket.IO, at least 2 instances in production so deploys and restarts don't drop
  everyone at once; health check `/health/ready`; zero-downtime deploys.
- Render does not guarantee sticky sessions, so Socket.IO clients use **websocket transport only** (no long-polling
  fallback) and the Redis adapter fans events out across instances.
- `worker` background service: BullMQ processors, media processing (`ffmpeg` installed in its image), scheduled jobs.
  Scale by queue depth; keep CPU-heavy media jobs on their own queue with limited concurrency so they never starve
  notification or chat jobs.
- One-off jobs (migrations) run as a Render job or pre-deploy command using `DIRECT_URL`.
- Use Render's private network for API ↔ Redis traffic; Redis is not exposed publicly.

**Redis (fixed-price plan only)**
- **Do not use pay-per-request Redis.** BullMQ issues commands constantly even when idle; per-request billing becomes
  expensive. Use a fixed-price instance (Render Key Value by default; Redis Cloud or an Upstash fixed plan are acceptable).
- Must support pub/sub (Socket.IO adapter) and persistence. Set `maxmemory-policy noeviction` — BullMQ requires it; a
  Redis that evicts keys will silently lose jobs.
- Because of `noeviction`, memory must be controlled by design: TTL on every cache key, BullMQ `removeOnComplete` /
  `removeOnFail` limits, capped sorted sets for discovery candidates. Alert at 70% memory.
- If cache and queue needs conflict later, split into two instances: queues (`noeviction`) and cache (`allkeys-lru`).

### 3.2 Moving to AWS later (keep this path open)

Move when any of these holds: sustained compute needs beyond the larger Supabase sizes, compliance or legal review
requires it, or the combined monthly bill exceeds the equivalent AWS setup. The design keeps this mechanical:
- PostgreSQL → RDS: `pg_dump`/`pg_restore` (or logical replication for near-zero downtime). No Supabase-specific
  features are used (D4a), so no code changes.
- R2 → S3: same S3 API; copy objects (e.g. `rclone`), change endpoint and credentials.
- Render → ECS Fargate: same Docker images; Terraform modules for AWS are added then.
- Redis → ElastiCache/Valkey: change the connection URL.
Write an ADR when the move is decided.

**Do not add** a new runtime dependency without stating why in the PR, checking its maintenance, licence and bundle size,
and confirming no existing dependency already does the job.

---

## 4. Repository layout

```
/
├─ apps/
│  ├─ api/            NestJS modular monolith (HTTP + Socket.IO gateway)
│  ├─ worker/         BullMQ workers (media, notifications, matching, retention, emails); same codebase modules, separate process
│  ├─ web/            Member web app (Next.js)
│  ├─ admin/          Admin & moderation portal (Next.js)
│  └─ mobile/         Expo app (iOS + Android)
├─ packages/
│  ├─ contracts/      Zod schemas + inferred types for every API request/response and socket event (single source of truth)
│  ├─ api-client/     Typed client generated from OpenAPI; used by web, admin, mobile
│  ├─ domain/         Pure TS domain logic shared by api + worker (matching rules, compatibility scoring, policy checks). No I/O.
│  ├─ ui-web/         Shared shadcn/ui components for web + admin
│  ├─ config/         eslint, tsconfig, prettier, tailwind presets
│  └─ test-utils/     Factories, fixtures, Testcontainers helpers
├─ infra/
│  ├─ modules/        Terraform modules: supabase-project, r2-buckets, render-services, redis, dns, monitoring
│  └─ envs/           dev / staging / prod root modules
├─ docs/              ADRs (docs/adr/NNNN-title.md), runbooks, DPIA notes, cost model, API conventions
└─ .github/workflows/ CI pipelines
```

Identifiers (final):
- Store display name: **Banker'sCircle** (home-screen label `Banker'sCircle`; fall back to `BankersCircle` only if a store rejects the apostrophe).
- iOS bundle ID and Android application ID: `com.majorgbn.bankerscircle` (reverse domain of the publisher; lowercase,
  no apostrophe or hyphen). These can never change after the first store release.
- Deep-link scheme: `bankerscircle://`; universal/app links on the production domain.
- npm scope: `@circle/*`.
- SMS sender ID: `BankersCirc` (11-character limit), registered with the networks through the SMS provider.
- Publisher / legal entity on both stores: **MajorGBN Innovations Limited (RC 9739429)** as an *organisation* account,
  never a personal account (§10.1).

---

## 5. Backend architecture (modular monolith)

### 5.1 Modules

Each module owns its tables, services, controllers and events. Modules talk to each other only through their **public
service interface** or **domain events**. Never import another module's repository or Prisma models directly.

| Module | Owns |
|---|---|
| `identity` | accounts, credentials, sessions, devices, OTP, refresh tokens, admin users + MFA |
| `profiles` | profile fields, photos/video references, intentions, preferences, privacy settings, profile completeness |
| `verification` | phone, work-email, document, identity/liveness, referral vouches, reverification schedule, trust badges |
| `discovery` | candidate generation, hard filters, compatibility scoring, saved profiles, daily introductions |
| `connections` | interest requests, introductions, matches, declines, removals |
| `messaging` | conversations, messages, attachments, read state, message requests, anti-spam gating |
| `communities` | communities, membership, posts, comments, polls, pinned items, community moderators |
| `events` | events, venues, organisers, tickets, waitlists, check-in, feedback, "people you met" |
| `media` | upload sessions, presigned URLs, processing pipeline, variants, scanning |
| `notifications` | push tokens, in-app notifications, email, preferences, quiet hours, batching |
| `billing` | plans, subscriptions, entitlements, Paystack + IAP webhooks, payment ledger, refunds |
| `safety` | reports, blocks, mutes, moderation queue, actions, appeals, risk signals, bans |
| `admin` | RBAC, admin tooling endpoints, configuration (weights, prices, sectors) |
| `audit` | append-only audit log for security and moderation actions |
| `analytics` | product metrics (privacy-safe, aggregated) |
| `privacy` | data export, deletion/erasure, consent records, retention jobs |

### 5.2 Request path rules

- Controllers are thin: validate (Zod from `@circle/contracts`), authorise, call one application service, map to response DTO.
- **Authorisation is checked in the service layer too**, not only in guards (defence in depth). Use a policy helper:
  `policy.assertCanViewProfile(viewer, target)` that applies blocks, privacy, institution exclusion and suspensions.
- Every profile-returning endpoint must go through the **visibility policy** in `@circle/domain`. There is exactly one
  implementation of "can A see B". Write exhaustive unit tests for it.
- Domain events (e.g. `MatchCreated`, `UserBlocked`, `ProfileHidden`) are written to an **outbox table in the same
  transaction** and dispatched to BullMQ by a relay. Never publish to a queue inside a DB transaction that might roll back.
- Any work that is slow (>150 ms), retryable or calls a third party goes to a queue, not the request.

### 5.3 API conventions

- REST, JSON, `/v1/...`, plural nouns, OpenAPI generated from code and checked in CI (breaking-change detection).
- **Cursor (keyset) pagination only.** Never `OFFSET`. Response: `{ items, nextCursor }`. Max page size 50.
- Errors: RFC 9457 problem+json with stable `code` strings (e.g. `CONNECTION_NOT_MUTUAL`). Never leak stack traces or
  whether a hidden/blocked user exists (return 404 for both "not found" and "not allowed to see").
- Idempotency: all POSTs that create money movements, tickets, interest requests or messages accept `Idempotency-Key`.
- Timestamps: ISO 8601 UTC in API; display in `Africa/Lagos` by default, user-local where set.
- Money: integer minor units (kobo) + ISO currency. Never floats.
- IDs: UUIDv7 everywhere (time-ordered, index-friendly). Public IDs never reveal sequence or counts.

---

## 6. Feature specifications

### 6.1 Registration and onboarding

Flow: phone number → OTP → personal email → password or passkey → name, date of birth (≥18) → city/area → sector,
institution (from reference list or "other, pending review"), job function category (generalised, e.g. "Risk & Compliance")
→ intentions → community standards acceptance (record version + timestamp) → privacy setup → verification → profile.

- Members can browse limited content after phone verification, but **cannot appear in discovery, message or register for
  members-only events until employment verification is approved**.
- Store consent records (`consents` table): purpose, policy version, granted/withdrawn timestamps. Sensitive fields
  (religion, relationship intention, faith preferences) require explicit, separate, revocable consent.
- Onboarding must be resumable at any step on any device.
- **SMS cost control (D12):** SMS OTP only at sign-up, new-device login and phone-number change. Routine sign-in uses the
  refresh-token session, passkeys or an email code. 60-second resend cooldown, max 3 sends per phone per hour and 5 per day.
  Send OTPs through the provider's DND route (many Nigerian numbers are on the DND list) with failover to the secondary
  provider; record delivery status per provider to compare reliability and cost monthly.

### 6.2 Verification

Trust badges (each with `verified_at`, `expires_at`, `method`, `vendor_ref`):
`PHONE`, `IDENTITY`, `EMPLOYMENT`, `EVENT_ATTENDEE`, `COMMUNITY_CONTRIBUTOR`, `TRUSTED_ORGANISER`.

Employment verification methods (combine; admin decides):
1. **Work-email OTP.** Domain must be on the institution's allow-list. Store the domain and an encrypted address
   (needed for reverification); never display it. Delete the address when the member leaves the institution.
2. **Document review.** Staff ID / employment letter / recent payslip, member is told to redact salary and account numbers.
   Uploaded to the separate private `verification-docs` R2 bucket, encrypted with our application-level key before upload
   (§10); viewable only through the admin portal with audit logging;
   **auto-deleted 30 days after decision** (lifecycle rule + job).
3. **Referral vouch.** Supporting signal only (D7).
4. **Manual compliance review** for institutions without usable work email.
5. **Reverification** every 12 months (configurable) or on institution change; badge expires if not renewed.

Identity: Dojah NIN match + selfie liveness/face match (D11), with explicit consent. **Store only status, timestamp and
vendor transaction reference.** Never store raw NIN, BVN, ID images or selfies after the check. NIN/BVN are never the only
membership proof.

Identity cost control: each check is billed per call, so run it **last**, only after phone and employment verification have
passed; never re-run for the same member unless reverification requires it; deduplicate retries with an idempotency key so
a network retry is never billed twice. Use BVN only if a future feature truly needs it (it costs more and adds sensitivity).

### 6.3 Profiles

Fields: display name, verified badges, age (shown as age or range per preference), city/area/country, institution (or
"Financial institution" if hidden), function (optionally generalised), professional interests, hobbies, intentions,
religion (optional, explicit consent, visibility-controlled), languages, education, bio, up to 6 photos, one intro video
(≤30 s), event interests, community memberships (only those marked visible), availability, completeness score.

Privacy controls (all free):
- Hide employer, job title, surname.
- **Exclude my institution** (current; optionally former institutions; optionally specific branches/locations).
- Block specific institutions.
- **Exclude contacts:** member may upload contacts *for exclusion only*. Normalise to E.164, compute
  `HMAC-SHA256(pepper, phone)` on device or server, match against members' hashed phones, store only the resulting
  exclusion pairs, discard the rest immediately. The pepper lives in the host's encrypted secret store (Render environment group). Document that phone-number hashes
  are low-entropy and the pepper is the real protection.
- Exclude specific people.
- Private browsing (viewing does not leave a trace / "who viewed me").
- Limit visibility by country, state, age range, intention.
- Pause discovery (hidden from discovery, existing chats remain).
- Screenshot protection (D3).
- Download my data; delete my account.

Exclusions are **symmetric**: if A excludes B's institution, neither sees the other.

### 6.4 Discovery and matching

Pipeline: **hard filters → candidate set → score → diversify → serve**.

Hard filters (never overridden): blocks (either direction), suspensions/bans, unverified, paused, incompatible intentions,
age outside *both* parties' ranges, institution/contact/person exclusions (both directions), country restrictions,
already matched/declined (decline cooldown configurable).

Score (weights stored in `matching_weights` config table, editable by admins, versioned):

| Factor | Default weight |
|---|---|
| Relationship-intention compatibility | 25% |
| Interests and lifestyle overlap | 20% |
| Location preference | 15% |
| Age preference | 15% |
| Religion preference (only when both opted in) | 10% |
| Communication preference | 10% |
| Event/community overlap | 5% |

- Implement scoring as a **pure function in `@circle/domain`** with full unit tests and fixed fixtures.
- Intention compatibility is a matrix in config (e.g. `MARRIAGE_MINDED` ↔ `SERIOUS_RELATIONSHIP` compatible;
  `NETWORKING` ↔ `MARRIAGE_MINDED` not shown in romantic surfaces).
- **Precompute candidates** in the worker (nightly + on profile/preference change, debounced) into a Redis sorted set per
  user with TTL, capped at 500 IDs. Discovery reads page from Redis, then **re-checks hard filters at read time** (blocks
  can happen after precompute). Never score the whole user table inside a request.
- No endless swipe. Daily introductions capped by plan (config).
- Serious-intention mode: readiness questionnaire, values/lifestyle/faith/family preferences (opt-in), introduction
  requests with a short note, conversation prompts.

Actions: express interest, request introduction, save privately, limited opening message (if plan allows), invite match to
event, decline respectfully (no notification to the other party), remove match, report, block.

### 6.5 Messaging

- One-to-one (after mutual interest/accepted introduction), small groups (≤10), community chat.
- Text, photos, short video, voice notes. Media goes through the media pipeline (§8).
- Message requests where policy allows; typing indicators; read receipts **off unless the user enables them**.
- **Anti-harassment gating:** block links and phone numbers/emails in the first N messages or first 24 h after a match
  (configurable); rate-limit new conversations per day; flag repeated unanswered openers.
- Expiring media option (server deletes object + variants at expiry).
- Safety reminder shown before sharing contact details or arranging an off-platform meeting.
- Delivery: Socket.IO for online users; push for offline (batched, respecting quiet hours). Messages are persisted first,
  then emitted. Clients dedupe by client-generated message ID.
- Report/block from any message; reporting attaches the last 20 messages as evidence snapshot.

### 6.6 Communities

- Types: public (discoverable, join freely), private (approval), hidden (invite only). Institution-named communities are
  always opt-in and membership visibility is per member.
- Posts, comments (2 levels max), polls, photos/short video, pinned announcements, community moderators, member approval,
  community events, group chat, content reporting.
- Seed templates (config, not code): city communities, Women in Banking, Young Professionals, Technology & Digital
  Banking, Risk & Compliance, Treasury, Trade Finance, Fintech, faith-based, fitness/travel/books/music/sports,
  marriage-minded, new-to-city, wellness and burnout, career transition, professional-exam study groups.
- Feeds: reverse-chronological with pinned items first, keyset-paginated. No algorithmic feed in MVP.

#### 6.6.1 Same-institution communities (D14)

Allowed at launch, because colleague networks are a strong reason to join, but they carry the most employer risk, so:
- **Created by admins only**, one per institution, once at least 20 members of that institution are employment-verified.
  Named `<Institution> Staff Circle (unofficial)` with a fixed line: "Independent community. Not affiliated with or endorsed
  by <Institution>." No institution logo unless written permission is recorded (§1.1 rule 8).
- **Hidden and private:** only members with an active `EMPLOYMENT` badge for that institution can see it exists or join.
  The member list is visible to members only. Leaving the institution (badge expiry or institution change) removes access
  automatically, with a notice.
- **Joining is explicit.** If the member has "exclude my institution" on, joining shows a clear warning that colleagues
  inside this community will see their name and photo there. Discovery exclusion stays in force regardless: joining the
  community never makes them appear in colleagues' discovery.
- **No romantic surface inside:** intentions, relationship badges and "express interest" buttons are not shown in
  institution community views. Direct messages from these communities follow normal consent rules (§6.5).
- **Stricter content rules:** pinned rule against customer data, internal investigations, confidential transactions,
  internal circulars and proprietary information. Automatic filter flags posts with account numbers, BVN/NIN patterns and
  words like "confidential" or "internal memo" for review before they publish.
- At least two volunteer community moderators from the institution plus platform moderators.
- Institution partnerships (official HR or wellness programmes) are a later, separate feature with signed agreements.

### 6.7 Trust and safety

- Reports (profile, message, post, comment, event) → moderation queue with priority (sexual content, threats,
  minors, scams first) → actions: warn, remove content, restrict messaging, suspend, ban, escalate.
- Appeals workflow with a different moderator reviewing.
- Every moderation action writes to `audit_log` (actor, target, reason code, evidence refs, before/after).
- Risk signals: device fingerprint (privacy-preserving), IP reputation, signup velocity, duplicate phone/email/device,
  photo reuse (perceptual hash), message spam patterns. Signals raise review priority; they never auto-ban alone except
  for clear-cut cases defined in config.
- Photo moderation: automated nudity/violence screen in the media pipeline + human review for flagged items.
- Rate limits: interest requests, introductions, new conversations, reports filed, OTP sends, logins (per user, per device,
  per IP), enforced in Redis with sliding windows.
- Bans are permanent for serious violations and block re-registration by phone hash, device and verified identity ref.

### 6.8 Events

- Types: mixers, games nights, outings, fitness, volunteering, speed introductions, dinners, faith/relationship talks,
  career/mentorship, inter-institution sports, awards nights, singles-only curated events, workshops.
- Discovery by city/area and date; banker-friendly scheduling (Friday evening/weekends) as default filters.
- Capacity, ticket tiers, waitlist with automatic promotion (time-limited claim), guest rules, table/group assignment,
  emergency contact (optional, deleted 7 days after event), venue + organiser verification, code of conduct acceptance.
- **Venue address revealed only to confirmed, verified attendees**, 24 h before (configurable).
- **No overselling:** ticket reservation uses a single atomic statement
  (`UPDATE events SET reserved = reserved + 1 WHERE id = $1 AND reserved < capacity RETURNING ...`) or row lock; holds
  expire after 10 min if unpaid.
- Check-in: QR contains a signed, short-lived token (Ed25519 or HMAC) verifiable offline by the organiser app; scans are
  synced and deduped.
- Post-event: feedback, "people you met" suggestions (only among attendees who opted in), safety incident reporting.
- Calendar export (ICS). Ride-sharing coordination must never reveal home addresses.

### 6.9 Notifications

- Channels: push, in-app inbox, email. Per-category preferences and quiet hours (default 22:00–07:00 Africa/Lagos).
- Batch and collapse (e.g. "3 new interests" not 3 pushes). Max push frequency per user per hour (config).
- Handle Expo push receipts; delete tokens that return `DeviceNotRegistered`.
- Push payloads never contain sensitive content (no message text, no names of matches on lock screen by default).

### 6.10 Billing and monetisation

- Plans (prices are **config**, not code). Launch prices (D13), anchored between what Nigerian store users already pay for
  dating premiums (Bumble Premium about ₦3,800/month, Tinder Platinum about ₦1,700/month on the Nigerian App Store) and
  professional premiums (LinkedIn Premium Career about ₦12,600/month), reflecting a verified, higher-income audience:

  | Plan | Price | Effective monthly | Saving |
  |---|---|---|---|
  | Premium monthly | ₦4,500 | ₦4,500 | — |
  | Premium quarterly | ₦12,000 | ₦4,000 | ~11% |
  | Premium annual | ₦40,000 | ₦3,333 | ~26% |
  | Founding member annual (first 1,000 verified members, first year only) | ₦30,000 | ₦2,500 | ~44% |

  Add-ons: profile boost ₦1,000 each; event tickets priced per event; curated dinners and singles events priced per event
  (premium members get early access, not free entry). Review prices after 3 months using conversion and churn data.
- Store pricing: pick the store price point nearest the table above. Enrol in the Apple App Store Small Business Program
  and use Google Play's subscription rate so store commission is 15%, not 30%. Web (Paystack) prices match app prices;
  do not advertise cheaper web prices inside the iOS app (store anti-steering rules).
- Margin per channel (track in analytics): store purchases lose ~15% commission; Paystack local cards lose about 1.5% + ₦100
  (capped). Never put essential safety features behind payment (§1.1 rule 4).
- Free: profile, selected communities, limited profile views and interests, free events, chat with accepted connections.
- Premium: advanced filters, more introductions, see who expressed interest, profile boost, premium events,
  relationship-readiness features, travel mode, reconsider declined profiles.
- Entitlements are computed server-side from `subscriptions` and checked via `entitlements.has(user, FEATURE)`.
  Clients only display; they never decide.
- Paystack webhooks: verify `x-paystack-signature` (HMAC-SHA512 of the raw body with the secret key), dedupe by event ID,
  process idempotently, then re-verify the transaction via Paystack's verify endpoint before granting anything.
- IAP: verify receipts/notifications server-side (via RevenueCat webhooks or store server APIs).
- Keep a `payments` ledger (append-only); refunds are new ledger rows, never edits.

### 6.11 Admin portal

- RBAC roles: `SUPER_ADMIN`, `VERIFICATION_OFFICER`, `MODERATOR`, `EVENT_MANAGER`, `SUPPORT`, `FINANCE`, `ANALYST`.
- MFA required (TOTP or WebAuthn); sessions 8 h max; IP allow-list option; every read of verification documents and
  every action is audited.
- Screens: verification queue, moderation queue, appeals, member lookup (masked by default; reveal requires reason),
  events and check-in, communities, configuration (weights, prices, sectors, institutions, rate limits), metrics dashboard.

---

## 7. Data model (core)

Prisma schema lives in `apps/api/prisma/schema.prisma`. Conventions:

- Table names `snake_case` plural; columns `snake_case`; Prisma models `PascalCase` with `@@map`.
- Every table: `id uuid` (UUIDv7), `created_at timestamptz default now()`, `updated_at timestamptz`.
- Soft delete only where business needs it (`deleted_at`), and then **every index on that table is partial**
  (`WHERE deleted_at IS NULL`). Member erasure is a hard delete/anonymisation (§12), not a soft delete.
- Enums as Postgres enums only when the set is truly fixed; otherwise reference tables (institutions, sectors, interests).
- Foreign keys always indexed.

Core tables (non-exhaustive): `users`, `user_devices`, `sessions`, `refresh_tokens`, `otp_challenges`, `profiles`,
`profile_photos`, `profile_intentions`, `profile_interests`, `privacy_settings`, `exclusions` (type: institution/contact/
person/branch), `blocks`, `consents`, `verification_requests`, `trust_badges`, `institutions`, `institution_domains`,
`eligible_sectors`, `interest_requests`, `introductions`, `matches`, `saved_profiles`, `conversations`,
`conversation_members`, `messages` (partitioned), `message_attachments`, `communities`, `community_members`, `posts`,
`comments`, `polls`, `poll_votes`, `events`, `venues`, `ticket_tiers`, `tickets`, `waitlist_entries`, `checkins`,
`event_feedback`, `media_objects`, `media_variants`, `notifications` (partitioned), `push_tokens`,
`notification_preferences`, `plans`, `subscriptions`, `payments`, `webhook_events`, `reports`, `moderation_actions`,
`appeals`, `risk_signals`, `audit_log` (partitioned, append-only), `outbox_events`, `matching_weights`, `app_config`.

Required indexes (examples; add what each query needs):
- `messages (conversation_id, id DESC)` — chat history by keyset.
- `conversation_members (user_id, last_message_at DESC)` — inbox.
- `interest_requests (to_user_id, status, created_at DESC)`.
- `blocks (blocker_id, blocked_id)` unique + `(blocked_id)`.
- `exclusions (user_id, type, target_ref)`.
- `events (city, starts_at) WHERE status = 'PUBLISHED'`.
- `posts (community_id, pinned DESC, id DESC)`.
- `profiles` GIN index for interests array or join table + btree on `(city, discoverable)`.
- `pg_trgm` GIN on searchable names (communities, events, institutions).

---

## 8. Media pipeline

1. Client asks `POST /v1/media/upload-sessions` (type, size, mime) → API checks quota and returns a **presigned R2 PUT URL**
   (S3 API, 10-minute expiry, exact content type and max size) into `media-quarantine`. Media never streams through the API.
2. Client uploads, then calls `POST /v1/media/upload-sessions/:id/complete` → API confirms the object exists (HEAD) and
   enqueues the job. Worker: validate real MIME (magic bytes), size/duration limits, strip EXIF/GPS, scan (malware +
   nudity/violence model), perceptual hash (duplicate/stolen photo detection).
3. Generate variants: images to WebP/AVIF at 3 sizes (e.g. 160, 480, 1080 px); video transcoded to H.264 MP4 at 720p max
   + poster frame; voice to AAC/Opus.
4. Write variants to the private `media` bucket, delete the quarantine original. Serve with **presigned GET URLs** (about
   1 h), issued only after the visibility policy check. Never public buckets. Clients cache by media ID + variant, not by
   URL, since URLs change.
5. Deleted/expired media: delete object + all variants (and purge any CDN cache if one was added later).

Limits (config): photo ≤ 10 MB; video ≤ 30 s and ≤ 50 MB; voice note ≤ 2 min.

---

## 9. Performance and longevity rules (must hold after years of growth)

The app must stay fast with millions of messages and years of data. Treat these as hard rules; code review rejects violations.

### 9.1 Database
- **No `OFFSET` pagination anywhere.** Keyset on `(sort_key, id)`.
- **Every new query ships with its index.** For any non-trivial query, paste `EXPLAIN (ANALYZE, BUFFERS)` from a seeded
  dataset (≥1M messages, ≥100k users via `pnpm db:seed:large`) in the PR description.
- **No N+1.** Fetch related data in one query or batch (DataLoader pattern in resolvers/services). Enable Prisma query
  logging in tests and fail the test if a request issues more than a set number of queries.
- **Select only needed columns.** No `SELECT *` equivalents for list endpoints.
- Use raw SQL (`$queryRaw` with tagged templates, never string concatenation) for hot paths where Prisma generates poor SQL.
- **Partition high-growth tables by time**: `messages`, `notifications`, `audit_log`, `analytics_events` monthly
  (declarative partitioning, managed by SQL migrations + `pg_partman` or a scheduled job creating future partitions).
  Old partitions can move to cheaper storage or be detached/archived to R2 per retention policy.
- **Denormalised counters** (unread counts, member counts, attendee counts) are updated atomically or asynchronously; never
  computed with `COUNT(*)` on hot paths.
- **Migrations are zero-downtime (expand → migrate → contract).** Never rename/drop a column in the same release that stops
  using it. Indexes on existing large tables use `CREATE INDEX CONCURRENTLY` in a hand-written SQL migration. Never hold
  long locks; set `lock_timeout` in migrations.
- Connection pooling: Supavisor transaction pooler (§3.1); Prisma `connection_limit` sized per instance so that
  (API instances × limit) + (worker instances × limit) stays well under the pool size of the compute tier.
  Statement timeout 5 s for the API role, 60 s for the worker role.
- Autovacuum tuned for hot tables; monitor bloat. `pg_stat_statements` enabled; slow-query log at 200 ms.
- Long-running reports and analytics never run on hot paths; schedule them off-peak in the worker, and add a Supabase
  read replica when reporting load justifies it.

### 9.2 API and workers
- Latency budgets (p95, measured in staging under k6 load): reads ≤ 250 ms, writes ≤ 400 ms, discovery page ≤ 300 ms,
  message send-to-delivery ≤ 500 ms. A PR that regresses a budget does not merge.
- Response payloads paginated and capped; no endpoint returns unbounded lists.
- Cache with explicit keys, TTLs and invalidation on write (profile cards, community headers, event pages, config). Never
  cache anything permission-dependent without the viewer in the key.
- BullMQ: every job idempotent, with retries + exponential back-off + dead-letter queue; job payloads hold IDs, not blobs;
  `removeOnComplete`/`removeOnFail` limits set so Redis never grows unbounded.
- Every Redis key has a TTL unless it is documented as permanent.
- Socket.IO: Redis adapter; websocket-only transport (§3.1); heartbeat tuned; rooms per conversation; never
  broadcast to all sockets.
- Scheduled jobs (retention, partition creation, reverification reminders, waitlist expiry) are idempotent and use a
  distributed lock.

### 9.3 Mobile
- Lists use `FlashList` with stable keys and memoised row components; images via `expo-image` with caching and the
  correct variant size (never load 1080 px into a 160 px avatar).
- TanStack Query: sensible `staleTime`, `gcTime`; infinite queries use `maxPages` so memory stays bounded in long chats.
- Avoid unnecessary re-renders: Zustand selectors, `React.memo`, no inline object/array props in hot lists.
- No heavy work on the JS thread during scroll/animation; use Reanimated for animations.
- Bundle size budget tracked in CI; lazy-load rarely used screens.
- Offline-friendly: queued outgoing messages with retry; optimistic UI with rollback.
- Startup time budget: cold start to first interactive screen ≤ 2.5 s on a mid-range Android device (test on a real
  ~₦150k-class Android phone, not only emulators/iPhones).

### 9.4 Web
- Server Components by default; client components only for interactivity. `next/image` with the right variants.
- Core Web Vitals budgets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 on a throttled mid-range mobile profile.
- Route-level code splitting; no large client-side libraries on public pages.

### 9.5 Data growth hygiene
- Retention jobs (§12) run daily and are monitored; a failed retention job pages someone.
- Archive, don't accumulate: expired OTPs, sessions, upload sessions, webhook payloads (keep 90 days), outbox rows
  (delete after dispatch + 7 days).

### 9.6 Latency from Lagos (the servers are in Frankfurt)

Every round trip from a phone in Lagos to Frankfurt costs roughly 110–150 ms before our code even runs. The app must feel
instant anyway, so round trips are the budget to manage:
- **One request per screen.** Screen-shaped endpoints (e.g. `GET /v1/screens/home`, `/v1/screens/profile/:id`) return
  everything the screen needs in one response. No request waterfalls (fetch A, then B using A's result) from clients.
- **Render from cache first.** TanStack Query cache persisted on device (MMKV) so screens show last-known data instantly,
  then refresh in the background. Optimistic UI for sends, likes, joins and RSVPs.
- **Prefetch** the next likely screen (next discovery page, a profile the user is about to open, chat history on inbox).
- **Keep connections warm:** HTTP keep-alive, HTTP/2 or HTTP/3 through Cloudflare, one Socket.IO connection reused for
  chat, presence and in-app notifications while the app is in the foreground.
- **Small payloads:** compressed responses (Brotli/gzip), only fields the screen shows, correct image variant sizes.
- **Database calls stay in Frankfurt:** the API and database are co-located, so a few queries per request are cheap;
  what is expensive is extra phone-to-server trips.
- **Budgets measured from Lagos:** p95 end-to-end response for member actions ≤ 450 ms on 4G (server p95 ≤ 250 ms plus
  network). Track real-user timings in Sentry broken down by network (MTN, Airtel, Glo, 9mobile) and run a synthetic check
  from a Lagos vantage point every minute.
- **Move trigger:** if real-user p95 round trip from Nigeria exceeds the budget for 2 consecutive weeks and the cause is
  distance (not slow queries), plan the move to AWS Cape Town (`af-south-1`) per §3.2 with an ADR.

---

## 10. Security

- **Auth:** phone OTP + password (Argon2id) or passkeys. Access token JWT ≤ 15 min; refresh tokens opaque, rotated on
  every use, stored hashed, bound to device, reuse detection revokes the family. Mobile stores tokens in
  `expo-secure-store`; web uses `HttpOnly`, `Secure`, `SameSite=Lax` cookies + CSRF protection.
- OTP: 6 digits, 5-minute expiry, max 5 attempts, rate-limited per phone/device/IP; constant-time compare.
- **Input validation** on every boundary with Zod. Output encoding on web. Strict Content-Security-Policy.
- **Secrets** only in Render environment groups and GitHub Actions secrets; never in the repo, `.env` committed files or mobile bundles.
  `.env.example` documents names only. Gitleaks runs in CI.
- **Encryption:** TLS everywhere, including API ↔ database and API ↔ Redis. Supabase and R2 encrypt data at rest.
  Field-level encryption in the application (envelope encryption: AES-256-GCM data key per record or table, wrapped by a
  versioned master key from the secret store, via libsodium or Node `crypto`) for: work email, emergency contacts, date
  of birth, phone number (plus HMAC for lookup), and verification documents before upload. Ciphertext stores the key
  version so keys can be rotated without downtime.
- **Least privilege access:** separate database roles per service (§3.1); scoped R2 tokens per service; Render and
  Supabase dashboards protected with SSO/2FA for every team member; production secrets only in the `production`
  GitHub environment with required reviewers. Use OIDC wherever a provider supports it; otherwise rotate deploy
  tokens every 90 days.
- **Dependency and image scanning** (npm audit / Snyk or Dependabot, Trivy), IaC scanning (Checkov/tfsec) in CI.
- **Logging hygiene:** never log tokens, OTPs, passwords, message bodies, document contents, full phone numbers or emails.
  A pino redaction list is mandatory and tested.
- **Rate limiting and abuse controls** on all auth, social and payment endpoints.
- **Admin portal** on a separate domain/app, MFA, audit of every sensitive read.
- Penetration test before public launch and annually; fix criticals before launch.
- Store review requirements for social/UGC apps: in-app report, block, content filtering and a published contact method
  must exist before submission. Age rating 18+.

### 10.1 App store accounts and publisher identity

- Publish **only** under **MajorGBN Innovations Limited (RC 9739429)** as an organisation account on both stores, so the
  store listing shows the company as seller/developer and the apps stay company assets.
- Both stores require a **D-U-N-S number** for organisation accounts. Request it for MajorGBN Innovations Limited using the
  exact legal name and address on the CAC record (it is free; allow about 5 business days, and up to 2 more for Apple to
  receive it). One D-U-N-S number serves both stores.
- Apple Developer Program (organisation, annual fee) and Google Play Console (organisation, one-time fee). Add team members
  with least privilege; the company email domain owns the accounts, not a personal Gmail.
- Category: Social Networking. Age rating: 18+. Privacy "nutrition labels" / Data safety forms must match §12 exactly.
- Before submission: trademark search for "Banker'sCircle" at the Nigerian Trademarks Registry (similar names exist abroad,
  e.g. "Banking Circle", a licensed bank in Europe), and confirm MajorGBN's CAC objects cover software/internet services.

---

## 11. Observability and operations

- Structured JSON logs with `request_id`, `user_id` (hashed in logs), module, latency.
- OpenTelemetry tracing across API → DB → Redis → queue → worker.
- Dashboards: API latency/error rate per route, DB CPU/connections/slow queries, queue depth and job age, socket
  connections, push success rate, webhook failures, moderation queue age, verification queue age.
- Alerts on symptoms: error rate > 2% for 5 min, p95 latency over budget for 10 min, queue job age > 5 min, failed
  retention job, webhook signature failures spike, DB storage > 75%.
- Runbooks in `docs/runbooks/` for: deploy rollback, DB restore, Redis loss, payment webhook backlog, SMS provider outage,
  mass-report/abuse incident, data breach response (with NDPA notification timelines from legal).
- Backups: Supabase daily backups + nightly encrypted `pg_dump` to R2 (§3.1), point-in-time recovery add-on before
  public launch; R2 media is not backed up twice but deletes are soft for 7 days via a delayed purge job. Quarterly
  restore test documented.

---

## 12. Privacy and compliance (Nigeria Data Protection Act 2023)

Not legal advice: the owner must obtain legal review. Engineering must support:

- Data Protection Impact Assessment completed before launch (`docs/dpia/`).
- Purpose-specific consent records; explicit consent for sensitive fields; easy withdrawal.
- Data minimisation: collect only what a feature needs; review every new field in PR ("why do we need this, how long do
  we keep it?").
- **Data subject rights:** export (machine-readable ZIP via async job, link expires in 24 h), correction, erasure.
- **Erasure workflow:** 14-day grace (account deactivated, recoverable), then hard delete or irreversible anonymisation
  across all tables, media, search index, caches and analytics; messages sent to others are anonymised ("Deleted member").
  Ledger/payment records kept only as legally required, with personal fields minimised.
- Retention schedule (config, reviewed by legal): verification documents 30 days after decision; liveness/ID images not
  stored; emergency contacts 7 days after event; OTPs/sessions per §9.5; reports and moderation evidence per legal advice.
- Cross-border transfer assessment before choosing the hosting region for Supabase, Render, Redis and R2 (D4). Vendor data processing agreements recorded.
- Breach-response procedure and contacts documented; audit logs immutable (append-only table, `UPDATE`/`DELETE`
  revoked from all app roles, + periodic export to a write-once R2 bucket using bucket lock/retention rules).

---

## 13. Testing strategy

- **Unit:** all `@circle/domain` logic (visibility policy, hard filters, scoring, entitlements, rate-limit rules) at 95%+
  branch coverage.
- **Integration:** each module against real PostgreSQL + Redis via Testcontainers. No mocking the database.
- **API e2e:** Supertest for every endpoint's happy path, authorisation failures and validation failures.
- **Privacy tests (mandatory, never skipped):** blocked users never appear anywhere (discovery, search, communities member
  lists, event attendee lists, "people you met"); institution exclusion is symmetric; hidden fields never serialise.
  Snapshot-test DTOs so a new field cannot leak by accident.
- **Payments:** webhook signature, idempotency, replay, out-of-order events.
- **Concurrency:** ticket overselling test with 200 parallel reservations for 50 seats.
- **Web:** Playwright for onboarding, discovery, chat, event booking, admin verification/moderation.
- **Mobile:** Maestro flows for onboarding, matching, chat, event check-in on Android and iOS.
- **Load:** k6 scenarios for discovery, inbox, chat send, event release spike; run before each release candidate.
- Tests are deterministic: fixed clocks, seeded randomness, no network calls to real vendors (use fakes behind ports).

---

## 14. CI/CD and environments

- Environments: `dev` (ephemeral/preview), `staging` (prod-like, anonymised seed data), `prod`.
- PR pipeline: install (pnpm, cached) → typecheck → lint → unit → integration → build → OpenAPI diff → bundle/size
  budgets → security scans → Terraform `plan` (posted to PR) for infra changes.
- Main pipeline: build images once, tag with commit SHA, push to GitHub Container Registry (never reuse or overwrite a
  tag), deploy that exact image to the staging Render services via the Render API, run smoke + e2e, manual approval,
  deploy the **same image** to prod. Render zero-downtime deploys with health checks; rollback = redeploy the previous
  SHA (keep the last 10 tags).
- DB migrations run as a pre-deploy step (`prisma migrate deploy` with `DIRECT_URL`) before the new version receives
  traffic; must be backward compatible with the running version.
- Mobile: EAS Build per release; EAS Update for JS-only fixes, respecting `runtimeVersion` so updates never reach an
  incompatible binary. Staged rollouts on both stores.
- Feature flags (config table or a flag service) for risky features; flags have owners and removal dates.

---

## 15. Code conventions

- TypeScript strict; no `any` (use `unknown` + narrowing); no non-null assertions except in tests.
- ESLint + Prettier enforced; import boundaries enforced with `eslint-plugin-boundaries` (apps can't import other apps;
  modules can't import other modules' internals).
- Naming: files `kebab-case.ts`; classes `PascalCase`; functions/variables `camelCase`; constants `SCREAMING_SNAKE_CASE`.
- Functions small and single-purpose; pure logic in `@circle/domain`; side effects at the edges.
- Errors: typed domain errors mapped to problem+json in one exception filter. Never swallow errors.
- Comments explain *why*, not *what*. Public module services have TSDoc.
- Commits: Conventional Commits (`feat(messaging): ...`). Small PRs (< 400 lines changed excluding generated code).
- ADR required for: new dependency of significance, new infrastructure component, change to a non-negotiable rule,
  data retention change, matching-weight model change.
- Dependency updates via Renovate weekly; major upgrades (Expo SDK, Next.js, NestJS, Prisma, Node LTS) each get their own
  PR with release-note review. Stay within supported versions; never let Expo SDK or Node fall out of support.

---

## 16. How Claude Code should work in this repo

1. **Plan before large changes.** For anything touching more than one module, schema, auth, payments, privacy or
   infrastructure, write a short plan (files, migrations, risks, tests) and wait for approval.
2. **Follow the build order (§17).** Don't start a later phase's feature before the current phase's definition of done.
3. **Tests with every change.** New behaviour = new tests. Bug fix = failing test first.
4. **Run before declaring done:** `pnpm typecheck && pnpm lint && pnpm test` (and `pnpm test:int` for backend changes).
   Report results honestly; never claim tests pass without running them.
5. **Never** commit secrets, disable tests to get green, weaken a privacy check, add `any`, or use `OFFSET`.
6. **Schema changes** follow expand/contract and include the index plan and `EXPLAIN` evidence for new queries.
7. **Ask, don't guess,** when a requirement is ambiguous, when this file and the code disagree, or when a change would
   affect what members can see about each other.
8. **Keep docs current:** update this file, ADRs, OpenAPI and runbooks in the same PR as the change.
9. Prefer editing existing code over adding parallel implementations. Delete dead code.
10. When adding an external vendor, put it behind a port interface in the owning module with a fake for tests.

### Commands (keep this list accurate as scripts are added)

```bash
pnpm install                 # install all workspaces
pnpm dev                     # api + worker + web + admin (Turborepo)
pnpm --filter mobile start   # Expo dev server
pnpm db:up                   # start local Postgres 17 (port 5433) + Redis (docker compose)
pnpm db:down                 # stop them
pnpm db:migrate              # apply Prisma/SQL migrations (dev)
pnpm db:seed                 # small realistic seed
pnpm db:seed:large           # ≥100k users, ≥1M messages for EXPLAIN/perf work
pnpm typecheck
pnpm lint
pnpm test                    # unit
pnpm test:int                # integration (Testcontainers; Docker required)
pnpm test:e2e                # API e2e + Playwright
pnpm --filter mobile test:e2e  # Maestro
pnpm load                    # k6 scenarios against staging
pnpm api:openapi             # regenerate OpenAPI + api-client
docker build -f docker/node-service.Dockerfile --build-arg APP=api .   # prod image (APP=api|worker), as CI builds it
```

Workspace notes: pnpm uses `nodeLinker: hoisted` (pnpm-workspace.yaml) because Expo/Metro needs a flat
`node_modules`; dependency install scripts must be approved in `allowBuilds`. Shared
packages are ESM built to `dist/` (except `ui-web`, shipped as TS source and transpiled by the Next apps);
the API is CommonJS and loads them through Node's `require(esm)`.

Version holds (re-check when upgrading): TypeScript stays on 6.0.x until typescript-eslint and the Nest CLI
support TypeScript 7; Prisma stays on the latest 7.x until 8 is stable. Prisma 7 takes connection URLs from
`apps/api/prisma.config.ts` (CLI, `DIRECT_URL`) and the `@prisma/adapter-pg` adapter in `PrismaService`
(runtime, `DATABASE_URL`), not from `schema.prisma`. Mobile versions follow the Expo SDK (`expo install --fix`), and the React version is pinned repo-wide to the
Expo SDK's via `overrides` in `pnpm-workspace.yaml`. `@types/node` tracks the Node runtime major (24), not latest.

---

## 17. Build order

Each phase ends with its definition of done met, deployed to staging, and reviewed.

**Phase 0 — Foundations (week 1–2)**
Monorepo, tooling, CI, Terraform for dev/staging (Supabase projects with Data API disabled, R2 buckets + tokens, Render
services, Redis, Cloudflare DNS/proxy), backup job, observability baseline, Lagos synthetic latency check,
owner tasks started in parallel (D-U-N-S request, store enrolments, trademark search, Dojah/Termii sandbox accounts),
`@circle/contracts`, `@circle/domain` skeleton, seed scripts, landing page with waitlist (validation phase support).
*Done when:* a hello-world API, web, admin and mobile build deploy through the pipeline with SHA tags; logs/traces visible.

**Phase 1 — Identity, profiles, verification (week 3–6)**
Registration, OTP, sessions, consent records, onboarding, profiles, photos via media pipeline, privacy settings and
exclusions, verification flows (phone, work email, documents, identity vendor), admin verification queue, audit log.
*Done when:* a member can register, verify and build a profile on web and mobile; privacy tests pass; documents auto-delete.

**Phase 2 — Discovery and connections (week 7–9)**
Visibility policy, hard filters, scoring, candidate precompute, discovery UI, interest requests, introductions, matches,
saved profiles, blocks and reports.
*Done when:* compatible members see each other, excluded/blocked never do (tests), p95 discovery ≤ 300 ms on large seed.

**Phase 3 — Messaging and notifications (week 10–12)**
Conversations, Socket.IO, attachments, anti-harassment gating, read receipts setting, push/in-app/email notifications,
quiet hours, message partitioning.
*Done when:* chat works offline/online on both apps, load test passes, push payloads contain no sensitive text.

**Phase 4 — Communities and events (week 13–15)**
Communities, posts, comments, polls, moderators; events, venues, ticket tiers, Paystack, waitlist, QR check-in, feedback,
"people you met".
*Done when:* oversell test passes, webhooks idempotent, venue address hidden until allowed.

**Phase 5 — Billing, safety hardening, admin (week 16–17)**
Plans, entitlements, IAP via RevenueCat, moderation queue + appeals, risk signals, admin RBAC + MFA, metrics dashboard,
data export and erasure workflows, retention jobs.
*Done when:* entitlements enforced server-side, erasure verified end to end, all admin actions audited.

**Phase 6 — Launch readiness (week 18–20)**
Pen test and fixes, DPIA sign-off, store submissions (18+, UGC requirements), runbooks, restore test, k6 at 5× expected
launch load, staged rollout to invited Lagos cohort (500–5,000 members).

**Out of scope for MVP:** AI relationship assistant, stories, microservices, cryptocurrency, public follower counts,
elaborate gamification, E2EE claims.

---

## 18. Launch metrics to instrument from day one

Verification completion rate; profile completion rate; WAU; mutual connections per active user; conversations receiving
replies; 7- and 30-day retention; event registration-to-attendance rate; female-to-male participation ratio; reports per
1,000 conversations; median moderation response time; paid conversion rate.
Analytics events are aggregated and privacy-safe: no message content, no sensitive fields, user IDs pseudonymised.

---

## 19. Decisions made and remaining open items

Decided (see §2): financial services only (§1.2); Frankfurt co-located hosting (D10); Dojah for identity (D11); Termii plus
a failover provider for SMS (D12); launch pricing (§6.10); same-institution communities with strict rules (§6.6.1);
publisher MajorGBN Innovations Limited with bundle ID `com.majorgbn.bankerscircle` (§4, §10.1).

Still open (do not assume answers):
1. Written price quotes from Dojah and Prembly (and SMS rates from Termii and the failover provider) before launch.
2. NDPA legal review of hosting in Germany (EU) and vendor data processing agreements.
3. D-U-N-S number and store account enrolment for MajorGBN Innovations Limited.
4. Trademark search result for "Banker'sCircle".
5. Moderation staffing hours and response-time targets.