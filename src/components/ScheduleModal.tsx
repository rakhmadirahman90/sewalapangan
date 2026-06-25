import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { collection, query, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Court, TimeSlot, Booking } from '../types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookNow: () => void;
}

interface ScheduleSlot {
  time: string;
  courts: {
    id: string;
    name: string;
    status: 'available' | 'booked';
  }[];
}

export default function ScheduleModal({ isOpen, onClose, onBookNow }: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState<ScheduleSlot[]>([]);
  
  const [courts, setCourts] = useState<Court[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Fetch active courts
  useEffect(() => {
    if (!isOpen) return;
    const unsub = onSnapshot(collection(db, 'courts'), (snap) => {
      const activeCourts = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Court))
        .filter(c => c.isActive);
      setCourts(activeCourts);
    }, (error) => {
      console.error("Error fetching courts:", error);
    });
    return () => unsub();
  }, [isOpen]);

  // Fetch active time slots
  useEffect(() => {
    if (!isOpen) return;
    const unsub = onSnapshot(collection(db, 'timeSlots'), (snap) => {
      const activeSlots = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as TimeSlot))
        .filter(s => s.isActive)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      setTimeSlots(activeSlots);
    }, (error) => {
      console.error("Error fetching timeSlots:", error);
    });
    return () => unsub();
  }, [isOpen]);

  // Fetch bookings for the selected date
  useEffect(() => {
    if (!isOpen) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const q = query(
      collection(db, 'bookings'),
      where('date', '==', dateStr)
    );
    const unsub = onSnapshot(q, (snap) => {
      const allBookings = snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
      setBookings(allBookings.filter(b => ['pending', 'verified'].includes(b.status)));
    }, (error) => {
      console.error("Error fetching bookings:", error);
    });
    return () => unsub();
  }, [isOpen, selectedDate]);

  // Generate schedule table data
  useEffect(() => {
    const newSchedule: ScheduleSlot[] = timeSlots.map(slot => {
      return {
        time: `${slot.startTime} - ${slot.endTime}`,
        courts: courts.map(court => {
          // A slot is booked if there's any booking for this court that overlaps this slot.
          // Since Booking saves `startTime` as the first slot's start, and `endTime` as the last slot's end,
          // a slot overlaps if `slot.startTime >= booking.startTime` and `slot.startTime < booking.endTime`.
          const isSlotBooked = bookings.some(b => 
            b.courtId === court.id && 
            slot.startTime >= b.startTime && 
            slot.startTime < b.endTime
          );

          return {
            id: court.id,
            name: court.name,
            status: isSlotBooked ? 'booked' : 'available'
          };
        })
      };
    });
    setScheduleData(newSchedule);
  }, [timeSlots, courts, bookings]);

  if (!isOpen) return null;

  const dates = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-xl sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-blue-600" />
                Jadwal Lapangan
              </h2>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Availability Data
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            {/* Date Selector */}
            <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
              {dates.map((date, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center min-w-[80px] p-3 rounded-2xl border transition-all ${
                    selectedDate.toDateString() === date.toDateString()
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
            <div className="space-y-3">
              {scheduleData.map((slot, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={slot.time} 
                  className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-20 font-bold text-gray-900 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {slot.time}
                  </div>
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {slot.courts.map(court => (
                      <div 
                        key={court.id}
                        className={`p-3 rounded-xl border flex flex-col justify-center items-center text-center gap-1 transition-all ${
                          court.status === 'available'
                            ? 'bg-green-50/50 border-green-200 cursor-pointer hover:bg-green-50 hover:scale-105'
                            : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <span className={`text-sm font-semibold ${court.status === 'available' ? 'text-green-800' : 'text-gray-500'}`}>
                          {court.name}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${court.status === 'available' ? 'text-green-600' : 'text-gray-400'}`}>
                          {court.status === 'available' ? 'Tersedia' : 'Penuh'}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-white flex justify-center">
            <button 
              onClick={() => {
                onBookNow();
              }}
              className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Booking Sekarang
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
