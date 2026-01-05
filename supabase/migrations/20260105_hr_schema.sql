-- HR & Payroll Schema for AgencyOS
-- ERPNext Parity: Employee Management, Payroll, Leave Management

-- ═══════════════════════════════════════════════════════════════════════════════
-- EMPLOYEES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    code VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    hire_date DATE NOT NULL,
    termination_date DATE,
    department VARCHAR(100),
    position VARCHAR(100),
    reports_to UUID REFERENCES employees(id),
    employment_type VARCHAR(20) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contractor', 'intern')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated', 'resigned')),
    salary DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    bank_account TEXT, -- Encrypted
    tax_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, code),
    UNIQUE(tenant_id, email)
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_tenant_isolation" ON employees
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "employees_service_role" ON employees
    FOR ALL USING (current_setting('role') = 'service_role');

-- Indexes
CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_employees_status ON employees(tenant_id, status);
CREATE INDEX idx_employees_department ON employees(tenant_id, department);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PAYROLL RUNS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    run_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'cancelled')),
    total_gross DECIMAL(15, 2) DEFAULT 0,
    total_deductions DECIMAL(15, 2) DEFAULT 0,
    total_net DECIMAL(15, 2) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, period)
);

-- Enable RLS
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_runs_tenant_isolation" ON payroll_runs
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "payroll_runs_service_role" ON payroll_runs
    FOR ALL USING (current_setting('role') = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- PAYROLL ITEMS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    employee_name VARCHAR(200),
    base_salary DECIMAL(15, 2),
    allowances DECIMAL(15, 2) DEFAULT 0,
    deductions DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    social_security DECIMAL(15, 2) DEFAULT 0,
    net_pay DECIMAL(15, 2),
    work_days INTEGER DEFAULT 22,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_items_via_run" ON payroll_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM payroll_runs pr 
            WHERE pr.id = payroll_items.payroll_run_id 
            AND pr.tenant_id = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "payroll_items_service_role" ON payroll_items
    FOR ALL USING (current_setting('role') = 'service_role');

-- Indexes
CREATE INDEX idx_payroll_items_run ON payroll_items(payroll_run_id);
CREATE INDEX idx_payroll_items_employee ON payroll_items(employee_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- LEAVE REQUESTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    employee_name VARCHAR(200),
    leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_requests_tenant_isolation" ON leave_requests
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "leave_requests_service_role" ON leave_requests
    FOR ALL USING (current_setting('role') = 'service_role');

-- Indexes
CREATE INDEX idx_leave_requests_tenant ON leave_requests(tenant_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TRIGGER employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW employee_directory_view WITH (security_invoker = true) AS
SELECT 
    e.id,
    e.tenant_id,
    e.code,
    e.first_name || ' ' || e.last_name AS full_name,
    e.email,
    e.department,
    e.position,
    e.status,
    m.first_name || ' ' || m.last_name AS manager_name
FROM employees e
LEFT JOIN employees m ON e.reports_to = m.id
WHERE e.status != 'terminated';

CREATE OR REPLACE VIEW leave_summary_view WITH (security_invoker = true) AS
SELECT 
    e.tenant_id,
    e.id AS employee_id,
    e.first_name || ' ' || e.last_name AS employee_name,
    COALESCE(SUM(CASE WHEN lr.leave_type = 'annual' THEN lr.days ELSE 0 END), 0) AS annual_used,
    COALESCE(SUM(CASE WHEN lr.leave_type = 'sick' THEN lr.days ELSE 0 END), 0) AS sick_used,
    COALESCE(SUM(CASE WHEN lr.leave_type = 'personal' THEN lr.days ELSE 0 END), 0) AS personal_used
FROM employees e
LEFT JOIN leave_requests lr ON e.id = lr.employee_id 
    AND lr.status = 'approved' 
    AND EXTRACT(YEAR FROM lr.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY e.tenant_id, e.id, e.first_name, e.last_name;
