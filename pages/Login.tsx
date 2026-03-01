
import React, { useState } from 'react';
import { LogIn, Lock, User, FlaskConical, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { UserRole } from '../types';
import { smartLogin, resetPassword } from '../services/firebaseService';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleReset = async () => {
    setResetLoading(true);
    setResetError('');
    setResetMessage('');
    const cleanUser = username.trim();
    let userEmail = cleanUser;
    if (!cleanUser.includes('@')) {
      userEmail = `${cleanUser}@elmostaqbal-lab.com`;
    }
    const result = await resetPassword(userEmail);
    if (result.success) {
      setResetMessage('تم إرسال رابط إعادة التعيين إلى البريد الإلكتروني');
    } else {
      setResetError(result.error || 'فشل إرسال الرابط');
      if (result.errorCode) console.error('reset password error', result.errorCode);
    }
    setResetLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const cleanUser = username.trim();
    
    // تحويل اسم المستخدم إلى صيغة بريد إلكتروني
    // إذا كان "admin" → "admin@elmostaqbal-lab.com"
    let userEmail = cleanUser;
    
    // إذا لم يحتوي على @ فهو username وليس email
    if (!cleanUser.includes('@')) {
      userEmail = `${cleanUser}@elmostaqbal-lab.com`;
    }
    
    // استخدام نظام Smart Login (Auto-Create للعملاء الجدد)
    const result = await smartLogin(userEmail, password);
    
    if (result.success && result.user) {
      // تحديد الدور من النتيجة
      const roleMapping: Record<string, UserRole> = {
        'ADMIN': UserRole.ADMIN,
        'EMPLOYEE': UserRole.EMPLOYEE,
        'CLIENT': UserRole.CLIENT
      };
      
      const userRole = roleMapping[result.role || 'CLIENT'] || UserRole.CLIENT;
      
      const displayName = result.isNewUser 
        ? `${cleanUser} (حساب جديد)`
        : result.user?.displayName || cleanUser;
      
      onLogin({
        id: result.user?.uid,
        name: displayName,
        username: cleanUser,
        email: userEmail,
        role: userRole,
        isNewUser: result.isNewUser
      });
      
      setLoading(false);
      return;
    }

    // معالجة الأخطاء
    // إذا كان هناك رمز خطأ، اطبعه في الكونسول لمساعدة التشخيص
    if (result.errorCode) {
      console.error('login error code:', result.errorCode);
    }
    let message = result.error || 'خطأ في تسجيل الدخول';
    // إذا كان الخطأ عام جداً نقترح التحقق من الديفتولز
    if (message === 'خطأ في تسجيل الدخول' || message === 'المستخدم غير مسجل') {
      message += ' (انظر وحدة التحكم للمزيد من التفاصيل)';
    }
    setError(message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-['Cairo'] relative overflow-hidden">
      {/* Bio-Medical Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-xl w-full relative z-10">
        <div className="bg-white rounded-[4rem] shadow-2xl shadow-blue-200/50 overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-12 md:p-16 text-white text-center relative">
            <div className="absolute top-4 right-8 opacity-10"><FlaskConical size={140} /></div>
            
            <div className="flex flex-col items-center justify-center relative z-10">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-[3rem] border border-white/20 inline-block mb-6">
                <Logo className="w-auto h-auto" color="#ffffff" showText={true} />
              </div>
              <p className="text-blue-100 font-bold opacity-80 text-xs uppercase tracking-[0.4em]">للتحاليل الطبية الكيميائية</p>
            </div>
          </div>

          <div className="p-12 md:p-16">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-xs font-black border border-red-100 text-center animate-shake">
                  {error}
                </div>
              )}
              
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 mr-2 uppercase tracking-widest">اسم المستخدم / الكيميائي</label>
                <div className="relative group">
                  <User className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={22} />
                  <input
                    type="text"
                    required
                    className="w-full pr-16 pl-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 mr-2 uppercase tracking-widest">كلمة المرور الآمنة</label>
                <div className="relative group">
                  <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={22} />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pr-16 pl-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-6 rounded-[2.2rem] font-black text-xl transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 transform active:scale-95 group"
              >
                <span>{loading ? 'جاري الدخول...' : 'دخول'}</span>
                <LogIn size={26} className="group-hover:translate-x-[-6px] transition-transform" />
              </button>

              {/* forgot password link & status */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  disabled={resetLoading || !username}
                  onClick={handleReset}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {resetLoading ? 'جاري الإرسال...' : 'نسيت كلمة المرور؟'}
                </button>
                {resetMessage && <p className="text-green-600 text-xs mt-1">{resetMessage}</p>}
                {resetError && <p className="text-red-600 text-xs mt-1">{resetError}</p>}
              </div>
            </form>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
