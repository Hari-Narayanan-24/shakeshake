param(
    [int[]]$Ports = @()
)

$ErrorActionPreference = "Stop"

$RulePrefix = "ShakeShake Dev Backend"
$BackendDir = Split-Path -Parent $PSCommandPath

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
}

function Restart-AsAdmin {
    $arguments = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", "`"$PSCommandPath`""
    )

    if ($Ports.Count -gt 0) {
        $portArg = ($Ports | Select-Object -Unique) -join ","
        $arguments += @("-Ports", $portArg)
    }

    Write-Host "[*] Windows Firewall cleanup needs Administrator access."
    Start-Process powershell.exe -Verb RunAs -WorkingDirectory $BackendDir -ArgumentList $arguments
}

function Get-BackendPorts {
    if ($Ports.Count -gt 0) {
        return @($Ports | Select-Object -Unique)
    }

    try {
        Set-Location $BackendDir
        $portText = python -c "import start_all; print(','.join(str(s['port']) for s in start_all.SERVICES))"
        if ($LASTEXITCODE -eq 0 -and $portText) {
            return @($portText -split "," | ForEach-Object { [int]$_.Trim() } | Select-Object -Unique)
        }
    }
    catch {
        Write-Host "[!] Could not read ports from start_all.py; using default ports."
    }

    return @(23000, 23001, 23002, 23003)
}

function Get-RuleName([int]$Port) {
    return "$RulePrefix $Port"
}

if (-not (Test-IsAdmin)) {
    Restart-AsAdmin
    exit 0
}

$uniquePorts = Get-BackendPorts

Write-Host "[*] Removing ShakeShake temporary firewall rules..."
foreach ($port in $uniquePorts) {
    $ruleName = Get-RuleName $port
    & netsh advfirewall firewall delete rule name="$ruleName" | Out-Null
    Write-Host "    closed port $port"
}

Write-Host "[+] Cleanup complete."
