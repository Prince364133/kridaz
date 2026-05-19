import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#050505] py-12 border-t border-white/5">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Kridaz Logo" className="h-16 w-auto object-contain" />
        </div>
        <p className="text-white/40 text-sm mb-10 max-w-sm mx-auto">
          The professional platform for sports turf bookings. Step up your game with ease.
        </p>
        <div className="w-full h-px bg-white/5 mb-10"></div>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-10">
            <Link to="/privacy-policy" className="text-xs text-white/50 hover:text-white/70 transition-colors cursor-pointer">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-xs text-white/50 hover:text-white/70 transition-colors cursor-pointer">Terms of Service</Link>
            <Link to="/data-deletion-instructions" className="text-xs text-white/50 hover:text-white/70 transition-colors cursor-pointer">Data Deletion Instructions</Link>
            <span className="text-xs text-white/50 hover:text-white/70 transition-colors cursor-pointer">Support Center</span>
        </div>
        <p className="text-white/20 text-[10px] uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Kridaz. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
