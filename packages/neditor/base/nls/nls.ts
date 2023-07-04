export interface LocalizeInfo {
  key: string;
  comment: string[];
}

const _isPseudo = false;

function format(message: string, args: any[]): string {
  let result: string;

  if (_isPseudo) {
    // FF3B and FF3D is the Unicode zenkaku representation for [ and ]
    message = '\uFF3B' + message.replace(/[aouei]/g, '$&$&') + '\uFF3D';
  }

  if (args.length === 0) {
    result = message;
  } else {
    result = message.replace(/\{(\d+)\}/g, (match, rest) => {
      const index = rest[0];
      return typeof args[index] !== 'undefined' ? args[index] : match;
    });
  }
  return result;
}

export function localize(key: string | LocalizeInfo, message: string, ...args: any[]): string {
  return format(message, args);
}

const nls = {
  localize,
};

export default nls;
