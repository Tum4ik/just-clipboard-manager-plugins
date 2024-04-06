using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Media.Imaging;
using Prism.Modularity;
using Tum4ik.JustClipboardManager.ImagesPlugin.Models;
using Tum4ik.JustClipboardManager.PluginDevKit;
using Tum4ik.JustClipboardManager.PluginDevKit.Attributes;
using Tum4ik.JustClipboardManager.PluginDevKit.Models;

namespace Tum4ik.JustClipboardManager.ImagesPlugin;

[Plugin(
  Id = PluginId,
  Name = "Images Plugin",
  Version = "2.0.0",
  Author = "Yevheniy Tymchishin",
  AuthorEmail = "timchishinevgeniy@gmail.com",
  Description = "A simple plugin to deal with the images"
)]
public sealed class Image : Plugin<ImageVisualTree>
{
  internal const string PluginId = "F4B1D3C8-8A70-4F29-A5C6-940510A9FA5D";

  public override IReadOnlyCollection<string> Formats { get; } = new[] { DataFormats.Bitmap };


  public override ClipData? ProcessData(IDataObject dataObject)
  {
    ArgumentNullException.ThrowIfNull(dataObject);

    byte[]? bytes;
    string assemblyQualifiedName;
    if (dataObject.GetDataPresent("{526385E6-2B32-42CC-9689-E0EF8FA0A5D3}"))
    {
      // Snagit issue: in some reason if gets data for "Bitmap" - the alpha channel is always zero.
      // So we have to get data for typeof(Bitmap) in this special case.
      var data = (Bitmap) dataObject.GetData(typeof(Bitmap));
      bytes = GetBitmapBytes(data);
      assemblyQualifiedName = data.GetType().AssemblyQualifiedName!;
    }
    else
    {
      var data = dataObject.GetData(DataFormats.Bitmap);
      bytes = data switch
      {
        BitmapSource d => GetBitmapSourceBytes(d),
        Bitmap d => GetBitmapBytes(d),
        _ => null
      };
      assemblyQualifiedName = data.GetType().AssemblyQualifiedName!;
    }

    if (bytes is null)
    {
      return null;
    }
    return new()
    {
      Data = bytes,
      RepresentationData = bytes,
      AdditionalInfo = JsonSerializer.Serialize(new AdditionalInfo { AssemblyQualifiedName = assemblyQualifiedName })
    };
  }


  public override object? RestoreData(byte[] bytes, string? additionalInfo)
  {
    if (additionalInfo is null)
    {
      return null;
    }
    var info = JsonSerializer.Deserialize<AdditionalInfo>(additionalInfo);
    if (info is null)
    {
      return null;
    }
    var dataType = Type.GetType(info.AssemblyQualifiedName);
    if (dataType is null)
    {
      return null;
    }

    if (dataType.IsAssignableTo(typeof(BitmapSource)))
    {
      return GetBitmapSourceFromBytes(bytes);
    }
    if (dataType.IsAssignableTo(typeof(Bitmap)))
    {
      return GetBitmapFromBytes(bytes);
    }

    return null;
  }


  public override object? RestoreRepresentationData(byte[] bytes, string? additionalInfo)
  {
    return GetBitmapSourceFromBytes(bytes);
  }


  private static byte[] GetBitmapSourceBytes(BitmapSource data)
  {
    using var memoryStream = new MemoryStream();
    var bitmapEncoder = new PngBitmapEncoder();
    bitmapEncoder.Frames.Add(BitmapFrame.Create(data));
    bitmapEncoder.Save(memoryStream);
    return memoryStream.ToArray();
  }

  private static byte[] GetBitmapBytes(Bitmap data)
  {
    using var memoryStream = new MemoryStream();
    data.Save(memoryStream, ImageFormat.Png);
    return memoryStream.ToArray();
  }


  private static BitmapFrame GetBitmapSourceFromBytes(byte[] bytes)
  {
    using var memoryStream = new MemoryStream(bytes);
    return BitmapFrame.Create(memoryStream, BitmapCreateOptions.PreservePixelFormat, BitmapCacheOption.OnLoad);
  }

  private static Bitmap GetBitmapFromBytes(byte[] bytes)
  {
    using var memoryStream = new MemoryStream(bytes);
    return new(memoryStream);
  }
}


[Module(ModuleName = Image.PluginId)]
public sealed class ImagesPlugin : PluginModule<Image> { }
