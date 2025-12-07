
import React, { useState, useEffect } from 'react';
import { View, UserState, SubscriptionTier } from './types';
import { Dashboard } from './components/Dashboard';
import { Onboarding } from './components/Onboarding';
import { LearningLab } from './components/LearningLab';
import { Analytics } from './components/Analytics';
import { MaterialExplorer } from './components/MaterialExplorer';
import { Button } from './components/Button';
import { Layout, Brain, BarChart2, BookOpen, LogOut, Moon, Sun, Menu, X, Library } from 'lucide-react';
import { db } from './services/db';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  // Initialize DB and Load User
  useEffect(() => {
    const initApp = async () => {
        await db.init();
        const storedUser = await db.getUser();
        if (storedUser) {
            setUserState(storedUser);
            setCurrentView(View.DASHBOARD);
        }
        setDbReady(true);
    };
    initApp();
  }, []);

  // Initialize theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Check for API Key
  const hasApiKey = !!process.env.API_KEY;

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-6 text-center">
        <div className="max-w-md border border-red-900/50 bg-red-950/20 p-8 rounded-xl">
          <h1 className="text-3xl font-bold text-red-500 mb-4 font-mono">Configuration Error</h1>
          <p className="text-gray-400 mb-4">
            The <code>API_KEY</code> environment variable is missing. 
            This application requires a Google Gemini API key to function.
          </p>
        </div>
      </div>
    );
  }

  const handleOnboardingComplete = async (partialState: Partial<UserState>) => {
    const newUserState = { 
        ...partialState, 
        subscriptionTier: SubscriptionTier.FREE,
        createdAt: Date.now() 
    } as UserState;
    
    await db.saveUser(newUserState);
    setUserState(newUserState);
    setCurrentView(View.DASHBOARD);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const renderLanding = () => (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-sans">
      <nav className="relative z-10 container mx-auto p-6 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded font-mono font-bold">A</div>
          AceRank.AI
        </div>
        <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-neutral-900 transition-colors">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Button onClick={() => setCurrentView(View.ONBOARDING)} variant="outline" size="sm" className="border-neutral-700 hover:bg-neutral-900">Log In</Button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="inline-block mb-8 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-sm font-medium animate-fade-in font-mono">
          Powered by Gemini 2.5
        </div>
        <h1 className="text-5xl md:text-8xl font-bold mb-8 leading-tight max-w-5xl tracking-tighter">
          Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-600">Unseen</span>.
        </h1>
        <p className="text-xl text-neutral-500 max-w-2xl mb-12 leading-relaxed">
          The contrarian approach to engineering entrance exams. No fluff, just raw intelligence and adaptive diagnostics.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md sm:max-w-none justify-center">
          <Button onClick={() => setCurrentView(View.ONBOARDING)} size="lg" className="sm:px-12 py-4 text-lg bg-white text-black hover:bg-neutral-200 border-none">
            Begin Diagnostics
          </Button>
        </div>
      </main>

      <footer className="relative z-10 py-8 border-t border-neutral-900 mt-12">
        <div className="container mx-auto px-6 text-center text-neutral-600 text-sm font-mono">
          &copy; 2024 AceRank AI.
        </div>
      </footer>
    </div>
  );

  if (!dbReady) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading AceRank DB...</div>;

  // Main App Shell
  if (currentView === View.LANDING) return renderLanding();
  if (currentView === View.ONBOARDING) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-black text-neutral-200' : 'bg-white text-neutral-900'} font-sans overflow-hidden transition-colors duration-300`}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-neutral-900 border-r border-neutral-800 p-6" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-8">
               <span className="text-xl font-bold font-mono text-white">AceRank</span>
               <button onClick={() => setMobileMenuOpen(false)}><X className="text-neutral-400" /></button>
             </div>
             <nav className="space-y-2">
                <NavItem 
                  icon={<Layout size={20} />} 
                  label="Dashboard" 
                  active={currentView === View.DASHBOARD} 
                  onClick={() => { setCurrentView(View.DASHBOARD); setMobileMenuOpen(false); }} 
                />
                <NavItem 
                  icon={<BookOpen size={20} />} 
                  label="Learning Lab" 
                  active={currentView === View.LEARNING} 
                  onClick={() => { setCurrentView(View.LEARNING); setMobileMenuOpen(false); }} 
                />
                 <NavItem 
                  icon={<Library size={20} />} 
                  label="Library" 
                  active={currentView === View.LIBRARY} 
                  onClick={() => { setCurrentView(View.LIBRARY); setMobileMenuOpen(false); }} 
                />
                <NavItem 
                  icon={<BarChart2 size={20} />} 
                  label="Analytics" 
                  active={currentView === View.ANALYTICS} 
                  onClick={() => { setCurrentView(View.ANALYTICS); setMobileMenuOpen(false); }} 
                />
             </nav>
          </div>
        </div>
      )}

      {/* Sidebar Navigation (Desktop) */}
      <aside className={`w-20 lg:w-64 border-r ${theme === 'dark' ? 'border-neutral-900 bg-black' : 'border-neutral-200 bg-gray-50'} flex flex-col justify-between hidden md:flex`}>
        <div>
          <div className="p-6 flex items-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-lg ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>
              A
            </div>
            <span className={`text-xl font-bold hidden lg:block tracking-tight font-mono ${theme === 'dark' ? 'text-white' : 'text-black'}`}>AceRank</span>
          </div>

          <nav className="px-3 space-y-1">
            <NavItem 
              icon={<Layout size={20} />} 
              label="Dashboard" 
              active={currentView === View.DASHBOARD} 
              onClick={() => setCurrentView(View.DASHBOARD)} 
            />
            <NavItem 
              icon={<BookOpen size={20} />} 
              label="Learning Lab" 
              active={currentView === View.LEARNING} 
              onClick={() => setCurrentView(View.LEARNING)} 
            />
            <NavItem 
              icon={<Library size={20} />} 
              label="Library" 
              active={currentView === View.LIBRARY} 
              onClick={() => setCurrentView(View.LIBRARY)} 
            />
            <NavItem 
              icon={<BarChart2 size={20} />} 
              label="Analytics" 
              active={currentView === View.ANALYTICS} 
              onClick={() => setCurrentView(View.ANALYTICS)} 
            />
          </nav>
        </div>

        <div className="p-4 border-t border-neutral-900/10">
           <button onClick={toggleTheme} className="flex items-center gap-3 w-full p-3 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors mb-2">
             {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             <span className="hidden lg:block text-sm">Toggle Theme</span>
           </button>
           <button 
            onClick={() => setCurrentView(View.LANDING)}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
           >
             <LogOut size={20} />
             <span className="hidden lg:block text-sm">Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative custom-scrollbar">
        {/* Mobile Header */}
        <div className={`md:hidden h-16 border-b flex items-center px-4 justify-between sticky top-0 z-20 ${theme === 'dark' ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'}`}>
           <span className="font-bold font-mono">AceRank.AI</span>
           <div className="flex items-center gap-3">
             <button onClick={toggleTheme} className="p-2 text-neutral-500">
               {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             <Button size="sm" variant="outline" onClick={() => setMobileMenuOpen(true)} className="border-neutral-700"><Menu size={18}/></Button>
           </div>
        </div>

        {currentView === View.DASHBOARD && userState && (
          <Dashboard userState={userState} onNavigate={setCurrentView} />
        )}
        {currentView === View.LEARNING && (
          <LearningLab />
        )}
        {currentView === View.LIBRARY && (
          <MaterialExplorer />
        )}
         {currentView === View.ANALYTICS && (
           <Analytics userState={userState} />
        )}
        {currentView === View.MOCK_TEST && (
           <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
             <h2 className="text-3xl font-bold mb-4 font-mono">Mock Test Simulator</h2>
             <p className="text-neutral-500 mb-8 max-w-md">Full exam simulation with negative marking, time tracking, and pattern analysis.</p>
             <Button onClick={() => setCurrentView(View.DASHBOARD)} variant="outline">Return to Dashboard</Button>
           </div>
        )}
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-md transition-all duration-200 group ${
      active 
        ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-medium' 
        : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white'
    }`}
  >
    <span className={active ? 'text-inherit' : 'text-neutral-400 group-hover:text-inherit transition-colors'}>
      {icon}
    </span>
    <span className="hidden lg:block text-sm">{label}</span>
  </button>
);

export default App;
