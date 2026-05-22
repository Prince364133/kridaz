const fs = require('fs');
const path = require('path');

const filesToPatch = {
    "client/user/src/shared/components/modals/EditProfileModal.jsx": [
        {
            target: 'import { updateUser } from "../../../redux/slices/authSlice";',
            replacement: 'import { updateUser } from "@redux/slices/authSlice";'
        },
        {
            target: 'import { searchLocations } from "../../utils/locationService";',
            replacement: 'import { searchLocations } from "@utils/locationService";'
        }
    ],
    "client/user/src/features/turf/pages/CheckoutPage.jsx": [
        {
            target: 'import { handlePayment, createOrder } from "../../config/razorpay";',
            replacement: 'import { handlePayment, createOrder } from "@infrastructure/razorpay";'
        }
    ],
    "client/user/src/features/turf/components/TurfDetails.jsx": [
        {
            target: 'import useTurfData from "../../hooks/useTurfData";',
            replacement: 'import useTurfData from "@hooks/useTurfData";'
        },
        {
            target: 'import useReviews from "../../hooks/useReviews";',
            replacement: 'import useReviews from "@hooks/useReviews";'
        },
        {
            target: 'import Reviews from "../reviews/Reviews";',
            replacement: 'import Reviews from "@components/reviews/Reviews";'
        },
        {
            target: 'import useReservation from "../../hooks/useReservation";',
            replacement: 'import useReservation from "@hooks/useReservation";'
        }
    ],
    "client/user/src/features/turf/components/TurfBookingHistory.jsx": [
        {
            target: 'import useBookingHistory from "../../hooks/useBookingHistory";',
            replacement: 'import useBookingHistory from "@hooks/useBookingHistory";'
        },
        {
            target: 'import useWriteReview from "../../hooks/useWriteReview";',
            replacement: 'import useWriteReview from "@hooks/useWriteReview";'
        },
        {
            target: 'import TurfBookingHistorySkeleton from "../../components/ui/TurfBookingHistorySkeleton";',
            replacement: 'import TurfBookingHistorySkeleton from "@components/ui/TurfBookingHistorySkeleton";'
        },
        {
            target: 'import WriteReview from "../../components/reviews/WriteReview";',
            replacement: 'import WriteReview from "@components/reviews/WriteReview";'
        },
        {
            target: 'import RaiseDisputeModal from "../../components/dispute/RaiseDisputeModal";',
            replacement: 'import RaiseDisputeModal from "@components/dispute/RaiseDisputeModal";'
        }
    ],
    "client/user/src/features/turf/components/Turf.jsx": [
        {
            target: 'import useTurfData from "../../hooks/useTurfData.jsx";',
            replacement: 'import useTurfData from "@hooks/useTurfData";'
        }
    ],
    "client/user/src/features/turf/components/BookingPass.jsx": [
        {
            target: 'import useBookingPass from "../../hooks/useBookingPass";',
            replacement: 'import useBookingPass from "@hooks/useBookingPass";'
        }
    ]
};

console.log("================================================================");
console.log("  Relative Imports Patching Execution");
console.log("================================================================");

Object.entries(filesToPatch).forEach(([filePath, replacements]) => {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.warn(`[WARNING] File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let patched = false;

    replacements.forEach(({ target, replacement }) => {
        if (content.includes(target)) {
            content = content.replace(target, replacement);
            console.log(`  [PATCH] ${filePath}:`);
            console.log(`    - FROM: ${target}`);
            console.log(`    - TO:   ${replacement}`);
            patched = true;
        } else {
            console.log(`  [SKIP]  ${filePath}: already patched or target not found for: "${target.substring(0, 30)}..."`);
        }
    });

    if (patched) {
        fs.writeFileSync(fullPath, content, 'utf8');
    }
});

console.log("================================================================");
console.log("  Patching Completed Successfully!");
console.log("================================================================");
