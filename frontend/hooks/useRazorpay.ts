import { useState, useEffect } from 'react';

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export function useRazorpay() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if script is already present
    if (document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`)) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError(new Error('Failed to load Razorpay SDK'));

    document.body.appendChild(script);

    return () => {
      // Optional: Cleanup if needed, but usually we keep it once loaded
    };
  }, []);

  return { isLoaded, error };
}
