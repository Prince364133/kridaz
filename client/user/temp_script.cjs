const fs = require('fs');
const path = 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/client/user/src/features/scoring/components/StartScoringModal.jsx';
let content = fs.readFileSync(path, 'utf8');

const s1 = `<button key={p.id} onClick={() => !isAdded && selectPlayer(p)} disabled={isAdded}
                        className={\`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left \${isAdded ? 'opacity-50 bg-white/5 border-transparent cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10'}\`}>`;

const r1 = `<button key={p.id} onClick={() => selectPlayer(p)}
                        className={\`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left \${isAdded ? 'bg-[#BFF367]/10 border-[#BFF367]' : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10'}\`}>`;

content = content.replace(s1, r1);
fs.writeFileSync(path, content);
