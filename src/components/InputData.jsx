import React, { useState } from "react";
import HelpModal from "./HelpModal";

const QA_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      question: { type: "STRING", description: "বাংলায় একটি সংক্ষিপ্ত প্রশ্ন।" },
      answer: { type: "STRING", description: "ইংরেজিতে 'yes', 'no' বা 'idk'।" },
    },
    required: ["question", "answer"],
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
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiHelp, setShowApiHelp] = useState(false);

  const totalQuestions = numYes + numNo + numIdk;

  const buildSystemPrompt = () => {
    return `আপনি মোট ${totalQuestions} টি সংক্ষিপ্ত প্রশ্ন জেনারেট করবেন।
- সব প্রশ্ন হবে বাংলায়।
- সব উত্তর হবে ইংরেজিতে "yes", "no" বা "idk"।
- হ্যাঁ উত্তরযুক্ত হবে ${numYes} টি, না ${numNo} টি, এবং idk ${numIdk} টি প্রশ্ন।
- আউটপুট হবে শুধুমাত্র JSON অ্যারে।
প্যারাগ্রাফ: ${paragraph}`;
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
            return [...next, ...Array(needed).fill({ question: "", answer: "" })];
          });
          setIsGenerating(false);
          return;
        } else setError("API উত্তর থেকে JSON বের করা যায়নি।");
      } catch (err) {
        setError(`API ত্রুটি: ${err.message}`);
      }
    }
    setIsGenerating(false);
    setError("জেনারেশন ব্যর্থ - সব চেষ্টা ব্যর্থ হয়েছে।");
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
    setGeneratedQa((prev) => [...prev, { question: "", answer: "" }]);
  };

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
            className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        {/* Question counts */}
        <div className="min-w-[80px]">
          <label className="block mb-1 font-semibold">হ্যাঁ প্রশ্ন</label>
          <input
            type="number"
            min={0}
            className="w-full p-1 border border-gray-300 rounded text-center bg-white text-sm"
            value={numYes}
            onChange={(e) => setNumYes(Math.max(0, +e.target.value))}
            disabled={isGenerating}
          />
        </div>
        <div className="min-w-[80px]">
          <label className="block mb-1 font-semibold">না প্রশ্ন</label>
          <input
            type="number"
            min={0}
            className="w-full p-1 border border-gray-300 rounded text-center bg-white text-sm"
            value={numNo}
            onChange={(e) => setNumNo(Math.max(0, +e.target.value))}
            disabled={isGenerating}
          />
        </div>
        <div className="min-w-[80px]">
          <label className="block mb-1 font-semibold">তথ্যগত (idk)</label>
          <input
            type="number"
            min={0}
            className="w-full p-1 border border-gray-300 rounded text-center bg-white text-sm"
            value={numIdk}
            onChange={(e) => setNumIdk(Math.max(0, +e.target.value))}
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* Paragraph and generate button side-by-side */}
      <div className="flex gap-4 items-center">
        <div className="grow">
          <label className="block mb-1 font-semibold text-sm">প্যারাগ্রাফ (বাংলায়)</label>
          <textarea
            rows={6}
            placeholder="প্যারাগ্রাফ লিখুন"
            className="w-full p-2 border border-gray-300 rounded text-sm resize-none bg-white"
            value={paragraph}
            onChange={(e) => setParagraph(e.target.value)}
            disabled={isGenerating}
          />
        </div>
        <div>
          <button
            onClick={generateQa}
            disabled={isGenerating || !apiKey.trim() || !paragraph.trim()}
            className={`py-3 px-6 rounded text-white font-semibold text-sm flex items-center justify-center ${
              isGenerating ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                জেনারেশন হচ্ছে...
              </>
            ) : (
              "জেনারেট"
            )}
          </button>
        </div>
      </div>

      {/* Manual Q&A editor - always visible */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 text-sm">প্রশ্ন-উত্তর সম্পাদনা</h3>
        <button
          onClick={addRow}
          className="text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
          type="button"
          disabled={isGenerating}
        >
          নতুন সারি যোগ করুন
        </button>
      </div>

      <div className="max-h-[480px] overflow-y-auto border border-gray-300 rounded p-2 space-y-2 bg-white">
        {generatedQa.map((qa, idx) => (
          <div key={idx} className="flex items-start gap-2" aria-label={`প্রশ্ন উত্তর #${idx + 1}`}>
            <div className="w-6 text-center select-none pt-2 text-gray-600">{idx + 1}</div>
            <textarea
              rows={2}
              value={qa.question || ""}
              onChange={(e) => handleEditChange(idx, "question", e.target.value)}
              className="flex-1 p-1 border border-gray-400 rounded text-sm resize-none bg-white"
              placeholder="প্রশ্ন লিখুন (বাংলায়)"
              disabled={isGenerating}
            />
            <textarea
              rows={2}
              value={qa.answer || ""}
              onChange={(e) => handleEditChange(idx, "answer", e.target.value)}
              className="w-32 p-1 border border-gray-400 rounded text-sm resize-none text-center bg-white"
              placeholder="yes/no/idk"
              disabled={isGenerating}
            />
            <button
              onClick={() => handleDelete(idx)}
              className="text-red-600 text-lg font-bold leading-none hover:underline select-none"
              disabled={isGenerating}
              type="button"
              title="সারি মুছুন"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add to Dataset */}
      <button
        onClick={addParagraphData ? () => addParagraphData(paragraph, generatedQa) : undefined}
        className="mt-2 bg-green-600 text-white py-2 px-6 rounded text-sm hover:bg-green-700"
        disabled={isGenerating || !addParagraphData}
      >
        ডেটাসেটে যোগ করুন
      </button>

      {/* Help Modal */}
      <HelpModal
        show={showApiHelp}
        onClose={() => setShowApiHelp(false)}
        title="Gemini API Key পাওয়ার ধাপসমূহ"
        steps={[
          "<strong>ধাপ ১:</strong> আপনার Google অ্যাকাউন্টে লগইন করুন।",
          '<strong>ধাপ ২:</strong> যান <a href="https://aistudio.google.com" target="_blank" class="text-blue-600 underline">Google AI Studio</a> ওয়েবসাইটে।',
          '<strong>ধাপ ৩:</strong> “Get API key in Google AI Studio” বোতামটি ক্লিক করুন।',
          "<strong>ধাপ ৪:</strong> Terms of Service পড়ুন এবং সম্মতি দিন।",
          "<strong>ধাপ ৫:</strong> তৈরি হওয়া API key কপি করে এখানে পেস্ট করুন।",
        ]}
      />
    </div>
  );
};

export default InputData;