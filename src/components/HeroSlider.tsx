import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1541414779316-956a5084c0d4?q=80&w=2000", // Badminton court view
  "https://images.unsplash.com/photo-1595438662241-11993433626d?q=80&w=2000", // Racket and shuttlecock
  "https://images.unsplash.com/photo-1613918431208-673b08070ad2?q=80&w=2000"  // Macro shuttlecock
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [images, setImages] = useState<string[]>(DEFAULT_IMAGES);

  useEffect(() => {
    // Use onSnapshot for real-time updates from Firestore
    const unsub = onSnapshot(doc(db, 'settings', 'hero'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.images && data.images.length > 0) {
          setImages(data.images);
        } else {
          setImages(DEFAULT_IMAGES);
        }
      }
    }, (err) => {
      console.error("Error listening to hero settings:", err);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (images.length <= 1) {
      setIndex(0);
      return;
    }
    
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    
    return () => clearInterval(timer);
  }, [images]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-gray-100">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${images[index]}`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={images[index]}
            alt="Hero background"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error("Image load error:", images[index]);
              // Fallback to default if one image fails
              const target = e.target as HTMLImageElement;
              target.src = DEFAULT_IMAGES[0];
            }}
          />
          {/* Subtler gradient overlay to ensure images are more visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent" />
          <div className="absolute inset-0 bg-black/5" /> 
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
