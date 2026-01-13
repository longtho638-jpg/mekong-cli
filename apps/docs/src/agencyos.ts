/**
 * AgencyOS Agent Framework - Index
 * 
 * Export all hooks, components, and providers for the AgencyOS Agent Framework.
 */

// Hooks
export { useAgentOS } from './hooks/useAgentOS';
export type { AgentState, AgentArtifact, UseAgentOSOptions, UseAgentOSReturn } from './hooks/useAgentOS';

export { useTaskTracker } from './hooks/useTaskTracker';
export type { TaskStep, TaskTrackerState, UseTaskTrackerOptions, UseTaskTrackerReturn } from './hooks/useTaskTracker';

export { useApprovalGate } from './hooks/useApprovalGate';
export type { ApprovalRequest, UseApprovalGateOptions, UseApprovalGateReturn } from './hooks/useApprovalGate';

export { useDashboardAction } from './hooks/useDashboardAction';
export type { DashboardAction, UseDashboardActionOptions, UseDashboardActionReturn } from './hooks/useDashboardAction';

// Components
export { AgentReport } from './components/agencyos/AgentReport';
export type { AgentReportProps } from './components/agencyos/AgentReport';

export { DynamicCard } from './components/agencyos/DynamicCard';
export type { DynamicCardProps, DynamicCardAction } from './components/agencyos/DynamicCard';

// Widgets
export { TaskTrackerWidget } from './components/agencyos/TaskTrackerWidget';
export type { TaskTrackerWidgetProps } from './components/agencyos/TaskTrackerWidget';

export { ApprovalDialog } from './components/agencyos/ApprovalDialog';
export type { ApprovalDialogProps } from './components/agencyos/ApprovalDialog';

export { AgentActivityFeed } from './components/agencyos/AgentActivityFeed';
export type { AgentActivityFeedProps, AgentActivity } from './components/agencyos/AgentActivityFeed';

// Provider
export { AgencyOSProvider, useAgencyOS } from './providers/AgencyOSProvider';
export type { AgencyOSProviderProps, AgencyOSContextValue, Agent, Notification } from './providers/AgencyOSProvider';
