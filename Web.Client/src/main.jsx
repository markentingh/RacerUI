import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.less';
// Imported as separate programs (not @import'd into index.less) so each
// theme's variables stay scoped to its own file — the gulp pipeline did the
// same by compiling colors/*.less to separate css outputs.
import './styles/colors/light.less';
import './styles/colors/dark.less';

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
