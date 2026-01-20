/**
 * 📊 VIBE Analytics - Session Management
 */
const SESSION_KEY = "vibe_session_id";

export function getSessionId(): string {
  if (typeof sessionStorage === "undefined") return "server_session";
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `vibe_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
