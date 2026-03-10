# scout-block.ps1 - PowerShell implementation for blocking heavy directories
# Reads patterns from .ckignore file (defaults: node_modules, __pycache__, .git, dist, build)
#
# Blocking Rules:
# - File paths: Blocks any file_path/path/pattern containing blocked directories
# - Bash commands: Blocks directory access (cd, ls, cat, etc.) but ALLOWS build commands
#   - Blocked: cd node_modules, ls build/, cat dist/file.js
#   - Allowed: npm build, pnpm build, yarn build, npm run build

param()

# 1. Read Input
# -----------------------------------------------------------------------------
$inputJson = $input | Out-String

if ([string]::IsNullOrWhiteSpace($inputJson)) {
    Write-Error "ERROR: Empty input"
    exit 2
}

try {
    $hookData = $inputJson | ConvertFrom-Json
} catch {
    Write-Error "ERROR: Failed to parse JSON input"
    exit 2
}

if (-not $hookData.tool_input) {
    # Fail-open: if structure is weird, allow it to proceed rather than blocking valid tools
    Write-Host "ALLOWED"
    exit 0
}

$toolInput = $hookData.tool_input


# 2. Configuration Setup
# -----------------------------------------------------------------------------
function Get-BlockedPatterns {
    $defaults = @('node_modules', '__pycache__', '\.git', 'dist', 'build')
    
    try {
        # Script is at .claude/hooks/scout-block/scout-block.ps1
        $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
        $claudeDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
        $ckignoreFile = Join-Path $claudeDir ".ckignore"
        
        if (Test-Path $ckignoreFile) {
            $patterns = Get-Content $ckignoreFile -ErrorAction SilentlyContinue |
                ForEach-Object { $_.Trim() } |
                Where-Object { $_ -and -not $_.StartsWith('#') }
            
            if ($patterns.Count -gt 0) {
                # Escape special regex characters for usage in regex pattern
                return $patterns | ForEach-Object { [regex]::Escape($_) }
            }
        }
    } catch {
        # Ignore errors, fallback to defaults
    }
    
    return $defaults
}

$blockedPatterns = Get-BlockedPatterns

# 3. Build Regex Patterns
# -----------------------------------------------------------------------------
$patternGroup = $blockedPatterns -join '|'

# Pattern for directory paths (used for file_path, path, pattern)
# Handles both forward slashes (/) and backslashes (\)
$blockedDirPattern = "(^|[/\]|\s)($patternGroup)([/\]|`$|\s)"

# Pattern for Bash commands - only block directory access
# Blocks: cd node_modules, ls build/
$blockedBashPattern = "(cd\s+|ls\s+|cat\s+|rm\s+|cp\s+|mv\s+|find\s+)($patternGroup)([/\]|`$|\s)|(\s|^|[/\])($patternGroup)[/\]"


# 4. Check Parameters
# -----------------------------------------------------------------------------

# Check File Parameters
$fileParams = @(
    $toolInput.file_path,
    $toolInput.path,
    $toolInput.pattern
)

foreach ($param in $fileParams) {
    if ($param -and ($param -is [string]) -and ($param -match $blockedDirPattern)) {
        $patternList = ($blockedPatterns -replace '\\', '') -join ', '
        Write-Error "ERROR: Blocked directory pattern ($patternList)"
        exit 2
    }
}

# Check Command Parameter
if ($toolInput.command -and ($toolInput.command -is [string])) {
    if ($toolInput.command -match $blockedBashPattern) {
        $patternList = ($blockedPatterns -replace '\\', '') -join ', '
        Write-Error "ERROR: Blocked directory pattern ($patternList)"
        exit 2
    }
}

# Explicitly allowed
exit 0