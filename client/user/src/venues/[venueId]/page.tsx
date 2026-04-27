"use client";

import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { VenueDetailsDashboard } from "@/features/venues";

export default function VenueDetailsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <VenueDetailsDashboard />
    </Suspense>
  );
}