import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ darkMode, setDarkMode, isOpen, setIsOpen }) => {
  const menuItems = [
    { key: 'upload', label: 'ডেটা আপলোড', path: '/upload', icon: 'bi-upload' },
    { key: 'input', label: 'ইনপুট ডেটা', path: '/', icon: 'bi-keyboard' },
    { key: 'show', label: 'ডেটা দেখুন', path: '/show', icon: 'bi-eye' },
    { key: 'viewTables', label: 'ডেটা টেবিল', path: '/tables', icon: 'bi-table' },
    { key: 'download', label: 'ডেটা ডাউনলোড', path: '/download', icon: 'bi-download' },
  ];

  // Mobile overlay close
  const closeMobile = () => setIsOpen && setIsOpen(false);

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 p-4 lg:p-6 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl h-screen overflow-y-auto fixed top-0 transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center">
            <span className="text-2xl">🗃️</span>
            <h1 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 ml-2">ডাটাসেট ক্রিয়েটর</h1>
          </div>
          {isOpen && (
            <button
              onClick={closeMobile}
              aria-label="Close sidebar"
              className="lg:hidden p-1 rounded bg-transparent text-gray-700 dark:text-gray-200"
            >
              <i className="bi bi-x-lg text-xl"></i>
            </button>
          )}
        </div>

        <nav>
          {menuItems.map(item => (
            <NavLink
              key={item.key}
              to={item.path}
              onClick={closeMobile}
              className={({ isActive }) =>
                `w-full text-left py-3 px-4 mb-2 rounded-lg font-semibold transition-colors flex items-center ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-700'
                }`
              }
            >
              <i className={`bi ${item.icon} mr-3`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 lg:mt-8">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:scale-105 transition-transform"
          >
            {darkMode ? '☀️ লাইট মোড' : '🌙 ডার্ক মোড'}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
