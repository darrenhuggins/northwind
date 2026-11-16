import { useState } from "react";
import { adjusters, auditLog, claims, documents, integrations, money, roles, rules, vendors, LOBS } from "../data";
import { Badge, Bars, DataTable, Modal, Page, Stat, Toggle, useToast } from "../components/ui";
import { useUser } from "../user";

export function Adjusters() {
  return (
    <Page id="adjusters" title="Adjusters" sub="Caseload and availability">
      <DataTable id="adjusters" rows={adjusters} filters={["region", "status"]} cols={[{ key: "name", label: "Name" }, { key: "region", label: "Region" }, { key: "specialty", label: "Specialty" },
        { key: "caseload", label: "Caseload", render: (r) => `${r.caseload}/${r.capacity}` }, { key: "rating", label: "Rating" }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }]} />
    </Page>
  );
}

export function Vendors() {
  const t = useToast();
  return (
    <Page id="vendors" title="Vendor network" sub="Repair, appraisal, legal and forensic partners" actions={<button data-testid="vendor-add" onClick={() => t.show("Vendor onboarding started")}>Add vendor</button>}>
      <DataTable id="vendors" rows={vendors} filters={["type", "region", "status"]} cols={[{ key: "name", label: "Vendor" }, { key: "type", label: "Type" }, { key: "region", label: "Region" }, { key: "sla", label: "SLA" }, { key: "score", label: "Score" }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }]} />
      {t.node}
    </Page>
  );
}

export function Documents() {
  const t = useToast();
  return (
    <Page id="documents" title="Documents" sub="Claim files, photos and correspondence" actions={<button className="primary" data-testid="doc-upload" onClick={() => t.show("Upload dialog (demo)")}>Upload</button>}>
      <DataTable id="documents" rows={documents} filters={["type"]} cols={[{ key: "name", label: "Name" }, { key: "claimId", label: "Claim" }, { key: "type", label: "Type" }, { key: "size", label: "Size" }, { key: "uploaded", label: "Uploaded" }, { key: "by", label: "By" }]} />
      {t.node}
    </Page>
  );
}

export function Reports() {
  const t = useToast();
  const reports = ["Loss ratio by line", "Cycle time by adjuster", "Reserve adequacy", "Fraud referral outcomes", "Vendor performance", "Payments aging"];
  return (
    <Page id="reports" title="Reports" sub="Scheduled and saved reports">
      <div className="grid3">{reports.map((r, i) => <div key={r} className="card pad"><h3>{r}</h3><p className="muted">Updated daily · {["Finance", "Ops", "Risk"][i % 3]}</p>
        <button data-testid={`report-run-${i}`} onClick={() => t.show(`${r} generated`)}>Run</button></div>)}</div>
      {t.node}
    </Page>
  );
}

export function ReportBuilder() {
  const [lob, setLob] = useState("All"); const [metric, setMetric] = useState("count"); const [by, setBy] = useState("status");
  const src = claims.filter((c) => lob === "All" || c.lob === lob);
  const groups = Array.from(new Set(src.map((c: any) => c[by])));
  const data = groups.map((g) => { const s = src.filter((c: any) => c[by] === g); return { label: String(g), value: metric === "count" ? s.length : Math.round(s.reduce((a, c) => a + c.amount, 0) / 1000) }; });
  return (
    <Page id="report-builder" title="Report builder" sub="Group and measure claims">
      <div className="card pad form-grid">
        <label>Line<select data-testid="rb-lob" value={lob} onChange={(e) => setLob(e.target.value)}><option>All</option>{LOBS.map((l) => <option key={l}>{l}</option>)}</select></label>
        <label>Measure<select data-testid="rb-metric" value={metric} onChange={(e) => setMetric(e.target.value)}><option value="count">Claim count</option><option value="amount">Claimed $K</option></select></label>
        <label>Group by<select data-testid="rb-by" value={by} onChange={(e) => setBy(e.target.value)}><option value="status">Status</option><option value="peril">Peril</option><option value="severity">Severity</option><option value="adjuster">Adjuster</option></select></label>
      </div>
      <div className="card pad"><Bars id="rb-chart" data={data} /></div>
    </Page>
  );
}

export function Audit() {
  return <Page id="audit" title="Audit log" sub="Every action, who did it and from where"><DataTable id="audit" rows={auditLog} filters={["action"]} cols={[{ key: "when", label: "When" }, { key: "actor", label: "Actor" }, { key: "action", label: "Action" }, { key: "object", label: "Object" }, { key: "ip", label: "IP" }]} /></Page>;
}

export function Notifications() {
  const [items, setItems] = useState([
    { id: "n1", text: "CLM-10042 flagged by fraud rule R-02", read: false }, { id: "n2", text: "Payment PAY-7012 failed, retry needed", read: false },
    { id: "n3", text: "Adjuster capacity above 90% in the South region", read: true }, { id: "n4", text: "Weekly reserve report is ready", read: true }]);
  return (
    <Page id="notifications" title="Notifications" actions={<button data-testid="notif-readall" onClick={() => setItems(items.map((i) => ({ ...i, read: true })))}>Mark all read</button>}>
      <div className="card pad">{items.map((i) => <div key={i.id} className={`notif ${i.read ? "" : "unread"}`} data-testid={`notif-${i.id}`} onClick={() => setItems(items.map((x) => x.id === i.id ? { ...x, read: true } : x))}>{i.text}</div>)}</div>
    </Page>
  );
}

export function Profile() {
  const { user } = useUser(); const t = useToast();
  return (
    <Page id="profile" title="My profile">
      <div className="card pad form-grid">
        <label>Name<input data-testid="profile-name" defaultValue={user?.name} /></label><label>Role<input disabled value={user?.role} /></label><label>Region<input data-testid="profile-region" defaultValue={user?.region} /></label>
        <label>Email digest<select data-testid="profile-digest"><option>Daily</option><option>Weekly</option><option>Off</option></select></label>
      </div>
      <button className="primary" data-testid="profile-save" onClick={() => t.show("Profile saved")}>Save</button>{t.node}
    </Page>
  );
}

export function Roles() {
  const [open, setOpen] = useState<string | null>(null); const r = roles.find((x) => x.id === open);
  return (
    <Page id="roles" title="Roles & access" sub="Who can do what">
      <DataTable id="roles" rows={roles} onRow={(x) => setOpen(x.id)} cols={[{ key: "name", label: "Role" }, { key: "users", label: "Users" }, { key: "perms", label: "Permissions", render: (x) => x.perms.join(", ") }]} />
      {r && <Modal title={r.name} testid="modal-role" onClose={() => setOpen(null)}>{r.perms.map((p) => <label key={p} className="check"><input type="checkbox" defaultChecked /> {p}</label>)}
        <div className="modal-foot"><button className="primary" data-testid="role-save" onClick={() => setOpen(null)}>Save</button></div></Modal>}
    </Page>
  );
}

export function Rules() {
  const [state, setState] = useState(Object.fromEntries(rules.map((r) => [r.id, r.enabled])));
  return (
    <Page id="rules" title="Business rules" sub="Automation that runs on every claim">
      <div className="card">{rules.map((r) => <div key={r.id} className="rule"><div><strong>{r.name}</strong><div className="muted">{r.area}</div></div>
        <Toggle id={`rule-${r.id}`} on={state[r.id]} onChange={(v) => setState({ ...state, [r.id]: v })} /></div>)}</div>
    </Page>
  );
}

export function Integrations() {
  const [st, setSt] = useState(Object.fromEntries(integrations.map((i) => [i.id, i.state]))); const t = useToast();
  return (
    <Page id="integrations" title="Integrations" sub="Connected systems">
      <div className="grid3">{integrations.map((i) => <div key={i.id} className="card pad"><h3>{i.name}</h3><Badge v={st[i.id]} />
        <div><button data-testid={`int-${i.id}`} onClick={() => { const next = st[i.id] === "Connected" ? "Not connected" : "Connected"; setSt({ ...st, [i.id]: next }); t.show(`${i.name} ${next.toLowerCase()}`); }}>{st[i.id] === "Connected" ? "Disconnect" : "Connect"}</button></div></div>)}</div>
      {t.node}
    </Page>
  );
}

export function Help() {
  const [q, setQ] = useState("");
  const faq = ["How do I reassign a claim?", "What triggers a fraud alert?", "How are reserves calculated?", "Who can approve payments over $25,000?", "How do I export a report?", "How do I connect a new integration?"];
  return (
    <Page id="help" title="Help centre">
      <input data-testid="help-search" placeholder="Search articles" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card pad">{faq.filter((f) => f.toLowerCase().includes(q.toLowerCase())).map((f, i) => <details key={f} data-testid={`faq-${i}`}><summary>{f}</summary><p className="muted">See the claims handbook, section {i + 1}. Contact your manager for exceptions.</p></details>)}</div>
      <Stat id="help-total" label="Articles" value={faq.length} />
    </Page>
  );
}
