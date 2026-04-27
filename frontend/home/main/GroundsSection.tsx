'use client';
import { ROUTES } from '@/lib/routes';

import React, { useState } from 'react';
import { Search, MapPin, Store, Star, LandPlot, ArrowRight } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GradientButton } from '@/components/auth/GradientButton';

// Mock Data (Unchanged Structure)
const groundsData = [
  {
    id: 1,
    name: "Melbourne Hub Cricket Ground",
    location: "Paramount colony, Hyderabad",
    distance: "2.4",
    rating: 5,
    reviews: 8189,
    image: "/images/GroundedSection/melbourne-hub-cricket-ground.png",
    isFeatured: true,
  },
  {
    id: 2,
    name: "Sydney Sports Arena",
    location: "Gachibowli, Hyderabad",
    distance: "5.8",
    rating: 4,
    reviews: 5230,
    image: "/images/GroundedSection/sydney-sports-arena.png",
    isFeatured: false,
  },
  {
    id: 3,
    name: "Perth Pitch",
    location: "Jubilee Hills, Hyderabad",
    distance: "8.1",
    rating: 5,
    reviews: 9870,
    image: "/images/GroundedSection/perth-pitch.png",
    isFeatured: false,
  },
  {
    id: 4,
    name: "Adelaide Oval Replica",
    location: "Banjara Hills, Hyderabad",
    distance: "12.5",
    rating: 4,
    reviews: 4500,
    image: "/images/GroundedSection/adelaide-oval-replica.png",
    isFeatured: false,
  },
];

const categories = [
    {
      id: 1,
    title: "SPORTZ ESSENTIALS",
    image: "/images/GroundedSection/market-category-essentials.png",
    bg: "bg-gradient-to-br from-[#A1FF00]/20 to-black border-white/10", 
  },
  {
    id: 2,
    title: "FOOTWEARS",
    image: "/images/GroundedSection/market-category-footwear.png",
    bg: "bg-gradient-to-br from-white/10 to-black border-white/10",
  },
  {
    id: 3,
    title: "SPORTZ WEARS",
    image: "/images/GroundedSection/market-category-sportswear.png",
    bg: "bg-gradient-to-br from-[#A1FF00]/10 to-black border-white/10",
  },
];

// Ground Card Component (Glassmorphism + Neon)
const GroundCard = ({ ground }: { ground: typeof groundsData[0] }) => (
  <Link href={`/venues/${ground.id}`} className="block group h-full">
    <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-500 hover:border-[#A1FF00]/50 hover:shadow-[0_0_30px_rgba(161,255,0,0.1)] hover:-translate-y-1">
      
      {/* Featured Tag */}
      {ground.isFeatured && (
        <div className="absolute top-4 left-4 z-20 rounded-full bg-[#A1FF00] px-3 py-1 text-xs font-bold text-black shadow-lg shadow-[#A1FF00]/20">
          FEATURED
        </div>
      )}

      {/* Distance Badge (New) */}
      <div className="absolute top-4 right-4 z-20 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white border border-white/10 backdrop-blur-md flex items-center gap-1">
        <MapPin className="w-3 h-3 text-[#A1FF00]" />
        {ground.distance} km
      </div>

      {/* Image Container with Overlay */}
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={ground.image}
          alt={ground.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Ground Name: Significantly smaller and allows wrapping to show full name */}
        <h3 className="mb-1 text-sm md:text-base font-bold text-white font-integral tracking-wide leading-tight group-hover:text-[#A1FF00] transition-colors line-clamp-2 min-h-[2.5em]">
            {ground.name}
        </h3>
        
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
          <MapPin className="h-3 w-3 text-[#A1FF00]" />
          <span className="truncate">{ground.location}</span>
        </div>

        <div className="mb-3 flex items-center justify-between border-t border-white/10 pt-2">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-[#A1FF00] text-[#A1FF00]" />
            <span className="font-bold text-sm text-white">{ground.rating}.0</span>
            <span className="text-[10px] text-gray-500">({ground.reviews.toLocaleString()})</span>
          </div>
          <div className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-300">
            Cricket
          </div>
        </div>

        <div className="mt-auto">
            <Button className="w-full bg-[#A1FF00] text-black font-bold h-9 text-sm hover:bg-white hover:text-black transition-all">
                Book Now
            </Button>
        </div>
      </div>
    </div>
  </Link>
);

const GroundsSection = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('grounds');
    const [groundSearchQuery, setGroundSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('Hyderabad');
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [marketplaceSearchQuery, setMarketplaceSearchQuery] = useState('');

    // Predefined popular cities for manual selection
    const popularCities = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune'];

    // Auto-detect location on mount
    React.useEffect(() => {
        // Simple check to see if we already have a permission state or if it's the first visit
        // For this demo, we'll try to get it once on load
        if (navigator.geolocation) {
            detectLocation(); 
        }
    }, []);

    const detectLocation = () => {
        setIsLoadingLocation(true);
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            setIsLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    // Using OpenStreetMap Nominatim for free reverse geocoding
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    
                    // Extract city/town/village
                    const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Detected Location';
                    setLocationFilter(city);
                } catch (error) {
                    console.error('Error fetching location name:', error);
                    // Fallback if API fails
                    setLocationFilter('Current Location'); 
                } finally {
                    setIsLoadingLocation(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setIsLoadingLocation(false);
                // Don't annoy user with alerts if they denied it, just stick to default
            }
        );
    };

    const handleGroundSearch = (e: React.FormEvent) => {
      e.preventDefault();
      // Placeholder logic
    };

    const handleMarketplaceSearch = (e: React.FormEvent) => {
      e.preventDefault();
      // Placeholder logic
    };

    return (
      <section className="relative w-full bg-black py-20 overflow-hidden" onClick={() => setIsLocationOpen(false)}>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="text-center mb-16">
                <h2 className="font-integral text-4xl md:text-6xl text-white uppercase tracking-tight mb-2 drop-shadow-2xl">
                    Find Your <span className="text-[#A1FF00]">Arena</span>
                </h2>
                <p className="font-freehand text-[#A1FF00] text-3xl md:text-4xl transform -rotate-2 opacity-90">
                    where champions play
                </p>
            </div>

            {/* Navigation Tabs (Neon Pills) */}
            <div className="flex justify-center mb-12">
                <div className="inline-flex rounded-full bg-white/5 p-1 border border-white/10 backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab('grounds')}
                        className={`px-8 py-3 rounded-full text-sm md:text-base font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                            activeTab === 'grounds' 
                            ? 'bg-[#A1FF00] text-black shadow-[0_0_20px_rgba(161,255,0,0.4)]' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <LandPlot className="w-5 h-5" />
                        Venues
                    </button>
                    <button
                        onClick={() => setActiveTab('marketplace')}
                        className={`px-8 py-3 rounded-full text-sm md:text-base font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                            activeTab === 'marketplace' 
                            ? 'bg-[#A1FF00] text-black shadow-[0_0_20px_rgba(161,255,0,0.4)]' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Store className="w-5 h-5" />
                        Marketplace
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[600px] transition-all duration-500">
                {activeTab === 'grounds' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Filters & Search - Compact Height */}
                        <form onSubmit={handleGroundSearch} className="mb-12 flex flex-col md:flex-row gap-3 max-w-5xl mx-auto relative z-20">
                           <div className="flex-1 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#A1FF00] transition-colors" />
                                <Input 
                                    placeholder="Search venues (cricket, swimming, etc)..." 
                                    className="w-full bg-white/5 border-white/10 text-white pl-10 h-10 md:h-12 rounded-xl focus:border-[#A1FF00]/50 placeholder:text-gray-600 text-sm md:text-base transition-all"
                                    value={groundSearchQuery}
                                    onChange={(e) => setGroundSearchQuery(e.target.value)}
                                />
                           </div>
                           <div className="flex gap-3 relative">
                               {/* Location Selector */}
                               <div className="relative" onClick={(e) => e.stopPropagation()}>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setIsLocationOpen(!isLocationOpen)}
                                        className="bg-white/5 border-white/10 text-white h-10 md:h-12 px-5 rounded-xl hover:bg-white/10 hover:text-[#A1FF00] hover:border-[#A1FF00]/30 min-w-[140px] justify-between group text-sm md:text-base"
                                    >
                                            <span className="flex items-center gap-2">
                                                <MapPin className={`w-4 h-4 ${isLoadingLocation ? 'animate-bounce text-[#A1FF00]' : 'text-[#A1FF00]'}`} /> 
                                                {isLoadingLocation ? 'Locating...' : locationFilter}
                                            </span>
                                    </Button>

                                    {/* Location Dropdown */}
                                    {isLocationOpen && (
                                        <div className="absolute top-full mt-2 left-0 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => { detectLocation(); setIsLocationOpen(false); }}
                                                    className="w-full text-left px-3 py-2 text-sm text-[#A1FF00] hover:bg-white/5 rounded-lg flex items-center gap-2 font-bold"
                                                >
                                                    <MapPin className="w-3 h-3" /> Detect Location
                                                </button>
                                                <div className="h-px bg-white/10 my-1" />
                                                {popularCities.map((city) => (
                                                    <button
                                                        key={city}
                                                        type="button"
                                                        onClick={() => { setLocationFilter(city); setIsLocationOpen(false); }}
                                                        className={`w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors ${locationFilter === city ? 'bg-white/5 text-white' : ''}`}
                                                    >
                                                        {city}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                               </div>

                               <Button type="submit" className="bg-[#A1FF00] text-black font-bold h-10 md:h-12 px-6 rounded-xl hover:bg-[#b2ff33] hover:scale-105 active:scale-95 transition-all text-sm md:text-base">
                                   Search
                               </Button>
                           </div>
                        </form>

                        {/* Grounds Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {groundsData.map((ground) => (
                                <GroundCard key={ground.id} ground={ground} />
                            ))}
                        </div>

                        {/* See More Button */}
                        <div className="flex justify-center">
                            <GradientButton onClick={() => router.push(ROUTES.PUBLIC.VENUES)} variant="outline" className="min-w-[200px] border-white/20 text-white hover:border-[#A1FF00] hover:text-[#A1FF00]">
                                View All Venues
                            </GradientButton>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
                        {/* Marketplace Search */}
                         <form onSubmit={handleMarketplaceSearch} className="relative max-w-2xl mx-auto mb-16">
                            <Input
                                type="text"
                                placeholder="Search marketplace..."
                                className="w-full pl-6 pr-14 py-4 h-16 bg-white/5 border border-white/10 text-white rounded-full text-lg focus:ring-0 focus:border-[#A1FF00] placeholder:text-gray-600 transition-all shadow-lg shadow-black/50"
                                value={marketplaceSearchQuery}
                                onChange={(e) => setMarketplaceSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="absolute right-2 top-2 h-12 w-12 bg-[#A1FF00] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-black" aria-label="Search Marketplace">
                                <Search className="w-5 h-5" />
                            </button>
                        </form>

                        {/* Categories Grid */}
                        <div className="grid gap-6 md:grid-cols-3">
                             {categories.map((cat) => (
                                <Link href="/marketplace" key={cat.id} className="group relative overflow-hidden rounded-3xl border border-white/10 transition-all hover:border-[#A1FF00]/50 hover:shadow-[0_0_30px_rgba(161,255,0,0.15)]">
                                    <div className={`absolute inset-0 opacity-40 transition-opacity group-hover:opacity-60 ${cat.bg}`} />
                                    <div className="absolute inset-0 bg-black/20" /> {/* Darken overlay */}
                                    
                                    <div className="relative flex h-64 flex-col items-center justify-between p-8 text-center">
                                        <h3 className="font-integral text-2xl uppercase text-white drop-shadow-lg tracking-wide group-hover:scale-105 transition-transform">{cat.title}</h3>
                                        <div className="relative h-32 w-32 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 drop-shadow-2xl">
                                             <Image src={cat.image} alt={cat.title} fill className="object-contain" />
                                        </div>
                                        <div className="opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                            <span className="text-[#A1FF00] text-sm font-bold uppercase tracking-wider flex items-center gap-1">
                                                Shop Now <ArrowRight className="w-4 h-4" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                             ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </section>
    );
};

export default GroundsSection;