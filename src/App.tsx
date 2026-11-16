import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { PERSONAS, useUser } from "./user";
import { Dashboard, ClaimsList, ClaimDetail, NewClaim, Assignments, Reserves } from "./pages/claims";
import { Fraud, Payments, BatchPayments, Subrogation, Policies, PolicyDetail, Customers, CustomerDetail } from "./pages/business";
import { Adjusters, Vendors, Documents, Reports, ReportBuilder, Audit, Notifications, Profile, Roles, Rules, Integrations, Help } from "./pages/admin";

const NAV: { group: string; items: [string, string][] }[] = [
  { group: "Overview", items: [["/", "Dashboard"]] },
  { group: "Claims", items: [["/claims", "All claims"], ["/claims/new", "Report a loss"], ["/assignments", "Assignments"], ["/reserves", "Reserves"]] },
  { group: "Risk", items: [["/fraud", "Fraud cases"], ["/subrogation", "Subrogation"]] },
  { group: "Finance", items: [["/payments", "Payments"], ["/payments/batch", "Batch payments"]] },
  { group: "Customers", items: [["/policies", "Policies"], ["/customers", "Customers"]] },
  { group: "Network", items: [["/adjusters", "Adjusters"], ["/vendors", "Vendors"]] },
  { group: "Content", items: [["/documents", "Documents"]] },
  { group: "Insight", items: [["/reports", "Reports"], ["/reports/builder", "Report builder"]] },
  { group: "Governance", items: [["/audit", "Audit log"], ["/notifications", "Notifications"]] },
  { group: "Settings", items: [["/settings/profile", "My profile"], ["/settings/roles", "Roles & access"], ["/settings/rules", "Business rules"], ["/settings/integrations", "Integrations"]] },
  { group: "Support", items: [["/help", "Help centre"]] },
];

function Login() {
  const { signIn } = useUser(); const nav = useNavigate();
  return (
    <div className="login" data-testid="page-login">
      <div className="login-card">
        <div className="brand big"><span className="logo">N</span> Northwind Claims</div>
        <p className="muted">Sign in as a demo persona. No password needed.</p>
        {PERSONAS.map((p) => (
          <button key={p.id} className="persona" data-testid={`login-${p.id}`} onClick={() => { signIn(p); nav("/"); }}>
            <strong>{p.name}</strong><span>{p.role} · {p.team}</span>
          </button>))}
      </div>
    </div>
  );
}

export default function App() {
  const { user, signOut } = useUser(); const loc = useLocation();
  if (!user) return <Login />;
  return (
    <div className="shell">
      <aside className="side" data-testid="sidebar">
        <div className="brand"><span className="logo">N</span> Northwind Claims</div>
        {NAV.map((g) => (
          <div key={g.group} className="nav-group"><div className="nav-title">{g.group}</div>
            {g.items.map(([to, label]) => (
              <NavLink key={to} to={to} end data-testid={`nav-${to.replace(/\//g, "-").replace(/^-/, "") || "home"}`} className={({ isActive }) => (isActive ? "nav active" : "nav")}>{label}</NavLink>))}
          </div>))}
      </aside>
      <div className="main">
        <header className="top" data-testid="topbar">
          <span className="crumb">{loc.pathname}</span><span className="spacer" />
          <span className="who" data-testid="who">{user.name} · {user.role}</span>
          <button data-testid="sign-out" onClick={signOut}>Sign out</button>
        </header>
        <main className="content">
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
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
