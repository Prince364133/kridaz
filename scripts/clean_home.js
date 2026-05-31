const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'client', 'user', 'src', 'pages', 'Home.jsx');
let content = fs.readFileSync(homePath, 'utf8');

// Remove unused variables
content = content.replace(/const GRAD = "linear-gradient[^;]+;\n/, '');
content = content.replace(/const S2 = "#1A1A1A";\n/, '');
content = content.replace(/const BDR = "#2A2A2A";\n/, '');

// Remove unused data arrays and functions
content = content.replace(/const stats = \[[\s\S]*?\];\n\n/, '');
content = content.replace(/const socialPosts = \[[\s\S]*?\];\n\n/, '');
content = content.replace(/const comparisonFeatures = \[[\s\S]*?\];\n\n/, '');
content = content.replace(/const features = \[[\s\S]*?\];\n\n/, '');
content = content.replace(/\/\/ player skill levels[\s\S]*?\}\n/g, '');
content = content.replace(/\/\/ initials avatar color[\s\S]*?\|\| "#1a1a1a";\n/g, '');

// The import line has unused icons
content = content.replace(
  /import \{ Search, MapPin, Star, ChevronRight, ArrowRight, Building, Users, User, Calendar, Shield, Trophy, Store, Ticket, Download, CalendarDays, BookOpen, ShoppingBag, Activity, Award, CheckCircle, Heart, MessageCircle, MessageSquare, MessageSquareShare, Share2, Info, Check, X, RefreshCcw, Timer, Zap, Plus, Loader2, LayoutGrid, Video, Play \} from "lucide-react";/,
  'import { Search, MapPin, Star, ChevronRight, ArrowRight, Building, Users, User, Calendar, Shield, Trophy, Store, Ticket, Download, CalendarDays, BookOpen, ShoppingBag, Activity, Award } from "lucide-react";'
);

// We still have TurfCard, TurfCardMobile, SearchPlayers, SearchTurf, VideoSection that are unused
content = content.replace(/import TurfCard from "\.\.\/features\/turf\/components\/TurfCard";\n/, '');
content = content.replace(/import TurfCardMobile from "\.\.\/features\/turf\/components\/TurfCardMobile";\n/, '');
content = content.replace(/import SearchPlayers from "\.\.\/shared\/components\/search\/SearchPlayers";\n/, '');
content = content.replace(/import SearchTurf from "\.\.\/shared\/components\/search\/SearchTurf";\n/, '');
content = content.replace(/import \{ VideoSection \} from "\.\.\/shared\/components\/Marketing\/VideoSection";\n/, '');

// Unused navigate inside Home? Actually, navigate might still be used inside Home.jsx ?
// Let's check: navigate is used in activeReel or Community ? No, navigate is probably unused in Home now since we extracted the sections.

fs.writeFileSync(homePath, content, 'utf8');
console.log('Cleaned up unused variables in Home.jsx');
