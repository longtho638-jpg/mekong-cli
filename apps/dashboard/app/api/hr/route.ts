/**
 * HR API Routes
 * RESTful endpoints for Employees, Payroll, Leave Management
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { HRService, EmployeeStatus } from '@/lib/hr'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

function getService() {
  return new HRService()
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/hr
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const action = searchParams.get('action') || 'employees'
    const employeeId = searchParams.get('employeeId')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const service = getService()

    switch (action) {
      case 'employees':
        const filters = {
          status: searchParams.get('status') as EmployeeStatus | undefined,
          department: searchParams.get('department') || undefined,
        }
        const employees = await service.listEmployees(tenantId, filters)
        return NextResponse.json({
          success: true,
          data: employees,
          count: employees.length,
        })

      case 'employee':
        if (!employeeId) {
          return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
        }
        const employee = await service.getEmployee(tenantId, employeeId)
        return NextResponse.json({
          success: true,
          data: employee,
        })

      case 'payroll':
        const runId = searchParams.get('runId')
        if (!runId) {
          return NextResponse.json({ error: 'runId required' }, { status: 400 })
        }
        const payroll = await service.getPayrollRun(tenantId, runId)
        return NextResponse.json({
          success: true,
          data: payroll,
        })

      case 'leave-balance':
        if (!employeeId) {
          return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
        }
        const balance = await service.getLeaveBalance(tenantId, employeeId)
        return NextResponse.json({
          success: true,
          data: balance,
        })

      case 'calculate-payroll':
        const salary = parseFloat(searchParams.get('salary') || '0')
        const country = searchParams.get('country') || 'VN'
        const calculation = service.calculatePayroll(salary, country)
        return NextResponse.json({
          success: true,
          data: calculation,
        })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    logger.error('HR API error', error)
    return NextResponse.json({ error: 'Failed to fetch HR data' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/hr
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, action, ...data } = body

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const service = getService()

    switch (action) {
      case 'create-employee':
        const employee = await service.createEmployee(tenantId, {
          ...data.employee,
          hireDate: new Date(data.employee.hireDate),
          dateOfBirth: data.employee.dateOfBirth ? new Date(data.employee.dateOfBirth) : undefined,
        })
        return NextResponse.json({
          success: true,
          data: employee,
        })

      case 'update-employee':
        const updated = await service.updateEmployee(tenantId, data.employeeId, data.updates)
        return NextResponse.json({
          success: true,
          data: updated,
        })

      case 'run-payroll':
        const payrollRun = await service.createPayrollRun(tenantId, data.period, data.userId)
        return NextResponse.json({
          success: true,
          data: payrollRun,
        })

      case 'process-payroll':
        await service.processPayroll(tenantId, data.runId)
        return NextResponse.json({
          success: true,
          message: 'Payroll processed',
        })

      case 'request-leave':
        const leave = await service.requestLeave(tenantId, {
          employeeId: data.employeeId,
          leaveType: data.leaveType,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          reason: data.reason,
        })
        return NextResponse.json({
          success: true,
          data: leave,
        })

      case 'approve-leave':
        await service.approveLeave(tenantId, data.leaveId, data.approverId)
        return NextResponse.json({
          success: true,
          message: 'Leave approved',
        })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    logger.error('HR API error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    )
  }
}
