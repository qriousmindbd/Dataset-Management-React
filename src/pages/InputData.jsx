import React, { useState } from "react";
import HelpModal from "../components/HelpModal";
import NotificationModal from "../components/NotificationModal";

const QA_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      question: { type: "STRING", description: "বাংলায় একটি সংক্ষিপ্ত প্রশ্ন।" },
      answer: { type: "STRING", description: "ইংরেজিতে 'yes', 'no' বা 'idk'।" },
      correct_answer: { type: "STRING", description: "প্যারাগ্রাফ থেকে এক বাক্যে সঠিক উত্তর।" },
    },
    required: ["question", "answer", "correct_answer"],
  },
};

const API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";
const MAX_RETRIES = 5;

const InputData = ({
  apiKey,
  setApiKey,
  paragraph,
  setParagraph,
  numYes,
  setNumYes,
  numNo,
  setNumNo,
  numIdk,
  setNumIdk,
  generatedQa,
  setGeneratedQa,
  setError,
  addParagraphData,
  paragraphDataSet,
  setLoading,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [status, setStatus] = useState('');
  const [notification, setNotification] = useState(null);

  const totalQuestions = numYes + numNo + numIdk;

  const buildSystemPrompt = () => {
  return `নিচের প্যারাগ্রাফ থেকে ${totalQuestions} টি প্রশ্ন তৈরি করুন।

**নিয়ম:**
- প্রশ্ন: সম্পূর্ণ বাংলায়
- answer: শুধু "yes", "no" বা "idk" (ইংরেজিতে)
- correct_answer: সম্পূর্ণ বাংলায় প্যারাগ্রাফ থেকে এক বাক্যে উত্তর
- বিতরণ: ${numYes} টি yes, ${numNo} টি no, ${numIdk} টি idk

**আউটপুট:** শুধুমাত্র JSON অ্যারে

**প্যারাগ্রাফ:**
${paragraph}`;
  };

  const generateQa = async () => {
    if (!apiKey.trim() || !paragraph.trim()) {
      setError("অনুগ্রহ করে API কী এবং প্যারাগ্রাফ ইনপুট দিন।");
      return;
    }
    if (numYes < 0 || numNo < 0 || numIdk < 0 || totalQuestions === 0) {
      setError("সঠিক সংখ্যা দিন: প্রশ্ন সংখ্যা শূন্য হতে পারবে না।");
      return;
    }

    setLoading(true);
    setStatus("ডুপ্লিকেট প্যারাগ্রাফ চেক করা হচ্ছে...");
    const isDuplicate = Object.values(paragraphDataSet).some(
      (existingParagraph) => existingParagraph.trim() === paragraph.trim()
    );

    if (isDuplicate) {
      setStatus("ডুপ্লিকেট প্যারাগ্রাফ পাওয়া গেছে। জেনারেশন বাতিল করা হয়েছে।");
      setIsGenerating(false);
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
      return;
    }

    setStatus("কোনো ডুপ্লিকেট প্যারাগ্রাফ পাওয়া যায়নি। জেনারেশন শুরু হচ্ছে...");
    setIsGenerating(true);
    setError(null);

    const systemPrompt = buildSystemPrompt();
    const payload = {
      contents: [{ parts: [{ text: `প্যারাগ্রাফ: ${paragraph}` }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: QA_SCHEMA,
      },
    };

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 100 + Math.random() * 100;
          await new Promise((r) => setTimeout(r, delay));
        }

        const apiUrl = `${API_BASE_URL}?key=${apiKey}`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`HTTP ত্রুটি ${response.status}`);

        const result = await response.json();
        const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const data = JSON.parse(jsonText);
          setGeneratedQa((prev) => {
            const next = Array.isArray(data) ? data : [];
            const needed = prev.length > next.length ? prev.length - next.length : 0;
            return [...next, ...Array(needed).fill({ question: "", answer: "", correct_answer: "" })];
          });
          setIsGenerating(false);
          setStatus('');
          setLoading(false);
          return;
        } else setError("API উত্তর থেকে JSON বের করা যায়নি।");
      } catch (err) {
        setError(`API ত্রুটি: ${err.message}`);
      }
    }
    setIsGenerating(false);
    setLoading(false);
    setStatus("জেনারেশন ব্যর্থ - সব চেষ্টা ব্যর্থ হয়েছে।");
    setTimeout(() => setStatus(''), 5000);
  };

  const handleEditChange = (index, field, value) => {
    const updated = [...generatedQa];
    updated[index][field] = value;
    setGeneratedQa(updated);
  };

  const handleDelete = (index) => {
    const updated = [...generatedQa];
    updated.splice(index, 1);
    setGeneratedQa(updated);
  };

  const addRow = () => {
    setGeneratedQa((prev) => [...prev, { question: "", answer: "", correct_answer: "" }]);
  };

  const handleAddToDataset = () => {
    // 1. Filtering out empty Q&A rows
    const filteredQa = generatedQa.filter(
      (qa) =>
        qa.question &&
        qa.question.trim() !== "" &&
        qa.answer &&
        qa.answer.trim() !== "" &&
        qa.correct_answer &&
        qa.correct_answer.trim() !== ""
    );

    // 2. check if the paragraph is empty
    if (!paragraph.trim()) {
      setNotification("ডাটাসেটে যোগ করতে একটি প্যারাগ্রাফ লিখুন");
      return;
    }

    // 3. Check if at least one QA pair is available or not
    if (filteredQa.length === 0) {
      setNotification("কমপক্ষে ১টি প্রশ্ন-উত্তর যোগ করুন");
      return;
    }

    // 4. If validation passes, call the original function to add the data
    addParagraphData(paragraph, filteredQa);
  }

  return (
    <div className="space-y-4">
      {/* Gemini API Key and question counts side-by-side */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {/* API Key with help */}
        <div className="flex-1 min-w-[250px]">
          <label className="flex items-center gap-2 mb-1 font-semibold">
            জেমিনি API কী
            <button
              type="button"
              onClick={() => setShowApiHelp(true)}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold text-xs"
              title="Gemini API Key help"
            >
              ?
            </button>
          </label>
          <input
            type="password"
            placeholder="API কী দিন"
            className="w-full p-2 border border-gray-300 rounded text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        {/* Question counts */}
        <div className="w-full sm:w-auto min-w-[80px]">
          <label className="block mb-1 font-semibold">হ্যাঁ প্রশ্ন</label>
          <input
            type="number"
            min={0}
            className="w-full p-1 border border-gray-300 rounded text-center bg-white dark:bg-gray-700 dark:text-gray-100 text-sm"
            value={numYes}
            onChange={(e) => setNumYes(Math.max(0, +e.target.value))}
            disabled={isGenerating}
          />
        </div>
        <div className="w-full sm:w-auto min-w-[80px]">
          <label className="block mb-1 font-semibold">না প্রশ্ন</label>
          <input
            type="number"
            min={0}
            className="w-full p-1 border border-gray-300 rounded text-center bg-white dark:bg-gray-700 dark:text-gray-100 text-sm"
            value={numNo}
            onChange={(e) => setNumNo(Math.max(0, +e.target.value))}
            disabled={isGenerating}
          />
        </div>
        <div className="w-full sm:w-auto min-w-[80px]">
          <label className="block mb-1 font-semibold">তথ্যগত (idk)</label>
          <input
            type="number"
            min={0}
            className="w-full p-1 border border-gray-300 rounded text-center bg-white dark:bg-gray-700 dark:text-gray-100 text-sm"
            value={numIdk}
            onChange={(e) => setNumIdk(Math.max(0, +e.target.value))}
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* Paragraph and generate button side-by-side */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="grow w-full">
          <label className="block mb-1 font-semibold text-sm">প্যারাগ্রাফ (বাংলায়)</label>
          <textarea
            rows={6}
            placeholder="প্যারাগ্রাফ লিখুন"
            className="w-full p-2 border border-gray-300 rounded text-sm resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
            value={paragraph}
            onChange={(e) => setParagraph(e.target.value)}
            disabled={isGenerating}
          />
        </div>
        <div className="w-full sm:w-auto">
          <button
            onClick={generateQa}
            disabled={isGenerating || !apiKey.trim() || !paragraph.trim()}
            className={`w-full py-3 px-6 rounded text-white font-semibold text-sm flex items-center justify-center ${
              isGenerating ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isGenerating ? "জেনারেশন হচ্ছে..." : "জেনারেট"}
          </button>
        </div>
      </div>
      
      {status && <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{status}</div>}

      {/* Manual Q&A editor - always visible */}
      <div className="flex items-center justify-between mt-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">প্রশ্ন-উত্তর সম্পাদনা</h3>
        <button
          onClick={addRow}
          className="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          type="button"
          disabled={isGenerating}
        >
          নতুন সারি যোগ করুন
        </button>
      </div>

      <div className="max-h-[480px] overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 space-y-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        {generatedQa.map((qa, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-start gap-2" aria-label={`প্রশ্ন উত্তর #${idx + 1}`}>
            <div className="w-6 text-center select-none pt-2 text-gray-600 dark:text-gray-400">{idx + 1}</div>
            <textarea
              rows={2}
              value={qa.question || ""}
              onChange={(e) => handleEditChange(idx, "question", e.target.value)}
              className="w-full p-1 border border-gray-400 dark:border-gray-600 rounded text-sm resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
              placeholder="প্রশ্ন লিখুন (বাংলায়)"
              disabled={isGenerating}
            />
            <textarea
              rows={2}
              value={qa.answer || ""}
              onChange={(e) => handleEditChange(idx, "answer", e.target.value)}
              className="w-full sm:w-32 p-1 border border-gray-400 dark:border-gray-600 rounded text-sm resize-none text-center bg-white dark:bg-gray-700 dark:text-gray-100"
              placeholder="yes/no/idk"
              disabled={isGenerating}
            />
            <textarea
              rows={2}
              value={qa.correct_answer || ""}
              onChange={(e) => handleEditChange(idx, "correct_answer", e.target.value)}
              className="w-full p-1 border border-gray-400 dark:border-gray-600 rounded text-sm resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
              placeholder="সঠিক উত্তর (এক বাক্যে)"
              disabled={isGenerating}
            />
            <button
              onClick={() => handleDelete(idx)}
              className="text-red-600 dark:text-red-500 text-lg font-bold leading-none hover:underline select-none"
              disabled={isGenerating}
              type="button"
              title="সারি মুছুন"
            >
              ❌
            </button>
          </div>
        ))}
      </div>

      {/* Add to Dataset */}
      <button
        onClick={handleAddToDataset}
        className="mt-2 bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={isGenerating || !addParagraphData || generatedQa.length === 0 || !paragraph.trim()}
      >
        ডেটাসেটে যোগ করুন
      </button>

      {/* Help Modal */}
      <HelpModal
        show={showApiHelp}
        onClose={() => setShowApiHelp(false)}
        title="Gemini API Key পাওয়ার ধাপসমূহ"
        steps={[
          "<strong>ধাপ ১:</strong> আপনার Google অ্যাকাউন্টে লগইন করুন।",
          '<strong>ধাপ ২:</strong> <a href="https://aistudio.google.com" target="_blank" class="text-blue-600 underline">Google AI Studio</a> ওয়েবসাইটে  যান।',
          '<strong>ধাপ ৩:</strong> "Get API key" অথবা "Create API key" এ ক্লিক করুন।',
          "<strong>ধাপ ৪:</strong> Terms of Service পড়ুন এবং সম্মতি দিন (প্রযোজ্য ক্ষেত্রে)।",
          "<strong>ধাপ ৫:</strong> তৈরি হওয়া API key কপি করে এখানে পেস্ট করুন।",
        ]}
      />

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
export default InputData;