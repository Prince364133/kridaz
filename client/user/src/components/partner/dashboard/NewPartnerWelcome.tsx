import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, TrendingUp, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NewPartnerWelcome() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-2xl border-0 overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
        <CardContent className="p-8 md:p-12">
          <div className="text-center max-w-3xl mx-auto">
            {/* Animated Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/20"
            >
              <Sparkles className="h-12 w-12 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-integral"
            >
              Start Your Journey
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto"
            >
              Join the elite network of venue owners on Owl Turf. 
              Transform your facility into a thriving sports hub.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
            >
              <Link to="/partner/onboarding">
                <Button size="lg" className="font-bold px-10 py-7 text-lg group shadow-xl shadow-primary/20 rounded-2xl hover:scale-105 transition-transform">
                  Launch Application
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/partner">
                <Button variant="outline" size="lg" className="px-10 py-7 text-lg rounded-2xl border-2 hover:bg-muted/50">
                  Explore Benefits
                </Button>
              </Link>
            </motion.div>

            {/* Value Props Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
            >
              <div className="bg-white/50 dark:bg-black/20 p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-colors">
                <div className="bg-green-100 dark:bg-green-900/30 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">Increase Revenue</h3>
                <p className="text-sm text-muted-foreground">Partners see an average of 40% growth in bookings within 3 months.</p>
              </div>

              <div className="bg-white/50 dark:bg-black/20 p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-colors">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">Reach More Players</h3>
                <p className="text-sm text-muted-foreground">Access our community of 10,000+ active sports enthusiasts.</p>
              </div>

              <div className="bg-white/50 dark:bg-black/20 p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-colors">
                 <div className="bg-amber-100 dark:bg-amber-900/30 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                    <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">Effortless Management</h3>
                <p className="text-sm text-muted-foreground">Automated bookings, payments, and scheduling tools.</p>
              </div>
            </motion.div>

          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
