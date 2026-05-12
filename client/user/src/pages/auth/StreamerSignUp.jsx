import React from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import RegisterForm from "../../components/auth/RegisterForm";
import { PlayCircle } from "lucide-react";

const StreamerSignUp = () => {
  return (
    <AuthLayout
      title="Join as a Streamer"
      subtitle="Broadcast matches, engage audiences, and earn."
      illustration={
        <div className="w-full max-w-sm">
          <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-sm border border-white/20">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-xl">
              <PlayCircle className="text-white w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Elevate the Game
            </h3>
            <p className="text-red-100 mb-6">
              Connect your streaming setup with Kridaz scoring system for professional live broadcasts.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                Live Overlays
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                Earn from streams
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                Build your network
              </div>
            </div>
          </div>
        </div>
      }
    >
      <RegisterForm role="streamer" />
    </AuthLayout>
  );
};

export default StreamerSignUp;
