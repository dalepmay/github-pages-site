import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-gray-800 py-1 fixed top-0 left-0 w-full z-10">
      <ul className="flex justify-center space-x-4">
        <li>
          <Link to="/" className="text-white hover:underline">Home</Link>
        </li>
        {/* <li>
          <Link to="/react" className="text-white hover:underline">React</Link>
        </li> */}
        <li>
          <Link to="/mtg" className="text-white hover:underline">MTG</Link>
        </li>
        <li>
          <Link to="/ncl" className="text-white hover:underline">NCL</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;