import React from 'react';

const ConfirmationModal = ({ show, onClose, onConfirm, title, children }) => {
  if (!show) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40"
        onClick={onClose}
      ></div>

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-sm w-full p-6 relative">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>
          <div className="text-gray-700 dark:text-gray-300 mb-6">{children}</div>
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm font-semibold bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              বাতিল
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
            >
              নিশ্চিত করুন
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmationModal;
