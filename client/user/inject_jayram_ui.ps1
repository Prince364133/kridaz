<#
.SYNOPSIS
    Safely extract UI-only updates from origin/Jay-Shreeram → version3 paths.
    
.DESCRIPTION
    This script reads file content from the Jay-Shreeram branch using `git show`,
    applies import alias fixes for version3 compatibility, and writes the files
    to the correct feature-based folder structure.
    
    SAFETY: No backend files are touched. Only client/user/src/ UI files.

.NOTES
    Run from the repo root: C:\Users\saavi\OneDrive\Desktop\kridaz\kridaz
#>

param(
    [string]$SourceBranch = "origin/Jay-Shreeram",
    [string]$RepoRoot = "C:\Users\saavi\OneDrive\Desktop\kridaz\kridaz"
)

$ErrorActionPreference = "Continue"

# ═══════════════════════════════════════════════════════════════════
# FILE MAPPING: Jay-Shreeram path → version3 path (all relative to repo root)
# ═══════════════════════════════════════════════════════════════════

$fileMap = [ordered]@{

    # ── CSS / Design Tokens (SKIP — will be merged manually) ──
    # "client/user/src/user/index.css" = "MANUAL_MERGE"

    # ── Top-level pages ──
    "client/user/src/user/pages/Home.jsx"                     = "client/user/src/pages/Home.jsx"
    "client/user/src/user/pages/TeamPass.jsx"                 = "client/user/src/pages/TeamPass.jsx"
    "client/user/src/user/pages/BookingPass.jsx"              = "client/user/src/pages/BookingPass.jsx"

    # ── Auth feature ──
    "client/user/src/user/pages/auth/Login.jsx"               = "client/user/src/features/auth/pages/Login.jsx"
    "client/user/src/user/pages/auth/SignUp.jsx"              = "client/user/src/features/auth/pages/SignUp.jsx"
    "client/user/src/user/pages/auth/ForgotPassword.jsx"     = "client/user/src/features/auth/pages/ForgotPassword.jsx"
    "client/user/src/user/pages/auth/VenueOwnerSignUp.jsx"   = "client/user/src/features/auth/pages/VenueOwnerSignUp.jsx"
    "client/user/src/pages/CoachSignUp.jsx"                   = "client/user/src/features/auth/pages/CoachSignUp.jsx"
    "client/user/src/pages/ScorerSignUp.jsx"                  = "client/user/src/features/auth/pages/ScorerSignUp.jsx"
    "client/user/src/pages/VenueOwnerSignUp.jsx"              = "client/user/src/features/auth/pages/VenueOwnerSignUp.jsx"
    "client/user/src/user/components/auth/GoogleAuthButton.jsx" = "client/user/src/features/auth/components/GoogleAuthButton.jsx"

    # ── Networking feature (FindPlayers, Community, FindProfessionals) ──
    "client/user/src/user/pages/FindPlayers.jsx"              = "client/user/src/features/networking/pages/FindPlayers.jsx"
    "client/user/src/user/pages/FindProfessionals.jsx"        = "client/user/src/features/networking/pages/FindProfessionals.jsx"
    "client/user/src/user/pages/Community.jsx"                = "client/user/src/features/networking/pages/Community.jsx"
    "client/user/src/user/pages/ProfessionalDetails.jsx"      = "client/user/src/features/networking/pages/ProfessionalDetails.jsx"
    "client/user/src/user/components/StoryViewer.jsx"          = "client/user/src/features/networking/components/StoryViewer.jsx"
    "client/user/src/user/components/discovery/DiscoveryMapShell.jsx" = "client/user/src/shared/components/discovery/DiscoveryMapShell.jsx"
    "client/user/src/user/components/discovery/PlayerMap.jsx"  = "client/user/src/shared/components/discovery/PlayerMap.jsx"
    "client/user/src/user/components/map/NearbyPlayersMap.jsx" = "client/user/src/shared/components/map/NearbyPlayersMap.jsx"

    # ── Games feature ──
    "client/user/src/user/pages/HostGame.jsx"                 = "client/user/src/features/games/pages/HostGame.jsx"
    "client/user/src/user/pages/JoinGames.jsx"                = "client/user/src/features/games/pages/JoinGames.jsx"
    "client/user/src/user/pages/MyJoinedGames.jsx"            = "client/user/src/features/games/pages/MyJoinedGames.jsx"
    "client/user/src/user/pages/MatchDetails.jsx"             = "client/user/src/features/games/pages/MatchDetails.jsx"

    # ── Leaderboard feature ──
    "client/user/src/user/pages/Leaderboard.jsx"              = "client/user/src/features/leaderboard/pages/Leaderboard.jsx"

    # ── Scoring feature ──
    "client/user/src/user/pages/MatchAnalytics.jsx"           = "client/user/src/features/scoring/pages/MatchAnalytics.jsx"
    "client/user/src/user/components/scoring/ExtraRunsModal.jsx" = "client/user/src/features/scoring/components/ExtraRunsModal.jsx"

    # ── Teams feature ──
    "client/user/src/user/pages/TeamProfile.jsx"              = "client/user/src/features/teams/pages/TeamProfile.jsx"
    "client/user/src/user/components/teams/AddOpponentModal.jsx"  = "client/user/src/features/teams/components/AddOpponentModal.jsx"
    "client/user/src/user/components/teams/TeamDetails.jsx"       = "client/user/src/features/teams/components/TeamDetails.jsx"
    "client/user/src/user/components/teams/TeamMembersModal.jsx"  = "client/user/src/features/teams/components/TeamMembersModal.jsx"
    "client/user/src/user/components/teams/TeamSidebar.jsx"       = "client/user/src/features/teams/components/TeamSidebar.jsx"

    # ── Profile feature ──
    "client/user/src/user/pages/Profile.jsx"                  = "client/user/src/features/profile/pages/Profile.jsx"

    # ── Wallet feature ──
    "client/user/src/user/pages/Wallet.jsx"                   = "client/user/src/features/wallet/pages/Wallet.jsx"

    # ── Turf feature ──
    "client/user/src/user/components/turf/Turf.jsx"           = "client/user/src/features/turf/components/Turf.jsx"
    "client/user/src/user/components/turf/TurfCard.jsx"       = "client/user/src/features/turf/components/TurfCard.jsx"
    "client/user/src/user/components/turf/TurfDetails.jsx"    = "client/user/src/features/turf/components/TurfDetails.jsx"
    "client/user/src/user/components/turf/TurfBookingHistory.jsx" = "client/user/src/features/turf/components/TurfBookingHistory.jsx"
    "client/user/src/user/components/turf/BookingPass.jsx"    = "client/user/src/features/turf/components/BookingPass.jsx"
    "client/user/src/user/pages/BookingInvoice.jsx"           = "client/user/src/features/turf/pages/BookingInvoice.jsx"
    "client/user/src/user/pages/checkout/CheckoutPage.jsx"    = "client/user/src/features/turf/pages/CheckoutPage.jsx"
    "client/user/src/user/components/ui/TurfDetailsSkeleton.jsx" = "client/user/src/features/turf/ui/TurfDetailsSkeleton.jsx"

    # ── Reels feature ──
    "client/user/src/user/pages/reels/ReelsFeed.jsx"          = "client/user/src/features/reels/pages/ReelsFeed.jsx"
    "client/user/src/user/pages/reels/ReelAnalytics.jsx"      = "client/user/src/features/reels/pages/ReelAnalytics.jsx"
    "client/user/src/user/pages/reels/UploadReel.jsx"         = "client/user/src/features/reels/pages/UploadReel.jsx"

    # ── Business / Landing pages ──
    "client/user/src/user/pages/business/CoachLanding.jsx"         = "client/user/src/features/business/pages/CoachLanding.jsx"
    "client/user/src/user/pages/business/VenueOwnerLanding.jsx"    = "client/user/src/features/business/pages/VenueOwnerLanding.jsx"
    "client/user/src/user/pages/business/UmpireLanding.jsx"        = "client/user/src/features/business/pages/UmpireLanding.jsx"
    "client/user/src/user/pages/business/ScorerLanding.jsx"        = "client/user/src/features/business/pages/ScorerLanding.jsx"
    "client/user/src/user/pages/business/StreamerLanding.jsx"      = "client/user/src/features/business/pages/StreamerLanding.jsx"
    "client/user/src/user/pages/business/BusinessRegistration.jsx" = "client/user/src/features/business/pages/BusinessRegistration.jsx"
    "client/user/src/pages/PartnersGateway.jsx"                    = "client/user/src/features/auth/pages/PartnersGateway.jsx"

    # ── Blogs ──
    "client/user/src/user/pages/Blogs.jsx"                    = "client/user/src/features/blogs/pages/Blogs.jsx"
    "client/user/src/user/pages/BlogDetail.jsx"               = "client/user/src/features/blogs/pages/BlogDetail.jsx"
    "client/user/src/user/components/Blogs/BlogSection.jsx"   = "client/user/src/shared/components/Blogs/BlogSection.jsx"

    # ── Legal pages ──
    "client/user/src/user/pages/legal/DataDeletionInstructions.jsx" = "client/user/src/features/legal/pages/DataDeletionInstructions.jsx"
    "client/user/src/user/pages/legal/PrivacyPolicy.jsx"      = "client/user/src/features/legal/pages/PrivacyPolicy.jsx"
    "client/user/src/user/pages/legal/TermsOfService.jsx"     = "client/user/src/features/legal/pages/TermsOfService.jsx"

    # ── Marketplace ──
    "client/user/src/user/pages/MarketplaceComingSoon.jsx"    = "client/user/src/pages/MarketplaceComingSoon.jsx"

    # ── Chat / Messages components ──
    "client/user/src/user/components/messages/ChatSidebar.jsx"            = "client/user/src/features/chat/components/ChatSidebar.jsx"
    "client/user/src/user/components/messages/ChatWindow.jsx"             = "client/user/src/features/chat/components/ChatWindow.jsx"
    "client/user/src/user/components/messages/AddGroupToCommunityModal.jsx" = "client/user/src/features/chat/components/AddGroupToCommunityModal.jsx"
    "client/user/src/user/components/messages/CreateCommunityModal.jsx"   = "client/user/src/features/chat/components/CreateCommunityModal.jsx"
    "client/user/src/user/components/messages/CreateGroupModal.jsx"       = "client/user/src/features/chat/components/CreateGroupModal.jsx"
    "client/user/src/user/components/messages/GroupInfoModal.jsx"         = "client/user/src/features/chat/components/GroupInfoModal.jsx"

    # ── Shared layout components ──
    "client/user/src/user/components/layout/Navbar.jsx"          = "client/user/src/shared/components/layout/Navbar.jsx"
    "client/user/src/user/components/layout/MobileBottomNav.jsx" = "client/user/src/shared/components/layout/MobileBottomNav.jsx"
    "client/user/src/user/components/layout/Footer.jsx"          = "client/user/src/shared/components/layout/Footer.jsx"
    "client/user/src/user/components/layout/UserFooter.jsx"      = "client/user/src/shared/components/layout/UserFooter.jsx"

    # ── Shared modals ──
    "client/user/src/user/components/modals/CoinDeductionModal.jsx" = "client/user/src/shared/components/modals/CoinDeductionModal.jsx"
    "client/user/src/user/components/modals/ConfirmModal.jsx"       = "client/user/src/shared/components/modals/ConfirmModal.jsx"
    "client/user/src/user/components/modals/EditProfileModal.jsx"   = "client/user/src/shared/components/modals/EditProfileModal.jsx"
    "client/user/src/user/components/modals/ForwardModal.jsx"       = "client/user/src/shared/components/modals/ForwardModal.jsx"
    "client/user/src/user/components/modals/InterestsModal.jsx"     = "client/user/src/shared/components/modals/InterestsModal.jsx"
    "client/user/src/user/components/modals/LoginModal.jsx"         = "client/user/src/shared/components/modals/LoginModal.jsx"
    "client/user/src/user/components/modals/NetworkModal.jsx"       = "client/user/src/shared/components/modals/NetworkModal.jsx"
    "client/user/src/user/components/modals/OnboardingModal.jsx"    = "client/user/src/shared/components/modals/OnboardingModal.jsx"
    "client/user/src/user/components/modals/ShareTurfModal.jsx"     = "client/user/src/shared/components/modals/ShareTurfModal.jsx"

    # ── Shared common components ──
    "client/user/src/user/components/common/Carousel.jsx"        = "client/user/src/shared/components/common/Carousel.jsx"
    "client/user/src/user/components/common/ErrorBoundary.jsx"   = "client/user/src/shared/components/common/ErrorBoundary.jsx"
    "client/user/src/user/components/BackgroundUploadManager.jsx" = "client/user/src/shared/components/common/BackgroundUploadManager.jsx"

    # ── Shared search ──
    "client/user/src/user/components/search/SearchPlayers.jsx"   = "client/user/src/shared/components/search/SearchPlayers.jsx"
    "client/user/src/user/components/search/SearchTurf.jsx"      = "client/user/src/features/turf/search/SearchTurf.jsx"

    # ── Shared reviews ──
    "client/user/src/user/components/reviews/Reviews.jsx"        = "client/user/src/shared/components/reviews/Reviews.jsx"
    "client/user/src/user/components/reviews/WriteReview.jsx"    = "client/user/src/shared/components/reviews/WriteReview.jsx"

    # ── Shared dispute ──
    "client/user/src/user/components/dispute/RaiseDisputeModal.jsx" = "client/user/src/shared/components/dispute/RaiseDisputeModal.jsx"

    # ── Shared Marketing ──
    "client/user/src/user/components/Marketing/AdBannerSection.jsx" = "client/user/src/shared/components/Marketing/AdBannerSection.jsx"
    "client/user/src/user/components/Marketing/VideoSection.jsx"    = "client/user/src/shared/components/Marketing/VideoSection.jsx"

    # ── Partner / owner components (from old structure) ──
    "client/user/src/components/owner/Dashboard/OwnerDashboard.jsx"    = "client/user/src/features/venue-owner/Dashboard/OwnerDashboard.jsx"
    "client/user/src/components/owner/Dashboard/OccupancyHeatmap.jsx"  = "client/user/src/features/venue-owner/Dashboard/OccupancyHeatmap.jsx"
    "client/user/src/components/owner/Dashboard/PeakHoursChart.jsx"    = "client/user/src/features/venue-owner/Dashboard/PeakHoursChart.jsx"
    "client/user/src/components/owner/Bookings/OwnerBookings.jsx"      = "client/user/src/features/venue-owner/Bookings/OwnerBookings.jsx"
    "client/user/src/components/owner/Calendar/OwnerCalendar.jsx"      = "client/user/src/features/venue-owner/Calendar/OwnerCalendar.jsx"
    "client/user/src/components/owner/Customers/CustomerDirectory.jsx" = "client/user/src/features/venue-owner/Customers/CustomerDirectory.jsx"
    "client/user/src/components/owner/Revenue/OwnerRevenue.jsx"        = "client/user/src/features/venue-owner/Revenue/OwnerRevenue.jsx"
    "client/user/src/components/owner/Review/OwnerReviews.jsx"         = "client/user/src/features/venue-owner/Review/OwnerReviews.jsx"
    "client/user/src/components/owner/Support/PartnerSupport.jsx"      = "client/user/src/features/venue-owner/Support/PartnerSupport.jsx"
    "client/user/src/components/owner/Promotions/OwnerPromotions.jsx"  = "client/user/src/features/venue-owner/Promotions/OwnerPromotions.jsx"
    "client/user/src/components/owner/Intelligence/VenueIntelligence.jsx" = "client/user/src/features/venue-owner/Intelligence/VenueIntelligence.jsx"
    "client/user/src/components/owner/ManualBookingModal.jsx"          = "client/user/src/features/venue-owner/ManualBookingModal.jsx"
    "client/user/src/components/owner/TurfManagement/AddTurf.jsx"      = "client/user/src/features/venue-owner/TurfManagement/AddTurf.jsx"
    "client/user/src/components/owner/TurfManagement/EditTurf.jsx"     = "client/user/src/features/venue-owner/TurfManagement/EditTurf.jsx"
    "client/user/src/components/owner/TurfManagement/EditTurfForm.jsx" = "client/user/src/features/venue-owner/TurfManagement/EditTurfForm.jsx"
    "client/user/src/components/owner/TurfManagement/TurfCard.jsx"     = "client/user/src/features/venue-owner/TurfManagement/TurfCard.jsx"
    "client/user/src/components/owner/TurfManagement/TurfCardSkeleton.jsx" = "client/user/src/features/venue-owner/TurfManagement/TurfCardSkeleton.jsx"
    "client/user/src/components/owner/TurfManagement/TurfDetails.jsx"  = "client/user/src/features/venue-owner/TurfManagement/TurfDetails.jsx"
    "client/user/src/components/owner/TurfManagement/TurfManagement.jsx" = "client/user/src/features/venue-owner/TurfManagement/TurfManagement.jsx"
    "client/user/src/components/owner/Banking/PayoutBanking.jsx"       = "client/user/src/features/venue-owner/Banking/PayoutBanking.jsx"

    # ── Coach components ──
    "client/user/src/components/coach/CoachDashboard.jsx"      = "client/user/src/features/coach/CoachDashboard.jsx"
    "client/user/src/components/coach/CoachSessions.jsx"       = "client/user/src/features/coach/CoachSessions.jsx"
    "client/user/src/components/coach/CoachStudents.jsx"       = "client/user/src/features/coach/CoachStudents.jsx"
    "client/user/src/components/coach/CoachAvailability.jsx"   = "client/user/src/features/coach/CoachAvailability.jsx"
    "client/user/src/components/coach/CoachBookings.jsx"       = "client/user/src/features/coach/CoachBookings.jsx"
    "client/user/src/components/coach/CoachMasterclass.jsx"    = "client/user/src/features/coach/CoachMasterclass.jsx"
    "client/user/src/components/coach/CoachReviews.jsx"        = "client/user/src/features/coach/CoachReviews.jsx"

    # ── Umpire components ──
    "client/user/src/components/umpire/UmpireDashboard.jsx"    = "client/user/src/features/umpire/UmpireDashboard.jsx"
    "client/user/src/components/umpire/UmpireMatches.jsx"      = "client/user/src/features/umpire/UmpireMatches.jsx"
    "client/user/src/components/umpire/UmpireSchedule.jsx"     = "client/user/src/features/umpire/UmpireSchedule.jsx"

    # ── Professional components ──
    "client/user/src/components/professional/ProfessionalAvailability.jsx" = "client/user/src/features/networking/components/professional/ProfessionalAvailability.jsx"
    "client/user/src/components/professional/ProfessionalBookings.jsx"     = "client/user/src/features/networking/components/professional/ProfessionalBookings.jsx"
    "client/user/src/components/professional/ProfessionalProfile.jsx"      = "client/user/src/features/networking/components/professional/ProfessionalProfile.jsx"
    "client/user/src/components/professional/ProfessionalReviews.jsx"      = "client/user/src/features/networking/components/professional/ProfessionalReviews.jsx"

    # ── Shared components (old structure → shared) ──
    "client/user/src/components/shared/ConfirmationModal.jsx"  = "client/user/src/shared/components/shared/ConfirmationModal.jsx"
    "client/user/src/components/shared/DashboardProfile.jsx"   = "client/user/src/shared/components/shared/DashboardProfile.jsx"
    "client/user/src/components/common/Carousel.jsx"           = "client/user/src/shared/components/common/Carousel.jsx"
    "client/user/src/components/common/ClockPicker.jsx"        = "client/user/src/shared/components/common/ClockPicker.jsx"
    "client/user/src/components/common/ErrorBoundary.jsx"      = "client/user/src/shared/components/common/ErrorBoundary.jsx"
    "client/user/src/components/common/FileUpload.jsx"         = "client/user/src/shared/components/common/FileUpload.jsx"
    "client/user/src/components/common/ReelItem.jsx"           = "client/user/src/features/reels/components/ReelItem.jsx"

    # ── Layout components (old structure → shared/layout) ──
    "client/user/src/components/layout/AdminSidebar.jsx"       = "client/user/src/shared/components/layout/AdminSidebar.jsx"
    "client/user/src/components/layout/AuthenticatedNavbar.jsx" = "client/user/src/shared/components/layout/AuthenticatedNavbar.jsx"
    "client/user/src/components/layout/CoachSidebar.jsx"       = "client/user/src/shared/components/layout/CoachSidebar.jsx"
    "client/user/src/components/layout/GuestNavbar.jsx"        = "client/user/src/shared/components/layout/GuestNavbar.jsx"
    "client/user/src/components/layout/OwnerSidebar.jsx"       = "client/user/src/shared/components/layout/OwnerSidebar.jsx"
    "client/user/src/components/layout/PartnerFooter.jsx"      = "client/user/src/shared/components/layout/PartnerFooter.jsx"
    "client/user/src/components/layout/UmpireSidebar.jsx"      = "client/user/src/shared/components/layout/UmpireSidebar.jsx"

    # ── GuestLayout ──
    "client/user/src/layouts/GuestLayout.jsx"                  = "client/user/src/layouts/GuestLayout.jsx"
}

# ═══════════════════════════════════════════════════════════════════
# COUNTERS
# ═══════════════════════════════════════════════════════════════════
$injected = 0
$skipped  = 0
$failed   = 0
$total    = $fileMap.Count

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Jay-Shreeram UI Injection Script" -ForegroundColor Cyan
Write-Host "  Source: $SourceBranch" -ForegroundColor DarkCyan
Write-Host "  Target: version3 feature-based structure" -ForegroundColor DarkCyan
Write-Host "  Files to process: $total" -ForegroundColor DarkCyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

foreach ($entry in $fileMap.GetEnumerator()) {
    $srcPath  = $entry.Key
    $destRel  = $entry.Value
    $destPath = Join-Path $RepoRoot $destRel

    # Skip manual-merge entries
    if ($destRel -eq "MANUAL_MERGE") {
        Write-Host "  [SKIP] $srcPath (requires manual merge)" -ForegroundColor Yellow
        $skipped++
        continue
    }

    # Extract file content from branch
    $content = git -C $RepoRoot show "${SourceBranch}:${srcPath}" 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [MISS] $srcPath (not found in branch)" -ForegroundColor Red
        $failed++
        continue
    }

    # Ensure destination directory exists
    $destDir = Split-Path $destPath -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        Write-Host "  [DIR+] Created: $destDir" -ForegroundColor Yellow
    }

    # Write file content
    # Using Out-File with UTF8 encoding to preserve content
    $content | Out-File -FilePath $destPath -Encoding utf8 -Force

    Write-Host "  [OK]   $srcPath" -ForegroundColor Green
    Write-Host "         -> $destRel" -ForegroundColor DarkGreen
    $injected++
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  INJECTION COMPLETE" -ForegroundColor Green
Write-Host "  Injected: $injected / $total" -ForegroundColor Green
Write-Host "  Skipped:  $skipped" -ForegroundColor Yellow
Write-Host "  Failed:   $failed" -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor White
Write-Host "  1. Manually merge index.css design tokens" -ForegroundColor DarkGray
Write-Host "  2. Run import alias verification grep" -ForegroundColor DarkGray
Write-Host "  3. Run pnpm dev to validate" -ForegroundColor DarkGray
