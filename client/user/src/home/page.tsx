'use client';
import React from 'react';
import AllinOneBanner from './main/AllinOneBanner';
import PlatformQuickLinks from './main/PlatformQuickLinks';
import PlayerCarousel from './main/PlayerCarousel';
import BlogsArticles from './main/BlogsArticles';
import PlayersBanner from './main/PlayersBanner';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { PremiumHero } from './main/PremiumHero';
import { FeatureNav } from './main/FeatureNav';
import { FeatureGrid } from './main/FeatureGrid';
import EventBanner from './main/EventBanner';
import JoinGamesSection from './main/JoinGamesSection';
import FindPlayersSection from './main/FindPlayersSection';
import FindProsSection from './main/FindProsSection';
import GroundsSection from './main/GroundsSection';
import Bookplayrepeat from './main/Bookplayrepeat';
import VenueLinksSection from './main/VenueLinksSection';

const SportzLandingPage = () => {
  return (
    <div className="relative">
      <LandingHeader />
      <PremiumHero />
      <FeatureNav />
      <FeatureGrid />
      <EventBanner />
      <GroundsSection />
      <JoinGamesSection />
      <FindPlayersSection />
      <FindProsSection />
      <AllinOneBanner/>
      <PlatformQuickLinks />
      <PlayerCarousel/>
      <BlogsArticles />
      <PlayersBanner />
      {/* <Additional/> */}
      <Bookplayrepeat/>
      <VenueLinksSection />
    </div>
  );
};

export default SportzLandingPage;
