"""
CLI Command Models - Pydantic v2 models for CLI input validation

All CLI commands use typed Pydantic models for consistent validation.
"""

from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


# ============= Cook Command =============


class CookCommand(BaseModel):
    """Model for 'mekong cook' command."""

    goal: str = Field(
        ...,
        description="The goal to achieve",
        min_length=1,
        max_length=2000,
    )
    recipe: Optional[Path] = Field(
        None,
        description="Optional recipe file to execute",
    )
    verbose: bool = Field(
        False,
        description="Enable verbose output",
    )
    dry_run: bool = Field(
        False,
        description="Plan only, don't execute",
    )
    strict: bool = Field(
        False,
        description="Strict mode - fail fast on errors",
    )
    no_rollback: bool = Field(
        False,
        description="Disable rollback on failure",
    )

    @field_validator("goal")
    @classmethod
    def goal_not_empty(cls, v: str) -> str:
        """Ensure goal is not just whitespace."""
        if not v.strip():
            raise ValueError("Goal cannot be empty or whitespace only")
        return v.strip()

    @model_validator(mode="after")
    def validate_recipe_file(self) -> CookCommand:
        """Validate recipe file exists if provided."""
        if self.recipe and not self.recipe.exists():
            raise ValueError(f"Recipe file not found: {self.recipe}")
        return self


# ============= Plan Command =============


class PlanCommand(BaseModel):
    """Model for 'mekong plan' command."""

    goal: str = Field(
        ...,
        description="The goal to plan",
        min_length=1,
        max_length=2000,
    )
    output_format: str = Field(
        "markdown",
        description="Output format: markdown, json, yaml",
    )
    output_file: Optional[Path] = Field(
        None,
        description="Optional output file path",
    )

    @field_validator("goal")
    @classmethod
    def goal_not_empty(cls, v: str) -> str:
        """Ensure goal is not just whitespace."""
        if not v.strip():
            raise ValueError("Goal cannot be empty or whitespace only")
        return v.strip()

    @field_validator("output_format")
    @classmethod
    def validate_output_format(cls, v: str) -> str:
        """Validate output format is supported."""
        valid_formats = {"markdown", "json", "yaml"}
        if v.lower() not in valid_formats:
            raise ValueError(f"Output format must be one of: {valid_formats}")
        return v.lower()


# ============= License Commands =============


class LicenseTier(str):
    """License tier enumeration."""

    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class LicenseGenerateCommand(BaseModel):
    """Model for 'mekong license generate' command."""

    tier: str = Field(
        ...,
        description="License tier: free, pro, enterprise",
    )
    email: EmailStr = Field(
        ...,
        description="License holder email",
    )
    org_name: str = Field(
        ...,
        description="Organization name",
        min_length=1,
        max_length=200,
    )
    duration_days: int = Field(
        365,
        description="License duration in days",
        ge=1,
        le=730,  # Max 2 years
    )
    features: Optional[list[str]] = Field(
        None,
        description="Optional list of enabled features",
    )

    @field_validator("tier")
    @classmethod
    def validate_tier(cls, v: str) -> str:
        """Validate license tier."""
        valid_tiers = {"free", "pro", "enterprise"}
        if v.lower() not in valid_tiers:
            raise ValueError(f"Tier must be one of: {valid_tiers}")
        return v.lower()

    @field_validator("org_name")
    @classmethod
    def validate_org_name(cls, v: str) -> str:
        """Validate organization name."""
        if not v.strip():
            raise ValueError("Organization name cannot be empty")
        return v.strip()


class LicenseValidateCommand(BaseModel):
    """Model for 'mekong license validate' command."""

    license_key: str = Field(
        ...,
        description="License key to validate",
    )
    feature: Optional[str] = Field(
        None,
        description="Optional feature to check",
    )

    @field_validator("license_key")
    @classmethod
    def validate_license_key_format(cls, v: str) -> str:
        """Validate license key format (RPP-/REP- prefix)."""
        pattern = r"^(RPP|REP)-[A-Za-z0-9]{16,}$"
        if not re.match(pattern, v):
            raise ValueError(
                "License key must start with RPP- or REP- followed by at least 16 alphanumeric characters"
            )
        return v


# ============= Swarm Commands =============


class SwarmRegisterCommand(BaseModel):
    """Model for 'mekong swarm register' command."""

    node_name: str = Field(
        ...,
        description="Unique node name",
        min_length=1,
        max_length=64,
    )
    host: str = Field(
        "localhost",
        description="Node host address",
    )
    port: int = Field(
        8080,
        description="Node port",
        ge=1,
        le=65535,
    )
    token: str = Field(
        ...,
        description="Swarm registration token",
    )
    grpc_port: Optional[int] = Field(
        None,
        description="Optional gRPC port",
        ge=1,
        le=65535,
    )

    @field_validator("node_name")
    @classmethod
    def validate_node_name(cls, v: str) -> str:
        """Validate node name format."""
        pattern = r"^[a-zA-Z][a-zA-Z0-9_-]*$"
        if not re.match(pattern, v):
            raise ValueError(
                "Node name must start with a letter and contain only letters, numbers, underscores, or hyphens"
            )
        return v


class SwarmConfig(BaseModel):
    """Swarm node configuration."""

    node_id: str = Field(..., description="Unique node identifier")
    node_name: str = Field(..., description="Node name")
    host: str = Field(default="localhost", description="Host address")
    port: int = Field(default=8080, ge=1, le=65535)
    grpc_port: Optional[int] = Field(None, ge=1, le=65535)
    status: str = Field(default="pending", description="Node status")
    registered_at: datetime = Field(default_factory=datetime.utcnow)


# ============= Run Command =============


class RunCommand(BaseModel):
    """Model for 'mekong run' command."""

    recipe: Path = Field(
        ...,
        description="Recipe file to execute",
    )
    verbose: bool = Field(
        False,
        description="Enable verbose output",
    )
    dry_run: bool = Field(
        False,
        description="Plan only, don't execute",
    )
    strict: bool = Field(
        False,
        description="Strict mode - fail fast",
    )

    @field_validator("recipe")
    @classmethod
    def validate_recipe_file(cls, v: Path) -> Path:
        """Validate recipe file exists and has .md extension."""
        if not v.exists():
            raise ValueError(f"Recipe file not found: {v}")
        if v.suffix != ".md":
            raise ValueError(f"Recipe file must have .md extension, got: {v.suffix}")
        return v


# ============= Agent Command =============


class AgentCommand(BaseModel):
    """Model for 'mekong agent' command."""

    name: str = Field(
        ...,
        description="Agent name",
        min_length=1,
        max_length=64,
    )
    command: str = Field(
        ...,
        description="Command to execute",
        min_length=1,
        max_length=5000,
    )

    @field_validator("name")
    @classmethod
    def validate_agent_name(cls, v: str) -> str:
        """Validate agent name format."""
        pattern = r"^[a-zA-Z][a-zA-Z0-9_-]*$"
        if not re.match(pattern, v):
            raise ValueError(
                "Agent name must start with a letter and contain only letters, numbers, underscores, or hyphens"
            )
        return v


__all__ = [
    "CookCommand",
    "PlanCommand",
    "LicenseGenerateCommand",
    "LicenseValidateCommand",
    "SwarmRegisterCommand",
    "SwarmConfig",
    "RunCommand",
    "AgentCommand",
]
