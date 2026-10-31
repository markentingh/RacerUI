import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './context/theme';
import { SessionProvider } from './context/session';
import { ScaleProvider } from './context/scale';
import SvgAssets from './components/ui/SvgAssets';
import Routing from './routes/routing';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScaleProvider>
          <SessionProvider>
            <SvgAssets />
            <Routing />
          </SessionProvider>
        </ScaleProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
