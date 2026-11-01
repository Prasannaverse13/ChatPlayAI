$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Web.Extensions
$source = @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Threading;
using System.Web.Script.Serialization;
public class ChatPlayBridge {
 [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
 [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h, System.Text.StringBuilder b, int n);
 [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr p);
 delegate bool EnumProc(IntPtr h, IntPtr p);
 [DllImport("user32.dll")] static extern short GetAsyncKeyState(int key);
 [DllImport("user32.dll")] static extern uint SendInput(uint n, INPUT[] inputs, int size);
 [DllImport("user32.dll")] static extern uint MapVirtualKey(uint code, uint kind);
 [DllImport("user32.dll")] static extern bool RegisterHotKey(IntPtr h,int id,uint modifiers,uint key);
 [DllImport("user32.dll")] static extern bool UnregisterHotKey(IntPtr h,int id);
 [DllImport("user32.dll")] static extern bool PeekMessage(out MSG msg,IntPtr h,uint min,uint max,uint remove);
 [StructLayout(LayoutKind.Sequential)] struct MSG { public IntPtr hwnd; public uint message; public UIntPtr wParam; public IntPtr lParam; public uint time; public int x,y; public uint extra; }
 [StructLayout(LayoutKind.Sequential)] struct INPUT { public uint type; public UNION data; }
 [StructLayout(LayoutKind.Explicit)] struct UNION { [FieldOffset(0)] public KEYBDINPUT key; [FieldOffset(0)] public MOUSEINPUT mouse; }
 [StructLayout(LayoutKind.Sequential)] struct KEYBDINPUT { public ushort vk, scan; public uint flags, time; public IntPtr extra; }
 [StructLayout(LayoutKind.Sequential)] struct MOUSEINPUT { public int dx,dy; public uint mouseData, flags,time; public IntPtr extra; }
 static Dictionary<string,int> keys=new Dictionary<string,int>{{"left",37},{"up",38},{"right",39},{"down",40},{"space",32},{"enter",13},{"w",87},{"a",65},{"s",83},{"d",68},{"e",69},{"q",81},{"r",82},{"z",90},{"x",88},{"c",67}};
 static int generation=0; static volatile bool done=false; static volatile bool busy=false; static volatile bool armed=false;
 static long heartbeat=DateTime.UtcNow.Ticks; static object gate=new object();
 static void Emit(object v){ lock(gate) Console.WriteLine(new JavaScriptSerializer().Serialize(v)); }
 static void Key(int vk,bool up){uint flags=8u|(up?2u:0u)|((vk>=37&&vk<=40)?1u:0u);INPUT i=new INPUT();i.type=1;i.data.key.scan=(ushort)MapVirtualKey((uint)vk,0);i.data.key.flags=flags;if(SendInput(1,new INPUT[]{i},Marshal.SizeOf(typeof(INPUT)))!=1&&!up)throw new Exception("Windows rejected input. Use a non-elevated supported game.");}
 static void Execute(Dictionary<string,object> m,int epoch){string id=(string)m["id"];try{if(!armed||epoch!=Volatile.Read(ref generation))throw new Exception("Native input is disarmed.");IntPtr target=new IntPtr(long.Parse((string)m["target"]));System.Collections.IList actions=(System.Collections.IList)m["actions"];if(actions.Count<1||actions.Count>4)throw new Exception("Invalid action count.");int total=0;foreach(object raw in actions){var a=(Dictionary<string,object>)raw;string name=(string)a["key"];int duration=Convert.ToInt32(a["durationMs"]), repeat=Convert.ToInt32(a["repeat"]);if(!keys.ContainsKey(name)||duration<40||duration>1000||repeat<1||repeat>3)throw new Exception("Invalid native action.");total+=duration*repeat;}if(total>3000)throw new Exception("Sequence too long.");
 foreach(object raw in actions){var a=(Dictionary<string,object>)raw;int vk=keys[(string)a["key"]], duration=Convert.ToInt32(a["durationMs"]), repeat=Convert.ToInt32(a["repeat"]);for(int r=0;r<repeat;r++){if(epoch!=Volatile.Read(ref generation))throw new Exception("Input cancelled.");if(!IsWindow(target)||GetForegroundWindow()!=target)throw new Exception("Selected game must be the foreground window.");try{Key(vk,false);int elapsed=0;while(elapsed<duration){Thread.Sleep(10);elapsed+=10;if(epoch!=Volatile.Read(ref generation)||GetForegroundWindow()!=target)throw new Exception("Input cancelled or game lost focus.");}}finally{Key(vk,true);}Thread.Sleep(40);}}
 Emit(new {id=id,result=true});}catch(Exception ex){Emit(new{id=id,error=ex.Message});}finally{busy=false;}}
 public static void Run(){bool registered=RegisterHotKey(IntPtr.Zero,17224,0x4000,0x77);var reader=new Thread(()=>{try{string line;while((line=Console.ReadLine())!=null){try{var m=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(line);string type=(string)m["type"];if(type=="heartbeat"){Interlocked.Exchange(ref heartbeat,DateTime.UtcNow.Ticks);continue;}if(type=="arm"){armed=true;continue;}if(type=="cancel"){armed=false;Interlocked.Increment(ref generation);continue;}if(type=="windows"){var list=new List<object>();EnumWindows((h,p)=>{if(IsWindowVisible(h)){var b=new System.Text.StringBuilder(512);GetWindowText(h,b,512);if(b.Length>0)list.Add(new{id=h.ToInt64().ToString(),title=b.ToString()});}return true;},IntPtr.Zero);Emit(new{id=m["id"],result=list});}else if(type=="execute"){if(busy){Emit(new{id=m["id"],error="Input bridge is busy."});continue;}busy=true;var work=m;int commandEpoch=Volatile.Read(ref generation);new Thread(()=>Execute(work,commandEpoch)){IsBackground=true}.Start();}}catch(Exception){Emit(new{type="diagnostic",error="Malformed native request."});}}}finally{Interlocked.Increment(ref generation);done=true;}});reader.IsBackground=true;reader.Start();Emit(new{type="ready"});bool held=false;while(!done){MSG message;while(PeekMessage(out message,IntPtr.Zero,0,0,1)){if(message.message==0x0312){armed=false;Interlocked.Increment(ref generation);Emit(new{type="panic"});}}bool down=(GetAsyncKeyState(0x77)&0x8000)!=0;if(down&&!held){armed=false;Interlocked.Increment(ref generation);Emit(new{type="panic"});}held=down;if(DateTime.UtcNow.Ticks-Interlocked.Read(ref heartbeat)>TimeSpan.FromSeconds(4).Ticks){Interlocked.Increment(ref generation);done=true;}Thread.Sleep(10);}if(registered)UnregisterHotKey(IntPtr.Zero,17224);Thread.Sleep(100);}
}
'@
Add-Type -TypeDefinition $source -ReferencedAssemblies System.Web.Extensions
[ChatPlayBridge]::Run()



