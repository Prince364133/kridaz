const Footer = () => {
  return (
    <footer className="bg-[#050505] py-10 lg:py-20 border-t border-gray-900">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="BookMySportz Logo" className="w-20 h-20 object-contain" />
        </div>
        <p className="text-gray-500 font-secondary text-xs uppercase tracking-[0.3em] mb-12 max-w-sm mx-auto">
          The ultimate arena for elite turf bookings. Step up your game.
        </p>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent mb-12"></div>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-12">
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">Privacy Protocol</span>
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">Terms of Engagement</span>
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">Support Center</span>
        </div>
        <p className="text-gray-700 text-[10px] font-mono uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} BookMySportz. Engineered for Athletes.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
