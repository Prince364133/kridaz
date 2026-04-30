 
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import UserFooter from "../components/layout/UserFooter";

const Root = () => {
  const location = useLocation();
  const isHomePage = ["/", "/login", "/signup"].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-grow ${isHomePage ? "" : "pt-16 lg:pt-20"}`}>
        <Outlet />
      </main>
      <UserFooter />
    </div>
  );
};

export default Root;
