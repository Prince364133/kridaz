import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  gradient: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export function StatCard({ icon, label, value, trend, trendUp, gradient }: StatCardProps) {
  return (
    <motion.div variants={fadeInUp}>
      <Card className="shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {trend && (
                <div className={cn(
                  "flex items-center gap-1 mt-2 text-sm font-medium",
                  trendUp ? "text-green-600" : "text-red-600"
                )}>
                  <TrendingUp className={cn("h-4 w-4", !trendUp && "rotate-180")} />
                  {trend}
                </div>
              )}
            </div>
            <div className={cn(
              "p-3 rounded-xl bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform",
              gradient
            )}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
