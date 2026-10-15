// Run against npm run dev -- --host 127.0.0.1 --port 5174. No test dependencies.
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const out = path.join(os.tmpdir(), 'sublime-personalizer-scroll-review')
await mkdir(out, { recursive: true })
const port = 9600 + Math.floor(Math.random() * 1000)
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=' + port,
  '--user-data-dir=' + path.join(out, 'profile-' + Date.now()), 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
let chromeLog = ''
chrome.stderr.on('data', data => { chromeLog += data.toString() })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const checks = [], errors = []
const samples = [], cause = [], hitAudit = []
let ws
try {
  let info
  for (let i = 0; i < 60; i++) {
    try { info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break } catch { await pause(500) }
  }
  if (!info) throw new Error('Chrome endpoint unavailable: ' + chromeLog)
  ws = new WebSocket(info.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
  let sequence = 0
  const pending = new Map()
  ws.onmessage = event => {
    const message = JSON.parse(event.data)
    if (message.id) {
      const handler = pending.get(message.id)
      pending.delete(message.id)
      clearTimeout(handler?.timer)
      message.error ? handler?.reject(new Error(JSON.stringify(message.error))) : handler?.resolve(message.result)
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text)
  }
  function send(method, params = {}, sessionId) {
    const id = ++sequence
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout: ' + method)), 30000)
      pending.set(id, { resolve, reject, timer })
      ws.send(JSON.stringify({ id, method, params, sessionId }))
    })
  }
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const cdp = (method, params) => send(method, params, sessionId)
  await cdp('Page.enable'); await cdp('Runtime.enable')
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.revoked = []; window.created = [];
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = blob => { const url = create(blob); window.created.push(url); return url };
    URL.revokeObjectURL = url => { window.revoked.push(url); revoke(url) };
  ` })
  async function evaluate(expression) {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  function record(name, pass, details) {
    checks.push({ name, pass: !!pass, ...(details === undefined ? {} : { details }) })
    console.log((pass ? 'PASS ' : 'FAIL ') + name)
  }
  const check = async (name, expression) => record(name, await evaluate(expression))
  async function until(expression) {
    for (let i = 0; i < 120; i++) { if (await evaluate(expression)) return; await pause(100) }
    throw new Error('Timed out: ' + expression)
  }
  async function navigate(route) {
    await cdp('Page.navigate', { url: (process.env.REVIEW_URL || 'http://127.0.0.1:5174') + route })
    await pause(400)
    await until('!!document.querySelector(".personalizer")')
    await evaluate('document.fonts.ready.then(() => true)')
  }
  async function click(selector) {
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await pause(180)
  }
  async function screenshot(name) {
    const image = await cdp('Page.captureScreenshot', { format: 'png' })
    await writeFile(path.join(out, name + '.png'), Buffer.from(image.data, 'base64'))
  }
  async function mug(width, reduced = true) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: width < 600 ? 844 : 960, deviceScaleFactor: 1, mobile: width < 768 })
    await cdp('Emulation.setTouchEmulationEnabled', { enabled: width < 1024, maxTouchPoints: 5 })
    await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] })
    await navigate('/personalize/1')
    await until('!!document.querySelector(".pz-scene canvas") && !document.querySelector(".pz-reset").disabled')
    await evaluate(`(async () => {
      const fiber = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      window.three = await import('/node_modules/.vite/deps/three.js');
      window.state = () => fiber._roots.get(document.querySelector('.pz-scene canvas')).store.getState();
      const node = document.querySelector('.personalizer');
      let owner = node[Object.keys(node).find(key => key.startsWith('__reactFiber'))];
      while (owner && !owner.memoizedState?.memoizedState?.getDesign) owner = owner.return;
      window.designStore = owner.memoizedState.memoizedState;
      window.design = () => designStore.getDesign();
      window.el = () => design().elements.find(e=>e.id===design().selectedElementId);
      const geometry = await import('/src/components/personalizer/editor/geometry.ts');
      const mobileSelection = await import('/src/components/personalizer/3d/mobileSelection.ts');
      const { pickPrintablePoint } = await import('/src/components/personalizer/3d/printableSurface.ts');
      const { MOBILE_HANDLES } = await import('/src/components/personalizer/3d/personalizer3dConfig.ts');
      // Test-only inspection of the same raycast and handle priority as pointerdown.
      window.inspectHit = screen => {
        const canvas = document.querySelector('.pz-scene canvas');
        const rect = canvas.getBoundingClientRect(), { camera, scene } = state();
        scene.updateMatrixWorld(); camera.updateMatrixWorld();
        const ray = new three.Raycaster();
        ray.setFromCamera(new three.Vector2((screen.x-rect.left)/rect.width*2-1, 1-(screen.y-rect.top)/rect.height*2), camera);
        const intersections = ray.intersectObjects(scene.children, true).filter(({object}) => {
          if (!object.isMesh || object.name === 'selection-overlay') return false;
          for (let node=object; node; node=node.parent) if (!node.visible) return false;
          return true;
        });
        const point = pickPrintablePoint(ray, scene);
        const handles = mobileSelection.projectMobileHandles(design(), camera, scene, rect);
        const x=screen.x-rect.left, y=screen.y-rect.top;
        const mobileHandle = mobileSelection.hitMobileHandle(handles,x,y);
        const handle = innerWidth<1024 ? mobileHandle?.kind : point && el() ? geometry.hitTestHandle(el(),point,false,design().space) : null;
        const body = point && geometry.hitTest(design().elements,point,design().space);
        const dom = document.elementFromPoint(screen.x,screen.y);
        const onCanvas = dom===canvas && screen.x>rect.left && screen.x<rect.right && screen.y>rect.top && screen.y<rect.bottom;
        return { screen, dom:dom?.className, onCanvas, nearestMesh:intersections[0]?.object.name ?? null,
          point:point ?? null, body:body ? {id:body.id,type:body.type} : null, handle:handle ?? null,
          touchDiameter:MOBILE_HANDLES.touchDiameter,
          handles:handles.map(h=>({kind:h.kind, distance:Math.hypot(x-h.x,y-h.y), insideTarget:Math.hypot(x-h.x,y-h.y)<=MOBILE_HANDLES.touchDiameter/2})),
          empty:onCanvas && !!point && !body && !handle };
      };
      window.project = (x, y) => {
        const angle = -Math.PI + x / 1024 * Math.PI * 2;
        const point = new three.Vector3(.942 * Math.sin(angle), (.5-y/512)*1.94, .942*Math.cos(angle));
        point.project(state().camera);
        const r = document.querySelector('.pz-scene canvas').getBoundingClientRect();
        return {x:r.left+(point.x+1)*r.width/2,y:r.top+(1-point.y)*r.height/2};
      };
      return true;
    })()`)
  }
  async function start() {
    await click('.pz-method-option button')
    await evaluate(`document.querySelector('.pz-workspace').scrollIntoView({block:'start',behavior:'instant'})`)
    await pause(250)
  }
  async function upload(type = 'image/png', options = {}) {
    await evaluate(`(async () => {
      const c = document.createElement('canvas'); c.width = 400; c.height = 240;
      const ctx = c.getContext('2d'); ctx.fillStyle='#28a6b5';ctx.fillRect(0,0,400,240);
      ctx.fillStyle='#fbc849';ctx.fillRect(0,0,120,240);ctx.fillStyle='#fff';ctx.font='36px Arial';ctx.fillText('SUBLIME',140,130);
      const blob = await new Promise(resolve=>c.toBlob(resolve,${JSON.stringify(type)}));
      const file = new File([${options.large ? 'new Uint8Array(20*1024*1024+1)' : options.corrupt ? "'invalid'" : 'blob'}], 'photo.${type.split('/')[1]}', {type:${JSON.stringify(type)}});
      const dt = new DataTransfer();dt.items.add(file);const input=document.querySelector('input[type=file]');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
    })()`)
    await until('!document.querySelector(".pz-upload-status") || document.querySelector(".pz-upload-status").getAttribute("role") === "alert"')
    await pause(160)

  }
  async function pointer(type, point, touch) {
    if (touch) await cdp('Input.dispatchTouchEvent', { type: ({ down: 'touchStart', move: 'touchMove', up: 'touchEnd' })[type], touchPoints: type === 'up' ? [] : [{ ...point, id: 1 }] })
    else await cdp('Input.dispatchMouseEvent', { type: ({ down: 'mousePressed', move: 'mouseMoved', up: 'mouseReleased' })[type], ...point, button: 'left', buttons: type === 'up' ? 0 : 1, clickCount: 1 })
  }
  async function drag(from, to, touch, during) {
    await pointer('down', from, touch)
    for (let i = 1; i <= 8; i++) {
      await pointer('move', { x: from.x + (to.x - from.x) * i / 8, y: from.y + (to.y - from.y) * i / 8 }, touch)
      await pause(25)
    }
    if (during) await during()
    await pointer('up', to, touch)
    await pause(250)
  }



  const snapshot = () => evaluate(`({y:scrollY,height:document.documentElement.scrollHeight,workspace:document.querySelector('.pz-workspace').getBoundingClientRect().height,active:document.activeElement?.tagName,selected:design().selectedElementId})`)
  async function stable(name, action, desktop = false) {
    const before=await snapshot();await action();await pause(120);const after=await snapshot()
    const sample={name,before,after,delta:after.y-before.y};samples.push(sample)
    record(name,Math.abs(sample.delta)<=2&&(!desktop||Math.abs(after.workspace-before.workspace)<=2),sample)
  }
  async function key(key, code=key, windowsVirtualKeyCode=0) {
    await cdp('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode})
    await cdp('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode})
    await pause(50)
  }
  async function tap(point,touch=false) {await pointer('down',point,touch);await pointer('up',point,touch);await pause(70)}
  async function tapSurface(name,touch) {
    const before=await emptySurface(name);
    await tap(before.hit.screen,touch);
    const after=await evaluate('({selected:design().selectedElementId,controls:state().controls.enabled})');
    hitAudit.push({name,before,after});
    record(name+': empty touch/click deselects and restores orbit',after.selected===null&&after.controls,{before,after});
  }
  async function emptySurface(name) {
    const before=await evaluate(`(() => {
      const original=inspectHit(project(512,400));
      // Prefer the original coordinate, but never assume a UV coordinate is
      // empty: camera, artwork bounds and 44px handle targets can all change.
      const safe = p => [[0,0],[-4,0],[4,0],[0,-4],[0,4]].every(([dx,dy]) => inspectHit({x:p.x+dx,y:p.y+dy}).empty);
      if (original.empty && safe(original.screen)) return {original,hit:original,selected:design().selectedElementId};
      const r=document.querySelector('.pz-scene canvas').getBoundingClientRect();
      for (let y=Math.max(8,r.top+8);y<Math.min(innerHeight-8,r.bottom-8);y+=12) {
        for (let x=Math.max(8,r.left+8);x<Math.min(innerWidth-8,r.right-8);x+=12) {
          const hit=inspectHit({x,y});
          if (hit.empty && safe(hit.screen)) return {original,hit,selected:design().selectedElementId};
        }
      }
      return {original,hit:null,selected:design().selectedElementId};
    })()`);
    record(name+': raycast proves empty surface outside body and handles',before.hit?.empty===true,before);
    if (!before.hit) throw new Error('No verified empty printable surface for '+name);
    return before;
  }
  async function realClick(selector,touch=false) {
    const point=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`)
    if(point.y<0||point.y>await evaluate('innerHeight')) throw new Error('Target outside viewport: '+selector)
    await tap(point,touch)
  }
  async function prepareViewer() {
    // Explicit test positioning is separate from each measured interaction.
    await evaluate(`state().controls.target.set(0,0,0);state().camera.position.set(0,0,innerWidth<1024?3.2:5.2);state().controls.update();state().invalidate();document.querySelector('.pz-workspace').scrollIntoView({block:'start',behavior:'instant'});document.activeElement?.blur();true`)
    await until(`(()=>{const c=document.querySelector('.pz-scene canvas').getBoundingClientRect(),s=document.querySelector('.pz-viewer-surface').getBoundingClientRect();return Math.abs(c.height-s.height)<1&&Math.abs(c.width-s.width)<1})()`)
    await pause(150)
  }

  if (process.env.REVIEW_HIT_AUDIT === '1') {
    for (const width of [390,430,768,1024,1280,1440]) {
      await mug(width); await start(); await prepareViewer();
      await realClick('[aria-label="Adicionar texto"]',width<1024);
      for (const kind of ['text','photo']) {
        if (kind==='photo') await upload();
        const before=await evaluate('({hit:inspectHit(project(512,400)),selected:design().selectedElementId})');
        await tap(before.hit.screen,width<1024);
        const after=await evaluate('({selected:design().selectedElementId,controls:state().controls.enabled})');
        hitAudit.push({width,kind,before,after});
      }
    }
    await writeFile(path.join(out,'hit-audit.json'),JSON.stringify(hitAudit,null,2));
    console.log(JSON.stringify(hitAudit,null,2));
    await send('Browser.close'); ws.close(); chrome.kill();
    process.exit(0);
  }

  // Negative control: reintroduce only the former desktop layout/anchoring.
  // Fixed height alone still permits a dynamic descendant to anchor the page.
  for(const mode of ['legacy','fixed-only','scoped-anchor-only','corrected']) {
    await mug(1440);await start()
    const css=mode==='legacy'?'.pz-workspace {overflow-anchor:auto}.pz-workspace-editing .pz-panel-content {height:auto}':mode==='fixed-only'?'.pz-workspace {overflow-anchor:auto}':mode==='scoped-anchor-only'?'.pz-workspace-editing .pz-panel-content {height:auto}':''
    await evaluate(`(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.append(s);window.scrollBy(0,400);window.automaticCalls=[];for(const name of ['focus','scrollIntoView']){const original=HTMLElement.prototype[name];HTMLElement.prototype[name]=function(...args){automaticCalls.push(name);return original.apply(this,args)}}})()`)
    await pause(300);const before=await snapshot();await click('[aria-label="Adicionar texto"]');const after=await snapshot();const calls=await evaluate('automaticCalls')
    cause.push({mode,before,after,calls})
    record('causal control: '+mode,(mode==='legacy'||mode==='fixed-only'?after.y-before.y>200:Math.abs(after.y-before.y)<=2)&&calls.length===0,{before,after,calls})
  }

  for(const width of [390,430,768,1024,1280,1440]) {
    const desktop=width>=1024,touch=!desktop
    await mug(width);await start();await prepareViewer()
    await stable(width+': add visible text',()=>realClick('[aria-label="Adicionar texto"]',touch),desktop)
    await check(width+': insertion in visible surface',`(()=>{const p=project(el().x,el().y),r=document.querySelector('.pz-scene canvas').getBoundingClientRect();return p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom})()`)
    await evaluate('window.seed=el().id')
    for(let cycle=0;cycle<10;cycle++) {
      const prefix=width+' cycle '+cycle
      await stable(prefix+': empty printable surface deselect',()=>tapSurface(prefix+': text',touch),desktop)
      await check(prefix+': deselected with OrbitControls enabled','design().selectedElementId===null&&state().controls.enabled')
      await stable(prefix+': select text',async()=>{await tap(await evaluate('(()=>{const e=design().elements.find(e=>e.id===seed);return project(e.x,e.y)})()'),touch)},desktop)
      await check(prefix+': text selected','design().selectedElementId===seed')
      await stable(prefix+': add text',()=>realClick('[aria-label="Adicionar texto"]',touch),desktop)
      await stable(prefix+': delete',()=>key('Delete','Delete',46),desktop)
      await stable(prefix+': undo',()=>realClick('[aria-label="Desfazer"]',touch),desktop)
      await check(prefix+': undo restores text','design().elements.length===2')
      await stable(prefix+': redo',()=>realClick('[aria-label="Refazer"]',touch),desktop)
      await check(prefix+': redo removes text','design().elements.length===1')
      await stable(prefix+': add photo',()=>upload(),desktop)
      await check(prefix+': photo selected','el()?.type==="photo"')
      await stable(prefix+': deselect photo',()=>tapSurface(prefix+': photo',touch),desktop)
      await stable(prefix+': select photo',async()=>{await tap(await evaluate('(()=>{const e=design().elements.find(e=>e.type==="photo");return project(e.x,e.y)})()'),touch)},desktop)
      await check(prefix+': photo selected again','el()?.type==="photo"')
      await stable(prefix+': delete photo',()=>key('Delete','Delete',46),desktop)
    }
    // Actual empty-surface drag must still orbit after deselecting a text.
    await evaluate('designStore.select(seed);window.cameraBefore=state().camera.position.clone();true')
    await stable(width+': empty surface drag/orbit',async()=>{const before=await emptySurface(width+': orbit');hitAudit.push({name:width+': orbit',before});const p=before.hit.screen;await drag(p,{x:p.x+24,y:p.y},touch)},desktop)
    await check(width+': orbit works and text deselected','!design().selectedElementId&&state().controls.enabled&&state().camera.position.distanceTo(cameraBefore)>.01')
    await prepareViewer()
    // Start native chooser; CDP interception cannot drive the OS Cancel button.
    await cdp('Page.setInterceptFileChooserDialog',{enabled:true})
    await stable(width+': open file chooser',()=>realClick('[aria-label="Adicionar foto"]',touch),desktop)
    await stable(width+': file cancel event',()=>evaluate(`document.querySelector('input[type=file]').dispatchEvent(new Event('cancel',{bubbles:true}))`),desktop)
    await cdp('Page.setInterceptFileChooserDialog',{enabled:false})
    const pngPath=path.join(out,'upload.png')
    const png=await evaluate(`(()=>{const c=document.createElement('canvas');c.width=120;c.height=80;c.getContext('2d').fillRect(0,0,120,80);return c.toDataURL().split(',')[1]})()`)
    await writeFile(pngPath,Buffer.from(png,'base64'))
    const {root}=await cdp('DOM.getDocument')
    const {nodeId}=await cdp('DOM.querySelector',{nodeId:root.nodeId,selector:'input[type=file]'})
    await stable(width+': browser file selection',async()=>{await cdp('DOM.setFileInputFiles',{nodeId,files:[pngPath]});await until('el()?.type==="photo"')},desktop)
    await check(width+': native input upload inserted photo','el()?.type==="photo"')
    await key('Delete','Delete',46)
    await check(width+': hidden file input has no layout or focus',`document.querySelector('input[type=file]').getClientRects().length===0&&document.activeElement!==document.querySelector('input[type=file]')`)

    await evaluate('designStore.select(seed)');await pause(100)
    await evaluate(`document.querySelector('[aria-label="Fonte"]').scrollIntoView({block:'center',behavior:'instant'})`);await pause(150)
    await stable(width+': open font picker',()=>realClick('[aria-label="Fonte"]',touch),desktop)
    await check(width+': all 12 own-family previews and UI category font',`(()=>{const options=[...document.querySelectorAll('[role=option]')];return options.length===12&&options.every(o=>getComputedStyle(o.firstElementChild).fontFamily.includes('Sublime '+o.textContent))&&![...document.querySelectorAll('.pz-font-category')].some(o=>getComputedStyle(o).fontFamily.includes('Sublime '))})()`)
    await check(width+': menu bounded by viewport',`(()=>{const r=document.querySelector('[role=listbox]').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth&&document.documentElement.scrollWidth<=innerWidth})()`)
    await screenshot('font-preview-'+width)
    await stable(width+': Escape closes without selection change',()=>key('Escape','Escape',27),desktop)
    await check(width+': Escape returns focus','document.activeElement.getAttribute("role")==="combobox"&&!document.querySelector("[role=listbox]")&&el().fontFamily==="Figtree"')
    await stable(width+': Enter opens',()=>key('Enter','Enter',13),desktop)
    await stable(width+': ArrowDown navigates',()=>key('ArrowDown','ArrowDown',40),desktop)
    await check(width+': navigation does not commit','el().fontFamily==="Figtree"&&document.getElementById(document.activeElement.getAttribute("aria-activedescendant")).textContent==="Montserrat"')
    await stable(width+': Space selects',()=>key(' ','Space',32),desktop)
    await check(width+': selection applied and kept','el().id===seed&&el().fontFamily==="Montserrat"&&!document.querySelector("[role=listbox]")')
    await stable(width+': Space opens',()=>key(' ','Space',32),desktop)
    await stable(width+': ArrowUp navigates',()=>key('ArrowUp','ArrowUp',38),desktop)
    await stable(width+': Enter selects',()=>key('Enter','Enter',13),desktop)
    await check(width+': ArrowUp selection','el().fontFamily==="Figtree"')
    await key('Enter','Enter',13)
    await key('Tab','Tab',9)
    await check(width+': Tab closes and advances focus',`!document.querySelector('[role=listbox]')&&document.activeElement.getAttribute('aria-label')==='Peso da fonte'`)
    await evaluate(`document.querySelector('[aria-label="Fonte"]').focus({preventScroll:true})`)
    await key('Enter','Enter',13)
    await stable(width+': outside click closes',async()=>{await tap({x:4,y:300},touch)},desktop)
    await check(width+': outside preserves font','!document.querySelector("[role=listbox]")&&el().fontFamily==="Figtree"')
    await realClick('[aria-label="Fonte"]',touch)
    const option=await evaluate(`(()=>{const o=[...document.querySelectorAll('[role=option]')].find(o=>o.textContent==='Montserrat');const r=o.getBoundingClientRect();return {x:r.left+20,y:r.top+r.height/2}})()`)
    await stable(width+': pointer/touch chooses font',()=>tap(option,touch),desktop)
    await check(width+': pointer/touch font result','el().fontFamily==="Montserrat"&&!document.querySelector("[role=listbox]")&&design().selectedElementId===seed')
    await prepareViewer()
    if(desktop) {
      await evaluate('window.scrollBy(0,400)');await pause(150)
      await stable(width+': lower viewport deselect',()=>evaluate('designStore.select(null)'),true)
      await stable(width+': lower viewport add',()=>click('[aria-label="Adicionar texto"]'),true)
    } else {
      await check(width+': mobile external scrolling retained',`getComputedStyle(document.querySelector('.pz-panel-content')).overflowY==='visible'&&document.querySelector('.pz-panel-shell').getBoundingClientRect().height>1000`)
      await evaluate('window.scrollBy(0,150)');await pause(150)
      await check(width+': page can scroll normally','scrollY>500')
      await stable(width+': mobile deselect at lower editor',()=>evaluate('designStore.select(null)'))
    }
    await check(width+': buttons explicit and no form/hash navigation',`[...document.querySelectorAll('.pz-workspace button')].every(b=>b.getAttribute('type')==='button')&&!document.querySelector('.pz-workspace form,.pz-workspace a[href="#"]')&&!location.hash`)
  }

  // Cold font cache: previews request one normal/400 face per family, once.
  await mug(1440);await start();await click('[aria-label="Adicionar texto"]')
  await evaluate(`window.fonts=await import('/src/components/personalizer/editor/fontCatalog.ts');await fonts.loadFont({fontFamily:'Figtree',fontWeight:400,fontStyle:'normal'});window.fontLoads=[];window.releaseFonts=[];window.originalLoad=FontFace.prototype.load;FontFace.prototype.load=function(){const face=this;fontLoads.push({family:face.family,weight:face.weight,style:face.style});return new Promise(resolve=>releaseFonts.push(()=>originalLoad.call(face).then(resolve)))};true`)
  await click('[aria-label="Fonte"]')
  await check('cold open loads only 11 remaining regular faces without blocking menu',`document.querySelectorAll('[role=option]').length===12&&fontLoads.length===11&&fontLoads.every(f=>f.weight==='400'&&f.style==='normal')`)
  await evaluate('FontFace.prototype.load=originalLoad;releaseFonts.forEach(release=>release());true')
  await until(`fonts.fontCatalog.every(f=>document.fonts.check('400 18px "Sublime '+f.family+'"'))`)
  await check('all 12 preview faces loaded',`document.fonts.size>=12&&fonts.fontCatalog.every(f=>document.fonts.check('400 18px "Sublime '+f.family+'"'))`)
  await key('Escape','Escape',27)
  await evaluate('window.requestsBefore=performance.getEntriesByType("resource").filter(r=>r.name.includes("/fonts/personalizer/")).length;true')
  await click('[aria-label="Fonte"]');await pause(150)
  await check('reopen reuses promises and makes no font downloads',`performance.getEntriesByType('resource').filter(r=>r.name.includes('/fonts/personalizer/')).length===requestsBefore&&fontLoads.length===11`)
  await check('cached promise identity',`fonts.loadFont({fontFamily:'Caveat',fontWeight:400,fontStyle:'normal'})===fonts.loadFont({fontFamily:'Caveat',fontWeight:400,fontStyle:'normal'})`)
  await cdp('Network.enable');await cdp('Network.setBlockedURLs',{urls:['*fonts/personalizer/*']})
  await mug(1440);await start();await click('[aria-label="Adicionar texto"]');await click('[aria-label="Fonte"]')
  await check('failed previews still allow choosing and editing',`(()=>{[...document.querySelectorAll('[role=option]')].find(o=>o.textContent==='Caveat').click();return true})()`)
  await pause(100)
  await check('failed preview selection retains a usable fallback','el().fontFamily==="Caveat"&&el().width>0&&!document.querySelector("[role=listbox]")')
  await cdp('Network.setBlockedURLs',{urls:[]})
  const report={checks,errors,samples,cause,hitAudit,passed:checks.every(c=>c.pass)&&!errors.length}
  await writeFile(path.join(out,'review.json'),JSON.stringify(report,null,2))
  console.log(JSON.stringify({out,passed:report.passed,checks:checks.length,failed:checks.filter(c=>!c.pass),errors},null,2))
  await send('Browser.close');ws.close();chrome.kill();process.exitCode=report.passed?0:1
} catch(error) {
  await writeFile(path.join(out,'review.json'),JSON.stringify({checks,errors,samples,cause,hitAudit,error:String(error)},null,2))
  console.error(error);ws?.close();chrome.kill();process.exitCode=1
}
