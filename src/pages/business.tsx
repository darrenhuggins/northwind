import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { claims, customers, fraudCases, money, payments, policies } from "../data";
import { Badge, DataTable, Modal, Page, Stat, useToast } from "../components/ui";
import { AgentLauncher } from "../components/AgentPanel";

export function Fraud() {
  const t = useToast(); const [open, setOpen] = useState<string | null>(null); const fc = fraudCases.find((f) => f.id === open);
  return (
    <Page id="fraud" title="Fraud cases" sub="Scored claims routed to special investigations">
      <div className="stats"><Stat id="f-open" label="Open cases" value={fraudCases.filter((f) => f.state === "Open").length} /><Stat id="f-esc" label="Escalated" value={fraudCases.filter((f) => f.state === "Escalated").length} /></div>
      <DataTable id="fraud" rows={fraudCases} filters={["state", "signal"]} onRow={(r) => setOpen(r.id)}
        cols={[{ key: "id", label: "Case" }, { key: "claimId", label: "Claim" }, { key: "customer", label: "Customer" }, { key: "score", label: "Score" }, { key: "signal", label: "Signal" }, { key: "state", label: "State", render: (r) => <Badge v={r.state} /> }, { key: "analyst", label: "Analyst" }]} />
      {fc && <Modal title={`${fc.id} · ${fc.signal}`} testid="modal-fraud" onClose={() => setOpen(null)}>
        <p>Claim <Link to={`/claims/${fc.claimId}`}>{fc.claimId}</Link> scored <strong>{fc.score}</strong>.</p>
        <div className="modal-foot"><button data-testid="fraud-clear" onClick={() => { setOpen(null); t.show("Case cleared"); }}>Clear</button>
          <button className="primary" data-testid="fraud-refer" onClick={() => { setOpen(null); t.show("Referred to SIU"); }}>Refer to SIU</button></div></Modal>}
      <AgentLauncher agent="sentinel" ctx={{ caseId: open || undefined }} />{t.node}
    </Page>
  );
}

export function Payments() {
  const nav = useNavigate();
  return (
    <Page id="payments" title="Payments" sub="Indemnity, expense and vendor disbursements" actions={<Link className="btn primary" data-testid="payments-batch" to="/payments/batch">Batch issue</Link>}>
      <DataTable id="payments" rows={payments} filters={["status", "kind", "method"]} onRow={(r) => nav(`/claims/${r.claimId}`)}
        cols={[{ key: "id", label: "Payment" }, { key: "claimId", label: "Claim" }, { key: "payee", label: "Payee" }, { key: "kind", label: "Type" }, { key: "method", label: "Method" },
          { key: "amount", label: "Amount", align: "right", render: (r) => money(r.amount) }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }, { key: "date", label: "Date" }]} />
    </Page>
  );
}

export function BatchPayments() {
  const t = useToast(); const pending = payments.filter((p) => p.status === "Pending approval" || p.status === "Scheduled");
  const [sel, setSel] = useState<string[]>([]); const total = pending.filter((p) => sel.includes(p.id)).reduce((a, p) => a + p.amount, 0);
  return (
    <Page id="batch" title="Batch payments" sub="Approve and issue scheduled payments together">
      <div className="card pad">
        {pending.map((p) => <label key={p.id} className="check"><input type="checkbox" data-testid={`batch-${p.id}`} checked={sel.includes(p.id)} onChange={(e) => setSel(e.target.checked ? [...sel, p.id] : sel.filter((x) => x !== p.id))} /> {p.id} · {p.payee} · {money(p.amount)} · {p.method}</label>)}
        <div className="modal-foot"><span className="muted">{sel.length} selected · {money(total)}</span>
          <button className="primary" data-testid="batch-issue" disabled={!sel.length} onClick={() => { t.show(`${sel.length} payments issued`); setSel([]); }}>Approve and issue</button></div>
      </div>{t.node}
    </Page>
  );
}

export function Subrogation() {
  const rows = claims.filter((c) => c.peril === "Collision" || c.peril === "Water damage").slice(0, 25).map((c, i) => ({ ...c, id: c.id, target: ["Apex Insurance", "Delta Mutual", "Third-party carrier", "Contractor"][i % 4], recoverable: Math.round(c.amount * 0.6), stage: ["Identified", "Demand sent", "Negotiating", "Recovered"][i % 4] }));
  return (
    <Page id="subrogation" title="Subrogation" sub="Recovery opportunities against responsible parties">
      <DataTable id="subro" rows={rows} filters={["stage"]} cols={[{ key: "id", label: "Claim" }, { key: "target", label: "Responsible party" }, { key: "recoverable", label: "Recoverable", align: "right", render: (r) => money(r.recoverable) }, { key: "stage", label: "Stage", render: (r) => <Badge v={r.stage} /> }]} />
    </Page>
  );
}

export function Policies() {
  const nav = useNavigate();
  return (
    <Page id="policies" title="Policies" sub="Coverage, limits and deductibles">
      <DataTable id="policies" rows={policies} filters={["lob", "status"]} onRow={(r) => nav(`/policies/${r.id}`)}
        cols={[{ key: "id", label: "Policy" }, { key: "customer", label: "Insured" }, { key: "lob", label: "Line" }, { key: "premium", label: "Premium", align: "right", render: (r) => money(r.premium) }, { key: "limit", label: "Limit", align: "right", render: (r) => money(r.limit) }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }]} />
    </Page>
  );
}

export function PolicyDetail() {
  const { id } = useParams(); const p = policies.find((x) => x.id === id); if (!p) return <Page id="policy-missing" title="Policy not found">{null}</Page>;
  const cl = claims.filter((c) => c.policyId === p.id);
  return (
    <Page id="policy-detail" title={p.id} sub={`${p.lob} · ${p.customer}`}>
      <div className="stats"><Stat id="p-prem" label="Premium" value={money(p.premium)} /><Stat id="p-lim" label="Limit" value={money(p.limit)} /><Stat id="p-ded" label="Deductible" value={money(p.deductible)} /><Stat id="p-st" label="Status" value={p.status} /></div>
      <h3 className="section">Claims on this policy</h3>
      <DataTable id="policy-claims" rows={cl} pageSize={6} cols={[{ key: "id", label: "Claim", render: (r) => <Link to={`/claims/${r.id}`}>{r.id}</Link> }, { key: "peril", label: "Peril" }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }, { key: "amount", label: "Claimed", align: "right", render: (r) => money(r.amount) }]} />
      <AgentLauncher agent="coverage" ctx={{ policyId: p.id }} />
    </Page>
  );
}

export function Customers() {
  const nav = useNavigate();
  return (
    <Page id="customers" title="Customers" sub="Customer 360 across policies and claims">
      <DataTable id="customers" rows={customers} filters={["tier", "city"]} onRow={(r) => nav(`/customers/${r.id}`)}
        cols={[{ key: "id", label: "ID" }, { key: "name", label: "Name" }, { key: "city", label: "City" }, { key: "tier", label: "Tier", render: (r) => <Badge v={r.tier} /> }, { key: "policies", label: "Policies" }, { key: "openClaims", label: "Open claims" }]} />
    </Page>
  );
}

export function CustomerDetail() {
  const { id } = useParams(); const c = customers.find((x) => x.id === id); const t = useToast(); if (!c) return <Page id="customer-missing" title="Customer not found">{null}</Page>;
  return (
    <Page id="customer-detail" title={c.name} sub={`${c.id} · ${c.city} · customer since ${c.since}`} actions={<button data-testid="customer-contact" onClick={() => t.show(`Email drafted to ${c.email}`)}>Contact customer</button>}>
      <div className="stats"><Stat id="c-tier" label="Tier" value={c.tier} /><Stat id="c-pol" label="Policies" value={c.policies} /><Stat id="c-open" label="Open claims" value={c.openClaims} /></div>
      <h3 className="section">Policies</h3>
      <DataTable id="customer-policies" rows={policies.filter((p) => p.customerId === c.id)} pageSize={5} cols={[{ key: "id", label: "Policy", render: (r) => <Link to={`/policies/${r.id}`}>{r.id}</Link> }, { key: "lob", label: "Line" }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }]} />
      {t.node}
    </Page>
  );
}
