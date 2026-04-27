"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import Image from "next/image";
import { buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link"; // Import Link
import { MapPin, Euro, DollarSign } from "lucide-react"; // Import MapPin, Euro, DollarSign


import { Product } from "./ProductGrid"; // Import Product interface from ProductGrid

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'EUR': return <Euro className="inline h-4 w-4 mr-1" aria-hidden="true" />;
      case 'USD': return <DollarSign className="inline h-4 w-4 mr-1" aria-hidden="true" />;
      default: return null;
    }
  };

  return (
    <Card className="w-full bg-card border-border text-foreground shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col"> {/* Theme-aware styling */}
      <CardHeader className="p-0">
        <Link href={`/marketplaces/${product.id}`} className="block relative h-48 w-full">
          <Image
            src={product.images?.[0] || "/placeholder.svg"} // Safe access to first image
            alt={product.title}
            fill
            style={{ objectFit: 'cover' }} // Modern way to use objectFit
            className="rounded-t-lg"
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-bold mb-1 truncate">
          <Link href={`/marketplaces/${product.id}`} className="hover:underline">
            {product.title}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"> {/* Theme-aware styling */}
          <MapPin className="h-4 w-4" aria-hidden="true" /> {product.location}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 pt-0">
        <p className="text-lg font-semibold text-primary flex items-center"> {/* Theme-aware styling */}
          {getCurrencyIcon(product.currency)}
          {product.price.toFixed(2)}
        </p>
        <Link
          href={`/marketplaces/${product.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hover:bg-primary hover:text-primary-foreground")}
          aria-label={`View details for ${product.title}`}
        >
          View
        </Link>
      </CardFooter>
    </Card>
  );
}
