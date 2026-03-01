
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT'
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  phone?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'ذكر' | 'أنثى';
  phone: string;
  createdAt: string;
  username?: string;
  password?: string;
}

export interface ResultFile {
  id: string;
  filename: string;
  fileBase64: string; // محتوى الملف بصيغة Base64
  fileType: 'pdf' | 'image'; // نوع الملف
  uploadDate: string; // تاريخ الرفع
  size: number; // حجم الملف بالبايت
}

export interface LabTest {
  id: string;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  testName: string;
  status: 'قيد الانتظار' | 'مكتمل' | 'تم الإرسال' | 'طلب عميل';
  resultValue?: string;
  unit?: string;
  referenceRange?: string;
  results?: ResultFile[]; // ملفات النتائج المرفوعة (PDF أو صور)
  resultUploadedDate?: string; // تاريخ رفع النتيجة
  pdfUrl?: string; // رابط ملف النتيجة المرفوع للعميل
  location?: { lat: number; lng: number }; // موقع العميل في حال طلب سحب من المنزل
  notes?: string;
  date: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
