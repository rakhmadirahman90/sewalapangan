import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, where, orderBy, setDoc, getDoc, limit, serverTimestamp } from 'firebase/firestore';
import { db, auth, signInWithGoogle } from '@/src/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Court, TimeSlot, Booking, BookingStatus, ContactMessage } from '@/src/types';
import { cn, formatCurrency } from '@/src/lib/utils';
import { ImageUpload } from './ImageUpload';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/Card';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Plus, 
  Settings, 
  LogOut, 
  Filter,
  Search,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Eye,
  Check,
  X,
  Activity,
  DollarSign,
  Package,
  CalendarCheck,
  Phone,
  User as UserIcon,
  Download,
  AlertCircle,
  Receipt,
  Menu,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, subDays, startOfDay, endOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'courts' | 'slots' | 'contacts' | 'setup' | 'landing'>('dashboard');
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [newHeroImageUrl, setNewHeroImageUrl] = useState('');
  const [editingHeroIndex, setEditingHeroIndex] = useState<number | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');

  // Form states
  const [showCourtForm, setShowCourtForm] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [courtForm, setCourtForm] = useState({ name: '', pricePerHour: 0, description: '', imageUrl: '', isActive: true });

  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotForm, setSlotForm] = useState({ startTime: '', endTime: '', isActive: true });

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookingEditForm, setBookingEditForm] = useState({ customerName: '', customerWhatsApp: '' });

  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // Check if user exists in admins collection
          const adminRef = doc(db, 'admins', u.uid);
          const adminDoc = await getDoc(adminRef);
          
          if (adminDoc.exists()) {
            setIsAdmin(true);
            fetchData();
          } else {
            setIsAdmin(false);
            // Auto-seed: check if any admins exist at all
            const allAdmins = await getDocs(query(collection(db, 'admins'), limit(1)));
            if (allAdmins.empty) {
              await setDoc(doc(db, 'admins', u.uid), { uid: u.uid, email: u.email });
              setIsAdmin(true);
              fetchData();
            }
          }
        } catch (error) {
          console.error("Admin check error:", error);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchData = async () => {
    // Fetch Bookings
    const bSnap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')));
    setBookings(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    
    // Fetch Courts
    const cSnap = await getDocs(collection(db, 'courts'));
    setCourts(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Court)));
    
    // Fetch Slots
    const sSnap = await getDocs(collection(db, 'timeSlots'));
    setSlots(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as TimeSlot)));

    // Fetch Messages
    const mSnap = await getDocs(query(collection(db, 'contacts'), orderBy('createdAt', 'desc')));
    setMessages(mSnap.docs.map(d => ({ id: d.id, ...d.data() } as ContactMessage)));

    // Fetch Hero Images
    const hDoc = await getDoc(doc(db, 'settings', 'hero'));
    if (hDoc.exists()) {
      setHeroImages(hDoc.data().images || []);
    }
  };

  const handleSaveHeroImage = async () => {
    if (!newHeroImageUrl) return;
    
    setIsSavingHero(true);
    let updatedImages;
    if (editingHeroIndex !== null) {
      updatedImages = [...heroImages];
      updatedImages[editingHeroIndex] = newHeroImageUrl;
    } else {
      updatedImages = [...heroImages, newHeroImageUrl];
    }

    try {
      await setDoc(doc(db, 'settings', 'hero'), { images: updatedImages });
      setHeroImages(updatedImages);
      setNewHeroImageUrl('');
      setEditingHeroIndex(null);
      toast.success(editingHeroIndex !== null ? "Gambar hero berhasil diperbarui" : "Gambar hero berhasil ditambahkan");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan gambar hero. Pastikan ukuran file tidak terlalu besar.");
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleEditHeroImage = (idx: number) => {
    setEditingHeroIndex(idx);
    setNewHeroImageUrl(heroImages[idx]);
    // Scroll to upload form
    document.getElementById('hero-upload-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteHeroImage = async (idx: number) => {
    const updatedImages = heroImages.filter((_, i) => i !== idx);
    try {
      await setDoc(doc(db, 'settings', 'hero'), { images: updatedImages });
      setHeroImages(updatedImages);
      toast.success("Gambar hero berhasil dihapus");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus gambar hero");
    }
  };

  const handleSaveCourt = async () => {
    if (!courtForm.name || courtForm.pricePerHour <= 0) {
      toast.error("Nama lapangan dan harga harus diisi!");
      return;
    }
    try {
      if (editingCourt) {
        await updateDoc(doc(db, 'courts', editingCourt.id), courtForm);
        toast.success("Lapangan berhasil diperbarui");
      } else {
        await addDoc(collection(db, 'courts'), { ...courtForm, createdAt: serverTimestamp() });
        toast.success("Lapangan baru berhasil ditambahkan");
      }
      setShowCourtForm(false);
      setEditingCourt(null);
      setCourtForm({ name: '', pricePerHour: 0, description: '', imageUrl: '', isActive: true });
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan data lapangan");
    }
  };

  const handleSaveSlot = async () => {
    if (!slotForm.startTime || !slotForm.endTime) {
      toast.error("Jam mulai dan selesai harus diisi!");
      return;
    }
    try {
      await addDoc(collection(db, 'timeSlots'), slotForm);
      toast.success("Slot jam baru berhasil ditambahkan");
      setShowSlotForm(false);
      setSlotForm({ startTime: '', endTime: '', isActive: true });
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan slot jam");
    }
  };

  const updateBookingStatus = async (id: string, status: BookingStatus) => {
    // Only open a window for approval/rejection to avoid redundant tabs for "Pending" restoration
    const shouldNotify = status === 'verified' || status === 'rejected';
    const win = shouldNotify ? window.open('about:blank', '_blank') : null;
    
    try {
      await updateDoc(doc(db, 'bookings', id), { 
        status, 
        updatedAt: serverTimestamp() 
      });
      
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      
      const booking = bookings.find(b => b.id === id);
      let statusText = '';
      if (status === 'verified') statusText = 'DISETUJUI';
      else if (status === 'rejected') statusText = 'DITOLAK';
      else statusText = 'PENDING';
      
      toast.success(`Booking ${statusText}`);

      // Auto-generate WA link if possible
      if (shouldNotify && booking && booking.customerWhatsApp && win) {
        const court = courts.find(c => c.id === booking.courtId);
        const msg = `Halo ${booking.customerName}, Booking ${booking.bookingCode} telah ${statusText}.\n\n${court?.name || 'Lapangan'} | ${booking.date}\n${booking.startTime}-${booking.endTime}\n\nTerima kasih!`;
        
        let phone = booking.customerWhatsApp.replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = '62' + phone.substring(1);
        }
        
        win.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      } else if (win) {
        win.close();
      }
    } catch (e) {
      if (win) win.close();
      console.error('Update status error:', e);
      toast.error("Gagal memperbarui status booking: " + (e instanceof Error ? e.message : 'Izin ditolak'));
    }
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;
    try {
      await updateDoc(doc(db, 'bookings', editingBooking.id), {
        customerName: bookingEditForm.customerName,
        customerWhatsApp: bookingEditForm.customerWhatsApp,
        updatedAt: serverTimestamp()
      });
      setBookings(prev => prev.map(b => b.id === editingBooking.id ? { 
        ...b, 
        customerName: bookingEditForm.customerName, 
        customerWhatsApp: bookingEditForm.customerWhatsApp 
      } : b));
      toast.success("Data booking berhasil diperbarui");
      setEditingBooking(null);
    } catch (e) {
      console.error('Update booking error:', e);
      toast.error("Gagal memperbarui data booking");
    }
  };

  // Chart Data Preparation
  const getRevenueData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return format(d, 'yyyy-MM-dd');
    });

    return last7Days.map(date => {
      const dayTotal = bookings
        .filter(b => b.date === date && b.status === 'verified')
        .reduce((sum, b) => sum + b.totalPrice, 0);
      return {
        name: format(new Date(date), 'EEE'),
        total: dayTotal
      };
    });
  };

  const getCourtData = () => {
    return courts.map(court => ({
      id: court.id,
      name: court.name,
      value: bookings.filter(b => b.courtId === court.id).length
    }));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  const toggleCourtStatus = async (court: Court) => {
    try {
      const newStatus = !court.isActive;
      await updateDoc(doc(db, 'courts', court.id), { isActive: newStatus });
      setCourts(prev => prev.map(c => c.id === court.id ? { ...c, isActive: newStatus } : c));
      toast.success(`Lapangan ${court.name} ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengubah status lapangan");
    }
  };

  const toggleSlotStatus = async (slot: TimeSlot) => {
    try {
      const newStatus = !slot.isActive;
      await updateDoc(doc(db, 'timeSlots', slot.id), { isActive: newStatus });
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, isActive: newStatus } : s));
      toast.success(`Slot ${slot.startTime}-${slot.endTime} ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengubah status slot");
    }
  };

  const deleteSlot = async (id: string) => {
    if (!confirm("Hapus slot ini?")) return;
    try {
      await deleteDoc(doc(db, 'timeSlots', id));
      setSlots(prev => prev.filter(s => s.id !== id));
      toast.success("Slot berhasil dihapus");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus slot");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'contacts', id), { isRead: true });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
      toast.success("Pesan ditandai sebagai dibaca");
    } catch (e) {
      console.error(e);
      toast.error("Gagal memperbarui status pesan");
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Hapus pesan ini?")) return;
    try {
      await deleteDoc(doc(db, 'contacts', id));
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success("Pesan berhasil dihapus");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus pesan");
    }
  };

  const deleteCourt = async (court: Court) => {
    if (!confirm(`Hapus lapangan ${court.name}? Semua data terkait lapangan ini akan hilang.`)) return;
    try {
      await deleteDoc(doc(db, 'courts', court.id));
      setCourts(prev => prev.filter(c => c.id !== court.id));
      toast.success("Lapangan berhasil dihapus");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus lapangan");
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Hapus data booking ini?")) return;
    try {
      await deleteDoc(doc(db, 'bookings', id));
      setBookings(prev => prev.filter(b => b.id !== id));
      toast.success("Data booking berhasil dihapus");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus data booking");
    }
  };

  const sendWhatsAppNotification = (booking: Booking) => {
    if (!booking.customerWhatsApp) {
      toast.error("Nomor WhatsApp tidak ditemukan");
      return;
    }
    const court = courts.find(c => c.id === booking.courtId);
    const statusText = booking.status === 'verified' ? 'DISETUJUI' : booking.status === 'rejected' ? 'DITOLAK' : 'PENDING';
    const msg = `Halo ${booking.customerName}, Status Booking ${booking.bookingCode}: ${statusText}.\n\n${court?.name || booking.courtName} | ${booking.date}\n${booking.startTime}-${booking.endTime}\n\nTerima kasih!`;
    
    let phone = booking.customerWhatsApp.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const cleanupDuplicates = async () => {
    setLoading(true);
    try {
      let deletedCount = 0;

      // 1. Cleanup Courts (by Name)
      const courtMap = new Map();
      const cSnap = await getDocs(collection(db, 'courts'));
      for (const d of cSnap.docs) {
        const data = d.data();
        if (courtMap.has(data.name)) {
          await deleteDoc(doc(db, 'courts', d.id));
          deletedCount++;
        } else {
          courtMap.set(data.name, d.id);
        }
      }

      // 2. Cleanup Slots (by Time Range)
      const slotMap = new Map();
      const sSnap = await getDocs(collection(db, 'timeSlots'));
      for (const d of sSnap.docs) {
        const data = d.data();
        const key = `${data.startTime}-${data.endTime}`;
        if (slotMap.has(key)) {
          await deleteDoc(doc(db, 'timeSlots', d.id));
          deletedCount++;
        } else {
          slotMap.set(key, d.id);
        }
      }

      // 3. Cleanup Contacts (by Name and Message)
      const contactMap = new Map();
      const mSnap = await getDocs(collection(db, 'contacts'));
      for (const d of mSnap.docs) {
        const data = d.data();
        const key = `${data.name}-${data.message}`;
        if (contactMap.has(key)) {
          await deleteDoc(doc(db, 'contacts', d.id));
          deletedCount++;
        } else {
          contactMap.set(key, d.id);
        }
      }

      toast.success(`Pembersihan selesai! Berhasil menghapus ${deletedCount} data duplikat.`);
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Terjadi kesalahan saat membersihkan data.');
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    setLoading(true);
    try {
      // Seed Courts
      const courtData = [
        { 
          name: 'Court A (International Vynil)', 
          pricePerHour: 75000, 
          description: 'Premium grade vynil court with tournament lighting and professional standard spacing.',
          imageUrl: 'https://images.unsplash.com/photo-1626224580175-340ad0e3a731?q=80&w=800&auto=format&fit=crop'
        },
        { 
          name: 'Court B (Standard Vynil)', 
          pricePerHour: 60000, 
          description: 'High quality vynil court for regular practice and amateur matches.',
          imageUrl: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=800&auto=format&fit=crop'
        },
        { 
          name: 'Court C (Classic Wood)', 
          pricePerHour: 50000, 
          description: 'Traditional parquet flooring for classic feel and excellent grip.',
          imageUrl: 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?q=80&w=800&auto=format&fit=crop'
        },
        { 
          name: 'Court D (Junior Court)', 
          pricePerHour: 40000, 
          description: 'Slightly smaller space, perfect for training, coaching, and kids.',
          imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop'
        },
      ];
      
      const createdCourts = [];
      for (const c of courtData) {
        const docRef = await addDoc(collection(db, 'courts'), c);
        createdCourts.push({ id: docRef.id, ...c });
      }

      // Seed Slots
      const slotData = [
        { startTime: '07:00', endTime: '08:00', isActive: true },
        { startTime: '08:00', endTime: '09:00', isActive: true },
        { startTime: '09:00', endTime: '10:00', isActive: true },
        { startTime: '10:00', endTime: '11:00', isActive: true },
        { startTime: '11:00', endTime: '12:00', isActive: true },
        { startTime: '12:00', endTime: '13:00', isActive: true },
        { startTime: '13:00', endTime: '14:00', isActive: true },
        { startTime: '14:00', endTime: '15:00', isActive: true },
        { startTime: '15:00', endTime: '16:00', isActive: true },
        { startTime: '16:00', endTime: '17:00', isActive: true },
        { startTime: '17:00', endTime: '18:00', isActive: true },
        { startTime: '18:00', endTime: '19:00', isActive: true },
        { startTime: '19:00', endTime: '20:00', isActive: true },
        { startTime: '20:00', endTime: '21:00', isActive: true },
        { startTime: '21:00', endTime: '22:00', isActive: true },
        { startTime: '22:00', endTime: '23:00', isActive: true },
      ];
      for (const s of slotData) {
        await addDoc(collection(db, 'timeSlots'), s);
      }

      // Seed Dummy Bookings
      const today = format(new Date(), 'yyyy-MM-dd');
      const bookingData = [
        {
          customerName: 'Budi Santoso',
          customerWhatsApp: '081234567890',
          courtId: createdCourts[0].id,
          courtName: createdCourts[0].name,
          date: today,
          startTime: '19:00',
          endTime: '21:00',
          totalPrice: createdCourts[0].pricePerHour * 2,
          bookingCode: 'BDI789',
          status: 'verified',
        },
        {
          customerName: 'Siti Aminah',
          customerWhatsApp: '085678912345',
          courtId: createdCourts[1].id,
          courtName: createdCourts[1].name,
          date: today,
          startTime: '16:00',
          endTime: '17:00',
          totalPrice: createdCourts[1].pricePerHour,
          bookingCode: 'STI456',
          status: 'pending',
        },
        {
          customerName: 'Rian Hidayat',
          customerWhatsApp: '081122334455',
          courtId: createdCourts[2].id,
          courtName: createdCourts[2].name,
          date: today,
          startTime: '20:00',
          endTime: '22:00',
          totalPrice: createdCourts[2].pricePerHour * 2,
          bookingCode: 'RIAN01',
          status: 'pending',
        },
      ];

      for (const b of bookingData) {
        await addDoc(collection(db, 'bookings'), {
          ...b,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      await fetchData();
      toast.success("Sistem berhasil di-setup dengan data dummy lengkap!");
    } catch (e) {
      console.error(e);
      toast.error("Gagal melakukan seeding data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;

  if (!user || !isAdmin) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardHeader className="text-center">
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>Silakan login untuk mengelola sistem booking.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={signInWithGoogle}>Login dengan Google</Button>
        </CardContent>
      </Card>
    );
  }

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || b.date === dateFilter;
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesDate && matchesStatus;
  });

  const stats = {
    totalRevenue: bookings.filter(b => b.status === 'verified').reduce((acc, b) => acc + b.totalPrice, 0),
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    activeCourts: courts.filter(c => c.isActive).length
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[600px]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 space-y-2">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'dashboard' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('bookings')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'bookings' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <CalendarCheck className="w-4 h-4" /> Daftar Booking
        </button>
        <button 
          onClick={() => setActiveTab('courts')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'courts' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <Package className="w-4 h-4" /> Kelola Lapangan
        </button>
        <button 
          onClick={() => setActiveTab('slots')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'slots' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <Clock className="w-4 h-4" /> Kelola Jam
        </button>
        <button 
          onClick={() => setActiveTab('contacts')}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'contacts' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4" /> Pesan Masuk
          </div>
          {messages.filter(m => !m.isRead).length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {messages.filter(m => !m.isRead).length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('landing')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'landing' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <LayoutDashboard className="w-4 h-4" /> Landing Page
        </button>
        <button 
          onClick={() => setActiveTab('setup')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'setup' ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
          )}
        >
          <Settings className="w-4 h-4" /> Setup Sistem
        </button>
        <div className="pt-8 border-t">
          <p className="px-4 text-[10px] uppercase font-bold text-gray-400 mb-2">Akun</p>
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h2>
                <p className="text-gray-500">Monitor performa penyewaan dan aktivitas terbaru.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
                <Button size="sm" onClick={() => setActiveTab('bookings')}>
                  <Plus className="w-4 h-4 mr-2" /> Buat Booking Baru
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <TrendingUp className="w-20 h-20" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-100 text-xs font-bold uppercase tracking-widest">Total Pendapatan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                  <div className="flex items-center mt-2 text-blue-200 text-xs font-medium">
                    <Activity className="w-3 h-3 mr-1" />
                    Berdasarkan status lunas
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white border border-gray-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Pesanan</CardTitle>
                  <Calendar className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalBookings}</div>
                  <div className="flex items-center mt-2 text-green-500 text-xs font-medium">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Semua transaksi
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white border border-gray-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Verifikasi</CardTitle>
                  <Clock className="w-4 h-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{stats.pendingBookings}</div>
                  <div className="flex items-center mt-2 text-amber-500 text-xs font-medium">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Perlu tindakan segera
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white border border-gray-100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tingkat Okupansi</CardTitle>
                  <Activity className="w-4 h-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {courts.length > 0 ? Math.round((bookings.filter(b => b.date === format(new Date(), 'yyyy-MM-dd')).length / (courts.length * slots.length || 1)) * 100) : 0}%
                  </div>
                  <div className="flex items-center mt-2 text-gray-400 text-xs font-medium">
                    Hari ini
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Tren Pendapatan (7 Hari Terakhir)</CardTitle>
                  <CardDescription>Grafik pendapatan dari transaksi yang sudah lunas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getRevenueData()}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 12}}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontSize: 12}}
                          tickFormatter={(value) => `Rp${value/1000}k`}
                        />
                        <Tooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="total" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorTotal)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Populeritas Lapangan</CardTitle>
                  <CardDescription>Distribusi booking per lapangan.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getCourtData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getCourtData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 w-full mt-4">
                    {getCourtData().map((entry, index) => (
                      <div key={entry.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                          <span className="text-gray-600">{entry.name}</span>
                        </div>
                        <span className="font-bold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Booking Terbaru</CardTitle>
                    <CardDescription>Transaksi terakhir yang masuk ke sistem.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('bookings')}>
                    Lihat Semua <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs",
                            b.status === 'verified' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {b.customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{b.customerName}</p>
                            <p className="text-[10px] text-gray-500">{b.courtName} • {b.startTime}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCurrency(b.totalPrice)}</p>
                          <Badge 
                            variant={b.status === 'verified' ? 'success' : 'warning'}
                            className="text-[10px] px-1 py-0"
                          >
                            {b.status === 'verified' ? 'LUNAS' : 'PENDING'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Akses cepat ke fitur manajemen.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setActiveTab('courts')}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                    >
                      <MapPin className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">Atur Lapangan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('slots')}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group"
                    >
                      <Clock className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">Atur Jam Operasional</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('bookings')}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all group"
                    >
                      <Receipt className="w-6 h-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">Verifikasi Booking</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('setup')}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all group"
                    >
                      <Settings className="w-6 h-6 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold">System Setup</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">Manajemen Booking</h2>
                <p className="text-gray-500">Kelola dan verifikasi pesanan lapangan.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Input 
                  type="date" 
                  className="w-full sm:w-44" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={() => {
                  setDateFilter('');
                  setSearchQuery('');
                  setStatusFilter('all');
                }}>
                  Reset
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Cari nama pemesan atau kode booking..." 
                  className="pl-10 h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex p-1 bg-gray-100 rounded-lg">
                {(['all', 'pending', 'verified', 'rejected'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "px-4 py-2 text-xs font-bold rounded-md transition-all uppercase tracking-wider",
                      statusFilter === s 
                        ? "bg-white text-blue-600 shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredBookings.map((b) => (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group">
                      <div className="flex flex-col lg:flex-row">
                        <div className="w-full lg:w-56 bg-gray-50 p-6 flex flex-col justify-center items-center border-b lg:border-b-0 lg:border-r relative">
                          {b.paymentProofUrl ? (
                            <div className="relative group/img cursor-pointer" onClick={() => window.open(b.paymentProofUrl, '_blank')}>
                              <img src={b.paymentProofUrl} alt="Bukti" className="w-32 h-32 object-cover rounded-xl border-2 border-white shadow-sm transition-transform group-hover/img:scale-105" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold rounded-xl uppercase">
                                <Eye className="w-4 h-4 mr-1" /> View Full
                              </div>
                            </div>
                          ) : (
                            <div className="w-32 h-32 flex flex-col items-center justify-center bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                              <XCircle className="w-8 h-8 mb-2 opacity-20" />
                              <span className="text-[10px] font-bold uppercase">No Receipt</span>
                            </div>
                          )}
                          <div className="mt-4 flex flex-col items-center">
                            <p className="text-[10px] uppercase font-black text-gray-300 tracking-tighter mb-1">Status Pembayaran</p>
                            <Badge 
                              variant={b.status === 'verified' ? 'success' : b.status === 'pending' ? 'warning' : 'destructive'}
                              className="px-3 py-1 text-[10px] font-black"
                            >
                              {b.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex-1 p-6 space-y-6 bg-white">
                          <div className="flex flex-wrap justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-black text-gray-900">{b.customerName}</h3>
                                <div className="flex items-center text-[10px] font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 uppercase font-bold">
                                  #{b.bookingCode}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-4 text-xs font-medium">
                                <a 
                                  href={`https://wa.me/${b.customerWhatsApp.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  className="flex items-center text-green-600 hover:underline"
                                >
                                  <Phone className="w-3 h-3 mr-1.5" /> {b.customerWhatsApp}
                                </a>
                                <span className="flex items-center text-gray-500">
                                  <Calendar className="w-3 h-3 mr-1.5" /> {format(new Date(b.date), 'EEEE, dd MMMM yyyy')}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-blue-600 tracking-tight">{formatCurrency(b.totalPrice)}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Biaya</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Lapangan</p>
                              <div className="flex items-center text-sm font-bold text-gray-700">
                                <MapPin className="w-3.5 h-3.5 mr-2 text-blue-500" /> {b.courtName}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Waktu / Sesi</p>
                              <div className="flex items-center text-sm font-bold text-gray-700">
                                <Clock className="w-3.5 h-3.5 mr-2 text-purple-500" /> {b.startTime} - {b.endTime}
                              </div>
                            </div>
                            <div className="hidden md:block">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Input Sistem</p>
                              <div className="flex items-center text-sm font-bold text-gray-700">
                                <Activity className="w-3.5 h-3.5 mr-2 text-green-500" /> {b.createdAt?.toDate ? format(b.createdAt.toDate(), 'HH:mm • dd/MM') : 'Baru saja'}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              {b.status === 'pending' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 h-10 px-6 font-bold"
                                    onClick={() => updateBookingStatus(b.id, 'verified')}
                                  >
                                    <Check className="w-4 h-4 mr-2" /> Terima & Lunas
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 border-red-100 hover:bg-red-50 h-10 font-bold"
                                    onClick={() => updateBookingStatus(b.id, 'rejected')}
                                  >
                                    <X className="w-4 h-4 mr-2" /> Tolak Pesanan
                                  </Button>
                                </>
                              )}
                              {b.status === 'verified' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-amber-600 hover:bg-amber-50 h-10 font-bold"
                                  onClick={() => updateBookingStatus(b.id, 'pending')}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" /> Batal Verifikasi
                                </Button>
                              )}
                              {b.status === 'rejected' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-blue-600 hover:bg-blue-50 h-10 font-bold"
                                  onClick={() => updateBookingStatus(b.id, 'pending')}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" /> Restore ke Pending
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-10 px-4 font-bold text-green-600 border-green-100 hover:bg-green-50"
                                onClick={() => sendWhatsAppNotification(b)}
                              >
                                <Phone className="w-4 h-4 mr-2" /> Kirim Notif WA
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-10 w-10 rounded-full hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                                onClick={() => {
                                  setEditingBooking(b);
                                  setBookingEditForm({ customerName: b.customerName, customerWhatsApp: b.customerWhatsApp });
                                }}
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600"
                                onClick={() => deleteBooking(b.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredBookings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                  <div className="p-4 bg-gray-50 rounded-full mb-4">
                    <Filter className="w-12 h-12 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Tidak Ada Data</h3>
                  <p className="text-gray-400 max-w-xs text-center mt-2">
                    Gunakan filter lain atau refresh halaman untuk melihat data terbaru.
                  </p>
                  <Button variant="outline" className="mt-6" onClick={() => {
                    setDateFilter('');
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}>
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'courts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Kelola Lapangan</h2>
              <Button size="sm" onClick={() => {
                setEditingCourt(null);
                setCourtForm({ name: '', pricePerHour: 0, description: '', imageUrl: '', isActive: true });
                setShowCourtForm(true);
              }}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Lapangan
              </Button>
            </div>

            {showCourtForm && (
              <Card className="border-blue-200 bg-blue-50/10">
                <CardHeader>
                  <CardTitle className="text-lg">{editingCourt ? 'Edit Lapangan' : 'Tambah Lapangan Baru'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500 tracking-widest">Nama Lapangan</label>
                        <Input 
                          placeholder="Contoh: Lapangan 1 (VIP)" 
                          className="h-11 font-bold"
                          value={courtForm.name}
                          onChange={e => setCourtForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500 tracking-widest">Harga per Jam (IDR)</label>
                        <Input 
                          type="number"
                          placeholder="50000" 
                          className="h-11 font-bold"
                          value={courtForm.pricePerHour}
                          onChange={e => setCourtForm(prev => ({ ...prev, pricePerHour: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500 tracking-widest">Deskripsi Fasilitas</label>
                        <textarea 
                          placeholder="Contoh: Lantai Interlock, Lampu LED, Free Mineral Water..." 
                          className="w-full flex h-auto min-h-[100px] rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                          value={courtForm.description}
                          onChange={e => setCourtForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-500 tracking-widest">Unggah Foto Lapangan</label>
                      <ImageUpload 
                        value={courtForm.imageUrl}
                        onChange={val => setCourtForm(prev => ({ ...prev, imageUrl: val }))}
                      />
                      <p className="text-[10px] text-gray-400 font-medium">
                        *Gambar akan dikompres secara otomatis untuk performa terbaik tanpa mengurangi kualitas visual.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowCourtForm(false)}>Batal</Button>
                  <Button onClick={handleSaveCourt}>Simpan Lapangan</Button>
                </CardFooter>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {courts.map((court) => (
                <Card key={court.id} className={cn(
                  "overflow-hidden border-none shadow-sm transition-all hover:shadow-md",
                  !court.isActive && "opacity-60 grayscale"
                )}>
                  <div className="aspect-video bg-gray-100 relative overflow-hidden group">
                    {court.imageUrl ? (
                      <img src={court.imageUrl} alt={court.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <MapPin className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className={cn(
                        "font-bold px-2 py-1 shadow-sm",
                        court.isActive ? "bg-green-500" : "bg-gray-500"
                      )}>
                        {court.isActive ? 'AKTIF' : 'NONAKTIF'}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 bg-white">
                    <div>
                      <CardTitle className="text-xl font-bold">{court.name}</CardTitle>
                      <CardDescription className="text-blue-600 font-bold">{formatCurrency(court.pricePerHour)} / jam</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => toggleCourtStatus(court)}>
                        {court.isActive ? <XCircle className="w-4 h-4 text-amber-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => {
                        setEditingCourt(court);
                        setCourtForm({ 
                          name: court.name, 
                          pricePerHour: court.pricePerHour, 
                          description: court.description,
                          imageUrl: court.imageUrl || '',
                          isActive: court.isActive ?? true
                        });
                        setShowCourtForm(true);
                      }}><Settings className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="rounded-full text-red-500 hover:bg-red-50" onClick={() => deleteCourt(court)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="bg-white">
                    <p className="text-sm text-gray-600 line-clamp-2">{court.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'slots' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Kelola Jam (Time Slots)</h2>
              <Button size="sm" onClick={() => setShowSlotForm(true)}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Slot
              </Button>
            </div>

            {showSlotForm && (
              <Card className="border-blue-200 bg-blue-50/10">
                <CardHeader>
                  <CardTitle className="text-lg">Tambah Time Slot</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Jam Mulai</label>
                    <Input 
                      placeholder="Contoh: 08:00" 
                      value={slotForm.startTime}
                      onChange={e => setSlotForm(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Jam Selesai</label>
                    <Input 
                      placeholder="Contoh: 09:00" 
                      value={slotForm.endTime}
                      onChange={e => setSlotForm(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowSlotForm(false)}>Batal</Button>
                  <Button onClick={handleSaveSlot}>Simpan Slot</Button>
                </CardFooter>
              </Card>
            )}

            <Card className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10">
                  {slots.sort((a,b) => a.startTime.localeCompare(b.startTime)).map((slot) => (
                    <div 
                      key={slot.id} 
                      className={cn(
                        "flex flex-col items-center justify-center p-6 border-b border-r border-gray-100 relative group transition-all hover:bg-gray-50",
                        !slot.isActive && "bg-gray-50/50"
                      )}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full absolute top-3 right-3",
                        slot.isActive ? "bg-green-500" : "bg-gray-300 shadow-inner"
                      )} />
                      <p className="text-sm font-black text-gray-800">{slot.startTime}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{slot.endTime}</p>
                      
                      <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-all">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600" 
                          onClick={() => toggleSlotStatus(slot)}
                          title={slot.isActive ? "Matikan Slot" : "Aktifkan Slot"}
                        >
                          {slot.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600"
                          onClick={() => deleteSlot(slot.id)}
                          title="Hapus Permanen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Pesan Masuk</h2>
              <p className="text-gray-500">Pesan dari pengunjung melalui formulir Hubungi Kami.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {messages.map((m) => (
                <Card key={m.id} className={cn(
                  "overflow-hidden border-none shadow-sm hover:shadow-md transition-all",
                  !m.isRead && "border-l-4 border-blue-600 bg-blue-50/10"
                )}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-xl">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900">{m.name}</h3>
                            <p className="text-xs text-gray-500">{m.createdAt?.toDate ? format(m.createdAt.toDate(), 'EEEE, dd MMM yyyy • HH:mm') : 'Baru saja'}</p>
                          </div>
                          {!m.isRead && <Badge className="bg-blue-600 text-[10px] font-bold">BARU</Badge>}
                        </div>

                        <div className="bg-white/50 p-4 rounded-xl border border-gray-100 space-y-2">
                          <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{m.subject}</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{m.message}</p>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2">
                          <a 
                            href={`https://wa.me/${m.whatsapp.replace(/\D/g, '')}`} 
                            target="_blank" 
                            className="flex items-center text-xs font-bold text-green-600 hover:underline"
                          >
                            <Phone className="w-3 h-3 mr-1.5" /> Hubungi via WhatsApp
                          </a>
                        </div>
                      </div>

                      <div className="flex md:flex-col justify-end gap-2">
                        {!m.isRead && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-10 px-4 font-bold border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={() => markAsRead(m.id)}
                          >
                            <Check className="w-4 h-4 mr-2" /> Tandai Dibaca
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-10 px-4 font-bold text-red-500 hover:bg-red-50"
                          onClick={() => deleteMessage(m.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Hapus
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                  <div className="p-4 bg-gray-50 rounded-full mb-4">
                    <MessageSquare className="w-12 h-12 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Inbox Kosong</h3>
                  <p className="text-gray-400 max-w-xs text-center mt-2">
                    Belum ada pesan masuk dari pengunjung.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'landing' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-gray-900">Landing Page</h2>
                <p className="text-gray-500">Kelola visual utama website untuk menarik pengunjung.</p>
              </div>
              {editingHeroIndex !== null && (
                <Button variant="outline" onClick={() => { setEditingHeroIndex(null); setNewHeroImageUrl(''); }}>
                  Batal Edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Upload Section */}
              <Card id="hero-upload-section" className="lg:col-span-1 border-none shadow-xl bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    {editingHeroIndex !== null ? 'Edit Gambar' : 'Tambah Gambar'}
                  </CardTitle>
                  <CardDescription>
                    Unggah gambar baru untuk slider background. Gambar akan dikompresi otomatis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ImageUpload 
                    value={newHeroImageUrl} 
                    onChange={setNewHeroImageUrl}
                    className="bg-white"
                  />
                  <Button 
                    className="w-full font-bold h-12 shadow-lg shadow-blue-200" 
                    disabled={!newHeroImageUrl || isSavingHero}
                    onClick={handleSaveHeroImage}
                  >
                    {isSavingHero ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                    ) : (
                      editingHeroIndex !== null ? 'Simpan Perubahan' : 'Tambahkan ke Slider'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* List Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Urutan Slider ({heroImages.length})</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {heroImages.map((url, idx) => (
                    <motion.div 
                      key={idx}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "group relative rounded-3xl overflow-hidden aspect-video border-4 transition-all duration-300",
                        editingHeroIndex === idx ? "border-blue-500 ring-4 ring-blue-100" : "border-white shadow-lg"
                      )}
                    >
                      <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt={`Hero ${idx}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="secondary"
                            size="sm"
                            className="flex-1 font-bold h-9 bg-white/90 hover:bg-white text-gray-900"
                            onClick={() => setPreviewImageUrl(url)}
                          >
                            <Eye className="w-4 h-4 mr-2" /> View
                          </Button>
                          <Button 
                            variant="secondary"
                            size="sm"
                            className="flex-1 font-bold h-9 bg-white/90 hover:bg-white text-gray-900"
                            onClick={() => handleEditHeroImage(idx)}
                          >
                            <Settings className="w-4 h-4 mr-2" /> Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-10 h-9 p-0"
                            onClick={() => handleDeleteHeroImage(idx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-full border border-white/20">
                        SLIDE {idx + 1}
                      </div>
                    </motion.div>
                  ))}

                  {heroImages.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
                      <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                      <p className="font-bold">Belum ada gambar custom</p>
                      <p className="text-xs">Slider akan menampilkan gambar default.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
              {previewImageUrl && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-sm"
                  onClick={() => setPreviewImageUrl(null)}
                >
                  <Button 
                    className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12"
                    variant="ghost"
                    size="icon"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                  <motion.img 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    src={previewImageUrl} 
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
                    alt="Preview Full" 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Setup & Maintenance</h2>
              <p className="text-gray-500 text-sm">Gunakan fitur ini untuk inisialisasi awal sistem atau mereset data demo.</p>
            </div>

            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-800">Inisialisasi Data Demo</CardTitle>
                <CardDescription>
                  Tombol ini akan menambahkan lapangan, time slots, dan beberapa contoh booking ke dalam database Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-orange-50 p-4 rounded-lg text-sm text-orange-700 mb-4">
                  <strong>Catatan:</strong> Data ini dirancang untuk memudahkan Anda melihat tampilan aplikasi saat pertama kali digunakan.
                </div>
                <Button 
                  onClick={seedData} 
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? 'Sedang Memproses...' : 'Tampilkan / Reset Data Demo'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-100">
              <CardHeader>
                <CardTitle className="text-red-800">Pembersihan Database</CardTitle>
                <CardDescription>
                  Gunakan fitur ini untuk menghapus data yang terduplikasi secara otomatis (berdasarkan nama atau waktu).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline"
                  onClick={cleanupDuplicates} 
                  disabled={loading}
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  {loading ? 'Membersihkan...' : 'Hapus Semua Data Duplikat'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Sistem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded text-sm">
                  <span>Jumlah Lapangan Terdaftar</span>
                  <Badge variant="outline">{courts.length}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded text-sm">
                  <span>Jumlah Slot Waktu</span>
                  <Badge variant="outline">{slots.length}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded text-sm">
                  <span>Total Booking (Semua)</span>
                  <Badge variant="outline">{bookings.length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
