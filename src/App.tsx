import React, { useState, useEffect, useRef } from 'react';
import BookingForm from './components/BookingForm';
import AdminPanel from './components/AdminPanel';
import ContactForm from './components/ContactForm';
import HeroSlider from './components/HeroSlider';
import { Button } from './components/ui/Button';
import { 
  Trophy, 
  LayoutDashboard, 
  ArrowLeft, 
  Github, 
  Instagram, 
  Twitter,
  Shovel,
  Zap,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Toaster } from 'sonner';

export default function App() {
  const [view, setView] = useState<'guest' | 'admin' | 'contact'>('guest');
  const [scrolled, setScrolled] = useState(false);
  const [heroTitle, setHeroTitle] = useState('Main Badminton Lebih Mudah & Cepat');
  const [heroSubtitle, setHeroSubtitle] = useState('Pilih lapangan, tentukan jam, bayar, dan langsung main. Sistem booking modern tanpa perlu registrasi akun.');

  useEffect(() => {
    let unsub: () => void;
    const listenHeroSettings = async () => {
      try {
        const { db } = await import('./lib/firebase');
        const { doc, onSnapshot } = await import('firebase/firestore');
        unsub = onSnapshot(doc(db, 'settings', 'hero'), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.heroTitle) setHeroTitle(data.heroTitle);
            if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
          }
        });
      } catch (e) {
        console.error("Error setting up hero listener:", e);
      }
    };
    listenHeroSettings();
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Toaster position="top-center" richColors />
      {/* Header */}
      <header 
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 px-4 md:px-8",
          scrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-6"
        )}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setView('guest')}
          >
            <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-200">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-gray-900 uppercase italic leading-none">NetHub</h1>
              <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Badminton Court</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {view === 'guest' ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setView('admin')}
                className={cn(
                  "font-semibold px-2 md:px-4 transition-colors",
                  scrolled ? "text-gray-500 hover:text-blue-600" : "text-gray-700 hover:text-blue-600"
                )}
              >
                <LayoutDashboard className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Admin Panel</span>
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setView('guest')}
                className="text-gray-500 hover:text-blue-600 font-semibold px-2 md:px-4"
              >
                <ArrowLeft className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Kembali</span>
              </Button>
            )}
            <div className="h-6 w-[1px] bg-gray-200 mx-1 md:mx-2" />
            <Button 
              size="sm" 
              className={cn(
                "rounded-full px-4 text-xs md:text-sm shadow-lg transition-all active:scale-95",
                view === 'contact' ? "bg-blue-600" : "bg-gray-900 hover:bg-gray-800"
              )}
              onClick={() => setView('contact')}
            >
              Hubungi Kami
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section (only for guest) */}
      <AnimatePresence mode="wait">
        {view === 'guest' && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-20 px-4 overflow-hidden"
          >
            <HeroSlider />
            
            <div className="max-w-7xl mx-auto text-center space-y-10 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl shadow-blue-500/10 text-sm font-semibold text-blue-700"
              >
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Booking Langsung Tanpa Ribet
                </span>
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl md:text-9xl font-display font-bold text-gray-950 tracking-tight leading-[0.9] max-w-5xl mx-auto"
              >
                {heroTitle.split(' ').map((word, i) => (
                  <motion.span 
                    key={i} 
                    className="inline-block mr-[0.2em]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                  >
                    {word === 'Mudah' || word === '&' || word === 'Cepat' ? (
                      <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
                        {word}
                      </span>
                    ) : word}
                  </motion.span>
                ))}
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="max-w-3xl mx-auto text-gray-700 text-xl md:text-3xl font-medium leading-relaxed tracking-tight"
              >
                {heroSubtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
              >
                <button 
                  onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                  className="group relative px-10 py-5 rounded-2xl bg-gray-900 text-white font-bold text-xl overflow-hidden transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative z-10 flex items-center gap-2">
                    Mulai Booking Sekarang
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                
                <button className="px-10 py-5 rounded-2xl bg-white/50 backdrop-blur-md border border-white/50 text-gray-900 font-bold text-xl hover:bg-white transition-all shadow-xl active:scale-95">
                  Lihat Jadwal
                </button>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>


      {/* Main Content */}
      <main className="flex-1 px-4 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {view === 'guest' ? (
              <motion.div
                key="guest-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <BookingForm />
              </motion.div>
            ) : view === 'contact' ? (
              <motion.div
                key="contact-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto py-12"
              >
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Butuh Bantuan?</h2>
                  <p className="text-gray-500 mt-2">Kami siap menjawab pertanyaan Anda seputar fasilitas dan penyewaan.</p>
                </div>
                <ContactForm />
                <div className="mt-12 text-center">
                  <Button 
                    variant="link" 
                    onClick={() => setView('guest')}
                    className="text-blue-600 font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="admin-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AdminPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-center items-center text-xs text-gray-400">
          <p>© 2026 Badminton Booking System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
