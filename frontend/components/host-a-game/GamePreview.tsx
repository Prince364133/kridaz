"use client";

import React from "react";
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { MapPin, CalendarDays, Clock, Users, Euro, Gamepad2, Book } from "lucide-react"; // Import necessary lucide icons


import { GameFormData } from "../../app/host-a-game/page"; // Import GameFormData from host-a-game/page

interface GamePreviewProps {
  formData: GameFormData;
}

export function GamePreview({ formData }: GamePreviewProps) {
  // Check if formData.date is a valid Date object before formatting
  const formattedDate = formData.date instanceof Date && !isNaN(formData.date.getTime())
    ? format(formData.date, "PPP")
    : "Not set";

  const formattedTime = formData.time || "Not set";

  const getCostIcon = (currency: string) => {
    switch (currency) {
      case 'EUR': return <Euro className="inline h-4 w-4 mr-1" aria-hidden="true" />;
      // Add other currencies as needed
      default: return null;
    }
  };


  return (
    <Card className="w-full max-w-md bg-card border-border text-foreground shadow-lg"> {/* Theme-aware styling */}
      <CardHeader>
        <CardTitle className="text-primary">Game Preview</CardTitle> {/* Theme-aware color */}
        <CardDescription className="text-muted-foreground">
          This is how your game will be listed to other players.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border-b border-border pb-4"> {/* Theme-aware border */}
          <h3 className="text-2xl font-bold text-foreground"> {/* Theme-aware color */}
            {formData.title || "Your Game Title"}
          </h3>
          <p className="text-lg text-muted-foreground capitalize flex items-center gap-2"> {/* Theme-aware color */}
            <Gamepad2 className="h-5 w-5" aria-hidden="true" /> {formData.sport || "Sport"}
          </p>
        </div>
        <div className="text-sm space-y-3"> {/* Increased space for icons */}
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            <strong className="text-foreground">Venue:</strong>{" "} {/* Theme-aware color */}
            {formData.venue || "To be decided"}
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            <strong className="text-foreground">Date:</strong>{" "} {/* Theme-aware color */}
            {formattedDate}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
            <strong className="text-foreground">Time:</strong>{" "} {/* Theme-aware color */}
            {formattedTime}
          </p>
        </div>
        <div className="flex justify-between items-center text-sm bg-muted/30 p-3 rounded-lg"> {/* Theme-aware styling */}
          <div className="text-center">
            <p className="font-bold text-lg text-foreground flex items-center justify-center gap-1"> {/* Theme-aware color */}
                <Users className="h-4 w-4" aria-hidden="true" /> {formData.playersNeeded}
            </p>
            <p className="text-xs text-muted-foreground">Players Needed</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg capitalize text-foreground">{formData.skillLevel}</p> {/* Theme-aware color */}
            <p className="text-xs text-muted-foreground">Skill Level</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-foreground flex items-center justify-center gap-1"> {/* Theme-aware color */}
                {getCostIcon(formData.costPerPlayer > 0 ? 'EUR' : '')}
                {formData.costPerPlayer === 0 ? 'Free' : formData.costPerPlayer}
            </p>
            <p className="text-xs text-muted-foreground">per player</p>
          </div>
        </div>
        {formData.description && (
          <div className="pt-4 border-t border-border"> {/* Theme-aware border */}
            <h4 className="font-semibold text-primary flex items-center gap-2"> {/* Theme-aware color */}
                <Book className="h-4 w-4" aria-hidden="true" /> Description
            </h4>
            <p className="text-sm text-muted-foreground mt-1"> {/* Theme-aware color */}
              {formData.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}