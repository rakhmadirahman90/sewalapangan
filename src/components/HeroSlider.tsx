import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    // Use onSnapshot for real-time updates from Firestore
    const unsub = onSnapshot(doc(db, 'settings', 'hero'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.images)) {
          const validImages = data.images.filter(url => url && typeof url === 'string' && url.length > 5);
          setImages(validImages);
          return;
        }
      }
      setImages([]);
    }, (err) => {
      console.error("Error listening to hero settings:", err);
      setImages([]);
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
          {images.length > 0 && (
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
                target.style.display = 'none';
              }}
            />
          )}

          {/* Sophisticated Dark Overlay System */}
          {/* 1. Base Darkening for Contrast */}
          <div className="absolute inset-0 bg-gray-950/40 mix-blend-multiply" />
          
          {/* 2. Radial Vignette (Draws focus to center) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-gray-900/40 to-gray-950/80" />
          
          {/* 3. Bottom Gradient for smooth transition to next section */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-900/20 to-transparent opacity-100" />
          
          {/* 4. Top Gradient to protect the header */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-transparent to-transparent opacity-70" />
          
          {/* 5. Subtle Texture/Noise (Adds premium feel) */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
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
