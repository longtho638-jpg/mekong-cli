export interface Project {
  id: number;
  name: string;
  api_key: string;
  created_at: string;
}

export interface Session {
  id: string;
  project_id: number;
  user_id?: string;
  user_agent?: string;
  started_at: string;
  ended_at?: string;
}

export interface SessionEvent {
  id: number;
  session_id: string;
  events_blob: string; // JSON string
  sequence_index: number;
}
