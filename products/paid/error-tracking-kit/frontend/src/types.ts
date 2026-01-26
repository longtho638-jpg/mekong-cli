export interface Project {
  id: number;
  name: string;
  api_key: string;
  created_at: string;
}

export interface Issue {
  id: number;
  project_id: number;
  title: string;
  fingerprint: string;
  status: 'active' | 'resolved' | 'ignored';
  first_seen: string;
  last_seen: string;
  count: number;
}

export interface EventFrame {
  filename: string;
  lineno: number;
  colno?: number;
  function?: string;
  in_app: boolean;
}

export interface Event {
  id: number;
  issue_id: number;
  message: string;
  stack_trace: EventFrame[];
  context: {
    request?: any;
    user?: any;
    tags?: Record<string, string>;
    breadcrumbs?: any[];
  };
  timestamp: string;
}
