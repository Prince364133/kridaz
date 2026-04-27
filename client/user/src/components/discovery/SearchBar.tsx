"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { SearchVenuesRequest } from "@/lib/discovery/types";

interface SearchBarProps {
  initialQuery?: string;
  initialCity?: string;
  onSearch: (filters: SearchVenuesRequest) => void;
}

export function SearchBar({ initialQuery, initialCity, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery || "");
  const [city, setCity] = useState(initialCity || "");

  const handleSearch = () => {
    onSearch({ query: query || undefined, city: city || undefined });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-background rounded-lg shadow-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by venue name, sport, or activity..."
          className="pl-10 pr-4 py-2 w-full rounded-md border"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="City (e.g., Bengaluru)"
          className="pl-10 pr-4 py-2 w-full rounded-md border"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>
      <Button onClick={handleSearch} className="w-full sm:w-auto">
        Search
      </Button>
    </div>
  );
}
