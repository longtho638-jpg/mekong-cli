from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/hr", tags=["hr"])

class Employee(BaseModel):
    id: str
    name: str
    email: str
    department: str

@router.get("/employees")
async def list_employees() -> List[Employee]:
    """List all employees"""
    return []

@router.post("/employees")
async def create_employee(employee: Employee) -> Employee:
    """Create new employee"""
    return employee
