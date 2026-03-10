# Mekong CLI Development Setup

## Virtual Environment Setup

Mekong CLI has been successfully installed in development mode. Here's how the setup was completed:

### Prerequisites
- Python 3.9+
- Poetry package manager

### Installation Process

1. **Install Poetry** (if not already installed):
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   export PATH="$HOME/.local/bin:$PATH"
   ```

2. **Install dependencies**:
   ```bash
   poetry install
   poetry add prometheus-client  # Added missing dependency
   ```

3. **Install in development mode**:
   ```bash
   pip install -e . --break-system-packages
   ```

4. **Verify installation**:
   ```bash
   export PATH="$HOME/Library/Python/3.9/bin:$PATH"
   mekong version  # Should show Mekong CLI v3.0.0
   mekong list     # Shows available recipes
   ```

### Key Features

- **Virtual Environment**: Managed via Poetry with all dependencies
- **Development Mode**: Changes to source code are immediately reflected
- **CLI Access**: Available system-wide after installation
- **Testing**: Run `poetry run pytest tests/` for unit tests

### Available Commands

- `mekong cook "<goal>"` - Full pipeline: Plan → Execute → Verify
- `mekong plan "<goal>"` - Plan only (preview steps, no execution)
- `mekong list` - List available recipes
- `mekong version` - Show version information
- `mekong --help` - Show all available commands

### Troubleshooting

If you encounter issues with the PATH, you can either:

1. Add the Python scripts directory to your shell profile:
   ```bash
   echo 'export PATH="$HOME/Library/Python/3.9/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

2. Or run commands with the explicit PATH:
   ```bash
   export PATH="$HOME/Library/Python/3.9/bin:$PATH" && mekong <command>
   ```