using System.Diagnostics;

namespace Amiko.Database;

public static class RuntimePath
{
    public static string GetPath()
        => Debugger.IsAttached || AppDomain.CurrentDomain.FriendlyName == "ef" ? "./" : "/data/";
}
