import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Globe, Building2, Users, ShieldCheck } from 'lucide-react';

const PartnersGateway = () => {
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden font-sans">
      {/* Background Image - Soccer balls on the right */}
      <div 
        className="absolute inset-0 z-0 opacity-60 pointer-events-none"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80")',
          backgroundPosition: 'right 20% center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)'
        }}
      />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-40 pb-20 relative z-10">
        {/* Breadcrumb / Tag */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 text-white/90 text-[10px] font-bold uppercase tracking-[0.2em] mb-12"
        >
          <div className="w-5 h-5 rounded-full bg-[#84CC16]/20 flex items-center justify-center">
            <Globe className="w-3 h-3 text-[#84CC16]" />
          </div>
          Join Our Global Network
        </motion.div>

        {/* Hero Section */}
        <div className="max-w-5xl">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[80px] md:text-[110px] font-black text-white leading-[0.85] mb-12 tracking-tight"
          >
            JOIN US AS A <br />
            <span className="text-[#84CC16]">PARTNER.</span>
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-8 mb-20 border-l-2 border-[#84CC16] pl-8"
          >
            <p className="text-xl text-white/40 leading-relaxed max-w-2xl font-medium">
              Connect with TurfSpot to access a unified sports ecosystem. Whether you are a <br />
              Venue Owner, Professional Coach, or Certified Official, we provide the ultimate <br />
              platform to scale your impact.
            </p>
          </motion.div>

          {/* Action Buttons and Stats in One Row */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-8">
            <div className="flex flex-wrap gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  to="/signup/venue"
                  className="flex items-center gap-3 bg-[#84CC16] text-black px-8 py-5 rounded-xl font-black text-sm hover:bg-[#a3e635] transition-all shadow-[0_0_30px_rgba(132,204,22,0.2)]"
                >
                  <Building2 size={18} />
                  Venue Owner
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  to="/signup/coach"
                  className="flex items-center gap-3 bg-[#3B82F6] text-white px-8 py-5 rounded-xl font-black text-sm hover:bg-blue-600 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                >
                  <Users size={18} />
                  Coach
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  to="/signup/official"
                  className="flex items-center gap-3 bg-[#F59E0B] text-black px-8 py-5 rounded-xl font-black text-sm hover:bg-amber-500 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                >
                  <ShieldCheck size={18} />
                  Umpire
                </Link>
              </motion.div>
            </div>

            {/* Separator */}
            <div className="hidden md:block w-px h-12 bg-white/10" />

            {/* Stats */}
            <div className="flex gap-12">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Active Partners</div>
                <div className="text-4xl font-black text-white/90 tracking-tighter">1,200+</div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Growth Rate</div>
                <div className="text-4xl font-black text-[#84CC16] tracking-tighter">85% YoY</div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#84CC16]/5 blur-[150px] rounded-full -mr-96 -mt-96 pointer-events-none" />
    </div>
  );
};

export default PartnersGateway;
