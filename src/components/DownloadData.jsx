import React from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { CSVLink } from "react-csv";

const DownloadData = ({ paragraphDataSet, questionAnswerData }) => {
  const downloadJSON = (content, filename) => {
    try {
      if (!content || (Array.isArray(content) && content.length === 0)) {
        throw new Error("No data to download.");
      }
      const blob = new Blob([JSON.stringify(content, null, 2)], {
        type: "application/json",
      });
      saveAs(blob, filename);
    } catch (error) {
      alert("JSON ডাউনলোডে সমস্যা হয়েছে: " + error.message);
      console.error("JSON Download Error:", error);
    }
  };

  const downloadXLSX = (data, filename) => {
    try {
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error("No data to download.");
      }

      let xlsxData = [];
      if (Array.isArray(data)) {
        xlsxData = data;
      } else if (typeof data === "object") {
        xlsxData = Object.entries(data).map(([key, value]) => ({
          key,
          value: typeof value === "object" ? JSON.stringify(value) : value,
        }));
      } else {
        throw new Error("Unsupported data format for XLSX");
      }

      const worksheet = XLSX.utils.json_to_sheet(xlsxData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      saveAs(blob, filename);
    } catch (error) {
      alert("XLSX ডাউনলোডে সমস্যা হয়েছে: " + error.message);
      console.error("XLSX Download Error:", error);
    }
  };

  // Fixed merge function - properly matches paragraphs using paragraphKey
  const mergeDatasets = () => {
    const merged = [];
    const paragraphs =
      typeof paragraphDataSet === "object" && paragraphDataSet !== null
        ? paragraphDataSet
        : {};

    const questions = Array.isArray(questionAnswerData) ? questionAnswerData : [];

    // Create merged dataset with proper paragraph matching via paragraphKey
    questions.forEach((qa) => {
      merged.push({
        paragraph: paragraphs[qa.paragraphKey] || "",
        question: qa.question || "",
        answer: qa.answer || "",
        correct_answer: qa.correct_answer || "",
      });
    });

    return merged;
  };

  const paragraphCsvData =
    typeof paragraphDataSet === "object" && paragraphDataSet !== null
      ? Object.entries(paragraphDataSet).map(([key, value]) => ({
          id: key,
          paragraph: value,
        }))
      : [];

  const safeQuestionAnswerData = Array.isArray(questionAnswerData)
    ? questionAnswerData
    : [];

  const mergedData = mergeDatasets();

  return (
    <div className="p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded shadow max-w-4xl mx-auto transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-300">
        ডেটাসেট ডাউনলোড করুন
      </h2>

      {/* Merged Dataset Section */}
      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200 text-sm">
          সম্পূর্ণ মার্জড ডেটাসেট <span className="text-xs text-gray-500">({mergedData.length} আইটেম)</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => downloadJSON(mergedData, "merged_dataset.json")}
            className="flex-1 py-2 px-3 bg-green-600 dark:bg-green-500 text-white rounded text-sm hover:bg-green-700 dark:hover:bg-green-400 transition-colors"
          >
            JSON
          </button>
          <CSVLink
            data={mergedData}
            filename={"merged_dataset.csv"}
            className="flex-1 text-center py-2 px-3 bg-green-500 dark:bg-green-600 text-white rounded text-sm hover:bg-green-600 dark:hover:bg-green-500 transition-colors"
            onClick={(event) => {
              if (!mergedData.length) {
                event.preventDefault();
                alert("CSV ডাউনলোডের জন্য কোনো ডেটা নেই।");
              }
            }}
          >
            CSV
          </CSVLink>
          <button
            onClick={() => downloadXLSX(mergedData, "merged_dataset.xlsx")}
            className="flex-1 py-2 px-3 bg-green-700 dark:bg-green-800 text-white rounded text-sm hover:bg-green-800 dark:hover:bg-green-700 transition-colors"
          >
            XLSX
          </button>
        </div>
      </div>

      {/* Paragraph Dataset Section */}
      <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 dark:border-indigo-800">
        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200 text-sm">
          প্যারাগ্রাফ ডেটাসেট <span className="text-xs text-gray-500">({paragraphCsvData.length} আইটেম)</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => downloadJSON(paragraphDataSet, "paragraph_dataset.json")}
            className="flex-1 py-2 px-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded text-sm hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors"
          >
            JSON
          </button>
          <CSVLink
            data={paragraphCsvData}
            filename={"paragraph_dataset.csv"}
            className="flex-1 text-center py-2 px-3 bg-yellow-500 dark:bg-yellow-600 text-white rounded text-sm hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-colors"
            onClick={(event) => {
              if (!paragraphCsvData.length) {
                event.preventDefault();
                alert("CSV ডাউনলোডের জন্য কোনো ডেটা নেই।");
              }
            }}
          >
            CSV
          </CSVLink>
          <button
            onClick={() => downloadXLSX(paragraphDataSet, "paragraph_dataset.xlsx")}
            className="flex-1 py-2 px-3 bg-pink-600 dark:bg-pink-500 text-white rounded text-sm hover:bg-pink-700 dark:hover:bg-pink-400 transition-colors"
          >
            XLSX
          </button>
        </div>
      </div>

      {/* QA Dataset Section */}
      <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200 text-sm">
          প্রশ্ন-উত্তর ডেটাসেট <span className="text-xs text-gray-500">({safeQuestionAnswerData.length} আইটেম)</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => downloadJSON(questionAnswerData, "qa_dataset.json")}
            className="flex-1 py-2 px-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded text-sm hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors"
          >
            JSON
          </button>
          <CSVLink
            data={safeQuestionAnswerData}
            filename={"qa_dataset.csv"}
            className="flex-1 text-center py-2 px-3 bg-yellow-500 dark:bg-yellow-600 text-white rounded text-sm hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-colors"
            onClick={(event) => {
              if (!safeQuestionAnswerData.length) {
                event.preventDefault();
                alert("CSV ডাউনলোডের জন্য কোনো ডেটা নেই।");
              }
            }}
          >
            CSV
          </CSVLink>
          <button
            onClick={() => downloadXLSX(questionAnswerData, "qa_dataset.xlsx")}
            className="flex-1 py-2 px-3 bg-pink-600 dark:bg-pink-500 text-white rounded text-sm hover:bg-pink-700 dark:hover:bg-pink-400 transition-colors"
          >
            XLSX
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadData;