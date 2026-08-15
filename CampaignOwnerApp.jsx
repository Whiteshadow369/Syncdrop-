import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN CONFIG — shared vocabulary layer.
// Duplicated in ParticipantApp.jsx today (single-file build). When these two
// apps move into a real monorepo, extract this block to a shared
// `domain-config.js` module both import from. Nothing else in either app
// should hardcode "Sponsor"/"Earner"/"Creator" — always go through ROLES/TERMS.
// ═══════════════════════════════════════════════════════════════════════════
const ROLES = {
  CAMPAIGN_OWNER: "campaign_owner", // maps to: Sponsor, Agency, Creator, NGO, Gov Dept (future)
  PARTICIPANT: "participant",       // maps to: Earner, Viewer, Student, Voter (future)
};

const TERMS = {
  [ROLES.CAMPAIGN_OWNER]: { label: "Campaign Owner", plural: "Campaign Owners" },
  [ROLES.PARTICIPANT]: { label: "Participant", plural: "Participants" },
};

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA SERVICE — every function here is the future API contract.
// Signatures are written as if they were already async network calls so
// swapping the body for `fetch(...)` / WebSocket later requires no call-site
// changes. Keep this the ONLY place that touches "data".
// ═══════════════════════════════════════════════════════════════════════════
const seedCampaigns = [
  { id: "CMP-104", name: "Q3 Product Launch — Verified Views", status: "active", budget: 12000, spent: 7420, participants: 3120, cpe: 0.045, verifyRate: 0.94, created: "2026-07-02", ends: "2026-08-20", verification: ["watch_time", "quiz"] },
  { id: "CMP-103", name: "Campus Ambassador Drive", status: "active", budget: 5000, spent: 1180, participants: 640, cpe: 0.03, verifyRate: 0.88, created: "2026-07-14", ends: "2026-08-30", verification: ["geo_checkin"] },
  { id: "CMP-102", name: "Fintech Awareness Series", status: "scheduled", budget: 8000, spent: 0, participants: 0, cpe: 0.05, verifyRate: null, created: "2026-08-01", ends: "2026-09-15", verification: ["quiz", "selfie"] },
  { id: "CMP-098", name: "NGO Voter Registration Push", status: "completed", budget: 15000, spent: 14870, participants: 9840, cpe: 0.038, verifyRate: 0.91, created: "2026-05-10", ends: "2026-06-30", verification: ["geo_checkin", "quiz"] },
  { id: "CMP-091", name: "Beta Tester Recruitment", status: "completed", budget: 3000, spent: 2960, participants: 410, cpe: 0.06, verifyRate: 0.97, created: "2026-04-01", ends: "2026-04-20", verification: ["task_upload"] },
];

const seedFeed = [
  { t: "12s ago", msg: "Participant 0x8F2… completed verification on CMP-104", tone: "green" },
  { t: "48s ago", msg: "Participant 0xA31… joined Campus Ambassador Drive", tone: "cyan" },
  { t: "2m ago", msg: "Reward payout batch #221 processed — 84 participants", tone: "gold" },
  { t: "4m ago", msg: "Flagged: unusual completion velocity on CMP-104 (auto-throttled)", tone: "red" },
  { t: "6m ago", msg: "Participant 0x77C… completed verification on CMP-103", tone: "green" },
];

const dataService = {
  async listCampaigns() { return seedCampaigns; },
  async createCampaign(draft) {
    return { id: `CMP-${Math.floor(100 + Math.random() * 800)}`, status: "scheduled", spent: 0, participants: 0, verifyRate: null, created: new Date().toISOString().slice(0, 10), ...draft };
  },
  async listLiveFeed() { return seedFeed; },
  async listPendingPayouts() {
    return [
      { id: "PAY-551", participant: "0x8F2ADC91", campaign: "CMP-104", amount: 4.8, requested: "3m ago" },
      { id: "PAY-550", participant: "0x2B190FE4", campaign: "CMP-103", amount: 1.2, requested: "11m ago" },
      { id: "PAY-549", participant: "0xA31CE207", campaign: "CMP-104", amount: 4.8, requested: "19m ago" },
    ];
  },
};

// ─── DESIGN TOKENS (matches syncdrop-v4.jsx / landing brand) ────────────────
const T = {
  bg0: "#04060A", bg1: "#080C14", bg2: "#0D1220", bg3: "#111827",
  line: "#1A2336", accent: "#00E5FF", accentDim: "#00E5FF1F", gold: "#FFB800", goldDim: "#FFB80022",
  green: "#00FF9D", greenDim: "#00FF9D22", red: "#FF3366", redDim: "#FF336622",
  purple: "#8B5CF6", purpleDim: "#8B5CF622", text0: "#F0F4FF", text1: "#8899BB", text2: "#445577",
  mono: "'IBM Plex Mono', monospace", sans: "'DM Sans', sans-serif",
};

const fmt$ = (n) => `$${Number(n).toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n) => (n == null ? "—" : `${(n * 100).toFixed(1)}%`);

const STATUS_COLOR = { active: T.green, scheduled: T.gold, completed: T.text2, paused: T.red };

const NAV = [
  { id: "builder", label: "Campaign Builder" },
  { id: "budget", label: "Budget Management" },
  { id: "targeting", label: "Audience Targeting" },
  { id: "scheduling", label: "Scheduling" },
  { id: "verification", label: "Verification Rules" },
  { id: "metrics", label: "Live Participant Metrics" },
  { id: "rewards", label: "Reward Management" },
  { id: "analytics", label: "Analytics" },
  { id: "history", label: "Campaign History" },
];

function Card({ title, badge, children, accent = T.accent }) {
  return (
    <div style={{ background: T.bg2, border: `1px solid ${T.line}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: T.text1, borderLeft: `3px solid ${accent}`, paddingLeft: 10 }}>{title}</div>
          {badge && <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text2 }}>{badge}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function Stat({ label, value, color = T.text0, sub }) {
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontFamily: T.sans, fontSize: 26, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text2, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Badge({ children, color }) {
  return <span style={{ fontFamily: T.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color, border: `1px solid ${color}55`, background: `${color}18`, borderRadius: 5, padding: "3px 8px" }}>{children}</span>;
}

function Input({ label, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text1, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
      <input {...props} style={{ width: "100%", background: T.bg1, border: `1px solid ${T.line}`, borderRadius: 6, color: T.text0, padding: "9px 11px", fontFamily: T.sans, fontSize: 14 }} />
    </label>
  );
}

function Button({ children, onClick, tone = T.accent, ghost }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: T.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em",
      color: ghost ? tone : T.bg0, background: ghost ? "transparent" : tone,
      border: `1px solid ${tone}`, borderRadius: 6, padding: "9px 16px", cursor: "pointer",
    }}>{children}</button>
  );
}

// ── MODULE: Campaign Builder ─────────────────────────────────────────────
function CampaignBuilder({ campaigns, onCreate }) {
  const [draft, setDraft] = useState({ name: "", budget: "", objective: "engagement", ends: "" });
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  const submit = () => {
    if (!draft.name || !draft.budget) return;
    onCreate({ name: draft.name, budget: Number(draft.budget), objective: draft.objective, ends: draft.ends || "TBD", verification: ["quiz"] });
    setDraft({ name: "", budget: "", objective: "engagement", ends: "" });
  };
  return (
    <>
      <Card title="New Campaign" accent={T.accent}>
        <Input label="Campaign Name" placeholder="e.g. Q4 Referral Push" value={draft.name} onChange={set("name")} />
        <Input label="Reward Budget (USD)" type="number" placeholder="5000" value={draft.budget} onChange={set("budget")} />
        <Input label="End Date" type="date" value={draft.ends} onChange={set("ends")} />
        <label style={{ display: "block", marginBottom: 14 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text1, textTransform: "uppercase", marginBottom: 6 }}>Objective</div>
          <select value={draft.objective} onChange={set("objective")} style={{ width: "100%", background: T.bg1, border: `1px solid ${T.line}`, borderRadius: 6, color: T.text0, padding: "9px 11px", fontFamily: T.sans }}>
            <option value="engagement">Verified Engagement</option>
            <option value="signup">Signups / Registration</option>
            <option value="attendance">Event Attendance</option>
            <option value="content">Task / Content Completion</option>
          </select>
        </label>
        <Button onClick={submit}>Create Draft Campaign</Button>
      </Card>
      <Card title="Drafts & Recent" badge={`${campaigns.length} total`}>
        {campaigns.slice(0, 4).map((c) => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.line}` }}>
            <div>
              <div style={{ fontFamily: T.sans, fontSize: 13, color: T.text0 }}>{c.name}</div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text2 }}>{c.id} · {fmt$(c.budget)} budget</div>
            </div>
            <Badge color={STATUS_COLOR[c.status]}>{c.status}</Badge>
          </div>
        ))}
      </Card>
    </>
  );
}

// ── MODULE: Budget Management ────────────────────────────────────────────
function BudgetManagement({ campaigns }) {
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  return (
    <>
      <Card title="Portfolio Budget">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10 }}>
          <Stat label="Total Allocated" value={fmt$(totalBudget)} color={T.text0} />
          <Stat label="Total Spent" value={fmt$(totalSpent)} color={T.gold} />
          <Stat label="Remaining" value={fmt$(totalBudget - totalSpent)} color={T.green} />
          <Stat label="Avg CPE" value={`$${(campaigns.reduce((s, c) => s + c.cpe, 0) / campaigns.length).toFixed(3)}`} color={T.accent} />
        </div>
      </Card>
      <Card title="Per-Campaign Burn">
        {campaigns.map((c) => {
          const pct = Math.min(100, (c.spent / c.budget) * 100);
          return (
            <div key={c.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 11, color: T.text1, marginBottom: 5 }}>
                <span>{c.name}</span><span>{fmt$(c.spent)} / {fmt$(c.budget)}</span>
              </div>
              <div style={{ height: 6, background: T.bg1, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: pct > 90 ? T.red : T.accent }} />
              </div>
            </div>
          );
        })}
      </Card>
    </>
  );
}

// ── MODULE: Audience Targeting ───────────────────────────────────────────
function AudienceTargeting() {
  const [tiers, setTiers] = useState({ elite: true, verified: true, new: false });
  const [geo, setGeo] = useState("Global");
  const toggle = (k) => setTiers({ ...tiers, [k]: !tiers[k] });
  return (
    <Card title={`Targeting Profile — ${TERMS[ROLES.PARTICIPANT].plural}`}>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text1, textTransform: "uppercase", marginBottom: 8 }}>Trust Tier</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(tiers).map(([k, v]) => (
          <div key={k} onClick={() => toggle(k)} style={{ cursor: "pointer", padding: "8px 14px", borderRadius: 6, border: `1px solid ${v ? T.accent : T.line}`, background: v ? T.accentDim : "transparent", color: v ? T.accent : T.text2, fontFamily: T.mono, fontSize: 11, textTransform: "capitalize" }}>
            {v ? "✓ " : ""}{k}
          </div>
        ))}
      </div>
      <Input label="Geography" value={geo} onChange={(e) => setGeo(e.target.value)} />
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text2, marginTop: 8 }}>
        Estimated reachable audience: <span style={{ color: T.green }}>~{(tiers.elite ? 3120 : 0) + (tiers.verified ? 8900 : 0) + (tiers.new ? 2800 : 0)} participants</span>
      </div>
    </Card>
  );
}

// ── MODULE: Scheduling ───────────────────────────────────────────────────
function Scheduling({ campaigns }) {
  return (
    <Card title="Campaign Timeline">
      {campaigns.map((c) => (
        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.line}` }}>
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.text0 }}>{c.name}</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.text2 }}>{c.created} → {c.ends}</span>
            <Badge color={STATUS_COLOR[c.status]}>{c.status}</Badge>
          </div>
        </div>
      ))}
    </Card>
  );
}

// ── MODULE: Verification Rules ───────────────────────────────────────────
const PROOF_TYPES = ["watch_time", "quiz", "geo_checkin", "selfie", "task_upload"];
function VerificationRules({ campaigns }) {
  const [selected, setSelected] = useState(campaigns[0]?.id);
  const campaign = campaigns.find((c) => c.id === selected);
  const [rules, setRules] = useState(campaign?.verification || []);
  const pick = (id) => { setSelected(id); setRules(campaigns.find((c) => c.id === id)?.verification || []); };
  const toggle = (r) => setRules(rules.includes(r) ? rules.filter((x) => x !== r) : [...rules, r]);
  return (
    <Card title="Verification Rule Builder">
      <select value={selected} onChange={(e) => pick(e.target.value)} style={{ width: "100%", background: T.bg1, border: `1px solid ${T.line}`, borderRadius: 6, color: T.text0, padding: "9px 11px", fontFamily: T.sans, marginBottom: 16 }}>
        {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text1, textTransform: "uppercase", marginBottom: 8 }}>Required proof (any selected must pass)</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PROOF_TYPES.map((p) => (
          <div key={p} onClick={() => toggle(p)} style={{ cursor: "pointer", padding: "8px 12px", borderRadius: 6, border: `1px solid ${rules.includes(p) ? T.purple : T.line}`, background: rules.includes(p) ? T.purpleDim : "transparent", color: rules.includes(p) ? T.purple : T.text2, fontFamily: T.mono, fontSize: 11 }}>
            {rules.includes(p) ? "✓ " : ""}{p.replace("_", " ")}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── MODULE: Live Participant Metrics ─────────────────────────────────────
function LiveMetrics({ feed, campaigns }) {
  const live = campaigns.filter((c) => c.status === "active");
  return (
    <>
      <Card title="Active Right Now">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Stat label="Active Campaigns" value={live.length} color={T.green} />
          <Stat label="Participants (live)" value={live.reduce((s, c) => s + c.participants, 0).toLocaleString()} color={T.accent} />
          <Stat label="Avg Verify Rate" value={fmtPct(live.reduce((s, c) => s + (c.verifyRate || 0), 0) / (live.length || 1))} color={T.gold} />
        </div>
      </Card>
      <Card title="Live Feed" badge="streaming">
        {feed.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.line}`, fontFamily: T.mono, fontSize: 12 }}>
            <span style={{ color: T.text2, minWidth: 60 }}>{f.t}</span>
            <span style={{ color: { green: T.green, cyan: T.accent, gold: T.gold, red: T.red }[f.tone] }}>{f.msg}</span>
          </div>
        ))}
      </Card>
    </>
  );
}

// ── MODULE: Reward Management ────────────────────────────────────────────
function RewardManagement({ payouts, onApprove }) {
  const [list, setList] = useState(payouts);
  const approve = (id) => setList(list.filter((p) => p.id !== id));
  return (
    <Card title="Pending Payouts" badge={`${list.length} awaiting approval`}>
      {list.length === 0 && <div style={{ fontFamily: T.mono, fontSize: 12, color: T.text2 }}>All caught up — no pending payouts.</div>}
      {list.map((p) => (
        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.line}` }}>
          <div>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.text0 }}>{p.participant}</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text2 }}>{p.campaign} · requested {p.requested}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontFamily: T.mono, fontSize: 13, color: T.gold }}>{fmt$(p.amount)}</span>
            <Button tone={T.green} onClick={() => approve(p.id)}>Approve</Button>
          </div>
        </div>
      ))}
    </Card>
  );
}

// ── MODULE: Analytics ─────────────────────────────────────────────────────
function Analytics({ campaigns }) {
  const max = Math.max(...campaigns.map((c) => c.participants), 1);
  return (
    <Card title="Participation by Campaign">
      {campaigns.map((c) => (
        <div key={c.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 11, color: T.text1, marginBottom: 4 }}>
            <span>{c.name}</span><span>{c.participants.toLocaleString()}</span>
          </div>
          <div style={{ height: 8, background: T.bg1, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${(c.participants / max) * 100}%`, height: "100%", background: T.accent }} />
          </div>
        </div>
      ))}
    </Card>
  );
}

// ── MODULE: Campaign History ─────────────────────────────────────────────
function CampaignHistory({ campaigns }) {
  const done = campaigns.filter((c) => c.status === "completed");
  return (
    <Card title="Completed Campaigns" badge={`${done.length} archived`}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.mono, fontSize: 11 }}>
        <thead>
          <tr style={{ color: T.text2, textAlign: "left", textTransform: "uppercase", fontSize: 10 }}>
            <th style={{ padding: "6px 0" }}>Campaign</th><th>Spent</th><th>Participants</th><th>Verify Rate</th>
          </tr>
        </thead>
        <tbody>
          {done.map((c) => (
            <tr key={c.id} style={{ borderTop: `1px solid ${T.line}`, color: T.text0 }}>
              <td style={{ padding: "8px 0" }}>{c.name}</td>
              <td style={{ color: T.gold }}>{fmt$(c.spent)}</td>
              <td>{c.participants.toLocaleString()}</td>
              <td style={{ color: T.green }}>{fmtPct(c.verifyRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function CampaignOwnerApp() {
  const [active, setActive] = useState("builder");
  const [campaigns, setCampaigns] = useState(seedCampaigns);
  const [feed] = useState(seedFeed);
  const [payouts] = useState(useMemo(() => [
    { id: "PAY-551", participant: "0x8F2ADC91", campaign: "CMP-104", amount: 4.8, requested: "3m ago" },
    { id: "PAY-550", participant: "0x2B190FE4", campaign: "CMP-103", amount: 1.2, requested: "11m ago" },
    { id: "PAY-549", participant: "0xA31CE207", campaign: "CMP-104", amount: 4.8, requested: "19m ago" },
  ], []));

  const createCampaign = (draft) => {
    dataService.createCampaign(draft).then((c) => setCampaigns([c, ...campaigns]));
  };

  const view = {
    builder: <CampaignBuilder campaigns={campaigns} onCreate={createCampaign} />,
    budget: <BudgetManagement campaigns={campaigns} />,
    targeting: <AudienceTargeting />,
    scheduling: <Scheduling campaigns={campaigns} />,
    verification: <VerificationRules campaigns={campaigns} />,
    metrics: <LiveMetrics feed={feed} campaigns={campaigns} />,
    rewards: <RewardManagement payouts={payouts} />,
    analytics: <Analytics campaigns={campaigns} />,
    history: <CampaignHistory campaigns={campaigns} />,
  }[active];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg0, fontFamily: T.sans }}>
      <aside style={{ width: 240, background: T.bg1, borderRight: `1px solid ${T.line}`, padding: "24px 14px", flexShrink: 0 }}>
        <div style={{ fontFamily: T.mono, fontSize: 13, color: T.accent, letterSpacing: "0.08em", padding: "0 10px 22px" }}>
          SYNCDROP <span style={{ color: T.text2 }}>· {TERMS[ROLES.CAMPAIGN_OWNER].label}</span>
        </div>
        {NAV.map((n) => (
          <div key={n.id} onClick={() => setActive(n.id)} style={{
            padding: "10px 12px", borderRadius: 6, cursor: "pointer", marginBottom: 2,
            fontFamily: T.mono, fontSize: 12, color: active === n.id ? T.bg0 : T.text1,
            background: active === n.id ? T.accent : "transparent",
          }}>{n.label}</div>
        ))}
      </aside>
      <main style={{ flex: 1, padding: "28px 32px", maxWidth: 760 }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
          {TERMS[ROLES.CAMPAIGN_OWNER].label} Console
        </div>
        <h1 style={{ fontFamily: T.sans, fontSize: 22, color: T.text0, marginBottom: 20 }}>{NAV.find((n) => n.id === active)?.label}</h1>
        {view}
      </main>
    </div>
  );
}
