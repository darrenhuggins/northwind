export type FieldType = "name" | "company" | "pick" | "money" | "int" | "pct" | "date" | "city" | "email" | "ref" | "text";
export type Field = { k: string; label: string; t: FieldType; opts?: string[]; lo?: number; hi?: number; ref?: string; status?: boolean; filter?: boolean; hide?: boolean };
export type Entity = {
  key: string; label: string; plural: string; prefix: string; start: number; count: number; title: string;
  fields: Field[]; attention: string[]; money?: string;
};
export type Sugg = { q: string; kind: "summarise" | "attention" | "top" | "tip"; text?: string };
export type AgentCfg = { key: string; name: string; tagline: string; model: string; owner: string; entity: string; suggestions: Sugg[] };
export type Vertical = {
  key: string; name: string; product: string; tagline: string; accent: string; side: string; icon: string;
  personas: { id: string; name: string; role: string; region: string; team: string }[];
  entities: Entity[];
  wizard: { title: string; entity: string; steps: { title: string; keys: string[] }[] };
  stats: { id: string; label: string; entity: string; agg: "count" | "sum" | "avg" | "countWhere"; field?: string; value?: string; sub?: string }[];
  charts: { title: string; entity: string; by: string }[];
  rules: [string, string][]; integrations: string[]; roles: [string, string[]][];
  agents: AgentCfg[]; help: string[];
};
