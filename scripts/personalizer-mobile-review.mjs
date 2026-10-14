// Run against npm run dev -- --host 127.0.0.1 --port 5174. No test dependencies.
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const out = path.join(os.tmpdir(), 'sublime-personalizer-mobile-review')
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
    // Transform fixtures use a known center. Visible insertion is covered by
    // personalizer-insertion-review.mjs without repositioning any new content.
    if (selector === '[aria-label="Adicionar texto"]') {
      await evaluate('designStore.move(design().selectedElementId,512,256);designStore.commit()')
    }
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
    const countBefore = await evaluate('design().elements.length')
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
    await evaluate(`if(design().elements.length>${countBefore}) {designStore.move(design().selectedElementId,512,256);designStore.commit()}`)
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

  async function front(distance) {
    await evaluate(`state().controls.target.set(0,0,0);state().camera.position.set(0,0,${distance});state().controls.update();state().invalidate();document.querySelector('.pz-workspace').scrollIntoView({block:'start',behavior:'instant'});true`)
    await pause(200)
  }
  async function handles() {
    return evaluate(`(()=>{const s=state(),r=s.gl.domElement.getBoundingClientRect();return mobile.projectMobileHandles(design(),s.camera,s.scene,r).map(h=>({...h,x:h.x+r.left,y:h.y+r.top}))})()`)
  }
  for (const width of [390,430,768,1024,1280,1440]) {
    const touch=width<1024
    await mug(width);await start();await upload()
    await evaluate(`(async()=>{window.mobile=await import('/src/components/personalizer/3d/mobileSelection.ts');window.geom=await import('/src/components/personalizer/editor/geometry.ts');window.el=()=>design().elements[0];return true})()`)
    const layout=await evaluate(`(()=>{const surface=document.querySelector('.pz-viewer-surface'),panel=document.querySelector('.pz-panel-content'),stage=document.querySelector('.pz-stage');return {viewer:surface.clientHeight,panel:panel.clientHeight,panelScroll:panel.scrollHeight,overflow:getComputedStyle(panel).overflowY,stage:getComputedStyle(stage).position,document:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,min:state().controls.minDistance,max:state().controls.maxDistance}})()`)
    record(width+': layout and zoom configuration',layout.width<=width&&layout.min===(touch?2.6:5.2)&&layout.max===8.5&&(touch?layout.viewer>=420&&layout.panel>520&&layout.overflow==='visible'&&layout.stage==='static':layout.viewer>=360&&layout.overflow==='auto'),layout)
    await front(.5)
    await check(width+': near limit enforced','Math.abs(state().camera.position.distanceTo(state().controls.target)-state().controls.minDistance)<.001')
    // Sample the near-plane clearance over the complete orbit, including handle and lip.
    await check(width+': safe camera around the full mug',`(()=>{const mug=state().scene.getObjectByName('mug'),box=new three.Box3().setFromObject(mug),target=new three.Vector3(.24,0,0),radius=state().controls.minDistance;for(let p=.65;p<=1.55;p+=.1)for(let a=0;a<Math.PI*2;a+=.1){const pos=new three.Vector3(radius*Math.sin(p)*Math.sin(a),radius*Math.cos(p),radius*Math.sin(p)*Math.cos(a)).add(target);if(box.distanceToPoint(pos)<=state().camera.near)return false}return true})()`)
    await front(20)
    await check(width+': far limit enforced','Math.abs(state().camera.position.distanceTo(state().controls.target)-8.5)<.001')
    await front(touch?2.6:5.2)
    // A 100 x 60 texture-pixel photo, selected by actual touch after zooming in.
    await evaluate(`designStore.resizeElement(el().id,'width',100);designStore.select(null);true`)
    const center=await evaluate('project(512,256)')
    await pointer('down',center,touch);await pointer('up',center,touch)
    await check(width+': select small photo','design().selectedElementId===el().id')
    for(const kind of ['top-left','top-right','bottom-left','bottom-right','top','right','bottom','left','rotate']) {
      await evaluate(`designStore.rotateElement(el().id,0);designStore.move(el().id,512,256);designStore.commit();window.saved=JSON.stringify(design().elements);window.initial={...el()};window.cam=state().camera.position.clone();window.scrollBefore=scrollY;window.h=geom.selectionHandles(el(),design().space).find(h=>h.kind==='${kind}');window.hp=geom.toDesign(el(),h);true`)
      let from
      if(touch) {
        const all=await handles(), h=all.find(h=>h.kind===kind)
        if(!h) throw new Error(width+': missing visible '+kind+' '+JSON.stringify(all))
        // Start outside the visual handle, inside its 44 px touch target.
        from={x:h.x+(kind==='left'||kind.includes('left')?-15:kind==='right'||kind.includes('right')?15:0),y:h.y+(kind==='top'?-15:kind==='bottom'?15:kind==='rotate'?-16:0)}
      } else from=await evaluate('project(hp.x,hp.y)')
      const delta=await evaluate(kind==='rotate'?`(()=>{const a=project(hp.x,hp.y),b=project(initial.x+(hp.x-initial.x)*Math.cos(.4)-(hp.y-initial.y)*Math.sin(.4),initial.y+(hp.x-initial.x)*Math.sin(.4)+(hp.y-initial.y)*Math.cos(.4));return {x:b.x-a.x,y:b.y-a.y}})()`:`(()=>{const a=project(hp.x,hp.y),b=project(hp.x+Math.sign(h.x)*16,hp.y+Math.sign(h.y)*16);return {x:b.x-a.x,y:b.y-a.y}})()`)
      await drag(from,{x:from.x+delta.x,y:from.y+delta.y},touch)
      await check(width+': '+kind+' touch/transform, orbit and page held',`JSON.stringify(design().elements)!==saved && state().controls.enabled && state().camera.position.distanceTo(cam)<.00001 && scrollY===scrollBefore && ${kind==='rotate'?'Math.abs(el().rotation)>.2':'el().width>initial.width || el().height>initial.height'}`)
      await evaluate('designStore.undo()')
      await check(width+': '+kind+' single undo','JSON.stringify(design().elements)===saved')
    }
    await evaluate('designStore.setAspectLock(el().id,false);window.initial={...el()};true')
    let right=touch?(await handles()).find(h=>h.kind==='right'):await evaluate('project(el().x+el().width/2,el().y)')
    await drag({x:right.x,y:right.y},{x:right.x+20,y:right.y},touch)
    await check(width+': side resizes width independently','el().width>initial.width && Math.abs(el().height-initial.height)<.001')
    await evaluate('designStore.undo();designStore.select(null);true')
    await drag(await evaluate('project(512,256)'),await evaluate('project(532,276)'),touch)
    await check(width+': drag photo','Math.abs(el().x-532)<3 && Math.abs(el().y-276)<3')
    await evaluate('designStore.select(null);window.cam=state().camera.position.clone();true')
    const blank=await evaluate(`(()=>{const r=state().gl.domElement.getBoundingClientRect();return {x:r.left+30,y:r.top+30}})()`)
    await drag(blank,{x:blank.x+60,y:blank.y+30},touch)
    await check(width+': empty viewer orbits','state().camera.position.distanceTo(cam)>.05')
    await front(touch?4:6)
    if(touch) {
      const p=await evaluate(`(()=>{const r=state().gl.domElement.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+45}})()`)
      await evaluate('window.distance=state().camera.position.length();window.scrollBefore=scrollY;true')
      await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x-30,y:p.y,id:1},{x:p.x+30,y:p.y,id:2}]})
      for(let i=1;i<=8;i++) await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x-30-i*7,y:p.y,id:1},{x:p.x+30+i*7,y:p.y,id:2}]})
      await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(200)
      await check(width+': real pinch zoom without page scroll','state().camera.position.length()<distance-.2 && scrollY===scrollBefore')
      await front(2.6)
      await evaluate('designStore.select(el().id);true');await pause(150)
      await screenshot('viewer-'+width)
      const before=await evaluate('scrollY')
      await drag({x:8,y:650},{x:8,y:300},true)
      record(width+': page swipe outside viewer',(await evaluate('scrollY'))>before+100)
      await evaluate(`document.querySelector('.pz-sheet-toggle').scrollIntoView({block:'start',behavior:'instant'});true`)
      await pause(100)
      await click('.pz-sheet-toggle')
      await check(width+': collapsed sheet','document.querySelector(".pz-panel-shell").dataset.expanded==="false" && document.querySelector(".pz-panel-content").clientHeight===0')
      const panelScroll=await evaluate('scrollY')
      await click('.pz-sheet-toggle')
      record(width+': expand keeps panel position',Math.abs((await evaluate('scrollY'))-panelScroll)<2)
      await screenshot('panel-'+width)
      const panelBefore=await evaluate('scrollY')
      await drag({x:width-35,y:650},{x:width-35,y:350},true)
      record(width+': panel swipe scrolls page',(await evaluate('scrollY'))>panelBefore+60)
      await check(width+': no nested panel scroll','document.querySelector(".pz-panel-content").scrollTop===0')
      await evaluate(`document.querySelector('.pz-delete').scrollIntoView({block:'center',behavior:'instant'});true`)
      await check(width+': last photo controls reachable',`(()=>{const r=document.querySelector('.pz-delete').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&['Substituir','Duplicar','Apagar'].every(text=>document.querySelector('.pz-tool-controls').textContent.includes(text))})()`)
      await screenshot('panel-bottom-'+width)
      // Controls behind the mug must never be drawn or hit.
      await evaluate('designStore.move(el().id,0,256);designStore.commit();true')
      record(width+': hidden handles excluded',(await handles()).length===0)
    } else {
      await evaluate('designStore.select(el().id)')
      await until('!!document.querySelector(".pz-delete")')
      await evaluate(`window.pageBefore=scrollY;document.querySelector('.pz-panel-content').scrollTop=10000;true`)
      await check(width+': desktop sidebar scroll independent','document.querySelector(".pz-panel-content").scrollTop>0 && scrollY===pageBefore && !document.querySelector(".pz-mobile-handles")')
      await screenshot('desktop-'+width)
    }
    await check(width+': no horizontal overflow','document.documentElement.scrollWidth<=innerWidth')
  }
  // Crossing breakpoints reuses the scene/textures and restores safe limits.
  await mug(390);await start();await upload();await front(2.6)
  await evaluate(`window.texture=state().scene.getObjectByName('printable-surface').material.map;true`)
  await cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:960,deviceScaleFactor:1,mobile:false});await pause(300)
  await check('mobile to desktop restores distance and controls','state().controls.minDistance===5.2 && state().camera.position.distanceTo(state().controls.target)>=5.19 && !document.querySelector(".pz-mobile-handles") && state().scene.getObjectByName("printable-surface").material.map===texture')
  await cdp('Emulation.setDeviceMetricsOverride',{width:768,height:960,deviceScaleFactor:1,mobile:false});await pause(300)
  await check('desktop to tablet restores touch overlay','state().controls.minDistance===2.6 && !!document.querySelector(".pz-mobile-handles") && state().scene.getObjectByName("printable-surface").material.map===texture')
  const report = { checks, errors, passed: checks.every(c=>c.pass)&&!errors.length }
  await writeFile(path.join(out,'review.json'),JSON.stringify(report,null,2))
  console.log(JSON.stringify({out,passed:report.passed,checks:checks.length,failed:checks.filter(c=>!c.pass),errors},null,2))
  await send('Browser.close'); ws.close(); chrome.kill()
  process.exitCode = report.passed ? 0 : 1
} catch (error) {
  await writeFile(path.join(out,'review.json'),JSON.stringify({checks,errors,error:String(error)},null,2))
  console.error(error);ws?.close();chrome.kill();process.exitCode=1
}

