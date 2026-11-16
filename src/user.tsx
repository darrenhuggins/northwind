import { createContext, useContext, useState, ReactNode } from "react";

export type User = { id: string; name: string; role: string; region: string; team: string };
export const PERSONAS: User[] = [
  { id: "u-adjuster", name: "Jordan Reyes", role: "Claims Adjuster", region: "East", team: "Auto Claims" },
  { id: "u-manager", name: "Priya Patel", role: "Claims Manager", region: "South", team: "Property Claims" },
  { id: "u-siu", name: "Mara Quist", role: "SIU Analyst", region: "Central", team: "Special Investigations" },
  { id: "u-finance", name: "Marcus Dalton", role: "Finance", region: "West", team: "Claims Finance" },
  { id: "u-admin", name: "Lena Fischer", role: "Administrator", region: "East", team: "Platform" },
];
const KEY = "nw.user";
const Ctx = createContext<{ user: User | null; signIn: (u: User) => void; signOut: () => void }>({ user: null, signIn() {}, signOut() {} });

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } });
  const signIn = (u: User) => { try { localStorage.setItem(KEY, JSON.stringify(u)); } catch { /* ignore */ } setUser(u); };
  const signOut = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setUser(null); };
  return <Ctx.Provider value={{ user, signIn, signOut }}>{children}</Ctx.Provider>;
}
export const useUser = () => useContext(Ctx);
