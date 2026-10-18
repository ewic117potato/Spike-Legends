from playwright.sync_api import sync_playwright
from pathlib import Path
import threading, http.server, functools
p=Path(__file__).resolve().parent.parent
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(p/'public'))
httpd=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
threading.Thread(target=httpd.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{httpd.server_port}/'
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
 page=browser.new_page(viewport={'width':1440,'height':900})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,body='window.supabase={};',content_type='text/javascript'))
 html=(p/'public/index.html').read_text()
 html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+ (p/'public/style.css').read_text().replace("@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');",'') + '</style>')
 html=html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>','<script>window.supabase={};</script>')
 for f in ['app.js','expansion.js','cloud.js']:
  html=html.replace('<script src="'+f+'"></script>','<script>'+(p/'public'/f).read_text()+'</script>')
 page.evaluate("""() => {const m={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m[k]||null,setItem:(k,v)=>m[k]=v,removeItem:k=>delete m[k]}}); if(!crypto.randomUUID)Object.defineProperty(crypto,'randomUUID',{value:()=>String(Math.random()).slice(2)+Date.now().toString(16)})}""")
 page.set_content(html,wait_until='domcontentloaded')
 page.wait_for_timeout(250)
 print('TITLE:',page.title(),'VERSION:',page.evaluate('window.spikeExpansionVersion'))
 print('NAV:',page.locator('.navitem').all_inner_texts())
 assert page.evaluate('window.spikeExpansionVersion')=='2.0',errors
 page.locator('[data-view="quests"]').click()
 print('QUEST HEADER:',page.locator('#view h1').inner_text())
 assert page.get_by_text('ASCENSION FORGE').count()==1
 page.screenshot(path='/mnt/data/Spike_Legends_Ascension_Quests.png',full_page=True)
 page.locator('[data-ex-login]').click()
 print('LOGIN:',page.locator('#modal h2').inner_text())
 page.locator('[data-action="close"]').last.click()
 page.locator('[data-ex-tab="weekly"]').click()
 print('WEEKLY:',page.locator('.ex-quest').count())
 page.locator('[data-ex-tab="milestone"]').click()
 print('MILESTONE:',page.locator('.ex-quest').count())
 page.locator('[data-view="summon"]').click()
 print('SUMMON SEALS:',page.locator('.ex-premium').count())
 page.evaluate("state.meta.epicSeals=1; save();render()")
 print('EPIC BUTTON:', page.locator('[data-ex-redeem="epic"]').get_attribute('disabled'),page.locator('[data-ex-redeem="epic"]').inner_text())
 page.locator('[data-ex-redeem="epic"]').click()
 print('GUARANTEED:',page.locator('#modal').inner_text()[:250], 'ERRORS:',errors)
 page.locator('[data-action="close"]').last.click()
 # Verify normal rolls, guaranteed pity and shiny-persistent inventory metadata.
 page.evaluate('state.coins=50000; save();')
 page.locator('[data-view="summon"]').click()
 before=page.evaluate('state.items.length')
 page.locator('[data-action="roll10"]').click()
 print('TEN ROLL:',page.locator('.reveal .card').count())
 assert page.evaluate('state.items.length')==before+10
 page.locator('[data-action="close"]').last.click()
 page.evaluate('state.meta.mythicPity=149; roll(1)')
 print('PITY DRAW:',page.evaluate('CATALOG.find(c=>c.key===state.items.at(-1).key).rarity'))
 assert page.evaluate('CATALOG.find(c=>c.key===state.items.at(-1).key).rarity')>=4
 page.locator('[data-action="close"]').last.click()
 page.locator('[data-view="trials"]').click()
 print('TRIALS:',page.locator('#view h1').inner_text(),page.locator('.ex-trial').count())
 page.screenshot(path='/mnt/data/Spike_Legends_Ascension_Trials.png',full_page=True)
 page.locator('[data-ex-trial="0"]').click()
 print('ARENA?',page.locator('.ex-court').count())
 page.locator('[data-ex-style="iron"]').click()
 print('TACTIC SELECT:',page.locator('.ex-tactic.on').inner_text())
 page.wait_for_timeout(1800)
 print('MATCH RALLY:',page.locator('.ex-arena-top').inner_text())
 page.screenshot(path='/mnt/data/Spike_Legends_Ascension_Duel.png',full_page=True)
 page.locator('[data-action="exitmatch"]').click()
 page.locator('[data-view="squad"]').click()
 print('CHEMISTRY:',page.locator('.ex-chem').count())
 page.locator('[data-ex-save-preset="0"]').click()
 assert page.locator('[data-ex-load-preset="0"]').is_enabled()
 print('PRESET SAVED:',page.evaluate('state.meta.lineups[0].length'))
 page.locator('[data-view="collection"]').click()
 print('INDEX:',page.locator('.ex-index').count())
 assert page.locator('.ex-index').count()==1
 print('ERRORS:',errors)
 assert not errors,errors
 browser.close()
httpd.shutdown()
