'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Facebook, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full bg-black text-white">

      {/* WHY BMS APP Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-integral text-3xl md:text-4xl uppercase tracking-tighter leading-none mb-6 italic">
          WHY <span className="text-[#A1FF00]">BMS APP</span>?
        </h2>
        <p className="text-sm text-white/50 font-medium leading-relaxed max-w-xl mb-16">
          Find and book sports facilities in your city instantly! Whether you need a cricket ground, a football turf, or a sports
          academy for your training, Book My Sports App has you covered. Easy booking across all major cities—reserve your spot today!
        </p>

        {/* 4 Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Blogs */}
          <div>
            <h3 className="text-[#A1FF00] text-[10px] font-black tracking-widest uppercase mb-5">BLOGS</h3>
            <ul className="space-y-3">
              {[
                'Prepare for playing in hot weather',
                'Best Football Grounds In Hyderabad',
                'Best Cricket Grounds In Hyderabad',
                'Cricket Ground with Flood Lights in Hyderabad',
              ].map((item) => (
                <li key={item}>
                  <Link to="#" className="text-xs text-white/60 hover:text-[#A1FF00] transition-colors leading-relaxed">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[#A1FF00] text-[10px] font-black tracking-widest uppercase mb-5">QUICK LINKS</h3>
            <ul className="space-y-3">
              {[
                { label: 'List Your Facility', href: '/partner/onboarding' },
                { label: 'Coupons & Offers', href: '#' },
                { label: 'How BMS APP Works', href: '#' },
                { label: "FAQ's", href: '/help' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-xs text-white/60 hover:text-[#A1FF00] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-[#A1FF00] text-[10px] font-black tracking-widest uppercase mb-5">CONTACT US</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-2">
                <MapPin size={13} className="text-[#A1FF00] mt-0.5 flex-shrink-0" />
                <span className="text-xs text-white/60">Hyderabad, Telangana, India</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail size={13} className="text-[#A1FF00] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-white tracking-widest mb-0.5">EMAIL SUPPORT</p>
                  <Link to="mailto:contact@bmsapp.in" className="text-xs text-white/60 hover:text-[#A1FF00] transition-colors">
                    contact@bmsapp.in
                  </Link>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={13} className="text-[#A1FF00] mt-0.5 flex-shrink-0" />
                <Link to="#" className="text-xs text-white/60 hover:text-[#A1FF00] transition-colors">
                  Have a query? Click here
                </Link>
              </li>
            </ul>
          </div>

          {/* Download App */}
          <div>
            <h3 className="text-[#A1FF00] text-[10px] font-black tracking-widest uppercase mb-5">DOWNLOAD APP</h3>
            <div className="space-y-3">
              {/* Google Play */}
              <Link
                href="#"
                className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:border-[#A1FF00]/40 hover:bg-white/10 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                  <path d="M3.18 23.76a2 2 0 0 1-.92-.22 2.14 2.14 0 0 1-1.09-1.9V2.36A2.14 2.14 0 0 1 2.26.46a2 2 0 0 1 2.05.15L17.7 8.62l-3.51 3.38zm15.85-9.63L5.26 22.1l8-13.82zM3.41.56L16.6 8.24l-3.51 3.38z"/>
                </svg>
                <div>
                  <p className="text-[8px] text-white/40 font-medium uppercase tracking-widest">GET IT ON</p>
                  <p className="text-xs font-bold text-white">Google Play</p>
                </div>
              </Link>
              {/* App Store */}
              <Link
                href="#"
                className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:border-[#A1FF00]/40 hover:bg-white/10 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.22 1.3-2.2 3.88.04 3.06 2.69 4.08 2.72 4.09l-.07.2zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <p className="text-[8px] text-white/40 font-medium uppercase tracking-widest">DOWNLOAD ON THE</p>
                  <p className="text-xs font-bold text-white">App Store</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Bottom Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Social Icons */}
        <div className="flex justify-center gap-6 mb-6">
          <Link to="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-[#A1FF00] hover:border-[#A1FF00]/40 transition-all">
            <Facebook size={16} />
          </Link>
          <Link to="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-[#A1FF00] hover:border-[#A1FF00]/40 transition-all">
            <Linkedin size={16} />
          </Link>
          <Link to="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-[#A1FF00] hover:border-[#A1FF00]/40 transition-all">
            <Instagram size={16} />
          </Link>
        </div>

        {/* Legal Links */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-6">
          {[
            { label: 'PRIVACY POLICY', href: '/privacy-policy' },
            { label: 'TERMS & CONDITIONS', href: '/terms-of-service' },
            { label: 'TERMS OF USE', href: '#' },
          ].map((item) => (
            <Link key={item.label} to={item.href}
              className="text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors tracking-widest">
              {item.label}
            </Link>
          ))}
        </div>

        {/* Brand Badge */}
        <div className="flex justify-center mb-6">
          <span className="px-5 py-2 bg-[#A1FF00] text-black text-[10px] font-black tracking-widest rounded-full uppercase">
            BMS APP
          </span>
        </div>

        {/* Copyright */}
        <p className="text-center text-[10px] font-bold text-white/20 tracking-widest uppercase">
          COPYRIGHT 2018 – 2026 SAAVIK SOLUTIONS PVT LTD. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
