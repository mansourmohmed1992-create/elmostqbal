
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  History, 
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Bell,
  X,
  BellRing,
  FlaskConical,
  Eye,
  File,
  Image as ImageIcon
} from 'lucide-react';
import { LabTest, User } from '../types';

const ClientDashboard = ({ user }: { user: User }) => {
  const [results, setResults] = useState<LabTest[]>([]);
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = () => {
      const allTests: LabTest[] = JSON.parse(localStorage.getItem('lab_all_tests') || '[]');
      // عرض النتائج المكتملة فقط (التي تم رفع ملفات لها)
      const userResults = allTests.filter(t => 
        t.patientId === user.id && 
        t.status === 'مكتمل' && 
        t.results && 
        t.results.length > 0
      );
      
      const seenStatuses = JSON.parse(localStorage.getItem(`seen_status_${user.id}`) || '{}');
      const newNotifications: {id: string, message: string}[] = [];

      userResults.forEach(test => {
        if (seenStatuses[test.id] !== 'seen') {
          newNotifications.push({
            id: test.id,
            message: `✅ نتائج تحليل "${test.testName}" جاهزة! تم رفع الملفات الطبية بنجاح.`
          });
          seenStatuses[test.id] = 'seen';
        }
      });

      if (newNotifications.length > 0) {
        setNotifications(prev => [...prev, ...newNotifications]);
        localStorage.setItem(`seen_status_${user.id}`, JSON.stringify(seenStatuses));
      }

      setResults(userResults);
    };

    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  const groupFilesByDay = (files: any[]) => {
    const groups: Record<string, any[]> = {};
    files.forEach(f => {
      // normalize upload date to YYYY-MM-DD to group by day
      let dayKey = f.uploadDate;
      try {
        const d = new Date(f.uploadDate);
        if (!isNaN(d.getTime())) {
          dayKey = d.toLocaleDateString('en-CA');
        }
      } catch (e) {}
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(f);
    });

    // convert to array sorted by date desc (newest first)
    return Object.keys(groups)
      .sort((a, b) => (new Date(b)).getTime() - (new Date(a)).getTime())
      .map(day => ({ date: day, files: groups[day] }));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const downloadFile = (result: any, filename: string) => {
    const link = document.createElement('a');
    link.href = 'data:' + (result.fileType === 'pdf' ? 'application/pdf' : 'image/jpeg') + ';base64,' + result.fileBase64;
    link.download = filename || 'نتيجة_تحليل';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewFile = (result: any) => {
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(`
        <html>
          <head><title>عرض النتيجة</title></head>
          <body style="margin: 0; background: #f0f0f0;">
            ${result.fileType === 'pdf' 
              ? `<iframe src="data:application/pdf;base64,${result.fileBase64}" style="width: 100%; height: 100vh; border: none;"></iframe>`
              : `<img src="data:image/jpeg;base64,${result.fileBase64}" style="width: 100%; height: auto; display: block;">`
            }
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn relative">
      <div className="fixed top-8 left-8 z-[200] space-y-4 max-w-sm w-full">
        {notifications.map((note) => (
          <div key={note.id} className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-start gap-5 border border-blue-500/30 animate-slideRight backdrop-blur-xl bg-opacity-95">
            <div className="bg-blue-600 p-4 rounded-2xl shrink-0">
              <BellRing size={24} className="animate-bounce" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-sm mb-2">إشعار صحي جديد</h4>
              <p className="text-xs text-blue-100 font-bold leading-relaxed">{note.message}</p>
            </div>
            <button onClick={() => removeNotification(note.id)} className="text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-12 rounded-[4rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div>
            <h2 className="text-5xl font-black mb-3">مرحباً بك، {user.name} 👋</h2>
            <p className="text-blue-100 font-bold opacity-90 text-xl max-w-2xl leading-relaxed">بوابة مختبر المستقبل الخاصة بك: اطلع على نتائج تحاليلك الكيميائية وحمل ملفاتك الطبية.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[3rem] border border-white/20 flex items-center gap-6 shadow-inner">
             <div className="relative">
                <div className="bg-white/20 p-4 rounded-2xl"><BellRing size={32} /></div>
                {notifications.length > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 border-4 border-indigo-800 rounded-full flex items-center justify-center text-[10px] font-black">{notifications.length}</span>}
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">نتائجك الطبية</p>
                <p className="text-lg font-black">{results.length > 0 ? `${results.length} نتيجة` : 'لا توجد نتائج جديدة'}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-black text-gray-800 mb-10 flex items-center gap-4">
              <History className="text-blue-600" size={32} /> نتائج التحاليل الكيميائية
            </h3>
            <div className="space-y-6">
              {results.length > 0 ? results.map(result => (
                <div key={result.id} className="p-8 border border-gray-100 rounded-[3rem] bg-gradient-to-r from-green-50/50 to-white overflow-hidden group hover:shadow-2xl transition-all duration-300">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-20 h-20 rounded-[1.8rem] flex items-center justify-center bg-green-100 text-green-600 shadow-xl border-4 border-white">
                        <CheckCircle size={40} />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 text-2xl">{result.testName}</h4>
                        <div className="flex items-center gap-4 text-xs text-gray-400 font-bold mt-2">
                          <span>📅 {result.resultUploadedDate || result.date}</span>
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                          <span className="bg-white px-2 py-0.5 rounded-lg border">ID: {result.id}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-8 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-green-100 text-green-700">
                      ✓ مكتمل
                    </span>
                  </div>

                  {result.results && result.results.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <p className="text-xs font-black text-gray-500 uppercase mb-4 tracking-widest">📁 ملفات النتائج المرفوعة ({result.results.length})</p>
                      <div className="space-y-3">
                        {(() => {
                          const grouped = groupFilesByDay(result.results);
                          return grouped.map((g) => (
                            <div key={g.date} className="p-3 bg-white border border-gray-200 rounded-2xl">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="text-sm font-black text-gray-800">📅 {new Date(g.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                  <p className="text-xs text-gray-400">ملفات مرفوعة: {g.files.length}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm" onClick={() => { /* expand logic could go here */ }}>{g.files.length > 1 ? 'عرض جميع الملفات' : 'عرض الملف'}</button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-2">
                                {g.files.map((file: any) => (
                                  <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className={`p-2 rounded-lg ${file.fileType === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {file.fileType === 'pdf' ? <File size={16} /> : <ImageIcon size={16} />}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{file.filename}</p>
                                        <p className="text-xs text-gray-400">{file.uploadDate}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => viewFile(file)} className="p-2 bg-blue-600 text-white rounded-lg" title="عرض الملف"><Eye size={16} /></button>
                                      <button onClick={() => downloadFile(file, file.filename)} className="p-2 bg-green-600 text-white rounded-lg" title="تحميل الملف"><Download size={16} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {result.notes && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                      <p className="text-xs font-black text-blue-600 uppercase mb-2">📝 ملاحظات طبية</p>
                      <p className="text-sm text-blue-700 font-bold">{result.notes}</p>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-32 text-gray-300 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                   <FlaskConical size={80} className="mx-auto mb-6 opacity-20" />
                   <p className="font-black text-xl mb-3">لم تصل نتائجك بعد</p>
                   <p className="text-sm text-gray-400 font-bold">انتظر قريباً... سيتم إخطارك بمجرد توفر النتائج</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
            <div className="w-28 h-28 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-blue-600 border border-blue-100 relative z-10 shadow-inner">
              <HelpCircle size={56} />
            </div>
            <h4 className="text-3xl font-black text-gray-900 mb-4 relative z-10">الدعم الفني</h4>
            <p className="text-gray-500 font-bold text-sm leading-relaxed mb-10 relative z-10">تواصل مع كيميائيين مختصين للاستفسار عن أي نتيجة أو طلب استشارة سريعة.</p>
            <a 
              href="https://wa.me/201012345678" 
              target="_blank" 
              className="w-full inline-block py-6 bg-[#25D366] text-white rounded-[2.2rem] font-black hover:bg-[#128C7E] shadow-2xl shadow-green-100 transition-all text-center text-lg"
            >
              واتساب المختبر
            </a>
          </div>

          <div className="bg-slate-900 p-10 rounded-[4rem] text-white overflow-hidden relative group">
            <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <h4 className="text-2xl font-black mb-6 flex items-center gap-4">
              <FileText className="text-blue-400" size={32} /> الأرشفة الذكية
            </h4>
            <p className="text-slate-400 font-bold text-sm leading-relaxed relative z-10">
              جميع نتائجك الكيميائية يتم تخزينها وتشفيرها في سحابة المختبر الآمنة. يمكنك الرجوع لتحاليلك السابقة لمقارنة الوظائف الحيوية ومتابعة حالتك الصحية بدقة على مدار السنوات.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
