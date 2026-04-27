"use client";

import React, { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import { Slider } from "@workspace/ui/components/slider";
import { SearchVenuesRequest, Amenity, Sport } from "@/lib/discovery/types";
import { DiscoveryApi } from "@/lib/discovery/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FiltersProps {
  initialFilters?: SearchVenuesRequest;
  onApplyFilters: (filters: SearchVenuesRequest) => void;
}

export function Filters({ initialFilters, onApplyFilters }: FiltersProps) {
  const [sports, setSports] = useState<Sport[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [, setErrorMetadata] = useState<string | null>(null);

  const [selectedSports, setSelectedSports] = useState<string[]>(initialFilters?.sports || []);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialFilters?.amenities || []);
  const [priceRange, setPriceRange] = useState<[number, number]>(
    initialFilters?.minRating ? [initialFilters.minRating, 1000] : [0, 1000] // Assuming max price 1000
  );

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoadingMetadata(true);
      setErrorMetadata(null);
      try {
        const [allSports, allAmenities] = await Promise.all([
          DiscoveryApi.getAllSports(),
          DiscoveryApi.getAllAmenities(),
        ]);
        setSports(allSports);
        setAmenities(allAmenities);
      } catch (err) {
        console.error("Failed to fetch metadata:", err);
        setErrorMetadata("Failed to load filter options.");
        toast.error("Failed to load filter options.");
      } finally {
        setLoadingMetadata(false);
      }
    };
    fetchMetadata();
  }, []);

  const handleSportChange = (sportName: string, checked: boolean) => {
    setSelectedSports(prev =>
      checked ? [...prev, sportName] : prev.filter(s => s !== sportName)
    );
  };

  const handleAmenityChange = (amenityName: string, checked: boolean) => {
    setSelectedAmenities(prev =>
      checked ? [...prev, amenityName] : prev.filter(a => a !== amenityName)
    );
  };

  const applyFilters = () => {
    onApplyFilters({
      ...initialFilters, // Keep query/city from initial search
      sports: selectedSports.length > 0 ? selectedSports : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      minRating: priceRange[0] > 0 ? priceRange[0] : undefined, // Using minRating for price for now
      // priceRange[1] can be maxPrice
    });
  };

  if (loadingMetadata) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="mt-2 text-sm text-muted-foreground">Loading filters...</span>
      </div>
    );
  }

  return (
    <div className="bg-background p-6 rounded-lg shadow-md space-y-4">
      <h3 className="text-xl font-bold mb-4">Filter Venues</h3>

      <Accordion type="multiple" defaultValue={["sports", "amenities", "price"]}>
        <AccordionItem value="sports">
          <AccordionTrigger className="font-semibold">Sports</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {sports.map((sport: Sport) => (
                <div key={sport.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sport-${sport.id}`}
                    checked={selectedSports.includes(sport.name)}
                    onCheckedChange={(checked) => handleSportChange(sport.name, Boolean(checked))}
                  />
                  <Label htmlFor={`sport-${sport.id}`}>{sport.name}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="amenities">
          <AccordionTrigger className="font-semibold">Amenities</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {amenities.map((amenity: Amenity) => (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity.id}`}
                    checked={selectedAmenities.includes(amenity.name)}
                    onCheckedChange={(checked) => handleAmenityChange(amenity.name, Boolean(checked))}
                  />
                  <Label htmlFor={`amenity-${amenity.id}`}>{amenity.name}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger className="font-semibold">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="px-1 py-2">
              <Slider
                min={0}
                max={1000} // Example max price
                step={10}
                value={priceRange}
                onValueChange={(val: [number, number]) => setPriceRange(val)}
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-2">
                <span>₹{priceRange[0]}</span>
                <span>₹{priceRange[1]}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button onClick={applyFilters} className="w-full mt-4">
        Apply Filters
      </Button>
    </div>
  );
}
