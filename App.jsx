import React from 'react';
import RootNavigation from './src/navigation/RootNavigation';
import { AppProvider } from './src/context/AppContext';

const App = () => {
  return (
    <AppProvider>
      <RootNavigation />
    </AppProvider>
  );
};

export default App;
