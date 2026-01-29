import pytest

from backend.agents.hrops.employee_agent import Department, EmployeeAgent, EmployeeStatus


class TestEmployeeAgent:
    def test_initialization(self):
        agent = EmployeeAgent()
        assert agent.name == "Employee"
        assert agent.status == "ready"
        assert len(agent.employees) == 0

    def test_add_employee(self):
        agent = EmployeeAgent()
        emp = agent.add_employee(
            name="Alice",
            email="alice@example.com",
            department=Department.ENGINEERING,
            title="Software Engineer",
            salary=5000.0,
        )

        assert emp.id in agent.employees
        assert emp.name == "Alice"
        assert emp.department == Department.ENGINEERING
        assert emp.status == EmployeeStatus.PROBATION
        assert agent.employees[emp.id] == emp

    def test_update_status(self):
        agent = EmployeeAgent()
        emp = agent.add_employee("Bob", "bob@example.com", Department.SALES, "Sales Rep", 3000.0)

        updated_emp = agent.update_status(emp.id, EmployeeStatus.ACTIVE)
        assert updated_emp.status == EmployeeStatus.ACTIVE
        assert agent.employees[emp.id].status == EmployeeStatus.ACTIVE

    def test_performance_management(self):
        agent = EmployeeAgent()
        emp = agent.add_employee(
            "Charlie", "charlie@example.com", Department.MARKETING, "Marketer", 4000.0
        )

        agent.set_performance(emp.id, 4.5)
        assert agent.employees[emp.id].performance_score == 4.5

        # Test clamping
        agent.set_performance(emp.id, 6.0)
        assert agent.employees[emp.id].performance_score == 5.0

    def test_leave_request(self):
        agent = EmployeeAgent()
        emp = agent.add_employee("Dave", "dave@example.com", Department.HR, "HR Manager", 4500.0)

        # Default leave balance is 12
        assert emp.leave_balance == 12

        agent.request_leave(emp.id, 2)
        assert emp.leave_balance == 10
        assert emp.status == EmployeeStatus.ON_LEAVE

    def test_get_stats(self):
        agent = EmployeeAgent()
        agent.add_employee("E1", "e1@test.com", Department.ENGINEERING, "Dev", 5000.0)
        emp2 = agent.add_employee("E2", "e2@test.com", Department.SALES, "Sales", 4000.0)

        agent.update_status(emp2.id, EmployeeStatus.ACTIVE)

        stats = agent.get_stats()
        assert stats["total_employees"] == 2
        assert stats["active"] == 1  # Only emp2 is active (e1 is probation)
        assert stats["departments"] == 2
