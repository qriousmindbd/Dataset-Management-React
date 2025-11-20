import React from 'react';

const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"
        onClick={onClose}
      ></div>

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-2xl"
          >
            ×
          </button>
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">{title}</h2>
          <div className="text-gray-700 dark:text-gray-300">{children}</div>
        </div>
      </div>
    </>
  );
};

export default Modal;
