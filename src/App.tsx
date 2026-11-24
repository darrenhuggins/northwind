import { NavLink, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ReactNode, useEffect } from "react";
import { PERSONAS, User, useUser } from "./user";
import { useVertical } from "./vertical";
import { VERTICALS, vertical } from "./verticals/defs";
import { Vertical } from "./verticals/types";
import { Dashboard, ClaimsList, ClaimDetail, NewClaim, Assignments, Reserves } from "./pages/claims";
import { Fraud, Payments, BatchPayments, Subrogation, Policies, PolicyDetail, Customers, CustomerDetail } from "./pages/business";
import { Adjusters, Vendors, Documents, Reports, ReportBuilder, Audit, Notifications, Profile, Roles, Rules, Integrations, Help, Agents } from "./pages/admin";
import { GDashboard, GList, GDetail, GWizard, GReports, GBuilder, GAudit, GNotifications, GProfile, GRoles, GRules, GIntegrations, GAgents, GHelp } from "./pages/generic";

type NavGroup = { group: string; items: [string, string][] };
const INS_NAV: NavGroup[] = [
  { group: "Overview", items: [["/", "Dashboard"]] },
  { group: "Claims", items: [["/claims", "All claims"], ["/claims/new", "Report a loss"], ["/assignments", "Assignments"], ["/reserves", "Reserves"]] },
  { group: "Risk", items: [["/fraud", "Fraud cases"], ["/subrogation", "Subrogation"]] },
  { group: "Finance", items: [["/payments", "Payments"], ["/payments/batch", "Batch payments"]] },
  { group: "Customers", items: [["/policies", "Policies"], ["/customers", "Customers"]] },
  { group: "Network", items: [["/adjusters", "Adjusters"], ["/vendors", "Vendors"]] },
  { group: "Content", items: [["/documents", "Documents"]] },
  { group: "AI", items: [["/agents", "AI agents"]] },
  { group: "Insight", items: [["/reports", "Reports"], ["/reports/builder", "Report builder"]] },
  { group: "Governance", items: [["/audit", "Audit log"], ["/notifications", "Notifications"]] },
  { group: "Settings", items: [["/settings/profile", "My profile"], ["/settings/roles", "Roles & access"], ["/settings/rules", "Business rules"], ["/settings/integrations", "Integrations"]] },
  { group: "Support", items: [["/help", "Help centre"]] },
];


const INSURANCE = { key: "insurance", name: "Insurance", product: "Northwind Claims", tagline: "Claims, fraud, payments and policies", accent: "#1d4ed8", side: "#0b1b3a", icon: "N" };
const CARDS = [INSURANCE, ...VERTICALS];

function Landing() {
  const { choose } = useVertical(); const [sp] = useSearchParams();
  useEffect(() => { const k = sp.get("v"); if (k && CARDS.some((c) => c.key === k)) choose(k); }, [sp]);
  return (
    <div className="landing" data-testid="page-landing">
      <div className="landing-head"><div className="brand big"><span className="logo">N</span> Northwind</div><h1>Choose an industry</h1><p className="muted">The demo opens a full application for the vertical you pick.</p></div>
      <div className="vgrid">{CARDS.map((c) => (
        <button key={c.key} className="vcard" data-testid={`vertical-${c.key}`} style={{ ["--vc" as any]: c.accent }} onClick={() => choose(c.key)}>
          <span className="vicon">{c.icon}</span><strong>{c.name}</strong><span className="muted">{c.product}</span><span className="vtag">{c.tagline}</span></button>))}</div>
    </div>
  );
}

function Login({ brand, personas }: { brand: string; personas: User[] }) {
  const { signIn } = useUser(); const { clear } = useVertical(); const nav = useNavigate();
  return (
    <div className="login" data-testid="page-login">
      <div className="login-card">
        <div className="brand big"><span className="logo">{brand[0]}</span> {brand}</div>
        <p className="muted">Sign in as a demo persona. No password needed.</p>
        {personas.map((p) => (
          <button key={p.id} className="persona" data-testid={`login-${p.id}`} onClick={() => { signIn(p); nav("/"); }}>
            <strong>{p.name}</strong><span>{p.role} · {p.team}</span>
          </button>))}
        <button data-testid="switch-industry" onClick={clear}>← Change industry</button>
      </div>
    </div>
  );
}

function Shell({ brand, icon, nav, children }: { brand: string; icon: string; nav: NavGroup[]; children: ReactNode }) {
  const { user, signOut } = useUser(); const { clear } = useVertical(); const loc = useLocation();
  return (
    <div className="shell">
      <aside className="side" data-testid="sidebar">
        <div className="brand"><span className="logo">{icon}</span> {brand}</div>
        {nav.map((g) => (
          <div key={g.group} className="nav-group"><div className="nav-title">{g.group}</div>
            {g.items.map(([to, label]) => (
              <NavLink key={to} to={to} end data-testid={`nav-${to.replace(/\//g, "-").replace(/^-/, "") || "home"}`} className={({ isActive }) => (isActive ? "nav active" : "nav")}>{label}</NavLink>))}
          </div>))}
      </aside>
      <div className="main">
        <header className="top" data-testid="topbar">
          <span className="crumb">{loc.pathname}</span><span className="spacer" />
          <span className="who" data-testid="who">{user?.name} · {user?.role}</span>
          <button data-testid="switch-industry-top" onClick={() => { signOut(); clear(); }}>Change industry</button>
          <button data-testid="sign-out" onClick={signOut}>Sign out</button>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

function InsuranceApp() {
  const { user } = useUser();
  if (!user) return <Login brand="Northwind Claims" personas={PERSONAS} />;
  return (
    <Shell brand="Northwind Claims" icon="N" nav={INS_NAV}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/claims" element={<ClaimsList />} /><Route path="/claims/new" element={<NewClaim />} /><Route path="/claims/:id" element={<ClaimDetail />} />
        <Route path="/assignments" element={<Assignments />} /><Route path="/reserves" element={<Reserves />} />
        <Route path="/fraud" element={<Fraud />} /><Route path="/subrogation" element={<Subrogation />} />
        <Route path="/payments" element={<Payments />} /><Route path="/payments/batch" element={<BatchPayments />} />
        <Route path="/policies" element={<Policies />} /><Route path="/policies/:id" element={<PolicyDetail />} />
        <Route path="/customers" element={<Customers />} /><Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/adjusters" element={<Adjusters />} /><Route path="/vendors" element={<Vendors />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/reports" element={<Reports />} /><Route path="/reports/builder" element={<ReportBuilder />} />
        <Route path="/audit" element={<Audit />} /><Route path="/notifications" element={<Notifications />} />
        <Route path="/settings/profile" element={<Profile />} /><Route path="/settings/roles" element={<Roles />} />
        <Route path="/settings/rules" element={<Rules />} /><Route path="/settings/integrations" element={<Integrations />} />
        <Route path="/help" element={<Help />} /><Route path="/agents" element={<Agents />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

function GenericApp({ v }: { v: Vertical }) {
  const { user } = useUser();
  if (!user) return <Login brand={v.product} personas={v.personas} />;
  const nav: NavGroup[] = [
    { group: "Overview", items: [["/", "Dashboard"]] },
    { group: "Records", items: [...v.entities.map((e): [string, string] => [`/e/${e.key}`, e.plural]), ["/new", v.wizard.title]] },
    { group: "AI", items: [["/agents", "AI agents"]] },
    { group: "Insight", items: [["/reports", "Reports"], ["/reports/builder", "Report builder"]] },
    { group: "Governance", items: [["/audit", "Audit log"], ["/notifications", "Notifications"]] },
    { group: "Settings", items: [["/settings/profile", "My profile"], ["/settings/roles", "Roles & access"], ["/settings/rules", "Business rules"], ["/settings/integrations", "Integrations"]] },
    { group: "Support", items: [["/help", "Help centre"]] },
  ];
  return (
    <Shell brand={v.product} icon={v.icon} nav={nav}>
      <Routes>
        <Route path="/" element={<GDashboard v={v} />} />
        <Route path="/e/:entity" element={<GList v={v} />} /><Route path="/e/:entity/:id" element={<GDetail v={v} />} /><Route path="/new" element={<GWizard v={v} />} />
        <Route path="/agents" element={<GAgents v={v} />} />
        <Route path="/reports" element={<GReports v={v} />} /><Route path="/reports/builder" element={<GBuilder v={v} />} />
        <Route path="/audit" element={<GAudit v={v} />} /><Route path="/notifications" element={<GNotifications v={v} />} />
        <Route path="/settings/profile" element={<GProfile v={v} />} /><Route path="/settings/roles" element={<GRoles v={v} />} />
        <Route path="/settings/rules" element={<GRules v={v} />} /><Route path="/settings/integrations" element={<GIntegrations v={v} />} />
        <Route path="/help" element={<GHelp v={v} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  const { vkey } = useVertical(); const { user } = useUser(); const c = CARDS.find((x) => x.key === vkey);
  useEffect(() => { document.title = c ? c.product : "Northwind"; }, [c]);
  // Identify the signed-in persona (on sign-in and when restored from localStorage) and the industry application as the account.
  useEffect(() => {
    if (!user || !c) return;
    pendo.identify({
      visitor: { id: user.id, full_name: user.name, role: user.role, region: user.region, team: user.team, accountId: vkey },
      account: { id: c.key, name: c.name, product: c.product },
    });
  }, [user, c, vkey]);
  const style = c ? ({ "--brand": c.accent, "--side": c.side } as React.CSSProperties) : undefined;
  return <div style={style}>{!c ? <Landing /> : c.key === "insurance" ? <InsuranceApp /> : <GenericApp key={c.key} v={vertical(c.key)!} />}</div>;
}
