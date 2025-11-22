import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import InputData from './pages/InputData';
import ShowData from './pages/ShowData';
import DownloadData from './pages/DownloadData';
import NotificationModal from './components/NotificationModal';
import ViewTables from './pages/ViewTables';
import Navbar from './components/Navbar';
import UploadData from './pages/UploadData';
import Loader from './components/Loader';

const LOCAL_STORAGE_KEYS = {
  apiKey: 'gemini_api_key',
  paraDataset: 'paragraph_dataset',
  qaDataset: 'qa_dataset',
  theme: 'app_theme', // Theme key for dark/light mode persistence
};

const App = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);


  // Theme state and persistence
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_KEYS.theme) === 'dark'
  );

  useEffect(() => {
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
    navigate('/show');
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

  const updateParagraph = (paraKey, newContent) => {
    setParagraphDataSet(prev => ({ ...prev, [paraKey]: newContent }));
  };

  const removeAllParagraphs = () => {
    setParagraphDataSet({});
    setQuestionAnswerData([]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {loading && <Loader />}
      <div className="lg:hidden">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        <main className="flex-1 p-4 lg:p-8 overflow-auto transition-all duration-300 lg:ml-64">
          <Routes>
            <Route
              path="/"
              element={
                <InputData
                  apiKey={apiKey}
                  setApiKey={setApiKey}
                  setError={setError}
                  addParagraphData={addParagraphData}
                  paragraphDataSet={paragraphDataSet}
                  setLoading={setLoading}
                />
              }
            />
            <Route
              path="/show"
              element={
                <ShowData
                  paragraphDataSet={paragraphDataSet}
                  questionAnswerData={questionAnswerData}
                  updateQaItem={updateQaItem}
                  removeQaItem={removeQaItem}
                />
              }
            />
            <Route
              path="/download"
              element={<DownloadData paragraphDataSet={paragraphDataSet} questionAnswerData={questionAnswerData} />}
            />
            <Route
              path="/tables"
              element={
                <ViewTables
                  paragraphDataSet={Object.entries(paragraphDataSet).map(([key, content]) => ({ paragraphKey: key, content }))}
                  questionAnswerData={questionAnswerData}
                  removeParagraphItem={removeParagraphItem}
                  removeQaItem={removeQaItem}
                  updateParagraph={updateParagraph}
                  removeAllParagraphs={removeAllParagraphs}
                />
              }
            />
            <Route
              path="/upload"
              element={
                <UploadData
                  setParagraphDataSet={setParagraphDataSet}
                  setQuestionAnswerData={setQuestionAnswerData}
                />
              }
            />
          </Routes>
        </main>
      </div>

      <NotificationModal show={!!error} onClose={() => setError(null)} title="ত্রুটি">
        {error}
      </NotificationModal>
    </div>
  );
};

export default App;