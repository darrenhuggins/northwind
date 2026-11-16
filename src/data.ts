// Deterministic mock data. No backend: everything lives in the browser.
let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
const day = (back: number) => new Date(Date.UTC(2026, 10, 13) - back * 864e5).toISOString().slice(0, 10);

const first = ["Avery", "Jordan", "Morgan", "Riley", "Casey", "Taylor", "Quinn", "Harper", "Rowan", "Sasha", "Devon", "Elliot", "Priya", "Marcus", "Lena", "Tomas", "Nadia", "Owen", "Imani", "Felix"];
const last = ["Okafor", "Lindqvist", "Brennan", "Castillo", "Nakamura", "Hughes", "Moreau", "Patel", "Kowalski", "Reyes", "Abara", "Fischer", "Dalton", "Ibrahim", "Sorensen"];
const cities = ["Raleigh NC", "Tampa FL", "Austin TX", "Denver CO", "Columbus OH", "Phoenix AZ", "Portland OR", "Atlanta GA", "Boston MA", "Madison WI"];

export type Status = "New" | "Triage" | "Investigating" | "Pending Docs" | "Approved" | "Denied" | "Closed" | "Reopened";
export const STATUSES: Status[] = ["New", "Triage", "Investigating", "Pending Docs", "Approved", "Denied", "Closed", "Reopened"];
export const LOBS = ["Auto", "Home", "Commercial Property", "General Liability", "Workers Comp", "Marine", "Cyber"];
export const PERILS = ["Collision", "Water damage", "Theft", "Fire", "Hail", "Slip and fall", "Ransomware", "Cargo loss", "Wind", "Vandalism"];

export const adjusters = Array.from({ length: 14 }, (_, i) => ({
  id: `ADJ-${100 + i}`, name: `${first[(i * 3) % 20]} ${last[i % 15]}`, region: pick(["East", "South", "Central", "West"]),
  specialty: pick(LOBS), caseload: int(8, 42), capacity: 40, rating: (3.4 + rnd() * 1.5).toFixed(1), status: pick(["Available", "Available", "In field", "On leave"]),
}));

export const customers = Array.from({ length: 40 }, (_, i) => ({
  id: `CUS-${2000 + i}`, name: `${first[(i * 7) % 20]} ${last[(i * 5) % 15]}`, city: pick(cities),
  tier: pick(["Standard", "Preferred", "Premier"]), since: 2008 + int(0, 17), policies: int(1, 4), openClaims: int(0, 3), email: `customer${i}@example.com`,
}));

export const policies = Array.from({ length: 60 }, (_, i) => {
  const c = customers[i % customers.length];
  return { id: `POL-${50000 + i * 7}`, customerId: c.id, customer: c.name, lob: pick(LOBS), premium: int(480, 18400), deductible: pick([250, 500, 1000, 2500, 5000]),
    limit: pick([50000, 100000, 250000, 500000, 1000000]), effective: day(int(30, 700)), status: pick(["Active", "Active", "Active", "Lapsed", "Pending renewal"]) };
});

export const claims = Array.from({ length: 120 }, (_, i) => {
  const p = policies[i % policies.length];
  return { id: `CLM-${10000 + i * 3}`, policyId: p.id, customerId: p.customerId, customer: p.customer, lob: p.lob, peril: pick(PERILS), status: pick(STATUSES) as Status,
    amount: int(400, 96000), reserve: int(500, 80000), adjuster: pick(adjusters).name, severity: pick(["Low", "Medium", "High", "Critical"]),
    reported: day(int(0, 120)), fraudScore: int(2, 98), location: pick(cities), litigated: rnd() < 0.08 };
});

export const payments = Array.from({ length: 70 }, (_, i) => {
  const c = claims[(i * 2) % claims.length];
  return { id: `PAY-${7000 + i}`, claimId: c.id, payee: c.customer, kind: pick(["Indemnity", "Expense", "Vendor", "Subrogation recovery"]),
    amount: int(150, 24000), status: pick(["Scheduled", "Pending approval", "Issued", "Issued", "Failed"]), method: pick(["ACH", "Check", "Virtual card"]), date: day(int(0, 60)) };
});

export const vendors = Array.from({ length: 22 }, (_, i) => ({
  id: `VEN-${300 + i}`, name: `${pick(["Summit", "Harbor", "Ironwood", "Bluebird", "Keystone", "Meridian", "Atlas"])} ${pick(["Restoration", "Auto Body", "Appraisal", "Forensics", "Legal", "Salvage", "Roofing"])}`,
  type: pick(["Repair", "Appraisal", "Legal", "Forensic", "Salvage"]), region: pick(["East", "South", "Central", "West"]), sla: `${int(2, 10)} days`, score: int(72, 99), status: pick(["Preferred", "Approved", "Probation"]),
}));

export const fraudCases = claims.filter((c) => c.fraudScore > 70).slice(0, 24).map((c, i) => ({
  id: `FRD-${900 + i}`, claimId: c.id, customer: c.customer, score: c.fraudScore, signal: pick(["Duplicate invoice", "Late reporting", "Prior claims cluster", "Address mismatch", "Inflated estimate", "Ring pattern"]),
  analyst: pick(["Mara Quist", "Ian Dube", "Sofia Ruiz"]), state: pick(["Open", "Open", "Escalated", "Cleared", "Referred to SIU"]),
}));

export const documents = Array.from({ length: 50 }, (_, i) => ({
  id: `DOC-${i + 1}`, claimId: claims[(i * 2) % claims.length].id, name: pick(["Police report", "Repair estimate", "Photo set", "Medical bill", "Proof of loss", "Adjuster notes", "Invoice"]) + ` ${i + 1}`,
  type: pick(["PDF", "JPG", "DOCX"]), size: `${int(40, 4800)} KB`, uploaded: day(int(0, 90)), by: pick(first),
}));

export const auditLog = Array.from({ length: 80 }, (_, i) => ({
  id: `AUD-${i + 1}`, when: `${day(int(0, 30))} ${String(int(7, 18)).padStart(2, "0")}:${String(int(0, 59)).padStart(2, "0")}`,
  actor: `${pick(first)} ${pick(last)}`, action: pick(["Updated reserve", "Changed status", "Assigned adjuster", "Approved payment", "Exported report", "Edited rule", "Viewed claim", "Uploaded document"]),
  object: pick(claims).id, ip: `10.${int(0, 40)}.${int(0, 255)}.${int(1, 254)}`,
}));

export const rules = [
  { id: "R-01", name: "Auto-assign by region", area: "Assignment", enabled: true }, { id: "R-02", name: "Flag fraud score above 80", area: "Fraud", enabled: true },
  { id: "R-03", name: "Escalate litigated claims", area: "Legal", enabled: true }, { id: "R-04", name: "Require approval above $25,000", area: "Payments", enabled: true },
  { id: "R-05", name: "Auto-close after 90 days idle", area: "Lifecycle", enabled: false }, { id: "R-06", name: "Notify customer on status change", area: "Comms", enabled: true },
  { id: "R-07", name: "Fast-track claims under $1,500", area: "Triage", enabled: false }, { id: "R-08", name: "Duplicate invoice check", area: "Fraud", enabled: true },
];

export const integrations = [
  { id: "I-1", name: "Guidewire PolicyCenter", state: "Connected" }, { id: "I-2", name: "Verisk ISO ClaimSearch", state: "Connected" },
  { id: "I-3", name: "Salesforce", state: "Connected" }, { id: "I-4", name: "DocuSign", state: "Not connected" },
  { id: "I-5", name: "Twilio SMS", state: "Connected" }, { id: "I-6", name: "Stripe Treasury", state: "Not connected" },
  { id: "I-7", name: "Snowflake export", state: "Connected" }, { id: "I-8", name: "Okta SSO", state: "Connected" },
];

export const roles = [
  { id: "role-1", name: "Claims Adjuster", users: 42, perms: ["View claims", "Edit claims", "Request payment"] },
  { id: "role-2", name: "Claims Manager", users: 11, perms: ["View claims", "Edit claims", "Approve payment", "Reassign"] },
  { id: "role-3", name: "SIU Analyst", users: 6, perms: ["View claims", "Fraud cases", "Refer to SIU"] },
  { id: "role-4", name: "Finance", users: 8, perms: ["View payments", "Approve payment", "Batch issue"] },
  { id: "role-5", name: "Administrator", users: 3, perms: ["All"] },
];

export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
