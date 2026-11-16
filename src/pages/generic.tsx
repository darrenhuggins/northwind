import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Bars, Col, DataTable, Modal, Page, Stat, Toggle, useToast } from "../components/ui";
import { AgentLauncher } from "../components/AgentPanel";
import { Vertical } from "../verticals/types";
import { aggregate, dataFor, ent, Row, show, specFor, titleOf } from "../verticals/engine";
import { useUser } from "../user";

type VP = { v: Vertical };
const cols = (v: Vertical, k: string, nav: (p: string) => void): Col<Row>[] => {
  const e = ent(v, k);
  return [{ key: "id", label: e.label, render: (r) => <Link to={`/e/${k}/${r.id}`} onClick={(x) => x.stopPropagation()}>{r.id}</Link> },
    ...e.fields.slice(0, 6).map((f): Col<Row> => ({ key: f.k, label: f.label, align: f.t === "money" ? "right" : undefined,
      render: (r) => f.status ? <Badge v={r[f.k]} /> : f.t === "ref" ? <Link to={`/e/${f.ref}/${r[f.k]}`} onClick={(x) => x.stopPropagation()}>{r[f.k]}</Link> : show(f, r[f.k]) }))];
  void nav;
};

export function GDashboard({ v }: VP) {
  const d = dataFor(v);
  return (
    <Page id="dashboard" title={v.product} sub={v.tagline}>
      <div className="stats">{v.stats.map((s) => <Stat key={s.id} id={s.id} label={s.label} value={aggregate(v, s)} sub={s.sub} />)}</div>
      <div className="grid2">{v.charts.map((c, i) => {
        const counts: Record<string, number> = {}; d[c.entity].forEach((r) => { counts[r[c.by]] = (counts[r[c.by]] || 0) + 1; });
        return <div key={c.title} className="card pad"><h3>{c.title}</h3><Bars id={`chart-${i}`} data={Object.entries(counts).map(([label, value]) => ({ label, value }))} /></div>;
      })}</div>
      <h3 className="section">Needs attention</h3>
      <AttentionTable v={v} entityKey={v.entities[0].key} />
    </Page>
  );
}

function AttentionTable({ v, entityKey }: { v: Vertical; entityKey: string }) {
  const nav = useNavigate(); const e = ent(v, entityKey); const sf = e.fields.find((f) => f.status)!;
  const rows = dataFor(v)[entityKey].filter((r) => e.attention.includes(r[sf.k])).slice(0, 8);
  return <DataTable id="attention" rows={rows} pageSize={8} onRow={(r) => nav(`/e/${entityKey}/${r.id}`)} cols={cols(v, entityKey, nav)} />;
}

export function GList({ v }: VP) {
  const { entity } = useParams(); const nav = useNavigate(); const e = v.entities.find((x) => x.key === entity); const t = useToast();
  if (!e) return <Page id="missing" title="Not found">{null}</Page>;
  const filters = e.fields.filter((f) => f.filter).map((f) => f.k);
  return (
    <Page id={`list-${e.key}`} title={e.plural} sub={`Search, filter and open any ${e.label.toLowerCase()}`}
      actions={<><button data-testid="list-export" onClick={() => t.show("Export queued (demo)")}>Export</button>{e.key === v.wizard.entity && <Link className="btn primary" data-testid="list-new" to="/new">{v.wizard.title}</Link>}</>}>
      <DataTable id={e.key} rows={dataFor(v)[e.key]} filters={filters} onRow={(r) => nav(`/e/${e.key}/${r.id}`)} cols={cols(v, e.key, nav)} />
      <AgentFor v={v} entityKey={e.key} />{t.node}
    </Page>
  );
}

function AgentFor({ v, entityKey, recordId }: { v: Vertical; entityKey: string; recordId?: string }) {
  const m = v.agents.filter((x) => x.entity === entityKey); const a = m.length ? m : [v.agents[0]]; if (!m.length) recordId = undefined;
  return <>{a.map((x, i) => <AgentLauncher key={x.key} spec={specFor(v, x)} ctx={{ recordId }} slot={i} />)}</>;
}

export function GDetail({ v }: VP) {
  const { entity, id } = useParams(); const e = v.entities.find((x) => x.key === entity); const t = useToast(); const d = dataFor(v); const { user } = useUser();
  const r = e && d[e.key].find((x) => x.id === id); const [tab, setTab] = useState("overview"); const [note, setNote] = useState(""); const [notes, setNotes] = useState<string[]>(["Record created.", "Reviewed by team lead."]);
  const sf = e?.fields.find((f) => f.status); const [status, setStatus] = useState(r && sf ? r[sf.k] : ""); const [modal, setModal] = useState(false);
  const related = useMemo(() => !e ? [] : v.entities.flatMap((o) => o.fields.filter((f) => f.t === "ref" && f.ref === e.key).map((f) => ({ o, f }))), [v, e]);
  if (!e || !r || !sf) return <Page id="missing" title="Not found">{null}</Page>;
  const opts = Array.from(new Set(sf.opts));
  const mf = e.fields.find((f) => f.t === "money");
  return (
    <Page id={`detail-${e.key}`} title={`${r.id} · ${titleOf(e, r)}`} sub={e.label}
      actions={<><button data-testid="detail-assign" onClick={() => setModal(true)}>Reassign</button><button className="primary" data-testid="detail-action" onClick={() => t.show(`${e.label} updated`)}>Save changes</button></>}>
      <div className="stats"><Stat id="d-status" label={sf.label} value={status} />{mf && <Stat id="d-money" label={mf.label} value={show(mf, r[mf.k])} />}
        {e.fields.filter((f) => f.t === "int" || f.t === "pct").slice(0, 2).map((f) => <Stat key={f.k} id={`d-${f.k}`} label={f.label} value={show(f, r[f.k])} />)}</div>
      <div className="tabs">{["overview", "notes", "activity", ...(related.length ? ["related"] : [])].map((x) => <button key={x} data-testid={`detail-tab-${x}`} className={tab === x ? "tab active" : "tab"} onClick={() => setTab(x)}>{x[0].toUpperCase() + x.slice(1)}</button>)}</div>
      <div className="card pad">
        {tab === "overview" && <div className="form-grid">
          <label>{sf.label}<select data-testid="detail-status" value={status} onChange={(x) => { setStatus(x.target.value); t.show(`Status changed to ${x.target.value}`); }}>{opts.map((o) => <option key={o}>{o}</option>)}</select></label>
          {e.fields.filter((f) => !f.status).map((f) => <div key={f.k}><span className="muted">{f.label}</span><div>{f.t === "ref" ? <Link to={`/e/${f.ref}/${r[f.k]}`}>{r[f.k]}</Link> : show(f, r[f.k])}</div></div>)}</div>}
        {tab === "notes" && <><ul className="plain">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul><div className="row"><input data-testid="detail-note-input" value={note} onChange={(x) => setNote(x.target.value)} placeholder="Add a note" /><button data-testid="detail-note-add" onClick={() => { if (note) { setNotes([note, ...notes]); setNote(""); t.show("Note added"); } }}>Add</button></div></>}
        {tab === "activity" && <ul className="plain"><li>Created</li><li>Status set to {status}</li><li>Viewed by {user?.name}</li></ul>}
        {tab === "related" && related.map(({ o, f }) => { const rs = d[o.key].filter((x) => x[f.k] === r.id); return <div key={o.key + f.k}><h3>{o.plural}</h3>{rs.length ? <ul className="plain">{rs.map((x) => <li key={x.id}><Link to={`/e/${o.key}/${x.id}`}>{x.id}</Link> {titleOf(o, x) !== x.id && titleOf(o, x)}</li>)}</ul> : <p className="muted">None.</p>}</div>; })}
      </div>
      {modal && <Modal title="Reassign" testid="modal-assign" onClose={() => setModal(false)}><select data-testid="assign-select">{v.personas.map((p) => <option key={p.id}>{p.name}</option>)}</select>
        <div className="modal-foot"><button className="primary" data-testid="assign-confirm" onClick={() => { setModal(false); t.show("Reassigned"); }}>Confirm</button></div></Modal>}
      <AgentFor v={v} entityKey={e.key} recordId={r.id} />{t.node}
    </Page>
  );
}

export function GWizard({ v }: VP) {
  const e = ent(v, v.wizard.entity); const [step, setStep] = useState(0); const nav = useNavigate(); const t = useToast(); const [vals, setVals] = useState<Record<string, string>>({});
  const steps = [...v.wizard.steps, { title: "Review", keys: [] as string[] }]; const last = step === steps.length - 1;
  return (
    <Page id="wizard" title={v.wizard.title} sub={`Step ${step + 1} of ${steps.length}`}>
      <div className="steps">{steps.map((s, i) => <div key={s.title} className={i <= step ? "step on" : "step"}>{i + 1}. {s.title}</div>)}</div>
      <div className="card pad">
        {!last && <div className="form-grid">{steps[step].keys.map((k) => { const f = e.fields.find((x) => x.k === k)!;
          return <label key={k}>{f.label}{f.opts && f.t === "pick" ? <select data-testid={`wiz-${k}`} value={vals[k] || f.opts[0]} onChange={(x) => setVals({ ...vals, [k]: x.target.value })}>{Array.from(new Set(f.opts)).map((o) => <option key={o}>{o}</option>)}</select>
            : <input data-testid={`wiz-${k}`} type={f.t === "money" || f.t === "int" || f.t === "pct" ? "number" : f.t === "date" ? "date" : "text"} value={vals[k] || ""} onChange={(x) => setVals({ ...vals, [k]: x.target.value })} />}</label>; })}</div>}
        {last && <ul className="plain">{v.wizard.steps.flatMap((s) => s.keys).map((k) => <li key={k}>{e.fields.find((x) => x.k === k)!.label}: {vals[k] || "—"}</li>)}</ul>}
        <div className="modal-foot">{step > 0 && <button data-testid="wiz-back" onClick={() => setStep(step - 1)}>Back</button>}
          {!last ? <button className="primary" data-testid="wiz-next" onClick={() => setStep(step + 1)}>Continue</button> : <button className="primary" data-testid="wiz-submit" onClick={() => { t.show("Created"); setTimeout(() => nav(`/e/${e.key}`), 900); }}>Submit</button>}</div>
      </div>{t.node}
    </Page>
  );
}

export function GReports({ v }: VP) {
  const t = useToast(); const names = v.entities.flatMap((e) => [`${e.plural} by status`, `${e.label} aging`]).slice(0, 6);
  return <Page id="reports" title="Reports" sub="Scheduled and saved reports"><div className="grid3">{names.map((r, i) => <div key={r} className="card pad"><h3>{r}</h3><p className="muted">Updated daily</p><button data-testid={`report-run-${i}`} onClick={() => t.show(`${r} generated`)}>Run</button></div>)}</div>{t.node}</Page>;
}

export function GBuilder({ v }: VP) {
  const [ek, setEk] = useState(v.entities[0].key); const e = ent(v, ek); const cats = e.fields.filter((f) => f.t === "pick");
  const [by, setBy] = useState(cats[0]?.k); const rows = dataFor(v)[ek]; const g = cats.find((c) => c.k === by) || cats[0];
  const counts: Record<string, number> = {}; rows.forEach((r) => { counts[r[g.k]] = (counts[r[g.k]] || 0) + 1; });
  return (
    <Page id="report-builder" title="Report builder" sub="Group records by any category">
      <div className="card pad form-grid"><label>Data<select data-testid="rb-entity" value={ek} onChange={(x) => { setEk(x.target.value); setBy(ent(v, x.target.value).fields.find((f) => f.t === "pick")?.k || ""); }}>{v.entities.map((x) => <option key={x.key} value={x.key}>{x.plural}</option>)}</select></label>
        <label>Group by<select data-testid="rb-by" value={g.k} onChange={(x) => setBy(x.target.value)}>{cats.map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}</select></label></div>
      <div className="card pad"><Bars id="rb-chart" data={Object.entries(counts).map(([label, value]) => ({ label, value }))} /></div>
    </Page>
  );
}

export function GAudit({ v }: VP) {
  const d = dataFor(v); const all = v.entities.flatMap((e) => d[e.key].slice(0, 12).map((r) => r.id));
  const rows = useMemo(() => Array.from({ length: 70 }, (_, i) => ({ id: `AUD-${i + 1}`, when: `2026-11-${String(1 + (i % 13)).padStart(2, "0")} ${String(8 + (i % 10)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`, actor: v.personas[i % v.personas.length].name,
    action: ["Viewed record", "Updated status", "Exported report", "Edited rule", "Added note", "Reassigned"][i % 6], object: all[(i * 5) % all.length] })), [v]);
  return <Page id="audit" title="Audit log" sub="Every action and who took it"><DataTable id="audit" rows={rows} filters={["action", "actor"]} cols={[{ key: "when", label: "When" }, { key: "actor", label: "Actor" }, { key: "action", label: "Action" }, { key: "object", label: "Record" }]} /></Page>;
}

export function GNotifications({ v }: VP) {
  const d = dataFor(v); const seed = v.entities.map((e) => { const sf = e.fields.find((f) => f.status)!; const r = d[e.key].find((x) => e.attention.includes(x[sf.k])); return r ? { id: r.id, text: `${e.label} ${r.id} is ${r[sf.k]}`, read: false } : null; }).filter(Boolean) as { id: string; text: string; read: boolean }[];
  const [items, setItems] = useState(seed);
  return <Page id="notifications" title="Notifications" actions={<button data-testid="notif-readall" onClick={() => setItems(items.map((i) => ({ ...i, read: true })))}>Mark all read</button>}><div className="card pad">{items.map((i) => <div key={i.id} className={`notif ${i.read ? "" : "unread"}`} data-testid={`notif-${i.id}`} onClick={() => setItems(items.map((x) => x.id === i.id ? { ...x, read: true } : x))}>{i.text}</div>)}</div></Page>;
}

export function GProfile({ v }: VP) {
  const { user } = useUser(); const t = useToast();
  return <Page id="profile" title="My profile"><div className="card pad form-grid"><label>Name<input data-testid="profile-name" defaultValue={user?.name} /></label><label>Role<input disabled value={user?.role} /></label><label>Team<input disabled value={user?.team} /></label><label>Notifications<select data-testid="profile-digest"><option>Daily</option><option>Weekly</option><option>Off</option></select></label></div><button className="primary" data-testid="profile-save" onClick={() => t.show("Profile saved")}>Save</button>{t.node}{v && null}</Page>;
}

export function GRoles({ v }: VP) {
  const [open, setOpen] = useState<string | null>(null); const rows = v.roles.map(([name, perms], i) => ({ id: `role-${i}`, name, users: 4 + i * 7, perms })); const r = rows.find((x) => x.id === open);
  return <Page id="roles" title="Roles & access" sub="Who can do what"><DataTable id="roles" rows={rows} onRow={(x) => setOpen(x.id)} cols={[{ key: "name", label: "Role" }, { key: "users", label: "Users" }, { key: "perms", label: "Permissions", render: (x) => x.perms.join(", ") }]} />
    {r && <Modal title={r.name} testid="modal-role" onClose={() => setOpen(null)}>{r.perms.map((p) => <label key={p} className="check"><input type="checkbox" defaultChecked /> {p}</label>)}<div className="modal-foot"><button className="primary" data-testid="role-save" onClick={() => setOpen(null)}>Save</button></div></Modal>}</Page>;
}

export function GRules({ v }: VP) {
  const [st, setSt] = useState(Object.fromEntries(v.rules.map((_, i) => [i, i !== 3])));
  return <Page id="rules" title="Business rules" sub="Automation that runs on every record"><div className="card">{v.rules.map(([name, area], i) => <div key={name} className="rule"><div><strong>{name}</strong><div className="muted">{area}</div></div><Toggle id={`rule-${i}`} on={st[i]} onChange={(x) => setSt({ ...st, [i]: x })} /></div>)}</div></Page>;
}

export function GIntegrations({ v }: VP) {
  const [st, setSt] = useState(Object.fromEntries(v.integrations.map((n, i) => [n, i % 4 !== 3]))); const t = useToast();
  return <Page id="integrations" title="Integrations" sub="Connected systems"><div className="grid3">{v.integrations.map((n, i) => <div key={n} className="card pad"><h3>{n}</h3><Badge v={st[n] ? "Connected" : "Not connected"} /><div><button data-testid={`int-${i}`} onClick={() => { setSt({ ...st, [n]: !st[n] }); t.show(`${n} ${st[n] ? "disconnected" : "connected"}`); }}>{st[n] ? "Disconnect" : "Connect"}</button></div></div>)}</div>{t.node}</Page>;
}

export function GAgents({ v }: VP) {
  const [on, setOn] = useState(Object.fromEntries(v.agents.map((a) => [a.key, true]))); const [open, setOpen] = useState<string | null>(null);
  return (
    <Page id="agents" title="AI agents" sub="Assistants embedded across the workflow">
      <div className="stats"><Stat id="ag-count" label="Agents" value={v.agents.length} /><Stat id="ag-live" label="Enabled" value={v.agents.filter((a) => on[a.key]).length} /></div>
      <div className="grid3">{v.agents.map((a, i) => <div key={a.key} className="card pad" data-testid={`agent-card-${a.key}`}>
        <div className="rule" style={{ padding: 0, border: 0 }}><h3>✦ {a.name}</h3><Toggle id={`agent-toggle-${a.key}`} on={on[a.key]} onChange={(x) => setOn({ ...on, [a.key]: x })} /></div>
        <p className="muted">{a.tagline}</p><p className="muted">Model {a.model} · Owner {a.owner}</p><p>{140 + i * 53} chats · {64 + i * 6}% resolved</p>
        <button data-testid={`agent-open-${a.key}`} onClick={() => setOpen(a.key)}>Try it</button></div>)}</div>
      {open && <AgentLauncher spec={specFor(v, v.agents.find((a) => a.key === open)!)} />}
    </Page>
  );
}

export function GHelp({ v }: VP) {
  const [q, setQ] = useState("");
  return <Page id="help" title="Help centre"><input data-testid="help-search" placeholder="Search articles" value={q} onChange={(x) => setQ(x.target.value)} /><div className="card pad">{v.help.filter((f) => f.toLowerCase().includes(q.toLowerCase())).map((f, i) => <details key={f} data-testid={`faq-${i}`}><summary>{f}</summary><p className="muted">See the handbook, section {i + 1}. Ask your team lead for exceptions.</p></details>)}</div></Page>;
}
