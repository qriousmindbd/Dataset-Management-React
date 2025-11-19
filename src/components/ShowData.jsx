import React, { useState, useMemo, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';

// --- Modal component as before ---
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

const ShowData = ({ paragraphDataSet, questionAnswerData, updateQaItem, removeQaItem }) => {
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({ question: '', answer: '', correct_answer: '' });
  const [modalParagraph, setModalParagraph] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedForDeletion, setSelectedForDeletion] = useState(new Set());

  const startEdit = (id, question, answer, correct_answer) => {
    setEditingId(id);
    setEditFields({ question, answer, correct_answer: correct_answer || '' });
  };

  const saveEdit = id => {
    updateQaItem(id, editFields);
    setEditingId(null);
  };

  const handleDeleteRequest = (id) => {
    setDeletingId(id);
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      removeQaItem(deletingId);
    }
    setDeletingId(null);
  };

  const handleDeleteCancel = () => {
    setDeletingId(null);
  };

  // Filtered dataset by searchText only when duplicates view is off
  const filteredData = useMemo(() => {
    if (showDuplicates) return questionAnswerData;
    if (!searchText.trim()) return questionAnswerData;
    const lower = searchText.toLowerCase();
    return questionAnswerData.filter(
      item =>
        item.question.toLowerCase().includes(lower) ||
        item.answer.toLowerCase().includes(lower) ||
        (item.correct_answer && item.correct_answer.toLowerCase().includes(lower))
    );
  }, [searchText, questionAnswerData, showDuplicates]);

  const duplicatesByQuestion = useMemo(() => {
    if (!showDuplicates) return [];
    const questionGroups = new Map();
    questionAnswerData.forEach(item => {
      const question = item.question.trim().toLowerCase();
      if (!questionGroups.has(question)) {
        questionGroups.set(question, []);
      }
      questionGroups.get(question).push(item);
    });
    return Array.from(questionGroups.values()).filter(group => group.length > 1);
  }, [questionAnswerData, showDuplicates]);

  useEffect(() => {
    if (showDuplicates) {
      const initialSelection = new Set();
      duplicatesByQuestion.forEach(group => {
        group.slice(1).forEach(item => initialSelection.add(item.id));
      });
      setSelectedForDeletion(initialSelection);
    } else {
      setSelectedForDeletion(new Set());
    }
  }, [showDuplicates, duplicatesByQuestion]);

  const handleSelectionChange = (id) => {
    const newSelection = new Set(selectedForDeletion);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedForDeletion(newSelection);
  };

  const handleRemoveSelected = () => {
    selectedForDeletion.forEach(id => removeQaItem(id));
    setSelectedForDeletion(new Set());
  };

  return (
    <div className="overflow-auto max-h-[650px] p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded shadow relative">
      <h2 className="text-2xl font-bold mb-4">
        সংরক্ষিত প্রশ্ন ও উত্তর ({questionAnswerData.length})
      </h2>

      {/* Search Input and buttons */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="প্রশ্ন বা উত্তর অনুসন্ধান করুন..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
          disabled={showDuplicates}
        />
        <button
          onClick={() => setShowDuplicates(false)}
          disabled={showDuplicates === false}
          className={`px-4 py-2 rounded text-sm font-medium ${
            showDuplicates === false
              ? 'bg-indigo-600 text-white cursor-not-allowed'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          সোজা অনুসন্ধান
        </button>
        <button
          onClick={() => {
            setShowDuplicates(true);
            setSearchText('');
          }}
          disabled={showDuplicates === true}
          className={`px-4 py-2 rounded text-sm font-medium ${
            showDuplicates === true
              ? 'bg-red-600 text-white cursor-not-allowed'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          ডুপ্লিকেট অনুসন্ধান
        </button>
      </div>

      {/* DUPLICATE View */}
      {showDuplicates && (
        <>
          {duplicatesByQuestion.length > 0 ? (
            duplicatesByQuestion.map((group, index) => (
              <div key={index} className="mb-6 border rounded p-3 bg-red-50 dark:bg-red-900/20">
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-3">
                  ডুপ্লিকেট প্রশ্ন: {group[0].question} ({group.length} বার)
                </h3>
                <div className="space-y-2">
                  {group.map(item => (
                    <div key={item.id} className="flex items-start gap-2 p-2 border border-red-200 dark:border-red-700 rounded bg-white dark:bg-gray-700">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedForDeletion.has(item.id)}
                        onChange={() => handleSelectionChange(item.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400"><strong>উত্তর:</strong> {item.answer}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400"><strong>সঠিক উত্তর:</strong> {item.correct_answer}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">প্যারাগ্রাফ কী: {item.paragraphKey}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleRemoveSelected}
                  disabled={selectedForDeletion.size === 0}
                  className="mt-3 px-3 py-1 rounded text-sm font-semibold bg-red-600 text-white disabled:bg-red-400"
                >
                  নির্বাচিত ({selectedForDeletion.size}) মুছুন
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">কোনো ডুপ্লিকেট পাওয়া যায়নি।</p>
          )}
        </>
      )}

      {/* NORMAL filtered list */}
      {!showDuplicates && (
        <>
          {filteredData.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">কোনো ডেটা পাওয়া যায়নি।</p>
          ) : (
            filteredData.map((item, index) => (
              <div
                key={item.id}
                className="mb-4 p-3 border border-gray-300 dark:border-gray-600 rounded shadow-sm"
              >
                <p className="mb-2 text-gray-700 dark:text-gray-400 text-sm">
                  Paragraph Ref:{" "}
                  <span
                    onClick={() =>
                      setModalParagraph(paragraphDataSet[item.paragraphKey])
                    }
                    className="text-indigo-600 dark:text-indigo-400 underline cursor-pointer hover:text-indigo-800 dark:hover:text-indigo-200"
                  >
                    {item.paragraphKey}
                  </span>
                </p>

                {editingId === item.id ? (
                  <>
                    <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">প্রশ্ন:</label>
                    <textarea
                      rows={2}
                      className="w-full p-2 border border-blue-400 rounded mb-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={editFields.question}
                      onChange={(e) =>
                        setEditFields({ ...editFields, question: e.target.value })
                      }
                    />
                    <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">উত্তর:</label>
                    <textarea
                      rows={2}
                      className="w-full p-2 border border-blue-400 rounded mb-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={editFields.answer}
                      onChange={(e) =>
                        setEditFields({ ...editFields, answer: e.target.value })
                      }
                    />
                    <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">সঠিক উত্তর:</label>
                    <textarea
                      rows={2}
                      className="w-full p-2 border border-blue-400 rounded mb-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      value={editFields.correct_answer}
                      onChange={(e) =>
                        setEditFields({ ...editFields, correct_answer: e.target.value })
                      }
                    />
                    <button
                      className="bg-blue-600 text-white px-4 py-1 rounded mr-2 text-sm"
                      onClick={() => saveEdit(item.id)}
                    >
                      সেভ করুন
                    </button>
                    <button
                      className="bg-gray-300 dark:bg-gray-600 px-4 py-1 rounded text-sm"
                      onClick={() => setEditingId(null)}
                    >
                      বাতিল
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold mb-1">
                      <strong>Q{index + 1}:</strong> {item.question}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      <strong>A:</strong> {item.answer}
                    </p>
                    {item.correct_answer && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>সঠিক উত্তর:</strong> {item.correct_answer}
                      </p>
                    )}
                    <div className="mt-3 space-x-2">
                      <button
                        onClick={() =>
                          startEdit(item.id, item.question, item.answer, item.correct_answer)
                        }
                        className="text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-500 rounded px-3 py-1 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      >
                        এডিট
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(item.id)}
                        className="text-red-600 dark:text-red-400 border border-red-600 dark:border-red-500 rounded px-3 py-1 text-sm hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        মুছে ফেলুন
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* Paragraph Modal */}
      <Modal
        show={!!modalParagraph}
        onClose={() => setModalParagraph(null)}
        title="প্যারাগ্রাফ"
      >
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{modalParagraph}</p>
      </Modal>

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        show={deletingId !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="নিশ্চিতকরণ মুছুন"
      >
        আপনি কি নিশ্চিত যে আপনি এই আইটেমটি মুছতে চান? এই ক্রিয়াটি ফিরিয়ে আনা যাবে না।
      </ConfirmationModal>
    </div>
  );
};

export default ShowData;
