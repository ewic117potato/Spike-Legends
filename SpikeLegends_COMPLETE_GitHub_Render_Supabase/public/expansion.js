/* SPIKE LEGENDS: RIVAL ASCENSION 2.0
   Pure browser expansion; no new npm packages. Compatible with the original save.
   The prototype economy is client-side; don't use for cash prizes or payments. */
(() => {
 'use strict';
 const exDay = () => new Date().toISOString().slice(0,10);
 const exWeek = () => {
   const d=new Date(); d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);
   return d.toISOString().slice(0,10);
 };
 const exClamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const exEsc=s=>escapeHtml(String(s));
 const exInt=n=>Math.floor(Number(n)||0);
 const exUuid=()=>crypto.randomUUID();
 const exShortDate=d=>new Date(d).toLocaleDateString(undefined,{month:'short',day:'numeric'});
 const exDefaultMeta=()=>({shards:0,epicSeals:0,legendSeals:0,mythicSeals:0,credits:0,
   dailyKey:exDay(),weekKey:exWeek(),daily:{},weekly:{},claimed:{},dailyClaimed:{},weeklyClaimed:{},
   lastLogin:'',loginStreak:0,bestRarity:0,trialDay:exDay(),trialStage:0,trialCompletions:0,
   tactics:'balanced',duelMvp:0,flawlessWins:0,coachStars:0,crafts:0,upgrades:0,raresObtained:0,epicPity:0,mythicPity:0,lineups:[null,null,null],
   liveWins:0,botWins:0,log:[]});
 function exEnsure(){
   if(!state.meta||typeof state.meta!=='object')state.meta=exDefaultMeta();
   const m=state.meta;const defaults=exDefaultMeta();
   for(const k of Object.keys(defaults))if(m[k]===undefined)m[k]=defaults[k];
   if(m.dailyKey!==exDay()){m.dailyKey=exDay();m.daily={};m.dailyClaimed={};}
   if(m.weekKey!==exWeek()){m.weekKey=exWeek();m.weekly={};m.weeklyClaimed={};}
   if(m.trialDay!==exDay()){m.trialDay=exDay();m.trialStage=0;m.trialCompletions=0;}
   // Handle old saves that predate specialty tickets/collections.
   m.shards=exClamp(exInt(m.shards),0,999999);
   for(const k of ['epicSeals','legendSeals','mythicSeals','credits'])m[k]=exClamp(exInt(m[k]),0,999999);
   return m;
 }
 let em=exEnsure();
 const RARITY_WEIGHTS=[50,28,14,6,1.8,.2];
 const rewardLabel=r=>[r.coins?`◉ ${r.coins}`:'',r.tickets?`✦ ${r.tickets} ticket${r.tickets>1?'s':''}`:'',r.shards?`🔷 ${r.shards} shards`:'',r.epicSeals?'💜 EPIC+ CARD':'',r.legendSeals?'💛 LEGENDARY+ CARD':'',r.mythicSeals?'❤️ MYTHIC+ CARD':''].filter(Boolean).join(' · ');
 const EX_QUESTS={
   daily:[
     {id:'signin',name:'First Whistle',desc:'Claim today\'s login gift.',metric:'logins',need:1,reward:{coins:180,shards:2}},
     {id:'play2',name:'Court Time',desc:'Finish two duels.',metric:'duels',need:2,reward:{coins:250,shards:2}},
     {id:'win1',name:'Claim Victory',desc:'Win any duel.',metric:'wins',need:1,reward:{coins:300,shards:3}},
     {id:'roll3',name:'Recruiting Run',desc:'Summon three athletes.',metric:'rolls',need:3,reward:{tickets:1,shards:2}},
     {id:'tech',name:'Team Chemistry',desc:'Play a duel with a school synergy active.',metric:'chemistry',need:1,reward:{shards:3,coins:120}},
     {id:'trial',name:'Rising Rival',desc:'Win one Rival Trial.',metric:'trialWins',need:1,reward:{shards:4,coins:180}}
   ],
   weekly:[
     {id:'weekly_wins',name:'Winning Mentality',desc:'Win eight duels this week.',metric:'wins',need:8,reward:{shards:18,tickets:2}},
     {id:'weekly_roll',name:'Talent Scout',desc:'Summon 20 athletes this week.',metric:'rolls',need:20,reward:{shards:16,tickets:3}},
     {id:'weekly_rares',name:'Hunt the Elite',desc:'Recruit three Epic-or-better athletes.',metric:'rareCards',need:3,reward:{shards:20}},
     {id:'weekly_trials',name:'Rival Breaker',desc:'Defeat six Rival Trial opponents.',metric:'trialWins',need:6,reward:{epicSeals:1,shards:12}},
     {id:'weekly_duels',name:'Court Veteran',desc:'Complete 15 total duels.',metric:'duels',need:15,reward:{shards:15,coins:1200}}
   ],
   milestone:[
     {id:'milestone5',name:'First Breakthrough',desc:'Win 5 matches in total.',metric:'totalWins',need:5,reward:{epicSeals:1}},
     {id:'milestone15',name:'National Prospect',desc:'Win 15 matches in total.',metric:'totalWins',need:15,reward:{legendSeals:1}},
     {id:'milestone30',name:'Legend Hunter',desc:'Summon 30 characters in total.',metric:'totalRolls',need:30,reward:{epicSeals:2,shards:20}},
     {id:'milestone50',name:'King of the Court',desc:'Win 50 matches in total.',metric:'totalWins',need:50,reward:{legendSeals:2,shards:50}},
     {id:'milestone100',name:'The Ultimate Ace',desc:'Summon 100 athletes in total.',metric:'totalRolls',need:100,reward:{mythicSeals:1}},
     {id:'milestone150',name:'Volleyball Legend',desc:'Win 150 matches in total.',metric:'totalWins',need:150,reward:{mythicSeals:1,shards:100}}
   ]
 };
 function exMetric(k,scope){
   em=exEnsure();
   if(k==='totalWins')return state.wins;
   if(k==='totalRolls')return state.rolls;
   if(k==='collection')return new Set(owned().map(x=>x.key)).size;
   return (scope==='daily'?em.daily:scope==='weekly'?em.weekly:em)[k]||0;
 }
 function exTrack(k,n=1){em=exEnsure();em.daily[k]=(em.daily[k]||0)+n;em.weekly[k]=(em.weekly[k]||0)+n;}
 function exGrant(r){em=exEnsure();for(const k of ['coins','tickets'])state[k]=(state[k]||0)+(r[k]||0);for(const k of ['shards','epicSeals','legendSeals','mythicSeals','credits'])em[k]=(em[k]||0)+(r[k]||0);}
 function exClaim(id,scope){
   const q=EX_QUESTS[scope].find(q=>q.id===id);if(!q)return;
   em=exEnsure();const where=scope==='daily'?em.dailyClaimed:scope==='weekly'?em.weeklyClaimed:em.claimed;
   if(where[id]||exMetric(q.metric,scope)<q.need){toast('Quest is not complete yet.');return;}
   where[id]=true;exGrant(q.reward);save();render();toast('QUEST COMPLETE — '+rewardLabel(q.reward));
 }
 function exQuestRow(q,scope){
   const progress=exClamp(exMetric(q.metric,scope),0,q.need),done=!!(scope==='daily'?em.dailyClaimed:scope==='weekly'?em.weeklyClaimed:em.claimed)[q.id];
   return `<article class="ex-quest ${done?'ex-finished':''}"><div class="ex-medal">${done?'✓':progress===q.need?'★':'✦'}</div><div class="ex-quest-main"><div class="ex-quest-title">${exEsc(q.name)} <small>${progress}/${q.need}</small></div><p>${exEsc(q.desc)}</p><div class="ex-track"><div style="width:${progress/q.need*100}%"></div></div><div class="ex-loot">${rewardLabel(q.reward)}</div></div><button class="btn sm ${done?'ghost':''}" data-ex-claim="${scope}|${q.id}" ${done||progress<q.need?'disabled':''}>${done?'CLAIMED':progress===q.need?'CLAIM':'LOCKED'}</button></article>`;
 }
 function exSection(title,desc,scope){return `<div class="ex-headerrow"><div><h2>${title}</h2><p>${desc}</p></div><span class="ex-counter">${EX_QUESTS[scope].filter(q=>(scope==='daily'?em.dailyClaimed:scope==='weekly'?em.weeklyClaimed:em.claimed)[q.id]).length}/${EX_QUESTS[scope].length} CLAIMED</span></div><div class="ex-quests">${EX_QUESTS[scope].map(q=>exQuestRow(q,scope)).join('')}</div>`;}
 const oldQuests=quests;
 quests=function(){em=exEnsure();return heading('RIVAL ASCENSION · SEASON 1','QUEST & REWARDS HQ','Complete real objectives, collect shards and unlock guaranteed Epic, Legendary and Mythic athletes.')+
 `<div class="ex-wallet"><div>🔷 <b>${em.shards}</b><small>ASCENSION SHARDS</small></div><div>💜 <b>${em.epicSeals}</b><small>EPIC+ SEALS</small></div><div>💛 <b>${em.legendSeals}</b><small>LEGENDARY+ SEALS</small></div><div>❤️ <b>${em.mythicSeals}</b><small>MYTHIC+ SEALS</small></div></div>`+
 `<section class="ex-spotlight"><div><div class="eyebrow">🎁 ONE REWARD EVERY DAY</div><h2>DAILY SUPPLY DROP</h2><p>Log in on consecutive days for a growing reward chain. Day 7 guarantees an Epic-or-better card.</p><div class="ex-login-track">${[1,2,3,4,5,6,7].map(i=>`<div class="${i<=em.loginStreak?'active':''}">DAY ${i}<strong>${i===7?'💜':i===4?'✦':'🔷'}</strong></div>`).join('')}</div></div><button class="btn" data-ex-login ${em.lastLogin===exDay()?'disabled':''}>${em.lastLogin===exDay()?'GIFT CLAIMED TODAY':'CLAIM DAILY GIFT'}</button></section>`+
 `<div class="ex-tabhead"><button data-ex-tab="daily" class="${window.exQuestTab==='daily'||!window.exQuestTab?'on':''}">DAILY</button><button data-ex-tab="weekly" class="${window.exQuestTab==='weekly'?'on':''}">WEEKLY</button><button data-ex-tab="milestone" class="${window.exQuestTab==='milestone'?'on':''}">LEGEND ROAD</button></div>`+
 `<div class="panel ex-panel">${window.exQuestTab==='weekly'?exSection('WEEKLY CONTRACTS','Reset every Monday (UTC). Complete them for premium summon resources.','weekly'):window.exQuestTab==='milestone'?exSection('LEGEND ROAD','Permanent accomplishments with guaranteed rare-card rewards.','milestone'):exSection('DAILY OBJECTIVES','Six quests reset at 00:00 UTC. Rewards must be claimed before reset.','daily')}</div>`+
 `<div class="ex-spotlight ex-craft"><div><div class="eyebrow">🔮 NO LUCK REQUIRED</div><h2>ASCENSION FORGE</h2><p>Exchange shards earned from quests and Rival Trials for guaranteed high-rarity character seals.</p></div><div class="ex-forge-actions"><button class="btn sm" data-ex-craft="epic" ${em.shards<20?'disabled':''}>20 🔷 → EPIC+</button><button class="btn sm" data-ex-craft="legend" ${em.shards<65?'disabled':''}>65 🔷 → LEGENDARY+</button><button class="btn sm" data-ex-craft="mythic" ${em.shards<180?'disabled':''}>180 🔷 → MYTHIC+</button></div></div>`;
 };
 function exLogin(){em=exEnsure();if(em.lastLogin===exDay())return toast('You already claimed today.');
   const last=new Date(exDay()+'T00:00:00Z');last.setUTCDate(last.getUTCDate()-1);
   em.loginStreak=em.lastLogin===last.toISOString().slice(0,10)?em.loginStreak%7+1:1;
   em.lastLogin=exDay();const rewards=[{coins:200,shards:3},{tickets:1,shards:4},{coins:450,shards:4},{tickets:2,shards:5},{coins:700,shards:6},{shards:10},{epicSeals:1,shards:12}];
   const reward=rewards[em.loginStreak-1];exGrant(reward);exTrack('logins');save();render();modal(`<div class="eyebrow">DAY ${em.loginStreak} / 7</div><h2 class="h1">DAILY GIFT UNLOCKED</h2><div class="ex-big-reward">🎁</div><p class="note" style="text-align:center">${rewardLabel(reward)}</p><button class="btn" data-action="close">COLLECT</button>`);
 }
 function exCraft(kind){em=exEnsure();const cost={epic:20,legend:65,mythic:180}[kind];const key={epic:'epicSeals',legend:'legendSeals',mythic:'mythicSeals'}[kind];if(!key||em.shards<cost)return toast('Not enough Ascension Shards.');em.shards-=cost;em[key]++;em.crafts++;save();render();toast('Forged a '+kind.toUpperCase()+'+ summon seal!');}
 function exRedeem(kind){em=exEnsure();const min={epic:2,legend:3,mythic:4}[kind],key={epic:'epicSeals',legend:'legendSeals',mythic:'mythicSeals'}[kind];if(!key||em[key]<1)return toast('Earn a '+kind+' seal from quests or the forge.');
   em[key]--;const rolls={2:[2,3,4,5],3:[3,4,5],4:[4,5]}[min],weighted=rolls.map(r=>({r,w:RARITY_WEIGHTS[r]}));const sum=weighted.reduce((s,x)=>s+x.w,0);let p=Math.random()*sum;let rarity=min;
   for(const row of weighted){p-=row.w;if(p<0){rarity=row.r;break;}}
   const choices=CATALOG.filter(c=>c.rarity===rarity);const c=choices[Math.floor(Math.random()*choices.length)];const obj={key:c.key,uid:exUuid(),level:0};state.items.push(obj);em.bestRarity=Math.max(em.bestRarity,rarity);if(rarity>=2){exTrack('rareCards');em.raresObtained++}save();render();modal(`<div class="eyebrow">GUARANTEED ${kind.toUpperCase()}+ RECRUIT</div><h2 class="h1">NEW ${rarities[rarity].name.toUpperCase()} ATHLETE!</h2><div class="reveal ex-single-card">${card({...c,...obj})}</div><button class="btn" data-action="close">ADD TO COLLECTION</button>`);
 }
 const oldCard=card;
 card=function(c){const html=oldCard(c);return c.shiny?html.replace('class="card"','class="card ex-shiny"').replace('class="art"','class="art" title="Shiny variant"'):html;};
 const oldSummon=summon;
 summon=function(){em=exEnsure();return oldSummon()+`<div class="ex-pity-strip">✨ Epic+ guaranteed in ${10-em.epicPity} summons · 💛 Legendary+ in ${40-state.pity} · ❤️ Mythic+ in ${150-em.mythicPity}. <span>2.5% shiny variant chance on all pulls.</span></div>`+`<div class="sectionbar"><h2>⚡ GUARANTEED SCOUTING</h2><a data-go="quests">EARN RARER CARDS IN QUESTS →</a></div><div class="ex-premium-grid">${[['epic','💜','EPIC+ RECRUIT','At least Epic rarity · 1 seal',em.epicSeals],['legend','💛','LEGENDARY+ RECRUIT','At least Legendary rarity · 1 seal',em.legendSeals],['mythic','❤️','MYTHIC+ RECRUIT','At least Mythic rarity · 1 seal',em.mythicSeals]].map(([kind,icon,title,desc,count])=>`<div class="ex-premium"><div class="ex-premium-icon">${icon}</div><h3>${title}</h3><p>${desc}</p><div class="ex-loot">${count} SEAL${count===1?'':'S'} READY</div><button class="btn sm" data-ex-redeem="${kind}" ${count===0?'disabled':''}>RECRUIT NOW</button></div>`).join('')}</div>`;};
 roll=function(n){
   em=exEnsure();const price=n===10?900:100*n;
   if(state.coins<price&&state.tickets<n){toast('Not enough coins or tickets. Win matches and claim quests!');return;}
   if(state.coins>=price)state.coins-=price;else state.tickets-=n;
   const got=[];
   for(let i=0;i<n;i++){
     state.rolls++;state.pity++;em.epicPity++;em.mythicPity++;
     const pick=Math.random()*100;let cumulative=0,rarity=0;
     for(let j=0;j<RARITY_WEIGHTS.length;j++){cumulative+=RARITY_WEIGHTS[j];if(pick<cumulative){rarity=j;break;}}
     if(em.mythicPity>=150)rarity=Math.max(rarity,4);
     else if(state.pity>=40)rarity=Math.max(rarity,3);
     else if(em.epicPity>=10)rarity=Math.max(rarity,2);
     if(rarity>=4)em.mythicPity=0;
     if(rarity>=3)state.pity=0;
     if(rarity>=2)em.epicPity=0;
     const pool=CATALOG.filter(c=>c.rarity===rarity),c=pool[Math.floor(Math.random()*pool.length)];
     const entry={key:c.key,uid:exUuid(),level:0,shiny:Math.random()<.025};
     state.items.push(entry);got.push({...c,...entry});
     if(rarity>=2){exTrack('rareCards');em.raresObtained++;}
     em.bestRarity=Math.max(em.bestRarity,rarity);
   }
   exTrack('rolls',n);save();render();
   modal(`<div class="eyebrow">SUMMON RESULTS · ${n} ATHLETE${n===1?'':'S'}</div><h2 class="h1">${got.some(c=>c.rarity>=4)?'⚡ RARE TALENT DISCOVERED!':n===10?'TEN ATHLETES RECRUITED':'NEW ATHLETE RECRUITED'}</h2><div class="reveal">${got.map(card).join('')}</div><div class="divider"></div><button class="btn" data-action="close">ADD TO COLLECTION</button><button class="btn ghost" data-go="squad">EQUIP →</button>`);
 };
 const oldUpgrade=upgrade;
 upgrade=function(uid){const before=item(uid)?.level||0;oldUpgrade(uid);if((item(uid)?.level||0)>before){exTrack('upgrades');em.upgrades++;save();}};
 const oldRoster=roster;
 roster=function(){return oldRoster().map((c,i)=>{const source=item(state.squad[i]);return {...c,position:source?.position,slot:labels[i],school:source?.school,rarity:source?.rarity,level:source?.level||0}});};
 function exChemistry(){const squad=team(),schoolsMap={};for(const c of squad)schoolsMap[c.school]=(schoolsMap[c.school]||0)+1;const max=Math.max(0,...Object.values(schoolsMap));const matches=state.squad.reduce((s,id,i)=>s+(item(id)?.position===labels[i]?1:0),0);const bonus=max>=6?8:max>=4?5:max>=2?2:0;return {schools:schoolsMap,max,matches,bonus,school:Object.entries(schoolsMap).sort((a,b)=>b[1]-a[1])[0]?.[0]||'NONE'};}
 const oldSquad=squad;
 squad=function(){const info=exChemistry();return oldSquad()+`<div class="ex-home-strip"><div><strong>🧠 COACH'S LINEUP PRESETS</strong><p>Save three different six-player squads and swap them instantly before a duel.</p></div><div class="ex-preset-controls">${[0,1,2].map(i=>`<div><b>FORMATION ${i+1}</b><button data-ex-save-preset="${i}" class="btn sm ghost">SAVE</button><button data-ex-load-preset="${i}" class="btn sm" ${!em.lineups[i]?'disabled':''}>LOAD</button></div>`).join('')}</div></div>`+`<div class="ex-spotlight ex-chem"><div><div class="eyebrow">✦ ACTIVE SQUAD SYNERGY</div><h2>${exEsc(info.school)}</h2><p>${info.max} matching-school players · ${info.matches}/6 correct positions. Two matching athletes grant +2% teamwork, four +5%, six +8%.</p></div><div class="ex-bonus">+${info.bonus}%<small>TEAMWORK</small></div></div>`;};
 const oldCollection=collection;
 collection=function(){const seen=new Set(owned().map(x=>x.key));return oldCollection()+`<details class="ex-index"><summary>📚 ATHLETE INDEX · ${seen.size}/${CATALOG.length} DISCOVERED · CLICK TO EXPAND</summary><div class="ex-index-grid">${CATALOG.map(c=>`<div class="${seen.has(c.key)?'found':'missing'}" style="--rarity:${rarities[c.rarity].col}"><span>${seen.has(c.key)?c.art:'?'}</span><b>${seen.has(c.key)?exEsc(c.name):'UNDISCOVERED'}</b><small>${c.position} · ${rarities[c.rarity].name}</small></div>`).join('')}</div></details>`;};
 const oldHome=home;
 home=function(){em=exEnsure();const unclaimed=[...EX_QUESTS.daily.filter(q=>!em.dailyClaimed[q.id]&&exMetric(q.metric,'daily')>=q.need),...EX_QUESTS.weekly.filter(q=>!em.weeklyClaimed[q.id]&&exMetric(q.metric,'weekly')>=q.need)].length;
  return oldHome()+`<div class="ex-home-strip"><div><strong>⚡ RIVAL ASCENSION</strong><p>${unclaimed} quest rewards ready · ${em.shards} shards · ${em.epicSeals+em.legendSeals+em.mythicSeals} premium seals</p></div><button class="btn sm" data-go="quests">OPEN QUEST HQ →</button></div><div class="ex-home-strip"><div><strong>🏆 RIVAL TRIALS</strong><p>Fight escalating bosses and earn guaranteed rare character seals.</p></div><button class="btn sm ghost" data-go="trials">ENTER RIVAL TRIALS →</button></div>`;};
 const trialNames=['SUNRISE ACADEMY','PHANTOM SIX','MIDNIGHT APEX'];
 const trialOvr=[65,77,88];
 function exTrials(){em=exEnsure();return heading('PVE BOSS LADDER','RIVAL TRIALS','Three escalating opponents. Clear the gauntlet to unlock an Epic+ recruit seal. Refreshes daily.')+
 `<div class="ex-trial-hero"><span>🏐</span><div><div class="eyebrow">SEASON 1 CHALLENGE</div><h2>THE THREE CROWNS</h2><p>Defeat all three squads in order. Each victory awards shards and coins. Finish all three for an Epic+ seal once per day.</p><div class="ex-loot">Clears today: ${em.trialCompletions} · Stage: ${em.trialStage}/3</div></div></div>`+
 `<div class="ex-trial-grid">${trialNames.map((n,i)=>`<div class="ex-trial ${i<em.trialStage?'won':i===em.trialStage?'current':''}"><div class="eyebrow">OPPONENT ${i+1} / 3</div><div class="ex-trial-avatar">${['🐺','🦊','🐉'][i]}</div><h3>${n}</h3><p>Team rating: ${trialOvr[i]} OVR</p><div class="ex-loot">${i===2?'🏆 FINAL BOSS':'🔷 SHARDS + COINS'}</div><button class="btn sm" data-ex-trial="${i}" ${i!==em.trialStage||em.trialStage>=3?'disabled':''}>${i<em.trialStage?'CLEARED':i===em.trialStage?'CHALLENGE':'LOCKED'}</button></div>`).join('')}</div>`+
 (em.trialStage>=3?`<div class="ex-home-strip"><div><strong>GAUNTLET COMPLETE</strong><p>Return tomorrow for a new rare-card reward. You can still play normal bot and friend duels.</p></div><span>🏆</span></div>`:'');}
 const oldRender=render;
 render=function(){em=exEnsure();if(view==='trials'){document.querySelectorAll('.navitem').forEach(e=>e.classList.toggle('active',e.dataset.view==='trials'));$('#bread').textContent='HOME / TRIALS';$('#view').innerHTML=exTrials();return;}oldRender();};
 const oldDuels=duels;
 duels=function(){em=exEnsure();return oldDuels()+`<div class="ex-home-strip"><div><strong>⚔️ TACTICAL DUELS</strong><p>Choose Balanced, Power, Iron Wall or Quick Tempo during any match. Positioning and school chemistry affect rally odds.</p></div><button class="btn sm ghost" data-go="trials">RIVAL TRIALS →</button></div><div class="panel ex-match-history"><div class="row"><h2>MATCH HISTORY</h2><span class="mini">LAST ${Math.min(8,em.log.length)} RESULTS</span></div>${em.log.slice(0,8).map(x=>`<div class="ex-history-item"><span>${x.win?'🏆':'⚔'}</span><strong>${x.win?'VICTORY':'DEFEAT'}</strong><span>${exEsc(x.opponent||'OPPONENT')}</span><small>${exShortDate(x.when)}</small></div>`).join('')||'<p class="note">Play your first duel to see detailed results.</p>'}</div>`;};
 function exRecord(win,opponent,score,kind){em=exEnsure();em.log.unshift({win,opponent:String(opponent).slice(0,28),score,kind,when:Date.now()});em.log=em.log.slice(0,30);exTrack('duels');if(exChemistry().bonus>0)exTrack('chemistry');if(win){exTrack('wins');if(kind==='live')em.liveWins++;else em.botWins++;}}
 const oldReward=reward;
 let exMatchContext=null;
 reward=function(win,isCareer=false){const ctx=exMatchContext||{kind:'bot',opponent:'AI CHALLENGER',score:duel?.score||[0,0]};exRecord(win,ctx.opponent,ctx.score,ctx.kind);oldReward(win,isCareer);
   if(win){exGrant({shards:ctx.kind==='live'?3:ctx.kind==='trial'?4:2});if(ctx.kind==='trial'){em.trialStage=Math.min(3,em.trialStage+1);exTrack('trialWins');if(em.trialStage===3){em.trialCompletions++;exGrant({epicSeals:1,shards:10});toast('RIVAL TRIALS CLEARED! EPIC+ SEAL UNLOCKED!');}}}else exGrant({shards:1});
   save();exMatchContext=null;};
 const exStyles={balanced:{name:'BALANCED',mod:[1,1,1],desc:'Reliable team play'},power:{name:'POWER SPIKES',mod:[1.16,.90,.96],desc:'Stronger attacks, weaker digs'},iron:{name:'IRON WALL',mod:[.91,1.17,.98],desc:'Defence and blocking'},tempo:{name:'QUICK TEMPO',mod:[1.05,.95,1.12],desc:'Faster, more accurate sets'}};
 function exStylePills(){return `<div class="ex-tactic-pills">${Object.entries(exStyles).map(([k,v])=>`<button class="ex-tactic ${em.tactics===k?'on':''}" data-ex-style="${k}" title="${v.desc}">${v.name}</button>`).join('')}</div>`;}
 function exEffective(players){const n=players.length||1;const d=players.reduce((o,p)=>{o.attack+=(p.attack||p.power||65);o.defense+=(p.defense||p.power||65);o.set+=(p.set||p.power||65);return o},{attack:0,defense:0,set:0});return {attack:d.attack/n,defense:d.defense/n,set:d.set/n};}
 function exWinner(a,b,sa,sb){const p=exEffective(a),q=exEffective(b),x=exStyles[sa]?.mod||[1,1,1],y=exStyles[sb]?.mod||[1,1,1];
   const chem=exChemistry();const skill=p.attack*x[0]*.49+p.defense*x[1]*.31+p.set*x[2]*.20 +chem.bonus*.18+chem.matches*.25;
   const foe=q.attack*y[0]*.49+q.defense*y[1]*.31+q.set*y[2]*.20;
   return Math.random()<exClamp(.5+(skill-foe)*.012,.11,.89)?0:1;
 }
 function exPointEvent(winner,active,enemy,score){const myRoster=active,rosterNames=winner===0?myRoster:enemy;
   const attacker=rosterNames[Math.floor(Math.random()*rosterNames.length)];const setter=rosterNames.find(p=>p.position==='S')||rosterNames[4]||attacker;
   const specials=['THUNDER STRIKE','LIGHTNING QUICK','CROSS COURT FINISH','IRON WALL STUFF','MIRACLE FLOOR SAVE','JUMP SERVE ACE','PHANTOM DECOY'];
   const special=specials[Math.floor(Math.random()*specials.length)];
   return {winner,actor:attacker?.name||'ACE',setter:setter?.name||'SETTER',action:special,score,sequence:['RECEIVE','SET','ATTACK','POINT'],highlight:Math.random()<.22};
 }
 const oldOpenArena=openArena;
 openArena=function(names,type){em=exEnsure();duel={names,type,score:[0,0],rally:0,feed:['The referee signals the first serve.'],latest:null,stats:{aces:0,blocks:0,quick:0},mvp:{},serverRally:0};
   modal(`<div id="arena"></div><div class="ex-arena-footer"><strong>COURT TACTICS</strong><span>Change strategy mid-match; each one affects upcoming rallies.</span>${exStylePills()}</div><div class="ex-arena-bottom"><button class="btn ghost sm" data-action="exitmatch">EXIT VIEW</button><small>${type==='live'?'SERVER-SYNCHRONISED LIVE RALLIES':'SIMULATED AI MATCH · FIRST TO 15, WIN BY TWO'}</small></div>`);renderArena();};
 function exAvatar(player,index){
   const face=player?.portrait||CATALOG.find(c=>c.name===player?.name)?.portrait;
   return face?`<img src="${face}" alt="${exEsc(player.name)}" loading="eager">`:['🏐','⭐','🏐','⭐','🏐','⭐'][index%6];
 }
 renderArena=function(){const el=$('#arena');if(!el||!duel)return;const r=duel.latest;
   const left=duel.names[0],right=duel.names[1];const desc=r?`${r.setter||'SETTER'} → ${r.actor||'ATTACKER'} · ${r.action||'SPIKE'}`:'Teams are preparing to serve...';
   el.innerHTML=`<section class="ex-arena"><div class="ex-arena-top"><span>● ${duel.type==='live'?'LIVE ONLINE':'PVE MATCH'}</span><span>RALLY ${duel.rally} · FIRST TO 15</span></div><div class="ex-score"><div><small>HOME</small><strong>${exEsc(left)}</strong></div><span>${duel.score[0]} <b>:</b> ${duel.score[1]}</span><div class="ex-right"><small>AWAY</small><strong>${exEsc(right)}</strong></div></div><div class="ex-court"><div class="ex-net"></div><div class="ex-court-half homehalf">${Array.from({length:6},(_,i)=>`<div class="ex-athlete a${i}"><span>${exAvatar(duel.playerRosters?.[0]?.[i]||team()[i],i)}</span></div>`).join('')}</div><div class="ex-court-half awayhalf">${Array.from({length:6},(_,i)=>`<div class="ex-athlete a${i}"><span>${exAvatar(duel.playerRosters?.[1]?.[i]||duel.enemyRoster?.[i],i+6)}</span></div>`).join('')}</div><div class="ex-ball ${r?(r.winner===0?'flyhome':'flyaway'):''}">🏐</div><div class="ex-impact ${r?.highlight?'pop':''}">${r?.highlight?'✦':''}</div></div><div class="ex-action-line"><span>${r?.highlight?'⚡ SPECIAL MOVE':'🏐 RALLY PLAY'}</span><b>${exEsc(desc)}</b><small>${r?exEsc(duel.names[r.winner])+' SCORES!':'READY TO SERVE'}</small></div><div class="ex-rally-sequence"><span>SERVE</span><span>RECEIVE</span><span>SET</span><span>ATTACK</span><span>POINT</span></div><div class="ex-commentary"><strong>MATCH COMMENTARY</strong>${duel.feed.slice(-5).reverse().map(t=>`<div>${exEsc(t)}</div>`).join('')}</div></section>`;
 };
 function exEnemy(overall,name){return Array.from({length:6},(_,i)=>({name:(name||'RIVAL')+' '+(i+1),position:labels[i],attack:exClamp(overall+(i%3)*3-3,40,99),defense:exClamp(overall+((i*2)%5)-2,40,99),set:exClamp(overall+(i===4?7:-2),40,99)}));}
 botMatch=function(level=null,careerIndex=null){if(team().length!==6){toast('Equip six athletes before duelling.');nav('squad');return;}
   if(botTimer)clearInterval(botTimer);em=exEnsure();const isTrial=exMatchContext?.kind==='trial';const enemyLevel=level||Math.max(52,avg()+Math.floor(Math.random()*19)-10);const opp=isTrial?trialNames[em.trialStage]:careerIndex!==null?careerTeams[careerIndex][0]:'AI CHALLENGER';
   const enemy=exEnemy(enemyLevel,opp),ours=roster();openArena([state.name,opp],'bot');
   duel.playerRosters=[team(),null];
   // Display an actual rival lineup (the score simulation remains separate).
   const rivalStart=(enemyLevel+em.trialStage*7)%CATALOG.length;
   duel.enemyRoster=Array.from({length:6},(_,i)=>CATALOG[(rivalStart+i*3)%CATALOG.length]);
   renderArena();let rallyCounter=0;
   botTimer=setInterval(()=>{if(!duel||duel.type!=='bot'){clearInterval(botTimer);return;}
     const winner=exWinner(ours,enemy,em.tactics,'balanced');duel.score[winner]++;duel.rally++;rallyCounter++;
     const ev=exPointEvent(winner,ours,enemy,[...duel.score]);duel.latest=ev;duel.feed.push(`${ev.action} by ${ev.actor}! ${duel.names[winner]} takes the point.`);
     duel.mvp[ev.actor]=(duel.mvp[ev.actor]||0)+1;
     if(ev.action.includes('ACE'))duel.stats.aces++;if(ev.action.includes('WALL'))duel.stats.blocks++;if(ev.action.includes('QUICK'))duel.stats.quick++;
     renderArena();
     if((Math.max(...duel.score)>=15&&Math.abs(duel.score[0]-duel.score[1])>=2)||rallyCounter>=45){
       clearInterval(botTimer);const result=[...duel.score],win=result[0]>result[1];const mvp=Object.entries(duel.mvp).sort((a,b)=>b[1]-a[1])[0]||['NONE',0];const finalContext=exMatchContext||{kind:careerIndex!==null?'career':'bot',opponent:opp};
       exMatchContext={...finalContext,score:result};reward(win,careerIndex!==null);
       setTimeout(()=>{if(duel?.type!=='bot')return;duel=null;
         modal(`<div class="eyebrow">MATCH REPORT · ${opp}</div><h2 class="h1">${win?'🏆 VICTORY!':'TOUGH DEFEAT'}</h2><div class="ex-final-score">${result[0]} <span>:</span> ${result[1]}</div><p class="note" style="text-align:center">🏅 MATCH MVP: ${exEsc(mvp[0])} · ${mvp[1]} points<br>${win?`+${careerIndex!==null?450:250} coins and Ascension Shards`:'You earned a participation reward and 1 Ascension Shard.'}${isTrial&&win&&em.trialStage>=3?'<br>✨ GAUNTLET CLEARED — BONUS EPIC+ RECRUIT SEAL!':''}</p><div class="flexgap"><button class="btn" data-action="close">CONTINUE</button><button class="btn ghost" data-go="quests">QUEST REWARDS →</button></div>`);render();},350);
     }
   },1250);
 };
 const oldHandleWS=handleWS;
 handleWS=function(m){
   if(m.type==='rally'&&duel?.type==='live'){duel.score=m.score;duel.rally=m.rally;duel.latest={...m,winner:m.winner,actor:m.actor,setter:m.setter,action:m.action,highlight:m.highlight};duel.feed.push((m.message||`${m.actor}: ${m.action}`)+` ${duel.names[m.winner]} scores.`);renderArena();return;}
   if(m.type==='strategy'){if(room){room.strategies=m.strategies;toast(`Strategies: ${m.strategies.map(s=>exStyles[s]?.name||s).join(' vs ')}`)}return;}
   if(m.type==='finish'&&duel?.type==='live'){
     const i=room?.youIndex??0,won=m.winner===i;exMatchContext={kind:'live',opponent:duel.names[i===0?1:0],score:m.score};
     // Each client receives only the match's final outcome from the server.
     reward(won,false);duel=null;
     modal(`<div class="eyebrow">ONLINE FRIEND DUEL · FINAL</div><h2 class="h1">${won?'🏆 VICTORY!':'DEFEAT'}</h2><div class="ex-final-score">${m.score[0]} <span>:</span> ${m.score[1]}</div><p class="note" style="text-align:center">🏅 MVP: ${exEsc(m.mvp?.[m.winner]?.[0]||'ACE')} · ${m.mvp?.[m.winner]?.[1]||0} points<br>${won?'+250 coins, XP and 3 shards':'Participation coins, XP and 1 shard'}</p><div class="flexgap"><button class="btn" data-action="rematch">REQUEST REMATCH</button><button class="btn ghost" data-action="leaveroom">LEAVE ROOM</button></div>`);render();return;
   }
   if(m.type==='rematch_wait'){toast('Rematch requested. Waiting for opponent.');return;}
   oldHandleWS(m);
   if(m.type==='start'&&duel?.type==='live'){
     duel.playerRosters=(m.players||[]).map(p=>p.squad||[]);
     renderArena();
   }
 };
 function exChangeTactic(key){if(!exStyles[key])return;em=exEnsure();em.tactics=key;save();
   if(duel?.type==='live'&&ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'strategy',strategy:key}));
   document.querySelectorAll('.ex-tactic').forEach(el=>el.classList.toggle('on',el.dataset.exStyle===key));
   toast('Tactic changed: '+exStyles[key].name);
 }
 
 const oldShowRoom=showRoom;
 showRoom=function(){oldShowRoom();if(room){const d=document.querySelector('.dialog');if(d)d.insertAdjacentHTML('beforeend',`<div class="ex-lobby-note">⚡ SERVER-AUTHORITATIVE MATCH SCORE · 4 LIVE TACTICS · TEAM CHEMISTRY</div>`);}};
 // Handle additions via their own data-ex-* attributes; original click router ignores them.
 document.addEventListener('click',event=>{
   const t=event.target.closest('[data-ex-claim],[data-ex-login],[data-ex-tab],[data-ex-craft],[data-ex-redeem],[data-ex-trial],[data-ex-style],[data-ex-save-preset],[data-ex-load-preset],[data-action="exitmatch"],[data-action="close"],#overlay');if(!t)return;
   if(t.dataset.action==='exitmatch'||((t.dataset.action==='close'||event.target.id==='overlay')&&duel?.type==='bot')){exMatchContext=null;if(botTimer)clearInterval(botTimer);return;}
   if(t.hasAttribute('data-ex-claim')){const [scope,id]=t.dataset.exClaim.split('|');exClaim(id,scope);}
   if(t.hasAttribute('data-ex-login'))exLogin();
   if(t.hasAttribute('data-ex-tab')){window.exQuestTab=t.dataset.exTab;render();}
   if(t.hasAttribute('data-ex-craft'))exCraft(t.dataset.exCraft);
   if(t.hasAttribute('data-ex-redeem'))exRedeem(t.dataset.exRedeem);
   if(t.hasAttribute('data-ex-style'))exChangeTactic(t.dataset.exStyle);
   if(t.hasAttribute('data-ex-trial')){em=exEnsure();if(+t.dataset.exTrial===em.trialStage&&em.trialStage<3){exMatchContext={kind:'trial',opponent:trialNames[em.trialStage]};botMatch(trialOvr[em.trialStage],null);}}
   if(t.hasAttribute('data-ex-save-preset')){em=exEnsure();em.lineups[+t.dataset.exSavePreset]=state.squad.slice();save();render();toast('Lineup saved to slot '+(+t.dataset.exSavePreset+1));}
   if(t.hasAttribute('data-ex-load-preset')){em=exEnsure();const saved=em.lineups[+t.dataset.exLoadPreset];if(!saved)return;const available=new Set(state.items.map(x=>x.uid)),used=new Set();state.squad=saved.map(id=>{if(!available.has(id)||used.has(id))return null;used.add(id);return id;});save();render();toast('Lineup loaded.');}
 });
 // Add extra navigation without changing the rest of the game.
 const menu=document.querySelector('#nav');const questButton=menu?.querySelector('[data-view="quests"]');
 if(menu&&questButton)questButton.insertAdjacentHTML('afterend','<button class="navitem" data-view="trials"><span>♜</span> Rival Trials <i>NEW</i></button>');
 // A live online result is still sent by the server even if the dialog is hidden.
 // Explicit Exit View used to discard the pending result; disable it during live games.
 document.addEventListener('click',e=>{if(e.target.closest('[data-action="exitmatch"]')&&duel?.type==='live'){e.stopImmediatePropagation();e.preventDefault();toast('Wait for your live match to finish before exiting.');}},true);
 // Navigate both legacy buttons and the new Trials button.
 document.addEventListener('click',e=>{const button=e.target.closest('#nav [data-view]');if(button)nav(button.dataset.view);});
 render();window.spikeExpansionVersion='2.0';
})();
