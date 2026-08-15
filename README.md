# SyncDrop

Verified attention network — Campaign Owners fund campaigns, Participants complete verified engagement tasks and earn rewards.

## Product direction

MVP is two-sided: **Campaign Owner ⇄ Participant**. Creator/multi-party marketplace functionality is deferred to Phase 3 — see `syncdrop-landing_4.html` for current public positioning.

## Contents

- `CampaignOwnerApp.jsx` — Campaign Owner console. Modules: Campaign Builder, Budget Management, Audience Targeting, Scheduling, Verification Rules, Live Participant Metrics, Reward Management, Analytics, Campaign History.
- `ParticipantApp.jsx` — Participant app. Modules: Campaign Feed, Campaign Details / Join / Task Completion / Verification, Wallet, Rewards History, Trust Score, Profile.
- `syncdrop-landing_4.html` — marketing site, Creator features marked Phase 3.

## Architecture notes

- Both apps share a `ROLES` / `TERMS` config (`campaign_owner`, `participant`) — no role name is hardcoded in UI logic, so future roles (Agency, Creator, NGO) can map onto `CAMPAIGN_OWNER` without touching components.
- All data access goes through a `dataService` object with async method signatures (`listCampaigns`, `joinCampaign`, `submitProof`, etc.). Currently backed by in-memory mock data — swap the function bodies for real API/WebSocket calls without touching UI code.
- No auth or backend yet — that's the intentional next milestone, gated on getting one real Campaign Owner to say yes to a pilot.

## Status

Pre-pilot. Next step: use `CampaignOwnerApp.jsx` as a live demo for 2–3 real prospects (NGO, university, local brand) to validate willingness to pay for verified engagement before building auth/backend.
