export const userAgent = navigator.userAgent;

export const enum Platform {
  Web,
  Mac,
  Linux,
  Windows
}

export function PlatformToString(platform: Platform) {
  switch (platform) {
    case Platform.Web:
      return 'Web';
    case Platform.Mac:
      return 'Mac';
    case Platform.Linux:
      return 'Linux';
    case Platform.Windows:
      return 'Windows';
  }
}

export const isWindows = userAgent.indexOf('Windows') >= 0;
export const isMacintosh = userAgent.indexOf('Macintosh') >= 0;
export const isLinux = userAgent.indexOf('Linux') >= 0;

export const isFirefox = (userAgent.indexOf('Firefox') >= 0);
export const isWebKit = (userAgent.indexOf('AppleWebKit') >= 0);
export const isChrome = (userAgent.indexOf('Chrome') >= 0);
export const isSafari = (!isChrome && (userAgent.indexOf('Safari') >= 0));
export const isIPad = (userAgent.indexOf('iPad') >= 0 || (isSafari && navigator.maxTouchPoints > 0));
export const isEdgeLegacyWebView = (userAgent.indexOf('Edge/') >= 0) && (userAgent.indexOf('WebView/') >= 0);
export const isElectron = (userAgent.indexOf('Electron/') >= 0);
export const isAndroid = (userAgent.indexOf('Android') >= 0);

export const enum OperatingSystem {
  Windows = 1,
  Macintosh = 2,
  Linux = 3
}

export const OS = (isMacintosh ? OperatingSystem.Macintosh : (isWindows ? OperatingSystem.Windows : OperatingSystem.Linux));
