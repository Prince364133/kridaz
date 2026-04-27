import * as React from "react";
import { Button } from "./button";
import { Badge } from "./badge"; // Assuming Badge component is available
import { X } from "lucide-react"; // Assuming lucide-react is installed

interface FilterBarProps {
  children: React.ReactNode; // For filter inputs
  onResetFilters: () => void;
  activeFilters?: { label: string; value: string; onRemove: () => void }[];
  // Add props for search input, etc.
}

export function FilterBar({ children, onResetFilters, activeFilters }: FilterBarProps) {
  return (
    <div className="w-full p-4 border rounded-md bg-muted">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Search Input example */}
        {/* <Input placeholder="Search..." className="col-span-full sm:col-span-1" /> */}
        {children}
      </div>
      {activeFilters && activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {filter.label}: {filter.value}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={filter.onRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={onResetFilters}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
