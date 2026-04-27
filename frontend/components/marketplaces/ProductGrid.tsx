"use client";

import React, { useState, useEffect } from "react";
import { ProductCard } from "./ProductCard";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"; // Import Alert
import { AlertCircle, Loader2, ShoppingBag } from "lucide-react"; // Import icons


export interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  category: string;
  location: string;
  sellerId: string;
  sellerName: string;
  currency: string; // Added currency to product interface
}

const allMockProducts: Product[] = [
  {
    id: "1",
    title: "Slightly Used Football",
    description: "A great football for practice.",
    images: ["/images/marketplaces/product1.png"],
    price: 15.99,
    category: "Equipment",
    location: "New York, NY",
    sellerId: "seller1",
    sellerName: "John Doe",
    currency: "USD",
  },
  {
    id: "2",
    title: "Basketball Shoes - Size 10",
    description: "Barely worn basketball shoes.",
    images: ["/images/marketplaces/product2.png"],
    price: 50.0,
    category: "Apparel",
    location: "Los Angeles, CA",
    sellerId: "seller2",
    sellerName: "Jane Smith",
    currency: "USD",
  },
  {
    id: "3",
    title: "Tennis Racket",
    description: "A good quality tennis racket for beginners.",
    images: ["/images/marketplaces/product3.png"],
    price: 45.5,
    category: "Equipment",
    location: "Chicago, IL",
    sellerId: "seller3",
    sellerName: "Peter Jones",
    currency: "USD",
  },
  {
    id: "4",
    title: "Yoga Mat",
    description: "Brand new yoga mat.",
    images: ["/images/marketplaces/product4.png"],
    price: 25.0,
    category: "Accessories",
    location: "Houston, TX",
    sellerId: "seller4",
    sellerName: "Mary Williams",
    currency: "USD",
  },
  {
    id: "5",
    title: "Cricket Bat",
    description: "Professional grade cricket bat.",
    images: ["/images/marketplaces/product5.png"],
    price: 120.00,
    category: "Equipment",
    location: "Hyderabad, IN",
    sellerId: "seller5",
    sellerName: "Ravi Sharma",
    currency: "EUR",
  },
  {
    id: "6",
    title: "Sportz T-Shirt",
    description: "Comfortable athletic t-shirt.",
    images: ["/images/marketplaces/product6.png"],
    price: 20.00,
    category: "Apparel",
    location: "Hyderabad, IN",
    sellerId: "seller6",
    sellerName: "Priya Singh",
    currency: "EUR",
  },
];


interface ProductGridProps {
  filters: {
    searchQuery: string;
    category: string;
    priceRange: [number, number];
    condition: string;
  };
}

// Mocking a data hook that accepts filters
const useMarketplaceProducts = (filters: ProductGridProps['filters']) => {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setIsLoading(false);
      const filtered = allMockProducts.filter(product => {
        const matchesSearch = filters.searchQuery ? 
          (product.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) || 
           product.description.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
           product.location.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
           product.category.toLowerCase().includes(filters.searchQuery.toLowerCase())
          ) : true;        
        const matchesCategory = filters.category !== 'all' ? product.category.toLowerCase() === filters.category.toLowerCase() : true;
        
        const matchesPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];

        // Condition filter (not implemented in mock data yet, always true)
        const matchesCondition = filters.condition !== 'all' ? true : true; 

        return matchesSearch && matchesCategory && matchesPrice && matchesCondition;
      });

      setProducts(filtered);

      // Simulate an error occasionally
      // if (Math.random() > 0.9) setError("Failed to fetch products. Please try again.");
      // Simulate empty state
      // setProducts([]);
    }, 1000);
    return () => clearTimeout(timer);
  }, [filters]);

  return { products, isLoading, error };
};


export function ProductGrid({ filters }: ProductGridProps) {
  const { products, isLoading, error } = useMarketplaceProducts(filters);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-background text-foreground p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-3 text-lg text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-background text-foreground p-8">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Products</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-background text-foreground p-8">
        <Alert variant="default" className="w-full max-w-md">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          <AlertTitle>No Products Found</AlertTitle>
          <AlertDescription>
            No products match your current search and filters. Try adjusting your criteria.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product: Product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}