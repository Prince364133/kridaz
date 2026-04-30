import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const SignUpDispatcher = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role");

  useEffect(() => {
    switch (role) {
      case "owner":
      case "venue-owner":
        navigate("/signup/venue-owner", { replace: true });
        break;
      case "coach":
        navigate("/signup/coach", { replace: true });
        break;
      case "umpire":
        navigate("/signup/umpire", { replace: true });
        break;
      default:
        // If no role or invalid role, go to partners gateway to choose
        navigate("/partners", { replace: true });
        break;
    }
  }, [role, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#84CC16]/20 border-t-[#84CC16] rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Initializing Secure Signup Hub...</p>
      </div>
    </div>
  );
};

export default SignUpDispatcher;
