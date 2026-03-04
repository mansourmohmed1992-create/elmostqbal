
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, Edit, Trash2, CheckCircle2, MessageCircle, Copy, Smartphone, Upload, X, File, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { Patient, UserRole } from '../types';

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('lab_patients');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({ name: '', age: '', gender: 'ذكر', phone: '', username: '', password: '' });
  const [generatedCreds, setGeneratedCreds] = useState({ username: '', password: '', name: '', phone: '' });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingPatient, setUploadingPatient] = useState<Patient | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/admin/customers');
      const data = await response.json();
      if (data.success) {
        setPatients(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    (p.fullName || p.name || '').includes(searchTerm) || 
    (p.phone || '').includes(searchTerm)
  );

  const formatEgyptianPhone = (phone: string) => {
    let cleaned = phone.trim().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    return '20' + cleaned;
  };

  const formatPhone = (input: string) => {
    let p = input.replace(/\D/g, '');
    if (p.startsWith('0')) p = p.slice(1);
    if (!p.startsWith('20')) p = '20' + p;
    return p;
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPatient.name || !newPatient.age || !newPatient.phone || !newPatient.username || !newPatient.password) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newPatient.username.toLowerCase(),
          fullName: newPatient.name,
          phone: newPatient.phone,
          age: parseInt(newPatient.age) || 0,
          address: '',
          password: newPatient.password
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedCreds({ 
          username: newPatient.username, 
          password: newPatient.password, 
          name: newPatient.name, 
          phone: '+20' + formatPhone(newPatient.phone)
        });
        setShowModal(false);
        setShowSuccessModal(true);
        setNewPatient({ name: '', age: '', gender: 'ذكر', phone: '', username: '', password: '' });
        await fetchPatients();
      } else {
        alert(data.error || 'فشل إضافة المريض');
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      alert('حدث خطأ في إضافة المريض');
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المريض وكافة بياناته؟')) {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/customers/${id}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          setPatients(patients.filter(p => p.id !== id));
        } else {
          alert(data.error || 'فشل حذف المريض');
        }
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('حدث خطأ في حذف المريض');
      }
    }
  };

  const handleOpenEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setNewPatient({
      name: patient.fullName || patient.name,
      age: patient.age?.toString() || '',
      gender: patient.gender || 'ذكر',
      phone: patient.phone || '',
      username: patient.username || '',
      password: patient.password || ''
    });
    setShowEditModal(true);
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPatient) {
      try {
        const response = await fetch(`http://localhost:4000/api/admin/customers/${editingPatient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: newPatient.name,
            phone: newPatient.phone,
            age: parseInt(newPatient.age) || 0,
            address: '',
            password: newPatient.password
          })
        });

        const data = await response.json();
        if (data.success) {
          setShowEditModal(false);
          setEditingPatient(null);
          setNewPatient({ name: '', age: '', gender: 'ذكر', phone: '', username: '', password: '' });
          await fetchPatients();
          alert('✅ تم تحديث بيانات المريض بنجاح!');
        } else {
          alert(data.error || 'فشل تحديث المريض');
        }
      } catch (error) {
        console.error('Error updating patient:', error);
        alert('حدث خطأ في تحديث المريض');
      }
    }
  };

  const handleOpenUploadModal = (patient: Patient) => {
    setUploadingPatient(patient);
    setUploadFiles([]);
    setShowUploadModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles([...uploadFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadFiles(uploadFiles.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadingPatient) {
      alert('الرجاء اختيار مريض');
      return;
    }

    if (uploadFiles.length === 0) {
      alert('الرجاء اختيار ملف واحد على الأقل');
      return;
    }

    try {
      const uploadedFiles = [];

      for (const file of uploadFiles) {
        const reader = new FileReader();

        await new Promise((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            const fileType = file.type.startsWith('application/pdf') ? 'pdf' : 'image';

            uploadedFiles.push({
              id: 'FILE-' + Math.random().toString(36).substr(2, 9),
              filename: file.name,
              fileBase64: base64,
              fileType: fileType,
              uploadDate: new Date().toLocaleDateString('ar-EG'),
              size: file.size
            });

            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      }

      // حفظ الملفات للمريض في نظام النتائج
      const allTests: any[] = JSON.parse(localStorage.getItem('lab_all_tests') || '[]');
      
      // البحث أو إنشاء سجل نتائج للمريض
      let resultRecord = allTests.find(t => 
        t.patientId === uploadingPatient.id && 
        t.patientName === uploadingPatient.name
      );

      if (!resultRecord) {
        resultRecord = {
          id: 'RES-' + Math.random().toString(36).substr(2, 9),
          patientId: uploadingPatient.id,
          patientName: uploadingPatient.name,
          patientPhone: uploadingPatient.phone,
          testName: 'ملفات طبية عامة',
          status: 'مكتمل',
          results: uploadedFiles,
          resultUploadedDate: new Date().toLocaleDateString('ar-EG'),
          date: new Date().toLocaleDateString('en-CA'),
          notes: 'تم رفع الملفات من سجل المرضى'
        };
        allTests.push(resultRecord);
      } else {
        // إضافة الملفات الجديدة للملفات الموجودة
        resultRecord.results = [...(resultRecord.results || []), ...uploadedFiles];
        resultRecord.resultUploadedDate = new Date().toLocaleDateString('ar-EG');
        resultRecord.status = 'مكتمل';
      }

      localStorage.setItem('lab_all_tests', JSON.stringify(allTests));

      setShowUploadModal(false);
      setUploadingPatient(null);
      setUploadFiles([]);

      alert('✅ تم رفع الملفات بنجاح للمريض!');

    } catch (error) {
      console.error('❌ خطأ في رفع الملفات:', error);
      alert('حدث خطأ في رفع الملفات. الرجاء المحاولة مجدداً.');
    }
  };

  const sendWhatsApp = () => {
    const fullPhone = formatEgyptianPhone(generatedCreds.phone);
    const hostname = window.location.hostname;
    const port = window.location.port || '3000';
    const baseURL = hostname === 'localhost' || hostname === '127.0.0.1' 
      ? 'http://192.96.1.102:3000'
      : `${window.location.protocol}//${hostname}:${port}`;
    const rawMessage = `🏥 *مرحباً بك في معمل المستقبل* 👋

✅ تم تسجيل بياناتك بنجاح

━━━━━━━━━━━━━━━━━━━━━
👤 *معلومات الحساب*
━━━━━━━━━━━━━━━━━━━━━

الاسم الكامل: ${generatedCreds.name}
رقم الهاتف: +20${generatedCreds.phone}

━━━━━━━━━━━━━━━━━━━━━
🔐 *بيانات دخولك*
━━━━━━━━━━━━━━━━━━━━━

📧 اسم المستخدم:
\`\`\`${generatedCreds.username}\`\`\`

🔑 كلمة المرور:
\`\`\`${generatedCreds.password}\`\`\`

━━━━━━━━━━━━━━━━━━━━━
🌐 *رابط البوابة:*
${baseURL}

━━━━━━━━━━━━━━━━━━━━━

💡 يمكنك الآن:
✓ عرض نتائجك الكيميائية
✓ طلب تحاليل منزلية
✓ متابعة حالة طلباتك

📞 في حالة استفسار:
اتصل بنا عبر الواتس

شكراً لثقتك بنا 🔬`;
    
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(rawMessage)}`, '_blank');
  };

  const resendWhatsApp = (patient: Patient) => {
    const patientPhone = patient.phone || '';
    const patientName = patient.fullName || patient.name || 'المريض';
    const patientUsername = (patient as any).username || patient.username || 'غير معروف';
    const patientPassword = (patient as any).password || 'اطلب من الإدارة';
    
    if (!patientPhone) {
      alert('لا يوجد رقم هاتف لهذا المريض');
      return;
    }
    const fullPhone = formatEgyptianPhone(patientPhone);
    const hostname = window.location.hostname;
    const port = window.location.port || '3000';
    const baseURL = hostname === 'localhost' || hostname === '127.0.0.1'
      ? 'http://192.96.1.102:3000'
      : `${window.location.protocol}//${hostname}:${port}`;
    const rawMessage = `🏥 *إعادة إرسال بيانات الدخول* 👋

السلام عليكم
أ/ ${patientName}

━━━━━━━━━━━━━━━━━━━━━
🔐 *بيانات دخول حسابك في معمل المستقبل*
━━━━━━━━━━━━━━━━━━━━━

📧 اسم المستخدم:
\`\`\`${patientUsername}\`\`\`

🔑 كلمة المرور:
\`\`\`${patientPassword}\`\`\`

━━━━━━━━━━━━━━━━━━━━━
🌐 *رابط البوابة:*
${baseURL}

━━━━━━━━━━━━━━━━━━━━━

⏱️ تذكر: بيانات دخولك آمنة ومحفوظة لديك فقط

في حالة استفسار:
اتصل بنا عبر الواتس

شكراً لثقتك بنا 🔬`;
    
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(rawMessage)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">سجل المرضى</h2>
          <p className="text-gray-500 font-bold">إدارة المراجعين وتوليد حسابات الواتساب الآمنة</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-200 active:scale-95"
        >
          <UserPlus size={22} />
          <span>إضافة مريض جديد</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث بالاسم أو رقم الموبايل..."
            className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-4 border border-gray-100 rounded-2xl text-gray-600 hover:bg-gray-50 font-black transition-all">
          <Filter size={18} />
          تصفية
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-gray-400 text-xs font-black uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-8 py-6">اسم المريض</th>
                <th className="px-8 py-6">العمر/الجنس</th>
                <th className="px-8 py-6">رقم الموبايل</th>
                <th className="px-8 py-6">تاريخ الانضمام</th>
                <th className="px-8 py-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-blue-50/40 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-100">
                        {(patient.fullName || patient.name || 'م').charAt(0)}
                      </div>
                      <span className="font-black text-gray-900 text-lg">{patient.fullName || patient.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-700">{patient.age} سنة</span>
                      <span className="text-[10px] text-blue-500 font-black">{patient.gender || 'ذكر'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 font-mono font-bold text-gray-600">
                      <Smartphone size={16} className="text-gray-400" />
                      {patient.phone}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-gray-500 font-bold">{patient.createdAt?.split('T')[0] || new Date().toLocaleDateString('en-CA')}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => resendWhatsApp(patient)}
                        className="p-3 text-green-600 hover:bg-green-100 rounded-xl transition-colors"
                        title="إعادة إرسال البيانات"
                      >
                        <MessageCircle size={20} />
                      </button>
                      <button 
                        onClick={() => handleOpenUploadModal(patient)}
                        className="p-3 text-purple-600 hover:bg-purple-100 rounded-xl transition-colors"
                        title="رفع ملفات PDF أو صور"
                      >
                        <Upload size={20} />
                      </button>
                      <button 
                        onClick={() => handleOpenEditModal(patient)}
                        className="p-3 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                        title="تعديل بيانات المريض"
                      >
                        <Edit size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeletePatient(patient.id)}
                        className="p-3 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-300 font-bold">
                    لا يوجد مرضى مسجلين حالياً. اضغط على "إضافة مريض جديد" للبدء.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-6 md:p-10 shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black mb-8 text-gray-900">تسجيل مريض جديد</h3>
            <form onSubmit={handleAddPatient} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 mr-2">اسم المريض الكامل</label>
                <input required type="text" className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 mr-2">العمر</label>
                  <input required type="number" className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold" value={newPatient.age} onChange={e => setNewPatient({...newPatient, age: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 mr-2">الجنس</label>
                  <select className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold" value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value as any})}>
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 mr-2">رقم الموبايل (مصر)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-xs">+20</span>
                  <input required type="tel" inputMode="numeric" maxLength={11} placeholder="01xxxxxxxxx" className="w-full pr-6 pl-16 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 mr-2">اسم المستخدم</label>
                <input required type="text" className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold" placeholder="اكتب اسم المستخدم" value={newPatient.username} onChange={e => setNewPatient({...newPatient, username: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 mr-2">كلمة المرور</label>
                <div className="relative">
                  <input required type={showPassword ? 'text' : 'password'} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold" placeholder="اكتب كلمة المرور" value={newPatient.password} onChange={e => setNewPatient({...newPatient, password: e.target.value})} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-[1.5rem] font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">حفظ</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-[1.5rem] font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[3.5rem] w-full max-w-md p-10 shadow-2xl text-center animate-bounceIn">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">تم الحفظ بنجاح!</h3>
            <p className="text-gray-500 font-bold mb-8">بيانات دخول المريض جاهزة للإرسال</p>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-gray-100 mb-8 space-y-4 text-right">
              <div className="flex justify-between items-center"><span className="text-xs font-black text-gray-400 uppercase">Username</span><span className="font-mono font-black text-blue-700">{generatedCreds.username}</span></div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-4"><span className="text-xs font-black text-gray-400 uppercase">Password</span><span className="font-mono font-black text-gray-800 tracking-widest">{generatedCreds.password}</span></div>
            </div>
            <button onClick={sendWhatsApp} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-5 rounded-[1.8rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-green-100 transition-all transform active:scale-95">
              <MessageCircle size={24} />
              إرسال للواتساب (+20)
            </button>
            <button onClick={() => setShowSuccessModal(false)} className="w-full text-gray-400 font-black mt-4">إغلاق</button>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-6 md:p-10 shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black mb-8 text-gray-900">تعديل بيانات المريض</h3>
            <form onSubmit={handleUpdatePatient} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 mr-2">اسم المريض الكامل</label>
                <input required type="text" className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 mr-2">العمر</label>
                  <input required type="number" className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold" value={newPatient.age} onChange={e => setNewPatient({...newPatient, age: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 mr-2">الجنس</label>
                  <select className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold" value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value as any})}>
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 mr-2">رقم الموبايل (مصر)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-xs">+20</span>
                  <input required type="tel" inputMode="numeric" maxLength={11} placeholder="01xxxxxxxxx" className="w-full pr-6 pl-16 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 mr-2">اسم المستخدم</label>
                <input required type="text" className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold" placeholder="اكتب اسم المستخدم" value={newPatient.username} onChange={e => setNewPatient({...newPatient, username: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 mr-2">كلمة المرور</label>
                <div className="relative">
                  <input required type={showEditPassword ? 'text' : 'password'} className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 font-bold" placeholder="اكتب كلمة المرور" value={newPatient.password} onChange={e => setNewPatient({...newPatient, password: e.target.value})} />
                  <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-[1.5rem] font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">حفظ التعديلات</button>
                <button type="button" onClick={() => {
                  setShowEditModal(false);
                  setEditingPatient(null);
                  setNewPatient({ name: '', age: '', gender: 'ذكر', phone: '', username: '', password: '' });
                }} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-[1.5rem] font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl animate-slideUp my-10">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-2xl font-black text-gray-900">📤 رفع ملفات للمريض</h3>
              <button onClick={() => {
                setShowUploadModal(false);
                setUploadingPatient(null);
                setUploadFiles([]);
              }} className="text-gray-400 hover:text-red-600">
                <X size={24} />
              </button>
            </div>

            {uploadingPatient && (
              <form onSubmit={handleUploadFiles} className="space-y-6">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                  <p className="text-xs font-black text-purple-600 uppercase mb-1">المريض</p>
                  <p className="font-black text-purple-900 text-lg">{uploadingPatient.name}</p>
                  <p className="text-sm text-purple-700 font-bold mt-1">📱 +20{uploadingPatient.phone}</p>
                </div>

                {/* رفع الملفات */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 mr-2 uppercase">📁 ملفات PDF أو صور</label>
                  <div className="border-2 border-dashed border-purple-200 rounded-2xl p-8 text-center hover:border-purple-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="application/pdf,image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="patient-files"
                    />
                    <label htmlFor="patient-files" className="cursor-pointer block">
                      <Upload size={32} className="mx-auto mb-2 text-purple-600" />
                      <p className="font-black text-purple-600">اختر ملفات أو اسحبها هنا</p>
                      <p className="text-sm text-gray-400 font-bold">PDF · صور (JPG, PNG)</p>
                    </label>
                  </div>

                  {uploadFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-black text-gray-400 uppercase">الملفات المختارة ({uploadFiles.length})</p>
                      <div className="space-y-2">
                        {uploadFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={file.type.startsWith('application/pdf') ? 'text-red-600' : 'text-blue-600'}>
                                {file.type.startsWith('application/pdf') ? <File size={20} /> : <ImageIcon size={20} />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-800 truncate text-sm">{file.name}</p>
                                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={uploadFiles.length === 0}
                    className="flex-1 bg-purple-600 text-white py-4 rounded-2xl font-black hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-purple-100 transition-all"
                  >
                    ✅ رفع الملفات
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadingPatient(null);
                      setUploadFiles([]);
                    }}
                    className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
