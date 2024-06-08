import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import ReactComponent from './ReactComponent';
import MTG from './MTG';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ReactComponent />} />
          <Route path="/react" element={<ReactComponent />} />
          <Route path="/mtg" element={<MTG />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
