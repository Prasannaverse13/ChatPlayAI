$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$source = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
// Read-only live view of the window the streamer selected. Nothing here sends input.
public static class ChatPlayPreview {
 [StructLayout(LayoutKind.Sequential)] struct RECT { public int Left, Top, Right, Bottom; }
 [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
 [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
 [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
 [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
 [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
 [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h, System.Text.StringBuilder b, int n);
 static readonly ImageCodecInfo jpeg = ImageCodecInfo.GetImageEncoders().First(c => c.FormatID == ImageFormat.Jpeg.Guid);
 static string Esc(string s) { return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", " ").Replace("\n", " "); }
 static bool Blank(Bitmap b) {
  for (int i = 1; i < 6; i++) for (int j = 1; j < 6; j++) {
   Color c = b.GetPixel(b.Width * i / 6, b.Height * j / 6);
   if (c.R + c.G + c.B > 24) return false;
  }
  return true;
 }
 public static string Frame(string id) {
  long raw;
  if (!long.TryParse(id, out raw) || raw == 0) return "{\"error\":\"Select your game window in Settings.\"}";
  IntPtr h = new IntPtr(raw);
  if (!IsWindow(h)) return "{\"error\":\"The selected game window is closed. Pick it again in Settings.\"}";
  var t = new System.Text.StringBuilder(256); GetWindowText(h, t, 256);
  string title = Esc(t.ToString());
  if (IsIconic(h)) return "{\"error\":\"The game is minimized.\",\"title\":\"" + title + "\"}";
  RECT r; if (!GetWindowRect(h, out r)) return "{\"error\":\"Could not read the game window.\"}";
  int w = r.Right - r.Left, ht = r.Bottom - r.Top;
  if (w < 32 || ht < 32 || w > 7680 || ht > 4320) return "{\"error\":\"Unsupported window size.\",\"title\":\"" + title + "\"}";
  using (var full = new Bitmap(w, ht)) {
   using (var g = Graphics.FromImage(full)) {
    IntPtr dc = g.GetHdc();
    bool ok;
    try { ok = PrintWindow(h, dc, 2); } finally { g.ReleaseHdc(dc); }
    // Some GPU games paint black through PrintWindow. When the game is in front, its pixels on screen are the same thing.
    if ((!ok || Blank(full)) && GetForegroundWindow() == h) g.CopyFromScreen(r.Left, r.Top, 0, 0, full.Size);
   }
   double s = Math.Min(1.0, Math.Min(960.0 / w, 540.0 / ht));
   using (var small = new Bitmap(Math.Max(1, (int)(w * s)), Math.Max(1, (int)(ht * s))))
   using (var g2 = Graphics.FromImage(small))
   using (var ms = new MemoryStream()) {
    g2.DrawImage(full, 0, 0, small.Width, small.Height);
    var p = new EncoderParameters(1); p.Param[0] = new EncoderParameter(Encoder.Quality, 72L);
    small.Save(ms, jpeg, p);
    return "{\"title\":\"" + title + "\",\"width\":" + w + ",\"height\":" + ht + ",\"image\":\"data:image/jpeg;base64," + Convert.ToBase64String(ms.ToArray()) + "\"}";
   }
  }
 }
 public static void Run() {
  try { SetProcessDPIAware(); } catch {}
  Console.WriteLine("{\"type\":\"ready\"}");
  string line;
  while ((line = Console.ReadLine()) != null) {
   string result;
   try { result = Frame(line.Trim()); } catch (Exception) { result = "{\"error\":\"Live view unavailable for this window.\"}"; }
   Console.WriteLine(result);
  }
 }
}
'@
Add-Type -TypeDefinition $source -ReferencedAssemblies System.Drawing
[ChatPlayPreview]::Run()
