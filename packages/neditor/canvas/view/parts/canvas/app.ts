import { toDisposable } from '../../../../base/common/lifecycle';
import {
  IBlockNodeViewModel,
  ICanvasViewModel,
  INodeViewModel, IRootNodeViewModel,
  isIBlockNodeViewModel,
  isITextNodeViewModel,
  ITextNodeViewModel
} from '../../../viewModel/viewModel';
import { createApp } from './adapter/app';
import { NOTIMPLEMENTED } from '../../../../base/common/notreached';
import { Document } from '../../../../engine/dom/document';
import { NodeType } from '../../../../common/node';
import { HTMLParagraphElement } from '../../../../engine/dom/html_paragraph_element';
import { AttrNameOfComponentType, AttrNameOfId, AttrNameOfRoot, AttrNameOfScope } from '../../../viewModel/path';
import { Optional } from "../../../../base/common/typescript";
import { HTMLElement } from "../../../../engine/dom/html_element";
import { DCHECK_EQ } from "../../../../base/check_op";

export function mountAPP(vm: ICanvasViewModel, document: Document) {
  const body = document.createElement('body');
  Object.assign(body.style, {
    display: 'block',
    position: 'relative'
  } as CSSStyleDeclaration);
  const component = document.createElement('div');
  component.setAttribute('v-for', 'child in vm.children');
  component.setAttribute('v-scope', 'getComponent(child)');
  component.setAttribute('v-bind:key', 'child.id');
  body.appendChild(component);
  body.setAttribute(AttrNameOfId, vm.root.value.id);
  document.html()?.appendChild(body);

  Reflect.set(window, 'test', () => {
    console.log(document.html()?.inner_html());
  });

  const getComponent = (node: INodeViewModel, scopeChain: string = '') => {
    if (isIBlockNodeViewModel(node)) {
      return createBlock(node, scopeChain);
    }
    if (isITextNodeViewModel(node)) {
      return createParagraph(node, scopeChain);
    }
    NOTIMPLEMENTED();
  };

  const createRoot = (vm: IRootNodeViewModel) => {
    return {
      vm,
      getComponent
    };
  };

  const createBlock = (vm: IBlockNodeViewModel, scope = '') => {
    const scopeOfChild = vm.isFragmentPlaceholder ? `${scope}/${vm.id}` : scope;
    return {
      vm,
      scope,
      scopeOfChild,
      $template: () => {
        const div = document.createElement('div');
        div.setAttribute(`v-bind:${AttrNameOfId}`, 'vm.id');
        div.setAttribute(`v-bind:${AttrNameOfComponentType}`, 'vm.type');
        div.setAttribute(`v-bind:${AttrNameOfScope}`, 'scope');
        div.setAttribute(`v-bind:${AttrNameOfRoot}`, 'vm.fragment ? vm.fragment.id : ""');
        div.setAttribute('v-bind:style', 'vm.style');
        const component = document.createElement('div');
        component.setAttribute('v-for', 'child in vm.children');
        component.setAttribute('v-scope', 'getComponent(child, scopeOfChild)');
        component.setAttribute('v-bind:key', 'child.id');
        div.appendChild(component);
        return div;
      },
      getComponent
    };
  };

  const createParagraph = (vm: ITextNodeViewModel, scope = '') => {
    return {
      vm,
      scope,
      nodeType: NodeType.Text,
      $template: (reuse: Optional<HTMLElement>) => {
        if (reuse) {
          DCHECK_EQ(reuse.tagName, HTMLParagraphElement.kTagName)
        }
        const p = reuse || document.createElement(HTMLParagraphElement.kTagName);
        // p.setAttribute(AttrNameOfId, vm.id);
        // p.setAttribute(VirtualDOMTypeKey, NodeType.Text);
        // p.setAttribute(AttrNameOfScope, scope || "")
        p.setAttribute(`v-bind:${AttrNameOfId}`, 'vm.id');
        p.setAttribute(`v-bind:${AttrNameOfComponentType}`, 'nodeType');
        p.setAttribute(`v-bind:${AttrNameOfScope}`, 'scope');
        p.setAttribute('v-bind:style', 'vm.style');
        p.setAttribute('v-text', 'vm.content');
        return p;
      },
    };
  };

  let app = createApp(createRoot(vm.root.value)).mount(document.body()!);
  return toDisposable(() => app.unmount());
}
