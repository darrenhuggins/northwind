import { adjusters, claims, fraudCases, money, policies, vendors } from "../data";

export type AgentKey = "copilot" | "sentinel" | "intake" | "coverage" | "reserve" | "dispatch";
export type Ctx = { claimId?: string; policyId?: string; caseId?: string; recordId?: string };
export type AgentSpec = { key: string; name: string; tagline: string; suggestions: string[]; reply: (prompt: string, ctx: Ctx) => string };
export type AgentDef = {
  key: AgentKey; name: string; tagline: string; model: string; owner: string; scope: string[];
  suggestions: string[]; reply: (prompt: string, ctx: Ctx) => string;
};

const has = (p: string, ...w: string[]) => w.some((x) => p.toLowerCase().includes(x));
const claim = (c: Ctx) => claims.find((x) => x.id === c.claimId) || claims[0];
const pol = (c: Ctx) => policies.find((x) => x.id === c.policyId) || policies[0];
const NOPE = "I'm not confident I can answer that from the data I can see. Try one of the suggested questions, or ask a person on the claims desk.";

export const AGENTS: AgentDef[] = [
  { key: "copilot", name: "Claims Copilot", tagline: "Summarises a claim and drafts customer letters", model: "northwind-llm-large", owner: "Claims Ops",
    scope: ["claims", "notes", "documents"], suggestions: ["Summarise this claim", "Draft an update letter to the customer", "What is missing from this file?"],
    reply: (p, c) => { const x = claim(c);
      if (has(p, "summar")) return `${x.id}: a ${x.severity.toLowerCase()} ${x.lob.toLowerCase()} claim for ${x.peril.toLowerCase()} reported ${x.reported} in ${x.location}. Claimed ${money(x.amount)}, reserved ${money(x.reserve)}, currently ${x.status}. Adjuster: ${x.adjuster}.`;
      if (has(p, "letter", "draft", "email")) return `Dear ${x.customer.split(" ")[0]}, we are writing about claim ${x.id}. It is currently ${x.status.toLowerCase()} and ${x.adjuster} is your contact. We will update you within 3 business days. Kind regards, Northwind Claims.`;
      if (has(p, "missing", "document")) return `For ${x.id} I would still request: proof of loss, a repair estimate and photos of the damage. ${x.litigated ? "Because it is litigated, also confirm legal hold." : ""}`;
      return NOPE; } },
  { key: "sentinel", name: "Fraud Sentinel", tagline: "Explains fraud scores and recommends next steps", model: "northwind-risk-v3", owner: "Special Investigations",
    scope: ["fraud cases", "claims history"], suggestions: ["Why was this flagged?", "Is this part of a ring?", "Recommend next step"],
    reply: (p, c) => { const f = fraudCases.find((z) => z.id === c.caseId) || fraudCases[0];
      if (has(p, "why", "flag")) return `${f.id} scored ${f.score}. The strongest signal is "${f.signal}". Scores above 80 trigger rule R-02 and route to ${f.analyst}.`;
      if (has(p, "ring", "pattern", "link")) return `I found ${2 + (f.score % 4)} other claims sharing an address or payee with ${f.claimId}. That is consistent with a possible ring, but not proof.`;
      if (has(p, "next", "recommend", "step")) return f.score > 85 ? "Refer to SIU and place payments on hold until the invoice is verified." : "Request supporting documents and re-score in 5 days before escalating.";
      return NOPE; } },
  { key: "intake", name: "Intake Assistant", tagline: "Turns a free-text loss description into claim fields", model: "northwind-llm-small", owner: "Customer Service",
    scope: ["first notice of loss"], suggestions: ["My basement flooded after the storm last night", "Someone hit my parked car", "A pipe burst in our office"],
    reply: (p) => { const t = p.toLowerCase();
      const peril = /flood|water|pipe|burst/.test(t) ? "Water damage" : /hit|collision|crash|rear/.test(t) ? "Collision" : /fire|smoke/.test(t) ? "Fire" : /stolen|theft|broke into/.test(t) ? "Theft" : null;
      if (!peril) return NOPE;
      const lob = /office|business|shop/.test(t) ? "Commercial Property" : /car|vehicle|parked/.test(t) ? "Auto" : "Home";
      return `I read that as: line of business ${lob}, peril ${peril}, date of loss ${/last night|yesterday/.test(t) ? "yesterday" : "to be confirmed"}. Use these on the next step of the loss report?`; } },
  { key: "coverage", name: "Coverage Advisor", tagline: "Answers questions about limits, deductibles and exclusions", model: "northwind-llm-large", owner: "Underwriting",
    scope: ["policies", "endorsements"], suggestions: ["What is my deductible?", "Is water damage covered?", "What is the limit?"],
    reply: (p, c) => { const x = pol(c);
      if (has(p, "deduct")) return `Policy ${x.id} has a ${money(x.deductible)} deductible.`;
      if (has(p, "limit", "maximum")) return `The limit on ${x.id} is ${money(x.limit)} per occurrence.`;
      if (has(p, "cover", "exclu", "water", "flood")) return x.lob === "Home" || x.lob === "Commercial Property" ? "Sudden and accidental water damage is covered. Flood from rising water and long-term seepage are excluded unless the flood endorsement is attached." : `This is a ${x.lob} policy, so water damage rules depend on the endorsement. Check the policy wording.`;
      return NOPE; } },
  { key: "reserve", name: "Reserve Advisor", tagline: "Suggests a reserve from similar closed claims", model: "northwind-forecast-v2", owner: "Actuarial",
    scope: ["claims", "closed claim history"], suggestions: ["Suggest a reserve", "Show similar claims", "Is this reserve adequate?"],
    reply: (p, c) => { const x = claim(c); const sim = claims.filter((z) => z.lob === x.lob && z.peril === x.peril && z.status === "Closed");
      const avg = sim.length ? Math.round(sim.reduce((a, z) => a + z.amount, 0) / sim.length) : Math.round(x.amount * 0.8);
      if (has(p, "suggest")) return `Based on ${sim.length || "a few"} similar closed ${x.peril.toLowerCase()} claims, I suggest a reserve near ${money(avg)}.`;
      if (has(p, "similar")) return sim.length ? sim.slice(0, 3).map((z) => `${z.id} ${money(z.amount)}`).join(", ") : "No close matches. Widening to the same line only.";
      if (has(p, "adequate", "enough")) return x.reserve >= avg * 0.8 ? `${money(x.reserve)} looks adequate against an average of ${money(avg)}.` : `${money(x.reserve)} looks light against an average of ${money(avg)}.`;
      return NOPE; } },
  { key: "dispatch", name: "Dispatch Agent", tagline: "Matches claims to adjusters and vendors", model: "northwind-optimiser", owner: "Claims Ops",
    scope: ["adjusters", "vendors", "assignments"], suggestions: ["Who should take the next claim?", "Which adjusters are overloaded?", "Recommend a repair vendor"],
    reply: (p) => { if (has(p, "overload", "capacity")) return adjusters.filter((a) => a.caseload > 34).map((a) => `${a.name} (${a.caseload}/${a.capacity})`).join(", ") || "Nobody is over 85% of capacity.";
      if (has(p, "who", "next", "assign")) { const a = [...adjusters].filter((z) => z.status === "Available").sort((x, y) => x.caseload - y.caseload)[0]; return a ? `${a.name} in ${a.region} has the lowest caseload (${a.caseload}/${a.capacity}) and is available.` : "No adjuster is available right now."; }
      if (has(p, "vendor", "repair")) { const v = [...vendors].filter((z) => z.status === "Preferred").sort((a, b) => b.score - a.score)[0]; return v ? `${v.name} is a preferred ${v.type.toLowerCase()} vendor with a score of ${v.score} and a ${v.sla} SLA.` : "No preferred vendor found."; }
      return NOPE; } },
];

export const agentByKey = (k: AgentKey) => AGENTS.find((a) => a.key === k)!;
