import React from "react";
import { X, LogIn, UserPlus, ShieldCheck, Zap, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LoginModal = ({ isOpen, onClose, title = "Login Required", message = "Please log in to continue with this action." }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate("/login");
  };

  const handleSignUp = () => {
    onClose();
    navigate("/signup");
  };

  return (
    <>
      <style>{`
        @keyframes slideUpModal {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @media (max-width: 767px) {
          .mobile-slide-up {
            animation: slideUpModal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
      `}</style>
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500 ease-out">
      <div 
        className="relative w-full md:max-w-md bg-black border-t md:border border-[#2D2D2D] rounded-t-[12px] md:rounded-[8px] overflow-hidden shadow-[0_-8px_32px_-16px_rgba(0,0,0,0.8)] md:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] mobile-slide-up md:animate-in md:zoom-in-95 md:slide-in-from-bottom-8 md:duration-500 md:ease-out pb-safe"
      >
        {/* Mobile Drag Handle */}
        <div className="md:hidden flex justify-center pt-3 absolute top-0 left-0 right-0 z-20">
          <div className="w-10 h-1 bg-[#2D2D2D] rounded-full"></div>
        </div>
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/10 rounded-full blur-[64px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#BFF367]/5 rounded-full blur-[64px] translate-y-1/2 -translate-x-1/2" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-[8px] bg-[#000000] border border-[#2D2D2D] text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10"
        >
          <X size={18} />
        </button>

        <div className="p-6 pt-10 md:p-8 md:pt-12 text-center relative z-0 max-h-[85vh] overflow-y-auto">
          {/* Icon Header */}
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 relative">
            <ShieldCheck size={40} className="text-[#BFF367]" />
            <div className="absolute -top-1 -right-1">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BFF367] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#BFF367]"></span>
              </span>
            </div>
          </div>

          <h2 
            className="text-3xl font-black text-white mb-3 uppercase tracking-tighter"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            {title}
          </h2>
          <p 
            className="text-gray-400 text-sm leading-relaxed mb-8 px-4 font-medium"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {message}
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="flex items-center gap-2 p-3 rounded-[8px] bg-[#000000] border border-[#2D2D2D] text-left">
              <Zap size={14} className="text-[#BFF367]" />
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Fast Booking</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-[8px] bg-[#000000] border border-[#2D2D2D] text-left">
              <Star size={14} className="text-[#BFF367]" />
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Pro Features</span>
            </div>
          </div>

          <div className="space-y-4 flex flex-col items-center">
            <button
              onClick={handleLogin}
              className="w-fit flex items-center justify-center text-white/70 hover:text-white transition-colors py-2 group"
            >
              <span className="uppercase tracking-tighter text-[13px] font-bold" style={{ fontFamily: "'Open Sans', sans-serif" }}>Sign In to Continue</span>
            </button>

            <button
              onClick={handleSignUp}
              className="w-full flex items-center justify-center bg-[#BFF367] hover:bg-[#a5db4e] text-black font-black py-4 rounded-[8px] transition-all shadow-[0_8px_24px_-8px_rgba(191,243,103,0.3)] active:scale-95 group"
            >
              <span className="uppercase tracking-tighter text-[15px]" style={{ fontFamily: "'Open Sans', sans-serif" }}>Create New Account</span>
            </button>
          </div>

          <p className="mt-8 text-[10px] text-gray-600 uppercase tracking-[0.2em] font-medium">
            Secure Authentication by Kridaz
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginModal;

