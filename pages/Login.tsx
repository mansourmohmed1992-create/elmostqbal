
import React, { useState } from 'react';
import { LogIn, Lock, User, FlaskConical, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { UserRole } from '../types';
import { smartLogin, resetPassword } from '../services/firebaseService';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [focusedField, setFocusedField] = useState<'username' | 'password' | 'confirmPassword' | 'email' | 'phone' | 'age' | 'address' | null>(null);

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // التحقق من البيانات
    if (!username.trim()) {
      setError('أدخل الاسم رباعي');
      setLoading(false);
      return;
    }
    
    // Normalize username to lowercase
    const normalizedUsername = username.toLowerCase();
    if (!phone.trim()) {
      setError('أدخل رقم الهاتف (واتس)');
      setLoading(false);
      return;
    }
    if (!age) {
      setError('أدخل السن');
      setLoading(false);
      return;
    }
    if (!address.trim()) {
      setError('أدخل العنوان');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      setLoading(false);
      return;
    }

    try {
      // إنشاء حساب جديد عبر API
      const response = await fetch('http://localhost:4000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizedUsername,
          fullName: username.trim(),
          phone: phone.trim(),
          age: parseInt(age),
          address: address.trim(),
          password: password,
          role: 'CLIENT'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setError('');
        onLogin({
          id: data.user.id,
          name: username,
          username: normalizedUsername,
          phone: phone.trim(),
          age: age,
          address: address.trim(),
          role: UserRole.CLIENT,
          isNewUser: true
        });
      } else {
        setError(data.error || 'فشل إنشاء الحساب');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
      console.error(err);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const cleanUser = username.trim().toLowerCase();
    
    if (!cleanUser) {
      setError('أدخل اسم المستخدم');
      setLoading(false);
      return;
    }
    
    if (!password) {
      setError('أدخل كلمة المرور');
      setLoading(false);
      return;
    }
    
    // استخدام نظام Smart Login مع username
    const result = await smartLogin(cleanUser, password);
    
    if (result.success && result.user) {
      // تحديد الدور من النتيجة
      const roleMapping: Record<string, UserRole> = {
        'ADMIN': UserRole.ADMIN,
        'EMPLOYEE': UserRole.EMPLOYEE,
        'CLIENT': UserRole.CLIENT
      };
      
      const userRole = roleMapping[result.role || 'CLIENT'] || UserRole.CLIENT;
      
      const displayName = result.user?.fullName || cleanUser;
      
      onLogin({
        id: result.user?.id,
        name: displayName,
        username: cleanUser,
        email: result.user?.email,
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
          <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-6 md:p-10 text-white text-center relative">
            <div className="absolute top-2 right-6 opacity-10"><FlaskConical size={100} /></div>
            
            <div className="flex flex-col items-center justify-center relative z-10">
              <div className="bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-[3rem] border border-white/20 inline-block mb-3">
                <Logo className="w-auto h-auto" color="#ffffff" showText={true} />
              </div>
              <p className="text-blue-100 font-bold opacity-80 text-xs uppercase tracking-[0.3em]">للتحاليل الطبية الكيميائية</p>
            </div>
          </div>

          <div className="p-6 md:p-10">
            <form onSubmit={isSignUp ? handleSignUp : handleSubmit} className="space-y-5">
              {/* error banner intentionally removed per user request */}
              
              {/* Title */}
              <h2 className="text-center text-xl font-black text-gray-800">
                {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
              </h2>
              
              <div className="space-y-5">
                {/* Username Field */}
                <div className="relative">
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      className="w-full pr-16 pl-8 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <User className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                    <label
                      className={`absolute transition-all duration-200 font-black pointer-events-none ${
                        focusedField === 'username' || username
                          ? 'text-xs text-blue-600 -top-2.5 bg-white px-2 right-8'
                          : 'text-gray-500 top-1/2 -translate-y-1/2 text-sm right-20'
                      }`}
                    >
                      اسم المستخدم / الكيميائي
                    </label>
                  </div>
                </div>

                {/* Password Field */}
                <div className="relative">
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pr-16 pl-12 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors z-10"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <label
                      className={`absolute transition-all duration-200 font-black pointer-events-none ${
                        focusedField === 'password' || password
                          ? 'text-xs text-blue-600 -top-2.5 bg-white px-2 right-8'
                          : 'text-gray-500 top-1/2 -translate-y-1/2 text-sm right-20'
                      }`}
                    >
                      كلمة المرور الآمنة
                    </label>
                  </div>
                </div>

                {/* Email Field (Sign Up only) */}
                {isSignUp && (
                  <div className="relative">
                    <div className="relative group">
                      <input
                        type="email"
                        required
                        className="w-full pr-16 pl-8 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <User className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                      <label
                        className={`absolute transition-all duration-200 font-black pointer-events-none ${
                          focusedField === 'email' || email
                            ? 'text-xs text-blue-600 -top-2.5 bg-white px-2 right-8'
                            : 'text-gray-500 top-1/2 -translate-y-1/2 text-sm right-20'
                        }`}
                      >
                        البريد الإلكتروني
                      </label>
                    </div>
                  </div>
                )}

                {/* Confirm Password Field (Sign Up only) */}
                {isSignUp && (
                  <div className="relative">
                    <div className="relative group">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className="w-full pr-16 pl-12 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors z-10"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <label
                        className={`absolute transition-all duration-200 font-black pointer-events-none ${
                          focusedField === 'confirmPassword' || confirmPassword
                            ? 'text-xs text-blue-600 -top-2.5 bg-white px-2 right-8'
                            : 'text-gray-500 top-1/2 -translate-y-1/2 text-sm right-20'
                        }`}
                      >
                        تأكيد كلمة المرور
                      </label>
                    </div>
                  </div>
                )}

                {/* Phone Field (Sign Up only) */}
                {isSignUp && (
                  <div className="relative">
                    <div className="relative group">
                      <input
                        type="tel"
                        required
                        className="w-full pr-16 pl-8 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="201000000000"
                      />
                      <User className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                      <label
                        className={`absolute transition-all duration-200 font-black pointer-events-none ${
                          focusedField === 'phone' || phone
                            ? 'text-xs text-blue-600 -top-2.5 bg-white px-2 right-8'
                            : 'text-gray-500 top-1/2 -translate-y-1/2 text-sm right-20'
                        }`}
                      >
                        رقم الهاتف (واتس)
                      </label>
                    </div>
                  </div>
                )}

                {/* Age Field (Sign Up only) */}
                {isSignUp && (
                  <div className="relative">
                    <div className="relative group">
                      <input
                        type="number"
                        required
                        className="w-full pr-16 pl-8 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        onFocus={() => setFocusedField('age')}
                        onBlur={() => setFocusedField(null)}
                        min="1"
                        max="150"
                      />
                      <User className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                      <label
                        className={`absolute transition-all duration-200 font-black pointer-events-none ${
                          focusedField === 'age' || age
                            ? 'text-xs text-blue-600 -top-2.5 bg-white px-2 right-8'
                            : 'text-gray-500 top-1/2 -translate-y-1/2 text-sm right-20'
                        }`}
                      >
                        السن
                      </label>
                    </div>
                  </div>
                )}

                {/* Address Field (Sign Up only) */}
                {isSignUp && (
                  <div className="relative">
                    <div className="relative group">
                      <input
                        type="text"
                        required
                        className="w-full pr-16 pl-8 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onFocus={() => setFocusedField('address')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <User className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors z-10" size={20} />
                      <label
                        className={`absolute transition-all duration-200 font-black pointer-events-none ${
                          focusedField === 'address' || address
                            ? 'text-xs text-blue-600 -top-2.5 bg-white px-2 right-8'
                            : 'text-gray-500 top-1/2 -translate-y-1/2 text-sm right-20'
                        }`}
                      >
                        العنوان
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 md:py-5 rounded-[2.2rem] font-black text-lg md:text-xl transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 transform active:scale-95 group"
              >
                <span>{loading ? (isSignUp ? 'جاري الإنشاء...' : 'جاري الدخول...') : (isSignUp ? 'إنشاء حساب' : 'دخول')}</span>
                <LogIn size={22} className="group-hover:translate-x-[-6px] transition-transform" />
              </button>

              {/* Toggle between Login and Sign Up */}
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setUsername('');
                    setPassword('');
                    setEmail('');
                    setConfirmPassword('');
                    setPhone('');
                    setAge('');
                    setAddress('');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-black text-xs hover:underline transition-colors"
                >
                  {isSignUp ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                </button>
              </div>

              {/* forgot password link (Login only) */}
              {!isSignUp && (
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    disabled={resetLoading || !username}
                    onClick={handleReset}
                    className="text-blue-600 hover:text-blue-700 font-black text-xs hover:underline transition-colors disabled:text-gray-400"
                  >
                    {resetLoading ? 'جاري الإرسال...' : 'نسيت كلمة المرور؟'}
                  </button>
                  {resetMessage && <p className="text-green-600 text-xs mt-1">{resetMessage}</p>}
                  {resetError && <p className="text-red-600 text-xs mt-1">{resetError}</p>}
                </div>
              )}
            </form>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
