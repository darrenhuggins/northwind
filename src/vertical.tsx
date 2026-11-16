import { createContext, useContext, useState, ReactNode } from "react";

const KEY = "nw.vertical";
const Ctx = createContext<{ vkey: string | null; choose: (k: string) => void; clear: () => void }>({ vkey: null, choose() {}, clear() {} });

export function VerticalProvider({ children }: { children: ReactNode }) {
  const [vkey, setV] = useState<string | null>(() => { try { return localStorage.getItem(KEY); } catch { return null; } });
  const choose = (k: string) => { try { localStorage.setItem(KEY, k); } catch { /* ignore */ } setV(k); };
  const clear = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setV(null); };
  return <Ctx.Provider value={{ vkey, choose, clear }}>{children}</Ctx.Provider>;
}
export const useVertical = () => useContext(Ctx);
