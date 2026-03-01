
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const analyzeLabResults = async (testName: string, value: string, range: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بصفتك استشاري خبير في الكيمياء الحيوية السريرية وطب المختبرات (Clinical Biochemistry Specialist)، قم بتحليل النتيجة التالية باللغة العربية:
      اسم الفحص الكيميائي: ${testName}
      النتيجة الرقمية: ${value}
      المدى الطبيعي (Reference Range): ${range}
      
      المطلوب:
      1. تقييم الحالة (طبيعي، مرتفع، منخفض).
      2. شرح مختصر لأهمية هذا الفحص الكيميائي للجسم.
      3. تقديم نصيحة طبية عامة إذا كانت النتيجة خارج المدى (مثلاً: ضرورة استشارة طبيب باطنة أو كلى).
      4. كن دقيقاً جداً في المصطلحات الكيميائية الطبية.`,
      config: {
        temperature: 0.4, // خفض درجة التغيير لضمان دقة علمية أكبر
        topP: 0.8,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Clinical Chemistry AI Error:", error);
    return "عذراً، تعذر تحليل النتائج الكيميائية حالياً. يرجى مراجعة الكيميائي المختص.";
  }
};
