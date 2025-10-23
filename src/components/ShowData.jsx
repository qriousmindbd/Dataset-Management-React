import React, { useState, useMemo } from 'react';

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
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-600 hover:text-black text-2xl"
          >
            ×
          </button>
          <h2 className="text-lg font-semibold mb-3">{title}</h2>
          <div className="text-gray-700">{children}</div>
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

  const startEdit = (id, question, answer, correct_answer) => {
    setEditingId(id);
    setEditFields({ question, answer, correct_answer: correct_answer || '' });
  };

  const saveEdit = id => {
    updateQaItem(id, editFields);
    setEditingId(null);
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

  // Find duplicates grouped by paragraphKey only if duplicates view is on
  const duplicatesByParagraph = useMemo(() => {
    if (!showDuplicates) return {};
    // Map of paragraphKey -> array of duplicate QA objects
    const map = new Map();
    const questionCount = new Map();

    // Count questions globally
    for (const item of questionAnswerData) {
      const key = item.question.trim().toLowerCase();
      questionCount.set(key, (questionCount.get(key) || 0) + 1);
    }

    // Group duplicates (questions appearing more than once) by paragraphKey
    for (const item of questionAnswerData) {
      const qKey = item.question.trim().toLowerCase();
      if (questionCount.get(qKey) > 1) {
        const paraKey = item.paragraphKey;
        if (!map.has(paraKey)) map.set(paraKey, []);
        map.get(paraKey).push(item);
      }
    }

    return map;
  }, [questionAnswerData, showDuplicates]);

  const deleteDuplicate = id => {
    removeQaItem(id);
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
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 cursor-not-allowed'
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
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ডুপ্লিকেট অনুসন্ধান
        </button>
      </div>

      {/* DUPLICATE View */}
      {showDuplicates && duplicatesByParagraph.size > 0 && (
        <>
          {[...duplicatesByParagraph.entries()].map(([paraKey, dups]) => (
            <div key={paraKey} className="mb-6 border rounded p-3 bg-red-50">
              <h3 className="font-semibold text-red-700 mb-3">
                প্যারাগ্রাফ:{" "}
                <span
                  onClick={() => setModalParagraph(paragraphDataSet[paraKey])}
                  className="underline cursor-pointer text-indigo-600 hover:text-indigo-800"
                >
                  {paraKey}
                </span>{" "}
                ({dups.length} ডুপ্লিকেট প্রশ্ন)
              </h3>

              <div className="flex flex-wrap gap-4">
                {dups.map((item) => (
                  <div
                    key={item.id}
                    className="w-full md:w-1/2 border border-red-400 rounded p-3 bg-white shadow"
                  >
                    <p className="mb-2 font-semibold text-gray-800">{item.question}</p>
                    <p className="mb-2 text-gray-600"><strong>উত্তর:</strong> {item.answer}</p>
                    {item.correct_answer && (
                      <p className="mb-4 text-gray-600 text-sm">
                        <strong>সঠিক উত্তর:</strong> {item.correct_answer}
                      </p>
                    )}
                    <button
                      onClick={() => deleteDuplicate(item.id)}
                      className="text-red-600 border border-red-600 rounded px-3 py-1 hover:bg-red-50 text-sm"
                    >
                      মুছে ফেলুন
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {duplicatesByParagraph.size === 0 && (
            <p className="text-gray-500">কোনো ডুপ্লিকেট পাওয়া যায়নি।</p>
          )}
        </>
      )}

      {/* NORMAL filtered list */}
      {!showDuplicates && (
        <>
          {filteredData.length === 0 ? (
            <p className="text-gray-500">কোনো ডেটা পাওয়া যায়নি।</p>
          ) : (
            filteredData.map((item, index) => (
              <div
                key={item.id}
                className="mb-4 p-3 border border-gray-300 rounded shadow-sm"
              >
                <p className="mb-2 text-gray-700 text-sm">
                  Paragraph Ref:{" "}
                  <span
                    onClick={() =>
                      setModalParagraph(paragraphDataSet[item.paragraphKey])
                    }
                    className="text-indigo-600 underline cursor-pointer hover:text-indigo-800"
                  >
                    {item.paragraphKey}
                  </span>
                </p>

                {editingId === item.id ? (
                  <>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">প্রশ্ন:</label>
                    <textarea
                      rows={2}
                      className="w-full p-2 border border-blue-400 rounded mb-2 text-sm"
                      value={editFields.question}
                      onChange={(e) =>
                        setEditFields({ ...editFields, question: e.target.value })
                      }
                    />
                    <label className="block text-xs font-semibold mb-1 text-gray-600">উত্তর:</label>
                    <textarea
                      rows={2}
                      className="w-full p-2 border border-blue-400 rounded mb-2 text-sm"
                      value={editFields.answer}
                      onChange={(e) =>
                        setEditFields({ ...editFields, answer: e.target.value })
                      }
                    />
                    <label className="block text-xs font-semibold mb-1 text-gray-600">সঠিক উত্তর:</label>
                    <textarea
                      rows={2}
                      className="w-full p-2 border border-blue-400 rounded mb-2 text-sm"
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
                      className="bg-gray-300 px-4 py-1 rounded text-sm"
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
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>A:</strong> {item.answer}
                    </p>
                    {item.correct_answer && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>সঠিক উত্তর:</strong> {item.correct_answer}
                      </p>
                    )}
                    <div className="mt-3 space-x-2">
                      <button
                        onClick={() =>
                          startEdit(item.id, item.question, item.answer, item.correct_answer)
                        }
                        className="text-blue-600 border border-blue-600 rounded px-3 py-1 text-sm hover:bg-blue-50"
                      >
                        এডিট
                      </button>
                      <button
                        onClick={() => removeQaItem(item.id)}
                        className="text-red-600 border border-red-600 rounded px-3 py-1 text-sm hover:bg-red-50"
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
    </div>
  );
};

export default ShowData;
