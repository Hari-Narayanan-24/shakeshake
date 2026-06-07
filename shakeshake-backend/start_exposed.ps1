param(
    [int[]]$Ports = @(),
    [switch]$NoBackend
)

$ErrorActionPreference = "Stop"

$RulePrefix = "ShakeShake Dev Backend"
$BackendDir = Split-Path -Parent $PSCommandPath
$LogDir = Join-Path $BackendDir "logs"
$LogPath = Join-Path $LogDir "exposed_ports.log"

function Write-Status([string]$Message) {
    Write-Host $Message
    try {
        New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
        Add-Content -Path $LogPath -Value "[$(Get-Date -Format s)] $Message"
    }
    catch {
        # Logging should never stop the launcher.
    }
}

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
    if ($NoBackend) {
        $arguments += "-NoBackend"
    }

    Write-Status "[*] Windows Firewall changes need Administrator access."
    Write-Status "[*] Opening an elevated PowerShell window..."
    Start-Process powershell.exe -Verb RunAs -WorkingDirectory $BackendDir -ArgumentList $arguments
}

function Get-RuleName([int]$Port) {
    return "$RulePrefix $Port"
}

function Remove-FirewallRules {
    param([int[]]$RulePorts)

    foreach ($port in ($RulePorts | Select-Object -Unique)) {
        $ruleName = Get-RuleName $port
        & netsh advfirewall firewall delete rule name="$ruleName" | Out-Null
    }
}

function Add-FirewallRules {
    param([int[]]$RulePorts)

    foreach ($port in ($RulePorts | Select-Object -Unique)) {
        $ruleName = Get-RuleName $port

        # Delete first so repeated starts do not create duplicate firewall rules.
        & netsh advfirewall firewall delete rule name="$ruleName" | Out-Null

        & netsh advfirewall firewall add rule `
            name="$ruleName" `
            dir=in `
            action=allow `
            protocol=TCP `
            localport=$port `
            remoteip=localsubnet `
            profile=any | Out-Null

        if ($LASTEXITCODE -ne 0) {
            throw "Could not add firewall rule for port $port"
        }

        $rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        if (-not $rule) {
            throw "Firewall rule was not found after creation: $ruleName"
        }

        Write-Status "[+] Opened port $port ($ruleName)"
    }
}

function Show-LanAddresses {
    $addresses = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -notlike "127.*" -and
            $_.IPAddress -notlike "169.254.*" -and
            $_.PrefixOrigin -ne "WellKnown"
        } |
        Sort-Object @{
            Expression = {
                if ($_.InterfaceAlias -match "Wi-Fi|Wireless") { 0 }
                elseif ($_.InterfaceAlias -match "Ethernet") { 1 }
                else { 2 }
            }
        }, InterfaceAlias

    Write-Status ""
    Write-Status "[+] Backend ports are open to devices on your local subnet:"
    foreach ($address in $addresses) {
        Write-Status "    $($address.InterfaceAlias): $($address.IPAddress)"
    }

    $first = $addresses | Select-Object -First 1
    if ($first) {
        Write-Status ""
        Write-Status "[i] Phone app should use:"
        Write-Status "    http://$($first.IPAddress):23010/gateway/health"
        Write-Status "    http://$($first.IPAddress):23002/profile/health"
        Write-Status "    http://$($first.IPAddress):23003/match/health"
    }
}

function Get-BackendPorts {
    if ($Ports.Count -gt 0) {
        return @($Ports | Select-Object -Unique)
    }

    try {
        $portText = python -c "import start_all; print(','.join(str(s['port']) for s in start_all.SERVICES))"
        if ($LASTEXITCODE -eq 0 -and $portText) {
            return @($portText -split "," | ForEach-Object { [int]$_.Trim() } | Select-Object -Unique)
        }
    }
    catch {
        Write-Status "[!] Could not read ports from start_all.py; using default ports."
    }

    return @(23000, 23001, 23002, 23003)
}

if (-not (Test-IsAdmin)) {
    Restart-AsAdmin
    exit 0
}

Set-Location $BackendDir
$uniquePorts = Get-BackendPorts

try {
    Write-Status ""
    Write-Status "============================================================"
    Write-Status "ShakeShake exposed backend started"
    Write-Status "============================================================"
    Write-Status "[*] Opening temporary Windows Firewall rules..."
    Add-FirewallRules $uniquePorts
    Show-LanAddresses

    if ($NoBackend) {
        Write-Status ""
        Write-Status "[+] Firewall rules active. Press Ctrl+C to close them."
        while ($true) {
            Start-Sleep -Seconds 1
        }
    }

    Write-Status ""
    Write-Status "[*] Starting ShakeShake backend. Press Ctrl+C to stop and close exposed ports."
    Write-Status "[i] Log file: $LogPath"
    python start_all.py
}
finally {
    Write-Status ""
    Write-Status "[*] Removing temporary Windows Firewall rules..."
    Remove-FirewallRules $uniquePorts
    Write-Status "[+] Exposed backend ports closed."
}
