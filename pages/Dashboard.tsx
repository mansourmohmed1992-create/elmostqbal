
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, Clock, CheckCircle2, AlertCircle, UserPlus, Phone, Calendar, Upload } from 'lucide-react';
import { Patient, LabTest } from '../types';

const StatCard = ({ title, value, icon, color, onClick }: any) => (
  <div
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e: any) => { if (e.key === 'Enter') onClick(); } : undefined}
    className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400 font-black uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-black text-gray-900">{value}</p>
      </div>
      <div className={`p-4 rounded-2xl shadow-inner ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    testsToday: 0,
    pendingTests: 0,
    completedTests: 0,
    recentTests: [] as LabTest[],
    newPatientsToday: [] as Patient[]
  });

  // Local UI state for patients listing, date selection and search
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [useRange, setUseRange] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(30);

  useEffect(() => {
    const patients: Patient[] = JSON.parse(localStorage.getItem('lab_patients') || '[]');
    const tests: LabTest[] = JSON.parse(localStorage.getItem('lab_all_tests') || '[]');
    
    const today = new Date().toLocaleDateString('en-CA');
    const testsToday = tests.filter(t => t.date === today);
    const pending = tests.filter(t => t.status !== 'مكتمل');
    const completed = tests.filter(t => t.status === 'مكتمل');
    
    // تصفية المرضى المسجلين اليوم
    const newPatientsToday = patients.filter(p => p.createdAt === today);
    
    setStats({
      totalPatients: patients.length,
      testsToday: testsToday.length,
      pendingTests: pending.length,
      completedTests: completed.length,
      recentTests: tests.slice(0, 5),
      newPatientsToday: newPatientsToday
    });
    // keep a local copy of patients for filtering and listing
    setPatientsList(patients);
  }, []);

  const handlePatientFileUpload = async (patient: Patient, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    try {
      const uploadFilesArr: any[] = [];

      for (const file of Array.from(fileList)) {
        const reader = new FileReader();
        await new Promise((res) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            const fileType = file.type.startsWith('application/pdf') ? 'pdf' : 'image';
            uploadFilesArr.push({
              id: 'FILE-' + Math.random().toString(36).substr(2, 9),
              filename: file.name,
              fileBase64: base64,
              fileType,
              uploadDate: new Date().toLocaleDateString('ar-EG'),
              size: file.size
            });
            res(null);
          };
          reader.readAsDataURL(file);
        });
      }

      const allTests: any[] = JSON.parse(localStorage.getItem('lab_all_tests') || '[]');
      let resultRecord = allTests.find(t => t.patientId === patient.id && t.patientName === patient.name);

      if (!resultRecord) {
        resultRecord = {
          id: 'RES-' + Math.random().toString(36).substr(2, 9),
          patientId: patient.id,
          patientName: patient.name,
          patientPhone: patient.phone,
          testName: 'ملفات طبية عامة',
          status: 'مكتمل',
          results: uploadFilesArr,
          resultUploadedDate: new Date().toLocaleDateString('ar-EG'),
          date: new Date().toLocaleDateString('en-CA'),
          notes: 'تم رفع الملفات من لوحة الإدارة'
        };
        allTests.push(resultRecord);
      } else {
        resultRecord.results = [...(resultRecord.results || []), ...uploadFilesArr];
        resultRecord.resultUploadedDate = new Date().toLocaleDateString('ar-EG');
        resultRecord.status = 'مكتمل';
      }

      localStorage.setItem('lab_all_tests', JSON.stringify(allTests));
      alert('✅ تم رفع الملفات بنجاح للمريض!');
    } catch (err) {
      console.error('Upload failed', err);
      alert('❌ فشل رفع الملفات. الرجاء المحاولة لاحقاً.');
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900">مرحباً بك في لوحة الإدارة 👋</h2>
          <p className="text-gray-500 font-bold">نظرة سريعة على أداء معمل المستقبل اليوم</p>
        </div>
        <div className="bg-white border border-gray-100 px-6 py-3 rounded-2xl font-black shadow-sm text-blue-600 flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي المرضى" value={stats.totalPatients} icon={<Users className="text-blue-600" size={28} />} color="bg-blue-50" />
        <StatCard title="فحوصات اليوم" value={stats.testsToday} icon={<Activity className="text-purple-600" size={28} />} color="bg-purple-50" />
        <StatCard title="قيد الانتظار" value={stats.pendingTests} icon={<Clock className="text-orange-600" size={28} />} color="bg-orange-50" onClick={() => navigate('/admin')} />
        <StatCard title="نتائج مكتملة" value={stats.completedTests} icon={<CheckCircle2 className="text-green-600" size={28} />} color="bg-green-50" />
      </div>

      

      {/* قسم المرضى — قابلة للبحث والاختيار حسب تاريخ أو مدى */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-[2.5rem] border border-green-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-green-100">
              <UserPlus className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">المرضى حسب التاريخ</h3>
              <p className="text-sm text-gray-600 font-bold mt-1">المسجلين في التاريخ المختار أو المدى</p>
            </div>
          </div>

          <div className="mr-auto flex items-center gap-3">
            <label className="text-sm font-black text-gray-600">تاريخ:</label>
            <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded-lg border" />
            <button onClick={() => { setSelectedDate(new Date().toLocaleDateString('en-CA')); setUseRange(false); setCurrentPage(1); }} className="px-3 py-2 bg-green-600 text-white rounded-lg font-black">اليوم</button>
            <button onClick={() => { setUseRange(v => !v); setCurrentPage(1); }} className="px-3 py-2 bg-white border rounded-lg font-black">{useRange ? 'إلغاء المدى' : 'حدد مدى'}</button>
          </div>

          <div className="w-full md:w-1/3 flex items-center gap-2">
            <input placeholder="ابحث بالاسم أو رقم الهاتف" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 rounded-lg border" />
          </div>
        </div>

        {useRange && (
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-black text-gray-600">من</label>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded-lg border" />
            <label className="text-sm font-black text-gray-600">إلى</label>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} className="px-3 py-2 rounded-lg border" />
          </div>
        )}

        {/* قائمة المرضى: كل مدخل يظهر كصف بطول الشاشة مع إمكانية البحث والتصفية حسب التاريخ أو المدى */}
        <div className="mt-4">
          <div className="flex flex-col">
            {(() => {
              // compute displayed entries based on date/range and search
              const entries = patientsList.filter((p) => {
                // normalize patient created date to en-CA
                let entryDateStr = '';
                try { entryDateStr = new Date(p.createdAt).toLocaleDateString('en-CA'); } catch { entryDateStr = String(p.createdAt || ''); }

                // date/range filter
                if (useRange && startDate && endDate) {
                  const d = new Date(entryDateStr);
                  const s = new Date(startDate);
                  const e = new Date(endDate);
                  if (d < s || d > e) return false;
                } else {
                  if (selectedDate && entryDateStr !== selectedDate) return false;
                }

                // search filter
                const q = searchQuery.trim().toLowerCase();
                if (!q) return true;
                return (p.name || '').toLowerCase().includes(q) || (p.phone || '').toLowerCase().includes(q) || (p.username || '').toLowerCase().includes(q);
              });

              if (entries.length === 0) {
                return (
                  <div className="text-center py-10">
                    <UserPlus size={48} className="mx-auto mb-4 opacity-20 text-green-600" />
                    <p className="text-lg font-black text-gray-600">لا توجد سجلات لهذا التاريخ</p>
                  </div>
                );
              }

              // pagination
              const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
              const pageIndex = Math.min(Math.max(1, currentPage), totalPages);
              const start = (pageIndex - 1) * pageSize;
              const pageItems = entries.slice(start, start + pageSize);

              return (
                <>
                  {pageItems.map((patient) => (
                    <div key={`${patient.id}-${patient.createdAt}`} className="bg-white p-3 rounded-2xl border border-green-100 hover:shadow-sm transition-all mb-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                            {patient.name?.[0] || '؟'}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-gray-900">{patient.name}</h4>
                            <p className="text-xs text-gray-500 font-bold">العمر: {patient.age} سنة</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <a href={`https://wa.me/+20${patient.phone}`} className="text-sm font-bold text-green-600 hover:text-green-700 truncate">+20{patient.phone}</a>
                          <label htmlFor={`upload-${patient.id}`} title="رفع ملفات" className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                            <Upload size={18} />
                          </label>
                          <input id={`upload-${patient.id}`} type="file" multiple className="hidden" onChange={(e) => handlePatientFileUpload(patient, e.target.files)} />
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${patient.gender === 'ذكر' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{patient.gender}</span>
                          <span className="text-xs text-gray-500">{new Date(patient.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm text-gray-600">إجمالي: {entries.length} سجلات</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentPage(1)} disabled={pageIndex === 1} className="px-3 py-1 bg-white border rounded">الأول</button>
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={pageIndex === 1} className="px-3 py-1 bg-white border rounded">السابق</button>
                      <span className="px-3 py-1 border rounded">{pageIndex} / {totalPages}</span>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={pageIndex === totalPages} className="px-3 py-1 bg-white border rounded">التالي</button>
                      <button onClick={() => setCurrentPage(totalPages)} disabled={pageIndex === totalPages} className="px-3 py-1 bg-white border rounded">الأخير</button>
                    </div>
                    <div>
                      <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 border rounded">
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
