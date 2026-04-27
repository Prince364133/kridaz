"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, MapPin, Dumbbell, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface VenueFilterBarProps {
  initialValues?: {
    searchQuery?: string;
    location?: string;
    sport?: string;
    date?: Date;
  };
  onFilterChange?: (filters: {
    searchQuery: string;
    location: string;
    sport: string;
    date: string;
  }) => void;
}

// Mock Options (In a real app, fetch these from API)
const LOCATIONS = ["Hyderabad", "Bangalore", "Mumbai", "Delhi", "Chennai"];
const SPORTS = ["Cricket", "Football", "Badminton", "Tennis", "Basketball", "Swimming"];

export default function VenueFilterBar({ onFilterChange, initialValues }: VenueFilterBarProps) {
  // State
  const [searchQuery, setSearchQuery] = useState(initialValues?.searchQuery || "");
  const [location, setLocation] = useState<string | "all">(initialValues?.location || "all");
  const [sport, setSport] = useState<string | "all">(initialValues?.sport || "all");
  const [date, setDate] = useState<Date | undefined>(initialValues?.date);

  // Debounce Logic for Search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Effect to trigger filter change
  useEffect(() => {
    const formattedDate = date ? format(date, "yyyy-MM-dd") : "Any Date";
    const loc = location === "all" ? "All Locations" : location;
    const spt = sport === "all" ? "All Sportz" : sport;

    onFilterChange?.({
      searchQuery: debouncedSearch.trim(),
      location: loc,
      sport: spt,
      date: formattedDate,
    });
  }, [debouncedSearch, location, sport, date, onFilterChange]);

  // Handlers
  const handleReset = useCallback(() => {
    setSearchQuery("");
    setLocation("all");
    setSport("all");
    setDate(undefined);
  }, []);

  return (
    <div className="flex flex-col gap-4 bg-card text-card-foreground rounded-lg shadow-sm border border-border p-4 w-full">
      <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Input
            type="text"
            placeholder="Search venues by name..."
            className="pl-10 h-10 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
          
          {/* Location Select */}
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-full sm:w-[160px] h-10">
              <div className="flex items-center gap-2 truncate">
                <MapPin className="h-4 w-4 text-primary" />
                <SelectValue placeholder="Location" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {LOCATIONS.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sport Select */}
          <Select value={sport} onValueChange={setSport}>
            <SelectTrigger className="w-full sm:w-[160px] h-10">
              <div className="flex items-center gap-2 truncate">
                <Dumbbell className="h-4 w-4 text-primary" />
                <SelectValue placeholder="Sport" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sportz</SelectItem>
              {SPORTS.map((spt) => (
                <SelectItem key={spt} value={spt}>
                  {spt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Picker (Popover + Calendar) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[160px] h-10 justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>

          {/* Reset Button */}
          {(location !== "all" || sport !== "all" || date || searchQuery) && (
            <Button 
              variant="ghost" 
              onClick={handleReset}
              className="h-10 px-3 text-muted-foreground hover:text-destructive"
            >
              Reset
            </Button>
          )}

        </div>
      </div>
    </div>
  );
}
