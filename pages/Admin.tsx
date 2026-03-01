
import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, User as UserIcon, Trash2, Key, Users, CheckCircle2, MessageCircle, MapPin, Clock, Upload, FileText, Image as ImageIcon, X, Eye } from 'lucide-react';
import { User, UserRole, LabTest } from '../types';
import { getData, saveData, subscribeToData, createUserByAdmin } from '../services/firebaseService';

const Admin = () => {
  // تحميل الحسابات من localStorage لضمان استمرارها
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: UserRole.EMPLOYEE 
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingRequests, setBookingRequests] = useState<LabTest[]>([]);
  const [pendingResults, setPendingResults] = useState<LabTest[]>([]);
  const [staffNotifs, setStaffNotifs] = useState<any[]>([]);
  const [selectedResultTest, setSelectedResultTest] = useState<LabTest | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultFiles, setResultFiles] = useState<File[]>([]);
  const [resultNotes, setResultNotes] = useState('');

  useEffect(() => {
    // تحميل البيانات الأولية من Firebase
    const loadData = async () => {
      try {
        // Load users/accounts
        const managedAccounts = await getData('lab/managed_accounts');
        const userList: User[] = managedAccounts ? Object.keys(managedAccounts).map(username => ({
          id: managedAccounts[username].id,
          name: managedAccounts[username].name,
          username: username,
          role: managedAccounts[username].role
        })) : [];
        setUsers(userList);

        // Load all tests
        const allTests: LabTest[] = await getData('lab/all_tests') || [];
        console.log('📦 جميع الطلبات المحفوظة:', allTests);
        
        const newRequests = allTests.filter(t => t.status === 'طلب عميل');
        console.log('🆕 طلبات جديدة فقط:', newRequests);
        
        const pending = allTests.filter(t => 
          (t.status === 'طلب عميل' || t.status === 'قيد الانتظار') && 
          (!t.results || t.results.length === 0)
        );
        
        setBookingRequests(newRequests);
        setPendingResults(pending);
        
        // Load notifications
        const notifs = await getData('lab/staff_notifications') || [];
        setStaffNotifs(notifs);
      } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
      }
    };

    loadData();

    // Set up real-time listeners for data changes
    const unsubscriber1 = subscribeToData('lab/all_tests', (data) => {
      if (data) {
        const newRequests = data.filter((t: LabTest) => t.status === 'طلب عميل');
        const pending = data.filter((t: LabTest) => 
          (t.status === 'طلب عميل' || t.status === 'قيد الانتظار') && 
          (!t.results || t.results.length === 0)
        );
        setBookingRequests(newRequests);
        setPendingResults(pending);
      }
    });

    const unsubscriber2 = subscribeToData('lab/staff_notifications', (data) => {
      if (data) {
        setStaffNotifs(data);
      }
    });

    return () => {
      // Cleanup listeners
      unsubscriber1();
      unsubscriber2();
    };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    // التحقق من البيانات
    if (!newUser.name.trim()) {
      setErrorMsg('الرجاء إدخال الاسم الكامل');
      return;
    }
    if (!newUser.email.trim()) {
      setErrorMsg('الرجاء إدخال البريد الإلكتروني');
      return;
    }
    if (!newUser.password.trim() || newUser.password.length < 8) {
      setErrorMsg('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    
    // إنشاء المستخدم في Firebase
    const result = await createUserByAdmin(
      newUser.email,
      newUser.password,
      newUser.name,
      newUser.role
    );
    
    if (result.success) {
      // إضافة المستخدم للقائمة المحلية
      const newUserObj: User = {
        id: result.uid || '',
        name: newUser.name,
        username: newUser.email.split('@')[0],
        role: newUser.role
      };
      
      setUsers([...users, newUserObj]);
      setNewUser({ name: '', email: '', password: '', role: UserRole.EMPLOYEE });
      setShowAddUser(false);
      setSuccessMsg(`✅ تم إنشاء المستخدم ${newUser.name} بنجاح!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(result.error || 'حدث خطأ في إنشاء المستخدم');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (confirm(`هل أنت متأكد من حذف حساب ${username}؟`)) {
      const managed = await getData('lab/managed_accounts') || {};
      delete managed[username];
      await saveData('lab/managed_accounts', managed);
      setUsers(users.filter(u => u.username !== username));
    }
  };

  const sendWhatsAppToPatient = (request: LabTest) => {
    if (!request.patientPhone) {
      alert('لا يوجد رقم هاتف للمريض');
      return;
    }
    const fullPhone = request.patientPhone.replace(/^0/, '20');
    const message = `مرحباً بك سيدي/سيدتي 👋%0A%0Aشكراً على طلبك للفحص الكيميائي.%0A%0A📋 تفاصيل طلبك:%0A- الفحص: *${request.testName}*%0A- رقم الطلب: *${request.id}*%0A%0Aسيقوم فريقنا بالتواصل معك قريباً لتحديد موعد السحب المنزلي.%0A%0Aشكراً لاختيارك معمل المستقبل.`;
    window.open(`https://wa.me/+${fullPhone}?text=${message}`, '_blank');
  };

  const updateRequestStatus = async (requestId: string, newStatus: 'تم الإرسال' | 'مكتمل') => {
    const allTests: LabTest[] = await getData('lab/all_tests') || [];
    const updated = allTests.map(t => t.id === requestId ? {...t, status: newStatus} : t);
    await saveData('lab/all_tests', updated);
    
    // تحديث الحالة فوراً
    const newRequests = updated.filter(t => t.status === 'طلب عميل');
    setBookingRequests(newRequests);
  };

  const refreshRequests = async () => {
    const allTests: LabTest[] = await getData('lab/all_tests') || [];
    const newRequests = allTests.filter(t => t.status === 'طلب عميل');
    setBookingRequests(newRequests);
    console.log('✅ تم تحديث الطلبات:', newRequests);
  };

  const markNotificationContacted = async (notifId: string) => {
    const notifs = await getData('lab/staff_notifications') || [];
    const updated = notifs.map((n: any) => n.id === notifId ? {...n, status: 'contacted', contactedAt: new Date().toISOString()} : n);
    await saveData('lab/staff_notifications', updated);
    setStaffNotifs(updated);

    // أيضاً حدث حالة الطلب المرتبط إن وُجد
    const notif = updated.find((n: any) => n.id === notifId);
    if (notif && notif.testRequestId) {
      const allTests: LabTest[] = await getData('lab/all_tests') || [];
      const updatedTests = allTests.map(t => t.id === notif.testRequestId ? {...t, status: 'تم الإرسال'} : t);
      await saveData('lab/all_tests', updatedTests);
      setPendingResults(updatedTests.filter(t => (t.status === 'طلب عميل' || t.status === 'قيد الانتظار') && (!t.results || t.results.length === 0)));
    }
  };

  const contactPatientViaWhatsApp = (notif: any) => {
    if (!notif || !notif.patientPhone) return alert('لا يوجد رقم هاتف للمريض');
    const fullPhone = notif.patientPhone.toString().replace(/^0/, '20');
    const message = `مرحباً، هذا فريق معمل المستقبل.%0A%0Aلقد استلمنا طلبك (رقم الطلب: ${notif.testRequestId}).%0Aنحتاج لمزيد من التفاصيل حول الفحوصات المطلوبة أو أدوية حالية.%0A%0Aالاسم: ${notif.patientName}%0Aرقم الطلب: ${notif.testRequestId}%0A%0Aهل يمكنكم الرد هنا وسيقوم أحد موظفينا بالتواصل لتنسيق موعد السحب؟`;
    window.open(`https://wa.me/+${fullPhone}?text=${message}`, '_blank');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setResultFiles([...resultFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setResultFiles(resultFiles.filter((_, i) => i !== index));
  };

  const handleUploadResults = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedResultTest) {
      alert('الرجاء اختيار فحص');
      return;
    }
    
    if (resultFiles.length === 0) {
      alert('الرجاء اختيار ملف واحد على الأقل');
      return;
    }

    try {
      const uploadedFiles = [];
      
      for (const file of resultFiles) {
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

      // حفظ النتائج في Firebase
      const allTests: LabTest[] = await getData('lab/all_tests') || [];
      const updated = allTests.map(t => {
        if (t.id === selectedResultTest.id) {
          return {
            ...t,
            status: 'مكتمل',
            results: uploadedFiles,
            resultUploadedDate: new Date().toLocaleDateString('ar-EG'),
            notes: resultNotes || t.notes
          };
        }
        return t;
      });
      
      await saveData('lab/all_tests', updated);
      
      // إرسال واتس للمريض
      sendWhatsAppResultNotification(selectedResultTest, uploadedFiles);
      
      // تنظيف
      setResultFiles([]);
      setResultNotes('');
      setSelectedResultTest(null);
      setShowResultModal(false);
      
      alert('✅ تم رفع النتائج بنجاح وإرسال إشعار للمريض!');
      
      // تحديث الحالة
      const pending = updated.filter(t => 
        (t.status === 'طلب عميل' || t.status === 'قيد الانتظار') && 
        (!t.results || t.results.length === 0)
      );
      setPendingResults(pending);
      
    } catch (error) {
      console.error('❌ خطأ في رفع النتائج:', error);
      alert('حدث خطأ في رفع النتائج. الرجاء المحاولة مجدداً.');
    }
  };

  const sendWhatsAppResultNotification = (test: LabTest, files: any[]) => {
    if (!test.patientPhone) {
      console.warn('لا يوجد رقم هاتف للمريض');
      return;
    }

    const fullPhone = test.patientPhone.replace(/^0/, '20');
    const baseURL = window.location.origin;
    const fileList = files.map((f, idx) => `${idx + 1}️⃣ ${f.filename}`).join('%0A');
    
    const message = `🏥 *نتائجك الطبية جاهزة الآن!* 🎉%0A%0Aالسلام عليكم%0Aأ/ ${test.patientName}%0A%0A━━━━━━━━━━━━━━━━━━━━━%0A✅ *تفاصيل النتيجة*%0A━━━━━━━━━━━━━━━━━━━━━%0A%0A🔬 نوع الفحص: *${test.testName}*%0A🆔 رقم الطلب: *${test.id}*%0A📅 تاريخ النتيجة: *${test.resultUploadedDate}*%0A%0A━━━━━━━━━━━━━━━━━━━━━%0A📂 *الملفات المرفوعة:*%0A━━━━━━━━━━━━━━━━━━━━━%0A%0A${fileList}%0A%0A━━━━━━━━━━━━━━━━━━━━━%0A🌐 *الدخول للبوابة:*%0A${baseURL}%0A%0A━━━━━━━━━━━━━━━━━━━━━%0A%0A✨ يمكنك الآن:%0A✓ عرض كل الملفات%0A✓ تحميل النتائج (PDF و صور)%0A✓ طباعة التقارير الطبية%0A%0A⚠️ ملاحظة مهمة:%0Aتتم معالجة بيانتك الصحية بكل سرية وأمان%0A%0Aفي حالة استفسار:%0Aaاتصل بنا عبر الواتس%0A%0Aشكراً لثقتك بمعمل المستقبل 🔬%0A%0A💚 معمل المستقبل - للتحاليل الطبية الكيميائية`;
    
    window.open(`https://wa.me/+${fullPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {successMsg && (
        <div className="bg-green-100 text-green-700 p-4 rounded-2xl font-black text-center flex items-center justify-center gap-2 border border-green-200 animate-slideDown">
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      {staffNotifs.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-[2.2rem] border-2 border-amber-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-amber-800">إشعارات التسجيل الجديدة</h3>
            <p className="text-sm text-amber-600 font-bold">{staffNotifs.filter(n => n.status === 'new').length} إشعار غير مقروء</p>
          </div>
          <div className="space-y-3">
            {staffNotifs.slice(0, 6).map((n: any) => (
              <div key={n.id} className={`p-4 rounded-2xl border ${n.status === 'new' ? 'border-amber-100 bg-amber-50' : 'border-gray-100 bg-white'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-black text-gray-900">{n.patientName}</p>
                    <p className="text-xs text-gray-500">رقم الطلب: {n.testRequestId}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => contactPatientViaWhatsApp(n)} className="px-4 py-2 bg-amber-600 text-white rounded-2xl font-black">اتصال بالعميل</button>
                    <button onClick={() => markNotificationContacted(n.id)} className="px-4 py-2 bg-green-600 text-white rounded-2xl font-black">تم التواصل</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bookingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-8 rounded-[3rem] border-2 border-orange-200 shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-orange-900 flex items-center gap-3">
                <Clock className="text-orange-600 animate-spin" size={32} />
                طلبات حجز جديدة
              </h2>
              <p className="text-orange-700 font-bold mt-2">عدد الطلبات المعلقة: {bookingRequests.length}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={refreshRequests}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-orange-100 transition-all"
              >
                🔄 تحديث
              </button>
              <button
                onClick={handleRefresh}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-orange-100 transition-all"
              >
                🔃 إعادة تحميل
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {bookingRequests.map((request) => (
              <div key={request.id} className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm hover:shadow-lg transition-all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase mb-1">المريض</p>
                    <p className="font-black text-gray-900 text-lg">{request.patientName || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase mb-1">رقم الطلب</p>
                    <p className="font-mono font-black text-blue-600">{request.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase mb-1">الفحص المطلوب</p>
                    <p className="font-black text-gray-900">{request.testName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase mb-1">📱 رقم التواصل</p>
                    <p className="font-mono font-black text-green-600 text-lg">+20{request.patientPhone}</p>
                  </div>
                </div>

                {request.location && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm font-bold text-blue-700">
                    <MapPin size={18} />
                    طلب سحب من المنزل (GPS محدد)
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => sendWhatsAppToPatient(request)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black transition-all transform active:scale-95 shadow-lg shadow-green-100"
                  >
                    <MessageCircle size={20} />
                    أرسل واتس
                  </button>
                  <button
                    onClick={() => {
                      updateRequestStatus(request.id, 'تم الإرسال');
                      alert('تم تحديث حالة الطلب إلى: تم الإرسال');
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-100"
                  >
                    <CheckCircle2 size={20} />
                    تم الإرسال
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingResults.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-[3rem] border-2 border-purple-200 shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-purple-900 flex items-center gap-3">
                <FileText className="text-purple-600" size={32} />
                رفع نتائج التحاليل
              </h2>
              <p className="text-purple-700 font-bold mt-2">عدد الفحوصات المعلقة: {pendingResults.length}</p>
            </div>
            <button
              onClick={() => setShowResultModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-purple-100 transition-all flex items-center gap-2"
            >
              <Upload size={24} />
              رفع نتيجة
            </button>
          </div>

          {pendingResults.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {pendingResults.map((test) => (
                <div key={test.id} className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg transition-all">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase mb-1">المريض</p>
                      <p className="font-black text-gray-900 text-lg">{test.patientName || 'غير محدد'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase mb-1">رقم الطلب</p>
                      <p className="font-mono font-black text-purple-600">{test.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase mb-1">الفحص</p>
                      <p className="font-black text-gray-900">{test.testName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase mb-1">📱 رقم التواصل</p>
                      <p className="font-mono font-black text-purple-600">+20{test.patientPhone}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedResultTest(test);
                      setShowResultModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-purple-100"
                  >
                    <Upload size={20} />
                    رفع النتائج لهذا الفحص
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900">إدارة الصلاحيات</h2>
          <p className="text-gray-500 font-bold">أنشئ حسابات للموظفين والعملاء من هنا فقط</p>
        </div>
        <button 
          onClick={() => setShowAddUser(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95"
        >
          <UserPlus size={22} />
          <span>إنشاء حساب جديد</span>
        </button>
      </div>

      {bookingRequests.length > 0 && (
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-200 shadow-sm">
          <h3 className="text-xl font-black mb-4 text-gray-800 flex items-center gap-3">
            <Clock className="text-blue-600" size={24} />
            آخر النشاط الجديد
          </h3>
          <div className="space-y-3">
            {bookingRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="p-4 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-gray-900">{request.patientName}</p>
                    <p className="text-xs text-gray-500 font-bold mt-1">طلب: {request.testName}</p>
                    <p className="text-xs text-gray-400 mt-1">📱 {request.patientPhone}</p>
                  </div>
                  <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-black">{request.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* بطاقة حساب المدير الرئيسي - تظهر دائماً */}
        <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl" />
          <div className="flex justify-between items-start mb-4">
            <div className="p-4 bg-blue-600/20 rounded-2xl text-blue-400">
              <Shield size={28} />
            </div>
            <span className="bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase">المدير العام</span>
          </div>
          <h3 className="text-xl font-black">أنت (Admin)</h3>
          <p className="text-blue-300 font-mono text-sm">@admin</p>
          <p className="mt-4 text-[10px] text-slate-500 font-bold italic">* لا يمكن حذف حساب المدير الرئيسي</p>
        </div>

        {users.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-2 h-full ${user.role === UserRole.CLIENT ? 'bg-green-500' : 'bg-orange-500'}`} />
            
            <div className="flex items-start justify-between mb-4">
              <div className={`p-4 rounded-2xl ${user.role === UserRole.CLIENT ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                {user.role === UserRole.CLIENT ? <Users size={24} /> : <UserIcon size={24} />}
              </div>
              <button 
                onClick={() => handleDeleteUser(user.username)}
                className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-400 font-bold mb-4">@{user.username}</p>
              
              <div className="flex items-center gap-2">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  user.role === UserRole.CLIENT ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {user.role === UserRole.CLIENT ? 'عميل معمل' : 'موظف مختبر'}
                </span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-gray-300">
            <Users size={48} className="mb-4 opacity-20" />
            <p className="font-bold">لا يوجد حسابات مضافة حالياً</p>
          </div>
        )}
      </div>

      {showAddUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-slideUp">
            <h3 className="text-2xl font-black mb-6 text-gray-900 border-b border-gray-100 pb-4">إضافة حساب جديد</h3>
            
            {errorMsg && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-2xl font-bold text-center text-sm border border-red-100">
                ⚠️ {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 mr-2 uppercase">الاسم الكامل</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold" 
                  value={newUser.name} 
                  onChange={e => setNewUser({...newUser, name: e.target.value})} 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 mr-2 uppercase">البريد الإلكتروني</label>
                <input 
                  required 
                  type="email" 
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold" 
                  placeholder="مثال@domain.com"
                  value={newUser.email} 
                  onChange={e => setNewUser({...newUser, email: e.target.value})} 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 mr-2 uppercase">كلمة المرور (8 أحرف على الأقل)</label>
                <input 
                  required 
                  type="password" 
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold" 
                  placeholder="••••••••"
                  minLength={8}
                  value={newUser.password} 
                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-400 mr-2 uppercase">نوع الصلاحية</label>
                <select 
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold appearance-none" 
                  value={newUser.role} 
                  onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                >
                  <option value={UserRole.EMPLOYEE}>📋 موظف - إدارة المختبر</option>
                  <option value={UserRole.CLIENT}>👤 عميل - عرض النتائج فقط</option>
                </select>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
                >
                  ✅ إنشاء المستخدم
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddUser(false);
                    setErrorMsg('');
                  }} 
                  className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl animate-slideUp my-10">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-2xl font-black text-gray-900">📤 رفع نتائج التحليل</h3>
              <button onClick={() => {
                setShowResultModal(false);
                setSelectedResultTest(null);
                setResultFiles([]);
                setResultNotes('');
              }} className="text-gray-400 hover:text-red-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUploadResults} className="space-y-6">
              {/* اختيار الفحص */}
              {!selectedResultTest && (
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 mr-2 uppercase">اختر فحص من المعلقة</label>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {pendingResults.map(test => (
                      <button
                        key={test.id}
                        type="button"
                        onClick={() => setSelectedResultTest(test)}
                        className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl hover:border-purple-400 text-left transition-all text-black"
                      >
                        <div className="font-black">{test.testName}</div>
                        <div className="text-sm text-gray-600 font-bold">المريض: {test.patientName}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedResultTest && (
                <>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                    <p className="text-xs font-black text-purple-600 uppercase mb-1">✓ الفحص المختار</p>
                    <p className="font-black text-purple-900 text-lg">{selectedResultTest.testName}</p>
                    <p className="text-sm text-purple-700 font-bold mt-1">المريض: {selectedResultTest.patientName}</p>
                  </div>

                  {/* رفع الملفات */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 mr-2 uppercase">📁 ملفات النتائج (PDF أو صور)</label>
                    <div className="border-2 border-dashed border-purple-200 rounded-2xl p-8 text-center hover:border-purple-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="application/pdf,image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="result-files"
                      />
                      <label htmlFor="result-files" className="cursor-pointer block">
                        <Upload size={32} className="mx-auto mb-2 text-purple-600" />
                        <p className="font-black text-purple-600">اختر ملفات أو اسحبها هنا</p>
                        <p className="text-sm text-gray-400 font-bold">PDF.صور (JPG, PNG)</p>
                      </label>
                    </div>

                    {resultFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-black text-gray-400 uppercase">الملفات المختارة ({resultFiles.length})</p>
                        <div className="space-y-2">
                          {resultFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={file.type.startsWith('application/pdf') ? 'text-red-600' : 'text-blue-600'}>
                                  {file.type.startsWith('application/pdf') ? <FileText size={20} /> : <ImageIcon size={20} />}
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

                  {/* ملاحظات */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 mr-2 uppercase">📝 ملاحظات طبية (اختياري)</label>
                    <textarea
                      placeholder="أضف أي ملاحظات طبية مهمة بخصوص النتيجة..."
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-500 font-bold text-gray-800 resize-none h-24"
                      value={resultNotes}
                      onChange={(e) => setResultNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={resultFiles.length === 0}
                      className="flex-1 bg-purple-600 text-white py-4 rounded-2xl font-black hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-purple-100 transition-all"
                    >
                      ✅ رفع النتائج وإرسال الإشعار
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedResultTest(null);
                        setResultFiles([]);
                        setResultNotes('');
                      }}
                      className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black"
                    >
                      رجوع
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
