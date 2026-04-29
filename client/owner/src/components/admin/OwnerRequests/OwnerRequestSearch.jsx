 
import React from "react";
import { Search } from "lucide-react";

const OwnerRequestSearch = ({ searchTerm, handleSearch }) => {
  return (
    <div className="w-full">
      <label className="font-mono text-[10px] text-gray-500 uppercase tracking-[0.3em] mb-2 block">
        Intelligence Filter
      </label>
      <div className="relative group">
        <input
          type="text"
          placeholder="SEARCH BY RECRUIT NAME OR INTEL..."
          className="w-full bg-[#111111] border border-white/10 notched-corner py-4 pl-12 pr-4 text-xs font-mono uppercase tracking-widest text-white focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(113,179,0,0.1)] transition-all placeholder:text-gray-700"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700 group-focus-within:text-primary transition-colors" />
      </div>
    </div>
  );
};

export default OwnerRequestSearch;
