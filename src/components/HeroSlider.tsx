import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '@/src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1626224484214-4051d0c35050?auto=format&fit=crop&q=80&w=2070", // Badminton court
  "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&q=80&w=2070", // Action shot
  "https://images.unsplash.com/photo-1613918431208-673b08070ad2?auto=format&fit=crop&q=80&w=2070"  // Shuttlecock
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [images, setImages] = useState<string[]>(DEFAULT_IMAGES);

  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const hDoc = await getDoc(doc(db, 'settings', 'hero'));
        if (hDoc.exists() && hDoc.data().images?.length > 0) {
          setImages(hDoc.data().images);
        }
      } catch (e) {
        console.error("Error fetching hero images:", e);
      }
    };
    fetchHeroImages();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [images]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={images[index]}
            alt="Hero background"
            className="w-full h-full object-cover"
          />
          {/* Enhanced Overlay with dynamic opacity based on viewport */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/70 to-gray-50/100" />
          <div className="absolute inset-0 bg-black/5" /> {/* Subtle darkening for better text pop */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
