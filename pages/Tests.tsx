
import React, { useState, useRef, useEffect } from 'react';
import { Beaker, Search, Plus, CheckCircle, BrainCircuit, MapPin, FileUp, FileCheck, Loader2, AlertCircle, FlaskConical, TestTube } from 'lucide-react';
import { LabTest } from '../types';
import { analyzeLabResults } from '../services/geminiService';

const CHEMICAL_TEST_TEMPLATES = [
  { name: "S. Creatinine (وظائف كلى)", unit: "mg/dL", range: "0.7 - 1.3" },
  { name: "SGPT / ALT (أنزيمات كبد)", unit: "U/L", range: "Up to 41" },
  { name: "Fasting Blood Sugar (سكر صائم)", unit: "mg/dL", range: "70 - 105" },
  { name: "Total Cholesterol (كوليسترول)", unit: "mg/dL", range: "Up to 200" },
  { name: "Uric Acid (حمض البوليك)", unit: "mg/dL", range: "3.4 - 7.0" },
  { name: "HbA1c (السكر التراكمي)", unit: "%", range: "4.8 - 5.6" }
];

const Tests = () => {
  const [tests, setTests] = useState<LabTest[]>(() => {
    const saved = localStorage.getItem('lab_all_tests');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resultInput, setResultInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('lab_all_tests', JSON.stringify(tests));
  }, [tests]);

  const filteredTests = tests.filter(t => 
    t.testName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.includes(searchTerm)
  );

  const handleAIAnalyze = async (test: LabTest) => {
    if (!test.resultValue || !test.referenceRange) return;
    setIsAnalyzing(true);
    const analysis = await analyzeLabResults(test.testName, test.resultValue, test.referenceRange);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const handleSaveResult = () => {
    if (!selectedTest || !resultInput) return;
    const updatedTests = tests.map(t => t.id === selectedTest.id ? { ...t, status: 'مكتمل' as const, resultValue: resultInput } : t);
    setTests(updatedTests);
    setSelectedTest({ ...selectedTest, status: 'مكتمل', resultValue: resultInput });
    setResultInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTest) return;

    if (file.type !== 'application/pdf') {
      alert('يرجى اختيار ملف بصيغة PDF فقط');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      const updatedTests = tests.map(t => 
        t.id === selectedTest.id ? { ...t, pdfUrl: base64String, status: 'مكتمل' as const } : t
      );
      setTests(updatedTests);
      setSelectedTest({ ...selectedTest, pdfUrl: base64String, status: 'مكتمل' });
      setIsUploading(false);
      alert('تم رفع تقرير الكيمياء بنجاح');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">قسم الكيمياء الحيوية</h2>
          <p className="text-gray-500 font-bold">إدارة عينات الدم، تحليل النتائج، والتقارير الكيميائية</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-[1.8rem] font-black flex items-center gap-2 shadow-2xl shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={22} />
          <span>طلب تحليل كيميائي</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative">
            <Search className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
            <input 
              type="text" 
              placeholder="بحث برقم العينة (Barcode) أو اسم الفحص..." 
              className="w-full pr-16 pl-6 py-5 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 font-bold text-gray-800" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
            {filteredTests.length > 0 ? filteredTests.map((test) => (
              <div 
                key={test.id} 
                onClick={() => { setSelectedTest(test); setAiAnalysis(null); setResultInput(''); }} 
                className={`p-8 cursor-pointer transition-all flex items-center justify-between border-b border-gray-50 last:border-0 ${selectedTest?.id === test.id ? 'bg-blue-50/70 border-r-8 border-r-blue-600' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg ${test.status === 'مكتمل' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {test.status === 'مكتمل' ? <CheckCircle size={32} /> : <FlaskConical size={32} />}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-xl">{test.testName}</h4>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mt-2">
                      <span className="bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">Sample ID: {test.id}</span>
                      {test.pdfUrl && <span className="flex items-center gap-1 text-blue-600 font-black"><FileCheck size={14} /> تقرير PDF جاهز</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider ${test.status === 'مكتمل' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {test.status}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">{test.date}</span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-32 text-gray-300">
                <div className="bg-slate-50 p-10 rounded-[3rem] mb-6">
                  <TestTube size={64} className="opacity-10" />
                </div>
                <p className="font-black text-xl">لا توجد عينات قيد التحليل حالياً</p>
                <p className="text-sm font-bold mt-2">يمكنك بدء تسجيل العينات من زر "طلب تحليل كيميائي"</p>
              </div>
            )}
          </div>
        </div>

        <div className="sticky top-6 h-fit">
          {selectedTest ? (
            <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-2xl animate-fadeIn space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 to-indigo-700" />
              <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                <h3 className="text-2xl font-black text-gray-900">تجهيز النتائج</h3>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">كيميائي: فارس</span>
              </div>
              
              <div className="space-y-6">
                {selectedTest.status === 'مكتمل' && (
                   <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] border border-blue-100 text-center shadow-inner">
                    <p className="text-[10px] text-blue-400 font-black mb-2 uppercase tracking-[0.3em]">التركيز النهائي</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-black text-blue-900">{selectedTest.resultValue || 'PDF'}</span>
                      <span className="text-lg font-bold text-blue-600">{selectedTest.unit}</span>
                    </div>
                  </div>
                )}

                {selectedTest.status !== 'مكتمل' && (
                  <div className="space-y-6 pt-2">
                    <div className="space-y-3 text-right">
                      <label className="text-[11px] font-black text-gray-400 mr-2 uppercase tracking-widest">إدخال القراءة الكيميائية</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="0.00" 
                          className="w-full p-6 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 font-black text-center text-4xl text-gray-800" 
                          value={resultInput} 
                          onChange={(e) => setResultInput(e.target.value)} 
                        />
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-gray-300">Val.</span>
                      </div>
                    </div>
                    <button onClick={handleSaveResult} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-3">
                      <CheckCircle size={24} />
                      اعتماد النتيجة ونشرها
                    </button>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 mb-4 text-center uppercase tracking-[0.3em]">رفع تقرير الجهاز (PDF)</p>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={`w-full py-6 rounded-[2rem] font-black flex items-center justify-center gap-4 transition-all border-2 ${selectedTest.pdfUrl ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                  >
                    {isUploading ? <Loader2 size={24} className="animate-spin" /> : selectedTest.pdfUrl ? <FileCheck size={24} /> : <FileUp size={24} />}
                    {selectedTest.pdfUrl ? 'تم رفع التقرير الطبي ✓' : 'رفع ملف النتيجة من الجهاز'}
                  </button>
                </div>

                {selectedTest.status === 'مكتمل' && selectedTest.resultValue && (
                  <div className="pt-4">
                    <button 
                      onClick={() => handleAIAnalyze(selectedTest)} 
                      disabled={isAnalyzing} 
                      className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl"
                    >
                      {isAnalyzing ? <Loader2 size={24} className="animate-spin" /> : <BrainCircuit size={24} />}
                      تحليل كيميائي (AI Expert)
                    </button>
                    {aiAnalysis && <div className="mt-6 p-8 bg-purple-50 border border-purple-100 rounded-[2.5rem] text-sm font-bold leading-relaxed text-purple-900 animate-slideUp border-r-8 border-r-purple-600">{aiAnalysis}</div>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3.5rem] flex flex-col items-center justify-center p-16 text-center text-slate-300">
              <FlaskConical size={100} className="mb-8 opacity-10" />
              <h4 className="text-2xl font-black mb-3 text-slate-400">تحليل العينة</h4>
              <p className="font-bold text-sm max-w-[200px]">اختر عينة من سجلات المختبر لبدء معالجتها كيميائياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tests;
