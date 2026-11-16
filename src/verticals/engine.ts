import { Entity, Field, Vertical, AgentCfg } from "./types";
import { AgentSpec } from "../agents/registry";

export type Row = Record<string, any> & { id: string };
const first = ["Avery", "Jordan", "Morgan", "Riley", "Casey", "Taylor", "Quinn", "Harper", "Rowan", "Sasha", "Devon", "Elliot", "Priya", "Marcus", "Lena", "Tomas", "Nadia", "Owen", "Imani", "Felix"];
const last = ["Okafor", "Lindqvist", "Brennan", "Castillo", "Nakamura", "Hughes", "Moreau", "Patel", "Kowalski", "Reyes", "Abara", "Fischer", "Dalton", "Ibrahim", "Sorensen"];
const cos = ["Summit Group", "Harbor Co", "Ironwood Ltd", "Bluebird Inc", "Keystone Partners", "Meridian Corp", "Atlas Systems", "Pioneer Foods", "Cobalt Labs", "Northgate LLC", "Redwood & Sons", "Vertex Supply"];
const cities = ["Raleigh NC", "Tampa FL", "Austin TX", "Denver CO", "Columbus OH", "Phoenix AZ", "Portland OR", "Atlanta GA", "Boston MA", "Madison WI", "Chicago IL", "Seattle WA"];
const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const iso = (back: number) => new Date(Date.UTC(2026, 10, 13) - back * 864e5).toISOString().slice(0, 10);

const cache: Record<string, Record<string, Row[]>> = {};
export function dataFor(v: Vertical): Record<string, Row[]> {
  if (cache[v.key]) return cache[v.key];
  let seed = hash(v.key); const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]; const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const out: Record<string, Row[]> = {};
  for (const e of v.entities) {
    out[e.key] = Array.from({ length: e.count }, (_, i) => {
      const r: Row = { id: `${e.prefix}-${e.start + i * 3}` };
      for (const f of e.fields) r[f.k] = value(f, out);
      return r;
    });
  }
  function value(f: Field, all: Record<string, Row[]>): any {
    switch (f.t) {
      case "name": return `${pick(first)} ${pick(last)}`; case "company": return pick(cos); case "city": return pick(cities);
      case "pick": case "text": return pick(f.opts || ["—"]); case "money": return int(f.lo ?? 10, f.hi ?? 1000); case "int": return int(f.lo ?? 0, f.hi ?? 100);
      case "pct": return int(f.lo ?? 0, f.hi ?? 100); case "date": return iso(int(f.lo ?? 0, f.hi ?? 120));
      case "email": return `user${int(1, 999)}@example.com`; case "ref": return pick(all[f.ref!]).id;
    }
  }
  return (cache[v.key] = out);
}

export const ent = (v: Vertical, k: string) => v.entities.find((e) => e.key === k)!;
export const titleOf = (e: Entity, r: Row) => (e.title === "id" ? r.id : String(r[e.title] ?? r.id));
export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const show = (f: Field, val: any) => (f.t === "money" ? money(val) : f.t === "pct" ? `${val}%` : f.t === "int" ? Number(val).toLocaleString() : String(val));

export function aggregate(v: Vertical, s: Vertical["stats"][number]) {
  const rows = dataFor(v)[s.entity]; const f = s.field;
  if (s.agg === "count") return rows.length.toLocaleString();
  if (s.agg === "countWhere") { const e = ent(v, s.entity); const att = s.value === "Low stock" ? ["Low stock", "Out of stock"] : [s.value!]; return rows.filter((r) => att.includes(r[f!])).length.toLocaleString(); void e; }
  const nums = rows.map((r) => Number(r[f!])); const sum = nums.reduce((a, b) => a + b, 0);
  const fld = ent(v, s.entity).fields.find((x) => x.k === f)!;
  const val = s.agg === "sum" ? sum : Math.round(sum / nums.length);
  return fld.t === "money" ? money(val) : fld.t === "pct" ? `${val}%` : val.toLocaleString();
}

const NOPE = "I'm not confident I can answer that from the data I can see. Try one of the suggested questions, or ask a colleague.";
export function specFor(v: Vertical, a: AgentCfg): AgentSpec {
  const e = ent(v, a.entity); const rows = dataFor(v)[a.entity];
  return {
    key: `${v.key}:${a.key}`, name: a.name, tagline: a.tagline, suggestions: a.suggestions.map((s) => s.q),
    reply: (prompt, ctx) => {
      const s = a.suggestions.find((x) => x.q.toLowerCase() === prompt.trim().toLowerCase()) ||
        a.suggestions.find((x) => (x.kind === "attention" && /attention|open|review|risk|late|overdue/i.test(prompt)) || (x.kind === "top" && /top|largest|highest|costl|biggest/i.test(prompt)) || (x.kind === "summarise" && /summar/i.test(prompt)));
      if (!s) return NOPE;
      if (s.kind === "tip") return s.text!;
      if (s.kind === "summarise") { const r = rows.find((x) => x.id === ctx.recordId) || rows[0]; return `${titleOf(e, r)} (${r.id}): ` + e.fields.filter((f) => f.t !== "ref").slice(0, 5).map((f) => `${f.label} ${show(f, r[f.k])}`).join(", ") + "."; }
      if (s.kind === "attention") { const sf = e.fields.find((f) => f.status)!; const hit = rows.filter((r) => e.attention.includes(r[sf.k])); return `${hit.length} ${e.plural.toLowerCase()} need attention. Start with ${hit.slice(0, 3).map((r) => r.id).join(", ")}.`; }
      const mk = e.fields.find((f) => f.k === e.money) || e.fields.find((f) => f.t === "money"); if (!mk) return NOPE;
      return [...rows].sort((x, y) => y[mk.k] - x[mk.k]).slice(0, 3).map((r) => `${titleOf(e, r)} ${show(mk, r[mk.k])}`).join("; ") + ".";
    },
  };
}
