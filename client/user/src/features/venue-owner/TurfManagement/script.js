const fs = require('fs');
const path = 'd:/Kridaz/kridaz/client/user/src/features/venue-owner/TurfManagement/AddTurf.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Subheading size
content = content.replace(
  '<p className=\"text-[#878C9F] font-inter text-[20px] mt-2 ml-4\">',
  '<p className=\"text-[#878C9F] font-inter font-light text-[12px] md:text-[20px] mt-2 ml-4\">'
);

// 2. Flatten grid layout for Step 1
const startStr = '{/* STEP 1: General Information */}';
const endStr = '{/* STEP 2: Legalities & Management */}';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    
    let step1Block = content.substring(startIndex, endIndex);
    
    step1Block = step1Block.replace(
      '<div className=\"col-span-1 grid grid-cols-2 gap-3 md:gap-12 relative z-10 animate-fade-in\">\\n              <div className=\"space-y-4 md:space-y-8\">',
      '<div className=\"col-span-1 grid grid-cols-2 gap-x-3 gap-y-4 md:gap-x-12 md:gap-y-8 relative z-10 animate-fade-in\">'
    );
    
    step1Block = step1Block.replace(
      '</div>\\n\\n              <div className=\"space-y-4 md:space-y-8\">',
      ''
    );
    
    // Replace form-controls with col-span classes
    step1Block = step1Block.replace(/<div className=\"form-control\">\\s*<label className=\"label mb-2\"><span className=\"text-\\[8px\\] md:text-\\[11px\\] font-bold text-\\[#878C9F\\] uppercase tracking-widest ml-1\">\\{watchedFacilityCategory\\} Name/g, '<div className=\"form-control col-span-1\">\\n                  <label className=\"label mb-2\"><span className=\"text-[8px] md:text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1\">{watchedFacilityCategory} Name');
    step1Block = step1Block.replace(/<div className=\"form-control\">\\s*<label className=\"label mb-2\"><span className=\"text-\\[8px\\] md:text-\\[11px\\] font-bold text-\\[#878C9F\\] uppercase tracking-widest ml-1\">Facility Category/g, '<div className=\"form-control col-span-1\">\\n                  <label className=\"label mb-2\"><span className=\"text-[8px] md:text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1\">Facility Category');
    step1Block = step1Block.replace(/<div className=\"form-control\">\\s*<label className=\"label mb-2\"><span className=\"text-\\[8px\\] md:text-\\[11px\\] font-bold text-\\[#878C9F\\] uppercase tracking-widest ml-1\">YouTube Video URL/g, '<div className=\"form-control col-span-1\">\\n                  <label className=\"label mb-2\"><span className=\"text-[8px] md:text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1\">YouTube Video URL');
    
    step1Block = step1Block.replace(/<div className=\"form-control\">\\s*<label className=\"label mb-2\"><span className=\"text-\\[8px\\] md:text-\\[11px\\] font-bold text-\\[#878C9F\\] uppercase tracking-widest ml-1\">Sport Arsenal/g, '<div className=\"form-control col-span-1\">\\n                  <label className=\"label mb-2\"><span className=\"text-[8px] md:text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1\">Sport Arsenal');
    step1Block = step1Block.replace(/<div className=\"form-control\">\\s*<label className=\"label mb-2\"><span className=\"text-\\[8px\\] md:text-\\[11px\\] font-bold text-\\[#878C9F\\] uppercase tracking-widest ml-1\">Ground Composition/g, '<div className=\"form-control col-span-1\">\\n                  <label className=\"label mb-2\"><span className=\"text-[8px] md:text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1\">Ground Composition');
    step1Block = step1Block.replace(/<div className=\"form-control\">\\s*<label className=\"label mb-2\"><span className=\"text-\\[8px\\] md:text-\\[11px\\] font-bold text-\\[#878C9F\\] uppercase tracking-widest ml-1\">Direct Google Maps URL/g, '<div className=\"form-control col-span-1\">\\n                  <label className=\"label mb-2\"><span className=\"text-[8px] md:text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1\">Direct Google Maps URL');
    
    step1Block = step1Block.replace(/<div className=\"form-control\">\\s*<label className=\"label mb-2\"><span className=\"text-\\[8px\\] md:text-\\[11px\\] font-bold text-\\[#878C9F\\] uppercase tracking-widest ml-1\">Facility Description/g, '<div className=\"form-control col-span-2\">\\n                  <label className=\"label mb-2\"><span className=\"text-[8px] md:text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1\">Facility Description');
    step1Block = step1Block.replace(/<div className=\"form-control\">\\s*<label className=\"label mb-2\">\\s*<span className=\"text-\\[8px\\] md:text-\\[11px\\] font-bold text-\\[#878C9F\\] uppercase tracking-widest ml-1\">Facility Images/g, '<div className=\"form-control col-span-2\">\\n                  <label className=\"label mb-2\">\\n                    <span className=\"text-[8px] md:text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1\">Facility Images');
    step1Block = step1Block.replace(/<div className=\"form-control relative\">\\s*<label className=\"label mb-2\"><span className=\"text-\\[8px\\] md:text-\\[11px\\] font-bold text-\\[#878C9F\\] uppercase tracking-widest ml-1\">Search Location/g, '<div className=\"form-control relative col-span-2\">\\n                  <label className=\"label mb-2\"><span className=\"text-[8px] md:text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1\">Search Location');
    step1Block = step1Block.replace(/<div className=\"form-control\">\\s*<label className=\"label mb-4\"><span className=\"text-\\[8px\\] md:text-\\[11px\\] font-bold text-\\[#878C9F\\] uppercase tracking-widest ml-1 flex items-center gap-2\">?? Map Preview/g, '<div className=\"form-control col-span-2\">\\n                    <label className=\"label mb-4\"><span className=\"text-[8px] md:text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center gap-2\">?? Map Preview');
    step1Block = step1Block.replace(/<div className=\"form-control\">\\s*<label className=\"label mb-2\"><span className=\"text-\\[8px\\] md:text-\\[11px\\] font-bold text-\\[#878C9F\\] uppercase tracking-widest ml-1\">Facilities/g, '<div className=\"form-control col-span-2\">\\n                  <label className=\"label mb-2\"><span className=\"text-[8px] md:text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1\">Facilities');

    // Remove the extra closing div of Column 2
    step1Block = step1Block.replace(/\\n              <\\/div>\\n            <\\/div>\\n          \\)}\\n/g, '\\n            </div>\\n          )}\\n');

    content = before + step1Block + after;
    fs.writeFileSync(path, content, 'utf8');
    console.log('Update complete');
} else {
    console.log('Could not find step 1 block');
}
