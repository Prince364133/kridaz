 
import { Outlet } from "react-router-dom";
import { LandingHeader } from "@/components/layout/LandingHeader";

const Root = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <LandingHeader />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};

export default Root;
