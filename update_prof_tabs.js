const fs = require('fs');
let c = fs.readFileSync('client/user/src/features/networking/pages/ProfessionalDetails.jsx', 'utf8');

c = c.replace(
  '<div className="lg:col-span-8 space-y-8">',
  '<div className={activeTab === "overview" ? "lg:col-span-8 space-y-8" : "lg:col-span-12 space-y-8"}>'
);

c = c.replace(
  '{/* Right Column: Matchmaking CTA Card */}\n          <div className="lg:col-span-4">',
  '{/* Right Column: Matchmaking CTA Card */}\n          {activeTab === "overview" && (\n            <div className="lg:col-span-4">'
);

c = c.replace(
  '            </div>\n          </div>\n        </div>\n      </div>\n\n      {/* Premium Lightbox Media Modal */}',
  '            </div>\n          </div>\n          )}\n        </div>\n      </div>\n\n      {/* Premium Lightbox Media Modal */}'
);

fs.writeFileSync('client/user/src/features/networking/pages/ProfessionalDetails.jsx', c);
console.log('done');
