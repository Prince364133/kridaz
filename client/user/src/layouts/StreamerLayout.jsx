import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { StreamerSidebar, AuthenticatedNavbar } from "@components/layout";
import MobileBottomNav from "@user/components/layout/MobileBottomNav";

const StreamerLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  const { role } = useSelector((state) => state.auth);

  const isMinimized = !isHovered;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <AuthenticatedNavbar toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 pt-16 lg:pt-20">
        <div 
          onMouseEnter={() => window.innerWidth >= 1024 && setIsHovered(true)} 
          onMouseLeave={() => window.innerWidth >= 1024 && setIsHovered(false)}
          className="z-50"
        >
          <StreamerSidebar
            isOpen={isOpen}
            toggleSidebar={toggleSidebar}
            isMinimized={isMinimized}
            className={`${
              isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            }`}
          />
        </div>
        <main
          className={`
          flex-1 
          overflow-x-hidden
          transition-all 
          duration-300 
          ease-in-out
          ${isMinimized ? "lg:ml-20" : "lg:ml-64"}
        `}
        >
          <div className="w-full p-4 pb-24 lg:pb-10">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default StreamerLayout;
