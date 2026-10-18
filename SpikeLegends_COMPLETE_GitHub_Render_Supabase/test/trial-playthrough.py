"""Browser-playthrough smoke test; uses headless Chromium and accelerated timers."""
from pathlib import Path
from playwright.sync_api import sync_playwright
p=Path(__file__).resolve().parent.parent
html=(p/'public/index.html').read_text()
css=(p/'public/style.css').read_text()
css=css.replace("@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');",'')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
html=html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>','<script>window.supabase={};</script>')
for name in ('app.js','expansion.js','cloud.js'):
 html=html.replace('<script src="'+name+'"></script>','<script>'+(p/'public'/name).read_text()+'</script>')
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':850})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate("""() => {
 const m={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m[k]||null,setItem:(k,v)=>m[k]=v}});
 if(!crypto.randomUUID)Object.defineProperty(crypto,'randomUUID',{value:()=>String(Math.random()).slice(2)+Date.now().toString(16)});
 const original=window.setInterval;window.setInterval=(fn,ms,...args)=>original(fn,Math.min(ms,18),...args);
 }""")
 page.set_content(html,wait_until='domcontentloaded')
 page.wait_for_timeout(100)
 page.evaluate("Math.random=()=>.01") # 100% wins against AI in this test.
 page.locator('[data-view="trials"]').click()
 for i in range(3):
  page.locator(f'[data-ex-trial="{i}"]').click()
  page.wait_for_function('document.querySelector("#modal .ex-final-score")!==null',timeout=12000)
  print('Trial',i+1,'result:',page.locator('#modal .h1').inner_text())
  page.locator('#modal [data-action="close"]').last.click()
  print('STAGE:',page.evaluate('state.meta.trialStage'))
 assert page.evaluate('state.meta.trialStage')==3
 assert page.evaluate('state.meta.epicSeals')==1
 print('BONUS EPIC SEAL:',page.evaluate('state.meta.epicSeals'),'WINS:',page.evaluate('state.wins'))
 page.locator('[data-view="quests"]').click()
 assert page.locator('[data-ex-claim="daily|trial"]').is_enabled()
 page.locator('[data-ex-claim="daily|trial"]').click()
 print('QUEST SHARDS:',page.evaluate('state.meta.shards'))
 print('BROWSER ERRORS:',errors)
 assert not errors,errors
 b.close()
