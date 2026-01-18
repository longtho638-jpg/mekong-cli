---
description: Guide development with Test-Driven Development principles
---

// turbo

# /tdd - Test-Driven Development Guide

Enforce Red-Green-Refactor TDD discipline.

## Usage

```
/tdd [feature]
/tdd --red    # Write failing test first
/tdd --green  # Write minimal passing code
/tdd --refactor # Clean up while tests pass
```

## Claude Prompt Template

```
TDD workflow:

🔴 RED Phase:
1. Understand the feature requirement
2. Write a failing test that defines expected behavior
3. Run test to confirm it fails
4. Commit: "🔴 test: add failing test for {feature}"

🟢 GREEN Phase:
1. Write MINIMAL code to pass the test
2. No extra features, just pass the test
3. Run test to confirm it passes
4. Commit: "🟢 feat: implement {feature} to pass test"

♻️ REFACTOR Phase:
1. Review code for improvements
2. Apply SOLID principles
3. Extract methods, reduce duplication
4. Run tests to ensure still passing
5. Commit: "♻️ refactor: clean up {feature}"

Repeat cycle for next requirement.
```

## Example Output

```
🎯 TDD: User Authentication

🔴 RED: Writing failing test...
   ✅ test_user_login_success
   ✅ test_user_login_invalid_password
   ❌ Tests fail as expected

🟢 GREEN: Implementing minimal code...
   ✅ Added login() function
   ✅ All tests pass

♻️ REFACTOR: Cleaning up...
   → Extracted password validation
   → Added type hints
   ✅ Tests still pass

Cycle complete! 3 commits created.
```
