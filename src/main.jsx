// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { getStoredTheme, applyTheme } from './utils/theme';

// Applied before the first render so there's no flash of the default gold
// theme before switching to whatever the person picked last time.
applyTheme(getStoredTheme());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
