import React from "react";
import { Search, Command } from "lucide-react";

const SearchBar = ({ searchTerm, handleSearch }) => {
  return (
    <div className="relative w-full lg:w-[450px] group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#555] group-focus-within:text-[#CCFF00] transition-colors">
        <Search size={18} />
      </div>
      <input
        type="text"
        placeholder="SEARCH BY NAME OR EMAIL..."
        className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[8px] py-3 pl-12 pr-12 text-[11px] font-bold text-white placeholder:text-[#555] focus:outline-none focus:border-[#CCFF00]/50 transition-all uppercase tracking-widest shadow-inner group-hover:border-[#444]"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-[#2D2D2D] rounded-[4px] border border-[#404040]">
           <Command size={10} className="text-[#888]" />
           <span className="text-[9px] font-bold text-[#888]">K</span>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
