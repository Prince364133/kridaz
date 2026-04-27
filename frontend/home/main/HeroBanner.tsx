'use client';
import { ROUTES } from '@/lib/routes';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ArrowRight } from 'lucide-react'; 
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { GradientButton } from '@/components/auth/GradientButton'; 

const HeroBanner = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    // Trim and clean inputs
    const q = searchQuery.trim();
    const loc = locationQuery.trim();

    if (q) params.append('q', q);
    if (loc) params.append('location', loc);
    
    // Navigate with or without params
    const query = params.toString();
    router.push(query ? `/explore?${query}` : '/explore');
  };

  return (
    <section aria-labelledby="hero-heading" className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden">
      {/* SEO: High Performance Background Image with LCP Priority */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-banner-background.png"
          alt="Sports stadium background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          quality={75}
        />
        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-[100vw] px-2 text-center sm:px-6 lg:px-8 overflow-hidden">
        {/* Main Headline */}
        <div className="relative mx-auto flex flex-col items-center w-full">
          <h1 
            id="hero-heading"
            className="w-full font-integral uppercase leading-[0.9] tracking-tight text-white drop-shadow-lg whitespace-nowrap"
          >
            {/* Single line forced on all screens using VW units. 
                Sized smaller (4.2vw) to ensure safe margins. */}
            <span className="text-[4.2vw] min-[400px]:text-[4.2vw] md:text-[4.2vw] lg:text-[4.2vw]">
              Fuel Your Passion For Sports
            </span>
          </h1>

          {/* Subheadline - Straight, Centered, Fluid Size */}
          <p className="font-freehand tracking-wide text-[#A1FF00] 
            text-[5vw] md:text-[3.5vw] lg:text-[2.5vw]
            -mt-[0.5vw] md:-mt-[0.6vw]
            drop-shadow-md opacity-90 relative z-10 transform-none">
            anytime, anywhere
          </p>
        </div>

        {/* Glassmorphism Search Pill */}
        <div className="mt-8 flex justify-center sm:mt-12">
          <form 
            onSubmit={handleSearchSubmit} 
            className="relative flex w-full max-w-4xl flex-col items-center gap-3 rounded-[32px] sm:rounded-full border border-white/20 bg-black/60 p-3 backdrop-blur-md transition-all hover:border-[#A1FF00]/50 hover:bg-black/80 sm:flex-row sm:gap-0 sm:p-2"
            role="search"
          >
            {/* Search Input Section */}
            <div className="relative flex h-12 w-full flex-1 items-center px-4 bg-white/5 sm:bg-transparent rounded-full sm:rounded-none sm:h-14">
              <label htmlFor="search-input" className="sr-only">Search sports or venues</label>
              <Search className="mr-3 h-5 w-5 text-[#A1FF00] sm:h-6 sm:w-6 shrink-0" aria-hidden="true" focusable="false" />
              <Input
                id="search-input"
                type="text"
                placeholder="Search sports..."
                className="h-full w-full border-none bg-transparent p-0 text-base text-white placeholder:text-white/60 focus-visible:ring-0 sm:text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Vertical Divider (Desktop) */}
            <div className="hidden h-8 w-[1px] bg-white/20 sm:block" />

            {/* Location Input Section */}
            <div className="relative flex h-12 w-full flex-1 items-center px-4 bg-white/5 sm:bg-transparent rounded-full sm:rounded-none sm:h-14">
              <label htmlFor="location-input" className="sr-only">Location</label>
              <MapPin className="mr-3 h-5 w-5 text-[#A1FF00] sm:h-6 sm:w-6 shrink-0" aria-hidden="true" focusable="false" />
              <Input
                id="location-input"
                type="text"
                placeholder="Location (e.g. NYC)"
                className="h-full w-full border-none bg-transparent p-0 text-base text-white placeholder:text-white/60 focus-visible:ring-0 sm:text-lg"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="h-12 w-full rounded-full bg-[#A1FF00] text-black hover:bg-[#A1FF00]/90 hover:scale-105 active:scale-95 transition-all mt-2 sm:mt-0 sm:h-14 sm:w-14 shrink-0 flex items-center justify-center"
              aria-label="Search grounds and locations"
            >
              <ArrowRight className="h-6 w-6" aria-hidden="true" focusable="false" />
            </Button>
          </form>
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:mt-12 sm:flex-row sm:gap-6">
          <div className="w-full sm:w-auto">
            <GradientButton 
              onClick={() => router.push(ROUTES.PUBLIC.VENUES)}
              className="h-12 w-full sm:h-14 min-w-[200px] text-lg sm:text-xl font-bayon uppercase tracking-wide"
            >
              Book A Ground
            </GradientButton>
          </div>
          
          <div className="w-full sm:w-auto">
            <GradientButton 
              variant="outline"
              onClick={() => router.push(ROUTES.PUBLIC.FIND_PLAYERS)}
              className="h-12 w-full sm:h-14 min-w-[200px] border-2 border-white/20 bg-transparent text-lg sm:text-xl font-bayon uppercase tracking-wide text-white hover:border-[#A1FF00] hover:bg-[#A1FF00]/10 hover:text-[#A1FF00]"
            >
              Join A Match
            </GradientButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;