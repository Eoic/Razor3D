import { mountApp } from '@/app/mountApp';
import '../styles/main.scss';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('Missing #app root');
}

const app = mountApp(root);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.dispose();
  });
}
