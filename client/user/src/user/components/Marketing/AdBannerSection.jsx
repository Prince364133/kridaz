import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { gsap } from "gsap";

const PRI = "#55DEE8";

export const AdBannerSection = ({ banners = [] }) => {
 const [currentIndex, setCurrentIndex] = useState(0);
 const progressRef = useRef(null);
 const timerRef = useRef(null);
 const bannerDuration = 5000; // 5 seconds

 useEffect(() => {
 if (banners.length > 0) {
 startTimer();
 }
 return () => stopTimer();
 }, [currentIndex, banners]);

 const startTimer = () => {
 stopTimer();
 
 // Reset and animate progress bar
 gsap.set(progressRef.current, { width: "0%" });
 gsap.to(progressRef.current, {
 width: "100%",
 duration: bannerDuration / 1000,
 ease: "none",
 onComplete: nextSlide
 });
 };

 const stopTimer = () => {
 gsap.killTweensOf(progressRef.current);
 };

 const nextSlide = () => {
 setCurrentIndex((prev) => (prev + 1) % banners.length);
 };

 const prevSlide = () => {
 setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
 };

 if (!banners || banners.length === 0) return null;

 const currentBanner = banners[currentIndex];

 return (
 <section className="relative w-full overflow-hidden bg-black py-4 md:py-6">
 <div className="w-full px-4 lg:px-12">
 <div className="relative group aspect-[16/9] md:aspect-[21/9] rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
 {/* Progress Bar */}
 <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-30">
 <div 
 ref={progressRef}
 className="h-full bg-primary shadow-[0_0_15px_#55DEE8]"
 style={{ backgroundColor: PRI }}
 />
 </div>

 {/* Banner Image */}
 <div className="absolute inset-0 transition-all duration-700 ease-in-out">
 <img 
 src={currentBanner.imageUrl} 
 alt={currentBanner.title}
 className="w-full h-full object-cover opacity-90"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
 <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
 </div>

 {/* Content */}
 <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16">
 <div className="max-w-2xl space-y-4">
 <span className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest">
 Special Promotion
 </span>
 <h2 className="font-display text-4xl md:text-6xl uppercase leading-none text-white tracking-tight">
 {currentBanner.title}
 </h2>
 {currentBanner.targetUrl && (
 <a 
 href={currentBanner.targetUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-primary hover:scale-105 transition-all text-sm group"
 >
 Explore Now <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
 </a>
 )}
 </div>
 </div>

 {/* Navigation Controls */}
 <div className="absolute inset-y-0 left-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
 <button 
 onClick={prevSlide}
 className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all"
 >
 <ChevronLeft size={24} />
 </button>
 </div>
 <div className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
 <button 
 onClick={nextSlide}
 className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all"
 >
 <ChevronRight size={24} />
 </button>
 </div>

 {/* Indicators */}
 <div className="absolute bottom-6 right-8 flex gap-2">
 {banners.map((_, idx) => (
 <button
 key={idx}
 onClick={() => setCurrentIndex(idx)}
 className={`h-1.5 rounded-full transition-all ${
 idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/20 hover:bg-white/40"
 }`}
 style={idx === currentIndex ? { backgroundColor: PRI } : {}}
 />
 ))}
 </div>
 </div>
 </div>
 </section>
 );
};
