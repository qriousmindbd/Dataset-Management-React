import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const ParagraphEditModal = ({ isOpen, onClose, paragraph, onSave }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (paragraph) {
      setText(paragraph.content);
    }
  }, [paragraph]);

  const handleSave = () => {
    onSave(paragraph.paragraphKey, text);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal show={isOpen} onClose={onClose} title="প্যারাগ্রাফ সম্পাদনা করুন">
      <textarea
        rows="10"
        className="w-full p-2 border border-gray-300 rounded text-sm resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded mr-2 text-sm"
        >
          সেভ করুন
        </button>
        <button
          onClick={onClose}
          className="bg-gray-300 dark:bg-gray-600 px-4 py-2 rounded text-sm"
        >
          বাতিল
        </button>
      </div>
    </Modal>
  );
};

export default ParagraphEditModal;
