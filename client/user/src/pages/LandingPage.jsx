import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { 
  ArrowRight, MapPin, Users, Trophy, PlayCircle, 
  Search, Shield, Calendar, MessagesSquare, Briefcase, 
  Network, Menu, X, Gamepad2, Home, UserPlus, Compass
} from 'lucide-react';
import { ChevronRight, Play, Star, ShieldCheck, Activity, Zap, CheckCircle2, ChevronLeft } from 'lucide-react';
import DesktopRightSidebar from '@components/layout/DesktopRightSidebar';
import Masonry from '@components/ui/Masonry';
import MobileMasonrySlider from '@components/ui/MobileMasonrySlider';
import FUITestimonialWithSlide from '@components/ui/sliding-testimonial';
import { SignUp, Login } from '@features/auth';
import { useAuthModal } from '../context/AuthModalContext';
import { StaggeredMenu } from '../shared/components/ui/StaggeredMenu';
import Dock from '../shared/components/ui/Dock';
import BentoGrid01 from '../shared/components/ui/bento-grid-01';
import ComparisonTable from '../shared/components/ui/ComparisonTable';

const FadeInUp = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const GlassCard = ({ children, className = "", hover = true }) => (
  <div className={`
    bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl 
    shadow-[0_0_60px_rgba(191,243,103,0.03)] overflow-hidden relative
    ${hover ? 'transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(191,243,103,0.08)] hover:border-white/20' : ''}
    ${className}
  `}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);

// --- Sections ---

export default function LandingPage() {
  const containerRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { initialView } = useAuthModal();
  const navigate = useNavigate();

  // Menu items based on user request
  const menuLinks = [
    { 
      key: "login-section",
      label: (
        <div className="flex flex-col w-full gap-3 mt-4 mb-2">
           <div className="flex items-center gap-4 w-full bg-white/5 border border-white/10 p-4 rounded-xl">
             <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 shadow-inner">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
             </div>
             <div className="flex flex-col text-left">
                <span className="text-white font-bold text-lg capitalize font-sans tracking-tight mb-0.5">Guest User</span>
                <span className="text-white/50 text-xs normal-case tracking-normal">Login or sign up to continue.</span>
             </div>
           </div>
           <div className="w-full bg-[#FF5A00] hover:bg-[#e04f00] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-center transition-colors shadow-lg shadow-[#FF5A00]/20">
              LOGIN
           </div>
        </div>
      ), 
      href: "/login", 
      wrapperClassName: "md:hidden w-full", 
      itemClassName: "!block !w-full !pr-0",
      className: "!block !w-full !p-0" 
    },
    // Group 1
    { 
      label: "List your venue", 
      href: "/business/venue", 
      className: "text-[#BFF367] !text-sm md:!text-base", 
      wrapperClassName: "bg-[#0A0A0A] border border-white/10 rounded-t-xl mt-6", 
      itemClassName: "!block !w-full !px-5 !py-4" 
    },
    { 
      label: "Score Your Match", 
      href: "/scoring", 
      className: "!text-sm md:!text-base", 
      wrapperClassName: "bg-[#0A0A0A] border-x border-b border-white/10 rounded-b-xl border-t border-t-white/5", 
      itemClassName: "!block !w-full !px-5 !py-4" 
    },

    // Group 2
    { 
      label: "Help and FAQs", 
      href: "/faq", 
      className: "!text-sm md:!text-base", 
      wrapperClassName: "bg-[#0A0A0A] border border-white/10 rounded-t-xl mt-5", 
      itemClassName: "!block !w-full !px-5 !py-4" 
    },
    { 
      label: "Raise a Request", 
      href: "/support", 
      className: "!text-sm md:!text-base", 
      wrapperClassName: "bg-[#0A0A0A] border-x border-white/10 border-t border-t-white/5", 
      itemClassName: "!block !w-full !px-5 !py-4" 
    },
    { 
      label: "Leaderboard", 
      href: "/leaderboard", 
      className: "!text-sm md:!text-base", 
      wrapperClassName: "bg-[#0A0A0A] border-x border-b border-white/10 rounded-b-xl border-t border-t-white/5", 
      itemClassName: "!block !w-full !px-5 !py-4" 
    },

    // Group 3
    { 
      label: "Terms and Conditions", 
      href: "/terms-of-service", 
      className: "!text-sm md:!text-base", 
      wrapperClassName: "bg-[#0A0A0A] border border-white/10 rounded-t-xl mt-5", 
      itemClassName: "!block !w-full !px-5 !py-4" 
    },
    { 
      label: "Privacy Policy", 
      href: "/privacy-policy", 
      className: "!text-sm md:!text-base", 
      wrapperClassName: "bg-[#0A0A0A] border-x border-b border-white/10 rounded-b-xl border-t border-t-white/5 mb-4", 
      itemClassName: "!block !w-full !px-5 !py-4" 
    }
  ];

  return (
    <div className="min-h-screen md:h-screen w-full bg-[#050505] text-white font-sans selection:bg-[#BFF367] selection:text-black flex flex-col md:flex-row md:overflow-hidden">
      
      {/* Global Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(191,243,103,0.1),rgba(255,255,255,0))] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] bg-[#BFF367]/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* --- MAIN PANEL: Scrollable Content --- */}
      <div 
        ref={containerRef}
        className="flex-1 flex flex-col w-full relative overflow-y-visible md:overflow-y-auto overflow-x-clip min-h-screen md:h-screen scroll-smooth landing-scrollbar"
      >
        
        {/* Navbar via StaggeredMenu */}
        <StaggeredMenu
          position="right"
          isFixed={false}
          items={menuLinks}
          logoUrl="/logo.png"
          colors={['#1a1a1a', '#BFF367']}
          accentColor="#BFF367"
          displayItemNumbering={false}
          displaySocials={false}
          headerExtra={
            <button className="hidden sm:flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-normal tracking-wide">
              List your sports venue
            </button>
          }
        />

        {/* 1. HERO SECTION */}
        <section className="relative w-full min-h-[100vh] flex flex-col justify-center pt-12 pb-16 md:pt-24 md:pb-24 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img src="/hero-desktop-new.png" alt="Hero Background Desktop" className="hidden md:block w-full h-full object-cover object-center opacity-100" />
            <img src="/hero-mobile-new.png" alt="Hero Background Mobile" className="block md:hidden w-full h-full object-cover object-center opacity-100" />
          </div>

          <div className="relative z-10 w-full mx-auto px-6 flex flex-col items-center text-center">
          
          <FadeInUp delay={0.2} className="w-full mt-[80px] md:mt-12 flex justify-center px-4">
            <Link 
              to="/login"
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-black uppercase tracking-widest bg-[#BFF367] rounded-full overflow-hidden shadow-[0_0_40px_rgba(191,243,103,0.4)] hover:shadow-[0_0_60px_rgba(191,243,103,0.6)] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
            </Link>
          </FadeInUp>
          </div>
        </section>

        {/* 2. INTERACTIVE FEATURE SHOWCASE (Sticky Scroll) */}
        <section className="relative w-full">
          <div className="relative w-full">
            
            {/* Feature 1: Venues */}
            <div className="sticky top-0 w-full min-h-[100vh] flex items-center bg-[url('/mobile-venues-bg.webp')] md:bg-[url('/desktop-venues-bg.webp')] bg-cover bg-center p-6 md:p-12 border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] rounded-t-[35px]">
              {/* Content replaced by background image */}
            </div>

            {/* Feature 2: Build Your Team */}
            <div className="sticky top-0 w-full min-h-[100vh] flex items-center bg-[url('/mobile-team-bg.png')] md:bg-[url('/desktop-team-bg.png')] bg-cover bg-center p-6 md:p-12 border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] rounded-t-[35px]">
              {/* Content replaced by background image */}
            </div>

            {/* Feature 3: Live Scoring */}
            <div className="sticky top-0 w-full min-h-[100vh] flex items-center bg-[url('/mobile-scoring-bg.png')] md:bg-[url('/desktop-scoring-bg.png')] bg-cover bg-center p-6 md:p-12 border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] rounded-t-[35px]">
              {/* Content replaced by background image */}
            </div>

          </div>
        </section>



        {/* 4. FEATURE GRID (BENTO) */}
        <section className="relative w-full max-w-[800px] mx-auto px-6 pt-16 md:pt-24 pb-8 md:pb-12">
          <div className="mb-8">
            <h2 className="text-[20px] md:text-4xl font-black tracking-tight leading-[1.05] font-poppins font-medium normal-case">
              <span className="text-[#BFF367]">Social</span> & Community.
            </h2>
          </div>

          <BentoGrid01 />
        </section>

        <ComparisonTable />

        {/* 5. GALLERY SECTION */}
        <section className="relative w-full py-8 md:py-12">
          <div className="max-w-[800px] mx-auto px-6 mb-8">
            <h2 className="text-[20px] md:text-4xl font-black tracking-tight leading-[1.05] font-poppins font-medium normal-case">
              The <span className="text-[#BFF367]">Ecosystem</span> in Action
            </h2>
          </div>

          <div className="w-full relative py-2">
            {/* Desktop Masonry */}
            <div className="hidden md:block max-w-[1200px] mx-auto px-4">
              <Masonry
                items={[
                  { id: "1", img: "/host-venue-bg-custom.png", height: 400 },
                  { id: "2", img: "https://picsum.photos/id/1015/600/900", height: 250 },
                  { id: "3", img: "/tournament-bg.png", height: 600 },
                  { id: "4", img: "https://picsum.photos/id/1011/600/750", height: 350 },
                  { id: "5", img: "/scoring_bg.png", height: 500 },
                  { id: "6", img: "https://picsum.photos/id/1020/600/800", height: 400 },
                  { id: "7", img: "/interests_bg.png", height: 300 },
                  { id: "8", img: "https://picsum.photos/id/1021/600/600", height: 450 },
                  { id: "9", img: "/auth-bg.png", height: 550 },
                  { id: "10", img: "https://picsum.photos/id/1022/600/700", height: 380 },
                  { id: "11", img: "https://picsum.photos/id/1023/600/800", height: 320 },
                  { id: "12", img: "https://picsum.photos/id/1024/600/600", height: 500 },
                ]}
                ease="power3.out"
                duration={0.6}
                stagger={0.05}
                animateFrom="bottom"
                scaleOnHover={true}
                hoverScale={0.95}
                blurToFocus={true}
                colorShiftOnHover={false}
              />
            </div>

            {/* Mobile Masonry Slider */}
            <div className="block md:hidden">
              <MobileMasonrySlider 
                items={[
                  { id: "1", img: "/host-venue-bg-custom.png" },
                  { id: "2", img: "https://picsum.photos/id/1015/600/900" },
                  { id: "3", img: "/tournament-bg.png" },
                  { id: "4", img: "https://picsum.photos/id/1011/600/750" },
                  { id: "5", img: "/scoring_bg.png" },
                  { id: "6", img: "https://picsum.photos/id/1020/600/800" },
                  { id: "7", img: "/interests_bg.png" },
                  { id: "8", img: "https://picsum.photos/id/1021/600/600" },
                  { id: "9", img: "/auth-bg.png" },
                  { id: "10", img: "https://picsum.photos/id/1022/600/700" },
                  { id: "11", img: "https://picsum.photos/id/1023/600/800" },
                  { id: "12", img: "https://picsum.photos/id/1024/600/600" },
                ]}
              />
            </div>
          </div>
        </section>

        {/* 6. TESTIMONIALS SECTION */}
        <FUITestimonialWithSlide />

        {/* --- FOOTER (At the bottom of the left panel) --- */}
        <footer className="w-full bg-[#0A0A0A] border-t border-white/5 pt-16 md:pt-24 pb-24 md:pb-12 px-6 md:px-12 mt-auto">
          <div className="max-w-[800px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <img src="/logo.png" alt="Kridaz" className="h-8 w-auto shrink-0" onError={(e) => e.target.style.display='none'} />
                </div>
                <p className="text-white/40 text-sm max-w-xs">The ultimate sports ecosystem. Find venues, build teams, and play.</p>
              </div>
              <div className="grid grid-cols-2 gap-8 md:gap-16">
                <div className="flex flex-col gap-4">
                  <h4 className="text-white font-black uppercase tracking-widest text-[10px]">Platform</h4>
                  <Link to="/venues" className="text-white/50 hover:text-[#BFF367] text-sm transition-colors">Venues</Link>
                  <Link to="/players" className="text-white/50 hover:text-[#BFF367] text-sm transition-colors">Players</Link>
                  <Link to="/leaderboard" className="text-white/50 hover:text-[#BFF367] text-sm transition-colors">Scoring</Link>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-white font-black uppercase tracking-widest text-[10px]">Company</h4>
                  <Link to="/about" className="text-white/50 hover:text-[#BFF367] text-sm transition-colors">About</Link>
                  <Link to="/contact" className="text-white/50 hover:text-[#BFF367] text-sm transition-colors">Contact</Link>
                  <Link to="/terms" className="text-white/50 hover:text-[#BFF367] text-sm transition-colors">Terms</Link>
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-white/30 text-xs">© 2026 Kridaz. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#BFF367]/20 text-white/50 hover:text-[#BFF367] transition-all">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* --- MOBILE BOTTOM NAVBAR: Dock --- */}
      <div className="md:hidden block">
        <Dock
          items={[
            { label: "Home", icon: <Home size={18} />, onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
            { label: "Venues", icon: <MapPin size={18} />, onClick: () => navigate("/venues") },
            { label: "Scoring", icon: <Gamepad2 size={18} />, onClick: () => navigate("/leaderboard") },
            { label: "Players", icon: <Users size={18} />, onClick: () => navigate("/players") },
            { label: "Register", icon: <UserPlus size={18} />, onClick: () => navigate("/signup") }
          ]}
          panelHeight={64}
          baseItemSize={44}
          magnification={60}
        />
      </div>

    </div>
  );
}
