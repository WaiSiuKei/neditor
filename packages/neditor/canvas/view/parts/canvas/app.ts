import { toDisposable } from '../../../../base/common/lifecycle';
import { HTMLSpanElement } from '../../../../engine/dom/html_span_element';
import {
  IBlockNodeViewModel,
  ICanvasViewModel,
  INodeViewModel, IRootNodeViewModel,
  isBlockNodeViewModel,
  isTextNodeViewModel,
  ITextNodeViewModel
} from '../../../viewModel/viewModel';
import { createApp } from './adapter/app';
import { NOTIMPLEMENTED } from '../../../../base/common/notreached';
import { Document } from '../../../../engine/dom/document';
import { NodeType } from '../../../../common/node';
import { AttrNameOfComponentType, AttrNameOfId, AttrNameOfRoot, AttrNameOfScope } from '../../../viewModel/path';

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
  document.documentElement!.appendChild(body);

  Reflect.set(window, 'dumpHTML', () => {
    console.log(document.documentElement!.innerHTML);
  });

  const getComponent = (node: INodeViewModel, scopeChain: string = '') => {
    if (isBlockNodeViewModel(node)) {
      return createBlock(node, scopeChain);
    }
    if (isTextNodeViewModel(node)) {
      return createInline(node, scopeChain);
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

  const createInline = (vm: ITextNodeViewModel, scope = '') => {
    return {
      vm,
      scope,
      nodeType: NodeType.Text,
      $template: () => {
        const el = document.createElement(HTMLSpanElement.kTagName);
        el.setAttribute(`v-bind:${AttrNameOfId}`, 'vm.id');
        el.setAttribute(`v-bind:${AttrNameOfComponentType}`, 'nodeType');
        el.setAttribute(`v-bind:${AttrNameOfScope}`, 'scope');
        el.setAttribute('v-bind:style', 'vm.style');
        el.setAttribute('v-text', 'vm.content');
        return el;
      },
    };
  };

  let app = createApp(createRoot(vm.root.value)).mount(document.body!);
  return toDisposable(() => app.unmount());
}
