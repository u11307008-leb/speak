/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plane, Briefcase, Home, Utensils, ShoppingBag, 
  HeartPulse, Cpu, Leaf, Users, Gamepad,
  Mic, Square, Volume2, ChevronRight, RotateCcw,
  CheckCircle2, Loader2, Sparkles, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { TOPICS, AppState, PracticeSession } from './types';
import { generateSentences } from './lib/gemini';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  Plane, Briefcase, Home, Utensils, ShoppingBag,
  HeartPulse, Cpu, Leaf, Users, Gamepad
};

export default function App() {
  const [state, setState] = useState<AppState>('HOME');
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [results, setResults] = useState<{ word: string; isCorrect: boolean }[]>([]);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    console.log('EchoMaster: Initializing Speech Recognition...');
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      console.log('EchoMaster: Speech Recognition supported.');

      recognitionRef.current.onstart = () => {
        console.log('EchoMaster: Recognition started.');
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRecognizedText(transcript);
        evaluatePronunciation(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied.', {
            description: 'Please allow microphone access in your browser settings. If you are in a preview window, try opening the app in a new tab.',
            duration: 6000,
          });
        } else if (event.error !== 'no-speech') {
          toast.error('Speech recognition error: ' + event.error);
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [session]);

  const startPractice = async (topicId: string) => {
    setState('LOADING');
    try {
      const sentences = await generateSentences(topicId);
      setSession({
        topic: topicId,
        sentences,
        currentIndex: 0
      });
      setState('PRACTICE');
      setResults([]);
      setRecognizedText('');
    } catch (error) {
      toast.error('Failed to generate sentences. Please try again.');
      setState('HOME');
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setRecognizedText('');
      setResults([]);
      
      try {
        // Explicitly request microphone access to trigger the browser's permission prompt.
        // This is more reliable than SpeechRecognition.start() in some environments.
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the stream immediately, we just wanted the permission
        stream.getTracks().forEach(track => track.stop());
        
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e: any) {
        console.error('Microphone access error:', e);
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          toast.error('Microphone access denied.', {
            description: 'Please allow microphone access in your browser settings. If you are in a preview window, use the "Open in New Tab" button.',
            duration: 8000,
          });
        } else {
          toast.error("Could not start recording: " + e.message);
        }
      }
    }
  };

  const evaluatePronunciation = (transcript: string) => {
    if (!session) return;
    const target = session.sentences[session.currentIndex].text;
    const recognizedWords = transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);

    const evaluation = target.split(/\s+/).map(originalWord => {
      const cleanWord = originalWord.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      const isCorrect = recognizedWords.includes(cleanWord);
      return { word: originalWord, isCorrect };
    });

    setResults(evaluation);
    
    const correctCount = evaluation.filter(r => r.isCorrect).length;
    const accuracy = (correctCount / evaluation.length) * 100;
    
    if (accuracy >= 80) {
      toast.success('Great job! Your pronunciation is excellent.');
    } else if (accuracy >= 50) {
      toast.info('Good attempt! Try to focus on the red words.');
    } else {
      toast.error('Keep practicing! Listen to the demo again.');
    }
  };

  const nextSentence = () => {
    if (!session) return;
    if (session.currentIndex < session.sentences.length - 1) {
      setSession({ ...session, currentIndex: session.currentIndex + 1 });
      setResults([]);
      setRecognizedText('');
    } else {
      setState('RESULT');
    }
  };

  const reset = () => {
    setState('HOME');
    setSession(null);
    setResults([]);
    setRecognizedText('');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-orange-200 antialiased">
      <Toaster position="top-center" richColors />
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {state === 'HOME' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-6">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center justify-center p-4 bg-orange-100 rounded-3xl mb-4"
                >
                  <Sparkles className="w-10 h-10 text-orange-600" />
                </motion.div>
                <h1 className="text-6xl font-bold tracking-tight text-gray-900">EchoMaster</h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Master your English pronunciation with AI-powered themed practice. 
                  Choose a topic and start your journey from beginner to master.
                </p>
                <div className="pt-4 flex flex-col items-center space-y-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-gray-400 hover:text-orange-600 rounded-full"
                    onClick={() => window.open(window.location.href, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab (Fixes Microphone Issues)
                  </Button>
                  <p className="text-xs text-gray-400 max-w-md">
                    Note: Speech recognition requires a secure connection and microphone permissions. 
                    If the microphone doesn't start, please use the button above.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {TOPICS.map((topic, index) => {
                  const Icon = ICON_MAP[topic.icon];
                  return (
                    <motion.div
                      key={topic.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="group hover:border-orange-500 transition-all cursor-pointer border-2 border-transparent bg-white shadow-sm hover:shadow-md h-full"
                        onClick={() => startPractice(topic.id)}
                      >
                        <CardHeader className="flex flex-row items-center space-x-4 space-y-0 p-6">
                          <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-orange-50 transition-colors">
                            <Icon className="w-6 h-6 text-gray-600 group-hover:text-orange-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold">{topic.label}</CardTitle>
                          </div>
                        </CardHeader>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {state === 'LOADING' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
            >
              <div className="relative">
                <Loader2 className="w-16 h-16 text-orange-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-orange-600 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Generating your practice...</h2>
                <p className="text-gray-500 text-lg">Gemini is crafting 5 themed sentences for you.</p>
              </div>
            </motion.div>
          )}

          {state === 'PRACTICE' && session && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 px-3 py-1 text-sm">
                    {TOPICS.find(t => t.id === session.topic)?.label}
                  </Badge>
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">
                    Question {session.currentIndex + 1} of 5
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={reset} className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full px-4">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restart
                </Button>
              </div>

              <Progress value={((session.currentIndex + 1) / 5) * 100} className="h-2 bg-gray-200" />

              <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2rem]">
                <div className="h-3 bg-orange-500" />
                <CardContent className="p-12 sm:p-20 space-y-16">
                  <div className="space-y-8 text-center">
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-6 py-2 text-sm font-bold rounded-full">
                      {session.sentences[session.currentIndex].difficulty}
                    </Badge>
                    
                    <div className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight min-h-[6rem] flex flex-wrap justify-center gap-x-4 gap-y-3">
                      {results.length > 0 ? (
                        results.map((res, i) => (
                          <motion.span 
                            key={i}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                              "transition-colors duration-300",
                              res.isCorrect ? "text-green-600" : "text-red-500 underline decoration-4 underline-offset-[12px]"
                            )}
                          >
                            {res.word}
                          </motion.span>
                        ))
                      ) : (
                        <span className="text-gray-900">
                          {session.sentences[session.currentIndex].text}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-2xl text-gray-400 italic font-serif">
                      {session.sentences[session.currentIndex].translation}
                    </p>
                  </div>

                  <div className="flex flex-col items-center space-y-10">
                    <div className="flex items-center space-x-8">
                      <Button 
                        size="icon" 
                        variant="outline"
                        className="h-20 w-20 rounded-full border-2 border-gray-100 hover:bg-orange-50 hover:border-orange-500 transition-all group"
                        onClick={() => speak(session.sentences[session.currentIndex].text)}
                      >
                        <Volume2 className="w-10 h-10 text-gray-400 group-hover:text-orange-600" />
                      </Button>

                      <div className="relative">
                        {isRecording && (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: 0.2 }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 bg-red-500 rounded-full"
                          />
                        )}
                        <Button 
                          size="icon" 
                          className={cn(
                            "h-32 w-32 rounded-full shadow-2xl transition-all transform active:scale-95 relative z-10",
                            isRecording 
                              ? "bg-red-500 hover:bg-red-600" 
                              : "bg-orange-600 hover:bg-orange-700"
                          )}
                          onClick={toggleRecording}
                        >
                          {isRecording ? (
                            <Square className="w-12 h-12 text-white fill-white" />
                          ) : (
                            <Mic className="w-12 h-12 text-white" />
                          )}
                        </Button>
                      </div>

                      <Button 
                        size="icon" 
                        variant="outline"
                        disabled={results.length === 0}
                        className="h-20 w-20 rounded-full border-2 border-gray-100 hover:bg-green-50 hover:border-green-500 transition-all disabled:opacity-20 group"
                        onClick={nextSentence}
                      >
                        <ChevronRight className="w-10 h-10 text-gray-400 group-hover:text-green-600" />
                      </Button>
                    </div>

                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.4em]">
                        {isRecording ? "Listening..." : results.length > 0 ? "Review your results" : "Click mic to start reading"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <AnimatePresence>
                {recognizedText && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white/50 border border-gray-200 rounded-[2rem] p-8 text-center shadow-sm"
                  >
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">You said:</p>
                    <p className="text-2xl font-semibold text-gray-700 italic">"{recognizedText}"</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {state === 'RESULT' && session && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto text-center space-y-12 py-12"
            >
              <div className="space-y-6">
                <motion.div 
                  initial={{ rotate: -10, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="inline-flex items-center justify-center p-8 bg-green-100 rounded-[3rem] mb-4"
                >
                  <CheckCircle2 className="w-24 h-24 text-green-600" />
                </motion.div>
                <h2 className="text-6xl font-bold tracking-tight">Session Complete!</h2>
                <p className="text-2xl text-gray-500 max-w-lg mx-auto leading-relaxed">
                  Excellent work! You've mastered the {TOPICS.find(t => t.id === session.topic)?.label} set.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-8">
                <Button 
                  size="lg" 
                  className="bg-orange-600 hover:bg-orange-700 h-20 text-xl font-bold rounded-[2rem] shadow-xl hover:shadow-2xl transition-all"
                  onClick={reset}
                >
                  Choose Another Topic
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
