import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN CONFIG — identical to CampaignOwnerApp.jsx. Extract to a shared
// `domain-config.js` when these move into one monorepo/build.
// ═══════════════════════════════════════════════════════════════════════════
const ROLES = { CAMPAIGN_OWNER: "campaign_owner", PARTICIPANT: "participant" };
const TERMS = {
  [ROLES.CAMPAIGN_OWNER]: { label: "Campaign Owner", plural: "Campaign Owners" },
  [ROLES.PARTICIPANT]: { label: "Participant", plural: "Participants" },
};

// ─── MOCK DATA SERVICE — same contract-first pattern as the owner app ───────
const seedFeed = [
  { id: "CMP-104", owner: "Northwind Labs", title: "Q3 Product Launch — Verified Views", reward: 0.045, unit: "per verified view", proofs: ["watch_time", "quiz"], joined: 3120, category: "Brand" },
  { id: "CMP-103", owner: "State University", title: "Campus Ambassador Drive", reward: 0.03, unit: "per check-in", proofs: ["geo_checkin"], joined: 640, category: "Education" },
  { id: "CMP-098", owner: "Civic Forward NGO", title: "Voter Registration Push", reward: 0.038, unit: "per registration", proofs: ["geo_checkin", "quiz"], joined: 9840, category: "NGO" },
  { id: "CMP-091", owner: "Beta Tester Recruitment", title: "Early Access Product Testing", reward: 0.06, unit: "per completed test", proofs: ["task_upload"], joined: 410, category: "Product" },
];

const seedWallet = { available: 84.20, pending: 12.60, lifetime: 612.40 };
const seedHistory = [
  { id: "PAY-540", campaign: "Q3 Product Launch", amount: 4.80, date: "2026-08-05", status: "paid" },
  { id: "PAY-538", campaign: "Campus Ambassador Drive", amount: 1.20, date: "2026-08-03", status: "paid" },
  { id: "PAY-531", campaign: "Voter Registration Push", amount: 3.80, date: "2026-07-29", status: "paid" },
  { id: "PAY-520", campaign: "Beta Tester Recruitment", amount: 6.00, date: "2026-07-18", status: "paid" },
];

const dataService = {
  async listFeed() { return seedFeed; },
  async joinCampaign(id) { return { ok: true, id }; },
  async submitProof(campaignId, proofType) { return { ok: true, status: "pending_review" }; },
  async getWallet() { return seedWallet; },
  async getHistory() { return seedHistory; },
};

// ─── DESIGN TOKENS (identical to CampaignOwnerApp.jsx) ──────────────────────
const T = {
  bg0: "#04060A", bg1: "#080C14", bg2: "#0D1220", bg3: "#111827",
  line: "#1A2336", accent: "#00E5FF", accentDim: "#00E5FF1F", gold: "#FFB800", goldDim: "#FFB80022",
  green: "#00FF9D", greenDim: "#00FF9D22", red: "#FF3366", redDim: "#FF336622",
  purple: "#8B5CF6", purpleDim: "#8B5CF622", text0: "#F0F4FF", text1: "#8899BB", text2: "#445577",
  mono: "'IBM Plex Mono', monospace", sans: "'DM Sans', sans-serif",
};
const fmt$ = (n) => `$${Number(n).toFixed(2)}`;

const NAV = [
  { id: "feed", label: "Campaign Feed" },
  { id: "wallet", label: "Wallet" },
  { id: "history", label: "Rewards History" },
  { id: "trust", label: "Trust Score" },
  { id: "profile", label: "Profile" },
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
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontFamily: T.sans, fontSize: 26, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text2, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
function Badge({ children, color }) {
  return <span style={{ fontFamily: T.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color, border: `1px solid ${color}55`, background: `${color}18`, borderRadius: 5, padding: "3px 8px" }}>{children}</span>;
}
function Button({ children, onClick, tone = T.accent, ghost, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: T.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em",
      color: disabled ? T.text2 : ghost ? tone : T.bg0, background: disabled ? T.bg1 : ghost ? "transparent" : tone,
      border: `1px solid ${disabled ? T.line : tone}`, borderRadius: 6, padding: "9px 16px",
      cursor: disabled ? "default" : "pointer",
    }}>{children}</button>
  );
}

// ── Campaign Details + Join + Task Completion + Verification (one flow) ────
function CampaignDetail({ campaign, joined, onJoin, onClose }) {
  const [tasks, setTasks] = useState(campaign.proofs.map((p) => ({ type: p, done: false })));
  const [submitted, setSubmitted] = useState(false);
  const complete = (type) => setTasks(tasks.map((t) => (t.type === type ? { ...t, done: true } : t)));
  const allDone = tasks.every((t) => t.done);
  const submitVerification = () => {
    dataService.submitProof(campaign.id, "bundle").then(() => setSubmitted(true));
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000AA", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div style={{ background: T.bg2, border: `1px solid ${T.line}`, borderRadius: 12, padding: 26, width: 420, maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
        <Badge color={T.accent}>{campaign.category}</Badge>
        <h2 style={{ fontFamily: T.sans, fontSize: 18, color: T.text0, margin: "10px 0 4px" }}>{campaign.title}</h2>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text2, marginBottom: 16 }}>by {campaign.owner} · {campaign.joined.toLocaleString()} joined</div>
        <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 18 }}>{fmt$(campaign.reward)} {campaign.unit}</div>

        {!joined && <Button onClick={() => onJoin(campaign.id)}>Join Campaign</Button>}

        {joined && !submitted && (
          <>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text1, textTransform: "uppercase", marginBottom: 8 }}>Complete required tasks</div>
            {tasks.map((t) => (
              <div key={t.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.line}` }}>
                <span style={{ fontFamily: T.sans, fontSize: 13, color: t.done ? T.green : T.text0 }}>{t.type.replace("_", " ")}</span>
                {t.done ? <Badge color={T.green}>done</Badge> : <Button ghost onClick={() => complete(t.type)}>Mark Complete</Button>}
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <Button disabled={!allDone} onClick={submitVerification} tone={T.purple}>Submit for Verification</Button>
            </div>
          </>
        )}

        {submitted && (
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.green, background: T.greenDim, border: `1px solid ${T.green}55`, borderRadius: 6, padding: 12 }}>
            Submitted — pending review. Reward releases to your wallet once verified.
          </div>
        )}

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Button ghost tone={T.text2} onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// ── MODULE: Campaign Feed ────────────────────────────────────────────────
function CampaignFeed({ feed, joinedIds, onJoin }) {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const categories = ["All", ...new Set(feed.map((c) => c.category))];
  const visible = filter === "All" ? feed : feed.filter((c) => c.category === filter);
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {categories.map((c) => (
          <div key={c} onClick={() => setFilter(c)} style={{ cursor: "pointer", padding: "6px 12px", borderRadius: 6, fontFamily: T.mono, fontSize: 11, border: `1px solid ${filter === c ? T.accent : T.line}`, color: filter === c ? T.accent : T.text2 }}>{c}</div>
        ))}
      </div>
      {visible.map((c) => (
        <Card key={c.id} accent={joinedIds.includes(c.id) ? T.green : T.accent}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <Badge color={T.purple}>{c.category}</Badge>
              <div style={{ fontFamily: T.sans, fontSize: 15, color: T.text0, margin: "8px 0 4px" }}>{c.title}</div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text2 }}>{c.owner} · {c.joined.toLocaleString()} joined · proof: {c.proofs.join(", ")}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 8 }}>{fmt$(c.reward)}<div style={{ fontSize: 9, color: T.text2 }}>{c.unit}</div></div>
              {joinedIds.includes(c.id) ? <Badge color={T.green}>joined</Badge> : <Button onClick={() => setSelected(c)}>View</Button>}
              {joinedIds.includes(c.id) && <div style={{ marginTop: 6 }}><Button ghost onClick={() => setSelected(c)}>Continue</Button></div>}
            </div>
          </div>
        </Card>
      ))}
      {selected && <CampaignDetail campaign={selected} joined={joinedIds.includes(selected.id)} onJoin={(id) => { onJoin(id); }} onClose={() => setSelected(null)} />}
    </>
  );
}

// ── MODULE: Wallet ───────────────────────────────────────────────────────
function Wallet({ wallet }) {
  const [withdrawn, setWithdrawn] = useState(false);
  return (
    <>
      <Card title="Balance">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Stat label="Available" value={fmt$(wallet.available)} color={T.green} />
          <Stat label="Pending Review" value={fmt$(wallet.pending)} color={T.gold} />
          <Stat label="Lifetime Earned" value={fmt$(wallet.lifetime)} color={T.text0} />
        </div>
        <div style={{ marginTop: 18 }}>
          <Button disabled={withdrawn} onClick={() => setWithdrawn(true)} tone={T.green}>{withdrawn ? "Withdrawal Requested" : "Withdraw Available Balance"}</Button>
        </div>
      </Card>
    </>
  );
}

// ── MODULE: Rewards History ──────────────────────────────────────────────
function RewardsHistory({ history }) {
  return (
    <Card title="Payout History" badge={`${history.length} payouts`}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.mono, fontSize: 11 }}>
        <thead>
          <tr style={{ color: T.text2, textAlign: "left", textTransform: "uppercase", fontSize: 10 }}>
            <th style={{ padding: "6px 0" }}>Campaign</th><th>Amount</th><th>Date</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id} style={{ borderTop: `1px solid ${T.line}`, color: T.text0 }}>
              <td style={{ padding: "8px 0" }}>{h.campaign}</td>
              <td style={{ color: T.gold }}>{fmt$(h.amount)}</td>
              <td style={{ color: T.text1 }}>{h.date}</td>
              <td><Badge color={T.green}>{h.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ── MODULE: Trust Score ──────────────────────────────────────────────────
function TrustScore() {
  const score = 84;
  const factors = [
    { label: "Verification Accuracy", value: 96 },
    { label: "Completion Rate", value: 88 },
    { label: "Account Age", value: 70 },
    { label: "Flag History", value: 100 },
  ];
  return (
    <>
      <Card title="Your Trust Score">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontFamily: T.sans, fontSize: 48, fontWeight: 800, color: T.accent }}>{score}</div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text2 }}>Elite tier · top 18% of {TERMS[ROLES.PARTICIPANT].plural.toLowerCase()}<br />Higher scores unlock higher-paying campaigns.</div>
        </div>
      </Card>
      <Card title="Score Factors">
        {factors.map((f) => (
          <div key={f.label} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.mono, fontSize: 11, color: T.text1, marginBottom: 4 }}>
              <span>{f.label}</span><span>{f.value}</span>
            </div>
            <div style={{ height: 6, background: T.bg1, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${f.value}%`, height: "100%", background: T.purple }} />
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

// ── MODULE: Profile ──────────────────────────────────────────────────────
function Profile() {
  const [name, setName] = useState("Alex Participant");
  const [email, setEmail] = useState("alex@example.com");
  const [saved, setSaved] = useState(false);
  return (
    <Card title="Profile">
      <label style={{ display: "block", marginBottom: 14 }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text1, textTransform: "uppercase", marginBottom: 6 }}>Display Name</div>
        <input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} style={{ width: "100%", background: T.bg1, border: `1px solid ${T.line}`, borderRadius: 6, color: T.text0, padding: "9px 11px", fontFamily: T.sans }} />
      </label>
      <label style={{ display: "block", marginBottom: 14 }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text1, textTransform: "uppercase", marginBottom: 6 }}>Email</div>
        <input value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false); }} style={{ width: "100%", background: T.bg1, border: `1px solid ${T.line}`, borderRadius: 6, color: T.text0, padding: "9px 11px", fontFamily: T.sans }} />
      </label>
      <Button onClick={() => setSaved(true)}>{saved ? "Saved ✓" : "Save Changes"}</Button>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function ParticipantApp() {
  const [active, setActive] = useState("feed");
  const [feed] = useState(seedFeed);
  const [joinedIds, setJoinedIds] = useState([]);
  const [wallet] = useState(seedWallet);
  const [history] = useState(seedHistory);

  const join = (id) => {
    dataService.joinCampaign(id).then(() => setJoinedIds((prev) => (prev.includes(id) ? prev : [...prev, id])));
  };

  const view = {
    feed: <CampaignFeed feed={feed} joinedIds={joinedIds} onJoin={join} />,
    wallet: <Wallet wallet={wallet} />,
    history: <RewardsHistory history={history} />,
    trust: <TrustScore />,
    profile: <Profile />,
  }[active];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg0, fontFamily: T.sans }}>
      <aside style={{ width: 220, background: T.bg1, borderRight: `1px solid ${T.line}`, padding: "24px 14px", flexShrink: 0 }}>
        <div style={{ fontFamily: T.mono, fontSize: 13, color: T.accent, letterSpacing: "0.08em", padding: "0 10px 22px" }}>
          SYNCDROP <span style={{ color: T.text2 }}>· {TERMS[ROLES.PARTICIPANT].label}</span>
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
          {TERMS[ROLES.PARTICIPANT].label} App
        </div>
        <h1 style={{ fontFamily: T.sans, fontSize: 22, color: T.text0, marginBottom: 20 }}>{NAV.find((n) => n.id === active)?.label}</h1>
        {view}
      </main>
    </div>
  );
}
