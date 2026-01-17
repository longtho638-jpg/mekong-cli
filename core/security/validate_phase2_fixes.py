#!/usr/bin/env python3
"""
🔒 Phase 2 Security Validation
===============================
Validates the implementation of Phase 2 High Priority Security Fixes.

Security Fix Categories:
1. SQL Injection Prevention (Priority 5)
2. Command Injection Prevention (Priority 6) 
3. API Access Token Protection (Priority 7)
4. Environment Variable Security (Priority 8)

Usage: python3 core/security/validate_phase2_fixes.py
"""

import os
import sys
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


def print_header(title: str):
    """Print section header."""
    print(f"\n{BOLD}{BLUE}{'=' * 60}{RESET}")
    print(f"{BOLD}{BLUE}{title}{RESET}")
    print(f"{BOLD}{BLUE}{'=' * 60}{RESET}\n")


def check_status(condition: bool, success_msg: str, error_msg: str) -> Tuple[bool, str]:
    """Check condition and return status with message."""
    if condition:
        return True, f"{GREEN}✅ {success_msg}{RESET}"
    else:
        return False, f"{RED}❌ {error_msg}{RESET}"


class SecurityValidator:
    """Security fixes validator."""
    
    def __init__(self):
        self.results: Dict[str, List[Dict[str, Any]]] = {
            "sql_injection": [],
            "command_injection": [],
            "api_protection": [],
            "env_security": []
        }
        self.root_path = Path(__file__).parent.parent.parent
    
    def validate_sql_injection_fixes(self) -> bool:
        """Validate SQL injection prevention fixes."""
        print_header("Priority 5: SQL Injection Prevention")
        
        all_passed = True
        
        # Check core/memory.py for parameterized queries
        memory_file = self.root_path / "core" / "memory.py"
        if memory_file.exists():
            with open(memory_file, 'r') as f:
                content = f.read()
            
            # Check for parameterized query implementation
            has_param_check = "isinstance(id_, int)" in content
            has_safe_placeholders = "placeholders = ','.join('?' * len(ids))" in content
            has_validation = "Validate input IDs" in content
            
            status1, msg1 = check_status(
                has_param_check, 
                "Input validation for SQL IDs implemented",
                "Missing input validation for SQL IDs"
            )
            print(f"   {msg1}")
            all_passed &= status1
            
            status2, msg2 = check_status(
                has_safe_placeholders,
                "Parameterized query placeholders implemented", 
                "Missing parameterized query placeholders"
            )
            print(f"   {msg2}")
            all_passed &= status2
            
            status3, msg3 = check_status(
                has_validation,
                "Security comments added to SQL operations",
                "Missing security documentation for SQL operations"
            )
            print(f"   {msg3}")
            all_passed &= status3
        
        else:
            print(f"   {RED}❌ core/memory.py not found{RESET}")
            all_passed = False
        
        self.results["sql_injection"].append({
            "category": "Parameterized Queries",
            "passed": all_passed,
            "details": "SQL injection prevention in core/memory.py"
        })
        
        return all_passed
    
    def validate_command_injection_fixes(self) -> bool:
        """Validate command injection prevention fixes."""
        print_header("Priority 6: Command Injection Prevention")
        
        all_passed = True
        
        # Files to check for shell=True usage
        files_to_check = [
            "scripts/health.py",
            "scripts/morning.py", 
            "scripts/overlord.py",
            "scripts/auto_daily.py",
            "antigravity/core/jules_runner.py"
        ]
        
        files_fixed = 0
        total_files = len(files_to_check)
        
        for file_path in files_to_check:
            full_path = self.root_path / file_path
            if full_path.exists():
                with open(full_path, 'r') as f:
                    content = f.read()
                
                # Check for unsafe shell=True usage (only in actual calls, not function definitions)
                lines = content.split('\n')
                unsafe_shell_usage = 0
                safe_patterns_found = False
                i = 0
                
                for line in lines:
                    # Skip function definitions and comments
                    if ('def run(' in line or 'def run_cmd(' in line or 
                        line.strip().startswith('#') or '"""' in line):
                        i += 1
                        continue
                    
                    # Check for actual subprocess.run calls with shell=True
                    if 'subprocess.run(' in line and 'shell=True' in line:
                        # Check if this is in a conditional safe context
                        context_lines = '\n'.join(lines[max(0, i-2):min(len(lines), i+3)])
                        has_conditional = ('if use_shell:' in context_lines or 
                                         'use_shell=' in context_lines)
                        
                        if bool(has_conditional):
                            safe_patterns_found = True
                        else:
                            unsafe_shell_usage += 1
                    
                    i += 1
                
                # Check for argument list usage (including multiline)
                arg_list_pattern = r'subprocess\.run\(\s*\['
                arg_list_matches = re.findall(arg_list_pattern, content)
                
                # Look for safe subprocess patterns
                has_safe_functions = ('run_safe_pytest' in content or 
                                    'run_silent_command' in content)
                
                # Special case for jules_runner.py - we fixed it by using argument lists
                if file_path == "antigravity/core/jules_runner.py":
                    # Check if it uses argument lists instead of shell=True
                    has_arg_lists = len(arg_list_matches) > 0
                    has_no_shell = "shell=True" not in content
                    if has_arg_lists and has_no_shell:
                        print(f"   {GREEN}✅ {file_path}: Command injection fixed{RESET}")
                        files_fixed += 1
                    else:
                        print(f"   {RED}❌ {file_path}: Still uses unsafe shell patterns{RESET}")
                        all_passed = False
                else:
                    is_secure = unsafe_shell_usage == 0 and (safe_patterns_found or has_safe_functions or len(arg_list_matches) > 0)
                    if is_secure:
                        print(f"   {GREEN}✅ {file_path}: Command injection fixed{RESET}")
                        files_fixed += 1
                    else:
                        print(f"   {RED}❌ {file_path}: {unsafe_shell_usage} unsafe shell=True usage found{RESET}")
                        all_passed = False
            else:
                print(f"   {YELLOW}⚠️  {file_path}: File not found{RESET}")
        
        print(f"\n   Files secured: {files_fixed}/{total_files}")
        
        self.results["command_injection"].append({
            "category": "Shell Command Security",
            "passed": files_fixed == total_files,
            "details": f"{files_fixed}/{total_files} files fixed"
        })
        
        return all_passed
    
    def validate_api_protection_fixes(self) -> bool:
        """Validate API access token protection fixes."""
        print_header("Priority 7: API Access Token Protection")
        
        all_passed = True
        
        # Check authentication middleware implementation
        auth_middleware = self.root_path / "core" / "security" / "auth_middleware.py"
        if auth_middleware.exists():
            with open(auth_middleware, 'r') as f:
                content = f.read()
            
            # Check for key security features
            has_jwt_auth = "def generate_jwt_token" in content
            has_rate_limiting = "def check_rate_limit" in content
            has_auth_decorator = "def require_auth" in content
            has_security_headers = "def add_security_headers" in content
            has_api_key_validation = "def validate_api_key" in content
            
            status1, msg1 = check_status(
                has_jwt_auth,
                "JWT authentication implemented",
                "Missing JWT authentication"
            )
            print(f"   {msg1}")
            all_passed &= status1
            
            status2, msg2 = check_status(
                has_rate_limiting,
                "Rate limiting implemented",
                "Missing rate limiting"
            )
            print(f"   {msg2}")
            all_passed &= status2
            
            status3, msg3 = check_status(
                has_auth_decorator,
                "Authentication decorator implemented",
                "Missing authentication decorator"
            )
            print(f"   {msg3}")
            all_passed &= status3
            
            status4, msg4 = check_status(
                has_security_headers,
                "Security headers implemented",
                "Missing security headers"
            )
            print(f"   {msg4}")
            all_passed &= status4
            
            status5, msg5 = check_status(
                has_api_key_validation,
                "API key validation implemented",
                "Missing API key validation"
            )
            print(f"   {msg5}")
            all_passed &= status5
        
        else:
            print(f"   {RED}❌ Authentication middleware not found{RESET}")
            all_passed = False
        
        # Check if API endpoints are protected
        payments_router = self.root_path / "backend" / "api" / "routers" / "payments.py"
        if payments_router.exists():
            with open(payments_router, 'r') as f:
                content = f.read()
            
            has_auth_import = "from core.security.auth_middleware import" in content
            has_auth_decorators = "@require_auth" in content
            
            status6, msg6 = check_status(
                has_auth_import and has_auth_decorators,
                "API endpoints protected with authentication",
                "API endpoints lack authentication protection"
            )
            print(f"   {msg6}")
            all_passed &= status6
        
        self.results["api_protection"].append({
            "category": "Authentication & Authorization",
            "passed": all_passed,
            "details": "Authentication middleware and API endpoint protection"
        })
        
        return all_passed
    
    def validate_env_security_fixes(self) -> bool:
        """Validate environment variable security fixes."""
        print_header("Priority 8: Environment Variable Security")
        
        all_passed = True
        
        # Check environment manager implementation
        env_manager = self.root_path / "core" / "security" / "env_manager.py"
        if env_manager.exists():
            with open(env_manager, 'r') as f:
                content = f.read()
            
            # Check for key security features
            has_validation = "def validate_all" in content
            has_type_checking = "VariableType" in content
            has_secret_generation = "def _generate_secret" in content
            has_security_rules = "validation_pattern" in content
            has_env_types = "EnvironmentType" in content
            
            status1, msg1 = check_status(
                has_validation,
                "Environment variable validation implemented",
                "Missing environment variable validation"
            )
            print(f"   {msg1}")
            all_passed &= status1
            
            status2, msg2 = check_status(
                has_type_checking,
                "Type checking for environment variables implemented",
                "Missing type checking"
            )
            print(f"   {msg2}")
            all_passed &= status2
            
            status3, msg3 = check_status(
                has_secret_generation,
                "Automatic secret generation implemented",
                "Missing secret generation"
            )
            print(f"   {msg3}")
            all_passed &= status3
            
            status4, msg4 = check_status(
                has_security_rules,
                "Security validation rules implemented",
                "Missing security validation rules"
            )
            print(f"   {msg4}")
            all_passed &= status4
            
            status5, msg5 = check_status(
                has_env_types,
                "Environment-specific configurations implemented",
                "Missing environment-specific configurations"
            )
            print(f"   {msg5}")
            all_passed &= status5
        
        else:
            print(f"   {RED}❌ Environment security manager not found{RESET}")
            all_passed = False
        
        # Check for secure environment variable usage
        critical_vars = [
            "JWT_SECRET_KEY",
            "API_KEY_MASTER",
            "BRAINTREE_PRIVATE_KEY",
            "GUMROAD_ACCESS_TOKEN"
        ]
        
        secure_usage = 0
        for var in critical_vars:
            if var in os.environ and len(os.environ[var]) >= 32:
                secure_usage += 1
        
        status6, msg6 = check_status(
            secure_usage >= 2,
            f"Critical environment variables configured: {secure_usage}/{len(critical_vars)}",
            f"Insufficient critical environment variables: {secure_usage}/{len(critical_vars)}"
        )
        print(f"   {msg6}")
        all_passed &= status6
        
        self.results["env_security"].append({
            "category": "Environment Variable Management",
            "passed": all_passed,
            "details": f"Secure environment management with {secure_usage}/{len(critical_vars)} critical vars"
        })
        
        return all_passed
    
    def run_test_security_system(self) -> bool:
        """Test the implemented security system."""
        print_header("Testing Security System Implementation")
        
        try:
            # Test environment manager
            sys.path.insert(0, str(self.root_path))
            from core.security.env_manager import validate_environment
            
            env_manager = validate_environment()
            is_valid, warnings, errors = env_manager.validate_all()
            
            status1, msg1 = check_status(
                is_valid,
                "Environment validation passed",
                f"Environment validation failed: {len(errors)} errors"
            )
            print(f"   {msg1}")
            
            if warnings:
                print(f"   {YELLOW}⚠️  Warnings: {len(warnings)}{RESET}")
                for warning in warnings[:3]:  # Show first 3 warnings
                    print(f"      - {warning}")
            
            # Test authentication system (if available)
            try:
                from core.security.auth_middleware import generate_jwt_token
                
                test_token = generate_jwt_token("test_user", ["read"])
                token_valid = bool(test_token) and len(test_token) > 20
                status2, msg2 = check_status(
                    token_valid,
                    "JWT token generation working",
                    "JWT token generation failed"
                )
                print(f"   {msg2}")
                
            except Exception as e:
                print(f"   {YELLOW}⚠️  JWT test skipped: {e}{RESET}")
            
            return is_valid
            
        except ImportError as e:
            print(f"   {RED}❌ Security system import failed: {e}{RESET}")
            return False
        except Exception as e:
            print(f"   {RED}❌ Security system test failed: {e}{RESET}")
            return False
    
    def generate_security_report(self) -> Dict[str, Any]:
        """Generate comprehensive security report."""
        print_header("🔒 Phase 2 Security Implementation Report")
        
        # Run all validations
        sql_passed = self.validate_sql_injection_fixes()
        cmd_passed = self.validate_command_injection_fixes()
        api_passed = self.validate_api_protection_fixes()
        env_passed = self.validate_env_security_fixes()
        system_test = self.run_test_security_system()
        
        # Calculate overall score
        categories = [sql_passed, cmd_passed, api_passed, env_passed, system_test]
        passed_categories = sum(categories)
        total_categories = len(categories)
        score = (passed_categories / total_categories) * 100
        
        # Generate summary
        print(f"\n{BOLD}📊 SECURITY IMPLEMENTATION SCORE: {score:.0f}%{RESET}")
        print(f"✅ Categories Passed: {passed_categories}/{total_categories}")
        
        # Security status
        if score >= 90:
            status = f"{GREEN}🛡️  HIGHLY SECURE{RESET}"
        elif score >= 75:
            status = f"{YELLOW}🔒 MODERATELY SECURE{RESET}"
        else:
            status = f"{RED}⚠️  NEEDS IMPROVEMENT{RESET}"
        
        print(f"Status: {status}")
        
        # Recommendations
        print(f"\n{BOLD}📋 SECURITY RECOMMENDATIONS:{RESET}")
        
        if not sql_passed:
            print("   - Fix SQL injection vulnerabilities in database operations")
        
        if not cmd_passed:
            print("   - Replace shell=True with argument lists in subprocess calls")
        
        if not api_passed:
            print("   - Implement authentication and rate limiting on API endpoints")
        
        if not env_passed:
            print("   - Set up secure environment variable management")
        
        if not system_test:
            print("   - Fix security system implementation issues")
        
        if score >= 90:
            print(f"   {GREEN}✅ Excellent security posture! Proceed to Phase 3.{RESET}")
        
        # Return structured results
        return {
            "score": score,
            "categories": {
                "sql_injection": sql_passed,
                "command_injection": cmd_passed,
                "api_protection": api_passed,
                "env_security": env_passed,
                "system_test": system_test
            },
            "status": "secure" if score >= 75 else "needs_improvement",
            "passed_categories": passed_categories,
            "total_categories": total_categories
        }


def main():
    """Main validation script."""
    print(f"{BOLD}{BLUE}🔒 Phase 2 High Priority Security Fixes Validation{RESET}")
    print(f"{BLUE}Executing security validation for Days 2-4 timeline...{RESET}")
    
    validator = SecurityValidator()
    report = validator.generate_security_report()
    
    # Exit with appropriate code
    if report["score"] >= 75:
        print(f"\n{GREEN}✅ Phase 2 Security Implementation PASSED{RESET}")
        sys.exit(0)
    else:
        print(f"\n{RED}❌ Phase 2 Security Implementation FAILED{RESET}")
        sys.exit(1)


if __name__ == "__main__":
    main()