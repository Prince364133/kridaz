"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react'; 
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import VenueFilterBar from "./VenueFilterBar";
import VenueList from "./VenueList";
import StoriesForYou from "./StoriesForYou";
import { DiscoveryApi } from "@/lib/discovery/api";
import { VenueListing, SearchVenuesRequest } from "@/lib/discovery/types";
import { parseISO } from 'date-fns';

interface VenueFilters {
  searchQuery: string;
  location: string;
  sport: string;
  date: string;
}

export function VenuesDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initial filters from URL
  const initialFilters = useMemo(() => {
     return {
        searchQuery: searchParams.get('q') || '',
        location: searchParams.get('city') || 'All Locations',
        sport: searchParams.get('sport') || 'All Sportz',
        date: searchParams.get('date') || 'Any Date',
     };
  }, [searchParams]);

  const [filters, setFilters] = useState<VenueFilters>(initialFilters);

  const [venues, setVenues] = useState<VenueListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleFilterChange = useCallback((newFilters: VenueFilters) => {
    setFilters(newFilters);
    
    // Update URL
    const params = new URLSearchParams();
    if (newFilters.searchQuery) params.set('q', newFilters.searchQuery);
    if (newFilters.location !== 'All Locations') params.set('city', newFilters.location);
    if (newFilters.sport !== 'All Sportz') params.set('sport', newFilters.sport);
    if (newFilters.date !== 'Any Date') params.set('date', newFilters.date);
    
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router]);

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      setError(null);
      try {
        const request: SearchVenuesRequest = {
          query: filters.searchQuery || undefined,
          city: filters.location !== 'All Locations' ? filters.location : undefined,
          sports: filters.sport !== 'All Sportz' ? [filters.sport] : undefined,
          ...((filters.date !== 'Any Date') ? { date: filters.date } : {})
        };

        const response = await DiscoveryApi.searchVenues(request);
        console.log("VenuesPage: API Response:", response);
        if (response && response.venues) {
           console.log("VenuesPage: Setting venues:", response.venues.length);
           setVenues(response.venues);
        } else {
           console.warn("VenuesPage: response.venues is missing or empty", response);
           setVenues([]);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch venues:", err);
        setError("Failed to load venues. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [filters]); // Re-fetch when filters change

  return (
    <div className="container mx-auto p-4 space-y-4">
      <VenueFilterBar 
        onFilterChange={handleFilterChange} 
        initialValues={{
            ...filters,
            date: filters.date && filters.date !== 'Any Date' ? parseISO(filters.date) : undefined
        }}
      />
      <VenueList venues={venues} loading={loading} error={error} />
      <StoriesForYou />
    </div>
  );
}
