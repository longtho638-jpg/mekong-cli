"""
🔒 Secure Environment Variable Management
========================================
Centralized validation and management of security-sensitive environment variables.

Features:
- Required variable validation
- Type checking and conversion
- Secret validation rules
- Environment-specific configs
- Automatic secrets generation
- Audit logging
"""

import os
import secrets
import re
import logging
from typing import Dict, Any, Optional, List, Tuple, Union
from pathlib import Path
from enum import Enum
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class EnvironmentType(Enum):
    """Environment types."""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"


class VariableType(Enum):
    """Environment variable types."""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    URL = "url"
    EMAIL = "email"
    API_KEY = "api_key"
    JWT_SECRET = "jwt_secret"
    DATABASE_URL = "database_url"


@dataclass
class EnvironmentVariable:
    """Environment variable definition."""
    name: str
    var_type: VariableType
    required: bool = True
    default: Optional[str] = None
    description: str = ""
    validation_pattern: Optional[str] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    is_secret: bool = False
    auto_generate: bool = False


class SecureEnvironmentManager:
    """Secure environment variable manager."""
    
    def __init__(self, env_file: Optional[Path] = None):
        """Initialize environment manager."""
        self.env_file = env_file
        self.variables: Dict[str, EnvironmentVariable] = {}
        self.values: Dict[str, Any] = {}
        self.warnings: List[str] = []
        self.errors: List[str] = []
        
        # Get current environment
        self.environment = EnvironmentType(os.getenv("ENVIRONMENT", "development"))
        
        # Load default variable definitions
        self._load_variable_definitions()
    
    def _load_variable_definitions(self):
        """Load security-critical environment variable definitions."""
        
        # JWT and Authentication
        self.register(EnvironmentVariable(
            name="JWT_SECRET_KEY",
            var_type=VariableType.JWT_SECRET,
            required=True,
            description="Secret key for JWT token signing",
            min_length=32,
            is_secret=True,
            auto_generate=True
        ))
        
        self.register(EnvironmentVariable(
            name="JWT_EXPIRATION_HOURS",
            var_type=VariableType.INTEGER,
            required=False,
            default="24",
            description="JWT token expiration in hours"
        ))
        
        # API Keys
        self.register(EnvironmentVariable(
            name="API_KEY_MASTER",
            var_type=VariableType.API_KEY,
            required=False,
            description="Master API key for full access",
            min_length=32,
            is_secret=True,
            auto_generate=True
        ))
        
        self.register(EnvironmentVariable(
            name="API_KEY_READ_ONLY",
            var_type=VariableType.API_KEY,
            required=False,
            description="Read-only API key",
            min_length=32,
            is_secret=True,
            auto_generate=True
        ))
        
        self.register(EnvironmentVariable(
            name="API_KEY_WRITE_ACCESS",
            var_type=VariableType.API_KEY,
            required=False,
            description="Write access API key",
            min_length=32,
            is_secret=True,
            auto_generate=True
        ))
        
        # Payment Gateway
        self.register(EnvironmentVariable(
            name="BRAINTREE_MERCHANT_ID",
            var_type=VariableType.STRING,
            required=False,
            description="Braintree merchant ID",
            is_secret=True
        ))
        
        self.register(EnvironmentVariable(
            name="BRAINTREE_PUBLIC_KEY",
            var_type=VariableType.API_KEY,
            required=False,
            description="Braintree public key",
            is_secret=True
        ))
        
        self.register(EnvironmentVariable(
            name="BRAINTREE_PRIVATE_KEY",
            var_type=VariableType.API_KEY,
            required=False,
            description="Braintree private key",
            is_secret=True
        ))
        
        self.register(EnvironmentVariable(
            name="BRAINTREE_ENV",
            var_type=VariableType.STRING,
            required=False,
            default="sandbox",
            description="Braintree environment (sandbox/production)",
            validation_pattern=r"^(sandbox|production)$"
        ))
        
        # External APIs
        self.register(EnvironmentVariable(
            name="GUMROAD_ACCESS_TOKEN",
            var_type=VariableType.API_KEY,
            required=False,
            description="Gumroad API access token",
            is_secret=True
        ))
        
        self.register(EnvironmentVariable(
            name="POLAR_ACCESS_TOKEN",
            var_type=VariableType.API_KEY,
            required=False,
            description="Polar API access token",
            is_secret=True
        ))
        
        self.register(EnvironmentVariable(
            name="TWITTER_BEARER_TOKEN",
            var_type=VariableType.API_KEY,
            required=False,
            description="Twitter API bearer token",
            is_secret=True
        ))
        
        self.register(EnvironmentVariable(
            name="TWITTER_API_KEY",
            var_type=VariableType.API_KEY,
            required=False,
            description="Twitter API key",
            is_secret=True
        ))
        
        self.register(EnvironmentVariable(
            name="TWITTER_API_SECRET",
            var_type=VariableType.API_KEY,
            required=False,
            description="Twitter API secret",
            is_secret=True
        ))
        
        self.register(EnvironmentVariable(
            name="TWITTER_ACCESS_TOKEN",
            var_type=VariableType.API_KEY,
            required=False,
            description="Twitter access token",
            is_secret=True
        ))
        
        self.register(EnvironmentVariable(
            name="TWITTER_ACCESS_SECRET",
            var_type=VariableType.API_KEY,
            required=False,
            description="Twitter access secret",
            is_secret=True
        ))
        
        self.register(EnvironmentVariable(
            name="GEMINI_API_KEY",
            var_type=VariableType.API_KEY,
            required=False,
            description="Google Gemini API key",
            is_secret=True
        ))
        
        # Webhook URLs
        self.register(EnvironmentVariable(
            name="DISCORD_WEBHOOK_URL",
            var_type=VariableType.URL,
            required=False,
            description="Discord webhook URL",
            is_secret=True
        ))
        
        self.register(EnvironmentVariable(
            name="SLACK_WEBHOOK_URL",
            var_type=VariableType.URL,
            required=False,
            description="Slack webhook URL",
            is_secret=True
        ))
        
        # Security Configuration
        self.register(EnvironmentVariable(
            name="ALLOWED_ORIGINS",
            var_type=VariableType.STRING,
            required=False,
            default="http://localhost:3000,http://localhost:8080",
            description="CORS allowed origins"
        ))
        
        self.register(EnvironmentVariable(
            name="RATE_LIMIT_REQUESTS",
            var_type=VariableType.INTEGER,
            required=False,
            default="100",
            description="Rate limit requests per window"
        ))
        
        self.register(EnvironmentVariable(
            name="RATE_LIMIT_WINDOW",
            var_type=VariableType.INTEGER,
            required=False,
            default="3600",
            description="Rate limit window in seconds"
        ))
        
        # Database
        self.register(EnvironmentVariable(
            name="DATABASE_URL",
            var_type=VariableType.DATABASE_URL,
            required=False,
            description="Database connection URL",
            is_secret=True
        ))
        
        # Internal Service URLs
        self.register(EnvironmentVariable(
            name="VIBE_KANBAN_URL",
            var_type=VariableType.URL,
            required=False,
            default="http://localhost:3000",
            description="Vibe Kanban service URL"
        ))
        
        self.register(EnvironmentVariable(
            name="VIBE_KANBAN_TOKEN",
            var_type=VariableType.API_KEY,
            required=False,
            default="default_token",
            description="Vibe Kanban authentication token",
            is_secret=True
        ))
        
        # Server Configuration
        self.register(EnvironmentVariable(
            name="ANTIBRIDGE_PORT",
            var_type=VariableType.INTEGER,
            required=False,
            default="8000",
            description="Antibridge server port"
        ))
    
    def register(self, var_def: EnvironmentVariable):
        """Register an environment variable definition."""
        self.variables[var_def.name] = var_def
    
    def validate_all(self) -> Tuple[bool, List[str], List[str]]:
        """Validate all registered environment variables."""
        self.warnings.clear()
        self.errors.clear()
        self.values.clear()
        
        for name, var_def in self.variables.items():
            self._validate_variable(var_def)
        
        is_valid = len(self.errors) == 0
        return is_valid, self.warnings, self.errors
    
    def _validate_variable(self, var_def: EnvironmentVariable):
        """Validate a single environment variable."""
        value = os.getenv(var_def.name)
        
        # Handle missing values
        if value is None:
            if var_def.required:
                if var_def.auto_generate:
                    value = self._generate_secret(var_def)
                    os.environ[var_def.name] = value
                    self.warnings.append(f"Auto-generated {var_def.name}")
                elif var_def.default:
                    value = var_def.default
                    os.environ[var_def.name] = value
                else:
                    self.errors.append(f"Required variable {var_def.name} is not set")
                    return
            else:
                return
        
        # Type validation and conversion
        try:
            converted_value = self._convert_type(value, var_def.var_type)
            self.values[var_def.name] = converted_value
        except ValueError as e:
            self.errors.append(f"Invalid type for {var_def.name}: {e}")
            return
        
        # Pattern validation
        if var_def.validation_pattern:
            if not re.match(var_def.validation_pattern, str(value)):
                self.errors.append(f"Invalid format for {var_def.name}: {value}")
                return
        
        # Length validation
        if isinstance(value, str):
            if var_def.min_length and len(value) < var_def.min_length:
                self.errors.append(f"{var_def.name} too short: min {var_def.min_length}")
                return
            
            if var_def.max_length and len(value) > var_def.max_length:
                self.errors.append(f"{var_def.name} too long: max {var_def.max_length}")
                return
        
        # Environment-specific validation
        if self.environment == EnvironmentType.PRODUCTION:
            if var_def.is_secret and len(str(value)) < 32:
                self.warnings.append(f"Production secret {var_def.name} seems weak")
    
    def _convert_type(self, value: str, var_type: VariableType) -> Any:
        """Convert string value to appropriate type."""
        if var_type == VariableType.STRING:
            return value
        elif var_type == VariableType.INTEGER:
            return int(value)
        elif var_type == VariableType.FLOAT:
            return float(value)
        elif var_type == VariableType.BOOLEAN:
            return value.lower() in ("true", "1", "yes", "on")
        elif var_type == VariableType.URL:
            if not value.startswith(("http://", "https://")):
                raise ValueError("URL must start with http:// or https://")
            return value
        elif var_type == VariableType.EMAIL:
            if "@" not in value:
                raise ValueError("Invalid email format")
            return value
        elif var_type == VariableType.API_KEY:
            return value
        elif var_type == VariableType.JWT_SECRET:
            return value
        elif var_type == VariableType.DATABASE_URL:
            if not value.startswith(("postgresql://", "mysql://", "sqlite://")):
                raise ValueError("Invalid database URL format")
            return value
        else:
            return value
    
    def _generate_secret(self, var_def: EnvironmentVariable) -> str:
        """Generate a secure secret value."""
        if var_def.var_type == VariableType.JWT_SECRET:
            return secrets.token_urlsafe(32)
        elif var_def.var_type == VariableType.API_KEY:
            return f"ak_{secrets.token_urlsafe(24)}"
        else:
            return secrets.token_urlsafe(32)
    
    def get(self, name: str, default: Any = None) -> Any:
        """Get environment variable value."""
        if name in self.values:
            return self.values[name]
        
        # Fallback to direct environment access
        value = os.getenv(name, default)
        
        # Try to convert based on registered variable
        if name in self.variables:
            try:
                return self._convert_type(value, self.variables[name].var_type)
            except ValueError:
                pass
        
        return value
    
    def is_secure(self) -> bool:
        """Check if the environment configuration is secure."""
        # Check for missing required variables
        if self.errors:
            return False
        
        # Check environment-specific security requirements
        if self.environment == EnvironmentType.PRODUCTION:
            # Production should have all required security variables
            required_security_vars = [
                "JWT_SECRET_KEY",
                "API_KEY_MASTER"
            ]
            
            for var in required_security_vars:
                if var not in self.values or not self.values[var]:
                    return False
            
            # Check for weak defaults
            if self.get("ALLOWED_ORIGINS") == "http://localhost:3000,http://localhost:8080":
                self.warnings.append("Production still using localhost CORS origins")
        
        return True
    
    def export_env_file(self, output_path: Path) -> bool:
        """Export environment variables to .env file."""
        try:
            with open(output_path, 'w') as f:
                f.write("# Auto-generated secure environment variables\n")
                f.write(f"# Environment: {self.environment.value}\n")
                f.write(f"# Generated: {datetime.now().isoformat()}\n\n")
                
                for name, var_def in self.variables.items():
                    if name in os.environ:
                        value = os.environ[name]
                        if var_def.is_secret:
                            f.write(f"# {var_def.description}\n")
                            f.write(f"{name}={value}\n\n")
                        else:
                            f.write(f"# {var_def.description}\n")
                            f.write(f"{name}={value}\n\n")
            
            # Set secure permissions
            output_path.chmod(0o600)
            return True
        
        except Exception as e:
            logger.error(f"Failed to export env file: {e}")
            return False
    
    def print_summary(self):
        """Print environment validation summary."""
        print("🔒 Environment Variable Security Summary")
        print("=" * 50)
        print(f"Environment: {self.environment.value}")
        
        if self.errors:
            print(f"\n❌ Errors ({len(self.errors)}):")
            for error in self.errors:
                print(f"   - {error}")
        
        if self.warnings:
            print(f"\n⚠️  Warnings ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"   - {warning}")
        
        if not self.errors and not self.warnings:
            print("\n✅ All environment variables are secure!")
        
        print(f"\n🔧 Variables Validated: {len(self.values)}")
        
        # Show security status
        is_secure = self.is_secure()
        status = "🛡️  SECURE" if is_secure else "⚠️  NOT SECURE"
        print(f"Security Status: {status}")


def validate_environment(env_file: Optional[Path] = None) -> SecureEnvironmentManager:
    """Validate all environment variables and return manager."""
    manager = SecureEnvironmentManager(env_file)
    manager.validate_all()
    return manager


if __name__ == "__main__":
    # Test environment validation
    from datetime import datetime
    
    print("🔒 Testing Secure Environment Manager")
    print("=" * 50)
    
    # Validate current environment
    manager = validate_environment()
    manager.print_summary()
    
    # Test generation of missing secrets
    print("\n🔧 Testing Secret Generation:")
    test_var = EnvironmentVariable(
        name="TEST_SECRET",
        var_type=VariableType.JWT_SECRET,
        auto_generate=True
    )
    
    secret = manager._generate_secret(test_var)
    print(f"Generated secret: {secret[:16]}...")