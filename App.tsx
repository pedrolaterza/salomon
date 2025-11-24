
import React, { useState, useEffect, useRef } from 'react';
import { UserState, ViewState } from './types';
import DailyView from './components/DailyView';
import { BookOpen, Feather, Info, Settings, Moon, Sun, Heart, Star, ChevronRight, CheckCircle, Bell } from './components/Icons';

const DEFAULT_USER: UserState = {
  name: '',
  currentDay: 1,
  completedDays: [],
  journalEntries: {},
  favorites: [],
  theme: 'light',
  isOnboarded: false,
  notificationsEnabled: false,
  notificationTime: '08:00'
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserState>(DEFAULT_USER);
  const [view, setView] = useState<ViewState>('home');
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0); // 0: Name, 1: Instructions
  const lastNotificationDateRef = useRef<string>('');

  // Load User Data
  useEffect(() => {
    const saved = localStorage.getItem('solomon_user_v1');
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  // Save User Data & Theme Effect
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('solomon_user_v1', JSON.stringify(user));
      
      // Apply theme
      const html = document.documentElement;
      if (user.theme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }, [user, loading]);

  // Check for notifications
  useEffect(() => {
    if (!user.notificationsEnabled || !user.notificationTime) return;

    const checkTime = () => {
      const now = new Date();
      const [hours, minutes] = user.notificationTime.split(':').map(Number);
      const todayString = now.toDateString();

      // If we haven't notified today
      if (lastNotificationDateRef.current !== todayString) {
        if (now.getHours() === hours && now.getMinutes() === minutes) {
          if (Notification.permission === 'granted') {
             new Notification('Jornada de Sabedoria', {
               body: `O pergaminho do dia ${user.currentDay} está pronto para você, ${user.name}.`,
               icon: '/favicon.ico' // Assuming standard favicon
             });
             lastNotificationDateRef.current = todayString;
          }
        }
      }
    };

    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user.notificationsEnabled, user.notificationTime, user.currentDay, user.name]);

  const updateUser = (updates: Partial<UserState>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("Seu navegador não suporta notificações.");
      return;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      updateUser({ notificationsEnabled: true });
    } else {
      updateUser({ notificationsEnabled: false });
      alert("Permissão para notificações foi negada.");
    }
  };

  // Onboarding Screen
  if (!loading && !user.isOnboarded) {
    if (onboardingStep === 0) {
      return (
        <div className="min-h-screen bg-paper-light dark:bg-paper-dark flex items-center justify-center p-6 text-center fade-in transition-colors duration-300">
          <div className="max-w-md w-full">
            <h1 className="text-4xl font-serif font-bold text-royal-900 dark:text-gold-400 mb-4">Jornada de Sabedoria</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-8">Bem-vindo a uma experiência de 31 dias com os provérbios de Salomão.</p>
            
            <div className="mb-6">
              <label className="block text-left text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Como prefere ser chamado?</label>
              <input 
                type="text" 
                className="w-full p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-gold-400 outline-none transition-colors placeholder-slate-400 dark:placeholder-slate-300"
                placeholder="Seu nome"
                onChange={(e) => updateUser({ name: e.target.value })}
                value={user.name}
              />
            </div>
            
            <button 
              disabled={!user.name.trim()}
              onClick={() => setOnboardingStep(1)}
              className="w-full bg-royal-800 text-white py-4 rounded-lg font-medium hover:bg-royal-900 disabled:opacity-50 transition"
            >
              Continuar
            </button>
            <p className="mt-8 text-xs text-slate-400">Sabedoria de Salomão por Marinalva Callegario</p>
          </div>
        </div>
      );
    } else {
      // Step 2: Instructions
      return (
        <div className="min-h-screen bg-royal-900/90 fixed inset-0 z-50 flex items-center justify-center p-6 fade-in">
          <div className="bg-white dark:bg-slate-800 max-w-sm w-full rounded-2xl p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gold-400 to-gold-600"></div>
             
             <div className="flex justify-center mb-6">
               <div className="bg-gold-100 dark:bg-gold-900/30 p-4 rounded-full">
                 <BookOpen size={40} className="text-gold-600 dark:text-gold-400" />
               </div>
             </div>

             <h2 className="text-2xl font-serif font-bold text-center text-royal-900 dark:text-white mb-4">
               Como funciona
             </h2>

             <ul className="space-y-4 mb-8 text-slate-600 dark:text-slate-300 text-left">
               <li className="flex items-start gap-3">
                 <span className="bg-royal-100 dark:bg-royal-900 text-royal-700 dark:text-royal-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                 <span>Um capítulo de Provérbios por dia.</span>
               </li>
               <li className="flex items-start gap-3">
                 <span className="bg-royal-100 dark:bg-royal-900 text-royal-700 dark:text-royal-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                 <span>Leia a aplicação prática e a reflexão.</span>
               </li>
               <li className="flex items-start gap-3">
                 <span className="bg-royal-100 dark:bg-royal-900 text-royal-700 dark:text-royal-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                 <span>Complete os 31 dias para ganhar sabedoria.</span>
               </li>
             </ul>

             <button 
                onClick={() => updateUser({ isOnboarded: true })}
                className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 rounded-lg shadow-lg transition transform active:scale-95"
             >
               Começar Jornada
             </button>
          </div>
        </div>
      )
    }
  }

  // Calculate Progress (Updated to 31 days)
  const progress = Math.round((user.completedDays.length / 31) * 100);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-paper-light dark:bg-paper-dark text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* Top Bar */}
      <header className="px-6 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center no-print">
        <div>
          <h1 className="text-xl font-serif font-bold text-royal-900 dark:text-gold-400">
            {view === 'home' && `Bom dia, ${user.name}`}
            {view === 'journal' && 'Minha Jornada'}
            {view === 'settings' && 'Configurações'}
            {view === 'favorites' && 'Favoritos'}
          </h1>
          {view === 'home' && (
             <div className="flex items-center gap-2 mt-1">
               <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                 <div className="h-full bg-gold-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
               </div>
               <span className="text-xs text-slate-500 dark:text-slate-400">{progress}% completo</span>
             </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
             onClick={() => updateUser({ theme: user.theme === 'light' ? 'dark' : 'light' })}
             className="p-2 text-slate-400 hover:text-royal-800 dark:hover:text-gold-400 transition"
          >
            {user.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto z-10">
        
        {view === 'home' && (
          <DailyView user={user} onUpdateUser={updateUser} />
        )}

        {view === 'journal' && (
          <div className="p-6 fade-in pb-24">
             {/* Visual Progress Calendar */}
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 mb-8">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif font-bold text-royal-900 dark:text-white">Seu Progresso</h3>
                  <span className="text-sm font-medium text-gold-600 dark:text-gold-400">{user.completedDays.length} de 31 dias</span>
               </div>
               
               <div className="grid grid-cols-7 gap-2 md:gap-3">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    const isCompleted = user.completedDays.includes(day);
                    const isCurrent = user.currentDay === day;
                    
                    return (
                      <div 
                        key={day}
                        className={`
                          aspect-square flex items-center justify-center rounded-lg text-xs md:text-sm font-medium transition-all relative
                          ${isCompleted 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-slate-50 text-slate-400 dark:bg-slate-700/50 dark:text-slate-500'}
                          ${isCurrent ? 'ring-2 ring-gold-500 ring-offset-1 dark:ring-offset-slate-800 z-10' : ''}
                        `}
                      >
                        {isCompleted ? <CheckCircle size={14} className="opacity-80" /> : day}
                      </div>
                    );
                  })}
               </div>
               <div className="flex justify-center gap-6 mt-4 text-[10px] text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Concluído</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border-2 border-gold-500"></span> Atual</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Pendente</div>
               </div>
             </div>

             {/* Entries Section */}
             <h3 className="font-serif font-bold text-xl text-royal-900 dark:text-white mb-4 pl-1">Suas Reflexões</h3>
             
             {Object.keys(user.journalEntries).length === 0 ? (
               <div className="text-center text-slate-500 py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                 <Feather className="mx-auto mb-4 opacity-30" size={32} />
                 <p>As reflexões que você escrever após a leitura aparecerão aqui.</p>
               </div>
             ) : (
               <div className="space-y-6">
                 {Object.entries(user.journalEntries).sort((a,b) => Number(b[0]) - Number(a[0])).map(([day, text]) => (
                   <div key={day} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 break-inside-avoid">
                     <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                           <span className="w-8 h-8 rounded-full bg-royal-100 dark:bg-royal-900 text-royal-700 dark:text-royal-300 flex items-center justify-center font-bold text-sm">{day}</span>
                           <span className="font-bold font-serif text-royal-800 dark:text-gold-400">Provérbios {day}</span>
                        </div>
                        {user.favorites.includes(Number(day)) && <Heart size={16} className="text-red-500" fill="currentColor" />}
                     </div>
                     <div className="pl-10">
                       <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed text-sm md:text-base italic bg-paper-light dark:bg-slate-900/50 p-4 rounded-lg border-l-2 border-gold-400">
                         "{text}"
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {view === 'favorites' && (
          <div className="p-6 fade-in max-w-2xl mx-auto">
             <h2 className="text-2xl font-serif font-bold text-royal-900 dark:text-white mb-6 flex items-center gap-2">
               <Heart className="text-red-500" fill="currentColor" /> Meus Favoritos
             </h2>
             
             {user.favorites.length === 0 ? (
                <div className="text-center text-slate-500 mt-20 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <Star className="mx-auto mb-4 opacity-30 text-gold-500" size={48} />
                  <p className="mb-2">Você ainda não tem favoritos.</p>
                  <p className="text-sm">Clique no coração ao ler um capítulo para salvá-lo aqui.</p>
                </div>
             ) : (
               <div className="grid gap-4">
                 {user.favorites.sort((a, b) => a - b).map(day => (
                   <button 
                      key={day}
                      onClick={() => {
                        updateUser({ currentDay: day });
                        setView('home');
                        window.scrollTo(0,0);
                      }}
                      className="w-full bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition flex justify-between items-center group text-left"
                   >
                      <div>
                        <span className="text-xs uppercase tracking-widest text-gold-600 dark:text-gold-500 font-bold mb-1 block">Provérbios</span>
                        <h3 className="text-xl font-serif font-bold text-royal-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                          Capítulo {day}
                        </h3>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-full group-hover:bg-gold-100 dark:group-hover:bg-gold-900/30 transition-colors">
                        <ChevronRight className="text-slate-400 group-hover:text-gold-600" />
                      </div>
                   </button>
                 ))}
               </div>
             )}
          </div>
        )}

        {view === 'settings' && (
          <div className="p-6 max-w-xl mx-auto fade-in">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-bold text-lg mb-1 dark:text-white">Preferências</h3>
                </div>
                <div className="p-6 space-y-6">
                   <div className="flex justify-between items-center">
                     <span className="text-slate-700 dark:text-slate-300">Modo Escuro</span>
                     <button onClick={() => updateUser({ theme: user.theme === 'light' ? 'dark' : 'light' })} className="text-royal-800 dark:text-gold-400">
                        {user.theme === 'light' ? <Moon /> : <Sun />}
                     </button>
                   </div>
                   
                   <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                           <Bell size={20} className="text-slate-500" />
                           <span className="text-slate-700 dark:text-slate-300">Notificações Diárias</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={user.notificationsEnabled}
                            onChange={(e) => {
                              if(e.target.checked) {
                                requestNotificationPermission();
                              } else {
                                updateUser({ notificationsEnabled: false });
                              }
                            }}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 dark:peer-focus:ring-gold-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gold-500"></div>
                        </label>
                      </div>
                      
                      {user.notificationsEnabled && (
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                           <span className="text-sm text-slate-500 dark:text-slate-400">Horário do lembrete:</span>
                           <input 
                              type="time" 
                              value={user.notificationTime}
                              onChange={(e) => updateUser({ notificationTime: e.target.value })}
                              className="bg-transparent text-royal-900 dark:text-white font-bold outline-none cursor-pointer"
                           />
                        </div>
                      )}
                   </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-bold text-lg mb-1 dark:text-white">Dados da Jornada</h3>
                  <p className="text-sm text-slate-500">Gerencie seu progresso</p>
                </div>
                <div className="p-6">
                   <button 
                     onClick={() => {
                       if(confirm("Tem certeza? Isso apagará todo seu progresso e anotações.")) {
                         localStorage.removeItem('solomon_user_v1');
                         window.location.reload();
                       }
                     }}
                     className="w-full text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/50 p-3 rounded-lg transition"
                   >
                     Resetar todo o progresso
                   </button>
                </div>
             </div>
          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="pb-20 pt-6 text-center text-xs text-slate-400 dark:text-slate-600 no-print">
         <p className="uppercase tracking-widest font-medium">Sabedoria de Salomão</p>
         <p className="mt-1">por Marinalva Callegario</p>
      </footer>

      {/* Bottom Navigation (Mobile First) */}
      <nav className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe fixed bottom-0 w-full z-30 no-print">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button 
            onClick={() => setView('home')}
            className={`flex flex-col items-center gap-1 w-16 ${view === 'home' ? 'text-royal-800 dark:text-gold-400' : 'text-slate-400'}`}
          >
            <BookOpen size={24} />
            <span className="text-[10px] font-medium">Início</span>
          </button>
          
          <button 
             onClick={() => setView('journal')}
             className={`flex flex-col items-center gap-1 w-16 ${view === 'journal' ? 'text-royal-800 dark:text-gold-400' : 'text-slate-400'}`}
          >
            <Feather size={24} />
            <span className="text-[10px] font-medium">Diário</span>
          </button>

          <button 
             onClick={() => setView('favorites')}
             className={`flex flex-col items-center gap-1 w-16 ${view === 'favorites' ? 'text-royal-800 dark:text-gold-400' : 'text-slate-400'}`}
          >
            <Heart size={24} />
            <span className="text-[10px] font-medium">Favoritos</span>
          </button>

          <button 
             onClick={() => setView('settings')}
             className={`flex flex-col items-center gap-1 w-16 ${view === 'settings' ? 'text-royal-800 dark:text-gold-400' : 'text-slate-400'}`}
          >
            <Settings size={24} />
            <span className="text-[10px] font-medium">Ajustes</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;