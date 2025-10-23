import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import InputData from './components/InputData';
import ShowData from './components/ShowData';
import DownloadData from './components/DownloadData';
import ViewTables from './components/ViewTables';
import Modal from './components/Modal';

const LOCAL_STORAGE_KEYS = {
  apiKey: 'gemini_api_key',
  paragraph: 'input_paragraph',
  yesCount: 'num_yes_questions',
  noCount: 'num_no_questions',
  idkCount: 'num_idk_questions',
  paraDataset: 'paragraph_dataset',
  qaDataset: 'qa_dataset',
  theme: 'app_theme', // Theme key for dark/light mode persistence
};

const App = () => {
  const [currentSection, setCurrentSection] = useState('input');

  // Theme state and persistence
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEYS.theme) === 'dark'
  );

  useEffect(() => {
    console.log('dark mode:', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(LOCAL_STORAGE_KEYS.theme, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(LOCAL_STORAGE_KEYS.theme, 'light');
    }
  }, [darkMode]);

  // Sidebar open state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lifted states persisted locally
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LOCAL_STORAGE_KEYS.apiKey) || '');
  const [paragraph, setParagraph] = useState(() => localStorage.getItem(LOCAL_STORAGE_KEYS.paragraph) || '');
  const [numYes, setNumYes] = useState(() => parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.yesCount)) || 2);
  const [numNo, setNumNo] = useState(() => parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.noCount)) || 2);
  const [numIdk, setNumIdk] = useState(() => parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.idkCount)) || 2);
  const [generatedQa, setGeneratedQa] = useState([]);
  const [error, setError] = useState(null);

  const [paragraphDataSet, setParagraphDataSet] = useState(() => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.paraDataset);
    return data ? JSON.parse(data) : {};
  });

  const [questionAnswerData, setQuestionAnswerData] = useState(() => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.qaDataset);
    // Migrate old data to include correct_answer field if missing
    const parsed = data ? JSON.parse(data) : [];
    return parsed.map(item => ({
      ...item,
      correct_answer: item.correct_answer || '' // Add field if missing
    }));
  });

  // Persist all relevant states to localStorage on change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.apiKey, apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.paragraph, paragraph);
  }, [paragraph]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.yesCount, numYes.toString());
  }, [numYes]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.noCount, numNo.toString());
  }, [numNo]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.idkCount, numIdk.toString());
  }, [numIdk]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.paraDataset, JSON.stringify(paragraphDataSet));
  }, [paragraphDataSet]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.qaDataset, JSON.stringify(questionAnswerData));
  }, [questionAnswerData]);

  const addParagraphData = (paragraphText, qaArray) => {
    const paraKey = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setParagraphDataSet(prev => ({ ...prev, [paraKey]: paragraphText }));

    const newQaItems = qaArray.map(item => ({
      id: crypto.randomUUID(),
      paragraphKey: paraKey,
      question: item.question,
      answer: item.answer,
      correct_answer: item.correct_answer || '', // Include correct_answer field
    }));

    setQuestionAnswerData(prev => [...prev, ...newQaItems]);
    setGeneratedQa([]);
    setCurrentSection('show');
  };

  // Handler to remove a paragraph and its related QAs
  const removeParagraphItem = (paraKey) => {
    setParagraphDataSet(prev => {
      const newData = { ...prev };
      delete newData[paraKey];
      return newData;
    });
    // Also remove QA items linked to this paragraph key
    setQuestionAnswerData(prev => prev.filter(item => item.paragraphKey !== paraKey));
  };

  // Handler to remove a QA item
  const removeQaItem = (id) => {
    setQuestionAnswerData(prev => prev.filter(item => item.id !== id));
  };

  // Handler to update a QA item (with all fields including correct_answer)
  const updateQaItem = (id, updatedFields) => {
    setQuestionAnswerData(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updatedFields } : item))
    );
  };

  return (
    <>
      <div className="flex font-[Inter] min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Sidebar
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        <main className="flex-1 p-8 lg:p-10 overflow-auto">
          {/* Mobile hamburger */}
          <div className="mb-4 lg:hidden">
            <button
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow"
            >
              <i className="bi bi-list text-xl"></i>
            </button>
          </div>

          {currentSection === 'input' && (
            <InputData
              apiKey={apiKey}
              setApiKey={setApiKey}
              paragraph={paragraph}
              setParagraph={setParagraph}
              numYes={numYes}
              setNumYes={setNumYes}
              numNo={numNo}
              setNumNo={setNumNo}
              numIdk={numIdk}
              setNumIdk={setNumIdk}
              generatedQa={generatedQa}
              setGeneratedQa={setGeneratedQa}
              setError={setError}
              addParagraphData={addParagraphData}
            />
          )}
          {currentSection === 'show' && (
            <ShowData
              paragraphDataSet={paragraphDataSet}
              questionAnswerData={questionAnswerData}
              updateQaItem={updateQaItem}
              removeQaItem={removeQaItem}
            />
          )}
          {currentSection === 'download' && (
            <DownloadData paragraphDataSet={paragraphDataSet} questionAnswerData={questionAnswerData} />
          )}
          {currentSection === 'viewTables' && (
            <ViewTables
              paragraphDataSet={Object.entries(paragraphDataSet).map(([key, content]) => ({ paragraphKey: key, content }))}
              questionAnswerData={questionAnswerData}
              removeParagraphItem={removeParagraphItem}
              removeQaItem={removeQaItem}
            />
          )}
        </main>
      </div>

      <Modal show={!!error} onClose={() => setError(null)} title="ত্রুটি">
        {error}
      </Modal>
    </>
  );
};

export default App;