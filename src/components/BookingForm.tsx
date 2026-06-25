import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Court, TimeSlot, Booking, BookingStatus } from '@/src/types';
import { cn, formatCurrency, generateBookingCode } from '@/src/lib/utils';
import { compressImage } from '@/src/lib/imageUtils';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Calendar, Clock, MapPin, Phone, User, Upload, CheckCircle2, ChevronRight, ChevronLeft, CreditCard } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function BookingForm() {
  const [step, setStep] = useState(1);
  const [courts, setCourts] = useState<Court[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]); // Array of startTime
  
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]); // Array of startTime
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    paymentProof: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);

  useEffect(() => {
    fetchCourts();
    fetchTimeSlots();
  }, []);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      fetchBookedSlots();
    }
  }, [selectedCourt, selectedDate]);

  const fetchCourts = async () => {
    const querySnapshot = await getDocs(collection(db, 'courts'));
    const courtsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Court));
    setCourts(courtsData);
  };

  const fetchTimeSlots = async () => {
    const querySnapshot = await getDocs(collection(db, 'timeSlots'));
    const slotsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeSlot));
    setTimeSlots(slotsData.sort((a, b) => a.startTime.localeCompare(b.startTime)));
  };

  const fetchBookedSlots = async () => {
    if (!selectedCourt) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const q = query(
      collection(db, 'bookings'),
      where('courtId', '==', selectedCourt.id),
      where('date', '==', dateStr),
      where('status', 'in', ['pending', 'verified'])
    );
    const querySnapshot = await getDocs(q);
    const booked = querySnapshot.docs.map(doc => doc.data().startTime);
    setBookedSlots(booked);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        // High compression for payment proof to save database space
        const compressed = await compressImage(file, 1000, 1000, 0.6);
        setFormData(prev => ({ ...prev, paymentProof: compressed }));
        toast.success("Bukti pembayaran berhasil diunggah");
      } catch (error) {
        console.error('Compression error:', error);
        toast.error("Gagal mengunggah bukti pembayaran. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedCourt || selectedSlots.length === 0) {
      toast.error("Pilih lapangan dan jam terlebih dahulu!");
      return;
    }
    
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const totalPrice = selectedSlots.length * selectedCourt.pricePerHour;
      const bookingCode = generateBookingCode();
      
      // For simplicity, we just take the first and last slot for display
      const startTime = selectedSlots.sort()[0];
      const endTime = timeSlots.find(s => s.startTime === selectedSlots.sort()[selectedSlots.length - 1])?.endTime || '';

      const bookingData: Partial<Booking> = {
        bookingCode,
        customerName: formData.name,
        customerWhatsApp: formData.whatsapp,
        courtId: selectedCourt.id,
        courtName: selectedCourt.name,
        date: dateStr,
        startTime,
        endTime,
        totalPrice,
        paymentProofUrl: formData.paymentProof,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      toast.success("Booking berhasil diajukan! Menunggu verifikasi admin.");
      setBookingResult({ id: docRef.id, ...bookingData } as Booking);
      setStep(5);
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Gagal melakukan booking. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (startTime: string) => {
    if (selectedSlots.includes(startTime)) {
      setSelectedSlots(prev => prev.filter(s => s !== startTime));
    } else {
      setSelectedSlots(prev => [...prev, startTime]);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  if (step === 5 && bookingResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center"
      >
        <Card className="border-green-100 bg-green-50/30">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-green-800">Booking Berhasil Dicatat!</CardTitle>
            <CardDescription>
              Silakan simpan Kode Booking Anda. Admin akan memverifikasi pembayaran Anda dalam waktu maksimal 15 menit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Kode Booking</p>
              <p className="text-3xl font-mono font-bold text-gray-900">{bookingResult.bookingCode}</p>
            </div>
            <div className="text-left space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Nama:</span>
                <span className="font-medium text-gray-900">{bookingResult.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Lapangan:</span>
                <span className="font-medium text-gray-900">{bookingResult.courtName}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span className="font-medium text-gray-900">{format(new Date(bookingResult.date), 'dd MMMM yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span>Jam:</span>
                <span className="font-medium text-gray-900">{bookingResult.startTime} - {bookingResult.endTime}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span>Total Bayar:</span>
                <span className="font-bold text-blue-600">{formatCurrency(bookingResult.totalPrice)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 font-bold" 
              onClick={() => {
                const msg = `Halo Admin, saya sudah melakukan pembayaran untuk Booking ${bookingResult.bookingCode}.\n\nNama: ${bookingResult.customerName}\nLapangan: ${bookingResult.courtName}\nTanggal: ${format(new Date(bookingResult.date), 'dd/MM/yyyy')}\nJam: ${bookingResult.startTime}-${bookingResult.endTime}\n\nMohon segera diverifikasi. Terima kasih!`;
                const waUrl = `https://wa.me/6289616746342?text=${encodeURIComponent(msg)}`;
                window.open(waUrl, '_blank');
              }}
            >
              <Phone className="w-4 h-4 mr-2" /> Konfirmasi via WA
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => window.location.reload()}>Booking Lagi</Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 px-4">
        {[1, 2, 3, 4].map((i) => (
          <React.Fragment key={i}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
              step >= i ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
            )}>
              {i}
            </div>
            {i < 4 && (
              <div className={cn(
                "flex-1 h-1 mx-2 rounded",
                step > i ? "bg-blue-600" : "bg-gray-200"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Pilih Lapangan</h2>
              <p className="text-gray-500">Tersedia {courts.length} lapangan berkualitas untuk Anda.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courts.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-gray-400">Belum ada data lapangan.</div>
              ) : (
                courts.map((court) => (
                  <Card 
                    key={court.id} 
                    className={cn(
                      "cursor-pointer transition-all hover:ring-2 hover:ring-blue-500",
                      selectedCourt?.id === court.id ? "ring-2 ring-blue-600 border-blue-600" : ""
                    )}
                    onClick={() => setSelectedCourt(court)}
                  >
                    <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden relative">
                      {court.imageUrl ? (
                        <img src={court.imageUrl} alt={court.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <MapPin className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="success" className="bg-blue-600">
                          {formatCurrency(court.pricePerHour)}/jam
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{court.name}</CardTitle>
                      <CardDescription className="line-clamp-1">{court.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={nextStep} 
                disabled={!selectedCourt}
                className="group"
              >
                Pilih Tanggal <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Pilih Jadwal</h2>
              <p className="text-gray-500">Pilih tanggal dan jam bermain di {selectedCourt?.name}.</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="mr-2 w-4 h-4" /> Pilih Tanggal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                    const date = addDays(new Date(), offset);
                    const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                    return (
                      <button
                        key={offset}
                        onClick={() => {
                          setSelectedDate(startOfDay(date));
                          setSelectedSlots([]);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[70px] p-3 rounded-xl border transition-all",
                          isSelected 
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 scale-105" 
                            : "bg-white border-gray-100 text-gray-600 hover:border-blue-300"
                        )}
                      >
                        <span className="text-xs uppercase font-semibold">{format(date, 'EEE')}</span>
                        <span className="text-lg font-bold">{format(date, 'dd')}</span>
                        <span className="text-[10px]">{format(date, 'MMM')}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="mr-2 w-4 h-4" /> Pilih Jam (Time Slot)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot.startTime);
                    const isSelected = selectedSlots.includes(slot.startTime);
                    return (
                      <button
                        key={slot.id}
                        disabled={isBooked || !slot.isActive}
                        onClick={() => toggleSlot(slot.startTime)}
                        className={cn(
                          "py-2 px-1 rounded-lg border text-sm font-medium transition-all relative overflow-hidden",
                          isBooked 
                            ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed line-through" 
                            : isSelected
                              ? "bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600"
                              : "bg-white border-gray-200 text-gray-700 hover:border-blue-400"
                        )}
                      >
                        {slot.startTime}
                        {isSelected && <div className="absolute top-0 right-0 bg-blue-600 w-2 h-2 rounded-bl-full" />}
                      </button>
                    );
                  })}
                </div>
                {selectedSlots.length > 0 && selectedCourt && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-blue-600 font-semibold uppercase">Total Estimasi</p>
                      <p className="text-xl font-bold text-blue-900">{formatCurrency(selectedSlots.length * selectedCourt.pricePerHour)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-600">{selectedSlots.length} Jam terpilih</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 w-4 h-4" /> Kembali</Button>
              <Button onClick={nextStep} disabled={selectedSlots.length === 0}>
                Lanjut Isi Data <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Informasi Kontak</h2>
              <p className="text-gray-500">Berikan detail kontak Anda untuk verifikasi booking.</p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center"><User className="w-4 h-4 mr-2" /> Nama Lengkap</label>
                  <Input 
                    placeholder="Masukkan nama Anda" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center"><Phone className="w-4 h-4 mr-2" /> Nomor WhatsApp</label>
                  <Input 
                    placeholder="Contoh: 08123456789" 
                    value={formData.whatsapp}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                  />
                  <p className="text-[10px] text-gray-400">*Kode booking akan dikirimkan ke nomor ini.</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 w-4 h-4" /> Kembali</Button>
              <Button onClick={nextStep} disabled={!formData.name || !formData.whatsapp}>
                Lanjut Pembayaran <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Pembayaran</h2>
              <p className="text-gray-500">Silakan transfer dan upload bukti pembayaran.</p>
            </div>

            <Card className="bg-gray-900 text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-sm flex items-center text-gray-400">
                  <CreditCard className="mr-2 w-4 h-4" /> Rekening Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Bank BCA</p>
                    <p className="text-2xl font-mono tracking-wider">123 456 7890</p>
                    <p className="text-sm text-gray-300">a.n. BADMINTON COURT HUB</p>
                  </div>
                  <Badge variant="success" className="bg-blue-500">UTAMA</Badge>
                </div>
                
                <div className="pt-2 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400">Total Tagihan</p>
                    <p className="text-3xl font-bold text-blue-400">{formatCurrency(selectedSlots.length * (selectedCourt?.pricePerHour || 0))}</p>
                  </div>
                  <div className="text-right text-[10px] text-gray-500 italic">
                    *Sudah termasuk biaya sewa {selectedSlots.length} jam
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <Upload className="mr-2 w-4 h-4" /> Upload Bukti Transfer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                    formData.paymentProof ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/30"
                  )}
                >
                  <input 
                    type="file" 
                    id="receipt" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />
                  <label htmlFor="receipt" className="cursor-pointer block">
                    {formData.paymentProof ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                        <p className="text-sm font-medium text-green-700">Gambar Terpilih!</p>
                        <p className="text-xs text-gray-500">Klik untuk ganti gambar</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="text-sm font-medium text-gray-600">Pilih Foto atau Screenshot</p>
                        <p className="text-xs text-gray-400">Format: JPG, PNG, WEBP (Max 1MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={prevStep} disabled={loading}><ChevronLeft className="mr-2 w-4 h-4" /> Kembali</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.paymentProof || loading}
                className="bg-green-600 hover:bg-green-700 min-w-[150px]"
              >
                {loading ? "Memproses..." : "Konfirmasi Booking"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
