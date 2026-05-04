 
import React from "react";
import { Search } from "lucide-react";

const OwnerRequestSearch = ({ searchTerm, handleSearch }) => {
  return (
    <div className="w-full">
      <div className="relative group flex items-center bg-[#111] border border-white/5 rounded-xl h-11 transition-all focus-within:border-[#84CC16]/50">
        <div className="pl-4 shrink-0">
          <Search size={14} className="text-gray-500 group-focus-within:text-[#84CC16] transition-colors" />
        </div>
        <input
          type="text"
          placeholder="SEARCH AUTHORIZATION QUEUE..."
          className="w-full bg-transparent border-none py-2 px-4 text-[11px] font-bold text-white focus:ring-0 placeholder:text-gray-600 uppercase tracking-wider"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
    </div>
  );
};

export default OwnerRequestSearch;
