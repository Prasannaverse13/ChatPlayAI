param([ValidateSet('protect','unprotect')][string]$Mode)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$payload = [Console]::In.ReadToEnd()
$entropy = [Text.Encoding]::UTF8.GetBytes('ChatPlayAI.credentials.v1')
if ($Mode -eq 'protect') {
  $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
  [Console]::Write([Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Protect($bytes,$entropy,[Security.Cryptography.DataProtectionScope]::CurrentUser)))
} else {
  $bytes = [Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($payload),$entropy,[Security.Cryptography.DataProtectionScope]::CurrentUser)
  [Console]::Write([Text.Encoding]::UTF8.GetString($bytes))
}
