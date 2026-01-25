# BaseMCPServer API Reference

## Class: `BaseMCPServer`

**Path**: `antigravity.mcp.base.BaseMCPServer`

The abstract base class for all MCP servers. It implements the JSON-RPC 2.0 protocol over stdio.

### Constructor

#### `__init__(name: str, version: str = "0.1.0")`

Initializes the MCP server.

- **Parameters**:
  - `name` (str): The name of the server (used for logging and identification).
  - `version` (str, optional): The version of the server. Defaults to "0.1.0".

### Abstract Methods (Must Implement)

#### `get_tools(self) -> List[Dict[str, Any]]`

Defines the tools exposed by this server.

- **Returns**: A list of tool definitions. Each definition is a dictionary containing `name`, `description`, and `inputSchema`.

#### `async handle_tool_call(self, name: str, arguments: Dict[str, Any]) -> Any`

Executes the logic for a called tool.

- **Parameters**:
  - `name` (str): The name of the tool to execute.
  - `arguments` (Dict[str, Any]): The arguments provided by the client.
- **Returns**: The result of the tool execution (Any serializable type).
- **Raises**:
  - `ValueError`: If the tool name is unknown or arguments are invalid.
  - `Exception`: For any other internal errors.

### Public Methods

#### `run(self, transport: str = "stdio") -> None`

Starts the server loop.

- **Parameters**:
  - `transport` (str): The transport mechanism to use. Currently supports `"stdio"`.
- **Raises**:
  - `ValueError`: If an unknown transport is specified.
  - `NotImplementedError`: If the transport is not yet implemented (http/websocket).

### Internal Methods

#### `_setup_logging(self) -> None`
Configures `self.logger` to write to `stderr` with a structured format.

#### `async handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]`
Processes a raw JSON-RPC request dictionary and returns a response dictionary. Routes standard MCP methods (`initialize`, `ping`, `tools/list`, `tools/call`).

#### `async run_stdio(self) -> None`
The main event loop for reading lines from `stdin`, processing requests, and writing responses to `stdout`.

---

## Type Definitions

**Path**: `antigravity.mcp.types`

### `JSONRPCRequest`
Data class representing a JSON-RPC 2.0 request.
- `jsonrpc`: "2.0"
- `method`: str
- `params`: Optional[Dict]
- `id`: Optional[Union[str, int]]

### `JSONRPCResponse`
Data class representing a JSON-RPC 2.0 response.
- `jsonrpc`: "2.0"
- `result`: Any
- `error`: Optional[Dict]
- `id`: Optional[Union[str, int]]

### `JSONRPCError`
Data class for errors.
- `code`: int
- `message`: str
- `data`: Optional[Any]

### `MCPErrorCodes`
Standard error codes constants.

| Constant | Value | Description |
|----------|-------|-------------|
| `PARSE_ERROR` | -32700 | Invalid JSON was received. |
| `INVALID_REQUEST` | -32600 | The JSON sent is not a valid Request object. |
| `METHOD_NOT_FOUND` | -32601 | The method does not exist / is not available. |
| `INVALID_PARAMS` | -32602 | Invalid method parameter(s). |
| `INTERNAL_ERROR` | -32603 | Internal JSON-RPC error. |
| `SERVER_ERROR_START` | -32000 | Reserved for implementation-defined server-errors. |
| `SERVER_ERROR_END` | -32099 | Reserved for implementation-defined server-errors. |
