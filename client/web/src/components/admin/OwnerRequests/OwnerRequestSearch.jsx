 
import React from "react";
import { Search } from "lucide-react";

const OwnerRequestSearch = ({ searchTerm, handleSearch }) => {
  return (
    <div className="w-full">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
        Search Requests
      </label>
      <div className="relative group">
        <input
          type="text"
          placeholder="Search by owner name or email..."
          className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#84CC16] focus:ring-1 focus:ring-[#84CC16]/50 transition-all placeholder:text-gray-600"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-[#84CC16] transition-colors" />
      </div>
    </div>
  );
};

export default OwnerRequestSearch;
