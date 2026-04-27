"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  CheckCircle,
  CalendarDays,
  Trophy,
  Star,
  Navigation,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import Image from "next/image";

// ---- MATCHING THE SAME INTERFACE AS PAGE ----
interface VenueDetails {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  rating: number;
  numberOfReviews: number;
  sports: string[];
  groundDetails: string;
  costDetails: string;
  facilities: string[];
  locationUrl: string;
  aboutVenue: string;
  recentReviews: {
    id: number;
    user: string;
    rating: number;
    comment: string;
    date: string;
  }[];
  galleryImages?: { src: string; alt: string }[];
}

interface VenueDetailsClientProps {
  venue: VenueDetails;
  venueId: string;
}

const VenueDetailsClient = ({ venue, venueId }: VenueDetailsClientProps) => {

  // ------------------------------
  // SAFE PRICE EXTRACTION
  // ------------------------------
  const extractedPrice = (() => {
    // Example → "Starting from ₹1000/hr"
    const match = venue.costDetails.match(/₹\s?([\d,]+)/);
    return match ? `₹${match[1]}` : "N/A";
  })();

  const mainImage = venue.galleryImages?.[0];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* -------------------------------- */}
      {/* HERO IMAGE */}
      {/* -------------------------------- */}
      <div className="relative h-[400px] w-full md:h-[500px] overflow-hidden">
        {mainImage ? (
          <Image
            src={mainImage.src}
            alt={mainImage.alt}
            fill
            className="absolute inset-0 object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
            <span className="text-2xl font-bold">No Image Available</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-10" />

        <div className="container relative z-20 mx-auto flex h-full flex-col justify-end pb-8 px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {venue.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{venue.location}</span>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(venue.rating)
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
              <span className="font-semibold">{venue.rating}</span>
              <span className="text-sm text-muted-foreground">
                ({venue.numberOfReviews} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------- */}
      {/* CONTENT */}
      {/* -------------------------------- */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          
          {/* MAIN LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">

            {/* ABOUT */}
            <section>
              <h2 className="text-2xl font-bold mb-4">About the Venue</h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {venue.aboutVenue}
                  </p>

                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      Ground Details
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {venue.groundDetails}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* FACILITIES */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Amenities & Facilities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {venue.facilities.map((facility, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm">{facility}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* GALLERY */}
            {venue.galleryImages && venue.galleryImages.length > 1 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {venue.galleryImages.map((img, index) => (
                    <div key={index} className="relative aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* REVIEWS */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Recent Reviews</h2>
              <div className="space-y-4">
                {venue.recentReviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {review.user[0]}
                          </div>
                          <div>
                            <CardTitle className="text-base">{review.user}</CardTitle>
                            <CardDescription className="text-xs">{review.date}</CardDescription>
                          </div>
                        </div>

                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* SIDEBAR RIGHT */}
          <div className="space-y-6">

            {/* BOOKING CARD */}
            <div className="lg:sticky lg:top-24">
              <Card className="shadow-lg border-primary/20 overflow-hidden">
                <div className="h-2 bg-primary w-full" />
                <CardHeader>
                  <CardTitle className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{extractedPrice}</span>
                    <span className="text-sm text-muted-foreground">/ hour</span>
                  </CardTitle>
                  <CardDescription>
                    Available for {venue.sports.join(", ")}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {venue.sports.map((sport) => (
                      <Badge key={sport} variant="secondary">
                        {sport}
                      </Badge>
                    ))}
                  </div>

                  <Link href={`/venues/${venueId}#book-slots`} className="block">
                    <Button size="lg" className="w-full text-lg font-semibold">
                      <CalendarDays className="mr-2 h-5 w-5" />
                      Check Availability
                    </Button>
                  </Link>

                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Instant confirmation • No booking fees
                  </p>
                </CardContent>
              </Card>

              {/* MAP */}
              <Card className="mt-6 overflow-hidden">
                <div className="aspect-video relative">
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      venue.location
                    )}&output=embed`}
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                <CardContent className="p-4">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      venue.location
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-primary text-sm font-medium hover:underline"
                  >
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetailsClient;
