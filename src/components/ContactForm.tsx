import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'contacts'), {
        ...form,
        isRead: false,
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
      toast.success("Pesan Anda telah berhasil dikirim!");
      setForm({ name: '', whatsapp: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Gagal mengirim pesan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-blue-100/50 overflow-hidden border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="bg-blue-600 p-8 md:p-12 text-white relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tight">Hubungi Kami</h3>
              <p className="text-blue-100 font-medium leading-relaxed">
                Punya pertanyaan atau ingin kerja sama? Kirimkan pesan Anda melalui formulir ini.
              </p>
            </div>
            
            <div className="pt-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Email Support</p>
                  <p className="font-bold">support@nethub.id</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decor */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="p-8 md:p-12 relative">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">Pesan Terkirim!</h4>
                  <p className="text-gray-500">Terima kasih telah menghubungi kami. Kami akan merespons melalui WhatsApp segera.</p>
                </div>
                <Button variant="outline" onClick={() => setSubmitted(false)}>Kirim Pesan Lain</Button>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit} 
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
                    <Input 
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">WhatsApp</label>
                    <Input 
                      required
                      placeholder="0812..."
                      value={form.whatsapp}
                      onChange={e => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subjek</label>
                  <Input 
                    required
                    placeholder="Tanya Sewa / Member / Lainnya"
                    value={form.subject}
                    onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pesan</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Tuliskan pesan Anda di sini..."
                    className="w-full flex h-auto min-h-[120px] rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    value={form.message}
                    onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold"
                >
                  {loading ? 'Mengirim...' : 'Kirim Pesan Sekarang'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
