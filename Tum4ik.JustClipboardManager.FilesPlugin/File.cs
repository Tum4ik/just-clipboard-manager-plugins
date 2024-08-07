using System.Resources;
using System.Text;
using System.Windows;
using Tum4ik.JustClipboardManager.PluginDevKit;
using Tum4ik.JustClipboardManager.PluginDevKit.Attributes;
using Tum4ik.JustClipboardManager.PluginDevKit.Models;

namespace Tum4ik.JustClipboardManager.FilesPlugin;

public sealed class File : Plugin<FileVisualTree>
{
  public override IReadOnlyCollection<string> Formats { get; } = [DataFormats.FileDrop];


  public override ClipData? ProcessData(IDataObject dataObject)
  {
    ArgumentNullException.ThrowIfNull(dataObject);

    if (dataObject.GetData(DataFormats.FileDrop) is not string[] stringArray)
    {
      return null;
    }
    var searchLabel = string.Join(Environment.NewLine, stringArray);
    var bytes = GetStringArrayBytes(stringArray);
    return new()
    {
      Data = bytes,
      RepresentationData = bytes,
      SearchLabel = searchLabel
    };
  }


  public override object? RestoreData(byte[] bytes, string? additionalInfo)
  {
    return GetStringArrayFromBytes(bytes);
  }


  public override object? RestoreRepresentationData(byte[] bytes, string? additionalInfo)
  {
    var data = GetStringArrayFromBytes(bytes);
    return string.Join(Environment.NewLine, data);
  }


  private static byte[] GetStringArrayBytes(string[] data)
  {
    var str = string.Join(";", data);
    return Encoding.UTF8.GetBytes(str);
  }

  private static string[] GetStringArrayFromBytes(byte[] bytes)
  {
    var str = Encoding.UTF8.GetString(bytes);
    return str.Split(";");
  }
}


[Plugin(
  Id = "D2D7663B-39C5-488A-B323-8063963D47F5",
  Name = "Files Plugin",
  Version = "1.0.0",
  Author = "Yevheniy Tymchishin",
  AuthorEmail = "timchishinevgeniy@gmail.com",
  Description = "A simple plugin to deal with the files"
)]
public sealed class FilesPluginModule : PluginModule<File>
{
  protected override ResourceManager? CreateResourceManager()
  {
    return new(typeof(Resources.Translations.Translation));
  }
}
