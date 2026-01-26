export type AuditActionType = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export';
export type AuditResource = 'user' | 'file' | 'settings' | 'auth' | 'system';

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: AuditActionType;
  resource: AuditResource;
  details: string;
  ipAddress: string;
  timestamp: string;
  status: 'success' | 'failure';
}

export interface AuditLogFilters {
  userId?: string;
  action?: AuditActionType | 'all';
  startDate?: Date;
  endDate?: Date;
  search?: string;
}
