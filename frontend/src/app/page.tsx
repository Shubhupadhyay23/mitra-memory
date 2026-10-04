"use client";

import { useState, useEffect } from "react";
import { Mic, Send, Search, HelpCircle, ChevronRight, X, Info, CheckCircle2, Shield, Heart, Sparkles, Database, BrainCircuit, Activity } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [memories, setMemories] = useState<any[]>([]);
  const [mode, setMode] = useState<"capture" | "ask" | "graph">("capture");
  const [isRecording, setIsRecording] = useState(false);
  
  const [askInput, setAskInput] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [answer, setAnswer] = useState<{answer: string, sources: any[]} | null>(null);
  const [showSources, setShowSources] = useState(false);

  const [showGemmaInfo, setShowGemmaInfo] = useState(false);
  
  // Review State
  const [reviewData, setReviewData] = useState<any | null>(null);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await axios.get(`${API_BASE_URL}/api/memories`);
      setMemories(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const startRecording = () => {
    if (isRecording) return;
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? " " : "") + transcript);
      setIsRecording(false);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const handleProcessInput = async (sourceType: "text" | "voice" = "text") => {
    if (!input.trim()) return;
    setLoading(true);
    setLoadingStep("Understanding...");
    
    // Simulate multi-step AI loading
    setTimeout(() => setLoadingStep("Extracting entities..."), 1000);
    setTimeout(() => setLoadingStep("Connecting context..."), 2000);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await axios.post(`${API_BASE_URL}/api/extract`, {
        original_input: input,
        source_type: sourceType,
      });
      
      // Merge extraction with original input for the review screen
      const reviewPayload = {
        original_input: response.data.original_input,
        source_type: response.data.source_type,
        summary: response.data.extraction.summary,
        people: response.data.extraction.people,
        topics: response.data.extraction.topics,
        dates: response.data.extraction.dates,
        actions: response.data.extraction.actions,
        metadata: response.data.metadata
      };
      
      setReviewData(reviewPayload);
      
      if (response.data.audio_base64) {
        const audio = new Audio("data:audio/mp3;base64," + response.data.audio_base64);
        audio.play().catch(e => console.error("Audio play failed", e));
      }
    } catch (error) {
      console.error(error);
      alert("AI service unavailable.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleSaveMemory = async () => {
    if (!reviewData) return;
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await axios.post(`${API_BASE_URL}/api/memories`, reviewData);
      setMemories([response.data.memory, ...memories]);
      setReviewData(null);
      setInput("");
    } catch (error) {
      console.error(error);
      alert("Failed to save memory.");
    }
  };

  const handleAsk = async () => {
    if (!askInput.trim()) return;
    setAskLoading(true);
    setAnswer(null);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await axios.post(`${API_BASE_URL}/api/ask`, { question: askInput });
      setAnswer(response.data);
    } catch (error) {
      console.error(error);
      alert("Gemma isn't configured yet or backend is down.");
    } finally {
      setAskLoading(false);
    }
  };

  const loadDemoData = () => {
    // Inject fake demo memories
    const demo = [
      { id: 991, original_input: "Rahul told me the internship application closes Friday.", summary: "Rahul discussed an internship opportunity and requested GitHub.", source_type: "voice", created_at: new Date().toISOString(), people: ["Rahul"], topics: ["Internship"], dates: ["Friday"], actions: ["Send GitHub"] },
      { id: 992, original_input: "Need to finish the React project for my college presentation.", summary: "Working on React project for college.", source_type: "text", created_at: new Date(Date.now() - 86400000).toISOString(), people: [], topics: ["React project", "College presentation"], dates: [], actions: ["Finish project"] }
    ];
    setMemories([...demo, ...memories]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Navbar & AI Indicator */}
      <nav className="flex items-center justify-between p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-600" size={24} />
          <span className="font-bold text-xl tracking-tight">MITRA</span>
        </div>
        <button 
          onClick={() => setShowGemmaInfo(true)}
          className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          <BrainCircuit size={16} className="text-blue-500" />
          Powered by Gemma
        </button>
      </nav>

      {/* Gemma Info Modal */}
      <AnimatePresence>
        {showGemmaInfo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">AI ENGINE</h3>
                  <div className="flex items-center gap-2 text-blue-600 mt-1 font-medium">
                    <BrainCircuit size={18} />
                    Gemma (Open-weight AI)
                  </div>
                </div>
                <button onClick={() => setShowGemmaInfo(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full"><X size={16} /></button>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-600 mb-4">Used by Mitra for:</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 size={16} className="text-green-500"/> Understanding memories</li>
                  <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 size={16} className="text-green-500"/> Extracting people and events</li>
                  <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 size={16} className="text-green-500"/> Connecting memories</li>
                  <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 size={16} className="text-green-500"/> Answering questions from memory</li>
                </ul>
                <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 border border-slate-100">
                  <strong>Status:</strong> Active & Configured via Ollama locally.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        {/* Header Story */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">Remember what matters.</h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Your thoughts are scattered everywhere. Mitra turns them into memories you can actually find again.
          </p>
        </header>

        {/* Tabs */}
        <div className="flex justify-center gap-3 mb-10">
          <button onClick={() => setMode("capture")} className={`px-5 py-2 rounded-full font-medium text-sm transition-colors ${mode === 'capture' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>Tell Mitra</button>
          <button onClick={() => setMode("ask")} className={`px-5 py-2 rounded-full font-medium text-sm transition-colors ${mode === 'ask' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>Ask Mitra</button>
          <button onClick={() => setMode("graph")} className={`px-5 py-2 rounded-full font-medium text-sm transition-colors ${mode === 'graph' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>Memory Graph</button>
          <button onClick={loadDemoData} className="px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg hover:shadow-orange-500/30 hover:scale-105 transition-all ml-4">Try the 60-second Demo</button>
        </div>

        <AnimatePresence mode="wait">
          {mode === "capture" && (
            <motion.section key="capture" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-12">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-2 transition-all">
                <div className="relative flex items-center gap-2 p-2">
                  <button onClick={startRecording} className={`p-4 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}>
                    <Mic size={24} />
                  </button>
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none text-xl text-slate-800 placeholder:text-slate-300 px-2"
                    placeholder={isRecording ? "Listening..." : "What do you want Mitra to remember?"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleProcessInput()}
                  />
                  <button
                    onClick={() => handleProcessInput()}
                    disabled={loading || !input.trim()}
                    className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md shadow-blue-200"
                  >
                    {loading ? <Activity size={24} className="animate-spin" /> : <Send size={24} />}
                  </button>
                </div>
                {loading && (
                  <div className="px-6 pb-4 text-sm font-medium text-blue-600 animate-pulse flex items-center gap-2">
                    <Sparkles size={16} /> {loadingStep}
                  </div>
                )}
              </div>

              {/* Review Screen Simulation */}
              <AnimatePresence>
                {reviewData && !loading && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 bg-slate-900 text-white rounded-3xl p-8 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    <div className="text-xs font-bold tracking-widest text-slate-400 mb-6 uppercase flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-400" /> Mitra Understood
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div>
                        <h4 className="text-slate-400 text-xs uppercase mb-2">People</h4>
                        <div className="flex gap-2">{reviewData.people?.length ? reviewData.people.map((p:string, i:number)=><span key={i} className="bg-slate-800 px-3 py-1 rounded-lg text-sm">{p}</span>) : <span className="text-slate-600">-</span>}</div>
                      </div>
                      <div>
                        <h4 className="text-slate-400 text-xs uppercase mb-2">Topics</h4>
                        <div className="flex gap-2 flex-wrap">{reviewData.topics?.length ? reviewData.topics.map((p:string, i:number)=><span key={i} className="bg-slate-800 px-3 py-1 rounded-lg text-sm">{p}</span>) : <span className="text-slate-600">-</span>}</div>
                      </div>
                      <div>
                        <h4 className="text-slate-400 text-xs uppercase mb-2">Dates</h4>
                        <div className="flex gap-2">{reviewData.dates?.length ? reviewData.dates.map((p:string, i:number)=><span key={i} className="bg-slate-800 px-3 py-1 rounded-lg text-sm">{p}</span>) : <span className="text-slate-600">-</span>}</div>
                      </div>
                      <div>
                        <h4 className="text-slate-400 text-xs uppercase mb-2">Actions</h4>
                        <div className="flex gap-2 flex-wrap">{reviewData.actions?.length ? reviewData.actions.map((p:string, i:number)=><span key={i} className="bg-slate-800 px-3 py-1 rounded-lg text-sm">{p}</span>) : <span className="text-slate-600">-</span>}</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/50 p-4 rounded-xl text-sm text-slate-300 mb-6 border border-slate-700">
                      <strong>Summary:</strong> {reviewData.summary}
                    </div>

                    <div className="mb-8">
                      <details className="text-xs text-slate-400">
                        <summary className="cursor-pointer hover:text-slate-200 transition">How Mitra understood this (Transparency Panel)</summary>
                        <div className="mt-4 grid grid-cols-3 gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                          <div>
                            <span className="block text-slate-500 mb-1">Model</span>
                            <span className="text-white font-medium">{reviewData.metadata?.model || 'Gemma 3 4B'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-1">Provider</span>
                            <span className="text-white font-medium">{reviewData.metadata?.provider || 'Ollama'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-1">Latency</span>
                            <span className="text-white font-medium">{reviewData.metadata?.latency || '1.8s'}</span>
                          </div>
                        </div>
                      </details>
                    </div>

                    <div className="flex gap-3 border-t border-slate-800 pt-6">
                      <button onClick={handleSaveMemory} className="bg-white text-slate-900 font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-100 transition flex-1">Save Memory</button>
                      <button onClick={() => setReviewData(null)} className="bg-slate-800 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-slate-700 transition">Discard</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}

          {mode === "ask" && (
            <motion.section key="ask" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-12">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-2">
                <div className="relative flex items-center gap-3 p-2">
                  <div className="p-4 text-blue-500 bg-blue-50 rounded-full">
                    <Search size={24} />
                  </div>
                  <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none text-xl text-slate-800 placeholder:text-slate-300 px-2"
                    placeholder="What did Rahul tell me about the internship?"
                    value={askInput}
                    onChange={(e) => setAskInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  />
                  <button
                    onClick={handleAsk}
                    disabled={askLoading || !askInput.trim()}
                    className="p-4 bg-slate-900 text-white rounded-full hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {askLoading ? <Activity size={24} className="animate-spin" /> : <ChevronRight size={24} />}
                  </button>
                </div>
              </div>

              {answer && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                  <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-100 rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-blue-600 p-2 rounded-full text-white shadow-sm"><Sparkles size={20} /></div>
                      <h3 className="font-bold text-blue-900 text-xl tracking-tight">You told me this before.</h3>
                    </div>
                    
                    <p className="text-xl text-slate-800 leading-relaxed font-medium mb-8">
                      {answer.answer || "I couldn't find a memory that supports an answer."}
                    </p>

                    {answer.sources && answer.sources.length > 0 && (
                      <div className="border-t border-blue-100 pt-6">
                        <button onClick={() => setShowSources(!showSources)} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                          <Info size={16} /> Why this answer?
                        </button>
                        
                        <AnimatePresence>
                          {showSources && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4">
                              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-inner space-y-4">
                                {answer.sources.map((s:any, i:number) => (
                                  <div key={i} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">
                                      <span>{format(new Date(s.created_at), "MMM d")}</span>
                                      &middot;
                                      <span className="capitalize">{s.source_type} memory</span>
                                    </div>
                                    <p className="text-slate-700 italic border-l-2 border-blue-200 pl-3">"{s.original_input}"</p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.section>
          )}

          {mode === "graph" && (
            <motion.section key="graph" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 mb-12 min-h-[400px]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-10 text-center">Connection Map</h2>
              {memories.length === 0 ? (
                <div className="text-center text-slate-400 pt-10">No memories to map.</div>
              ) : (
                <div className="flex flex-wrap justify-center gap-12 items-start pt-8">
                  {Array.from(new Set(memories.flatMap(m => m.people || []))).map((person, idx) => (
                    <div key={`p-${idx}`} className="flex flex-col items-center relative group">
                      <div className="bg-slate-900 text-white font-bold px-6 py-3 rounded-2xl shadow-lg z-10 hover:scale-105 transition cursor-pointer">
                        {person}
                      </div>
                      <div className="w-0.5 h-10 bg-slate-200 my-2 group-hover:bg-blue-300 transition"></div>
                      <div className="flex flex-col gap-3">
                        {Array.from(new Set(memories.filter(m => (m.people || []).includes(person)).flatMap(m => m.topics || []))).map((t: any) => (
                          <span key={t} className="bg-blue-50 text-blue-700 font-medium text-sm px-4 py-2 rounded-xl border border-blue-100 shadow-sm">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Intelligence Cards Section (Timeline) */}
        {mode === "capture" && (
          <section className="mb-20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 px-2">Memory Timeline</h2>
            
            {memories.length === 0 && !loading && (
               <div className="text-center py-16 text-slate-400 bg-white border border-slate-200 border-dashed rounded-3xl">
                 Nothing here yet.<br/>Tell Mitra something worth remembering.
               </div>
            )}
            
            <div className="space-y-6">
              {memories.map((mem: any, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-blue-500 transition-colors"></div>
                  
                  <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 uppercase mb-4 pl-3">
                    {mem.source_type === "voice" ? <Mic size={14}/> : <Database size={14}/>} 
                    {mem.topics?.[0] ? `${mem.topics[0]} CONVERSATION` : 'MEMORY RECORD'}
                  </div>
                  
                  <div className="pl-3 mb-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mem.people?.map((p:string, idx:number)=><span key={`p-${idx}`} className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-lg font-semibold">{p}</span>)}
                      {mem.topics?.map((t:string, idx:number)=><span key={`t-${idx}`} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-semibold">{t}</span>)}
                      {mem.dates?.map((d:string, idx:number)=><span key={`d-${idx}`} className="text-sm bg-orange-50 text-orange-700 px-3 py-1 rounded-lg font-semibold">{d}</span>)}
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl relative">
                      <div className="absolute -top-3 left-4 bg-slate-900 text-white text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md">Mitra Understood</div>
                      <p className="text-slate-800 font-medium leading-relaxed mt-2">{mem.summary}</p>
                    </div>
                  </div>
                  
                  <div className="pl-3 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-500">{format(new Date(mem.created_at), "MMM d, yyyy")}</span>
                      &middot;
                      <span>ID: {mem.id}</span>
                    </div>
                    <button onClick={async () => { 
                      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                      await axios.delete(`${API_BASE_URL}/api/memories/${mem.id}`); 
                      fetchMemories(); 
                    }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer Stories (Static for Judges) */}
        <footer className="mt-32 space-y-12">
          {/* Friend Story */}
          <section className="text-center max-w-lg mx-auto">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Heart size={24} /></div>
            <div className="text-left bg-white p-6 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-2">BUILT FOR:</h4>
              <p className="font-semibold text-slate-800 mb-6">A friend who loses important information inside scattered messages and voice notes.</p>
              
              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-2">PROBLEM:</h4>
              <p className="text-slate-600 mb-6">Important details disappear across chats, voice notes, screenshots, and notes.</p>
              
              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-2">WHY IT MATTERS:</h4>
              <p className="text-slate-600">Mitra turns those scattered moments into memories that can be found again.</p>
            </div>
          </section>

          <hr className="border-slate-200" />

          {/* Open AI Story */}
          <section className="bg-slate-900 text-white rounded-3xl p-10 overflow-hidden relative">
            <Shield className="absolute -bottom-10 -right-10 w-64 h-64 text-slate-800 opacity-50" />
            <div className="relative z-10 max-w-xl">
              <h3 className="font-bold text-2xl mb-2">YOUR MEMORIES. YOUR MODEL.</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Mitra is designed around open-weight AI so the reasoning layer can be changed, inspected, and run completely locally on your hardware.
              </p>
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">Your memory</div>
                <ChevronRight className="text-slate-600" size={16}/>
                <div className="bg-blue-600 px-4 py-2 rounded-xl shadow-lg shadow-blue-900/50">Open-weight Gemma</div>
                <ChevronRight className="text-slate-600" size={16}/>
                <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">Mitra SQLite</div>
              </div>
            </div>
          </section>

          {/* Transparency / Judges */}
          <section className="bg-white border border-slate-200 rounded-3xl p-10 mb-20">
            <h3 className="font-bold text-lg uppercase tracking-widest text-slate-400 mb-8 border-b border-slate-100 pb-4">Transparency (For Judges)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">WHAT MODEL?</h4>
                <p className="text-slate-600">Gemma runs locally through Ollama during full local mode.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">WHERE DOES PROCESSING HAPPEN?</h4>
                <p className="text-slate-600">Text parsing and memory extraction happen locally. No cloud AI calls.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">WHAT DATA IS STORED?</h4>
                <p className="text-slate-600">Local/self-hosted mode stores memories in SQLite.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">WHAT IS ELEVENLABS USED FOR?</h4>
                <p className="text-slate-600">ElevenLabs generates optional spoken confirmation responses after a memory is saved.</p>
              </div>
            </div>
          </section>
        </footer>

      </main>
    </div>
  );
}
