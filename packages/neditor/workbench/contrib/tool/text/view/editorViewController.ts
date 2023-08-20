import { IKeyboardEvent } from '../../../../../base/browser/keyboardEvent';
import { OS } from '../../../../../base/browser/platform';
import { DCHECK } from '../../../../../base/check';
import { memoize } from '../../../../../base/common/decorators';
import { createSimpleKeybinding, KeyCode } from '../../../../../base/common/keyCodes';
import { Disposable, toDisposable } from '../../../../../base/common/lifecycle';
import { NOTIMPLEMENTED } from '../../../../../base/common/notreached';
import { ICanvas } from '../../../../../canvas/canvas/canvas';
import { ICommandService } from '../../../../../platform/commands/common/commands';
import { CommandService } from '../../../../../platform/commands/common/commandService';
import { IContextKeyService, IContextKeyServiceTarget } from '../../../../../platform/contextkey/common/contextkey';
import { SyncDescriptor } from '../../../../../platform/instantiation/common/descriptors';
import { IInstantiationService } from '../../../../../platform/instantiation/common/instantiation';
import { ServiceCollection } from '../../../../../platform/instantiation/common/serviceCollection';
import { IKeybindingService } from '../../../../../platform/keybinding/common/keybinding';
import { DescendantModelProxy } from '../../../../../platform/model/common/model';
import { IToolService } from '../../../../../platform/tool/common/tool';
import { Editor, Operation, Range, Text, TextOperation, Transforms } from '../editor';
import { TextTransforms } from '../editor/interfaces/transforms/text';
import { EditorInterface } from './editorInterface';
import { LineFeed } from './common';
import { ITextEditorService, TextEditorKeybindingService, TextEditorService } from './platform';
import './commands';

const EscKeybinding = createSimpleKeybinding(KeyCode.Escape, OS);

export class EditorViewController extends Disposable {
  _contextKeyService: IContextKeyService;
  _instantiationService: IInstantiationService;
  constructor(
    private editor: EditorInterface,
    private canvas: ICanvas,
    private onEsc: () => void,
    @IInstantiationService instantiationService: IInstantiationService,
    @IContextKeyService contextKeyService: IContextKeyService,
  ) {
    super();
    this._registerDOMEvent();
    const serviceCollection = new ServiceCollection();
    const textEditorService = new TextEditorService();
    textEditorService.addEditor(editor.state);

    this._contextKeyService = this._register(contextKeyService.createScoped(this.editor.state.el as IContextKeyServiceTarget));
    serviceCollection.set(ITextEditorService, textEditorService);
    serviceCollection.set(IKeybindingService, new SyncDescriptor(TextEditorKeybindingService));
    serviceCollection.set(IContextKeyService, this._contextKeyService);
    serviceCollection.set(ICommandService, new SyncDescriptor(CommandService));
    this._instantiationService = instantiationService.createChild(serviceCollection);
    this._registerEditorEvent();
    // 处理初始的 selection 状态
    this._onDOMSelectionChange();
  }

  @memoize
  private get _keybindingService(): IKeybindingService {
    return this._instantiationService.invokeFunction((accessor) => {
      return accessor.get<IKeybindingService>(IKeybindingService);
    });
  }

  //#region keybinding handlers
  private _exit() {
    this.onEsc();
    this.canvas.view.document.getSelection().removeAllRanges();
    this.canvas.invokeWithinContext(accessor => {
      const toolService = accessor.get<IToolService>(IToolService);
      toolService.switchDefault();
    });
  }
  //#endregion

  //#region register event
  private _registerDOMEvent() {
    const selection = this.canvas.view.document.getSelection();
    this._register(selection.onDidChange(() => this._onDOMSelectionChange()));
  }

  private _onDOMSelectionChange() {
    const domSelection = this.canvas.view.document.getSelection();
    if (domSelection.anchorNode) {
      const range = this.editor.toSlateRange(domSelection, {
        exactMatch: false,
        suppressThrow: true,
      });

      DCHECK(range);
      Transforms.select(this.editor.state, range);
    } else {
      Transforms.deselect(this.editor.state);
    }
  }

  private _registerEditorEvent() {
    this.editor.state.onChange = (options?: { operation?: Operation }) => {
      if (!options) NOTIMPLEMENTED();
      const { operation } = options;
      if (!operation) NOTIMPLEMENTED();
      if (Operation.isSelectionOperation(operation)) {
        return this.syncSelectionToDOM();
      }
      if (Operation.isNodeOperation(operation)) {
        /**
         * 在 splitNode、mergeNode 之后，selection 可能不变但是 inline span 渲染位置可能改变
         */
        this.syncSelectionToDOM(true);
      }
      if (Operation.isTextOperation(operation)) {
        /**
         * compositionType 的时候
         * step1 输入「a」，编辑器插入「a」，候选的有「啊...」等汉字
         * step2 按空格，这时选中了第一个，即「啊」
         * 这时 selection 不变，最后的字符从「a」变为 「啊」，光标位置变了，所以要强制刷一下
         */
        this.syncSelectionToDOM(true);
      }
      // console.log('op', performance.now(), options?.operation?.type, options?.operation);
      // console.log('selection', JSON.stringify(this.editor.selection));
    };
    this._register(toDisposable(() => this.editor.state.onChange = () => {}));
  }
  //#endregion

  //#region editor operations
  syncSelectionToDOM(force = false) {
    const rangeOfSlate = this.editor.selection;
    DCHECK(rangeOfSlate);

    const domSelection = this.canvas.view.document.getSelection();
    /**
     * 修改了 slate 的设计
     * 原本 slate 会在 splitNode 之后保留空的 inline，所以下面的代码会查到 range
     * 现在去掉空的 textNode 之后，下面会查不到
     * 遇到这种情况肯定需要刷新
     */
    const rangeOfDOM = this.editor.toSlateRange(domSelection, {
      exactMatch: false,
      suppressThrow: true,
    });
    if (!rangeOfDOM || !Range.equals(rangeOfSlate, rangeOfDOM) || force) {
      const { anchor, focus } = rangeOfSlate;
      const anchorP = this.editor.root.children[anchor.path[0]] as DescendantModelProxy;
      DCHECK(anchorP.isBlock());
      const anchorSpan = anchorP.children[anchor.path[1]];
      DCHECK(anchorSpan.isText());

      const focusP = this.editor.root.children[focus.path[0]] as DescendantModelProxy;
      DCHECK(focusP.isBlock());
      const focusSpan = focusP.children[focus.path[1]];
      DCHECK(focusSpan.isText());

      const document = this.canvas.view.document;
      const anchorEl = document.getElementById(anchorSpan.id);
      DCHECK(anchorEl);
      const focusEl = document.getElementById(focusSpan.id);
      DCHECK(focusEl);

      const selection = document.getSelection();
      const range = document.createRange();
      // while (!anchorEl.firstChild) {
      //   // 空 span，需要跳过
      //   anchorEl = anchorEl.nextElementSibling;
      //   DCHECK(anchorEl);
      // }
      // while (!focusEl.firstChild) {
      //   // 空 span，需要跳过
      //   focusEl = focusEl.nextElementSibling;
      //   DCHECK(focusEl);
      // }
      range.setStart(anchorEl.firstChild!, anchor.offset);
      range.setEnd(focusEl.firstChild!, focus.offset);
      selection.addRange(range);
    }
  }
  //#endregion

  //#region DOM events
  public type(text: string): void {
    DCHECK(text !== LineFeed);
    this.canvas.transform(() => {
      Editor.deleteFragment(this.editor.state);
      TextTransforms.insertText(this.editor.state, text);
    });
  }

  public compositionType(text: string, replacePrevCharCnt: number, replaceNextCharCnt: number, positionDelta: number): void {
    DCHECK(!replaceNextCharCnt);
    DCHECK(!positionDelta);
    this.canvas.transform(() => {
      TextTransforms.delete(this.editor.state, { unit: 'character', distance: replacePrevCharCnt, reverse: true });
      TextTransforms.insertText(this.editor.state, text);
    });
  }

  public compositionStart(): void {
  }

  public compositionEnd(): void {
  }

  public keyDown(event: IKeyboardEvent): void {
    const keybinding = event.toKeybinding();
    if (keybinding.equals(EscKeybinding)) {
      this.onEsc();
      return;
    }
    this._keybindingService.dispatchEvent(event, this.editor.el as IContextKeyServiceTarget);
  };

  public focus() {
    // console.log('focus');
  }

  public blur() {
    // console.log('blur');
    // this._handleEsc();
  }
  //#endregion
}
