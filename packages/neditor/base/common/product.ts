export interface IProductConfiguration {
  readonly version: string;
  readonly date?: string;
  readonly quality?: string;
  readonly commit?: string;

  readonly nameShort: string;
  readonly nameLong: string;

  // readonly win32AppUserModelId?: string;
  // readonly win32MutexName?: string;
  // readonly applicationName: string;
  // readonly embedderIdentifier?: string;
  //
  readonly urlProtocol: string;
  // readonly dataFolderName: string; // location for extensions (e.g. ~/.vscode-insiders)

  // readonly downloadUrl?: string;
  // readonly updateUrl?: string;
  // readonly webEndpointUrlTemplate?: string;
  // readonly webviewContentExternalBaseUrlTemplate?: string;
  // readonly target?: string;
  //
  // readonly settingsSearchBuildId?: number;
  // readonly settingsSearchUrl?: string;
  //
  // readonly checksums?: { [path: string]: string };
  // readonly checksumFailMoreInfoUrl?: string;
  //
  // readonly portable?: string;

  // readonly darwinUniversalAssetId?: string;
}
