"use client";

import React from "react";
import { Link } from "react-router-dom";
import { usePathname } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { ThemeToggle } from "../theme-toggle";

import { UserNav } from "./UserNav";
import { PartnerApplicationBadge, PartnerApplicationBadgeMobile } from "./PartnerApplicationBadge";
import { cn } from "@/lib/utils";

const navItems = {
  unauthenticated: [
    { href: "/explore", label: "Explore" },
    { href: "/venues", label: "Venues" },
    { href: "/leaderboards", label: "Leaderboards" },
    { href: "/partner", label: "Become a Partner" },
  ],
  authenticated: [
    { href: "/explore", label: "Explore" },
    { href: "/venues", label: "Venues" },
    { href: "/feed", label: "Feed" },
    { href: "/find-players", label: "Find Players" },
    { href: "/host-a-game", label: "Host a Game" },
    { href: "/my-bookings", label: "My Bookings" },
  ],
};

import { toast } from "sonner";

export function PlayerNavbar() {
  const { isAuthenticated, user } = useAuthStatus();
  const pathname = useLocation().pathname;
  const links = isAuthenticated
    ? navItems.authenticated
    : navItems.unauthenticated;

  if (pathname === "/") return null;
    
  const handleVenueDashboardClick = async () => {
    try {
        const response = await fetch(`${config.api.baseUrl}/auth/generate-handoff-token`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ targetApp: 'venue-owner-web' }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate handoff token');
        }
        
        const { token, nonce } = await response.json();
        const venueOwnerUrl = config.urls.venueOwner;
        window.location.href = `${venueOwnerUrl}/auth/sso-handoff?token=${token}&nonce=${nonce}`;
        
    } catch (error) {
        console.error("SSO Handoff Error:", error);
        toast.error("Failed to access Venue Dashboard");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#131313] border-b border-[#292929] h-[72px]">
      <div className="flex h-full items-center justify-between px-6">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          {/* Keeping the logo icon for branding consistency if desired, or just text as per snippet. Snippet only shows text. I'll add the Sparkles icon back if it fits or just stick to text for minimal look. Snippet has no icon. */}
          <span className="text-xl font-bold tracking-tight text-white font-bayon uppercase leading-none">
            Owl Turf
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "font-bayon text-lg font-normal text-white transition-colors duration-200 hover:text-[#A1FF00] tracking-wide",
                pathname === link.href ? "text-[#A1FF00]" : ""
              )}
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
             {/* Keeping functionality like Search/Theme if needed, but per snippet just Auth */}
            <ThemeToggle />
            
            {!isAuthenticated ? (
                <>
                <Link to="/login">
                    <span className="font-bayon text-lg text-white hover:text-[#A1FF00] tracking-wide">
                    LOGIN
                    </span>
                </Link>

                <Link to="/register">
                    <button className="px-5 py-1.5 bg-[#A1FF00] rounded-[8px] hover:bg-[#8BE600] transition-colors">
                    <span className="font-bayon text-lg text-[#101010] leading-none tracking-wide">
                        SIGN UP
                    </span>
                    </button>
                </Link>
                </>
            ) : (
                <div className="flex items-center gap-4">
                   {user?.role === 'VERIFIED_VENUE_OWNER' && (
                       <Button 
                        onClick={handleVenueDashboardClick}
                        className="bg-[#A1FF00] text-[#101010] hover:bg-[#8BE600] font-bayon"
                       >
                           MANAGE MY VENUE
                       </Button>
                   )}
                   <PartnerApplicationBadge />
                   <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hidden md:flex">
                      <Bell className="h-5 w-5" />
                   </Button>
                   <UserNav />
                </div>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <Sheet>
                <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                    <Menu className="h-6 w-6" />
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-xs p-0 bg-[#131313] text-white border-r border-[#292929]">
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-[#292929]">
                            <Link to="/" className="flex items-center">
                            <span className="text-xl font-bold tracking-tight text-white font-bayon uppercase leading-none">
                                Owl Turf
                            </span>
                            </Link>
                        </div>
                        <nav className="flex-1 py-4 overflow-y-auto flex flex-col gap-4 px-4">
                            {links.map((link) => (
                                <Link
                                key={link.href}
                                to={link.href}
                                className={cn(
                                    "font-bayon text-lg font-normal text-white transition-colors duration-200 hover:text-[#A1FF00] tracking-wide",
                                    pathname === link.href ? "text-[#A1FF00]" : ""
                                )}
                                >
                                {link.label.toUpperCase()}
                                </Link>
                            ))}
                            
                            {/* Partner Application Badge for Mobile */}
                            <div className="mt-4 border-t border-[#292929] pt-4">
                              <PartnerApplicationBadgeMobile />
                            </div>
                        </nav>
                        <div className="p-4 border-t border-[#292929]">
                           {!isAuthenticated && (
                              <div className="flex flex-col gap-3">
                                <Link to="/login">
                                   <Button variant="outline" className="w-full font-bayon text-white border-[#292929] hover:bg-[#292929] hover:text-white">LOGIN</Button>
                                </Link>
                                <Link to="/register">
                                   <Button className="w-full bg-[#A1FF00] text-[#101010] hover:bg-[#8BE600] font-bayon">SIGN UP</Button>
                                </Link>
                              </div>
                           )}
                           {isAuthenticated && (
                              <div className="flex flex-col gap-3 justify-center">
                                 {user?.role === 'VERIFIED_VENUE_OWNER' && (
                                   <Button 
                                    onClick={handleVenueDashboardClick}
                                    className="w-full bg-[#A1FF00] text-[#101010] hover:bg-[#8BE600] font-bayon"
                                   >
                                       MANAGE MY VENUE
                                   </Button>
                                 )}
                                 <div className="flex justify-center">
                                     <UserNav />
                                 </div>
                              </div>
                           )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
