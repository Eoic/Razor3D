import type { TemplateResult } from 'lit-html';
import { render } from 'lit-html';

import type { Disposable } from '@/types/disposable';

export { html, render } from 'lit-html';
export { repeat } from 'lit-html/directives/repeat.js';

export interface StateSource {
  onChange(callback: (...args: unknown[]) => void): () => void;
}

export function renderTo(
  container: HTMLElement,
  stateSource: StateSource,
  templateFn: () => TemplateResult
): Disposable {
  const update = () => {
    render(templateFn(), container);
  };

  const unsubscribe = stateSource.onChange(update);
  update();

  return {
    dispose() {
      unsubscribe();
    },
  };
}
