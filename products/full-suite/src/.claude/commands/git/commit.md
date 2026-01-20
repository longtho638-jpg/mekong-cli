---
description: Create git commit with conventional format and emoji
---

// turbo

# /commit - Conventional Commit

Create a well-formatted git commit following conventional commit standards.

## Usage

```
/commit [type] [message]
```

## Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

## Claude Prompt Template

```
Analyze the staged changes and create a conventional commit:

1. Run `git diff --staged` to see changes
2. Determine the commit type (feat/fix/docs/etc)
3. Write concise commit message (50 chars max)
4. Add emoji prefix based on type:
   - feat: ✨
   - fix: 🐛
   - docs: 📝
   - style: 💄
   - refactor: ♻️
   - test: ✅
   - chore: 🔧

5. Execute: git commit -m "{emoji} {type}: {message}"

Return the commit SHA.
```

## Example Output

```
✨ feat: add user authentication module
Commit: a1b2c3d
```
