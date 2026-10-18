'use strict';
const assert=require('assert');
const {sanitizeSquad,teamwork,teamScore,chooseRally,isFinished,STYLES}=require('../server/match-engine');
const slots=['OH','MB','OP','OH','S','MB'];
const createSquad=(n,school='IRON CROWS')=>Array.from({length:6},(_,i)=>({
 name:'PLAYER_'+i,id:'p'+i,power:n,attack:n,defense:n,set:n,position:slots[i],school}));
assert.deepStrictEqual(sanitizeSquad([]),[]);
assert.deepStrictEqual(sanitizeSquad(createSquad(75).slice(0,5)),[]);
assert.strictEqual(sanitizeSquad(createSquad(1000))[0].attack,99);
assert.strictEqual(sanitizeSquad(createSquad(-100))[0].defense,35);
assert.strictEqual(teamwork(sanitizeSquad(createSquad(78))).schoolBonus,8);
const mixed=sanitizeSquad(createSquad(75).map((p,i)=>({...p,school:'SCHOOL_'+i})));
assert.strictEqual(teamwork(mixed).schoolBonus,0);
const room={rally:0,score:[0,0],stats:[{aces:0,blocks:0,digs:0,spikes:0},{aces:0,blocks:0,digs:0,spikes:0}],players:[
 {name:'A',squad:sanitizeSquad(createSquad(80)),strategy:'balanced'},
 {name:'B',squad:sanitizeSquad(createSquad(70)),strategy:'power'}]};
assert(teamScore(room.players[0],0)>teamScore(room.players[1],0));
for(let i=0;i<45&&!isFinished(room);i++){
 const m=chooseRally(room,()=>Math.random());
 assert(m.rally===i+1);assert(m.actor&&m.setter&&m.action);
 assert(m.score[0]+m.score[1]===i+1);
 assert(m.winner===0||m.winner===1);
 assert(m.chance>=.11&&m.chance<=.89);
}
assert(isFinished(room));
assert(room.score[0]+room.score[1]<=45);
assert.equal(Object.keys(STYLES).length,4);
console.log('PASS: 4 tactics, 6-player roster, stat clamping, school synergy, 45 server-generated rallies, finish condition, event payload.');
