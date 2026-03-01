/**
 * HR facade — employee management, payroll, time-off, performance reviews
 */
export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  startDate: string;
  status: 'active' | 'onboarding' | 'offboarding' | 'inactive';
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  type: 'vacation' | 'sick' | 'personal' | 'parental';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export class HRFacade {
  async getEmployee(employeeId: string): Promise<Employee> {
    throw new Error('Implement with vibe-hr provider');
  }

  async requestTimeOff(request: Omit<TimeOffRequest, 'id' | 'status'>): Promise<TimeOffRequest> {
    throw new Error('Implement with vibe-hr provider');
  }

  async getOrgChart(departmentId?: string): Promise<Employee[]> {
    throw new Error('Implement with vibe-hr provider');
  }
}
