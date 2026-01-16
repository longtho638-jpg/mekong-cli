"""
IDE Module - Configuration Constants (The Nucleus)
"""

# Extensions bắt buộc phải có
REQUIRED_EXTENSIONS = [
    "ms-python.python",
    "charliermarsh.ruff",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "tamasfe.even-better-toml",
    "redhat.vscode-yaml",
    "usernamehw.errorlens"  # Giúp newbie thấy lỗi ngay
]

# Settings chuẩn (Không cho phép user sửa tay trong workspace)
VSCODE_SETTINGS = {
    "editor.formatOnSave": True,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "[python]": {
        "editor.defaultFormatter": "charliermarsh.ruff",
        "editor.codeActionsOnSave": {
            "source.fixAll": "explicit",
            "source.organizeImports": "explicit"
        }
    },
    "editor.tabSize": 4,
    "editor.rulers": [88, 120],
    "files.exclude": {
        "**/.git": True,
        "**/.DS_Store": True,
        "**/__pycache__": True,
        "**/.pytest_cache": True
    },
    "terminal.integrated.defaultProfile.osx": "zsh",
    "workbench.iconTheme": "material-icon-theme",
    "agencyos.mode": "antigravity"  # Marker
}

# EditorConfig chuẩn
EDITOR_CONFIG = """
# http://editorconfig.org
root = true

[*]
indent_style = space
indent_size = 4
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.{js,jsx,ts,tsx,json,yml,yaml}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false
"""

# Cursor Rules (AI Instructions)
CURSOR_RULES = """
# AgencyOS Antigravity Rules

You are the AI Engine of AgencyOS. You MUST follow these rules:

1.  **Architecture First:** Always check `docs/architecture/top-tier-repos.md` before coding backend.
2.  **No Mocking:** Unless explicitly asked, try to write real logic.
3.  **Vibe Coding:** If user uses `/scaffold`, generate the structure first.
4.  **Binh Phap:** Reference strategy in comments if applicable.

When writing Python: Use `ruff` standards.
When writing Typescript: Use `Next.js 14` app router standards.
"""
