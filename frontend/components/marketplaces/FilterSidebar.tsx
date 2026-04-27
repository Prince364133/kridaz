"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { DollarSign, MapPin, SlidersHorizontal, Tag } from "lucide-react"; // Import icons
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select'; // Import Select components


interface FilterSidebarProps {
  filters: {
    searchQuery: string;
    category: string;
    priceRange: [number, number];
    condition: string;
  };
  onFilterChange: (newFilters: Partial<FilterSidebarProps['filters']>) => void;
}

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  // Local state for price inputs to manage min/max independently before applying
  const [minPrice, setMinPrice] = useState(filters.priceRange[0].toString());
  const [maxPrice, setMaxPrice] = useState(filters.priceRange[1].toString());

  const handleApplyPriceFilter = () => {
    const newMin = parseInt(minPrice) || 0;
    const newMax = parseInt(maxPrice) || 100000; // Arbitrary high max
    onFilterChange({ priceRange: [newMin, newMax] });
  };

  const handleClearFilters = () => {
    onFilterChange({
      category: 'all',
      priceRange: [0, 1000],
      condition: 'all',
    });
    setMinPrice('0');
    setMaxPrice('1000');
  };

  return (
    <Card className="bg-card border-border shadow-lg"> {/* Theme-aware styling */}
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" aria-hidden="true" /> Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div>
          <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" aria-hidden="true" /> Category
          </h4>
          <Select value={filters.category} onValueChange={(value) => onFilterChange({ category: value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="apparel">Apparel</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Condition Filter */}
        <div>
          <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" aria-hidden="true" /> Condition
          </h4>
          <Select value={filters.condition} onValueChange={(value) => onFilterChange({ condition: value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Condition</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="used">Used</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" aria-hidden="true" /> Price Range
          </h4>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              aria-label="Minimum price"
            />
            <span className="text-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              aria-label="Maximum price"
            />
          </div>
          <Button onClick={handleApplyPriceFilter} className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90" aria-label="Apply price filter">
            Apply Price
          </Button>
        </div>

        {/* Location (Simple Input for now) */}
        <div>
          <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" /> Location
          </h4>
          <Input
            placeholder="Enter a city or zip code"
            value={filters.searchQuery} // Reusing searchQuery for location search too
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
            aria-label="Filter by location"
          />
        </div>
        
        <Button onClick={handleClearFilters} variant="outline" className="w-full">
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );
}