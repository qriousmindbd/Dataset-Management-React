import React, { useState, useEffect } from "react";
import HelpModal from "../components/HelpModal";
import NotificationModal from "../components/NotificationModal";

const QA_SCHEMA = {
  type: "OBJECT",
  properties: {
    generated_data: {
      type: "ARRAY",
      description: "প্রতিটি অনুচ্ছেদের জন্য তৈরি করা প্রশ্ন-উত্তর জোড়া।",
      items: {
        type: "OBJECT",
        properties: {
          paragraph_index: { type: "NUMBER", description: "মূল অনুচ্ছেদের ০-ভিত্তিক সূচক।" },
          qa_pairs: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                question: { type: "STRING", description: "বাংলায় একটি সংক্ষিপ্ত প্রশ্ন।" },
                answer: { type: "STRING", description: "উত্তরের জন্য 'হ্যাঁ', 'না' বা 'অজানা' ব্যবহার করুন।" },
                correct_answer: { type: "STRING", description: "প্যারাগ্রাফ থেকে এক বাক্যে সঠিক উত্তর।" },
              },
              required: ["question", "answer", "correct_answer"],
            },
          },
        },
        required: ["paragraph_index", "qa_pairs"],
      },
    },
  },
  required: ["generated_data"],
};

const API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";
const MAX_RETRIES = 5;

const InputData = ({
  apiKey,
  setApiKey,
  addParagraphData,
  paragraphDataSet,
  setLoading,
  setError,
}) => {
  const [globalCounts, setGlobalCounts] = useState(() => {
    const saved = localStorage.getItem('global_qa_counts');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          yes: parsed.yes || 1,
          no: parsed.no || 1,
          idk: parsed.idk || 0
        };
      }
    } catch (e) {
      console.error("Failed to parse global QA counts from localStorage", e);
    }
    return { yes: 1, no: 1, idk: 0 };
  });
  const [paragraphs, setParagraphs] = useState([
    { text: "", numYes: globalCounts.yes, numNo: globalCounts.no, numIdk: globalCounts.idk, qa: [] },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiHelp, setShowApiHelp] = useState(false);
  const [status, setStatus] = useState('');
  const [notification, setNotification] = useState(null);
  const [duplicateStatus, setDuplicateStatus] = useState({});

  // Persist global counts to localStorage
  useEffect(() => {
    localStorage.setItem('global_qa_counts', JSON.stringify(globalCounts));
  }, [globalCounts]);

  // Debounced duplicate check
  useEffect(() => {
    const handler = setTimeout(() => {
      const newDuplicateStatus = {};
      const existingParagraphs = Object.values(paragraphDataSet);

      paragraphs.forEach((p, index) => {
        const trimmedText = p.text.trim();
        if (!trimmedText) {
          newDuplicateStatus[index] = false;
          return;
        }

        const isDuplicateInDataSet = existingParagraphs.some(
          (existingPara) => existingPara.trim() === trimmedText
        );
        
        const isDuplicateInForm = paragraphs.some(
          (otherP, otherIndex) =>
            index !== otherIndex && otherP.text.trim() === trimmedText
        );

        newDuplicateStatus[index] = isDuplicateInDataSet || isDuplicateInForm;
      });

      setDuplicateStatus(newDuplicateStatus);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [paragraphs, paragraphDataSet]);


  // এটি অন্যত্র প্রয়োজন হলে সামঞ্জস্যের জন্য প্যারেন্টের একক অনুচ্ছেদ স্টেট সিঙ্ক করবে।
  // এই কম্পোনেন্টের জন্য, সমস্ত স্টেট `paragraphs` অ্যারে থেকে উদ্ভূত।
  // আমরা স্থানীয়ভাবে স্টেট পরিচালনা করব এবং শুধুমাত্র বাহ্যিক যোগাযোগের জন্য প্রপস ব্যবহার করব।
  
  const buildSystemPrompt = () => {
    const paragraphInputs = paragraphs.map((p, index) => ({
      paragraph_index: index,
      paragraph_text: p.text,
      qa_pairs_to_generate: {
        yes: p.numYes,
        no: p.numNo,
        idk: p.numIdk,
      },
      total_questions: p.numYes + p.numNo + p.numIdk,
    }));

    return `আপনি প্রশ্ন-উত্তর ডেটাসেটের জন্য একজন বিশেষজ্ঞ ডেটা জেনারেটর। আপনার কাজ হল প্রদত্ত বাংলা অনুচ্ছেদগুলির উপর ভিত্তি করে বাংলায় প্রশ্ন-উত্তর জোড়া তৈরি করা।

প্রদত্ত স্কিমা মেনে একটি একক JSON অবজেক্ট হিসাবে প্রতিক্রিয়া তৈরি করুন। রুট কী অবশ্যই "generated_data" হতে হবে।

ইনপুটে দেওয়া প্রতিটি অনুচ্ছেদের জন্য, নির্দিষ্ট সংখ্যক প্রশ্ন-উত্তর জোড়া তৈরি করুন। প্রতিটি প্রশ্নের উত্তর অবশ্যই অনুচ্ছেদের পাঠ্যের মধ্যেই থাকতে হবে।

**নিয়মাবলী:**
- "question": বাংলায় একটি সংক্ষিপ্ত প্রশ্ন তৈরি করুন।
- "answer": শুধুমাত্র "হ্যাঁ", "না", বা "অজানা" ব্যবহার করুন।
- "correct_answer": অনুচ্ছেদ থেকে নেওয়া বাংলায় একটি এক-বাক্যের সঠিক উত্তর দিন।

এখানে ইনপুট ডেটা দেওয়া হলো:
${JSON.stringify(paragraphInputs, null, 2)}
`;
  };

  const generateQa = async () => {
    if (!apiKey.trim()) {
      setError("অনুগ্রহ করে API কী ইনপুট দিন।");
      return;
    }
    if (paragraphs.some(p => !p.text.trim())) {
      setError("অনুগ্রহ করে সব প্যারাগ্রাফ ইনপুট দিন।");
      return;
    }
    if (Object.values(duplicateStatus).some(isDup => isDup)) {
      setError("ডুপ্লিকেট প্যারাগ্রাফ রয়েছে। জেনারেট করার আগে অনুগ্রহ করে সমাধান করুন।");
      return;
    }
    if (paragraphs.some(p => p.numYes < 0 || p.numNo < 0 || p.numIdk < 0 || (p.numYes + p.numNo + p.numIdk === 0))) {
      setError("সঠিক সংখ্যা দিন: প্রশ্ন সংখ্যা শূন্য হতে পারবে না।");
      return;
    }

    setLoading(true);
    // The duplicate check is now real-time, but we keep this as a final validation
    setStatus("ডুপ্লিকেট প্যারাগ্রাফ চেক করা হচ্ছে...");
    const hasDuplicates = Object.values(duplicateStatus).some(isDup => isDup);

    if (hasDuplicates) {
      setStatus("ডুপ্লিকেট প্যারাগ্রাফ পাওয়া গেছে। জেনারেশন বাতিল করা হয়েছে।");
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
      return;
    }

    setStatus("কোনো ডুপ্লিকেট প্যারাগ্রাফ পাওয়া যায়নি। জেনারেশন শুরু হচ্ছে...");
    setIsGenerating(true);
    setError(null);

    const systemPrompt = buildSystemPrompt();
    const payload = {
      // ব্যবহারকারীর বার্তা এখন সহজ হতে পারে কারণ মূল প্রসঙ্গটি সিস্টেম প্রম্পটে রয়েছে
      contents: [{ parts: [{ text: "নির্দেশাবলীর উপর ভিত্তি করে প্রশ্ন-উত্তর জোড়া তৈরি করুন।" }] }],
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
          const generatedData = data.generated_data || [];
          
          setParagraphs(prev => {
            const updatedParagraphs = [...prev];
            generatedData.forEach(item => {
              const pIndex = item.paragraph_index;
              if (updatedParagraphs[pIndex]) {
                 updatedParagraphs[pIndex].qa = item.qa_pairs || [];
              }
            });
            return updatedParagraphs;
          });

          setIsGenerating(false);
          setStatus('');
          setLoading(false);
          return;
        } else {
            setError("API উত্তর থেকে JSON বের করা যায়নি।");
        }
      } catch (err) {
        setError(`API ত্রুটি: ${err.message}. Attempt ${attempt + 1} of ${MAX_RETRIES}.`);
      }
    }
    setIsGenerating(false);
    setLoading(false);
    setStatus("জেনারেশন ব্যর্থ - সব চেষ্টা ব্যর্থ হয়েছে।");
    setTimeout(() => setStatus(''), 5000);
  };
  
  const updateParagraph = (index, field, value) => {
    const updated = [...paragraphs];
    if (field.startsWith("num")) {
        updated[index][field] = Math.max(0, +value);
    } else {
        updated[index][field] = value;
    }
    setParagraphs(updated);
  };

  const handleGlobalCountChange = (field, value) => {
    setGlobalCounts(prev => ({ ...prev, [field]: Math.max(0, +value) }));
  };

  const applyGlobalCounts = () => {
    setParagraphs(prev => 
      prev.map(p => ({
        ...p,
        numYes: globalCounts.yes,
        numNo: globalCounts.no,
        numIdk: globalCounts.idk,
      }))
    );
  };

  const addParagraph = () => {
    setParagraphs([...paragraphs, { 
      text: "", 
      numYes: globalCounts.yes, 
      numNo: globalCounts.no, 
      numIdk: globalCounts.idk, 
      qa: [] 
    }]);
  };

  const removeParagraph = (index) => {
    const updated = [...paragraphs];
    updated.splice(index, 1);
    setParagraphs(updated);

    // Also remove the duplicate status for the removed paragraph
    const newDuplicateStatus = { ...duplicateStatus };
    delete newDuplicateStatus[index];
    setDuplicateStatus(newDuplicateStatus);
  };

  const handleEditChange = (pIndex, qaIndex, field, value) => {
    const updated = [...paragraphs];
    updated[pIndex].qa[qaIndex][field] = value;
    setParagraphs(updated);
  };

  const handleDelete = (pIndex, qaIndex) => {
    const updated = [...paragraphs];
    updated[pIndex].qa.splice(qaIndex, 1);
    setParagraphs(updated);
  };

  const addRow = (pIndex) => {
    const updated = [...paragraphs];
    updated[pIndex].qa.push({ question: "", answer: "", correct_answer: "" });
    setParagraphs(updated);
  };

  const handleAddToDataset = () => {
    let addedCount = 0;
    paragraphs.forEach(p => {
        const filteredQa = p.qa.filter(
            (qa) =>
            qa.question?.trim() &&
            qa.answer?.trim() &&
            qa.correct_answer?.trim()
        );

        if (p.text.trim() && filteredQa.length > 0) {
            addParagraphData(p.text, filteredQa);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        setNotification(`${addedCount} টি প্যারাগ্রাফ ডেটাসেটে যোগ করা হয়েছে।`);
        // Clear the form after adding, using the global counts
        setParagraphs([{ text: "", numYes: globalCounts.yes, numNo: globalCounts.no, numIdk: globalCounts.idk, qa: [] }]);
    } else {
        setNotification("ডেটাসেটে যোগ করার জন্য কোনো বৈধ প্যারাগ্রাফ বা প্রশ্ন-উত্তর পাওয়া যায়নি।");
    }
  };

  const hasAnyDuplicates = Object.values(duplicateStatus).some(isDup => isDup);
  const canGenerate = !isGenerating && apiKey.trim() && paragraphs.every(p => p.text.trim()) && !hasAnyDuplicates;
  const canAddToDataset = !isGenerating && paragraphs.some(p => p.text.trim() && p.qa.length > 0);

  return (
    <div className="space-y-6">
      {/* API Key */}
      <div>
        <label className="flex items-center gap-2 mb-1 font-semibold text-sm">
          জেমিনি API কী
          <button
            type="button"
            onClick={() => setShowApiHelp(true)}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold text-xs"
            title="জেমিনি API কী সাহায্য"
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

      {/* Global Question Counts */}
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <h3 className="font-semibold mb-2 text-sm">সকলের জন্য প্রশ্ন সংখ্যা সেট করুন</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[80px]">
            <label className="block mb-1 font-semibold text-xs">হ্যাঁ</label>
            <input type="number" min={0} className="w-full p-1 border border-gray-300 rounded text-center bg-white dark:bg-gray-700 dark:text-gray-100 text-sm" value={globalCounts.yes} onChange={(e) => handleGlobalCountChange('yes', e.target.value)} disabled={isGenerating}/>
          </div>
          <div className="min-w-[80px]">
            <label className="block mb-1 font-semibold text-xs">না</label>
            <input type="number" min={0} className="w-full p-1 border border-gray-300 rounded text-center bg-white dark:bg-gray-700 dark:text-gray-100 text-sm" value={globalCounts.no} onChange={(e) => handleGlobalCountChange('no', e.target.value)} disabled={isGenerating}/>
          </div>
          <div className="min-w-[80px]">
            <label className="block mb-1 font-semibold text-xs">অজানা</label>
            <input type="number" min={0} className="w-full p-1 border border-gray-300 rounded text-center bg-white dark:bg-gray-700 dark:text-gray-100 text-sm" value={globalCounts.idk} onChange={(e) => handleGlobalCountChange('idk', e.target.value)} disabled={isGenerating}/>
          </div>
          <button
            onClick={applyGlobalCounts}
            className="px-4 py-2 rounded text-white font-semibold text-sm bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400"
            disabled={isGenerating}
          >
            সবার জন্য সেট
          </button>
        </div>
      </div>

      {/* Dynamic Paragraphs Section */}
      <div className="space-y-6">
        {paragraphs.map((p, pIndex) => (
          <div key={pIndex} className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg space-y-4 bg-gray-50 dark:bg-gray-800/50 relative">
            <div className="flex justify-between items-center">
                 <h3 className="font-semibold text-gray-800 dark:text-gray-200">প্যারাগ্রাফ #{pIndex + 1}</h3>
                 {paragraphs.length > 1 && (
                    <button onClick={() => removeParagraph(pIndex)} className="text-red-500 hover:text-red-700 font-bold" disabled={isGenerating}>মুছুন</button>
                 )}
            </div>
            
            {/* Paragraph and question counts */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                    <label className="block mb-1 font-semibold text-sm">প্যারাগ্রাফ (বাংলায়)</label>
                    <textarea
                        rows={6}
                        placeholder="প্যারাগ্রাফ লিখুন"
                        className={`w-full p-2 border rounded text-sm resize-y bg-white dark:bg-gray-700 dark:text-gray-100 ${duplicateStatus[pIndex] ? 'border-red-500' : 'border-gray-300'}`}
                        value={p.text}
                        onChange={(e) => updateParagraph(pIndex, "text", e.target.value)}
                        disabled={isGenerating}
                    />
                     {duplicateStatus[pIndex] && (
                        <p className="text-red-500 text-sm mt-1">এই প্যারাগ্রাফটি ডুপ্লিকেট।</p>
                    )}
                </div>
                <div className="flex flex-row md:flex-col gap-2">
                    <div className="min-w-[80px]">
                        <label className="block mb-1 font-semibold text-xs">হ্যাঁ</label>
                        <input type="number" min={0} className="w-full p-1 border border-gray-300 rounded text-center bg-white dark:bg-gray-700 dark:text-gray-100 text-sm" value={p.numYes} onChange={(e) => updateParagraph(pIndex, "numYes", e.target.value)} disabled={isGenerating}/>
                    </div>
                    <div className="min-w-[80px]">
                        <label className="block mb-1 font-semibold text-xs">না</label>
                        <input type="number" min={0} className="w-full p-1 border border-gray-300 rounded text-center bg-white dark:bg-gray-700 dark:text-gray-100 text-sm" value={p.numNo} onChange={(e) => updateParagraph(pIndex, "numNo", e.target.value)} disabled={isGenerating}/>
                    </div>
                    <div className="min-w-[80px]">
                        <label className="block mb-1 font-semibold text-xs">অজানা</label>
                        <input type="number" min={0} className="w-full p-1 border border-gray-300 rounded text-center bg-white dark:bg-gray-700 dark:text-gray-100 text-sm" value={p.numIdk} onChange={(e) => updateParagraph(pIndex, "numIdk", e.target.value)} disabled={isGenerating}/>
                    </div>
                </div>
            </div>

            {/* Q&A editor for this paragraph */}
            {p.qa.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-sm">প্রশ্ন-উত্তর সম্পাদনা</h4>
                     <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                        {p.qa.map((qa, qaIndex) => (
                        <div key={qaIndex} className="flex items-start gap-2" aria-label={`প্রশ্ন উত্তর #${qaIndex + 1}`}>
                            <div className="w-5 text-center select-none pt-2 text-gray-600 dark:text-gray-400 text-xs">{qaIndex + 1}</div>
                            <textarea rows={2} value={qa.question || ""} onChange={(e) => handleEditChange(pIndex, qaIndex, "question", e.target.value)} className="w-full p-1 border border-gray-400 dark:border-gray-600 rounded text-sm resize-none bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="প্রশ্ন" disabled={isGenerating}/>
                            <textarea rows={2} value={qa.answer || ""} onChange={(e) => handleEditChange(pIndex, qaIndex, "answer", e.target.value)} className="w-28 p-1 border border-gray-400 dark:border-gray-600 rounded text-sm resize-none text-center bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="হ্যাঁ/না/অজানা" disabled={isGenerating}/>
                            <textarea rows={2} value={qa.correct_answer || ""} onChange={(e) => handleEditChange(pIndex, qaIndex, "correct_answer", e.target.value)} className="w-full p-1 border border-gray-400 dark:border-gray-600 rounded text-sm resize-none bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="সঠিক উত্তর" disabled={isGenerating}/>
                            <button onClick={() => handleDelete(pIndex, qaIndex)} className="text-red-500 hover:text-red-700 font-bold p-2" disabled={isGenerating} type="button" title="সারি মুছুন">❌</button>
                        </div>
                        ))}
                     </div>
                </div>
            )}
             <button onClick={() => addRow(pIndex)} className="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" type="button" disabled={isGenerating}>
                নতুন প্রশ্ন যোগ করুন
            </button>
          </div>
        ))}
        
        <div className="flex flex-wrap gap-4">
            <button onClick={addParagraph} className="py-2 px-4 rounded text-indigo-600 font-semibold border border-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-500 dark:hover:bg-indigo-900/50" disabled={isGenerating}>
                + নতুন প্যারাগ্রাফ যোগ করুন
            </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 items-center mt-6">
          <button
            onClick={generateQa}
            disabled={!canGenerate}
            className="py-3 px-6 rounded text-white font-semibold flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {isGenerating ? "জেনারেশন হচ্ছে..." : "জেনারেট"}
          </button>
          <button
            onClick={handleAddToDataset}
            className="py-3 px-6 rounded text-white font-semibold bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
            disabled={!canAddToDataset}
          >
            ডেটাসেটে যোগ করুন
          </button>
      </div>
      
      {status && <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{status}</div>}

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