' Silent Launcher for Dukan Sahayak (No Command Prompt Window)
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

strPath = fso.GetParentFolderName(WScript.ScriptFullName)

If fso.FileExists(strPath & "\dist\DukanSahayak\DukanSahayak.exe") Then
    WshShell.CurrentDirectory = strPath & "\dist\DukanSahayak"
    WshShell.Run Chr(34) & strPath & "\dist\DukanSahayak\DukanSahayak.exe" & Chr(34), 1, False
Else
    WshShell.CurrentDirectory = strPath
    WshShell.Run "python desktop_app.py", 0, False
End If
