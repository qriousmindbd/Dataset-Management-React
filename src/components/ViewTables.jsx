import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';

const ViewTables = ({ paragraphDataSet, questionAnswerData, removeParagraphItem, removeQaItem }) => {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDeleteRequest = (id, type) => {
    setDeleteTarget({ id, type });
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      if (deleteTarget.type === 'paragraph') {
        removeParagraphItem(deleteTarget.id);
      } else if (deleteTarget.type === 'qa') {
        removeQaItem(deleteTarget.id);
      }
    }
    setDeleteTarget(null);
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  return (
    <div className="overflow-auto max-h-[650px] p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">ডেটাসেট টেবিল</h2>

      {/* Paragraph Dataset Table */}
      <h3 className="text-xl font-semibold mb-2 flex justify-between items-center">
        <span>প্যারাগ্রাফ ডেটাসেট ({paragraphDataSet.length})</span>
      </h3>
      <div className="overflow-auto max-h-96 mb-6 border border-gray-300 dark:border-gray-700 rounded">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 border">Serial</th>
              <th className="px-4 py-2 border">Paragraph Key</th>
              <th className="px-4 py-2 border">Content</th>
              <th className="px-4 py-2 border">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paragraphDataSet.map((para, index) => (
              <tr key={para.paragraphKey || index}>
                <td className="px-4 py-2 border">{index + 1}</td>
                <td className="px-4 py-2 border">{para.paragraphKey || ''}</td>
                <td className="px-4 py-2 border">{para.content || ''}</td>
                <td className="px-4 py-2 border text-center">
                  <button
                    onClick={() => handleDeleteRequest(para.paragraphKey, 'paragraph')}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 font-semibold"
                    aria-label="Delete paragraph"
                  >
                    মুছে ফেলুন
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QA Dataset Table */}
      <h3 className="text-xl font-semibold mb-2 flex justify-between items-center">
        <span>প্রশ্ন-উত্তর ডেটাসেট ({questionAnswerData.length})</span>
      </h3>
      <div className="overflow-auto max-h-96 border border-gray-300 dark:border-gray-700 rounded">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 border">Serial</th>
              <th className="px-4 py-2 border">Question</th>
              <th className="px-4 py-2 border">Answer</th>
              <th className="px-4 py-2 border">Correct Answer</th>
              <th className="px-4 py-2 border">Paragraph Key</th>
              <th className="px-4 py-2 border">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {questionAnswerData.map((item, index) => (
              <tr key={item.id || index}>
                <td className="px-4 py-2 border">{index + 1}</td>
                <td className="px-4 py-2 border">{item.question}</td>
                <td className="px-4 py-2 border">{item.answer}</td>
                <td className="px-4 py-2 border">{item.correct_answer || 'N/A'}</td>
                <td className="px-4 py-2 border">{item.paragraphKey}</td>
                <td className="px-4 py-2 border text-center">
                  <button
                    onClick={() => handleDeleteRequest(item.id, 'qa')}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 font-semibold"
                    aria-label="Delete question-answer pair"
                  >
                    মুছে ফেলুন
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        show={deleteTarget !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="নিশ্চিতকরণ মুছুন"
      >
        আপনি কি নিশ্চিত যে আপনি এই আইটেমটি মুছতে চান? এই ক্রিয়াটি ফিরিয়ে আনা যাবে না।
      </ConfirmationModal>
    </div>
  );
};

export default ViewTables;
