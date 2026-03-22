import { describe, expect, it } from 'vitest';

import { html, renderTo } from '@/ui/html';

function createMockStateSource() {
  const listeners = new Set<(...args: unknown[]) => void>();

  return {
    onChange(callback: (...args: unknown[]) => void) {
      listeners.add(callback);

      return () => {
        listeners.delete(callback);
      };
    },
    notify() {
      for (const listener of listeners) {
        listener();
      }
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

describe('renderTo', () => {
  it('renders the template immediately', () => {
    const container = document.createElement('div');
    const source = createMockStateSource();
    let count = 0;

    renderTo(container, source, () => {
      count++;
      return html`<p>hello</p>`;
    });

    expect(count).toBe(1);
    expect(container.querySelector('p')?.textContent).toBe('hello');
  });

  it('re-renders when the state source notifies', () => {
    const container = document.createElement('div');
    const source = createMockStateSource();
    let value = 'first';

    renderTo(container, source, () => html`<p>${value}</p>`);

    expect(container.querySelector('p')?.textContent).toBe('first');

    value = 'second';
    source.notify();

    expect(container.querySelector('p')?.textContent).toBe('second');
  });

  it('unsubscribes on dispose', () => {
    const container = document.createElement('div');
    const source = createMockStateSource();

    const result = renderTo(container, source, () => html`<p>test</p>`);

    expect(source.listenerCount).toBe(1);

    result.dispose();

    expect(source.listenerCount).toBe(0);
  });
});
