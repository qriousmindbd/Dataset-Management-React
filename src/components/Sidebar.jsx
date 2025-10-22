import React from 'react';

const Sidebar = ({ currentSection, setCurrentSection }) => {
  const menuItems = [
    { key: 'input', label: 'ইনপুট ডেটা' },
    { key: 'show', label: 'ডেটা দেখুন' },
    { key: 'viewTables', label: 'ডেটা টেবিল' },
    { key: 'download', label: 'ডেটা ডাউনলোড' },
  ];

  return (
    <div className="w-64 p-6 bg-white border-r border-gray-200 shadow-xl h-screen overflow-y-auto lg:sticky lg:top-0">
      <h1 className="text-3xl font-extrabold text-indigo-700 mb-6">ডেটাসেট ম্যানেজার</h1>
      <nav>
        {menuItems.map(item => (
          <button
            key={item.key}
            onClick={() => setCurrentSection(item.key)}
            className={`w-full text-left py-3 px-4 mb-2 rounded-lg font-semibold ${
              currentSection === item.key
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 hover:bg-indigo-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
