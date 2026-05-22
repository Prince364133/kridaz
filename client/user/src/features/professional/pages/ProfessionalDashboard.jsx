import React from "react";
import { useParams } from "react-router-dom";
import { CoachDashboard } from "@features/coach";
import { UmpireDashboard } from "@features/umpire";
import { StreamerDashboard } from "@features/streamer";
import { CommentatorDashboard } from "@features/commentator";

const ProfessionalDashboard = () => {
  const { role } = useParams();

  switch (role) {
    case "coach":
      return <CoachDashboard />;
    case "umpire":
      return <UmpireDashboard />;
    case "streamer":
      return <StreamerDashboard />;
    case "commentator":
      return <CommentatorDashboard />;
    default:
      return <div className="text-white p-8">Unified Professional Dashboard</div>;
  }
};

export default ProfessionalDashboard;
