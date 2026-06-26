import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, CheckCircle, AlertTriangle, FileSpreadsheet, Info, HelpCircle } from 'lucide-react';
import { Product } from '../types';

interface ExportViewProps {
  products: Product[];
  onUploadExcel: (base64Data: string, fileName: string) => Promise<boolean>;
  loading: boolean;
}

export default function ExportView({
  products,
  onUploadExcel,
  loading,
}: ExportViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    // Validate extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      setUploadError('Invalid file format. Please upload a standard Excel file (.xlsx or .xls).');
      return;
    }

    // Convert file to Base64 to send to backend API
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = e.target?.result as string;
        // Split base64 prefix
        const base64Data = result.split(',')[1];
        
        const success = await onUploadExcel(base64Data, file.name);
        if (success) {
          setUploadSuccess(`Successfully synchronized inventory with "${file.name}"!`);
        } else {
          setUploadError('Failed to parse the uploaded Excel file. Please check file columns.');
        }
      } catch (err: any) {
        setUploadError(`Error processing file: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading file contents.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Import & Export Database</h1>
        <p className="text-sm text-gray-500 mt-1">Manage the core Excel sheet database. Download your latest catalogue or upload a new database file.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* --- EXPORT / DOWNLOAD CARD --- */}
        <div className="bg-white border border-gray-100 rounded-2xl card-shadow p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Export Current Catalogue</h2>
              <p className="text-xs text-gray-500">Download the live database file with latest edits.</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Database Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400 block text-xs">Total Products</span>
                <span className="font-semibold text-gray-800">{products.length} items</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs">Stock Integrity</span>
                <span className="font-semibold text-gray-800">
                  {products.filter(p => p.quantity > 0).length} of {products.length} active
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/api/download"
              download="inventory.xlsx"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Excel Database
            </a>
            <a
              href="/api/download-csv"
              download="inventory.csv"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              Export CSV Format
            </a>
          </div>

          {/* Quick Info Box */}
          <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl text-xs text-blue-800 flex gap-2.5">
            <Info className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Need to edit offline?</p>
              <p className="text-blue-700 leading-relaxed">
                Download the Excel database, make edits in Microsoft Excel or Google Sheets, and upload it back. The auto-generator will seamlessly parse it.
              </p>
            </div>
          </div>
        </div>

        {/* --- IMPORT / UPLOAD CARD --- */}
        <div className="bg-white border border-gray-100 rounded-2xl card-shadow p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Upload Excel Database</h2>
              <p className="text-xs text-gray-500">Synchronize database by uploading an Excel file.</p>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-gray-500" />
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Required Column Schema</h3>
            </div>
            <p className="text-xs text-gray-500">Your uploaded Excel file must have a single sheet containing exactly these 5 columns (matching case):</p>
            <div className="flex flex-wrap gap-1.5">
              {['Product ID', 'Product Name', 'Category', 'Price', 'Quantity'].map((col) => (
                <span key={col} className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-white border border-gray-200 text-gray-600">
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={handleButtonClick}
            className={`relative p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50/20'
                : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />

            {loading ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-gray-700">Parsing Excel Sheet...</p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-gray-50 rounded-full border border-gray-100 text-gray-400 group-hover:text-blue-500 transition-colors">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-700">
                    <span className="text-blue-600 hover:underline">Click to upload</span> or drag & drop Excel here
                  </p>
                  <p className="text-xs text-gray-400">Supports .xlsx and .xls formats</p>
                </div>
              </>
            )}
          </div>

          {/* Feedback messages */}
          {uploadError && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex gap-2.5">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{uploadError}</p>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex gap-2.5">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{uploadSuccess}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
