# Infrastructure as Code (IaC) Standards

Guidelines for managing infrastructure using code.

## Rules
- All infrastructure (servers, databases, networks) must be defined in code (e.g., Terraform, CloudFormation, CDK).
- IaC files must be version-controlled in the same repository as the application or a dedicated infra repo.
- Use modular IaC to promote reuse and maintainability.
- Perform a "plan" or "dry run" and require approval before applying changes to production infrastructure.
- Avoid manual changes ("click-ops") in the cloud console; all changes must go through code.
- Tag all resources with consistent metadata (environment, project, owner).
- Regularly run infrastructure audits to detect configuration drift.
