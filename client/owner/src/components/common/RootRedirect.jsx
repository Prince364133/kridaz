import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import UserHome from "@user/pages/Home";

const RootRedirect = () => {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      const normalizedRole = role?.toLowerCase();
      if (normalizedRole === "bmsp_admin" || normalizedRole === "admin") {
        navigate("/admin", { replace: true });
      } else if (normalizedRole === "owner") {
        navigate("/partner", { replace: true });
      } else if (normalizedRole === "coach") {
        navigate("/coach", { replace: true });
      } else if (normalizedRole === "umpire") {
        navigate("/umpire", { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate]);

  return <UserHome />;
};

export default RootRedirect;
