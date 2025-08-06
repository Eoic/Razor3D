/**
 * Initialize the application.
 */
export function setupApp(): void {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app) {
    app.innerHTML = `
      <h1>TypeScript & Vite starter</h1>
      <div class="card">
        <p>Edit <code>src/main.ts</code> and save to test HMR.</p>
      </div>
    `;
  }

  setupInteractivity();
}

/**
 * Setup interactive features.
 */
function setupInteractivity(): void {
  let count = 0;
  const app = document.querySelector('#app');
  const button = document.createElement('button');
  button.textContent = 'Count: 0';
  button.type = 'button';

  button.addEventListener('click', () => {
    count += 1;
    button.textContent = `Count: ${count.toString()}`;
  });

  if (app) {
    app.appendChild(button);
  }
}
