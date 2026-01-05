/**
 * HR & Payroll Module for AgencyOS
 * ERPNext Parity: Employee Management, Payroll, Leave Management
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'intern';
export type EmployeeStatus = 'active' | 'on_leave' | 'terminated' | 'resigned';
export type LeaveType = 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Employee {
    id: string;
    tenantId: string;
    userId?: string;
    code: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    hireDate: Date;
    terminationDate?: Date;
    department: string;
    position: string;
    reportsTo?: string;
    employmentType: EmploymentType;
    status: EmployeeStatus;
    salary: number;
    currency: string;
    bankAccount?: string;
    taxId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PayrollRun {
    id: string;
    tenantId: string;
    period: string; // YYYY-MM
    runDate: Date;
    status: 'draft' | 'processing' | 'completed' | 'cancelled';
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    employeeCount: number;
    createdBy: string;
    createdAt: Date;
}

export interface PayrollItem {
    id: string;
    payrollRunId: string;
    employeeId: string;
    employeeName: string;
    baseSalary: number;
    allowances: number;
    deductions: number;
    taxAmount: number;
    socialSecurity: number;
    netPay: number;
    workDays: number;
    status: 'pending' | 'paid';
}

export interface LeaveRequest {
    id: string;
    tenantId: string;
    employeeId: string;
    employeeName: string;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    days: number;
    reason?: string;
    status: LeaveStatus;
    approvedBy?: string;
    approvedAt?: Date;
    createdAt: Date;
}

export interface LeaveBalance {
    employeeId: string;
    annual: { total: number; used: number; remaining: number };
    sick: { total: number; used: number; remaining: number };
    personal: { total: number; used: number; remaining: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 TAX CONFIGURATION (SEA)
// ═══════════════════════════════════════════════════════════════════════════════

export const TAX_BRACKETS: Record<string, { min: number; max: number; rate: number }[]> = {
    VN: [ // Vietnam PIT
        { min: 0, max: 5000000, rate: 0.05 },
        { min: 5000000, max: 10000000, rate: 0.10 },
        { min: 10000000, max: 18000000, rate: 0.15 },
        { min: 18000000, max: 32000000, rate: 0.20 },
        { min: 32000000, max: 52000000, rate: 0.25 },
        { min: 52000000, max: 80000000, rate: 0.30 },
        { min: 80000000, max: Infinity, rate: 0.35 },
    ],
    TH: [ // Thailand PIT
        { min: 0, max: 150000, rate: 0 },
        { min: 150000, max: 300000, rate: 0.05 },
        { min: 300000, max: 500000, rate: 0.10 },
        { min: 500000, max: 750000, rate: 0.15 },
        { min: 750000, max: 1000000, rate: 0.20 },
        { min: 1000000, max: 2000000, rate: 0.25 },
        { min: 2000000, max: 5000000, rate: 0.30 },
        { min: 5000000, max: Infinity, rate: 0.35 },
    ],
    ID: [ // Indonesia PIT
        { min: 0, max: 60000000, rate: 0.05 },
        { min: 60000000, max: 250000000, rate: 0.15 },
        { min: 250000000, max: 500000000, rate: 0.25 },
        { min: 500000000, max: 5000000000, rate: 0.30 },
        { min: 5000000000, max: Infinity, rate: 0.35 },
    ],
};

export const SOCIAL_SECURITY_RATES: Record<string, { employee: number; employer: number }> = {
    VN: { employee: 0.105, employer: 0.215 },
    TH: { employee: 0.05, employer: 0.05 },
    ID: { employee: 0.02, employer: 0.0389 },
    SG: { employee: 0.20, employer: 0.17 },
    PH: { employee: 0.045, employer: 0.095 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 HR SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class HRService {
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // EMPLOYEE MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────────

    async createEmployee(tenantId: string, employee: Omit<Employee, 'id' | 'tenantId' | 'code' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
        const code = await this.generateEmployeeCode(tenantId);

        const { data, error } = await this.supabase
            .from('employees')
            .insert({
                tenant_id: tenantId,
                code,
                ...this.mapToDb(employee),
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create employee: ${error.message}`);
        return this.mapFromDb(data);
    }

    async getEmployee(tenantId: string, employeeId: string): Promise<Employee | null> {
        const { data } = await this.supabase
            .from('employees')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('id', employeeId)
            .single();

        return data ? this.mapFromDb(data) : null;
    }

    async listEmployees(tenantId: string, filters?: { status?: EmployeeStatus; department?: string }): Promise<Employee[]> {
        let query = this.supabase
            .from('employees')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('first_name');

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.department) query = query.eq('department', filters.department);

        const { data, error } = await query;
        if (error) throw new Error(`Failed to list employees: ${error.message}`);
        return (data || []).map(this.mapFromDb);
    }

    async updateEmployee(tenantId: string, employeeId: string, updates: Partial<Employee>): Promise<Employee> {
        const { data, error } = await this.supabase
            .from('employees')
            .update(this.mapToDb(updates))
            .eq('tenant_id', tenantId)
            .eq('id', employeeId)
            .select()
            .single();

        if (error) throw new Error(`Failed to update employee: ${error.message}`);
        return this.mapFromDb(data);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PAYROLL
    // ─────────────────────────────────────────────────────────────────────────────

    async createPayrollRun(tenantId: string, period: string, createdBy: string): Promise<PayrollRun> {
        // Get active employees
        const employees = await this.listEmployees(tenantId, { status: 'active' });

        // Create payroll run
        const { data: run, error } = await this.supabase
            .from('payroll_runs')
            .insert({
                tenant_id: tenantId,
                period,
                run_date: new Date().toISOString(),
                status: 'draft',
                total_gross: 0,
                total_deductions: 0,
                total_net: 0,
                employee_count: employees.length,
                created_by: createdBy,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create payroll run: ${error.message}`);

        // Generate payroll items for each employee
        let totalGross = 0;
        let totalDeductions = 0;
        let totalNet = 0;

        for (const emp of employees) {
            const calculation = this.calculatePayroll(emp.salary, emp.currency);

            await this.supabase.from('payroll_items').insert({
                payroll_run_id: run.id,
                employee_id: emp.id,
                employee_name: `${emp.firstName} ${emp.lastName}`,
                base_salary: emp.salary,
                allowances: 0,
                deductions: calculation.deductions,
                tax_amount: calculation.tax,
                social_security: calculation.socialSecurity,
                net_pay: calculation.netPay,
                work_days: 22,
                status: 'pending',
            });

            totalGross += emp.salary;
            totalDeductions += calculation.deductions;
            totalNet += calculation.netPay;
        }

        // Update totals
        await this.supabase
            .from('payroll_runs')
            .update({
                total_gross: totalGross,
                total_deductions: totalDeductions,
                total_net: totalNet,
            })
            .eq('id', run.id);

        return {
            id: run.id,
            tenantId,
            period,
            runDate: new Date(run.run_date),
            status: 'draft',
            totalGross,
            totalDeductions,
            totalNet,
            employeeCount: employees.length,
            createdBy,
            createdAt: new Date(run.created_at),
        };
    }

    async getPayrollRun(tenantId: string, runId: string): Promise<{ run: PayrollRun; items: PayrollItem[] } | null> {
        const { data: run } = await this.supabase
            .from('payroll_runs')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('id', runId)
            .single();

        if (!run) return null;

        const { data: items } = await this.supabase
            .from('payroll_items')
            .select('*')
            .eq('payroll_run_id', runId);

        return {
            run: {
                id: run.id,
                tenantId: run.tenant_id,
                period: run.period,
                runDate: new Date(run.run_date),
                status: run.status,
                totalGross: run.total_gross,
                totalDeductions: run.total_deductions,
                totalNet: run.total_net,
                employeeCount: run.employee_count,
                createdBy: run.created_by,
                createdAt: new Date(run.created_at),
            },
            items: (items || []).map((i: any) => ({
                id: i.id,
                payrollRunId: i.payroll_run_id,
                employeeId: i.employee_id,
                employeeName: i.employee_name,
                baseSalary: i.base_salary,
                allowances: i.allowances,
                deductions: i.deductions,
                taxAmount: i.tax_amount,
                socialSecurity: i.social_security,
                netPay: i.net_pay,
                workDays: i.work_days,
                status: i.status,
            })),
        };
    }

    async processPayroll(tenantId: string, runId: string): Promise<void> {
        await this.supabase
            .from('payroll_runs')
            .update({ status: 'completed' })
            .eq('tenant_id', tenantId)
            .eq('id', runId);

        await this.supabase
            .from('payroll_items')
            .update({ status: 'paid' })
            .eq('payroll_run_id', runId);
    }

    calculatePayroll(salary: number, countryCode: string = 'VN') {
        const ssRates = SOCIAL_SECURITY_RATES[countryCode] || SOCIAL_SECURITY_RATES.VN;
        const taxBrackets = TAX_BRACKETS[countryCode] || TAX_BRACKETS.VN;

        const socialSecurity = salary * ssRates.employee;
        const taxableIncome = salary - socialSecurity;

        // Calculate tax (simplified)
        let tax = 0;
        let remaining = taxableIncome;
        for (const bracket of taxBrackets) {
            if (remaining <= 0) break;
            const taxable = Math.min(remaining, bracket.max - bracket.min);
            tax += taxable * bracket.rate;
            remaining -= taxable;
        }

        const deductions = socialSecurity + tax;
        const netPay = salary - deductions;

        return {
            grossSalary: salary,
            socialSecurity,
            tax,
            deductions,
            netPay,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // LEAVE MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────────

    async requestLeave(tenantId: string, request: {
        employeeId: string;
        leaveType: LeaveType;
        startDate: Date;
        endDate: Date;
        reason?: string;
    }): Promise<LeaveRequest> {
        const employee = await this.getEmployee(tenantId, request.employeeId);
        if (!employee) throw new Error('Employee not found');

        const days = this.calculateWorkDays(request.startDate, request.endDate);

        const { data, error } = await this.supabase
            .from('leave_requests')
            .insert({
                tenant_id: tenantId,
                employee_id: request.employeeId,
                employee_name: `${employee.firstName} ${employee.lastName}`,
                leave_type: request.leaveType,
                start_date: request.startDate.toISOString(),
                end_date: request.endDate.toISOString(),
                days,
                reason: request.reason,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create leave request: ${error.message}`);

        return {
            id: data.id,
            tenantId: data.tenant_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            leaveType: data.leave_type,
            startDate: new Date(data.start_date),
            endDate: new Date(data.end_date),
            days: data.days,
            reason: data.reason,
            status: data.status,
            createdAt: new Date(data.created_at),
        };
    }

    async approveLeave(tenantId: string, leaveId: string, approverId: string): Promise<void> {
        await this.supabase
            .from('leave_requests')
            .update({
                status: 'approved',
                approved_by: approverId,
                approved_at: new Date().toISOString(),
            })
            .eq('tenant_id', tenantId)
            .eq('id', leaveId);
    }

    async getLeaveBalance(tenantId: string, employeeId: string): Promise<LeaveBalance> {
        // Get employee
        const employee = await this.getEmployee(tenantId, employeeId);
        if (!employee) throw new Error('Employee not found');

        // Calculate years of service
        const yearsOfService = Math.floor((Date.now() - employee.hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

        // Default leave entitlements (based on SEA standards)
        const annualTotal = Math.min(12 + yearsOfService, 20);
        const sickTotal = 30;
        const personalTotal = 3;

        // Get used leave
        const { data: leaves } = await this.supabase
            .from('leave_requests')
            .select('leave_type, days')
            .eq('tenant_id', tenantId)
            .eq('employee_id', employeeId)
            .eq('status', 'approved')
            .gte('start_date', new Date(new Date().getFullYear(), 0, 1).toISOString());

        let annualUsed = 0;
        let sickUsed = 0;
        let personalUsed = 0;

        for (const leave of leaves || []) {
            if (leave.leave_type === 'annual') annualUsed += leave.days;
            else if (leave.leave_type === 'sick') sickUsed += leave.days;
            else if (leave.leave_type === 'personal') personalUsed += leave.days;
        }

        return {
            employeeId,
            annual: { total: annualTotal, used: annualUsed, remaining: annualTotal - annualUsed },
            sick: { total: sickTotal, used: sickUsed, remaining: sickTotal - sickUsed },
            personal: { total: personalTotal, used: personalUsed, remaining: personalTotal - personalUsed },
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────────

    private async generateEmployeeCode(tenantId: string): Promise<string> {
        const { count } = await this.supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

        return `EMP-${String((count || 0) + 1).padStart(5, '0')}`;
    }

    private calculateWorkDays(start: Date, end: Date): number {
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
            const day = current.getDay();
            if (day !== 0 && day !== 6) count++;
            current.setDate(current.getDate() + 1);
        }
        return count;
    }

    private mapToDb(emp: Partial<Employee>): Record<string, unknown> {
        return {
            user_id: emp.userId,
            first_name: emp.firstName,
            last_name: emp.lastName,
            email: emp.email,
            phone: emp.phone,
            date_of_birth: emp.dateOfBirth?.toISOString(),
            hire_date: emp.hireDate?.toISOString(),
            termination_date: emp.terminationDate?.toISOString(),
            department: emp.department,
            position: emp.position,
            reports_to: emp.reportsTo,
            employment_type: emp.employmentType,
            status: emp.status,
            salary: emp.salary,
            currency: emp.currency,
            bank_account: emp.bankAccount,
            tax_id: emp.taxId,
        };
    }

    private mapFromDb(data: any): Employee {
        return {
            id: data.id,
            tenantId: data.tenant_id,
            userId: data.user_id,
            code: data.code,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
            hireDate: new Date(data.hire_date),
            terminationDate: data.termination_date ? new Date(data.termination_date) : undefined,
            department: data.department,
            position: data.position,
            reportsTo: data.reports_to,
            employmentType: data.employment_type,
            status: data.status,
            salary: data.salary,
            currency: data.currency,
            bankAccount: data.bank_account,
            taxId: data.tax_id,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    }
}

// Export singleton
export const hrService = new HRService();
