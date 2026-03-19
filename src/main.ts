import { mountSlicerApp } from '@/app/mountSlicerApp';
import '../styles/main.scss';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('Missing #app root');
}

const app = mountSlicerApp(root);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.dispose();
  });
}
