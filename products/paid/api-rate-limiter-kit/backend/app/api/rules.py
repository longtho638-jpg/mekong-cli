from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.rule import RateLimitRule, RuleCreate
from app.services.rule_service import RuleService
from app.main import redis_client

router = APIRouter()

def get_rule_service():
    if not redis_client:
        raise HTTPException(status_code=503, detail="Redis not connected")
    return RuleService(redis_client)

@router.get("/", response_model=List[RateLimitRule])
async def list_rules(service: RuleService = Depends(get_rule_service)):
    return await service.get_all_rules()

@router.post("/", response_model=RateLimitRule)
async def create_rule(rule: RuleCreate, service: RuleService = Depends(get_rule_service)):
    # overwrite if exists
    return await service.create_rule(rule)

@router.get("/{method}/{path:path}", response_model=RateLimitRule)
async def get_rule(method: str, path: str, service: RuleService = Depends(get_rule_service)):
    # We need to prepend slash if missing because path param usually strips leading slash or logic varies
    # But usually path param consumes "foo/bar". So let's handle ensuring it starts with /
    normalized_path = f"/{path}" if not path.startswith("/") else path
    rule = await service.get_rule(normalized_path, method)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@router.delete("/{method}/{path:path}")
async def delete_rule(method: str, path: str, service: RuleService = Depends(get_rule_service)):
    normalized_path = f"/{path}" if not path.startswith("/") else path
    success = await service.delete_rule(normalized_path, method)
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"status": "deleted"}
