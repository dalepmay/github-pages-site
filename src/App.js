import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './Components/Navbar';
import Home from './Pages/Home';
import MTG from './Pages/MTG';
import Ncl from './Pages/NCL';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="mt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/mtg" element={<MTG />} />
          <Route path="/ncl" element={<Ncl />} />
        </Routes>
      </div>
  </Router>
  );
}

export default App;