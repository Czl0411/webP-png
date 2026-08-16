[Setup]
AppName=WebP 批量转 PNG
AppVersion=1.0.0
DefaultDirName={localappdata}\WebP转PNG
DefaultGroupName=WebP转PNG
DisableProgramGroupPage=yes
OutputDir=dist
OutputBaseFilename=WebP-to-PNG-Setup
PrivilegesRequired=lowest

[Files]
Source: "dist\WebP转PNG.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\WebP 转 PNG"; Filename: "{app}\WebP转PNG.exe"
Name: "{autodesktop}\WebP 转 PNG"; Filename: "{app}\WebP转PNG.exe"
