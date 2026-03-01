<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# معمل المستقبل - نسخة معاد تهيئتها

> هذه النسخة تمّ إعادة تهيئتها من الصفر؛ ستايل المظهر محفوظ، لكن
> منطق التطبيق خفيف ويعتمد على ملفات ذاكرة محلية. قم بإضافة أو
> استبدال التكوين بـ Firebase أو أي خدمة حسب حاجتك.

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yd-VeI7I1dP7KayxlZxJE9hmy0hnAwMi

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

> **Optional:** if you plan to re-enable Firebase, create a file
> `.env.local` with your Firebase config values (see comments in
> `services/firebaseService.ts`).

## Backend (Express)

A simple Node/Express backend lives in the `server/` folder. Data is stored
in `server/data.json` and updated when API endpoints are hit.

To start the server alongside the frontend run:

```bash
npm run server
npm run dev   # in a separate terminal
```

- `POST /api/login` – body `{email,password}` returns `{success,user,role}`
- `GET /api/data/:key` – returns array stored under that key
- `POST /api/data/:key` – overwrites data for that key with JSON body
- `POST /api/users` – create a new user (admin operation)

You can extend the backend or replace with any other service as needed.
3. Run the app:
   `npm run dev`
