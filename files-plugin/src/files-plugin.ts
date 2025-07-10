import { ClipboardDataPlugin, createElement, RepresentationData } from "just-clipboard-manager-pdk";

export class FilesPlugin extends ClipboardDataPlugin {
  private readonly _representationFormats: readonly string[] = ['CF_HDROP'];
  override get representationFormats(): readonly string[] {
    return this._representationFormats;
  }

  private readonly _formatsToSave = ['CF_HDROP'];
  override get formatsToSave(): readonly string[] {
    return this._formatsToSave;
  }

  private readonly decoderUtf16le = new TextDecoder('utf-16le');
  private readonly decoderWindows1252 = new TextDecoder('windows-1252');

  override extractRepresentationData(data: Uint8Array, format: string): { representationData: RepresentationData; searchLabel?: string; } {
    return { representationData: { data } };
  }

  override getRepresentationDataElement(representationData: RepresentationData, format: string, document: Document): HTMLElement {
    const items = this.getItems(representationData.data);

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

  override getFullDataPreviewElement(data: Uint8Array, format: string, document: Document): HTMLElement {
    const items = this.getItems(data);
    const pre = document.createElement('pre');
    pre.textContent = items.join('\n');
    pre.style.textWrap = 'nowrap';
    pre.style.margin = '0';
    return pre;
  }


  private getItems(data: Uint8Array): string[] {
    const dataView = new DataView(data.buffer);
    const pFiles = dataView.getUint32(0, true);
    const fWide = dataView.getUint32(16, true) !== 0;
    const bytes = data.slice(pFiles);
    let decoder: TextDecoder;
    if (fWide) {
      decoder = this.decoderUtf16le;
    }
    else {
      decoder = this.decoderWindows1252;
    }
    const decoded = decoder.decode(bytes);
    return decoded.split('\0').map(i => i.trim()).filter(i => i.length > 0);
  }
}
