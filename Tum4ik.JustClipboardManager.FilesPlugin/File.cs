using System;
using System.Text;
using System.Windows;
using Tum4ik.JustClipboardManager.PluginDevKit;
using Tum4ik.JustClipboardManager.PluginDevKit.Attributes;
using Tum4ik.JustClipboardManager.PluginDevKit.Models;

namespace Tum4ik.JustClipboardManager.FilesPlugin;

[Plugin(
  Id = "D2D7663B-39C5-488A-B323-8063963D47F5",
  Name = "Files Plugin",
  Version = "2.0.0",
  Author = "Yevheniy Tymchishin",
  AuthorEmail = "timchishinevgeniy@gmail.com",
  Description = "A simple plugin to deal with the files"
)]
public sealed class File : Plugin<FileVisualTree>
{
  public override string Format { get; } = DataFormats.FileDrop;


  public override ClipData? ProcessData(object data)
  {
    var stringArray = data as string[];
    if (stringArray is null)
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


  public override object RestoreData(byte[] bytes, string dataDotnetType)
  {
    var dataType = Type.GetType(dataDotnetType);
    if (dataType is null)
    {
      return new();
    }

    if (dataType == typeof(string[]))
    {
      return GetStringArrayFromBytes(bytes);
    }

    return new();
  }


  public override object RestoreRepresentationData(byte[] bytes, string dataDotnetType)
  {
    var data = RestoreData(bytes, dataDotnetType);
    if (data is string[] strArr)
    {
      return string.Join(Environment.NewLine, strArr);
    }
    return data;
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


public sealed class FilesPlugin : PluginModule<File> { }
