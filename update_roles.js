const fs = require('fs');
const file = 'client/user/src/features/scoring/components/StartScoringModal.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add changePlayerRole function before doToss
const doTossRegex = /  \/\/ ─── Toss ────────────────────────────────────────────────────────────────────/;
const changeRoleFunc = `  const changePlayerRole = (teamKey, playerId, role) => {
    const key = teamKey === 'A' ? 'teamAPlayers' : 'teamBPlayers';
    setFormData(f => {
      let players = [...f[key]];
      
      // Enforce unique roles
      if (role !== 'PLAYER') {
        players = players.map(p => p.role === role ? { ...p, role: 'PLAYER' } : p);
      }
      
      players = players.map(p => p.id === playerId ? { ...p, role } : p);
      return { ...f, [key]: players };
    });
  };

  // ─── Toss ────────────────────────────────────────────────────────────────────`;

content = content.replace(doTossRegex, changeRoleFunc);

// 2. Pass onRoleChange to PlayingXIStep for Team A
const teamAPropsRegex = /onReplace=\{\(id\) => \{\n                  setPlayerPopup\(\{ teamKey: 'A', action: 'REPLACE', replaceId: id \}\);\n                  setActivePlayerTab\('roster'\);\n                \}\}/;
const teamAPropsNew = `onReplace={(id) => {
                  setPlayerPopup({ teamKey: 'A', action: 'REPLACE', replaceId: id });
                  setActivePlayerTab('roster');
                }}
                onRoleChange={(id, role) => changePlayerRole('A', id, role)}`;
content = content.replace(teamAPropsRegex, teamAPropsNew);

// 3. Pass onRoleChange to PlayingXIStep for Team B
const teamBPropsRegex = /onReplace=\{\(id\) => \{\n                  setPlayerPopup\(\{ teamKey: 'B', action: 'REPLACE', replaceId: id \}\);\n                  setActivePlayerTab\('roster'\);\n                \}\}/;
const teamBPropsNew = `onReplace={(id) => {
                  setPlayerPopup({ teamKey: 'B', action: 'REPLACE', replaceId: id });
                  setActivePlayerTab('roster');
                }}
                onRoleChange={(id, role) => changePlayerRole('B', id, role)}`;
content = content.replace(teamBPropsRegex, teamBPropsNew);

// 4. Update PlayingXIStep signature
const sigRegex = /const PlayingXIStep = \(\{ teamKey, teamName, players, maxMembers, teamDetails, onInit, onRemove, onAdd, onReplace \}\) => \{/;
const sigNew = `const PlayingXIStep = ({ teamKey, teamName, players, maxMembers, teamDetails, onInit, onRemove, onAdd, onReplace, onRoleChange }) => {`;
content = content.replace(sigRegex, sigNew);

// 5. Update PlayingXIStep render to show the select dropdown
const playerRenderRegex = /<span className="text-white text-sm font-medium flex-1 truncate">\{p\.name\}<\/span>\n            <div className="flex items-center gap-1">/g;

const playerRenderNew = `<span className="text-white text-sm font-medium flex-1 truncate">{p.name}</span>
            <div className="flex items-center gap-2">
              <select 
                value={p.role || 'PLAYER'} 
                onChange={(e) => onRoleChange(p.id, e.target.value)}
                className="bg-black/40 border border-white/10 rounded px-1 py-1 text-[9px] uppercase tracking-wider text-white/70 outline-none focus:border-[#BFF367]"
              >
                <option value="PLAYER">Player</option>
                <option value="CAPTAIN">Captain</option>
                <option value="WICKET_KEEPER_1">Wicket Keeper 1</option>
                <option value="WICKET_KEEPER_2">Wicket Keeper 2</option>
              </select>
            <div className="flex items-center gap-1">`;

content = content.replace(playerRenderRegex, playerRenderNew);

fs.writeFileSync(file, content);
console.log('StartScoringModal updated with Player Roles');
