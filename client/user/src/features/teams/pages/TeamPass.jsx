import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy, MapPin, Calendar, Shield, ChevronLeft,
  Share2, Download, Printer, QrCode, Loader2, Sparkles,
  Ticket, Flame, Target, Star, Crown, Users, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import useAxiosInstance from '@hooks/useAxiosInstance';

const PRI = "#55DEE8";
const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = { fontFamily: "'Inter', sans-serif" };

const TeamPass = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const passRef = useRef(null);
  const axios = useAxiosInstance();

  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await axios.get(`/team/${id}`);
        setTeam(res.data.team);
      } catch (err) {
        toast.error('Failed to load team data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeam();
  }, [id]);

  const handleDownload = async () => {
    if (!passRef.current) return;
    setIsDownloading(true);
    toast.loading('Forging your Digital Pass...', { id: 'download' });

    try {
      // Small timeout to ensure fonts and assets are fully painted
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(passRef.current, {
        scale: 3, // Premium quality scaling
        useCORS: true,
        backgroundColor: '#000000',
        logging: false
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${team?.name || 'Kridaz'}-Team-Pass.png`;
      link.href = image;
      link.click();
      toast.success('Pass Saved to Gallery!', { id: 'download' });
    } catch (err) {
      toast.error('Failed to generate pass', { id: 'download' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#55DEE8] animate-spin" />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Generating Ticket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-4 pb-12 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#55DEE8]/5 blur-[120px] rounded-full" />
      </div>

      {/* Floating Action Header */}
      <div className="w-full max-w-[420px] z-10 mb-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Official Digital Ticket</span>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Pass Wrapper (Fixed dimensions for exact pass proportions) */}
      <div className="relative z-10 w-full max-w-[420px]" ref={passRef}>
        <div className="relative bg-gradient-to-b from-[#121212] to-[#080808] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl p-6 flex flex-col justify-between aspect-[3/5] min-h-[580px]">
          
          {/* Header Strip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-black border border-white/10 p-1 flex items-center justify-center">
                <Trophy size={14} className="text-[#55DEE8]" />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Kridaz</h4>
                <p className="text-[6px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Champions League</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <span className="w-1.5 h-1.5 bg-[#55DEE8] rounded-full animate-pulse" />
              <span className="text-[7px] font-black text-[#55DEE8] uppercase tracking-wider">Active</span>
            </div>
          </div>

          {/* Stadium Silhouette Panel */}
          <div className="relative h-44 rounded-2xl overflow-hidden border border-white/5 my-4">
            <img 
              src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2105&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-20 grayscale" 
              alt="Stadium" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
            
            {/* Logo Centerpiece */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-18 h-18 rounded-[20px] bg-black border-2 border-[#55DEE8] p-1 flex items-center justify-center shadow-[0_0_20px_rgba(85, 222, 232,0.15)]">
                {team?.logo ? (
                  <img src={team.logo} className="w-full h-full object-cover rounded-[14px]" alt="Logo" />
                ) : (
                  <Trophy size={28} className="text-[#55DEE8]/20" />
                )}
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black uppercase tracking-tight text-white" style={HEADING_STYLE}>
                  {team?.name || 'SQUAD NAME'}
                </h2>
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-0.5">
                  {team?.sportType || 'Cricket'} Division
                </p>
              </div>
            </div>
          </div>

          {/* Ticket Stats */}
          <div className="grid grid-cols-3 gap-2 py-2">
            {[
              { label: 'Captain', value: team?.owner?.name || 'Leader', icon: Crown },
              { label: 'City', value: team?.city || 'HQ', icon: MapPin },
              { label: 'Members', value: `${team?.members?.length || 1} Players`, icon: Users }
            ].map((stat, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                  <stat.icon size={8} />
                  <span className="text-[6px] font-black uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className="text-[9px] font-black text-white uppercase truncate">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Dotted Tear Line */}
          <div className="relative my-4">
            <div className="absolute left-[-30px] top-1/2 -translate-y-1/2 w-4 h-8 bg-black rounded-r-full border-r border-y border-white/10" />
            <div className="border-t-2 border-dashed border-white/10 w-full" />
            <div className="absolute right-[-30px] top-1/2 -translate-y-1/2 w-4 h-8 bg-black rounded-l-full border-l border-y border-white/10" />
          </div>

          {/* Ticket QR and Verification Barcode */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-[6px] font-black text-gray-500 uppercase tracking-widest">Entry ID</p>
                <p className="text-[10px] font-black text-[#55DEE8] uppercase mt-0.5">{team?.teamCode || 'KR-0000'}</p>
              </div>
              <div className="bg-[#55DEE8]/10 px-3 py-1.5 rounded-lg border border-[#55DEE8]/20 inline-flex items-center gap-1.5">
                <Sparkles size={8} className="text-[#55DEE8]" />
                <span className="text-[7px] font-black text-white uppercase tracking-wider">Digital Verification</span>
              </div>
            </div>
            
            <div className="w-20 h-20 bg-white rounded-2xl p-1.5 flex items-center justify-center shadow-lg relative group">
              <QrCode size={68} className="text-black" />
              <div className="absolute inset-0 bg-black/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Info size={16} className="text-black" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Control Buttons */}
      <div className="w-full max-w-[420px] mt-6 grid grid-cols-2 gap-3 z-10">
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="py-3.5 bg-[#55DEE8] text-black rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:brightness-110 shadow-[0_5px_20px_rgba(85, 222, 232,0.25)] transition-all"
        >
          {isDownloading ? <Loader2 className="animate-spin w-4 h-4" /> : <Download size={14} />}
          Save Pass
        </button>
        <button 
          onClick={handlePrint}
          className="py-3.5 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
        >
          <Printer size={14} />
          Print Pass
        </button>
      </div>

    </div>
  );
};

export default TeamPass;
