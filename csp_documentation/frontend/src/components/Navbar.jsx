import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../assets/slickbitLogo.png';
import WhiteLogo from '../assets/Slickbit-logo-white-bg.png';

function Navbar() {
  return (
    <nav className="bg-[#0098B3] text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <img src={WhiteLogo} alt="logo" height={50} width={150}/>
          {/* <img src={Logo} alt="logo" height={50} width={100}/> */}
        </div>

        <div className="flex items-center space-x-2">
          {/* <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
          </svg> */}
          <NavLink to="/" className="text-xl font-medium" >
            Meta-Doc Automator
          </NavLink>
        </div>
        
        <div className="flex space-x-6" style={{display:'flex', alignItems:'center'}}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'bg-[#007A92] px-3 py-1 rounded hover:text-gray-200' : 'hover:text-gray-200'
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/documents"
            className={({ isActive }) =>
              isActive ? 'bg-[#007A92] px-3 py-1 rounded hover:text-gray-200' : 'hover:text-gray-200'
            }
          >
            Documents
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? 'bg-[#007A92] px-3 py-1 rounded hover:text-gray-200' : 'hover:text-gray-200'
            }
          >
            Settings
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;