const fs = require('fs');
const file = 'client/user/src/features/scoring/components/InningsSetupModal.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add wicketKeeper state
content = content.replace(/const \[bowler, setBowler\] = useState\(null\);/, `const [bowler, setBowler] = useState(null);\n  const [wicketKeeper, setWicketKeeper] = useState(null);`);
content = content.replace(/const \[step, setStep\] = useState\(1\); \/\/ 1=striker 2=nonStriker 3=bowler/, `const [step, setStep] = useState(1); // 1=striker 2=nonStriker 3=bowler 4=wicketKeeper`);

// 2. Update STEPS
const oldSteps = `  const STEPS = [
    { id: 1, label: 'Choose Opener (Striker)', icon: <Zap size={16} />, pool: battingTeamSlots, excludeId: null },
    { id: 2, label: 'Choose Opener (Non-Striker)', icon: <Users size={16} />, pool: battingTeamSlots, excludeId: striker?.userId },
    { id: 3, label: 'Choose Opening Bowler', icon: <Zap size={16} />, pool: bowlingTeamSlots, excludeId: null },
  ];`;

const newSteps = `  const STEPS = [
    { id: 1, label: 'Choose Opener (Striker)', icon: <Zap size={16} />, pool: battingTeamSlots, excludeId: null },
    { id: 2, label: 'Choose Opener (Non-Striker)', icon: <Users size={16} />, pool: battingTeamSlots, excludeId: striker?.userId },
    { id: 3, label: 'Choose Opening Bowler', icon: <Zap size={16} />, pool: bowlingTeamSlots, excludeId: null },
    { id: 4, label: 'Choose Wicket Keeper', icon: <Users size={16} />, pool: bowlingTeamSlots.filter(p => p.role?.includes('WICKET_KEEPER')).length ? bowlingTeamSlots.filter(p => p.role?.includes('WICKET_KEEPER')) : bowlingTeamSlots, excludeId: bowler?.userId }
  ];`;
content = content.replace(oldSteps, newSteps);

// 3. Update handleSelect
const oldHandleSelect = `  const handleSelect = (player) => {
    if (step === 1) { setStriker(player); setStep(2); }
    else if (step === 2) { setNonStriker(player); setStep(3); }
    else {
      setBowler(player);
      // Auto-confirm once all three are chosen
      onConfirm({
        strikerId: striker.userId,
        nonStrikerId: nonStriker.userId,
        bowlerId: player.userId,
      });
    }
  };`;

const newHandleSelect = `  const handleSelect = (player) => {
    if (step === 1) { setStriker(player); setStep(2); }
    else if (step === 2) { setNonStriker(player); setStep(3); }
    else if (step === 3) { setBowler(player); setStep(4); }
    else {
      setWicketKeeper(player);
      // Auto-confirm once all four are chosen
      onConfirm({
        strikerId: striker.userId,
        nonStrikerId: nonStriker.userId,
        bowlerId: bowler.userId,
        wicketKeeperId: player.userId,
      });
    }
  };`;
content = content.replace(oldHandleSelect, newHandleSelect);

// 4. Update step colors
content = content.replace(/const stepColors = \['#EAB308', '#22D3EE', '#A78BFA'\];/, `const stepColors = ['#EAB308', '#22D3EE', '#A78BFA', '#10B981'];`);

fs.writeFileSync(file, content);
console.log('InningsSetupModal updated with Wicket Keeper selection');
