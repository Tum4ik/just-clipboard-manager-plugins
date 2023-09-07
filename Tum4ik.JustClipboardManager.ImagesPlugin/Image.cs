using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Windows;
using System.Windows.Media.Imaging;
using Tum4ik.JustClipboardManager.PluginDevKit;
using Tum4ik.JustClipboardManager.PluginDevKit.Attributes;
using Tum4ik.JustClipboardManager.PluginDevKit.Models;

namespace Tum4ik.JustClipboardManager.ImagesPlugin;

[Plugin(
  Id = "F4B1D3C8-8A70-4F29-A5C6-940510A9FA5D",
  Name = "Images Plugin",
  Version = "2.0.0",
  Author = "Yevheniy Tymchishin",
  AuthorEmail = "timchishinevgeniy@gmail.com",
  Description = "A simple plugin to deal with the images"
)]
public sealed class Image : Plugin<ImageVisualTree>
{
  public override string Format { get; } = DataFormats.Bitmap;


  public override ClipData? ProcessData(object data)
  {
    var bytes = data switch
    {
      BitmapSource d => GetBitmapSourceBytes(d),
      Bitmap d => GetBitmapBytes(d),
      _ => null
    };
    if (bytes is null)
    {
      return null;
    }
    return new()
    {
      Data = bytes,
      RepresentationData = bytes
    };
  }


  public override object RestoreData(byte[] bytes, string dataDotnetType)
  {
    var dataType = Type.GetType(dataDotnetType);
    if (dataType is null)
    {
      return new();
    }

    if (dataType.IsAssignableTo(typeof(BitmapSource)))
    {
      return GetBitmapSourceFromBytes(bytes);
    }
    if (dataType.IsAssignableTo(typeof(Bitmap)))
    {
      return GetBitmapFromBytes(bytes);
    }

    return new();
  }


  public override object RestoreRepresentationData(byte[] bytes, string dataDotnetType)
  {
    return RestoreData(bytes, dataDotnetType);
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


  private static BitmapSource GetBitmapSourceFromBytes(byte[] bytes)
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


public sealed class ImagesPlugin : PluginModule<Image> { }
