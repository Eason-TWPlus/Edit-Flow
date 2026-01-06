
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log('EditFlow 正在初始化...');

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('找不到 #root 元素，無法渲染應用程式。');
}
