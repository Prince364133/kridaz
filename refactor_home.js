const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'client', 'user', 'src', 'pages', 'Home.jsx');
let content = fs.readFileSync(homePath, 'utf8');

// Imports to add
const imports = `import DashboardHero from "./HomeSections/DashboardHero";
import VenuesSection from "./HomeSections/VenuesSection";
import PlayersSection from "./HomeSections/PlayersSection";
import SocialArenaSection from "./HomeSections/SocialArenaSection";
import JoinGamesSection from "./HomeSections/JoinGamesSection";
import ProfessionalsSection from "./HomeSections/ProfessionalsSection";
`;

content = content.replace('import { Search, MapPin', imports + 'import { Search, MapPin');

// 1. DashboardHero
content = content.replace(
  /<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 w-full">[\s\S]*?<\/div>\s*\{\/\* ── AD BANNERS/,
  `<DashboardHero />\n\n      {/* ── AD BANNERS`
);

// 2. VenuesSection
content = content.replace(
  /\{\/\* ── FIND YOUR ARENA ── \*\/\}[\s\S]*?<\/section>\s*\{\/\* ── FIND PLAYERS NEAR YOU ── \*\/\}/,
  `{/* ── FIND YOUR ARENA ── */}
  <VenuesSection
    userLocation={userLocation}
    loading={loading}
    turfLoading={turfLoading}
    error={error}
    displayTurfs={displayTurfs}
    setTurfFilters={setTurfFilters}
  />

  {/* ── FIND PLAYERS NEAR YOU ── */}`
);

// 3. PlayersSection
content = content.replace(
  /\{\/\* ── FIND PLAYERS NEAR YOU ── \*\/\}[\s\S]*?<\/section>\s*\{\/\* ── SOCIAL ARENA ── \*\/\}/,
  `{/* ── FIND PLAYERS NEAR YOU ── */}
  <PlayersSection
    loading={loading}
    players={players}
    followingIds={followingIds}
    handleFollowToggle={handleFollowToggle}
  />

  {/* ── SOCIAL ARENA ── */}`
);

// 4. SocialArenaSection
content = content.replace(
  /\{\/\* ── SOCIAL ARENA ── \*\/\}[\s\S]*?<\/section>\s*\{\/\* ── JOIN GAMES NEAR YOU \(Feature Flag\) ── \*\/\}/,
  `{/* ── SOCIAL ARENA ── */}
  <SocialArenaSection reelsFeed={reelsFeed} />

  {/* ── JOIN GAMES NEAR YOU (Feature Flag) ── */}`
);

// 5. JoinGamesSection
content = content.replace(
  /\{\/\* ── JOIN GAMES NEAR YOU \(Feature Flag\) ── \*\/\}[\s\S]*?<\/section>\s*\)}/,
  `{/* ── JOIN GAMES NEAR YOU (Feature Flag) ── */}
  <JoinGamesSection
    featureFlags={featureFlags}
    selectedHomeState={selectedHomeState}
    setSelectedHomeState={setSelectedHomeState}
    selectedHomeCity={selectedHomeCity}
    setSelectedHomeCity={setSelectedHomeCity}
    states={states}
    loadingStates={loadingStates}
    cities={cities}
    loadingCities={loadingCities}
    selectedGameSport={selectedGameSport}
    setSelectedGameSport={setSelectedGameSport}
    hostedGames={hostedGames}
    hostedGamesLoading={hostedGamesLoading}
  />
  )}`
);

// 6. ProfessionalsSection
content = content.replace(
  /\{\/\* ── PRO EXPERTS ── \*\/\}[\s\S]*?<\/section>/,
  `{/* ── PRO EXPERTS ── */}
  <ProfessionalsSection
    featureFlags={featureFlags}
    professionals={professionals}
    professionalsLoading={professionalsLoading}
  />`
);

fs.writeFileSync(homePath, content, 'utf8');
console.log('Successfully refactored Home.jsx');
