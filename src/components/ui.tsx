import { ReactNode, useMemo, useState } from "react";

export function Modal({ title, onClose, children, testid }: { title: string; onClose: () => void; children: ReactNode; testid?: string }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" data-testid={testid} role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h3>{title}</h3><button className="icon" data-testid="modal-close" onClick={onClose} aria-label="Close">×</button></div>
        {children}
      </div>
    </div>
  );
}

export const Badge = ({ v }: { v: string }) => {
  const tone = /Approved|Active|Issued|Connected|Preferred|Available|Cleared|Low|Closed/.test(v) ? "ok"
    : /Denied|Failed|Lapsed|Critical|Escalated|Probation|Not connected|High|SIU/.test(v) ? "bad"
    : /Pending|Investigating|Triage|Reopened|Medium|Open|Scheduled|In field/.test(v) ? "warn" : "neutral";
  return <span className={`badge ${tone}`}>{v}</span>;
};

export type Col<T> = { key: keyof T & string; label: string; render?: (r: T) => ReactNode; align?: "right" };

export function DataTable<T extends { id: string }>({ id, rows, cols, onRow, filters, pageSize = 12, actions }: {
  id: string; rows: T[]; cols: Col<T>[]; onRow?: (r: T) => void; filters?: (keyof T & string)[]; pageSize?: number; actions?: ReactNode;
}) {
  const [q, setQ] = useState(""); const [sel, setSel] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 } | null>(null); const [page, setPage] = useState(0);
  const opts = useMemo(() => Object.fromEntries((filters || []).map((f) => [f, Array.from(new Set(rows.map((r) => String(r[f])))).sort()])), [rows, filters]);
  const shown = useMemo(() => {
    let out = rows.filter((r) => (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())) && Object.entries(sel).every(([k, v]) => !v || String((r as any)[k]) === v));
    if (sort) out = [...out].sort((a: any, b: any) => (a[sort.k] > b[sort.k] ? 1 : -1) * sort.dir);
    return out;
  }, [rows, q, sel, sort]);
  const pages = Math.max(1, Math.ceil(shown.length / pageSize)); const cur = Math.min(page, pages - 1);
  return (
    <div className="card" data-testid={`${id}-table`}>
      <div className="toolbar">
        <input data-testid={`${id}-search`} placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        {(filters || []).map((f) => (
          <select key={f} data-testid={`${id}-filter-${f}`} value={sel[f] || ""} onChange={(e) => { setSel({ ...sel, [f]: e.target.value }); setPage(0); }}>
            <option value="">All {f}</option>{opts[f].map((o) => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span className="spacer" />{actions}
      </div>
      <table>
        <thead><tr>{cols.map((c) => (
          <th key={c.key} className={c.align} data-testid={`${id}-sort-${c.key}`} onClick={() => setSort({ k: c.key, dir: sort?.k === c.key ? ((-sort.dir) as 1 | -1) : 1 })}>{c.label}{sort?.k === c.key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}</th>))}</tr></thead>
        <tbody>
          {shown.slice(cur * pageSize, cur * pageSize + pageSize).map((r) => (
            <tr key={r.id} data-testid={`${id}-row-${r.id}`} className={onRow ? "click" : ""} onClick={() => onRow?.(r)}>
              {cols.map((c) => <td key={c.key} className={c.align}>{c.render ? c.render(r) : String(r[c.key])}</td>)}
            </tr>))}
          {!shown.length && <tr><td colSpan={cols.length} className="empty">No results</td></tr>}
        </tbody>
      </table>
      <div className="pager">
        <span>{shown.length} records</span><span className="spacer" />
        <button data-testid={`${id}-prev`} disabled={cur === 0} onClick={() => setPage(cur - 1)}>Previous</button>
        <span>Page {cur + 1} of {pages}</span>
        <button data-testid={`${id}-next`} disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</button>
      </div>
    </div>
  );
}

export const Stat = ({ label, value, sub, id }: { label: string; value: string | number; sub?: string; id: string }) => (
  <div className="stat" data-testid={`stat-${id}`}><div className="stat-label">{label}</div><div className="stat-value">{value}</div>{sub && <div className="stat-sub">{sub}</div>}</div>
);

export const Page = ({ title, sub, actions, children, id }: { title: string; sub?: string; actions?: ReactNode; children: ReactNode; id: string }) => (
  <div data-testid={`page-${id}`}>
    <div className="page-head"><div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div><div className="actions">{actions}</div></div>
    {children}
  </div>
);

export const Toggle = ({ on, onChange, id }: { on: boolean; onChange: (v: boolean) => void; id: string }) => (
  <button role="switch" aria-checked={on} data-testid={id} className={`toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)}><i /></button>
);

export function Bars({ data, id }: { data: { label: string; value: number }[]; id: string }) {
  const max = Math.max(...data.map((d) => d.value));
  return <div className="bars" data-testid={id}>{data.map((d) => (
    <div key={d.label} className="bar-row"><span className="bar-label">{d.label}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${(d.value / max) * 100}%` }} /></div><span className="bar-val">{d.value}</span></div>))}</div>;
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };
  const node = msg ? <div className="toast" data-testid="toast" role="status">{msg}</div> : null;
  return { show, node };
}
