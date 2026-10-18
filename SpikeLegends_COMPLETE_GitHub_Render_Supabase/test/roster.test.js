'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root=require('node:path').resolve(__dirname,'..');
const js=fs.readFileSync(root+'/public/haikyuu-data.js','utf8');
const code=fs.readFileSync(root+'/public/app.js','utf8');
const home={innerHTML:'',textContent:'',addEventListener(){},classList:{add(){},remove(){},toggle(){}}};
const nav={querySelector(){return null}};
const el=s=>s==='#nav'?nav:home;
const document={querySelector:el,querySelectorAll:()=>[],addEventListener(){}};
const sandbox={document,window:{scrollTo(){}},localStorage:{getItem:()=>null,setItem(){}},crypto:require('node:crypto'),console,URLSearchParams};
sandbox.window=sandbox.window;sandbox.window.location={search:''}; sandbox.location={search:''};
vm.createContext(sandbox);vm.runInContext(js+'\n'+code+'\n'+`globalThis.TEST_DATA={catalog:CATALOG,team:team(),rarities:rarities};`,sandbox);
const {catalog,team,rarities}=sandbox.TEST_DATA;
const names=new Set(catalog.map(p=>p.name));
assert.equal(names.size,52,'52 different Haikyuu roster characters');
assert.equal(catalog.length,156,'3 versions each');
assert.equal(team.length,6,'Existing starter squad still works');
assert.equal(team[0].name,'Shoyo Hinata');
assert.equal(team[4].name,'Tobio Kageyama');
for(const c of catalog){
 assert(c.name&&c.school&&c.position&&c.ability);
 assert.match(c.art,/<img src="portraits\//);
 assert(fs.existsSync(root+'/public/'+c.portrait),c.portrait);
 assert(c.rarity>=0&&c.rarity<rarities.length);
}
for(let i=0;i<rarities.length;i++)assert(catalog.some(c=>c.rarity===i),'all rarities must have at least one card');
console.log('PASS: 52 actual Haikyuu characters, 156 variants, 52 portrait images, all rarity pools and starter squad.');
