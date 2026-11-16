import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adjusters, claims, customers, documents, LOBS, money, PERILS, STATUSES, payments } from "../data";
import { Badge, Bars, DataTable, Modal, Page, Stat, useToast } from "../components/ui";
import { AgentLauncher } from "../components/AgentPanel";

export function Dashboard() {
  const open = claims.filter((c) => !["Closed", "Denied"].includes(c.status));
  const byLob = LOBS.map((l) => ({ label: l, value: claims.filter((c) => c.lob === l).length }));
  const byStatus = STATUSES.map((s) => ({ label: s, value: claims.filter((c) => c.status === s).length }));
  return (
    <Page id="dashboard" title="Claims operations" sub="Live view of the book across all lines of business">
      <div className="stats">
        <Stat id="open" label="Open claims" value={open.length} sub="+6 vs last week" />
        <Stat id="reserve" label="Total reserves" value={money(open.reduce((a, c) => a + c.reserve, 0))} />
        <Stat id="fraud" label="Fraud alerts" value={claims.filter((c) => c.fraudScore > 80).length} sub="needs review" />
        <Stat id="cycle" label="Avg cycle time" value="18.4 days" sub="-1.2 days" />
      </div>
      <div className="grid2">
        <div className="card pad"><h3>Claims by line of business</h3><Bars id="chart-lob" data={byLob} /></div>
        <div className="card pad"><h3>Claims by status</h3><Bars id="chart-status" data={byStatus} /></div>
      </div>
      <h3 className="section">Needs attention</h3>
      <DataTable id="attention" rows={claims.filter((c) => c.severity === "Critical" || c.litigated).slice(0, 8)} pageSize={8}
        cols={[{ key: "id", label: "Claim" }, { key: "customer", label: "Customer" }, { key: "peril", label: "Peril" }, { key: "severity", label: "Severity", render: (r) => <Badge v={r.severity} /> }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }]} />
    </Page>
  );
}

export function ClaimsList() {
  const nav = useNavigate();
  return (
    <Page id="claims" title="All claims" sub="Search, filter and open any claim"
      actions={<><button data-testid="claims-export" onClick={() => alert("Export queued (demo)")}>Export</button><Link className="btn primary" data-testid="claims-new" to="/claims/new">Report a loss</Link></>}>
      <DataTable id="claims" rows={claims} filters={["status", "lob", "severity"]} onRow={(r) => nav(`/claims/${r.id}`)}
        cols={[{ key: "id", label: "Claim" }, { key: "customer", label: "Customer" }, { key: "lob", label: "Line" }, { key: "peril", label: "Peril" },
          { key: "severity", label: "Severity", render: (r) => <Badge v={r.severity} /> }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> },
          { key: "amount", label: "Claimed", align: "right", render: (r) => money(r.amount) }, { key: "reported", label: "Reported" }]} />
    </Page>
  );
}

export function ClaimDetail() {
  const { id } = useParams(); const c = claims.find((x) => x.id === id); const t = useToast();
  const [tab, setTab] = useState("overview"); const [status, setStatus] = useState(c?.status); const [modal, setModal] = useState<string | null>(null); const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>(["Initial contact made with insured.", "Photos received and logged."]);
  if (!c) return <Page id="claim-missing" title="Claim not found">{null}</Page>;
  const docs = documents.filter((d) => d.claimId === c.id); const pays = payments.filter((p) => p.claimId === c.id);
  return (
    <Page id="claim-detail" title={`${c.id} · ${c.customer}`} sub={`${c.lob} · ${c.peril} · ${c.location}`}
      actions={<><button data-testid="claim-reassign" onClick={() => setModal("assign")}>Reassign</button><button data-testid="claim-reserve" onClick={() => setModal("reserve")}>Change reserve</button>
        <button className="primary" data-testid="claim-pay" onClick={() => setModal("pay")}>Request payment</button></>}>
      <div className="stats">
        <Stat id="d-status" label="Status" value={status || ""} /><Stat id="d-amount" label="Claimed" value={money(c.amount)} />
        <Stat id="d-reserve" label="Reserve" value={money(c.reserve)} /><Stat id="d-fraud" label="Fraud score" value={c.fraudScore} sub={c.fraudScore > 70 ? "Review recommended" : "Normal"} />
      </div>
      <div className="tabs">{["overview", "notes", "documents", "payments", "timeline"].map((x) => (
        <button key={x} data-testid={`claim-tab-${x}`} className={tab === x ? "tab active" : "tab"} onClick={() => setTab(x)}>{x[0].toUpperCase() + x.slice(1)}</button>))}</div>
      <div className="card pad">
        {tab === "overview" && <div className="form-grid">
          <label>Status<select data-testid="claim-status" value={status} onChange={(e) => { setStatus(e.target.value as any); t.show(`Status changed to ${e.target.value}`); }}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <div><span className="muted">Adjuster</span><div>{c.adjuster}</div></div><div><span className="muted">Policy</span><div><Link to={`/policies/${c.policyId}`}>{c.policyId}</Link></div></div>
          <div><span className="muted">Customer</span><div><Link to={`/customers/${c.customerId}`}>{c.customer}</Link></div></div><div><span className="muted">Reported</span><div>{c.reported}</div></div>
          <div><span className="muted">Litigated</span><div>{c.litigated ? "Yes" : "No"}</div></div></div>}
        {tab === "notes" && <><ul className="plain">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          <div className="row"><input data-testid="claim-note-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" />
            <button data-testid="claim-note-add" onClick={() => { if (note) { setNotes([note, ...notes]); setNote(""); t.show("Note added"); } }}>Add</button></div></>}
        {tab === "documents" && (docs.length ? <ul className="plain">{docs.map((d) => <li key={d.id}>{d.name} <span className="muted">{d.type} · {d.size}</span></li>)}</ul> : <p className="muted">No documents yet.</p>)}
        {tab === "payments" && (pays.length ? <ul className="plain">{pays.map((p) => <li key={p.id}>{p.id} · {money(p.amount)} · <Badge v={p.status} /></li>)}</ul> : <p className="muted">No payments yet.</p>)}
        {tab === "timeline" && <ul className="plain"><li>{c.reported} · Loss reported</li><li>Assigned to {c.adjuster}</li><li>Reserve set to {money(c.reserve)}</li></ul>}
      </div>
      {modal === "assign" && <Modal title="Reassign adjuster" testid="modal-assign" onClose={() => setModal(null)}>
        <select data-testid="assign-select">{adjusters.map((a) => <option key={a.id}>{a.name}</option>)}</select>
        <div className="modal-foot"><button className="primary" data-testid="assign-confirm" onClick={() => { setModal(null); t.show("Adjuster reassigned"); }}>Confirm</button></div></Modal>}
      {modal === "reserve" && <Modal title="Change reserve" testid="modal-reserve" onClose={() => setModal(null)}>
        <input data-testid="reserve-input" type="number" defaultValue={c.reserve} />
        <div className="modal-foot"><button className="primary" data-testid="reserve-confirm" onClick={() => { setModal(null); t.show("Reserve updated"); }}>Save</button></div></Modal>}
      {modal === "pay" && <Modal title="Request payment" testid="modal-pay" onClose={() => setModal(null)}>
        <input data-testid="pay-amount" type="number" placeholder="Amount" /><select data-testid="pay-method"><option>ACH</option><option>Check</option><option>Virtual card</option></select>
        <div className="modal-foot"><button className="primary" data-testid="pay-confirm" onClick={() => { setModal(null); t.show("Payment requested"); }}>Submit</button></div></Modal>}
      <AgentLauncher agent="copilot" ctx={{ claimId: c.id }} slot={1} /><AgentLauncher agent="reserve" ctx={{ claimId: c.id }} slot={0} />
      {t.node}
    </Page>
  );
}

export function NewClaim() {
  const [step, setStep] = useState(1); const nav = useNavigate(); const t = useToast();
  const [f, setF] = useState({ customer: customers[0].id, lob: LOBS[0], peril: PERILS[0], date: "2026-11-10", desc: "", amount: "" });
  const set = (k: string, v: string) => setF({ ...f, [k]: v });
  return (
    <Page id="new-claim" title="Report a loss" sub={`First notice of loss · step ${step} of 4`}>
      <div className="steps">{["Insured", "Loss details", "Damages", "Review"].map((s, i) => <div key={s} className={i + 1 <= step ? "step on" : "step"}>{i + 1}. {s}</div>)}</div>
      <div className="card pad">
        {step === 1 && <label>Customer<select data-testid="fnol-customer" value={f.customer} onChange={(e) => set("customer", e.target.value)}>{customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}</select></label>}
        {step === 2 && <div className="form-grid"><label>Line of business<select data-testid="fnol-lob" value={f.lob} onChange={(e) => set("lob", e.target.value)}>{LOBS.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>Peril<select data-testid="fnol-peril" value={f.peril} onChange={(e) => set("peril", e.target.value)}>{PERILS.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>Date of loss<input data-testid="fnol-date" type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></label></div>}
        {step === 3 && <div className="form-grid"><label>Estimated amount<input data-testid="fnol-amount" type="number" value={f.amount} onChange={(e) => set("amount", e.target.value)} /></label>
          <label>Description<textarea data-testid="fnol-desc" value={f.desc} onChange={(e) => set("desc", e.target.value)} /></label></div>}
        {step === 4 && <ul className="plain"><li>Customer: {f.customer}</li><li>{f.lob} · {f.peril} on {f.date}</li><li>Estimate: {f.amount || "n/a"}</li><li>{f.desc || "No description"}</li></ul>}
        <div className="modal-foot">
          {step > 1 && <button data-testid="fnol-back" onClick={() => setStep(step - 1)}>Back</button>}
          {step < 4 ? <button className="primary" data-testid="fnol-next" onClick={() => setStep(step + 1)}>Continue</button>
            : <button className="primary" data-testid="fnol-submit" onClick={() => { t.show("Claim CLM-10999 created"); setTimeout(() => nav("/claims"), 900); }}>Submit claim</button>}
        </div>
      </div><AgentLauncher agent="intake" />{t.node}
    </Page>
  );
}

export function Assignments() {
  const t = useToast(); const [rows, setRows] = useState(claims.filter((c) => c.status === "New" || c.status === "Triage").slice(0, 20));
  return (
    <Page id="assignments" title="Assignment queue" sub="Unassigned and newly triaged claims">
      <DataTable id="assign" rows={rows} filters={["lob", "severity"]} pageSize={10}
        actions={<button className="primary" data-testid="assign-auto" onClick={() => { setRows([]); t.show("Auto-assigned by region and caseload"); }}>Auto-assign all</button>}
        cols={[{ key: "id", label: "Claim" }, { key: "lob", label: "Line" }, { key: "severity", label: "Severity", render: (r) => <Badge v={r.severity} /> }, { key: "location", label: "Location" },
          { key: "adjuster", label: "Suggested adjuster" }, { key: "status", label: "", render: (r) => <button data-testid={`assign-${r.id}`} onClick={(e) => { e.stopPropagation(); setRows(rows.filter((x) => x.id !== r.id)); t.show(`${r.id} assigned`); }}>Assign</button> }]} />
      <AgentLauncher agent="dispatch" />{t.node}
    </Page>
  );
}

export function Reserves() {
  const open = claims.filter((c) => !["Closed", "Denied"].includes(c.status));
  return (
    <Page id="reserves" title="Reserves" sub="Case reserves against claimed amounts">
      <div className="stats"><Stat id="r-total" label="Total reserve" value={money(open.reduce((a, c) => a + c.reserve, 0))} /><Stat id="r-under" label="Under-reserved" value={open.filter((c) => c.reserve < c.amount * 0.5).length} sub="reserve under 50% of claim" /></div>
      <DataTable id="reserves" rows={open} filters={["lob"]} cols={[{ key: "id", label: "Claim" }, { key: "lob", label: "Line" }, { key: "amount", label: "Claimed", align: "right", render: (r) => money(r.amount) }, { key: "reserve", label: "Reserve", align: "right", render: (r) => money(r.reserve) }, { key: "adjuster", label: "Adjuster" }]} />
    </Page>
  );
}
