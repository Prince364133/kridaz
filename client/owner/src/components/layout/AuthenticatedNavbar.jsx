import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import ThemeSwitcher from "../common/ThemeSwitcher.jsx";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";

const AuthenticatedNavbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const role = useSelector((state) => state?.auth?.role);
  const path = role === "admin" ? "/admin" : role === "coach" ? "/coach" : role === "umpire" ? "/umpire" : "/partner";
  
  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
      <nav className="navbar bg-surface/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 h-16 lg:h-20">
        <div className="navbar-start">
          <button className="p-2 mr-4 text-white hover:text-[#84CC16] transition-colors lg:hidden" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <Link to={path} className="flex items-center gap-4 group">
            <div className="w-24 h-12 sm:w-44 sm:h-16 bg-transparent flex items-center justify-center transition-all overflow-hidden">
               <img src="/logo.png" alt="BookMySportz Logo" className="w-full h-full object-contain" />
            </div>
          </Link>
        </div>

        <div className="navbar-end gap-6">
          <div className="hidden sm:block">
            <ThemeSwitcher />
          </div>
          <div className="h-8 w-[1px] bg-white/5 mx-2" />
          <button 
            className="text-sm font-bold text-white hover:text-[#84CC16] transition-colors px-4 py-2" 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AuthenticatedNavbar;
