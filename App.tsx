
import React, { useState, useEffect, useRef } from 'react';
import { Tab, UserProfile, ChatMessage, MathProgress } from './types';
import { MATH_TOPICS } from './constants';
import { getMathAdvice, generateQuiz, speakText, searchLatestExams } from './geminiService';
const CAT_TIPS = [
  "Đừng quên (a+b)² = a² + 2ab + b² nha, đừng nhầm với a² + b² đó! 🐾",
  "Muốn phân tích đa thức? Hãy tìm nhân tử chung trước! 😺",
  "Học toán cũng như bắt chuột, cần kiên nhẫn đó! 🐭",
  "Luyện tập mỗi ngày sẽ giúp bộ não sắc bén! 🧠",
  "Gặp bài khó? Cứ gửi ảnh cho Mèo nhé! 📸",
  "Lưu ý: (a-b)² = a² - 2ab + b² đó nha! 🐾"
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  
  // Initialize Progress and User Profile
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('meo_toan_user');
    return saved ? JSON.parse(saved) : {
      name: 'Bạn mới',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lucky',
      level: 1,
      exp: 0
    };
  });

  const [progress, setProgress] = useState<MathProgress>(() => {
    const saved = localStorage.getItem('math8_progress');
    if (!saved) {
      const initialProgress = { exercises: 0, correct: 0, total: 0, exp: 0, streak: 0 };
      localStorage.setItem('math8_progress', JSON.stringify(initialProgress));
      return initialProgress;
    }
    return JSON.parse(saved);
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [examResults, setExamResults] = useState<{text: string, sources: any[]} | null>(null);
  const [isSearchingExams, setIsSearchingExams] = useState(false);
  
  const [quiz, setQuiz] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
  const [catTip] = useState(() => CAT_TIPS[Math.floor(Math.random() * CAT_TIPS.length)]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync with Local Storage
  useEffect(() => {
    localStorage.setItem('meo_toan_user', JSON.stringify(user));
    localStorage.setItem('math8_progress', JSON.stringify(progress));
  }, [user, progress]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSendMessage = async (text: string, image?: string) => {
    if (!text && !image) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, image, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    const result = await getMathAdvice(text || "Giải giúp mình bài này nhé!", image);
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: result.text, sources: result.sources, timestamp: Date.now() };
    setChatMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
    
    // Play sound for the reply
    const shortText = result.text.length > 150 ? result.text.substring(0, 150) + "..." : result.text;
    speakText(shortText);
  };

  const handleSearchExams = async () => {
    setIsSearchingExams(true);
    const result = await searchLatestExams("Đề thi Toán lớp 8 giữa học kì 2 mới nhất năm 2024 2025");
    setExamResults(result);
    setIsSearchingExams(false);
  };

  const handleNewQuiz = async () => {
    setIsGeneratingQuiz(true);
    setFeedback('');
    setUserAnswer('');
    const newQuiz = await generateQuiz();
    if (newQuiz) setQuiz(newQuiz);
    setIsGeneratingQuiz(false);
  };

  const checkQuizAnswer = () => {
    if (!quiz) return;
    const isCorrect = userAnswer.trim().toLowerCase() === quiz.answer.trim().toLowerCase();
    
    const xpGain = isCorrect ? 20 : 5;

    setProgress(prev => ({
      ...prev,
      total: prev.total + 1,
      exercises: prev.exercises + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      exp: prev.exp + xpGain
    }));

    if (isCorrect) {
      setFeedback("✅ Chính xác! Giỏi quá đi 😻 +20 EXP");
      const newExp = user.exp + 20;
      setUser(prev => ({ ...prev, exp: newExp, level: Math.floor(newExp / 100) + 1 }));
      speakText("Bạn làm đúng rồi! Thật là xuất sắc!");
    } else {
      setFeedback("❌ Gần đúng rồi, bạn xem gợi ý nhé! +5 EXP vì đã nỗ lực");
      const newExp = user.exp + 5;
      setUser(prev => ({ ...prev, exp: newExp, level: Math.floor(newExp / 100) + 1 }));
      speakText("Cố lên, xem gợi ý của mình nhé!");
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ nhận diện giọng nói.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const NavButton = ({ tab, icon, label }: { tab: Tab, icon: string, label: string }) => (
    <button onClick={() => setActiveTab(tab)} className={`flex flex-col items-center justify-center py-2 flex-1 transition-all relative ${activeTab === tab ? 'text-indigo-400' : 'text-gray-500'}`}>
      <i className={`fas ${icon} text-lg mb-1`}></i>
      <span className="text-[10px] uppercase font-bold">{label}</span>
      {activeTab === tab && <div className="absolute -top-1 w-8 h-1 bg-indigo-500 rounded-full shadow-lg"></div>}
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg animate-float">🐱</div>
          <div>
            <h1 className="text-lg font-bold">Mèo Toán 8</h1>
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Gia Sư AI</span>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg px-3 py-1 border border-white/10 text-right">
          <span className="text-[10px] font-bold text-yellow-400 block">LV.{user.level}</span>
          <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 transition-all" style={{ width: `${user.exp % 100}%` }}></div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-28 custom-scrollbar">
        {activeTab === Tab.HOME && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2rem] relative overflow-hidden shadow-2xl">
              <h2 className="text-2xl font-bold mb-1 relative z-10">Chào {user.name}! 🐾</h2>
              <p className="text-indigo-100 text-sm mb-4 opacity-90 relative z-10">{catTip}</p>
              <div className="flex gap-2 relative z-10">
                <button onClick={() => setActiveTab(Tab.PRACTICE)} className="bg-white text-indigo-700 px-5 py-2 rounded-2xl text-xs font-bold shadow-md hover:scale-105 transition-all">Luyện Tập</button>
                <button onClick={() => setActiveTab(Tab.CHATS)} className="bg-indigo-500/30 border border-indigo-400/30 text-white px-5 py-2 rounded-2xl text-xs font-bold hover:bg-indigo-500/50 transition-all">Hỏi Mèo AI</button>
              </div>
              <div className="absolute -right-4 -bottom-6 text-[100px] opacity-10 rotate-12">🐱</div>
            </div>

            <div className="bg-[#111a2e] p-5 rounded-[2rem] border border-red-500/20 shadow-sm">
              <p style={{ color: '#fca5a5', fontWeight: 'bold' }}>
                Lưu ý: (a+b)² = a² + 2ab + b² <br />
                ❌ Không phải là a² + b²
              </p>
            </div>

            <div className="bg-[#111a2e] p-5 rounded-[2rem] border border-white/5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <i className="fas fa-chart-line text-green-500"></i> Tiến độ của bạn
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 p-3 rounded-2xl">
                  <div className="text-lg font-bold text-indigo-400">{progress.exercises}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Câu đã làm</div>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl">
                  <div className="text-lg font-bold text-green-400">
                    {progress.total > 0 ? Math.round((progress.correct / progress.total) * 100) : 0}%
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Tỉ lệ đúng</div>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl">
                  <div className="text-lg font-bold text-pink-400">{user.exp}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Tổng EXP</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => setActiveTab(Tab.LEARN)} className="bg-[#111a2e] p-5 rounded-3xl border border-white/5 cursor-pointer hover:border-indigo-500/30 transition-all group">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <i className="fas fa-book-open text-indigo-400"></i>
                </div>
                <h4 className="font-bold text-sm">Thư viện</h4>
                <p className="text-[10px] text-gray-500 mt-1">Công thức & Ví dụ.</p>
              </div>
              <div onClick={() => setActiveTab(Tab.CHATS)} className="bg-[#111a2e] p-5 rounded-3xl border border-white/5 cursor-pointer hover:border-purple-500/30 transition-all group">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <i className="fas fa-magic text-purple-400"></i>
                </div>
                <h4 className="font-bold text-sm">Gia Sư AI</h4>
                <p className="text-[10px] text-gray-500 mt-1">Giải toán cực nhanh.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === Tab.LEARN && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-bold">📗 Kiến thức & Tài liệu</h2>
              <button 
                onClick={handleSearchExams}
                disabled={isSearchingExams}
                className="text-[10px] bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-full font-bold uppercase hover:bg-indigo-600/30 transition-all"
              >
                {isSearchingExams ? 'Đang tìm...' : 'Tìm đề thi mới'}
              </button>
            </div>

            <div className="bg-[#111a2e] p-5 rounded-2xl border border-red-500/20 mx-2 shadow-sm">
              <p style={{ color: '#fca5a5', fontWeight: 'bold' }}>
                Lưu ý: (a+b)² = a² + 2ab + b² <br />
                ❌ Không phải là a² + b²
              </p>
            </div>

            {examResults && (
              <div className="bg-indigo-600/10 border border-indigo-500/30 p-5 rounded-3xl space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-indigo-300">
                  <i className="fas fa-search"></i> Tài liệu Mèo tìm được:
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {examResults.sources.map((src, i) => (
                    <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white/5 p-3 rounded-xl text-xs hover:bg-white/10 transition-colors border border-white/5">
                      <span className="truncate flex-1 pr-2">{src.title}</span>
                      <i className="fas fa-external-link-alt text-indigo-400 text-[10px]"></i>
                    </a>
                  ))}
                  {examResults.sources.length === 0 && <p className="text-xs text-gray-500 text-center italic">Không thấy link đề thi trực tiếp rồi... 😿</p>}
                </div>
              </div>
            )}

            {MATH_TOPICS.map((topic, i) => (
              <div key={i} className="space-y-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-2">{topic.title}</h3>
                {topic.lessons.map(lesson => (
                  <div key={lesson.id} className="bg-[#111a2e] p-5 rounded-3xl border border-white/5 hover:border-indigo-500/20 transition-all">
                    <h4 className="font-bold mb-2 text-indigo-100">{lesson.title}</h4>
                    <div className="bg-black/30 p-3 rounded-2xl font-mono text-indigo-300 text-center text-sm mb-3 shadow-inner">{lesson.formula}</div>
                    <div className="text-[11px] text-gray-500 bg-white/5 p-2 rounded-xl">Ví dụ: {lesson.example}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === Tab.PRACTICE && (
          <div className="space-y-6 animate-fadeIn">
            {!quiz ? (
              <div className="bg-[#111a2e] p-10 rounded-[2.5rem] text-center border border-white/5 space-y-6 shadow-2xl">
                <div className="text-7xl animate-bounce">📝</div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Thử Thách Mèo Con</h3>
                  <p className="text-xs text-gray-400 px-8">Làm bài đúng để thăng cấp và nhận thêm mồi ngon nha! 🐟</p>
                </div>
                <button onClick={handleNewQuiz} disabled={isGeneratingQuiz} className="w-full bg-indigo-600 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                  {isGeneratingQuiz ? 'Mèo đang soạn đề...' : 'Tạo Bài Tập AI'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-indigo-600/10 border border-indigo-500/30 p-8 rounded-[2rem] shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-6xl">🐾</div>
                  <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Câu hỏi:</h3>
                  <p className="text-lg font-medium mb-6 leading-relaxed">{quiz.question}</p>
                  <input 
                    type="text" 
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Nhập kết quả..."
                    className="w-full bg-[#0b1220] border border-white/10 rounded-2xl px-5 py-4 mb-4 focus:border-indigo-500 outline-none shadow-inner text-indigo-100"
                  />
                  <div className="flex gap-2">
                    <button onClick={checkQuizAnswer} className="flex-1 bg-indigo-600 py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-500 active:scale-95 transition-all">Nộp Bài</button>
                    <button onClick={handleNewQuiz} className="w-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors"><i className="fas fa-random text-gray-400"></i></button>
                  </div>
                  {feedback && (
                    <div className={`mt-4 p-4 rounded-2xl text-sm font-bold animate-bounceIn ${feedback.includes('✅') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {feedback}
                    </div>
                  )}
                  {feedback.includes('❌') && quiz.hint && (
                    <div className="mt-2 text-xs text-yellow-500/80 italic p-2 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
                      💡 Gợi ý: {quiz.hint}
                    </div>
                  )}
                </div>
                {feedback.includes('✅') && (
                  <div className="bg-[#111a2e] p-6 rounded-[2rem] border border-white/5 animate-slideUp shadow-xl">
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <i className="fas fa-lightbulb text-yellow-500"></i> Mèo giải thích:
                    </h4>
                    <p className="text-xs text-gray-400 leading-loose whitespace-pre-wrap">{quiz.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === Tab.CHATS && (
          <div className="flex flex-col h-[calc(100vh-220px)] animate-fadeIn">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6 opacity-60">
                  <div className="text-8xl animate-float">💬</div>
                  <div>
                    <h3 className="font-bold text-lg">Chat với Mèo Gia Sư</h3>
                    <p className="text-xs px-8 mt-2 leading-relaxed">Gửi ảnh bài tập, dùng giọng nói hoặc nhập đề bài. Mèo sẽ giải đáp ngay!</p>
                  </div>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-sm relative ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#111a2e] border border-white/5 rounded-tl-none'}`}>
                    {msg.image && <img src={msg.image} className="rounded-xl mb-3 max-h-60 w-full object-cover border border-white/10 shadow-lg" alt="Toán học" />}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                        <p className="text-[10px] uppercase font-black text-indigo-300 tracking-widest flex items-center gap-1">
                          <i className="fas fa-globe"></i> Nguồn tham khảo:
                        </p>
                        {msg.sources.map((s, idx) => (
                          <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-gray-400 hover:text-indigo-400 truncate bg-white/5 p-2 rounded-lg transition-colors">
                            🔗 {s.title}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="text-[9px] opacity-40 mt-2 font-mono uppercase text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#111a2e] rounded-full px-5 py-3 flex gap-1.5 items-center border border-white/5 shadow-md">
                    <span className="text-[10px] font-bold text-indigo-400 italic mr-2">Mèo đang vắt óc...</span>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="mt-4 bg-[#111a2e] rounded-[2rem] p-2 flex items-center gap-2 border border-white/10 shadow-2xl relative">
              {isListening && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-5 py-2 rounded-full text-xs font-bold animate-pulse shadow-xl border border-white/20">
                  🎧 Đang lắng nghe...
                </div>
              )}
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                title="Gửi ảnh đề bài"
              >
                <i className="fas fa-camera text-lg"></i>
              </button>
              <button 
                onClick={startVoiceInput} 
                className={`w-10 h-10 flex items-center justify-center transition-colors ${isListening ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}
                title="Dùng giọng nói"
              >
                <i className="fas fa-microphone text-lg"></i>
              </button>
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                placeholder="Hỏi Mèo bất cứ bài nào..."
                className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-indigo-100 placeholder:text-gray-600"
              />
              <button 
                onClick={() => handleSendMessage(inputMessage)} 
                className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
              >
                <i className="fas fa-paper-plane text-xs"></i>
              </button>
              <input type="file" ref={fileInputRef} onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onloadend = () => handleSendMessage('', r.result as string);
                  r.readAsDataURL(f);
                }
              }} className="hidden" accept="image/*" />
            </div>
          </div>
        )}

        {activeTab === Tab.PROFILE && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col items-center py-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img src={user.avatar} className="w-28 h-28 rounded-full border-4 border-indigo-600 shadow-2xl relative z-10" alt="Avatar" />
                <div className="absolute bottom-0 right-0 bg-indigo-600 w-9 h-9 rounded-full flex items-center justify-center border-4 border-[#0b1220] z-20">
                  <i className="fas fa-pen text-[10px]"></i>
                </div>
              </div>
              <h2 className="mt-5 text-2xl font-bold">{user.name}</h2>
              <div className="mt-1 flex gap-2">
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 uppercase">Học sinh lớp 8</span>
                <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 uppercase">Pro User</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 px-2">
              <div className="bg-[#111a2e] p-5 rounded-3xl border border-white/5">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Cấp độ hiện tại</div>
                <div className="text-2xl font-bold text-indigo-400">{user.level}</div>
              </div>
              <div className="bg-[#111a2e] p-5 rounded-3xl border border-white/5">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Tổng điểm EXP</div>
                <div className="text-2xl font-bold text-pink-400">{user.exp}</div>
              </div>
            </div>

            <div className="bg-[#111a2e] rounded-[2.5rem] p-8 border border-white/5 space-y-6 shadow-xl">
              <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400 border-b border-white/5 pb-3">Cài đặt cá nhân</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Đổi tên</label>
                  <input 
                    type="text" 
                    value={user.name}
                    onChange={(e) => setUser(prev => ({...prev, name: e.target.value}))}
                    className="w-full bg-[#0b1220] border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-indigo-500 transition-all text-indigo-100"
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-300">Nhắc nhở học tập</span>
                  <div className="w-12 h-6 bg-indigo-600 rounded-full relative shadow-inner">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-300">Giọng nói Mèo</span>
                  <span className="text-xs font-bold text-indigo-400">Kore (Vui vẻ) 😺</span>
                </div>
              </div>
              <button 
                onClick={() => { 
                  if(confirm("Bạn có chắc chắn muốn xóa tất cả thành tích? Mèo sẽ buồn lắm đó... 😿")) {
                    localStorage.clear(); 
                    window.location.reload(); 
                  }
                }} 
                className="w-full bg-red-500/5 text-red-500 py-4 rounded-2xl font-bold border border-red-500/10 hover:bg-red-500/10 transition-colors mt-4"
              >
                Xóa hết dữ liệu & Bắt đầu lại
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 glass border border-white/10 rounded-[2.5rem] px-2 py-1 flex justify-around items-center shadow-2xl">
        <NavButton tab={Tab.HOME} icon="fa-house" label="Nhà" />
        <NavButton tab={Tab.LEARN} icon="fa-book" label="Sách" />
        <NavButton tab={Tab.PRACTICE} icon="fa-dumbbell" label="Luyện" />
        <NavButton tab={Tab.CHATS} icon="fa-comment-dots" label="Mèo AI" />
        <NavButton tab={Tab.PROFILE} icon="fa-user" label="Tôi" />
      </nav>
    </div>
  );
};

export default App;
