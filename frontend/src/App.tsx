import React, { useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { LandingPage } from './components/LandingPage';
import './App.css';

function App() {
  const [hasStarted, setHasStarted] = useState(false);

  if (!hasStarted) {
    return (
      <div className="App App--full">
        <LandingPage onStart={() => setHasStarted(true)} />
      </div>
    );
  }

  return (
    <div className="App">
      <GameBoard />
    </div>
  );
}

export default App;


