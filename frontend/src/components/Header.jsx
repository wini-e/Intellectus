import React from 'react';
import logo from '../assets/Intellectus.png';

function Header() {
  return (
    <header className="app-header">
      <img src={logo} alt="Intellectus Logo" className="app-logo" />
    </header>
  );
}

export default Header;