import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, where, orderBy, setDoc, getDoc, limit, serverTimestamp, onSnapshot } from 'firebase/firestore';
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
  ImageIcon,
  CalendarDays,
  Edit
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, subDays, startOfDay, endOfDay, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'bookings' | 'courts' | 'slots' | 'contacts' | 'setup' | 'landing'>('dashboard');
  const [scheduleSelectedDate, setScheduleSelectedDate] = useState(new Date());
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroTitle, setHeroTitle] = useState('Main Badminton Lebih Mudah & Cepat');
  const [heroSubtitle, setHeroSubtitle] = useState('Pilih lapangan, tentukan jam, bayar, dan langsung main. Sistem booking modern tanpa perlu registrasi akun.');
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
  const [bookingEditForm, setBookingEditForm] = useState({ 
    customerName: '', 
    customerWhatsApp: '',
    date: '',
    courtId: '',
    startTime: '',
    endTime: '',
    totalPrice: 0
  });

  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    // Bypass Firebase Auth for custom login
    setLoading(false);
    setUser({ uid: 'admin-hardcoded', email: 'admin' } as User);
    setIsAdmin(true);
    fetchData();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    
    // Subscribe Bookings
    const unsubBookings = onSnapshot(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')), (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    }, (error) => console.error("Bookings snapshot error:", error));

    // Subscribe Courts
    const unsubCourts = onSnapshot(collection(db, 'courts'), (snap) => {
      setCourts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Court)));
    }, (error) => console.error("Courts snapshot error:", error));

    // Subscribe Slots
    const unsubSlots = onSnapshot(collection(db, 'timeSlots'), (snap) => {
      setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeSlot)));
    }, (error) => console.error("Slots snapshot error:", error));

    // Subscribe Messages
    const unsubMessages = onSnapshot(query(collection(db, 'contacts'), orderBy('createdAt', 'desc')), (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ContactMessage)));
    }, (error) => console.error("Contacts snapshot error:", error));

    // Subscribe Hero Settings
    const unsubHero = onSnapshot(doc(db, 'settings', 'hero'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHeroImages(data.images || []);
        if (data.heroTitle) setHeroTitle(data.heroTitle);
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
      }
    }, (error) => console.error("Hero snapshot error:", error));

    return () => {
      unsubBookings();
      unsubCourts();
      unsubSlots();
      unsubMessages();
      unsubHero();
    };
  }, [isAdmin]);

  const fetchData = async () => {
    // Left empty since we are now using onSnapshot subscriptions above.
    // Kept here so we don't have to remove all calls to fetchData().
  };

  const handleSaveHeroSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'hero'), { 
        images: heroImages,
        heroTitle,
        heroSubtitle
      }, { merge: true });
      toast.success("Pengaturan hero berhasil disimpan");
    } catch (e) {
      console.error(e);
      toast.error("Gagal menyimpan pengaturan hero");
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
      await setDoc(doc(db, 'settings', 'hero'), { images: updatedImages }, { merge: true });
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
      await setDoc(doc(db, 'settings', 'hero'), { images: updatedImages }, { merge: true });
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
      if (editingSlot) {
        await updateDoc(doc(db, 'timeSlots', editingSlot.id), {
          startTime: slotForm.startTime,
          endTime: slotForm.endTime
        });
        toast.success("Slot jam berhasil diupdate");
      } else {
        await addDoc(collection(db, 'timeSlots'), slotForm);
        toast.success("Slot jam baru berhasil ditambahkan");
      }
      setShowSlotForm(false);
      setEditingSlot(null);
      setSlotForm({ startTime: '', endTime: '', isActive: true });
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
      const courtName = courts.find(c => c.id === bookingEditForm.courtId)?.name || editingBooking.courtName;
      
      await updateDoc(doc(db, 'bookings', editingBooking.id), {
        customerName: bookingEditForm.customerName,
        customerWhatsApp: bookingEditForm.customerWhatsApp,
        date: bookingEditForm.date,
        courtId: bookingEditForm.courtId,
        courtName: courtName,
        startTime: bookingEditForm.startTime,
        endTime: bookingEditForm.endTime,
        totalPrice: Number(bookingEditForm.totalPrice) || 0,
        updatedAt: serverTimestamp()
      });
      setBookings(prev => prev.map(b => b.id === editingBooking.id ? { 
        ...b, 
        customerName: bookingEditForm.customerName, 
        customerWhatsApp: bookingEditForm.customerWhatsApp,
        date: bookingEditForm.date,
        courtId: bookingEditForm.courtId,
        courtName: courtName,
        startTime: bookingEditForm.startTime,
        endTime: bookingEditForm.endTime,
        totalPrice: Number(bookingEditForm.totalPrice) || 0
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
      <aside className="w-full md:w-64 flex flex-row md:flex-col overflow-x-auto gap-2 pb-3 md:pb-0 sticky top-0 bg-white md:static z-10 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide shrink-0 md:space-y-2 border-b border-gray-100 md:border-b-0 mb-4 md:mb-0">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-full md:rounded-lg text-sm font-medium transition-colors md:w-full whitespace-nowrap",
            activeTab === 'dashboard' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <LayoutDashboard className="w-4 h-4" /> <span className="hidden md:inline">Dashboard</span><span className="md:hidden">Dash</span>
        </button>
        <button 
          onClick={() => setActiveTab('schedule')}
          className={cn(
            "shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-full md:rounded-lg text-sm font-medium transition-colors md:w-full whitespace-nowrap",
            activeTab === 'schedule' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <CalendarDays className="w-4 h-4" /> <span className="hidden md:inline">Jadwal Lapangan</span><span className="md:hidden">Jadwal</span>
        </button>
        <button 
          onClick={() => setActiveTab('bookings')}
          className={cn(
            "shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-full md:rounded-lg text-sm font-medium transition-colors md:w-full whitespace-nowrap",
            activeTab === 'bookings' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <CalendarCheck className="w-4 h-4" /> <span className="hidden md:inline">Daftar Booking</span><span className="md:hidden">Booking</span>
        </button>
        <button 
          onClick={() => setActiveTab('courts')}
          className={cn(
            "shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-full md:rounded-lg text-sm font-medium transition-colors md:w-full whitespace-nowrap",
            activeTab === 'courts' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <Package className="w-4 h-4" /> <span className="hidden md:inline">Kelola Lapangan</span><span className="md:hidden">Lapangan</span>
        </button>
        <button 
          onClick={() => setActiveTab('slots')}
          className={cn(
            "shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-full md:rounded-lg text-sm font-medium transition-colors md:w-full whitespace-nowrap",
            activeTab === 'slots' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <Clock className="w-4 h-4" /> <span className="hidden md:inline">Kelola Jam</span><span className="md:hidden">Jam</span>
        </button>
        <button 
          onClick={() => setActiveTab('contacts')}
          className={cn(
            "shrink-0 flex items-center justify-between px-4 py-2 md:py-3 rounded-full md:rounded-lg text-sm font-medium transition-colors md:w-full gap-2 md:gap-3 whitespace-nowrap",
            activeTab === 'contacts' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <div className="flex items-center gap-2 md:gap-3">
            <MessageSquare className="w-4 h-4" /> <span className="hidden md:inline">Pesan Masuk</span><span className="md:hidden">Pesan</span>
          </div>
          {messages.filter(m => !m.isRead).length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 md:ml-0">
              {messages.filter(m => !m.isRead).length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('landing')}
          className={cn(
            "shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-full md:rounded-lg text-sm font-medium transition-colors md:w-full whitespace-nowrap",
            activeTab === 'landing' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <LayoutDashboard className="w-4 h-4" /> <span className="hidden md:inline">Landing Page</span><span className="md:hidden">Landing</span>
        </button>
        <button 
          onClick={() => setActiveTab('setup')}
          className={cn(
            "shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-full md:rounded-lg text-sm font-medium transition-colors md:w-full whitespace-nowrap",
            activeTab === 'setup' ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
          )}
        >
          <Settings className="w-4 h-4" /> <span className="hidden md:inline">Setup Sistem</span><span className="md:hidden">Setup</span>
        </button>
        <div className="md:pt-8 md:border-t border-gray-100 shrink-0 flex items-center md:block border-l md:border-l-0 pl-2 md:pl-0 ml-1 md:ml-0">
          <p className="hidden md:block px-4 text-[10px] uppercase font-bold text-gray-400 mb-2">Akun</p>
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-full md:rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 md:w-full whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Logout</span>
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
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={fetchData} className="flex-1 sm:flex-none">
                  <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
                <Button size="sm" onClick={() => setActiveTab('bookings')} className="flex-1 sm:flex-none">
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

        {activeTab === 'schedule' && (() => {
          const scheduleDates = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
          const activeCourts = courts.filter(c => c.isActive);
          const activeSlots = slots.filter(s => s.isActive).sort((a, b) => a.startTime.localeCompare(b.startTime));

          const scheduleData = activeSlots.map(slot => {
            return {
              time: `${slot.startTime} - ${slot.endTime}`,
              courts: activeCourts.map(court => {
                const isSlotBooked = bookings.some(b => 
                  b.courtId === court.id && 
                  b.date === format(scheduleSelectedDate, 'yyyy-MM-dd') &&
                  ['pending', 'verified'].includes(b.status) &&
                  slot.startTime >= b.startTime && 
                  slot.startTime < b.endTime
                );

                return {
                  id: court.id,
                  name: court.name,
                  status: isSlotBooked ? 'booked' : 'available',
                  bookingId: isSlotBooked ? bookings.find(b => 
                    b.courtId === court.id && 
                    b.date === format(scheduleSelectedDate, 'yyyy-MM-dd') &&
                    ['pending', 'verified'].includes(b.status) &&
                    slot.startTime >= b.startTime && 
                    slot.startTime < b.endTime
                  )?.id : undefined
                };
              })
            };
          });

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Jadwal Lapangan</h2>
                  <p className="text-gray-500">Lihat ketersediaan lapangan berdasarkan tanggal.</p>
                </div>
              </div>

              <Card className="border-none shadow-md overflow-hidden bg-white">
                <div className="p-6 bg-gray-50/50">
                  {/* Date Selector */}
                  <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
                    {scheduleDates.map((date, i) => (
                      <button
                        key={i}
                        onClick={() => setScheduleSelectedDate(date)}
                        className={`flex flex-col items-center min-w-[80px] p-3 rounded-2xl border transition-all ${
                          scheduleSelectedDate.toDateString() === date.toDateString()
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <span className="text-xs font-medium mb-1 uppercase tracking-wider opacity-80">
                          {format(date, 'EEE', { locale: id })}
                        </span>
                        <span className="text-2xl font-bold">
                          {format(date, 'dd')}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex gap-6 mb-6 px-2 text-sm font-medium text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-md bg-green-50 border border-green-200"></div>
                      Tersedia
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-md bg-gray-100 border border-gray-200"></div>
                      Dibooking
                    </div>
                  </div>

                  {/* Schedule Grid */}
                  <div className="space-y-4">
                    {scheduleData.map((slot, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={slot.time} 
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="w-auto sm:w-28 font-bold text-gray-900 flex flex-col items-start gap-2 pb-2 sm:pb-0 border-b border-gray-100 sm:border-b-0 sm:border-r border-dashed">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="whitespace-nowrap">{slot.time}</span>
                          </div>
                          
                          {/* Quick Actions for Time Slot directly in Schedule View */}
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => {
                                const activeSlot = activeSlots.find(s => `${s.startTime} - ${s.endTime}` === slot.time);
                                if (activeSlot) {
                                  setActiveTab('slots');
                                  setEditingSlot(activeSlot);
                                  setSlotForm({ startTime: activeSlot.startTime, endTime: activeSlot.endTime, isActive: activeSlot.isActive });
                                  setShowSlotForm(true);
                                }
                              }}
                              title="Edit Jam Operasional"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                const activeSlot = activeSlots.find(s => `${s.startTime} - ${s.endTime}` === slot.time);
                                if (activeSlot) {
                                  deleteSlot(activeSlot.id);
                                }
                              }}
                              title="Hapus Jam Operasional"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {slot.courts.map(court => (
                            <div 
                              key={court.id}
                              className={`group relative p-3 rounded-xl border flex flex-col justify-center items-center text-center gap-1 transition-all ${
                                court.status === 'available'
                                  ? 'bg-green-50/50 border-green-200 hover:bg-green-50'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <span className={`text-sm font-semibold ${court.status === 'available' ? 'text-green-800' : 'text-gray-500'}`}>
                                {court.name}
                              </span>
                              <span className={`text-[10px] uppercase tracking-wider font-bold ${court.status === 'available' ? 'text-green-600' : 'text-gray-400'}`}>
                                {court.status === 'available' ? 'Tersedia' : 'Penuh'}
                              </span>
                              {court.status === 'booked' ? (
                                <div className="mt-2 flex flex-row items-center justify-center gap-2 w-full">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    disabled={!court.bookingId}
                                    className="h-8 flex-1 text-blue-600 hover:bg-blue-50 border-blue-200 px-0"
                                    onClick={() => {
                                      if (court.bookingId) {
                                        setActiveTab('bookings');
                                        setSearchQuery(bookings.find(b => b.id === court.bookingId)?.customerName || '');
                                      }
                                    }}
                                    title="Detail/Edit"
                                  >
                                    <Edit className="w-3.5 h-3.5 mr-1" /> <span className="text-[10px] font-bold uppercase">Edit</span>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    disabled={!court.bookingId}
                                    className="h-8 flex-1 text-red-600 hover:bg-red-50 border-red-200 px-0"
                                    onClick={() => court.bookingId && deleteBooking(court.bookingId)}
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-1" /> <span className="text-[10px] font-bold uppercase">Hapus</span>
                                  </Button>
                                </div>
                              ) : court.status === 'available' && (
                                <div className="mt-2 flex items-center justify-center w-full">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 text-green-600 hover:bg-green-50 border-green-200 w-full"
                                    onClick={() => {
                                      setActiveTab('bookings');
                                      // Optional: set search query to empty or show create form
                                    }}
                                    title="Buat Booking"
                                  >
                                    <Plus className="w-4 h-4 mr-1" /> <span className="text-xs font-bold uppercase">Booking</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                    {scheduleData.length === 0 && (
                      <div className="text-center py-10 text-gray-500">Belum ada slot waktu aktif.</div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}

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
              <div className="flex flex-wrap sm:flex-nowrap p-1 bg-gray-100 rounded-lg gap-1">
                {(['all', 'pending', 'verified', 'rejected'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "px-3 py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all uppercase tracking-wider flex-1 sm:flex-none whitespace-nowrap",
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
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Card className={cn(
                      "overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 group border-l-4",
                      b.status === 'verified' ? "border-l-green-500 border-y-transparent border-r-transparent bg-gradient-to-r from-green-50/30 to-transparent" :
                      b.status === 'pending' ? "border-l-yellow-400 border-y-transparent border-r-transparent bg-gradient-to-r from-yellow-50/30 to-transparent" :
                      "border-l-red-500 border-y-transparent border-r-transparent bg-gradient-to-r from-red-50/30 to-transparent"
                    )}>
                      <div className="flex flex-col lg:flex-row">
                        <div className="w-full lg:w-56 bg-white/50 p-6 flex flex-col justify-center items-center border-b lg:border-b-0 lg:border-r border-gray-100 relative transition-colors duration-500">
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

                        <div className="flex-1 p-6 space-y-6 bg-transparent transition-colors duration-500">
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

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-100 mt-4">
                            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full sm:w-auto">
                              {b.status === 'pending' && (
                                <div className="flex gap-2 w-full sm:w-auto">
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 h-10 px-4 sm:px-6 font-bold flex-1 sm:flex-none whitespace-nowrap"
                                    onClick={() => updateBookingStatus(b.id, 'verified')}
                                  >
                                    <Check className="w-4 h-4 mr-2" /> Terima
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 border-red-100 hover:bg-red-50 h-10 font-bold flex-1 sm:flex-none whitespace-nowrap"
                                    onClick={() => updateBookingStatus(b.id, 'rejected')}
                                  >
                                    <X className="w-4 h-4 mr-2" /> Tolak
                                  </Button>
                                </div>
                              )}
                              {b.status === 'verified' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-amber-600 hover:bg-amber-50 h-10 font-bold w-full sm:w-auto"
                                  onClick={() => updateBookingStatus(b.id, 'pending')}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" /> Batal Verifikasi
                                </Button>
                              )}
                              {b.status === 'rejected' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-blue-600 hover:bg-blue-50 h-10 font-bold w-full sm:w-auto"
                                  onClick={() => updateBookingStatus(b.id, 'pending')}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" /> Restore
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-10 px-4 font-bold text-green-600 border-green-100 hover:bg-green-50 w-full sm:w-auto"
                                onClick={() => sendWhatsAppNotification(b)}
                              >
                                <Phone className="w-4 h-4 mr-2" /> Notif WA
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-gray-100 pt-2 sm:pt-0 mt-2 sm:mt-0">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-10 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 flex-1 sm:flex-none"
                                onClick={() => {
                                  setEditingBooking(b);
                                  setBookingEditForm({ 
                                    customerName: b.customerName, 
                                    customerWhatsApp: b.customerWhatsApp,
                                    date: b.date,
                                    courtId: b.courtId,
                                    startTime: b.startTime,
                                    endTime: b.endTime,
                                    totalPrice: b.totalPrice
                                  });
                                }}
                              >
                                <Settings className="w-4 h-4 mr-2" /> Edit
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-10 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 flex-1 sm:flex-none"
                                onClick={() => deleteBooking(b.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Hapus
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

            {/* Edit Booking Modal */}
            <AnimatePresence>
              {editingBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                  >
                    <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                      <h3 className="text-lg sm:text-xl font-bold">Edit Data Booking</h3>
                      <Button variant="ghost" size="icon" onClick={() => setEditingBooking(null)} className="h-8 w-8 rounded-full">
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    
                    <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nama Pemesan</label>
                        <Input 
                          value={bookingEditForm.customerName}
                          onChange={(e) => setBookingEditForm({...bookingEditForm, customerName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">No WhatsApp</label>
                        <Input 
                          value={bookingEditForm.customerWhatsApp}
                          onChange={(e) => setBookingEditForm({...bookingEditForm, customerWhatsApp: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tanggal</label>
                        <Input 
                          type="date"
                          value={bookingEditForm.date}
                          onChange={(e) => setBookingEditForm({...bookingEditForm, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Lapangan</label>
                        <select 
                          className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={bookingEditForm.courtId}
                          onChange={(e) => setBookingEditForm({...bookingEditForm, courtId: e.target.value})}
                        >
                          {courts.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Jam Mulai</label>
                          <select 
                            className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={bookingEditForm.startTime}
                            onChange={(e) => setBookingEditForm({...bookingEditForm, startTime: e.target.value})}
                          >
                            {slots.map(s => (
                              <option key={`start-${s.id}`} value={s.startTime}>{s.startTime}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Jam Selesai</label>
                          <select 
                            className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={bookingEditForm.endTime}
                            onChange={(e) => setBookingEditForm({...bookingEditForm, endTime: e.target.value})}
                          >
                            {slots.map(s => (
                              <option key={`end-${s.id}`} value={s.endTime}>{s.endTime}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Total Harga (Rp)</label>
                        <Input 
                          type="number"
                          value={bookingEditForm.totalPrice}
                          onChange={(e) => setBookingEditForm({...bookingEditForm, totalPrice: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 mt-auto sticky bottom-0 z-10">
                      <Button variant="outline" onClick={() => setEditingBooking(null)}>
                        Batal
                      </Button>
                      <Button onClick={handleUpdateBooking} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                        Simpan Perubahan
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        )}

        {activeTab === 'courts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                  <CardHeader className="flex flex-col sm:flex-row items-start justify-between space-y-4 sm:space-y-0 bg-white">
                    <div>
                      <CardTitle className="text-xl font-bold">{court.name}</CardTitle>
                      <CardDescription className="text-blue-600 font-bold">{formatCurrency(court.pricePerHour)} / jam</CardDescription>
                    </div>
                    <div className="flex gap-1 self-end sm:self-auto w-full sm:w-auto justify-end border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 mt-2 sm:mt-0">
                      <Button variant="outline" size="sm" className="rounded-lg flex-1 sm:flex-none border-gray-200 text-gray-600 hover:bg-gray-50" onClick={() => toggleCourtStatus(court)}>
                        {court.isActive ? <XCircle className="w-4 h-4 mr-2 text-amber-500" /> : <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />}
                        {court.isActive ? 'Matikan' : 'Aktifkan'}
                      </Button>
                      <Button variant="outline" size="icon" className="rounded-lg border-gray-200 text-blue-600 hover:bg-blue-50" onClick={() => {
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
                      <Button variant="outline" size="icon" className="rounded-lg border-red-200 text-red-500 hover:bg-red-50" onClick={() => deleteCourt(court)}>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">Kelola Jam (Time Slots)</h2>
              <Button size="sm" onClick={() => {
                setEditingSlot(null);
                setSlotForm({ startTime: '', endTime: '', isActive: true });
                setShowSlotForm(true);
              }}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Slot
              </Button>
            </div>

            {showSlotForm && (
              <Card className="border-blue-200 bg-blue-50/10">
                <CardHeader>
                  <CardTitle className="text-lg">{editingSlot ? 'Edit Time Slot' : 'Tambah Time Slot'}</CardTitle>
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
                      
                      <div className="mt-4 flex items-center justify-center gap-2 transition-all">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-orange-50 hover:text-orange-600" 
                          onClick={() => {
                            setEditingSlot(slot);
                            setSlotForm({ startTime: slot.startTime, endTime: slot.endTime, isActive: slot.isActive });
                            setShowSlotForm(true);
                          }}
                          title="Edit Slot"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600" 
                          onClick={() => toggleSlotStatus(slot)}
                          title={slot.isActive ? "Matikan Slot" : "Aktifkan Slot"}
                        >
                          {slot.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
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

                      <div className="flex flex-col sm:flex-row justify-end gap-2 border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0">
                        {!m.isRead && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-10 px-4 font-bold border-blue-200 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                            onClick={() => markAsRead(m.id)}
                          >
                            <Check className="w-4 h-4 mr-2" /> Tandai Dibaca
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-10 px-4 font-bold text-red-500 hover:bg-red-50 w-full sm:w-auto"
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
              {/* Text Settings Section */}
              <Card className="lg:col-span-3 border-none shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    Pengaturan Teks Hero
                  </CardTitle>
                  <CardDescription>
                    Ubah judul dan sub-judul yang muncul di halaman depan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Judul Utama</label>
                    <Input 
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder="Contoh: Main Badminton Lebih Mudah & Cepat"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Sub-judul</label>
                    <textarea 
                      className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      placeholder="Contoh: Pilih lapangan, tentukan jam, bayar, dan langsung main..."
                    />
                  </div>
                  <Button onClick={handleSaveHeroSettings} className="bg-blue-600 hover:bg-blue-700">
                    Simpan Teks Hero
                  </Button>
                </CardContent>
              </Card>

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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
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
                      <p className="font-bold">Belum ada gambar hero</p>
                      <p className="text-xs">Slider akan menampilkan latar belakang gradien.</p>
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
