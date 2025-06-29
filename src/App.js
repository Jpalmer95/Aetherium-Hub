import React from 'react';
import './App.css';
import Layout from './components/Layout';
import { AssetProvider } from './context/AssetProvider';

function App() {
  return (
    <AssetProvider>
      <div className="App">
        <header className="App-header">
          <h1>Aetherium Studio Hub</h1>
        </header>
        <main>
          <Layout />
        </main>
      </div>
    </AssetProvider>
  );
}

export default App;
