import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { UmpireSidebar, AuthenticatedNavbar } from "@components/layout";
import MobileBottomNav from "@user/components/layout/MobileBottomNav";

const UmpireLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

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
          <UmpireSidebar
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
          p-4 
          pb-24 lg:pb-4
          transition-all 
          duration-300 
          ease-in-out
          ${isMinimized ? "lg:ml-20" : "lg:ml-64"}
        `}
        >
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default UmpireLayout;
