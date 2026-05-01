import React from 'react';
import { Link } from 'react-router-dom';

const VenuesNearYou = () => {
  const regions = [
    {
      name: "HYDERABAD",
      links: [
        "Cricket in Hyderabad",
        "Football or Box Cricket in Hyderabad",
        "Badminton in Hyderabad",
        "Cricket Nets in Hyderabad",
        "Swimming in Hyderabad",
        "Pickleball in Hyderabad"
      ]
    },
    {
      name: "DELHI NCR",
      links: [
        "Cricket in Delhi NCR",
        "Football or Box Cricket in Delhi NCR",
        "Badminton in Delhi NCR",
        "Cricket Nets in Delhi NCR",
        "Pickleball in Delhi NCR"
      ]
    },
    {
      name: "BENGALURU",
      links: [
        "Cricket in Bengaluru",
        "Football in Bengaluru",
        "Badminton in Bengaluru",
        "Box Cricket in Bengaluru",
        "Tennis in Bengaluru"
      ]
    },
    {
      name: "MUMBAI",
      links: [
        "Cricket in Mumbai",
        "Football in Mumbai",
        "Badminton in Mumbai",
        "Swimming in Mumbai",
        "Pickleball in Mumbai"
      ]
    }
  ];

  return (
    <div className="bg-black text-white pt-24 pb-12 border-t border-white/5 relative overflow-hidden">
      {/* Subtle Grid Pattern or Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#84CC16]/20 to-transparent" />
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tighter mb-20 leading-[0.9] max-w-4xl">
          Score Big at the <span className="text-[#84CC16]">Best Sports Venues</span> Near You
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
          {regions.map((region) => (
            <div key={region.name} className="space-y-6">
              <h3 className="text-xl font-black tracking-wider text-white uppercase border-b border-white/10 pb-2 inline-block">
                {region.name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                {region.links.map((link, idx) => (
                  <React.Fragment key={link}>
                    <Link 
                      to="/turfs" 
                      className="text-[11px] font-bold text-white/40 hover:text-white transition-all uppercase tracking-wider hover:translate-x-1"
                    >
                      {link}
                    </Link>
                    {idx < region.links.length - 1 && (
                      <span className="w-1 h-1 bg-[#84CC16]/20 rounded-full" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VenuesNearYou;
