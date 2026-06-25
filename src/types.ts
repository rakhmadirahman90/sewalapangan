export type BookingStatus = 'pending' | 'verified' | 'rejected';

export interface Court {
  id: string;
  name: string;
  pricePerHour: number;
  description: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerName: string;
  customerWhatsApp: string;
  courtId: string;
  courtName: string;
  date: string; // ISO Date YYYY-MM-DD
  startTime: string;
  endTime: string;
  totalPrice: number;
  paymentProofUrl?: string;
  status: BookingStatus;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface Admin {
  uid: string;
  email: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  whatsapp: string;
  subject: string;
  message: string;
  createdAt: any;
  isRead: boolean;
}
