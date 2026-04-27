'use client';

import React from 'react';
import { Link } from 'react-router-dom';

const cityData = [
  {
    city: 'HYDERABAD',
    links: [
      'Cricket in Hyderabad',
      'Football or Box Cricket in Hyderabad',
      'Badminton in Hyderabad',
      'Cricket Nets in Hyderabad',
      'Swimming in Hyderabad',
      'Pickleball in Hyderabad',
    ],
  },
  {
    city: 'DELHI NCR',
    links: [
      'Cricket in Delhi NCR',
      'Football or Box Cricket in Delhi NCR',
      'Badminton in Delhi NCR',
      'Cricket Nets in Delhi NCR',
      'Pickleball in Delhi NCR',
    ],
  },
  {
    city: 'BENGALURU',
    links: [
      'Cricket in Bengaluru',
      'Football in Bengaluru',
      'Badminton in Bengaluru',
      'Box Cricket in Bengaluru',
      'Tennis in Bengaluru',
    ],
  },
  {
    city: 'MUMBAI',
    links: [
      'Cricket in Mumbai',
      'Football in Mumbai',
      'Badminton in Mumbai',
      'Swimming in Mumbai',
      'Pickleball in Mumbai',
    ],
  },
];

const VenueLinksSection = () => {
  return (
    <section className="w-full bg-black py-16 md:py-20 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-integral text-2xl md:text-4xl text-white uppercase tracking-tighter leading-none mb-12">
          SCORE BIG AT THE{' '}
          <span className="text-[#A1FF00] italic">BEST SPORTS VENUES</span>{' '}
          NEAR YOU
        </h2>

        <div className="space-y-10">
          {cityData.map((item) => (
            <div key={item.city}>
              <h3 className="font-integral text-lg text-white uppercase tracking-tighter mb-3 italic">
                {item.city}
              </h3>
              <div className="h-[1px] w-full bg-white/5 mb-4" />
              <div className="flex flex-wrap items-center gap-0">
                {item.links.map((link, idx) => (
                  <React.Fragment key={link}>
                    <Link
                      href="#"
                      className="text-[11px] text-white/50 hover:text-[#A1FF00] transition-colors font-medium tracking-wide"
                    >
                      {link}
                    </Link>
                    {idx < item.links.length - 1 && (
                      <span className="mx-3 text-white/20 text-xs">|</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VenueLinksSection;
