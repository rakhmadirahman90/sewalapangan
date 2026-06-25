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
        if (data.images && Array.isArray(data.images)) {
          const validImages = data.images.filter(url => url && typeof url === 'string' && url.length > 5);
          if (validImages.length > 0) {
            setImages(validImages);
            return;
          }
        }
      }
      setImages(DEFAULT_IMAGES);
    }, (err) => {
      console.error("Error listening to hero settings:", err);
      setImages(DEFAULT_IMAGES);
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
    <div className="absolute inset-0 overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${images[index]}`}
          initial={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            filter: 'blur(0px)',
            transition: { duration: 1.8, ease: "easeOut" }
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.95,
            transition: { duration: 1.2, ease: "easeIn" }
          }}
          className="absolute inset-0"
        >
          {/* Main Background Image with Ken Burns Zoom */}
          <motion.img
            src={images[index]}
            alt="Hero background"
            className="w-full h-full object-cover object-center"
            animate={{ 
              scale: [1, 1.1],
              x: [0, -10],
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              repeatType: "reverse", 
              ease: "linear" 
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = DEFAULT_IMAGES[0];
            }}
          />

          {/* Sophisticated Overlay System */}
          {/* 1. Base Darkening */}
          <div className="absolute inset-0 bg-black/30" />
          
          {/* 2. Glassmorphism Light Gradient (Right to Left for Text Balance) */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/40 to-transparent backdrop-blur-[1px]" />
          
          {/* 3. Bottom Gradient for Depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60" />
          
          {/* 4. Subtle Texture/Noise (Optional but adds premium feel) */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        </motion.div>
      </AnimatePresence>
      
      {/* Slide Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {images.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
}
