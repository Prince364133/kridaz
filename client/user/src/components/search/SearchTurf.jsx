import { useState } from "react";
import { Search, MapPin, Calendar, Trophy } from "lucide-react";

const SearchTurf = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch({ searchTerm, location });
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-16 animate-fade-in-up">
      <form 
        onSubmit={handleSearch} 
        className="relative group"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#84CC16] to-[#4D7C0F] rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative flex flex-col md:flex-row items-center bg-[#111]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 shadow-2xl">
          
          {/* Venue Search */}
          <div className="flex-1 flex items-center px-6 py-3 w-full border-b md:border-b-0 md:border-r border-white/5">
            <Search className="text-[#84CC16] mr-4 shrink-0" size={20} />
            <input
              type="text"
              placeholder="What are you playing today?"
              className="bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 w-full text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="flex-1 flex items-center px-6 py-3 w-full border-b md:border-b-0 md:border-r border-white/5">
            <MapPin className="text-gray-400 mr-4 shrink-0" size={20} />
            <input
              type="text"
              placeholder="Find nearby..."
              className="bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 w-full text-sm font-medium"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Action Button */}
          <div className="px-4 py-2 w-full md:w-auto">
            <button 
              type="submit" 
              className="w-full md:w-auto px-8 py-3 bg-[#84CC16] hover:bg-[#A3E635] text-black font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group/btn active:scale-95"
            >
              <span>DISCOVER</span>
              <Search size={18} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Quick Filter Labels */}
        <div className="flex flex-wrap gap-4 mt-4 px-2">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Trending:</span>
          {["Football", "Cricket", "Turf Near Me", "Night Slots"].map((tag) => (
            <button 
              key={tag}
              type="button"
              onClick={() => {
                setSearchTerm(tag);
                onSearch({ searchTerm: tag, location });
              }}
              className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#84CC16] transition-colors font-bold"
            >
              {tag}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

export default SearchTurf;
