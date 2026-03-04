import React, { useState } from 'react';
import { MapPin, Phone, User, AlertCircle, CheckCircle2, MessageCircle } from 'lucide-react';
import { UserRole } from '../types';
import { getData, saveData } from '../services/firebaseService';

interface HomeTestRequestFormData {
  fullName: string;
  age: string;
  phone: string;
  location: { lat: number; lng: number } | null;
}

const HomeTestRequest = ({ user }: { user: any }) => {
  const [formData, setFormData] = useState<HomeTestRequestFormData>({
    fullName: '',
    age: '',
    phone: '',
    location: null
  });
  const [isLocating, setIsLocating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<HomeTestRequestFormData | null>(null);

  const validateFullName = (name: string) => {
    const words = name.trim().split(/\s+/);
    return words.length >= 4;
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert('متصفحك لا يدعم خاصية الموقع');
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData({
          ...formData,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        });
        setIsLocating(false);
      },
      () => {
        alert('تعذر الحصول على الموقع. يرجى تفعيل الـ GPS في جهازك');
        setIsLocating(false);
      }
    );
  };

  const formatPhone = (input: string) => {
    let p = input.replace(/\D/g, '');
    if (p.startsWith('0')) p = p.slice(1);
    if (!p.startsWith('20')) p = '20' + p;
    return p;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من الاسم الرباعي
    if (!validateFullName(formData.fullName)) {
      alert('الرجاء إدخال اسم رباعي (4 كلمات على الأقل)');
      return;
    }

    // التحقق من باقي البيانات
    if (!formData.age || parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      alert('الرجاء إدخال عمر صحيح');
      return;
    }

    if (!formData.phone || formData.phone.trim() === '') {
      alert('الرجاء إدخال رقم الهاتف');
      return;
    }

    // إنشاء حساب للعميل
    setSubmittedData(formData);

    // نسخ بيانات من الاسم الرباعي لعمل username مناسب
    const nameParts = formData.fullName.trim().split(/\s+/);
    const username = nameParts.slice(0, 2).join('').toLowerCase().replace(/ا/g, 'a');
    const password = Math.random().toString(36).slice(-8);

    // حفظ في المرضى (Firebase)
    const patients = await getData('lab/patients') || [];
    const patientsArray = Array.isArray(patients) ? patients : [];
    const normalizedPhone = formatPhone(formData.phone);
    const newPatient = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.fullName,
      age: parseInt(formData.age),
      gender: 'ذكر',
      phone: normalizedPhone,
      createdAt: new Date().toLocaleDateString('en-CA'),
      username: username,
      password: password
    };

    patientsArray.push(newPatient);
    await saveData('lab/patients', patientsArray);

    // حفظ الحساب في قاعدة البيانات الموحدة (Firebase)
    const managed = await getData('lab/managed_accounts') || {};
    managed[username] = {
      password: password,
      name: formData.fullName,
      phone: formData.phone,
      role: UserRole.CLIENT,
      id: newPatient.id
    };
    await saveData('lab/managed_accounts', managed);

    // إنشاء طلب تحليل (Firebase)
    const allTests = await getData('lab/all_tests') || [];
    const testsArray = Array.isArray(allTests) ? allTests : [];
    const testRequest = {
      id: 'HOME-' + Math.floor(Math.random() * 9000 + 1000),
      patientId: newPatient.id,
      patientName: formData.fullName,
      patientPhone: formData.phone,
      testName: 'طلب تحليل منزلي',
      status: 'قيد الانتظار',
      date: new Date().toLocaleDateString('en-CA'),
      location: formData.location || undefined,
      notes: 'تم الطلب عبر نموذج التحليل المنزلي'
    };

    testsArray.push(testRequest);
    await saveData('lab/all_tests', testsArray);

    // إنشاء إشعار للموظفين (Firebase)
    try {
      const staffNotifs = await getData('lab/staff_notifications') || [];
      const notifsArray = Array.isArray(staffNotifs) ? staffNotifs : [];
      const notif = {
        id: 'N-' + Math.random().toString(36).substr(2, 9),
        patientName: formData.fullName,
        patientPhone: normalizedPhone,
        testRequestId: testRequest.id,
        status: 'new',
        createdAt: new Date().toISOString(),
        location: formData.location || null
      };
      notifsArray.unshift(notif);
      await saveData('lab/staff_notifications', notifsArray);

      // حاول إيجاد أرقام الموظفين من managed accounts
      const managedAccounts = await getData('lab/managed_accounts') || {};
      const staffPhones = Object.keys(managedAccounts)
        .map(k => managedAccounts[k].phone)
        .filter(Boolean);

      if (staffPhones.length > 0) {
        const staffPhone = staffPhones[0].toString().replace(/^0/, '20');
        const baseURL = window.location.origin + '/admin';
        const staffMsg = `⚠️ *طلب جديد من بوابة التحليل المنزلي*%0A%0A👤 الاسم: ${formData.fullName}%0A📞 الهاتف: ${formData.phone}%0A🆔 رقم الطلب: ${testRequest.id}%0A%0A📍 موقع (إن وُجد): ${formData.location ? `${formData.location.lat.toFixed(4)}, ${formData.location.lng.toFixed(4)}` : 'غير محدد'}%0A%0A👉 افتح لوحة الإدارة: ${baseURL}`;
        window.open(`https://wa.me/+${staffPhone}?text=${staffMsg}`, '_blank');
      }
    } catch (err) {
      console.warn('خطأ أثناء إنشاء إشعار الموظفين', err);
    }

    // إرسال واتس
    sendWhatsAppNotification(formData.fullName, formData.phone, username, password, testRequest.id);

    setShowSuccess(true);
    setFormData({ fullName: '', age: '', phone: '', location: null });
  };

  const sendWhatsAppNotification = (name: string, phone: string, username: string, password: string, testRequestId: string) => {
    const normalize = (input: string) => {
      let p = input.replace(/\D/g, '');
      if (p.startsWith('0')) p = p.slice(1);
      if (!p.startsWith('20')) p = '20' + p;
      return p;
    };
    const fullPhone = normalize(phone);
    const baseURL = window.location.origin;
    const message = `🏥 *مرحباً بك في معمل المستقبل* 👋%0A%0A✅ تم استقبال طلب التحليل المنزلي بنجاح%0A%0A━━━━━━━━━━━━━━━━━━━━━%0A📋 *تفاصيل طلبك*%0A━━━━━━━━━━━━━━━━━━━━━%0A%0A👤 الاسم: ${name}%0A🆔 رقم الطلب: *${testRequestId}*%0A%0A━━━━━━━━━━━━━━━━━━━━━%0A🔐 *بيانات دخول حسابك*%0A━━━━━━━━━━━━━━━━━━━━━%0A%0A📧 اسم المستخدم:%0A\`\`\`${username}\`\`\`%0A%0A🔑 كلمة المرور:%0A\`\`\`${password}\`\`\`%0A%0A━━━━━━━━━━━━━━━━━━━━━%0A🌐 *رابط البوابة:*%0A${baseURL}%0A%0A━━━━━━━━━━━━━━━━━━━━━%0A%0A⏱️ سيقوم فريقنا بالتواصل معك خلال الـ 24 ساعة القادمة لتحديد موعد الزيارة المنزلية وأخذ العينات.%0A%0A📞 في حالة استفسار: اتصل بنا على الرقم المسجل لديك%0A%0Aشكراً لاختيارك *معمل المستقبل* للتحاليل الطبية 🔬`;
    window.open(`https://wa.me/+${fullPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900">طلب تحليل منزلي 🏥</h2>
          <p className="text-gray-500 font-bold">نحن نأتي إليك! ملأ البيانات أدناه وسنقوم بزيارتك</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
          <h3 className="text-2xl font-black text-gray-800 mb-8">📝 بياناتك الشخصية</h3>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* الاسم الرباعي */}
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider">الاسم الكامل (رباعياً)</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={22} />
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمد علي عبدالله"
                  className="w-full pr-16 pl-6 py-5 bg-gray-50 border border-gray-100 rounded-[2.2rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-800"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              {formData.fullName && !validateFullName(formData.fullName) && (
                <p className="text-xs font-bold text-red-600 mt-2">⚠️ الاسم يجب أن يكون رباعياً (أربع كلمات على الأقل)</p>
              )}
              {formData.fullName && validateFullName(formData.fullName) && (
                <p className="text-xs font-bold text-green-600 mt-2">✅ اسم صحيح</p>
              )}
            </div>

            {/* السن */}
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider">السن</label>
              <input
                type="number"
                required
                min="1"
                max="120"
                placeholder="أدخل سنك"
                className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-[2.2rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-800"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>

            {/* رقم الهاتف */}
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider">رقم الهاتف المصري</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-xs">+20</span>
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={22} />
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="رقم الهاتف"
                  className="w-full pr-16 pl-20 py-5 bg-gray-50 border border-gray-100 rounded-[2.2rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-800"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* الموقع */}
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider">📍 موقع السحب (اختياري)</label>
              <button
                type="button"
                onClick={handleGetLocation}
                className={`w-full flex items-center justify-center gap-4 p-6 rounded-[2.2rem] border-2 border-dashed transition-all font-black text-sm ${
                  formData.location
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-inner'
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                }`}
              >
                <MapPin size={26} />
                {isLocating ? 'جاري تحديد عنوانك...' : formData.location ? 'تم تحديد موقع السحب بنجاح ✓' : 'تحديد موقع السحب من الخرائط (GPS)'}
              </button>
              {formData.location && (
                <p className="text-xs text-green-600 font-bold">
                  ✅ الإحداثيات: {formData.location.lat.toFixed(4)}° , {formData.location.lng.toFixed(4)}°
                </p>
              )}
            </div>

            {/* زر الإرسال */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[2.2rem] font-black text-lg shadow-2xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              ✅ تأكيد الطلب
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {/* معلومات مهمة */}
          <div className="bg-blue-50 border border-blue-200 p-8 rounded-[2.5rem]">
            <h4 className="text-lg font-black text-blue-900 mb-4 flex items-center gap-3">
              <AlertCircle className="text-blue-600" size={24} />
              معلومات مهمة
            </h4>
            <ul className="space-y-3 text-sm font-bold text-blue-800">
              <li>✓ سيتم التواصل معك في الظرف الساعات التالية</li>
              <li>✓ الموقع اختياري - يمكنك حذفه و إدخاله لاحقاً</li>
              <li>✓ جميع بيانتك محفوظة وآمنة تماماً</li>
              <li>✓ ستتلقى حسابك على الواتساب فوراً</li>
            </ul>
          </div>

          {/* خطوات العملية */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h4 className="text-lg font-black text-gray-900 mb-6">كيفية العملية</h4>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">1</div>
                <div>
                  <p className="font-black text-gray-800">ملأ النموذج</p>
                  <p className="text-xs text-gray-500 font-bold mt-1">أدخل بياناتك الشخصية</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">2</div>
                <div>
                  <p className="font-black text-gray-800">التفعيل</p>
                  <p className="text-xs text-gray-500 font-bold mt-1">فريقنا يفعل حسابك</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">3</div>
                <div>
                  <p className="font-black text-gray-800">الزيارة المنزلية</p>
                  <p className="text-xs text-gray-500 font-bold mt-1">سحب العينات من منزلك</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">4</div>
                <div>
                  <p className="font-black text-gray-800">النتائج</p>
                  <p className="text-xs text-gray-500 font-bold mt-1">استلم النتائج عبر حسابك</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* رسالة النجاح */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[3.5rem] w-full max-w-md p-10 shadow-2xl text-center animate-bounceIn">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">تم الطلب بنجاح! 🎉</h3>
            <p className="text-gray-600 font-bold mb-6">سنتواصل معك قريباً جداً لتحديد موعد الزيارة المنزلية</p>

            {submittedData && (
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-gray-100 mb-8 space-y-3 text-right">
                <div>
                  <p className="text-xs text-gray-400 font-black uppercase mb-1">الاسم</p>
                  <p className="font-bold text-gray-800">{submittedData.fullName}</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-400 font-black uppercase mb-1">رقم الهاتف</p>
                  <p className="font-bold text-gray-800">+20{submittedData.phone}</p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 font-bold mb-6">
              ستتلقى بيانات دخول حسابك على الواتساب في أي لحظة
            </p>

            <button
              onClick={() => setShowSuccess(false)}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeTestRequest;
