/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUp, FileText, CheckCircle, XCircle, AlertCircle, Loader2, Sparkles, RefreshCcw, Trash2, ChevronDown, ChevronUp, Menu, Bell, User } from 'lucide-react';
import { analyzeCV, CVAnalysisResult } from './lib/gemini';

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<CVAnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedResult, setExpandedResult] = useState<number | null>(0);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const processFiles = (selectedFiles: FileList | File[]) => {
    const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const newFiles: File[] = [];
    let hasError = false;

    Array.from(selectedFiles).forEach(file => {
      if (!validTypes.includes(file.type)) {
        hasError = true;
      } else if (file.size > 10 * 1024 * 1024) { // 10MB
        hasError = true;
      } else {
        if (!files.some(f => f.name === file.name && f.size === file.size)) {
           newFiles.push(file);
        }
      }
    });

    if (hasError) {
      setError("تم استبعاد بعض الملفات لأن صيغتها غير مدعومة أو حجمها يتجاوز 10 ميغابايت.");
    } else {
      setError(null);
    }
    
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
    setResults([]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzeUpload = async () => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setError(null);
    setResults([]);
    setExpandedResult(0);

    try {
      const allResults: CVAnalysisResult[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const analysisResult = await analyzeCV(file, jobDescription, jobRequirements);
        allResults.push({ ...analysisResult, fileName: file.name });
      }
      allResults.sort((a, b) => b.score - a.score);
      setResults(allResults);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ غير متوقع أثناء تحليل السير الذاتية. الرجاء المحاولة مرة أخرى.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAll = () => {
    setFiles([]);
    setResults([]);
    setError(null);
    setJobDescription('');
    setJobRequirements('');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1625] flex flex-col font-sans text-slate-100 font-bold relative overflow-hidden" dir="rtl">
      {/* Background Watermark */}
      <div className="fixed bottom-0 top-0 left-0 right-0 flex items-center justify-center opacity-[0.04] pointer-events-none z-0">
        <img src="/logo.png" alt="Watermark" className="w-[500px] h-auto grayscale mix-blend-overlay" />
      </div>

      {/* App Navigation Bar */}
      <nav className="bg-[#251f34]/80 backdrop-blur-md border-b border-purple-800/40 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 focus:outline-none lg:hidden relative z-20">
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex-shrink-0 flex items-center gap-2 relative z-20">
                <img src="/logo.png" alt="Farmetio Logo" className="h-10 w-auto drop-shadow-md object-contain" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors relative z-20">
                <Bell className="h-5 w-5" />
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 relative z-20">
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main App Content */}
      <div className="flex-grow flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 gap-8 relative z-10">
        
        {/* App Sidebar / Info Area (Optional for larger screens) */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="bg-[#251f34] rounded-2xl shadow-lg border border-purple-800/40 p-6 sticky top-24">
            <div className="flex flex-col items-center text-center pb-6 border-b border-purple-800/40">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-100 mb-1">مُقيّم السير الذاتية</h2>
              <p className="text-sm text-slate-400">حكاية خير - مدعوم بالذكاء الاصطناعي</p>
            </div>
            <div className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">تحليل متعدد</h4>
                  <p className="text-xs text-slate-400 mt-0.5">ارفع سير ذاتية متعددة ليتم تحليلها ومقارنتها في نفس الوقت.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">دقة عالية</h4>
                  <p className="text-xs text-slate-400 mt-0.5">تقييم دقيق بناءً على الوصف الوظيفي والشروط المحددة.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Work Area */}
        <main className="flex-grow flex flex-col w-full max-w-3xl lg:max-w-none mx-auto">
          <AnimatePresence mode="wait">
            {results.length === 0 ? (
              <motion.div 
                key="upload-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full bg-[#251f34] p-6 sm:p-8 rounded-3xl shadow-lg border border-purple-800/40"
              >
                <div className="mb-8 lg:hidden text-center">
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-cyan-400 mb-2">
                    مُقيّم السير الذاتية الذكي
                  </h1>
                  <p className="text-sm text-slate-400">
                    ارفع ملفات السير الذاتية (CVs) وأدخل تفاصيل الوظيفة ليقوم الذكاء الاصطناعي بتحليلها
                  </p>
                </div>

                {!isAnalyzing ? (
                  <div className="space-y-8">
                    {error && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl flex gap-3 text-rose-400 items-start shadow-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-bold">{error}</p>
                      </motion.div>
                    )}

                    {/* Job Details Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/20">
                          <span className="font-bold text-sm">1</span>
                        </div>
                        <div>
                          <h2 className="font-bold text-slate-100">تفاصيل الوظيفة</h2>
                          <p className="text-xs text-slate-400">أدخل متطلبات الوظيفة للمطابقة (اختياري)</p>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-slate-300">الوصف الوظيفي</label>
                          <textarea 
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="مثال: نبحث عن مهندس برمجيات واجهات أمامية بخبرة في React..."
                            className="w-full min-h-[120px] p-4 text-sm border border-purple-800/50 bg-[#1e192c] text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-[#251f34] outline-none transition-all placeholder:text-slate-500 resize-none font-bold"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-slate-300">شروط الوظيفة</label>
                          <textarea 
                            value={jobRequirements}
                            onChange={(e) => setJobRequirements(e.target.value)}
                            placeholder="مثال: خبرة 3 سنوات، إجادة اللغة الإنجليزية، بكالوريوس..."
                            className="w-full min-h-[120px] p-4 text-sm border border-purple-800/50 bg-[#1e192c] text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:bg-[#251f34] outline-none transition-all placeholder:text-slate-500 resize-none font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-purple-800/40 my-4"></div>

                    {/* File Upload Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                          <span className="font-bold text-sm">2</span>
                        </div>
                        <div>
                          <h2 className="font-bold text-slate-100">السير الذاتية</h2>
                          <p className="text-xs text-slate-400">ارفع الملفات (PDF, Word, TXT)</p>
                        </div>
                      </div>

                      <div 
                        className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center group ${
                          isDragActive ? 'border-cyan-500 bg-cyan-900/10 ring-4 ring-cyan-500/10' : 
                          'border-purple-800/50 hover:border-cyan-500 bg-[#1e192c] hover:bg-cyan-900/5 shadow-inner'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input 
                          type="file" 
                          multiple
                          className="hidden" 
                          ref={fileInputRef}
                          accept=".pdf,.txt,.doc,.docx"
                          onChange={handleFileChange}
                        />
                        <div className="w-16 h-16 mb-4 rounded-full bg-[#251f34] border border-purple-800/40 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all text-slate-400">
                          <FileUp className="w-8 h-8" />
                        </div>
                        <p className="text-base font-bold text-slate-200 mb-1 group-hover:text-cyan-400 transition-colors">اسحب وأفلت الملفات هنا</p>
                        <p className="text-sm text-slate-500">أو انقر لتصفح الملفات من جهازك</p>
                      </div>

                      {/* File List */}
                      {files.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-300">الملفات المرفقة ({files.length})</h3>
                            <button onClick={() => setFiles([])} className="text-xs text-rose-400 hover:text-rose-300 font-bold">مسح الكل</button>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {files.map((f, idx) => (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                key={idx} 
                                className="flex items-center justify-between p-3 bg-[#1e192c] border border-purple-800/40 rounded-xl shadow-sm hover:border-cyan-500/50 hover:shadow-cyan-500/10 transition-all group"
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="p-2 bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 text-cyan-400 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="flex flex-col overflow-hidden">
                                    <span className="font-bold text-sm text-slate-200 truncate" dir="ltr" title={f.name}>{f.name}</span>
                                    <span className="text-xs text-slate-500">
                                      {(f.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                  </div>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                  className="text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                  title="حذف الملف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Action Button */}
                      <div className="mt-8 flex justify-end pt-4">
                        <button 
                          onClick={handleAnalyzeUpload}
                          disabled={files.length === 0}
                          className="px-8 py-3.5 bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none w-full sm:w-auto text-lg"
                        >
                          <Sparkles className="w-5 h-5" />
                          تحليل {files.length ? files.length : ''} ملفات الآن
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center min-h-[400px]">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                      <div className="w-20 h-20 bg-[#251f34] rounded-2xl shadow-lg border border-cyan-500/30 flex items-center justify-center relative z-10">
                        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-100 mb-2">جاري التحليل المعمق...</h3>
                    <p className="text-slate-400 text-lg font-medium max-w-md">
                      يقوم محرك الذكاء الاصطناعي الآن بقراءة وتحليل {files.length} سير ذاتية والمطابقة مع متطلباتك.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="results-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between bg-[#251f34] px-6 py-4 rounded-2xl shadow-lg border border-purple-800/40">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-500/20">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-100">نتائج التحليل</h2>
                      <p className="text-sm text-slate-400">تم تقييم {results.length} سيرة ذاتية</p>
                    </div>
                  </div>
                  <button 
                    onClick={resetAll}
                    className="mt-4 sm:mt-0 flex items-center gap-2 px-5 py-2.5 bg-[#1e192c] hover:bg-[#2e2642] text-cyan-400 font-bold rounded-xl transition-all border border-cyan-500/30"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    تحليل جديد
                  </button>
                </div>

                <div className="grid gap-6">
                  {results.map((result, idx) => {
                    const isExpanded = expandedResult === idx;
                    return (
                      <div key={idx} className={`bg-[#1e192c] rounded-3xl shadow-sm border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-cyan-500/50 ring-4 ring-cyan-500/10' : 'border-purple-800/40 hover:border-cyan-500/50'}`}>
                        {/* Result Header - Clickable for Accordion */}
                        <button 
                          onClick={() => setExpandedResult(isExpanded ? null : idx)}
                          className="w-full px-6 py-5 flex items-center justify-between text-right bg-[#1e192c] hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-5">
                            <div className="relative">
                              <svg className="w-16 h-16 drop-shadow-sm transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-slate-800"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                />
                                <motion.path
                                  className={`${
                                    result.score >= 80 ? 'text-emerald-400' :
                                    result.score >= 60 ? 'text-amber-400' :
                                    'text-rose-400'
                                  }`}
                                  initial={{ strokeDasharray: `0, 100` }}
                                  animate={{ strokeDasharray: `${result.score}, 100` }}
                                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <motion.span 
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.5, delay: 0.5 }}
                                  className="text-lg font-bold text-slate-100 leading-none"
                                >
                                  {result.score}
                                </motion.span>
                              </div>
                            </div>
                            
                            <div className="mr-2 text-right">
                              <span className="font-bold text-lg text-slate-100 block mb-0.5 line-clamp-1" dir="ltr">{result.fileName}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                    result.score >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                                    result.score >= 60 ? 'bg-amber-500/20 text-amber-300' :
                                    'bg-rose-500/20 text-rose-300'
                                }`}>
                                  {result.score >= 80 ? 'مطابقة عالية' : result.score >= 60 ? 'مطابقة متوسطة' : 'مطابقة ضعيفة'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400'}`}>
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </button>

                        {/* Result Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                            >
                              <div className="px-6 sm:px-8 pb-8 pt-4 border-t border-purple-800/40 bg-[#1a1625]">
                                {/* Summary */}
                                <section className="mb-8 bg-[#251f34] p-5 rounded-2xl border border-purple-800/40">
                                  <h3 className="text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    الملخص الإداري
                                  </h3>
                                  <p className="text-slate-300 leading-relaxed font-bold">
                                    {result.summary}
                                  </p>
                                </section>

                                <div className="grid md:grid-cols-2 gap-6">
                                  {/* Strengths */}
                                  <section className="bg-emerald-950/20 rounded-2xl p-5 border border-emerald-900/50 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-900/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                                    <h3 className="text-base font-bold text-emerald-400 mb-4 flex items-center gap-2 relative z-10">
                                      <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-4 h-4" /></div>
                                      نقاط القوة
                                    </h3>
                                    <ul className="space-y-3 relative z-10">
                                      {result.strengths.map((strength, sIdx) => (
                                        <li key={sIdx} className="flex gap-3 text-slate-300 text-sm font-bold leading-snug items-start">
                                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 block" />
                                          {strength}
                                        </li>
                                      ))}
                                    </ul>
                                  </section>

                                  {/* Weaknesses */}
                                  <section className="bg-rose-950/20 rounded-2xl p-5 border border-rose-900/50 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-900/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                                    <h3 className="text-base font-bold text-rose-400 mb-4 flex items-center gap-2 relative z-10">
                                      <div className="p-1.5 bg-rose-500/20 rounded-lg text-rose-400 border border-rose-500/20"><XCircle className="w-4 h-4" /></div>
                                      نقاط تحتاج تطوير
                                    </h3>
                                    <ul className="space-y-3 relative z-10">
                                      {result.weaknesses.map((weakness, wIdx) => (
                                        <li key={wIdx} className="flex gap-3 text-slate-300 text-sm font-bold leading-snug items-start">
                                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 block" />
                                          {weakness}
                                        </li>
                                      ))}
                                    </ul>
                                  </section>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

