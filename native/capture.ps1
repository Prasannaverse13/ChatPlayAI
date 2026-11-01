param([string]$WindowId)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;using System.Runtime.InteropServices;
public class CaptureTarget {
 [StructLayout(LayoutKind.Sequential)] public struct RECT {public int Left,Top,Right,Bottom;}
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h,out RECT r);
}
'@
$target=[IntPtr]::new([long]::Parse($WindowId))
if($target -eq [IntPtr]::Zero -or [CaptureTarget]::GetForegroundWindow() -ne $target){throw 'The selected game must be focused before capture.'}
$rect=New-Object CaptureTarget+RECT
if(-not [CaptureTarget]::GetWindowRect($target,[ref]$rect)){throw 'Selected game window no longer exists.'}
$width=$rect.Right-$rect.Left; $height=$rect.Bottom-$rect.Top
if($width -lt 32 -or $height -lt 32 -or $width -gt 7680 -or $height -gt 4320){throw 'Unsupported capture dimensions.'}
$bitmap=New-Object Drawing.Bitmap $width,$height
$graphics=[Drawing.Graphics]::FromImage($bitmap)
try{
 $graphics.CopyFromScreen($rect.Left,$rect.Top,0,0,$bitmap.Size)
 if([CaptureTarget]::GetForegroundWindow() -ne $target){throw 'Game focus changed during capture.'}
 $scale=[Math]::Min(1,[Math]::Min(1280.0/$width,720.0/$height)); $output=New-Object Drawing.Bitmap ([int]($width*$scale)),([int]($height*$scale))
 $resizer=[Drawing.Graphics]::FromImage($output)
 try{$resizer.DrawImage($bitmap,0,0,$output.Width,$output.Height);$stream=New-Object IO.MemoryStream;try{$output.Save($stream,[Drawing.Imaging.ImageFormat]::Jpeg);[Console]::Write('data:image/jpeg;base64,'+[Convert]::ToBase64String($stream.ToArray()))}finally{$stream.Dispose()}}finally{$resizer.Dispose();$output.Dispose()}
}finally{$graphics.Dispose();$bitmap.Dispose()}
