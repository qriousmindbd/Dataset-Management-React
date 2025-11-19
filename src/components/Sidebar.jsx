import React from 'react';

const Sidebar = ({ currentSection, setCurrentSection, darkMode, setDarkMode, isOpen, setIsOpen }) => {
  const menuItems = [
    { key: 'input', label: 'ইনপুট ডেটা' },
    { key: 'show', label: 'ডেটা দেখুন' },
    { key: 'viewTables', label: 'ডেটা টেবিল' },
    { key: 'download', label: 'ডেটা ডাউনলোড' },
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
        className={`w-64 p-4 lg:p-6 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl h-screen overflow-y-auto lg:sticky lg:top-0 transition-colors duration-300
          ${isOpen ? 'fixed inset-y-0 left-0 z-50 block' : 'hidden lg:block'}`}
        aria-label="Sidebar"
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between mb-4 lg:mb-6">
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
            <button
              key={item.key}
              onClick={() => { setCurrentSection(item.key); closeMobile(); }}
              className={`w-full text-left py-3 px-4 mb-2 rounded-lg font-semibold transition-colors ${
                currentSection === item.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 lg:mt-8">
          <button
            onClick={() => {
              console.log('Toggle Dark Mode:', !darkMode);
              setDarkMode(!darkMode);
            }}
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
