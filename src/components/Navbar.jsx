import React from 'react';

const Navbar = ({ toggleSidebar }) => {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-2xl">🗃️</span>
            <h1 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 ml-2">ডাটাসেট ক্রিয়েটর</h1>
          </div>
          <div className="lg:hidden">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-label="Open sidebar"
            >
              <i className="bi bi-list text-2xl"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
