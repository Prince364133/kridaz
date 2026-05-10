const Footer = () => {
  return (
    <footer className="bg-[#050505] py-12 border-t border-gray-900 mt-20">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-44 h-16 bg-transparent flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Kridaz Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <p className="text-gray-600 text-[10px] font-mono uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Kridaz. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

