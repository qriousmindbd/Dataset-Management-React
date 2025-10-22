import React from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { CSVLink } from "react-csv";

const DownloadData = ({ paragraphDataSet, questionAnswerData }) => {
  const downloadJSON = (content, filename) => {
    try {
      if (!content) throw new Error("No data to download.");
      const blob = new Blob([JSON.stringify(content, null, 2)], {
        type: "application/json",
      });
      saveAs(blob, filename);
    } catch (error) {
      alert("JSON ডাউনলোডে সমস্যা হয়েছে: " + error.message);
      console.error("JSON Download Error:", error);
    }
  };

  const downloadXLSX = (data, filename) => {
    try {
      if (!data) throw new Error("No data to download.");

      // Ensure data is an array of objects for XLSX
      let xlsxData = [];
      if (Array.isArray(data)) {
        xlsxData = data;
      } else if (typeof data === "object") {
        // Convert object to an array of {key, value} or flatten accordingly
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
      alert("XLSX ডাউনলোডে সমস্যা হয়েছে: " + error.message);
      console.error("XLSX Download Error:", error);
    }
  };

  // Transform paragraphDataSet (object map) into an array suitable for CSV
  const paragraphCsvData = Array.isArray(paragraphDataSet)
    ? paragraphDataSet
    : typeof paragraphDataSet === "object" && paragraphDataSet !== null
    ? Object.entries(paragraphDataSet).map(([key, value]) => ({
        id: key,
        paragraph: value,
      }))
    : [];

  // Defensive checks for CSVLink data
  const safeParagraphDataSet = paragraphCsvData;
  const safeQuestionAnswerData = Array.isArray(questionAnswerData)
    ? questionAnswerData
    : [];

  return (
    <div className="p-6 bg-white rounded shadow max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">ডেটাসেট ডাউনলোড করুন</h2>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">প্যারাগ্রাফ ডেটাসেট</h3>
        <button
          onClick={() => downloadJSON(paragraphDataSet, "paragraph_dataset.json")}
          className="w-full py-3 bg-indigo-600 text-white rounded mb-2 hover:bg-indigo-700"
        >
          JSON ডাউনলোড করুন
        </button>
        <CSVLink
          data={safeParagraphDataSet}
          filename={"paragraph_dataset.csv"}
          className="w-full py-3 bg-yellow-500 text-white rounded mb-2 inline-block text-center hover:bg-yellow-600"
          onClick={(event) => {
            if (!safeParagraphDataSet.length) {
              event.preventDefault();
              alert("CSV ডাউনলোডের জন্য কোনো ডেটা নেই।");
            }
          }}
        >
          CSV ডাউনলোড করুন
        </CSVLink>
        <button
          onClick={() => downloadXLSX(paragraphDataSet, "paragraph_dataset.xlsx")}
          className="w-full py-3 bg-pink-600 text-white rounded hover:bg-pink-700"
        >
          XLSX ডাউনলোড করুন
        </button>
      </div>

      <div>
        <h3 className="font-semibold mb-2">প্রশ্ন-উত্তর ডেটাসেট</h3>
        <button
          onClick={() => downloadJSON(questionAnswerData, "qa_dataset.json")}
          className="w-full py-3 bg-indigo-600 text-white rounded mb-2 hover:bg-indigo-700"
        >
          JSON ডাউনলোড করুন
        </button>
        <CSVLink
          data={safeQuestionAnswerData}
          filename={"qa_dataset.csv"}
          className="w-full py-3 bg-yellow-500 text-white rounded mb-2 inline-block text-center hover:bg-yellow-600"
          onClick={(event) => {
            if (!safeQuestionAnswerData.length) {
              event.preventDefault();
              alert("CSV ডাউনলোডের জন্য কোনো ডেটা নেই।");
            }
          }}
        >
          CSV ডাউনলোড করুন
        </CSVLink>
        <button
          onClick={() => downloadXLSX(questionAnswerData, "qa_dataset.xlsx")}
          className="w-full py-3 bg-pink-600 text-white rounded hover:bg-pink-700"
        >
          XLSX ডাউনলোড করুন
        </button>
      </div>
    </div>
  );
};

export default DownloadData;