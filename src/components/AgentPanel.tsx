import { useRef, useState } from "react";
import { agentByKey, AgentKey, AgentSpec, Ctx } from "../agents/registry";
import { emitAgentEvent, uid } from "../agents/telemetry";

type Msg = { id: string; from: "user" | "agent"; text: string; reaction?: "positive" | "negative" };

export function AgentLauncher({ agent, spec, ctx, slot = 0 }: { agent?: AgentKey; spec?: AgentSpec; ctx?: Ctx; slot?: number }) {
  const [open, setOpen] = useState(false); const a = spec || agentByKey(agent!); agent = a.key as AgentKey;
  return (
    <>
      <button className="agent-fab" style={{ bottom: 20 + slot * 48 }} data-testid={`agent-launch-${agent}`} onClick={() => setOpen(true)}>✦ {a.name}</button>
      {open && <AgentPanel a={a} ctx={ctx || {}} onClose={() => setOpen(false)} />}
    </>
  );
}

export function AgentPanel({ a, ctx, onClose }: { a: AgentSpec; ctx: Ctx; onClose: () => void }) {
  const agent = a.key; const conv = useRef(uid("conv")).current;
  const [msgs, setMsgs] = useState<Msg[]>([]); const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const send = (t: string) => {
    if (!t.trim() || busy) return;
    const um: Msg = { id: uid("msg"), from: "user", text: t }; setMsgs((m) => [...m, um]); setText(""); setBusy(true);
    emitAgentEvent({ type: "prompt", agentKey: agent, conversationId: conv, messageId: um.id, content: t });
    setTimeout(() => {
      const am: Msg = { id: uid("msg"), from: "agent", text: a.reply(t, ctx) }; setMsgs((m) => [...m, am]); setBusy(false);
      emitAgentEvent({ type: "agent_response", agentKey: agent, conversationId: conv, messageId: am.id, content: am.text });
    }, 600 + Math.random() * 900);
  };
  const react = (id: string, r: "positive" | "negative") => {
    const cur = msgs.find((m) => m.id === id)?.reaction; const next = cur === r ? undefined : r;
    setMsgs(msgs.map((m) => (m.id === id ? { ...m, reaction: next } : m)));
    emitAgentEvent({ type: "user_reaction", agentKey: agent, conversationId: conv, messageId: id, content: next || "unreact" });
  };
  return (
    <div className="agent-panel" data-testid={`agent-panel-${agent}`} role="dialog" aria-label={a.name}>
      <div className="agent-head"><div><strong>✦ {a.name}</strong><div className="muted">{a.tagline}</div></div><button className="icon" data-testid="agent-close" onClick={onClose} aria-label="Close">×</button></div>
      <div className="agent-body" data-testid="agent-messages">
        {!msgs.length && <div className="agent-sugg">{a.suggestions.map((s, i) => <button key={s} data-testid={`agent-suggestion-${i}`} onClick={() => send(s)}>{s}</button>)}</div>}
        {msgs.map((m) => (
          <div key={m.id} className={`msg ${m.from}`} data-testid={`agent-msg-${m.from}`}>{m.text}
            {m.from === "agent" && <div className="react"><button data-testid="agent-thumb-up" className={m.reaction === "positive" ? "on" : ""} onClick={() => react(m.id, "positive")}>👍</button>
              <button data-testid="agent-thumb-down" className={m.reaction === "negative" ? "on" : ""} onClick={() => react(m.id, "negative")}>👎</button></div>}
          </div>))}
        {busy && <div className="msg agent muted">Thinking…</div>}
      </div>
      <div className="agent-input"><input data-testid="agent-input" value={text} placeholder="Ask the agent…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(text)} />
        <button className="primary" data-testid="agent-send" onClick={() => send(text)}>Send</button></div>
    </div>
  );
}
