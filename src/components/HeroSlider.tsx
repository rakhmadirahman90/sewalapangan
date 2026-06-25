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
    <div className="absolute inset-0 overflow-hidden bg-slate-900">
      {/* Adaptive Background that matches the current image */}
      {images.length > 0 && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-50 scale-125 transition-all duration-1000"
          style={{ backgroundImage: `url(${images[index]})` }}
        />
      )}

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

          {/* Adaptive Vibrant Overlay (Matches the image's own colors) */}
          {images.length > 0 && (
            <div 
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 mix-blend-overlay scale-110 transition-all duration-1000"
              style={{ backgroundImage: `url(${images[index]})` }}
            />
          )}

          {/* Modern Bright Badminton Theme Overlay */}
          {/* 1. Base Contrast (Lighten slightly to keep it bright but ensure white text readable) */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-indigo-900/30 mix-blend-multiply" />
          
          {/* 2. Soft Vignette to draw focus */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/40" />
          
          {/* 3. Bottom Gradient for smooth transition to the gray-50 background of the app */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-900/10 to-transparent opacity-100" />
          
          {/* 4. Top Gradient to protect the white header text */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-60" />
          
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
