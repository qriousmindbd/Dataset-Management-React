import React, { useState } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';
import ParagraphEditModal from '../components/ParagraphEditModal';

const ViewTables = ({ paragraphDataSet, questionAnswerData, removeParagraphItem, removeQaItem, updateParagraph, removeAllParagraphs }) => {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingParagraph, setEditingParagraph] = useState(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

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

  const handleEditRequest = (paragraph) => {
    setEditingParagraph(paragraph);
  };

  const handleEditSave = (paragraphKey, newContent) => {
    updateParagraph(paragraphKey, newContent);
    setEditingParagraph(null);
  };

  const handleEditCancel = () => {
    setEditingParagraph(null);
  };

  const handleDeleteAllRequest = () => {
    setShowDeleteAllModal(true);
  };

  const handleDeleteAllConfirm = () => {
    removeAllParagraphs();
    setShowDeleteAllModal(false);
  };

  const handleDeleteAllCancel = () => {
    setShowDeleteAllModal(false);
  };

  return (
    <div className="flex flex-col h-full p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">ডেটাসেট টেবিল</h2>

      {/* Paragraph Dataset Table */}
      <h3 className="text-xl font-semibold mb-2 flex justify-between items-center">
        <span>প্যারাগ্রাফ ডেটাসেট ({paragraphDataSet.length})</span>
        <button
          onClick={handleDeleteAllRequest}
          className="text-red-600 dark:text-red-400 border border-red-600 dark:border-red-500 rounded px-2 py-0.5 text-xs hover:bg-red-50 dark:hover:bg-red-900/30"
          aria-label="Delete all paragraphs"
        >
          সব মুছে ফেলুন
        </button>
      </h3>
      <div className="overflow-y-auto overflow-x-hidden mb-6 border border-gray-300 dark:border-gray-700 rounded" style={{ maxHeight: 'calc(50vh - 120px)' }}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-2 py-1 border text-sm">Serial</th>
              <th className="px-2 py-1 border text-sm">Paragraph Key</th>
              <th className="px-2 py-1 border text-sm">Content</th>
              <th className="px-2 py-1 border text-sm">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paragraphDataSet.map((para, index) => (
              <tr key={para.paragraphKey || index}>
                <td className="px-2 py-1 border text-sm">{index + 1}</td>
                <td className="px-2 py-1 border text-sm">{para.paragraphKey || ''}</td>
                <td className="px-2 py-1 border text-sm">{para.content || ''}</td>
                <td className="px-2 py-1 border text-center">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleEditRequest(para)}
                      className="text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-500 rounded px-2 py-0.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      aria-label="Edit paragraph"
                    >
                      এডিট
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(para.paragraphKey, 'paragraph')}
                      className="text-red-600 dark:text-red-400 border border-red-600 dark:border-red-500 rounded px-2 py-0.5 text-xs hover:bg-red-50 dark:hover:bg-red-900/30"
                      aria-label="Delete paragraph"
                    >
                      মুছে ফেলুন
                    </button>
                  </div>
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
      <div className="overflow-y-auto overflow-x-hidden border border-gray-300 dark:border-gray-700 rounded" style={{ maxHeight: 'calc(50vh - 120px)' }}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-2 py-1 border text-sm">Serial</th>
              <th className="px-2 py-1 border text-sm">Question</th>
              <th className="px-2 py-1 border text-sm">Answer</th>
              <th className="px-2 py-1 border text-sm">Correct Answer</th>
              <th className="px-2 py-1 border text-sm">Paragraph Key</th>
              <th className="px-2 py-1 border text-sm">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {questionAnswerData.map((item, index) => (
              <tr key={item.id || index}>
                <td className="px-2 py-1 border text-sm">{index + 1}</td>
                <td className="px-2 py-1 border text-sm">{item.question}</td>
                <td className="px-2 py-1 border text-sm">{item.answer}</td>
                <td className="px-2 py-1 border text-sm">{item.correct_answer || 'N/A'}</td>
                <td className="px-2 py-1 border text-sm">{item.paragraphKey}</td>
                <td className="px-2 py-1 border text-center">
                  <button
                    onClick={() => handleDeleteRequest(item.id, 'qa')}
                    className="text-red-600 dark:text-red-400 border border-red-600 dark:border-red-500 rounded px-2 py-0.5 text-xs hover:bg-red-50 dark:hover:bg-red-900/30"
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

      <ConfirmationModal
        show={showDeleteAllModal}
        onClose={handleDeleteAllCancel}
        onConfirm={handleDeleteAllConfirm}
        title="সব প্যারাগ্রাফ মুছে ফেলুন"
      >
        আপনি কি নিশ্চিত যে আপনি সব প্যারাগ্রাফ মুছে ফেলতে চান? এই ক্রিয়াটি ফিরিয়ে আনা যাবে না।
      </ConfirmationModal>

      <ParagraphEditModal
        isOpen={editingParagraph !== null}
        onClose={handleEditCancel}
        onSave={handleEditSave}
        paragraph={editingParagraph}
      />
    </div>
  );
};

export default ViewTables;