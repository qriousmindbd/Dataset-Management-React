import React from 'react';

const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;

  return (
    <>
      {/* Background overlay with blur */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-lg max-w-md w-full p-6 relative">
          <h2 className="text-xl font-bold mb-4">{title}</h2>
          <div className="mb-6 text-gray-700 dark:text-gray-200">{children}</div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-300 text-2xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
          <button
            onClick={onClose}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </>
  );
};

export default Modal;