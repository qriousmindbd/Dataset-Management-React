import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import NotificationModal from '../components/NotificationModal';

const UploadData = ({ setParagraphDataSet, setQuestionAnswerData }) => {
  const [uploadedData, setUploadedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleFile = (file) => {
    if (!file) {
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    const fileExtension = file.name.split('.').pop().toLowerCase();

    reader.onload = (event) => {
      try {
        let data;
        if (fileExtension === 'json') {
          data = JSON.parse(event.target.result);
        } else if (fileExtension === 'csv' || fileExtension === 'xlsx') {
          const workbook = XLSX.read(event.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(worksheet);
        } else {
          setError('Unsupported file type. Please upload a CSV, XLSX, or JSON file.');
          return;
        }
        setUploadedData(data);
        setError('');
      } catch (err) {
        setError('Error parsing file: ' + err.message);
        setUploadedData([]);
      }
    };

    if (fileExtension === 'json') {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleFileUpload = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleMergeData = () => {
    if (uploadedData.length === 0) {
      setError('No data to merge.');
      return;
    }

    const requiredColumns = ['paragraph', 'question', 'answer'];
    const uploadedDataColumns = uploadedData.length > 0 ? Object.keys(uploadedData[0]) : [];

    const hasAllColumns = requiredColumns.every(col => uploadedDataColumns.includes(col));

    if (!hasAllColumns) {
      setError('Uploaded data does not have all the required columns. Required columns are: ' + requiredColumns.join(', '));
      return;
    }

    const newParagraphs = {};
    const paragraphMap = new Map();
    const uniqueParagraphs = [...new Set(uploadedData.map(item => item.paragraph))];

    uniqueParagraphs.forEach(para => {
      const paraKey = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      newParagraphs[paraKey] = para;
      paragraphMap.set(para, paraKey);
    });

    const newQaItems = uploadedData.map(item => ({
      id: crypto.randomUUID(),
      paragraphKey: paragraphMap.get(item.paragraph),
      question: item.question,
      answer: item.answer,
      correct_answer: item.correct_answer || '',
    }));

    setParagraphDataSet(prev => ({ ...prev, ...newParagraphs }));
    setQuestionAnswerData(prev => [...prev, ...newQaItems]);

    setUploadedData([]);
    setFileName('');
    setError('');
    setNotification('ডেটা সফলভাবে মার্জ করা হয়েছে!');
  };

  const getTableHeaders = () => {
    if (uploadedData.length === 0) return [];
    return Object.keys(uploadedData[0]);
  };

  const inputRef = React.useRef(null);

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const handleCancel = () => {
    setUploadedData([]);
    setFileName('');
    setError('');
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded shadow" style={{ height: 'calc(100vh - 70px)' }}>
      <h2 className="text-2xl font-bold mb-4">ডেটা আপলোড</h2>
      {uploadedData.length === 0 && (
        <div
          className={`drop-zone ${isDragActive ? 'is-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv, .xlsx, .json"
            onChange={handleFileUpload}
            className="file-input"
          />
          <p>Drag & drop a file here, or click to select a file</p>
          <button className="mt-4 px-4 py-2 rounded text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700">
            Select File
          </button>
        </div>
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {uploadedData.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Uploaded Data ({fileName})</h3>
          <div className="overflow-auto mb-4 border border-gray-300 dark:border-gray-700 rounded" style={{ height: 'calc(100vh - 400px)' }}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  {getTableHeaders().map(header => (
                    <th key={header} className="px-2 py-1 border text-sm">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {uploadedData.map((row, index) => (
                  <tr key={index}>
                    {getTableHeaders().map(header => (
                      <td key={header} className="px-2 py-1 border text-sm">{row[header]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleMergeData}
            className="px-4 py-2 rounded text-sm font-semibold bg-green-600 text-white hover:bg-green-700"
          >
            Merge with Question-Answer Data
          </button>
          <button
            onClick={handleCancel}
            className="ml-2 px-4 py-2 rounded text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
          >
            Cancel
          </button>
        </div>
      )}

      <NotificationModal
        show={!!notification}
        onClose={() => setNotification(null)}
        title="বিজ্ঞপ্তি"
      >
        {notification}
      </NotificationModal>
    </div>
  );
};

export default UploadData;
