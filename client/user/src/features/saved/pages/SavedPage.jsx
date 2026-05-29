import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, MapPin, Gamepad2, FileText, ChevronLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SavedPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('venues'); // 'venues', 'games', 'posts'

  const tabs = [
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'posts', label: 'Posts', icon: FileText }
  ];

  const renderEmptyState = (type) => {
    let message = '';
    let icon = null;

    switch (type) {
      case 'venues':
        message = 'You have not saved any venues yet. Explore and save your favorite turfs!';
        icon = <MapPin className="w-16 h-16 text-zinc-700 mb-4 mx-auto" />;
        break;
      case 'games':
        message = 'No saved games. Find games you are interested in and save them for later.';
        icon = <Gamepad2 className="w-16 h-16 text-zinc-700 mb-4 mx-auto" />;
        break;
      case 'posts':
        message = 'You have no saved posts. Keep track of interesting community content by saving posts.';
        icon = <FileText className="w-16 h-16 text-zinc-700 mb-4 mx-auto" />;
        break;
      default:
        break;
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-zinc-800 rounded-[12px] bg-[#121212]/50 border-dashed">
        {icon}
        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">No saved {type}</h3>
        <p className="text-zinc-500 max-w-sm mx-auto text-sm">{message}</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-2.5 rounded-full bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition-colors"
        >
          Explore Now
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-inter">
      {/* Header section */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-4 mb-4 sm:mb-6">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Bookmark className="w-6 h-6 sm:w-8 sm:h-8 text-[#BFF367]" /> 
                Saved Items
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium tracking-wide uppercase mt-1">
                Your personal collection
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 sm:gap-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-none flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold tracking-wide uppercase transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black shadow-[0_0_15px_rgba(191,243,103,0.3)]' 
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderEmptyState(activeTab)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SavedPage;
