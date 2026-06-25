import React, { useState, useEffect, useRef } from 'react';
import BookingForm from './components/BookingForm';
import AdminPanel from './components/AdminPanel';
import ContactForm from './components/ContactForm';
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
  const [view, setView] = useState<'guest' | 'admin'>('guest');
  const [scrolled, setScrolled] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

          <div className="flex items-center gap-4">
            {view === 'guest' ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setView('admin')}
                className="text-gray-500 hover:text-blue-600 font-semibold"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" /> Admin Panel
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setView('guest')}
                className="text-gray-500 hover:text-blue-600 font-semibold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Booking
              </Button>
            )}
            <div className="hidden sm:block h-8 w-[1px] bg-gray-200 mx-2" />
            <Button 
              size="sm" 
              className="hidden sm:flex rounded-full bg-gray-900"
              onClick={scrollToContact}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative pt-12 pb-20 px-4 overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-purple-100/50 rounded-full blur-3xl -z-10" />
            
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Booking Langsung Tanpa Ribet</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
                Main Badminton Lebih <br /> 
                <span className="text-blue-600 relative inline-block">
                  Mudah & Cepat
                  <svg className="absolute -bottom-2 left-0 w-full h-2 text-blue-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                  </svg>
                </span>
              </h2>
              <p className="max-w-xl mx-auto text-gray-500 text-lg md:text-xl font-medium">
                Pilih lapangan, tentukan jam, bayar, dan langsung main. 
                Sistem booking modern tanpa perlu registrasi akun.
              </p>
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
                
                <section ref={contactRef} className="mt-20 pt-20 border-t border-gray-100">
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                      <h2 className="text-3xl font-black text-gray-900 tracking-tight">Butuh Bantuan?</h2>
                      <p className="text-gray-500 mt-2">Kami siap menjawab pertanyaan Anda seputar fasilitas dan penyewaan.</p>
                    </div>
                    <ContactForm />
                  </div>
                </section>
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
      <footer className="bg-white border-t border-gray-100 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-gray-900 p-2 rounded-lg">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-black tracking-tighter text-gray-900 uppercase italic leading-none">NetHub</h1>
            </div>
            <p className="text-gray-500 max-w-sm text-sm">
              Solusi digital untuk manajemen lapangan olahraga. 
              Membantu pemilik lapangan mengelola booking dengan lebih efisien dan transparan.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600"><Instagram className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600"><Twitter className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600"><Github className="w-5 h-5" /></Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">Layanan</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="hover:text-blue-600 cursor-pointer">Sewa Lapangan</li>
              <li className="hover:text-blue-600 cursor-pointer">Member Pro</li>
              <li className="hover:text-blue-600 cursor-pointer">Event & Turnamen</li>
              <li className="hover:text-blue-600 cursor-pointer">Partner</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">Lokasi</h4>
            <p className="text-sm text-gray-500">
              Jl. Merdeka No. 123<br />
              Jakarta Selatan, 12345<br />
              Indonesia
            </p>
            <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold cursor-pointer group">
              Lihat di Maps <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© 2024 NetHub Badminton Court. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-gray-600 cursor-pointer">Kebijakan Privasi</span>
            <span className="hover:text-gray-600 cursor-pointer">Syarat & Ketentuan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
