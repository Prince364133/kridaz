import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Calendar,
  IndianRupee,
  TrendingUp,
  Building,
  ExternalLink,
  LayoutDashboard,
  Settings,
  Users,
  Store,
  ArrowRight,
  ShieldCheck,
  Clock
} from "lucide-react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface ApprovedDashboardProps {
  partnerData: any;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function ApprovedDashboard({ partnerData }: ApprovedDashboardProps) {
  const venueOwnerWebUrl = config.urls.venueOwner;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      {/* Welcome Banner - Premium & Semantic */}
      <motion.div variants={fadeInUp}>
        <Card className="shadow-2xl border-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground overflow-hidden relative group">
          {/* Subtle Grain/Noise Texture Opacity */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          
          {/* Spotlight Effect */}
          <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-white/20 blur-[100px] rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                 <BadgeCheck className="h-8 w-8 text-white drop-shadow-md" />
              </div>
              <div>
                 <h2 className="text-2xl font-bold tracking-tight">Identity Verified</h2>
                 <p className="text-sm text-primary-foreground/90 font-medium opacity-90">You are ready to create your venue</p>
              </div>
            </div>
            <p className="text-primary-foreground/95 max-w-xl text-lg leading-relaxed font-light mb-6">
              Congratulations! Your partner identity has been verified. 
              Head over to the Venue Dashboard to list your courts and start accepting bookings.
            </p>
            <Link to={venueOwnerWebUrl} target="_blank">
              <Button size="lg" variant="secondary" className="font-semibold shadow-lg hover:shadow-xl transition-all">
                <Building className="mr-2 h-5 w-5" />
                Go to Venue Dashboard
                <ExternalLink className="ml-2 h-4 w-4 opacity-70" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeInUp}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your venue and bookings on the dedicated portal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to={`${venueOwnerWebUrl}/venues`} target="_blank" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
                  <Building className="h-5 w-5" />
                  Manage Venues
                </Button>
              </Link>
              <Link to={`${venueOwnerWebUrl}/bookings`} target="_blank" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
                  <Calendar className="h-5 w-5" />
                  View Bookings
                </Button>
              </Link>
              <Link to={`${venueOwnerWebUrl}/settings/billing`} target="_blank" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
                  <IndianRupee className="h-5 w-5" />
                  Payout Settings
                </Button>
              </Link>
              <Link to={`${venueOwnerWebUrl}/analytics`} target="_blank" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:border-primary hover:text-primary transition-colors">
                  <TrendingUp className="h-5 w-5" />
                  Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

       {/* Stats Grid - Hidden for now as it belongs on venue dashboard */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-50 pointer-events-none filter blur-[1px]">
        <StatCard ... />
      </div> */}

    </motion.div>
  );
}
