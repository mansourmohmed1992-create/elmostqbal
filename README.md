# معمل المستقبل للتحاليل الطبية الكيميائية

نظام إدارة معمل طبي شامل مع قاعدة بيانات MongoDB ونشر على Railway.

## الميزات
- إدارة المرضى والعملاء
- إدارة التحاليل والاختبارات
- لوحة تحكم للإدارة
- إرسال رسائل WhatsApp
- تكامل مع Gemini AI للتحليلات
- قاعدة بيانات MongoDB Atlas للقابلية للتوسع

## التشغيل محلياً

### المتطلبات
- Node.js
- حساب MongoDB Atlas

### الخطوات
1. قم بتثبيت التبعيات:
   ```bash
   npm install
   ```

2. أنشئ ملف `.env` وأضف المتغيرات التالية:
   ```
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   PORT=4000
   NODE_ENV=development
   ```

3. شغل الخادم:
   ```bash
   npm run start-server
   ```

4. شغل الواجهة الأمامية في طرفية منفصلة:
   ```bash
   npm run dev
   ```

## النشر على Railway

1. اربط المستودع بـ Railway.
2. أضف متغيرات البيئة في إعدادات Railway.
3. سيتم النشر تلقائياً عند دفع التغييرات إلى الفرع الرئيسي.

## API Endpoints

- `POST /api/login` – تسجيل الدخول
- `GET /api/customers` – جلب العملاء
- `POST /api/customers` – إضافة عميل جديد
- `PUT /api/customers/:id` – تحديث عميل
- `DELETE /api/customers/:id` – حذف عميل
- `GET /api/tests` – جلب التحاليل
- `POST /api/tests` – إضافة تحليل جديد
- `PUT /api/tests/:id` – تحديث تحليل
- `DELETE /api/tests/:id` – حذف تحليل
- `POST /api/analyze` – تحليل باستخدام Gemini AI

## استكشاف الأخطاء

### مشكلة اتصال MongoDB
- تأكد من إضافة عنوان IP الخاص بك إلى قائمة الوصول في MongoDB Atlas.
- تحقق من صحة سلسلة الاتصال.

### مشكلة في النشر
- تأكد من وجود ملف `Procfile` في الجذر.
- تحقق من متغيرات البيئة في Railway.
