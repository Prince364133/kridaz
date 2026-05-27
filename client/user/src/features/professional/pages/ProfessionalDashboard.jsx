import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import OverviewTab from "./OverviewTab";

const ProfessionalDashboard = () => {
  const { role } = useParams();
  const user = useSelector((state) => state.auth?.user);
  const profile = user?.ownerProfile || null;

  return (
    <div className="min-h-screen bg-black">
      <OverviewTab role={role} profile={profile} />
    </div>
  );
};

export default ProfessionalDashboard;
