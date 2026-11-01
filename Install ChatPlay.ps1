param([string]$DestinationPath=(Join-Path $env:LOCALAPPDATA 'ChatPlayAI'),[switch]$NoShortcut)
$ErrorActionPreference='Stop'
$destination=[IO.Path]::GetFullPath($DestinationPath)
$application=Join-Path $destination 'app'
$dataDirectory=Join-Path $destination 'data'
New-Item -ItemType Directory -Path $application,$dataDirectory -Force | Out-Null
$sourceRoot=[IO.Path]::GetFullPath($PSScriptRoot)
if($application.TrimEnd('\') -eq $sourceRoot.TrimEnd('\')){throw 'Extract the release outside the installed app directory before installing an update.'}
# Copy only release-owned paths. Existing data and credential storage are preserved.
$items=@('dist','dist-server','runtime','node_modules','native','scripts','package.json','package-lock.json','README.md','Start ChatPlay.cmd','Install ChatPlay.ps1')
foreach($item in $items){$source=Join-Path $sourceRoot $item;if(Test-Path -LiteralPath $source){Copy-Item -LiteralPath $source -Destination $application -Recurse -Force}}
$launcher=Join-Path $destination 'ChatPlay.cmd'
$launchText="@echo off`r`nset `"CHATPLAY_DATA_DIR=$dataDirectory`"`r`ncd /d `"$application`"`r`ncall `"$application\Start ChatPlay.cmd`"`r`n"
[IO.File]::WriteAllText($launcher,$launchText,[Text.Encoding]::ASCII)
if(-not $NoShortcut){$shell=New-Object -ComObject WScript.Shell;$shortcut=$shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Desktop')) 'ChatPlay AI.lnk'));$shortcut.TargetPath=$launcher;$shortcut.WorkingDirectory=$application;$shortcut.Description='ChatPlay AI local streamer studio';$shortcut.Save()}
Write-Output "Installed ChatPlay to $application. User data is in $dataDirectory."
Write-Output 'Launch ChatPlay.cmd or the desktop shortcut. This installer is unsigned; no signing certificate is configured.'
