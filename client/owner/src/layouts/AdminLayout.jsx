import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@components/layout";

const AdminLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Mobile Sidebar Trigger */}
      {!isOpen && (
        <button 
          onClick={toggleSidebar}
          className="fixed top-6 left-6 z-50 p-3 bg-zinc-900 border border-white/10 rounded-xl text-white hover:text-[#84CC16] lg:hidden transition-all duration-300 shadow-2xl shadow-[#84CC16]/10"
        >
          <Menu size={24} />
        </button>
      )}

      <div className="flex flex-1">
        <AdminSidebar
          isOpen={isOpen}
          toggleSidebar={toggleSidebar}
          className={`
            ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        />
        <main
          className={`
          flex-1 
          p-4 
          transition-all 
          duration-300 
          ease-in-out
          lg:ml-64
        `}
        >
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
