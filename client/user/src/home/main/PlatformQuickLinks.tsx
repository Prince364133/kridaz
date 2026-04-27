'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Ticket, Download, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const quickLinks = [
  {
    icon: <Store size={22} className="text-[#A1FF00]" />,
    title: 'LIST YOUR VENUE',
    subtitle: 'AND EARN NOW!',
    href: '/partner/onboarding',
  },
  {
    icon: <Ticket size={22} className="text-[#A1FF00]" />,
    title: 'HOST YOUR GAME',
    subtitle: 'START HOSTING NOW',
    href: '/host-a-game',
  },
  {
    icon: <Download size={22} className="text-[#A1FF00]" />,
    title: 'DOWNLOAD THE APP',
    subtitle: 'ANDROID AND IOS',
    href: '#',
  },
  {
    icon: <CalendarCheck size={22} className="text-[#A1FF00]" />,
    title: 'YOUR BOOKINGS',
    subtitle: 'UPCOMING & PAST',
    href: '/bookings',
  },
];

const PlatformQuickLinks = () => {
  return (
    <section className="w-full bg-black py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-2xl">
          {quickLinks.map((link, idx) => (
            <React.Fragment key={link.title}>
              <Link
                href={link.href}
                className="flex-1 group relative p-8 flex items-center gap-4 transition-all hover:bg-white/[0.03]"
              >
                {/* Circular Icon Container */}
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#A1FF00]/40 transition-colors bg-white/[0.02]">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {link.icon}
                  </motion.div>
                </div>

                {/* Text Content */}
                <div className="flex flex-col">
                  <h4 className="text-[11px] font-black text-white tracking-widest uppercase transition-colors group-hover:text-[#A1FF00]">
                    {link.title}
                  </h4>
                  <p className="text-[9px] font-bold text-white/30 tracking-widest uppercase mt-0.5">
                    {link.subtitle}
                  </p>
                </div>
              </Link>
              {/* Vertical Divider (only between items and only on md+) */}
              {idx < quickLinks.length - 1 && (
                <div className="hidden md:block w-[1px] bg-white/10 h-10 self-center" />
              )}
              {/* Horizontal Divider for mobile */}
              {idx < quickLinks.length - 1 && (
                <div className="block md:hidden h-[1px] w-full bg-white/10 mx-auto max-w-[80%]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformQuickLinks;
