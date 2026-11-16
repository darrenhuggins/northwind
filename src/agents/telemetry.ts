// The app emits a DOM event for every agent interaction. The bare app does nothing with it.
// The instrumentation PR adds a listener that forwards these to the analytics SDK (pendo.trackAgent).
export type AgentEventType = "prompt" | "agent_response" | "user_reaction";
export type AgentEvent = { type: AgentEventType; agentKey: string; conversationId: string; messageId: string; content: string };

export function emitAgentEvent(e: AgentEvent) {
  window.dispatchEvent(new CustomEvent<AgentEvent>("nw:agent", { detail: e }));
}
export const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
