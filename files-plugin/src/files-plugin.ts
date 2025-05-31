import { ClipboardDataPlugin, createElement, RepresentationData } from "just-clipboard-manager-pdk";

export class FilesPlugin extends ClipboardDataPlugin {
  private readonly _formats: readonly string[] = ['CF_HDROP'];
  override get formats(): readonly string[] {
    return this._formats;
  }

  override extractRepresentationData(data: Uint8Array, format: string): RepresentationData {
    return { data };
  }

  override getRepresentationDataElement(representationData: RepresentationData, format: string, document: Document): HTMLElement {
    const dataView = new DataView(representationData.data.buffer);
    const pFiles = dataView.getUint32(0, true);
    const fWide = dataView.getUint32(16, true) !== 0;
    const bytes = representationData.data.slice(pFiles);
    let decoder: TextDecoder;
    if (fWide) {
      decoder = new TextDecoder('utf-16le');
    }
    else {
      decoder = new TextDecoder('windows-1252');
    }
    const decoded = decoder.decode(bytes);
    const items = decoded.split('\0').map(i => i.trim()).filter(i => i.length > 0);

    return createElement(document, 'div', {
      style: {
        textWrap: 'nowrap',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
      },
      children: [
        // icon and files counter container
        createElement(document, 'div', {
          style: {
            display: 'flex',
            position: 'relative',
          },
          children: [
            // file icon
            createElement(document, 'span', {
              props: {
                className: 'material-symbols-rounded',
                textContent: 'draft',
              }
            }),
            // files counter
            createElement(document, 'span', {
              props: {
                textContent: items.length > 9 ? '9+' : items.length,
              },
              style: {
                position: 'absolute',
                width: '100%',
                fontSize: '10px',
                top: '6px',
                left: items.length > 9 ? '1px' : '0px',
              }
            })
          ]
        }),
        // first file path
        createElement(document, 'span', {
          props: {
            textContent: items[0] || 'File(s)'
          },
          style: {
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }
        })
      ]
    });
  }

  override getSearchLabel(data: Uint8Array, format: string): string | null {
    return null;
  }
}
