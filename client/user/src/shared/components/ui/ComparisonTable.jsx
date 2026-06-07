import React from 'react';
import { Check, X } from 'lucide-react';

const ComparisonTable = () => {
  const features = [
    { name: "Venue & Ground Booking", others: true, us: true },
    { name: "Live Game Scoring", others: false, us: true },
    { name: "Player Profiles & Stats", others: false, us: true },
    { name: "Social Community & Posts", others: false, us: true },
    { name: "Secure Matchmaking", others: false, us: true },
    { name: "Pro Registration & Hiring", others: false, us: true },
    { name: "Global Sports Networking", others: false, us: true },
    { name: "Secure Payments", others: true, us: true },
  ];

  return (
    <section className="relative w-full max-w-[800px] mx-auto px-6 pt-16 md:pt-24 pb-8 md:pb-12">
      {/* Header */}
      <div className="mb-8 max-w-[800px] mx-auto">
        <h2 className="text-[20px] md:text-4xl font-black tracking-tight leading-[1.05] mb-4 font-poppins font-medium normal-case">
          What <span className="text-[#BFF367]">Makes Us Different.</span>
        </h2>
      </div>

      {/* Table Container */}
      <div className="w-full rounded-2xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-md overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid border-b border-white/10 bg-white/5" style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}>
          <div className="p-4 md:p-6 text-sm md:text-base font-semibold text-white/70">
            Features
          </div>
          <div className="p-4 md:p-6 text-sm md:text-base font-semibold text-white/70 text-center border-l border-white/10">
            Others
          </div>
          <div className="p-4 md:p-6 text-sm md:text-base font-bold text-[#BFF367] text-center border-l border-white/10 bg-[#BFF367]/5">
            Kridaz
          </div>
        </div>

        {/* Table Rows */}
        <div className="flex flex-col">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className={`grid transition-colors hover:bg-white/[0.02] ${
                idx !== features.length - 1 ? 'border-b border-white/10' : ''
              }`}
              style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}
            >
              <div className="p-4 md:p-6 text-xs md:text-sm font-normal text-white flex items-center">
                {feature.name}
              </div>
              <div className="p-4 md:p-6 flex items-center justify-center border-l border-white/10">
                {feature.others ? (
                  <Check className="w-5 h-5 text-white/50" />
                ) : (
                  <X className="w-5 h-5 text-white/20" />
                )}
              </div>
              <div className="p-4 md:p-6 flex items-center justify-center border-l border-white/10 bg-[#BFF367]/5">
                {feature.us ? (
                  <Check className="w-5 h-5 text-[#BFF367]" />
                ) : (
                  <X className="w-5 h-5 text-white/20" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Text */}
      <div className="flex items-center justify-center mt-16 gap-6 w-full max-w-[600px] mx-auto">
        {/* Left fading line */}
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/20" />
        
        <h3 className="text-sm md:text-base font-medium tracking-[0.15em] uppercase text-white/80 font-poppins whitespace-nowrap">
          One app. <span className="text-[#BFF367]">Everything you need</span>
        </h3>
        
        {/* Right fading line */}
        <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/20" />
      </div>
    </section>
  );
};

export default ComparisonTable;
