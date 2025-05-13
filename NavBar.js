import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const NavBar = ({ theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Tema renkleri
  const themeColors = {
    default: {
      bg: 'bg-gradient-to-r from-green-500 to-teal-600',
      text: 'text-white',
      hover: 'hover:bg-teal-600',
      mobileMenu: 'bg-teal-600',
    },
    dark: {
      bg: 'bg-gray-800',
      text: 'text-white',
      hover: 'hover:bg-gray-700',
      mobileMenu: 'bg-gray-700',
    },
    sunset: {
      bg: 'bg-gradient-to-r from-orange-500 to-pink-600',
      text: 'text-white',
      hover: 'hover:bg-pink-600',
      mobileMenu: 'bg-pink-600',
    },
  };

  const currentTheme = themeColors[theme] || themeColors.default;

  return (
    <nav className={`${currentTheme.bg} ${currentTheme.text} shadow-lg`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            {/* Logo */}
            <div>
              <Link href="/" className="flex items-center py-5 px-2 text-white">
                <span className="font-bold text-xl">Music Assistant</span>
              </Link>
            </div>

            {/* Primary Nav */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className={`py-5 px-3 ${currentTheme.text} ${currentTheme.hover} rounded transition ${router.pathname === '/' ? 'font-semibold' : ''}`}
              >
                Ana Sayfa
              </Link>
              <Link
                href="/search"
                className={`py-5 px-3 ${currentTheme.text} ${currentTheme.hover} rounded transition ${router.pathname === '/search' ? 'font-semibold' : ''}`}
              >
                Arama
              </Link>
              <Link
                href="/ai-chat"
                className={`py-5 px-3 ${currentTheme.text} ${currentTheme.hover} rounded flex items-center space-x-1 transition ${router.pathname === '/ai-chat' ? 'font-semibold' : ''}`}
              >
                <span>AI Asistan</span>
                <span className="px-1.5 py-0.5 text-xs bg-white text-teal-700 rounded-full">
                  Yeni
                </span>
              </Link>
              <Link
                href="/library"
                className={`py-5 px-3 ${currentTheme.text} ${currentTheme.hover} rounded transition ${router.pathname === '/library' ? 'font-semibold' : ''}`}
              >
                Kütüphane
              </Link>
            </div>
          </div>

          {/* Mobile Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="mobile-menu-button">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} ${currentTheme.mobileMenu}`}>
        <Link
          href="/"
          className={`block py-2 px-4 ${currentTheme.text} ${router.pathname === '/' ? 'font-semibold' : ''}`}
          onClick={() => setIsOpen(false)}
        >
          Ana Sayfa
        </Link>
        <Link
          href="/search"
          className={`block py-2 px-4 ${currentTheme.text} ${router.pathname === '/search' ? 'font-semibold' : ''}`}
          onClick={() => setIsOpen(false)}
        >
          Arama
        </Link>
        <Link
          href="/ai-chat"
          className={`block py-2 px-4 ${currentTheme.text} ${router.pathname === '/ai-chat' ? 'font-semibold' : ''} flex items-center`}
          onClick={() => setIsOpen(false)}
        >
          <span>AI Asistan</span>
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-white text-teal-700 rounded-full">
            Yeni
          </span>
        </Link>
        <Link
          href="/library"
          className={`block py-2 px-4 ${currentTheme.text} ${router.pathname === '/library' ? 'font-semibold' : ''}`}
          onClick={() => setIsOpen(false)}
        >
          Kütüphane
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
