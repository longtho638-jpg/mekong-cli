# GitHub MCP Server Skill

This skill provides integration with the [GitHub MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/github).

## Features

- **Repository Management**: Create, read, update, and delete repositories.
- **Issue Tracking**: Manage issues and comments.
- **Pull Requests**: Create and review pull requests.
- **File Operations**: Read and write files in repositories.

## Usage

This skill is typically used by configuring the MCP server in your `claude_config.json` or equivalent MCP client configuration.

### Configuration

Add the following to your MCP configuration:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["node_modules/@modelcontextprotocol/server-github/dist/index.js"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## Requirements

- `@modelcontextprotocol/server-github`
- `GITHUB_PERSONAL_ACCESS_TOKEN`
