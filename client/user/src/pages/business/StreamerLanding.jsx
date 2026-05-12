import React from "react";
import { Link } from "react-router-dom";
import { PlayCircle, DollarSign, Users, Award } from "lucide-react";
import { PublicHeader, Footer } from "@components/common";

const StreamerLanding = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicHeader />
      <main className="flex-1">
        <div className="bg-red-600 text-white py-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Broadcast Live Cricket to Thousands</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-10">
              Join the Kridaz Streamer Network. Cover local matches, build your audience, and get paid for your broadcasts.
            </p>
            <Link to="/signup/streamer" className="bg-white text-red-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors">
              Become a Streamer
            </Link>
          </div>
        </div>

        <div className="py-20 max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="text-red-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">High Quality Streams</h3>
              <p className="text-gray-600">Integrated directly with Kridaz scoring system for real-time live overlays.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="text-green-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Earn Money</h3>
              <p className="text-gray-600">Get booked by match organizers and earn a steady income from your streams.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-blue-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Build Reputation</h3>
              <p className="text-gray-600">Grow your streaming profile and become the top-rated broadcaster.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StreamerLanding;
