'use client';

/**
 * Animated Price Summary Component
 * Shows booking price with animations
 */

import { useEffect, useState, useRef } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Sparkles, Tag, Percent } from 'lucide-react';

interface PriceSummaryProps {
  basePrice: number;
  slotCount: number;
  currency?: string;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    label?: string;
  };
  className?: string;
}

export function AnimatedPriceSummary({
  basePrice,
  slotCount,
  currency = '₹',
  discount,
  className,
}: PriceSummaryProps) {
  const [displayPrice, setDisplayPrice] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevPriceRef = useRef(0);

  const subtotal = basePrice * slotCount;
  
  let discountAmount = 0;
  if (discount) {
    discountAmount = discount.type === 'percentage' 
      ? (subtotal * discount.value) / 100 
      : discount.value;
  }
  
  const total = Math.max(0, subtotal - discountAmount);

  // Animate price changes
  useEffect(() => {
    if (prevPriceRef.current === total) return;
    
    setIsAnimating(true);
    const startPrice = prevPriceRef.current;
    const endPrice = total;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentPrice = startPrice + (endPrice - startPrice) * eased;
      setDisplayPrice(Math.round(currentPrice));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        prevPriceRef.current = total;
      }
    };

    requestAnimationFrame(animate);
  }, [total]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Slot count */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          {slotCount} slot{slotCount !== 1 ? 's' : ''} × {currency}{basePrice}
        </span>
        <span className="font-medium">{currency}{subtotal.toFixed(2)}</span>
      </div>

      {/* Discount */}
      {discount && discountAmount > 0 && (
        <div className="flex justify-between items-center text-sm text-emerald-600">
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {discount.label || 'Discount'}
            {discount.type === 'percentage' && ` (${discount.value}%)`}
          </span>
          <span>-{currency}{discountAmount.toFixed(2)}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-dashed" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold">Total</span>
        <div className="flex items-center gap-2">
          {slotCount > 1 && (
            <Sparkles className={cn(
              "w-4 h-4 text-amber-500 transition-opacity",
              isAnimating ? "opacity-100" : "opacity-0"
            )} />
          )}
          <span 
            className={cn(
              "text-2xl font-bold transition-all duration-200",
              isAnimating && "scale-110 text-primary"
            )}
          >
            {currency}{displayPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Savings message */}
      {slotCount >= 2 && (
        <div className="text-xs text-emerald-600 bg-emerald-50 rounded-full px-3 py-1 text-center flex items-center justify-center gap-1">
          <Percent className="w-3 h-3" />
          Book {slotCount} slots for better play time!
        </div>
      )}
    </div>
  );
}

export default AnimatedPriceSummary;
