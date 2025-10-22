import React from "react";

const HelpModal = ({ show, onClose, title, steps }) => {
  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-xl text-gray-600 hover:text-black"
          >
            ×
          </button>

          <h2 className="text-lg font-bold text-indigo-700 mb-4">{title}</h2>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
            {steps.map((step, index) => (
              <li key={index} dangerouslySetInnerHTML={{ __html: step }} />
            ))}
          </ol>

          <p className="mt-4 text-sm text-gray-600">
            ✅ নিরাপত্তা টিপ: আপনার API কী কারও সাথে শেয়ার করবেন না।
          </p>

          <button
            onClick={onClose}
            className="mt-5 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </>
  );
};

export default HelpModal;