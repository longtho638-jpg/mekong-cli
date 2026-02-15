/**
 * Định nghĩa các kiểu dữ liệu cốt lõi cho hệ thống Hybrid AGI của Sophia AI Factory.
 */

// Định nghĩa AgiEvent type
export type AgiEventType = 'agent_spawned' | 'tool_called' | 'mission_completed' | 'error' | 'meta_agent_plan' | 'tactical_agent_action' | 'feedback_loop_update';

export interface AgiEvent {
  id?: string; // UUID tự động tạo bởi DB
  created_at?: string; // TIMESTAMPTZ tự động tạo bởi DB
  event_type: AgiEventType;
  agent_id?: string; // ID của agent liên quan
  mission_id?: string; // ID của mission liên quan
  payload?: Record<string, any>; // Dữ liệu sự kiện cụ thể
}

// Định nghĩa AgiMemory interface
export interface AgiMemory {
  id?: string; // UUID tự động tạo bởi DB
  created_at?: string; // TIMESTAMPTZ tự động tạo bởi DB
  updated_at?: string; // TIMESTAMPTZ tự động cập nhật bởi DB
  agent_id: string; // ID của agent đã tạo memory này
  memory_type: 'observation' | 'thought' | 'plan' | 'skill' | 'long_term';
  content: string; // Nội dung memory
  embedding?: number[]; // Vector embedding của nội dung
  metadata?: Record<string, any>; // Metadata bổ sung (nguồn, timestamp, độ liên quan)
}

// Định nghĩa AgentProfile và AgentState types
export interface AgentProfile {
  id: string; // ID duy nhất cho agent (e.g., 'scriptwriter-agent', 'meta-agent')
  created_at?: string; // TIMESTAMPTZ tự động tạo bởi DB
  updated_at?: string; // TIMESTAMPTZ tự động cập nhật bởi DB
  name: string;
  description?: string;
  config?: Record<string, any>; // Cấu hình của agent (e.g., LLM model, tools)
  state?: AgentState; // Trạng thái hoạt động hiện tại của agent
  last_heartbeat?: string; // Thời gian cuối cùng agent gửi heartbeat
}

export type AgentState = 'idle' | 'running' | 'paused' | 'error' | 'completed';

// Định nghĩa các interfaces cho Meta-Agent và Tactical Teams (nếu cần)
// Ví dụ: Kế hoạch của Meta-Agent
export interface MetaAgentPlan {
  plan_id: string;
  meta_agent_id: string;
  user_request: string;
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed';
  steps: PlanStep[];
  created_at?: string;
  updated_at?: string;
}

export interface PlanStep {
  step_id: string;
  agent_id: string; // Agent sẽ thực hiện bước này
  task_description: string;
  tool_calls?: ToolCall[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: Record<string, any>;
}

export interface ToolCall {
  tool_name: string;
  args: Record<string, any>;
}
