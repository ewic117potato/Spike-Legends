'use strict';
// The match server owns rally outcomes; browsers receive the same generated event.
const STYLES={balanced:[1,1,1],power:[1.16,.90,.96],iron:[.91,1.17,.98],tempo:[1.05,.95,1.12]};
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
const PICK=['THUNDER SPIKE','LIGHTNING QUICK','CROSS-COURT ROCKET','PERFECT IRON WALL','JUMP SERVE ACE','MIRACLE DIG','PHANTOM DECOY','BACK-ROW ATTACK'];
const safeName=x=>String(x||'ATHLETE').replace(/[^\w \-]/g,'').trim().slice(0,34)||'ATHLETE';
function sanitizeSquad(squad){
 if(!Array.isArray(squad)||squad.length!==6)return [];
 const allowed=['S','OH','MB','OP','L'];const slots=['OH','MB','OP','OH','S','MB'];
 return squad.map((x,i)=>({
   name:safeName(x?.name),id:String(x?.id||'').slice(0,80),
   power:clamp(Number(x?.power)||65,35,99),attack:clamp(Number(x?.attack)||65,35,99),
   defense:clamp(Number(x?.defense)||65,35,99),set:clamp(Number(x?.set)||65,35,99),
   position:allowed.includes(x?.position)?x.position:slots[i],slot:slots[i],
   school:String(x?.school||'Unknown').replace(/[^\w \-]/g,'').slice(0,32)
 }));
}
function teamwork(squad){const counts={};let aligned=0;
 for(const c of squad){counts[c.school]=(counts[c.school]||0)+1;if(c.position===c.slot)aligned++;}
 const best=Math.max(0,...Object.values(counts));const schoolBonus=best>=6?8:best>=4?5:best>=2?2:0;
 return {schoolBonus,aligned,topSchool:Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0]||'UNKNOWN'};
}
function mean(squad,key){return squad.reduce((a,c)=>a+c[key],0)/Math.max(1,squad.length);}
function teamScore(player,rally){const squad=player.squad;const s=STYLES[player.strategy]||STYLES.balanced;
 const synergy=teamwork(squad);const fatigue=Math.max(0,rally-17)*.055;
 return (mean(squad,'attack')*.48*s[0]+mean(squad,'defense')*.34*s[1]+mean(squad,'set')*.18*s[2])+synergy.schoolBonus*.28+synergy.aligned*.24-fatigue;
}
function chooseRally(room,rng=Math.random){
 const players=room.players;
 const chance=clamp(.5+(teamScore(players[0],room.rally)-teamScore(players[1],room.rally))*.012,.11,.89);
 const winner=rng()<chance?0:1;
 const team=players[winner].squad;
 const eligible=team.filter(x=>['OH','OP','MB'].includes(x.position));
 const actor=(eligible.length?eligible:team)[Math.floor(rng()*(eligible.length||team.length))];
 const setter=team.find(x=>x.position==='S')||team[4];
 const action=PICK[Math.floor(rng()*PICK.length)];
 room.rally++;room.score[winner]++;
 const event={type:'rally',rally:room.rally,winner,score:room.score.slice(),
   action,actor:actor.name,setter:setter.name,highlight:rng()<.3,
   message:action==='PERFECT IRON WALL'?`${actor.name} shuts down the angle with a monster block!`:
     action==='MIRACLE DIG'?`${setter.name} sets after a desperate defensive recovery!`:
     `${setter.name} sets for ${actor.name}: ${action}!`,
   strategies:players.map(p=>p.strategy),timestamp:Date.now(),serve:room.rally%2,
   chance:+chance.toFixed(3)};
 if(room.boxScore){room.boxScore[winner][actor.name]=(room.boxScore[winner][actor.name]||0)+1;}
 if(action.includes('ACE'))room.stats[winner].aces++;
 else if(action.includes('WALL'))room.stats[winner].blocks++;
 else if(action.includes('DIG'))room.stats[winner].digs++;
 else room.stats[winner].spikes++;
 return event;
}
function isFinished(room){return (Math.max(...room.score)>=15&&Math.abs(room.score[0]-room.score[1])>=2)||room.rally>=45;}
module.exports={STYLES,sanitizeSquad,teamwork,teamScore,chooseRally,isFinished,clamp};
