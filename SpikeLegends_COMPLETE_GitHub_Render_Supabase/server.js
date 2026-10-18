'use strict';
const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {WebSocketServer,WebSocket}=require('ws');
const {STYLES,sanitizeSquad,teamwork,chooseRally,isFinished}=require('./server/match-engine');
const PORT=process.env.PORT||3000;
const root=path.join(__dirname,'public');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
 const route=(req.url||'/').split('?')[0];
 if(route==='/health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,service:'spike-legends',version:'rival-ascension-v2.1-haikyuu'}));return;}
 if(route==='/api/public-config'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({supabaseUrl:process.env.SUPABASE_URL||'',supabasePublishableKey:process.env.SUPABASE_PUBLISHABLE_KEY||''}));return;}
 let pathname;
 try{pathname=decodeURIComponent(route)}catch{res.writeHead(400);res.end('Bad request');return;}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);});
});
const wss=new WebSocketServer({server,maxPayload:12000});
const rooms=new Map();
const TICK=Math.max(80,Math.min(10000,Number(process.env.RALLY_INTERVAL_MS)||1750));
const safeName=x=>String(x||'PLAYER').replace(/[^\w \-]/g,'').trim().slice(0,18)||'PLAYER';
function send(ws,obj){if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(obj));}
function broadcast(room,obj){for(const p of room.players)send(p.ws,obj);}
function code(){let out;do{out=crypto.randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(out));return out;}
function clearTimer(room){if(room.timer)clearInterval(room.timer);room.timer=null;}
function snapshot(room){room.players.forEach((p,i)=>send(p.ws,{type:'room',code:room.code,youIndex:i,
 status:room.status,players:room.players.map(x=>({name:x.name,ready:x.ready,power:Math.round(x.squad.reduce((s,y)=>s+y.power,0)/6),strategy:x.strategy,school:teamwork(x.squad).topSchool})),
 strategies:room.players.map(x=>x.strategy),format:'First to 15 · win by 2'}));}
function reset(room){clearTimer(room);room.status='waiting';room.score=[0,0];room.rally=0;room.stats=[{aces:0,blocks:0,digs:0,spikes:0},{aces:0,blocks:0,digs:0,spikes:0}];room.boxScore=[{},{}];room.rematchVotes.clear();room.players.forEach(p=>p.ready=false);snapshot(room);}
function finish(room){clearTimer(room);room.status='finished';const winner=room.score[0]>room.score[1]?0:1;
 const mvp=room.boxScore.map(b=>Object.entries(b).sort((a,b)=>b[1]-a[1])[0]||['Unknown',0]);
 broadcast(room,{type:'finish',winner,score:room.score.slice(),rallies:room.rally,stats:room.stats,mvp,at:Date.now()});}
function nextRally(room){if(room.status!=='playing')return;const ev=chooseRally(room);broadcast(room,ev);if(isFinished(room))finish(room);}
function begin(room){room.status='playing';room.rally=0;room.score=[0,0];room.stats=[{aces:0,blocks:0,digs:0,spikes:0},{aces:0,blocks:0,digs:0,spikes:0}];room.boxScore=[{},{}];
 broadcast(room,{type:'start',players:room.players.map(p=>({name:p.name,squad:p.squad,strategy:p.strategy,synergy:teamwork(p.squad)})),score:room.score.slice(),at:Date.now()});
 room.timer=setInterval(()=>nextRally(room),TICK);
}
function leave(ws){const room=rooms.get(ws.roomCode);ws.roomCode=null;if(!room)return;
 const wasPlaying=room.status==='playing',p=room.players.find(p=>p.ws===ws);clearTimer(room);
 room.players=room.players.filter(p=>p.ws!==ws);
 if(room.players.length===0){rooms.delete(room.code);return;}
 reset(room);broadcast(room,{type:'notice',text:wasPlaying?'Opponent disconnected. The match was cancelled; no result recorded.':'Opponent left the room.'});
}
wss.on('connection',ws=>{
 ws.isAlive=true;
 ws.on('pong',()=>{ws.isAlive=true;});
 ws.on('message',raw=>{let m;try{m=JSON.parse(raw.toString())}catch{return;}
  try{
   if(m.type==='create'||m.type==='join'){
    // Validate before leaving an existing room, so an invalid request cannot destroy a match.
    const squad=sanitizeSquad(m.squad);if(squad.length!==6){send(ws,{type:'error',text:'Equip six athletes before entering a duel.'});return;}
    const roomCode=m.type==='create'?code():String(m.code||'').trim().toUpperCase();
    let target=rooms.get(roomCode);
    if(m.type==='join'&&ws.roomCode===roomCode){send(ws,{type:'error',text:'You are already in this room.'});return;}
    if(m.type==='join'&&(!target||target.players.length>=2||target.status!=='waiting')){send(ws,{type:'error',text:'Room is full, started, or no longer exists.'});return;}
    leave(ws);
    if(!target){target={code:roomCode,status:'waiting',players:[],score:[0,0],rally:0,timer:null,rematchVotes:new Set(),stats:[{},{}],boxScore:[{},{}],createdAt:Date.now()};rooms.set(roomCode,target);}
    target.players.push({ws,name:safeName(m.name),ready:false,squad,strategy:STYLES[m.strategy]?m.strategy:'balanced'});ws.roomCode=roomCode;
    snapshot(target);return;
   }
   const room=rooms.get(ws.roomCode);if(!room)return;
   const player=room.players.find(p=>p.ws===ws);if(!player)return;
   if(m.type==='ready'&&room.status==='waiting'){
    player.ready=!!m.ready;snapshot(room);if(room.players.length===2&&room.players.every(p=>p.ready))begin(room);
   }
   if(m.type==='strategy'&&(room.status==='playing'||room.status==='waiting')){
    if(!STYLES[m.strategy])return;player.strategy=m.strategy;
    broadcast(room,{type:'strategy',strategies:room.players.map(p=>p.strategy),by:room.players.indexOf(player)});
   }
   if(m.type==='rematch'&&room.status==='finished'){
    room.rematchVotes.add(player);if(room.rematchVotes.size===2)reset(room);
    else send(ws,{type:'rematch_wait',text:'Waiting for opponent to request a rematch.'});
   }
   if(m.type==='leave')leave(ws);
  }catch(error){console.error('WebSocket error',error);send(ws,{type:'error',text:'Server error; try joining again.'});}
 });
 ws.on('close',()=>leave(ws));
});
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(ws.isAlive===false){ws.terminate();continue;}ws.isAlive=false;ws.ping();}},25000);heartbeat.unref();
const expiry=setInterval(()=>{const limit=Date.now()-90*60*1000;for(const room of rooms.values())if(room.createdAt<limit&&room.status!=='playing'){broadcast(room,{type:'notice',text:'Lobby expired; create a new room.'});for(const p of [...room.players]){p.ws.roomCode=null;}clearTimer(room);rooms.delete(room.code);}},60000);expiry.unref();
server.listen(PORT,'0.0.0.0',()=>console.log(`SPIKE LEGENDS Haikyuu Fan Roster listening at http://localhost:${PORT}`));
