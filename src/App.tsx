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
            className="relative min-h-[70vh] flex items-center pt-20 pb-20 px-4 overflow-hidden"
          >
            <HeroSlider />
            
            <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full shadow-xl"
              >
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-[0.2em]">Booking Langsung Tanpa Ribet</span>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-5xl md:text-8xl font-black text-gray-900 tracking-tight leading-[0.95]"
              >
                Main Badminton Lebih <br /> 
                <span className="text-blue-600 relative inline-block">
                  Mudah & Cepat
                  <motion.svg 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="absolute -bottom-2 left-0 w-full h-3 text-blue-200" 
                    viewBox="0 0 100 10" 
                    preserveAspectRatio="none"
                  >
                    <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                  </motion.svg>
                </span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="max-w-2xl mx-auto text-gray-600 text-lg md:text-2xl font-medium leading-relaxed"
              >
                Pilih lapangan, tentukan jam, bayar, dan langsung main. <br className="hidden md:block" />
                Sistem booking modern yang didesain untuk kenyamanan Anda.
              </motion.p>
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
