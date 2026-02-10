
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const COMMON_SYSTEM_INSTRUCTION = `Bạn là "Mèo Toán 8", gia sư thông minh và thân thiện. 
  QUY TẮC QUAN TRỌNG: 
  - TUYỆT ĐỐI KHÔNG SỬ DỤNG LaTeX (không có dấu $, không có \\frac, \\sqrt...). 
  - Sử dụng ký tự văn bản bình thường để biểu diễn công thức (ví dụ: dùng ^2 cho bình phương, dùng x^2 + 2xy + y^2).
  - Sử dụng dấu ngoặc đơn rõ ràng cho các biểu thức phức tạp.
  - Giải thích dễ hiểu bằng tiếng Việt, sử dụng emoji 😺, 🐾. 
  - Tập trung vào chương trình Toán lớp 8.`;

export const getMathAdvice = async (prompt: string, imageBase64?: string) => {
  const model = "gemini-3-pro-preview";
  try {
    const parts: any[] = [{ text: prompt }];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(",")[1],
        },
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: { 
        systemInstruction: COMMON_SYSTEM_INSTRUCTION + " Nếu gặp bài toán khó, hãy suy nghĩ thật kỹ và đưa ra lời giải từng bước rõ ràng bằng văn bản thường.",
        thinkingConfig: { thinkingBudget: 4000 } 
      },
    });

    const text = response.text || "Mèo đang bận bắt chuột, thử lại sau nhé! 😿";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Nguồn tham khảo",
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri);

    return { text, sources: sources || [] };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Ối, Mèo bị lạc đường rồi! Hãy kiểm tra kết nối mạng nhé 😿" };
  }
};

export const searchLatestExams = async (query: string) => {
  const model = "gemini-3-flash-preview";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Tìm các link đề thi và tài liệu học tập Toán 8 mới nhất cho: ${query}.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: COMMON_SYSTEM_INSTRUCTION
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title,
        uri: chunk.web?.uri
      }))
      .filter((item: any) => item.title && item.uri);

    return {
      text: response.text,
      sources: sources || []
    };
  } catch (error) {
    console.error("Search Error:", error);
    return { text: "Mèo không tìm thấy đề thi trực tiếp rồi... 😿", sources: [] };
  }
};

export const generateQuiz = async () => {
  const model = "gemini-3-flash-preview";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: "Hãy tạo một câu hỏi ôn tập Toán 8 ngẫu nhiên. KHÔNG dùng LaTeX, dùng ký hiệu ^ cho lũy thừa.",
      config: {
        systemInstruction: COMMON_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING },
            hint: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["question", "answer", "hint", "explanation"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Quiz Error:", error);
    return null;
  }
};

let audioCtx: AudioContext | null = null;
export const speakText = async (text: string) => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio && audioCtx) {
      const bytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    }
  } catch (e) {
    console.error("TTS Error:", e);
  }
};
