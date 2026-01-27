import pytest
from app.services.rule_service import RuleService

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_create_and_list_rules(client):
    rule_data = {
        "path": "/api/test",
        "method": "GET",
        "limit": 10,
        "window": 60,
        "strategy": "fixed"
    }

    # Create
    response = client.post("/api/v1/admin/rules/", json=rule_data)
    assert response.status_code == 200
    assert response.json()["path"] == "/api/test"

    # List
    response = client.get("/api/v1/admin/rules/")
    assert response.status_code == 200
    rules = response.json()
    assert len(rules) >= 1
    assert rules[0]["path"] == "/api/test"

def test_delete_rule(client):
    rule_data = {
        "path": "/api/delete",
        "method": "POST",
        "limit": 5,
        "window": 60
    }
    client.post("/api/v1/admin/rules/", json=rule_data)

    response = client.delete("/api/v1/admin/rules/POST/api/delete")
    assert response.status_code == 200

    response = client.get("/api/v1/admin/rules/")
    rules = response.json()
    # verify it's gone (or at least filtering logic works)
    for r in rules:
        if r["path"] == "/api/delete" and r["method"] == "POST":
            assert False, "Rule should be deleted"
