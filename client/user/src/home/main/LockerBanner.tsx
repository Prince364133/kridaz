'use client';
import React from 'react';

const LockerBanner = () => {
  return (
    <div className="w-full bg-black text-white py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-integral font-black uppercase tracking-tighter">
            THE LOCKER ROOM,{" "}
            <span className="text-[#A1FF00]">ONLINE.</span>
          </h1>
          <p className="text-gray-300 mt-4 text-lg md:text-xl max-w-2xl mx-auto">
            Post your highlights, chat with teammates, and stay connected with your
            local sports scene
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          
          {/* Left big card */}
          <div className="relative bg-[#111] border border-[#A1FF00]/40 rounded-3xl p-8 lg:col-span-2 min-h-[480px] flex flex-col justify-center items-center overflow-hidden">
            <div className="absolute -top-8 -left-8 w-24 h-24 bg-black flex items-center justify-center rounded-3xl z-20">
              <span className="text-4xl ml-6 mt-6">⭐</span>
            </div>
            <h2 className="text-center relative z-10 text-4xl md:text-5xl font-integral font-black uppercase tracking-tighter leading-tight text-white mb-6">
              Join the <br />
              Ultimate <br />
              Sports <br />
              Community
            </h2>
          </div>

          {/* Right Section */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              
              {/* Top-right small pill card */}
              <div className="bg-[#A1FF00] rounded-3xl text-black flex items-center justify-center p-6 shadow-[0_0_30px_rgba(161,255,0,0.2)] sm:col-span-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-black mr-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                <span className="font-integral font-bold text-2xl uppercase tracking-tighter">Join the Talk</span>
              </div>

              {/* Bottom-right card (Highlights) */}
              <div className="bg-[#111] border border-white/10 rounded-3xl p-8 relative overflow-hidden min-h-[220px]"> 
                <h3 className="relative z-10 text-2xl font-integral font-bold uppercase tracking-tighter">Highlights</h3>
                <p className="relative z-10 text-xs font-bold uppercase tracking-widest text-white/50 mt-2">
                  Tap into the best plays & moments
                </p>
              </div>

              {/* Bottom-right card (Team Stats) */}
              <div className="bg-[#111] border border-white/10 rounded-3xl p-8 relative min-h-[220px]">
                <h3 className="text-2xl font-integral font-bold uppercase tracking-tighter">Team Stats</h3>
                <div className="flex items-end space-x-3 mt-4">
                  <div className="w-8 bg-[#A1FF00]/40 h-20 rounded-t-md"></div>
                  <div className="w-8 bg-white/20 h-28 rounded-t-md"></div>
                  <div className="w-8 bg-[#A1FF00] h-36 rounded-t-md shadow-[0_0_15px_rgba(161,255,0,0.5)]"></div>
                </div>
                <span className="text-xl text-[#A1FF00] mt-4 block font-black">+344%</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LockerBanner;
