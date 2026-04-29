import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import { OwnerSidebar, AuthenticatedNavbar, PartnerFooter } from "@components/layout";

const PartnerLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <AuthenticatedNavbar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 pt-16 lg:pt-20">
        <OwnerSidebar
          isOpen={isOpen}
          toggleSidebar={toggleSidebar}
          className={`${
            isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        />
        <main
          className={`
          flex-1 
          overflow-x-hidden 
          overflow-y-auto 
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
      <PartnerFooter />
    </div>
  );
};

export default PartnerLayout;
