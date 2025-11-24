
import React, { useState, useEffect, useCallback } from 'react';
import { DailyContent, UserState } from '../types';
import { fetchDailyWisdom } from '../services/geminiService';
import { ChevronLeft, ChevronRight, CheckCircle, Heart, BookOpen, Lightbulb, Share, Settings } from './Icons';
// @ts-ignore
import confetti from 'canvas-confetti';
// @ts-ignore
import html2canvas from 'html2canvas';

interface DailyViewProps {
  user: UserState;
  onUpdateUser: (updates: Partial<UserState>) => void;
}

// Helper to parse markdown bold (**text**) into JSX
const parseBold = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-royal-900 dark:text-gold-400">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const LOADING_MESSAGES = [
  "Consultando os pergaminhos antigos...",
  "Traduzindo a sabedoria de Salomão...",
  "Preparando reflexões para o dia de hoje...",
  "Buscando entendimento...",
  "Organizando os versículos..."
];

const DailyView: React.FC<DailyViewProps> = ({ user, onUpdateUser }) => {
  const [content, setContent] = useState<DailyContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [journalText, setJournalText] = useState('');
  const [showNextSuggestion, setShowNextSuggestion] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // Cycle loading messages
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Use a cache key to avoid refetching if we already have it in memory or LS
  const loadContent = useCallback(async (day: number) => {
    setLoading(true);
    setError(null);
    setShowNextSuggestion(false);
    
    // Updated cache key version for new fields (Curiosity + Bold formatting)
    const cacheKey = `wisdom_day_${day}_v3_ai`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        setContent(JSON.parse(cached));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      // Increased timeout to 45 seconds to allow full chapter generation
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT")), 45000)
      );

      // Pass user's custom key if available
      const result = await Promise.race([
        fetchDailyWisdom(day, user.customApiKey),
        timeoutPromise
      ]);

      if (result) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
          setContent(result);
        } catch (e) {
          console.warn("Could not cache to local storage", e);
          setContent(result);
        }
      } else {
        throw new Error("Resposta vazia da IA.");
      }
    } catch (err: any) {
      console.error("Load content error:", err);
      if (err.message === "MISSING_API_KEY") {
        setError("API_KEY_REQUIRED");
      } else if (err.message === "TIMEOUT") {
        setError("O tempo de espera esgotou. A sabedoria requer paciência, mas sua conexão pode estar lenta.");
      } else {
        setError("Não foi possível carregar o capítulo. Verifique sua chave de API e conexão.");
      }
    } finally {
      setLoading(false);
    }
  }, [user.customApiKey]);

  useEffect(() => {
    loadContent(user.currentDay);
    setJournalText(user.journalEntries[user.currentDay] || '');
  }, [user.currentDay, loadContent, user.journalEntries]);

  const handleNextDay = () => {
    if (user.currentDay < 31) {
      onUpdateUser({ currentDay: user.currentDay + 1 });
      window.scrollTo(0, 0);
    }
  };

  const handlePrevDay = () => {
    if (user.currentDay > 1) {
      onUpdateUser({ currentDay: user.currentDay - 1 });
      window.scrollTo(0, 0);
    }
  };

  const toggleComplete = () => {
    const isCompleted = user.completedDays.includes(user.currentDay);
    let newCompleted = [...user.completedDays];
    
    if (isCompleted) {
      newCompleted = newCompleted.filter(d => d !== user.currentDay);
      setShowNextSuggestion(false);
    } else {
      newCompleted.push(user.currentDay);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#fbbf24', '#1e3a8a', '#ffffff'],
        disableForReducedMotion: true
      });

      if (user.currentDay < 31) {
        setShowNextSuggestion(true);
      }
    }
    onUpdateUser({ completedDays: newCompleted });
  };

  const toggleFavorite = () => {
    const isFav = user.favorites.includes(user.currentDay);
    let newFavs = [...user.favorites];
    if (isFav) {
      newFavs = newFavs.filter(d => d !== user.currentDay);
    } else {
      newFavs.push(user.currentDay);
    }
    onUpdateUser({ favorites: newFavs });
  };

  const saveJournal = (text: string) => {
    setJournalText(text);
    onUpdateUser({
      journalEntries: {
        ...user.journalEntries,
        [user.currentDay]: text
      }
    });
  };

  const handleShare = async () => {
    setIsSharing(true);
    const element = document.getElementById('share-card');
    if (!element) return;
    
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(element, {
        scale: 2, 
        backgroundColor: '#172554', 
        useCORS: true
      });

      canvas.toBlob((blob: Blob | null) => {
        if (!blob) return;
        
        if (navigator.share) {
          const file = new File([blob], 'sabedoria-do-dia.png', { type: 'image/png' });
          navigator.share({
            title: 'Sabedoria de Salomão',
            text: `Provérbios ${user.currentDay} - Uma jornada de sabedoria.`,
            files: [file],
          }).catch(console.error);
        } else {
          const link = document.createElement('a');
          link.download = `sabedoria-dia-${user.currentDay}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      });
    } catch (err) {
      console.error("Erro ao compartilhar", err);
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse px-6 text-center">
        <div className="w-16 h-16 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-royal-900 dark:text-gold-400 font-serif text-lg font-medium">{LOADING_MESSAGES[loadingMsgIndex]}</p>
        <p className="text-xs text-slate-400 mt-4">Isso pode levar alguns segundos...</p>
      </div>
    );
  }

  // SPECIAL ERROR SCREEN FOR MISSING API KEY
  if (error === "API_KEY_REQUIRED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl border-2 border-gold-400 max-w-md w-full">
          <Settings size={48} className="mx-auto text-gold-500 mb-4" />
          <h3 className="text-xl font-serif font-bold text-royal-900 dark:text-white mb-2">Configuração Necessária</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
            Para gerar a sabedoria de hoje, o aplicativo precisa de uma Chave de API do Google (gratuita).
          </p>
          
          <input 
            type="password"
            placeholder="Cole sua chave API aqui (AIza...)"
            className="w-full p-3 mb-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            value={tempApiKey}
            onChange={(e) => setTempApiKey(e.target.value)}
          />

          <div className="space-y-3">
            <button 
              onClick={() => {
                onUpdateUser({ customApiKey: tempApiKey });
                // Attempt to reload immediately after state update (might need effect, but usually re-render triggers)
                setTimeout(() => loadContent(user.currentDay), 100);
              }}
              disabled={!tempApiKey}
              className="w-full py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-bold shadow-lg disabled:opacity-50"
            >
              Salvar e Carregar
            </button>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              className="block text-xs text-royal-600 dark:text-gold-400 underline"
            >
              Clique aqui para obter sua chave grátis no Google
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-900/50 max-w-md w-full">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || "Erro desconhecido."}</p>
          <button 
            onClick={() => loadContent(user.currentDay)} 
            className="px-6 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-100 rounded-lg transition font-medium w-full"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = user.completedDays.includes(user.currentDay);
  const isFavorite = user.favorites.includes(user.currentDay);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24 pt-4 fade-in">
      
      {/* HIDDEN SHARE CARD */}
      <div 
        id="share-card" 
        className="fixed -left-[9999px] top-0 w-[600px] h-[600px] bg-gradient-to-br from-royal-900 to-royal-800 text-white p-12 flex flex-col justify-between"
      >
        <div className="text-center">
           <div className="flex justify-center mb-6">
             <div className="bg-gold-500/20 p-4 rounded-full">
               <BookOpen size={48} className="text-gold-400" />
             </div>
           </div>
           <h2 className="text-4xl font-serif font-bold text-white mb-2">{content.scriptureReference}</h2>
           <div className="w-24 h-1 bg-gold-500 mx-auto mb-8"></div>
           
           <div className="bg-white/10 p-8 rounded-xl backdrop-blur-sm border border-white/10">
              <p className="text-xl leading-relaxed font-serif text-slate-100 italic">
                "{content.interpretation.replace(/\*\*/g, '')}"
              </p>
           </div>
        </div>

        <div className="text-center mt-8">
           <p className="text-gold-400 uppercase tracking-[0.2em] text-sm font-medium">Sabedoria de Salomão</p>
           <p className="text-xs text-slate-400 mt-1">por Marinalva Callegario</p>
        </div>
      </div>

      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={handlePrevDay}
          disabled={user.currentDay === 1}
          className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition ${user.currentDay === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <ChevronLeft className="text-royal-800 dark:text-gold-400" />
        </button>
        
        <span className="font-serif font-bold text-lg text-royal-900 dark:text-slate-200">
          Dia {content.day} de 31
        </span>

        <button 
          onClick={handleNextDay}
          disabled={user.currentDay === 31}
          className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition ${user.currentDay === 31 ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <ChevronRight className="text-royal-800 dark:text-gold-400" />
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        
        {/* Top Decoration */}
        <div className="h-2 bg-gradient-to-r from-royal-800 via-gold-500 to-royal-800"></div>

        <div className="p-6 md:p-8">
          
          {/* Header & Actions */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
               <div className="bg-gold-100 dark:bg-gold-900/30 p-2 rounded-lg text-gold-600 dark:text-gold-400">
                  <BookOpen size={24} />
               </div>
               <div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-royal-900 dark:text-white">
                    {content.scriptureReference}
                  </h2>
                  <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Leitura Completa</p>
               </div>
            </div>
            <div className="flex gap-2">
               <button onClick={handleShare} className="transition-transform active:scale-95 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-royal-800 dark:text-gold-400" title="Compartilhar">
                 <Share size={24} />
               </button>
               <button onClick={toggleFavorite} className="transition-transform active:scale-95 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                 <Heart 
                  className={isFavorite ? "text-red-500" : "text-slate-300 hover:text-red-400"} 
                  fill={isFavorite ? "currentColor" : "none"} 
                />
               </button>
            </div>
          </div>

          {/* Full Scripture Text (Verse by Verse) */}
          <div className="mb-10 p-6 bg-paper-light dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="space-y-4">
              {content.scriptureVerses && content.scriptureVerses.length > 0 ? (
                content.scriptureVerses.map((item) => (
                  <div key={item.verse} className="flex gap-3 items-start group">
                    <span className="text-xs font-bold text-gold-500 mt-1.5 w-6 text-right font-serif opacity-70 group-hover:opacity-100 select-none">
                      {item.verse}
                    </span>
                    <p className="flex-1 text-lg text-slate-700 dark:text-slate-300 font-serif leading-relaxed text-justify">
                      {item.text}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 italic">Texto não disponível.</p>
              )}
            </div>
          </div>
          
          <div className="w-full h-px bg-slate-200 dark:bg-slate-700 mb-10"></div>

          {/* Interpretation */}
          <div className="mb-8">
            <h3 className="text-lg font-bold font-serif text-royal-900 dark:text-slate-100 mb-3">
              Entendimento
            </h3>
            <div className="p-4 bg-royal-50 dark:bg-royal-900/20 rounded-xl border-l-4 border-royal-800 dark:border-royal-400">
               <p className="text-slate-700 dark:text-slate-300 leading-7">
                 {parseBold(content.interpretation)}
               </p>
            </div>
          </div>

          {/* Practical Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-bold font-serif text-royal-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gold-100 dark:bg-gold-900 flex items-center justify-center text-gold-600 text-xs">⚡</span>
              Aplicação Prática
            </h3>
            <ul className="space-y-3">
              {content.practicalSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-royal-800 dark:bg-gold-500 flex-shrink-0"></span>
                  <span>{parseBold(step)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Historical Curiosity */}
          {content.historicalCuriosity && (
            <div className="mb-8">
               <h3 className="text-lg font-bold font-serif text-royal-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                 <Lightbulb className="text-gold-500" size={20} />
                 Curiosidade Histórica
               </h3>
               <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                 <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                   "{content.historicalCuriosity}"
                 </p>
               </div>
            </div>
          )}

          {/* Reflection Area */}
          <div className="mt-8">
             <h3 className="text-lg font-bold font-serif text-royal-900 dark:text-slate-100 mb-3">
              Reflexão
            </h3>
            <p className="text-slate-600 dark:text-slate-400 italic mb-4">
              {parseBold(content.reflectionQuestion)}
            </p>
            <textarea
              value={journalText}
              onChange={(e) => saveJournal(e.target.value)}
              placeholder="Escreva seus pensamentos e orações sobre o capítulo de hoje..."
              className="w-full p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition resize-none min-h-[150px] dark:text-white"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-center gap-4">
          <button
            onClick={toggleComplete}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all transform active:scale-95 ${
              isCompleted 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                : 'bg-royal-800 text-white hover:bg-royal-900 shadow-lg shadow-royal-900/20'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle size={20} />
                Leitura Concluída
              </>
            ) : (
              "Marcar como Lido"
            )}
          </button>
          
          {showNextSuggestion && user.currentDay < 31 && (
             <button
               onClick={handleNextDay}
               className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium bg-gold-100 text-gold-700 hover:bg-gold-200 dark:bg-gold-900/40 dark:text-gold-300 transition-all animate-pulse"
             >
               Ler Próximo Dia <ChevronRight size={18} />
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyView;
