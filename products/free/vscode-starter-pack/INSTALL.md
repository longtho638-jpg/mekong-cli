# Installation Guide 🛠️

Follow these simple steps to supercharge your VSCode environment.

## Option 1: Per-Project Setup (Recommended for Teams)

1.  **Copy Configuration**:
    Copy the `.vscode` folder from this pack into the root of your project.
    ```bash
    cp -r .vscode /path/to/your/project/
    ```

2.  **Install Recommended Extensions**:
    - Open your project in VSCode.
    - Go to the **Extensions** view (`Cmd+Shift+X`).
    - Filter by `@recommended`.
    - Click **Install Workspace Recommended Extensions**.

## Option 2: Global User Setup (For Personal Use)

1.  **Settings & Keybindings**:
    - Open VSCode Command Palette (`Cmd+Shift+P`).
    - Type `Open User Settings (JSON)` -> Paste content from `settings.json`.
    - Type `Open Keyboard Shortcuts (JSON)` -> Paste content from `keybindings.json`.

2.  **Snippets**:
    - Open VSCode Command Palette.
    - Type `Snippets: Configure User Snippets`.
    - Select language (e.g., `typescriptreact.json`, `python.json`, `markdown.json`).
    - Copy content from the corresponding file in `snippets/` folder into your user snippets file.

## Verification ✅

1.  Open a Python or TypeScript file.
2.  Make a messy change (bad indentation).
3.  Save the file (`Cmd+S`).
4.  **Success**: It should auto-format instantly!

---
**Need Help?**
Check out the [VSCode Documentation](https://code.visualstudio.com/docs)
