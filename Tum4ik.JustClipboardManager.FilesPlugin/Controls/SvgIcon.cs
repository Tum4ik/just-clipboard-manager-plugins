using Tum4ik.JustClipboardManager.PluginDevKit.Attributes;
using Tum4ik.JustClipboardManager.PluginDevKit.Icons;

namespace Tum4ik.JustClipboardManager.FilesPlugin.Controls;

public class SvgIcon : SvgIcon<SvgIconType>
{
  protected override string IconsFolder { get; } = "Resources/Icons";
}


public enum SvgIconType
{
  [SvgIconResource("files")] Files
}
