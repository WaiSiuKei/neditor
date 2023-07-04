export interface IBaseWorkspaceIdentifier {
  /**
   * Every workspace (multi-root, single folder or empty)
   * has a unique identifier. It is not possible to open
   * a workspace with the same `id` in multiple windows
   */
  readonly id: string;
}

export interface IEmptyWorkspaceIdentifier extends IBaseWorkspaceIdentifier {
}

export type IAnyWorkspaceIdentifier = IEmptyWorkspaceIdentifier;
