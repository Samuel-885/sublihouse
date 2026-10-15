// Run against npm run dev -- --host 127.0.0.1 --port 5174. No test dependencies.
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const out = path.join(os.tmpdir(), 'sublime-personalizer-5c2c-review')
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
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(arg => arg.value || arg.description).join(' '))
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
  async function upload() {
    const countBefore = await evaluate('design().elements.length')
    await evaluate(`(async () => {
      const c = document.createElement('canvas'); c.width = 400; c.height = 240;
      const ctx = c.getContext('2d'); ctx.fillStyle='#28a6b5';ctx.fillRect(0,0,400,240);
      ctx.fillStyle='#fbc849';ctx.fillRect(0,0,120,240);ctx.fillStyle='#fff';ctx.font='36px Arial';ctx.fillText('SUBLIME',140,130);
      const blob = await new Promise(resolve=>c.toBlob(resolve,'image/png'));
      const file = new File([blob], 'photo.png', {type:'image/png'});
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

  // This review deliberately covers only phase 5C.2C at the two requested widths.
  for (const width of [390, 1440]) {
    await mug(width); await start()
    await evaluate(`window.mesh = name => state().scene.getObjectByName(name);
      window.art = () => mesh('printable-surface').material.map;
      window.alpha = (x,y,w,h) => Array.from(art().image.getContext('2d').getImageData(x,y,w,h).data).filter((_,i)=>i%4===3);
      window.variant = () => document.querySelector('.pz-variant[aria-pressed=true]').dataset.variant;
      true`)
    await check(width + ': default white and transparent artwork material', `variant()==='white' && mesh('printable-surface').material.transparent && !mesh('printable-surface').material.depthWrite && mesh('selection-overlay').renderOrder > mesh('printable-surface').renderOrder`)
    for (const [id,color] of [['black','252527'],['yellow','efb92f']]) {
      await click(`[data-variant="${id}"]`)
      await check(width + ': empty ' + id + ' has no artwork stripe and matching handle', `alpha(0,0,1024,512).every(a=>a===0) && mesh('ceramic-shell').material.color.getHexString()==='${color}' && mesh('ceramic-handle').material.color.getHexString()==='${color}'`)
      await screenshot('empty-'+id+'-'+width)
    }
    await click('[data-variant="dots"]')
    await evaluate(`state().camera.position.set(0,1.3,-6);state().controls.target.set(0,0,0);state().controls.update();state().invalidate();true`)
    await pause(300)
    await screenshot('empty-dots-seam-'+width)
    // Probe actual rendered pixels on both sides of a dot crossing the rear seam.
    await check(width + ': procedural dots meet at rear seam beneath transparent art', `(()=>{
      const s=state(); s.gl.render(s.scene,s.camera);
      const gl=s.gl.getContext(), r=s.gl.domElement.getBoundingClientRect();
      const sample=(x,y)=>{const p=project(x,y),v=new Uint8Array(4);gl.readPixels(Math.round((p.x-r.left)/r.width*gl.drawingBufferWidth),Math.round((r.bottom-p.y)/r.height*gl.drawingBufferHeight),1,1,gl.RGBA,gl.UNSIGNED_BYTE,v);return [...v].slice(0,3)};
      const left=sample(1023,256),right=sample(1,256),base=sample(12,256);
      return left.every((c,i)=>Math.abs(c-right[i])<12) && base[0]-left[0]>50;
    })()`)
    await click('[data-variant="white"]')
    await upload(); await click('[aria-label="Adicionar texto"]')
    await evaluate(`window.photoId=design().elements.find(e=>e.type==='photo').id;window.textId=design().elements.find(e=>e.type==='text').id;
      designStore.move(photoId,0,165);designStore.commit();designStore.rotateElement(photoId,0.14);
      designStore.move(textId,0,355);designStore.commit();designStore.updateText(textId,{content:'Sublime 360',fontWeight:700,letterSpacing:1.5,color:'#cf2450'});
      true`)
    await evaluate('document.fonts.ready.then(()=>true)'); await pause(500)
    await evaluate(`window.baseline = {
      store:designStore, design:JSON.stringify(design()), snapshot:designStore.getSnapshot(), scene:state().scene,
      camera:state().camera, position:state().camera.position.clone(), quaternion:state().camera.quaternion.clone(), zoom:state().camera.zoom,
      controls:state().controls, target:state().controls.target.clone(), art:art(), artVersion:art().version,
      meshes:['ceramic-shell','ceramic-handle','printable-surface','selection-overlay'].map(name=>({name,mesh:mesh(name),geometry:mesh(name).geometry,material:mesh(name).material})),
      canUndo:designStore.canUndo(), canRedo:designStore.canRedo(), memory:JSON.stringify(state().gl.info.memory)
    };true`)
    for (const id of ['black','yellow','dots','white']) {
      await click(`[data-variant="${id}"]`)
      await check(width + ': ' + id + ' preserves full art, selection, store, history availability', `variant()==='${id}' && designStore===baseline.store && JSON.stringify(design())===baseline.design && designStore.getSnapshot()===baseline.snapshot && designStore.canUndo()===baseline.canUndo && designStore.canRedo()===baseline.canRedo`)
      await check(width + ': ' + id + ' preserves camera, zoom, scene, geometry and texture', `state().scene===baseline.scene && state().camera===baseline.camera && state().camera.position.distanceTo(baseline.position)<1e-8 && state().camera.quaternion.angleTo(baseline.quaternion)<1e-7 && state().camera.zoom===baseline.zoom && state().controls===baseline.controls && state().controls.target.distanceTo(baseline.target)<1e-8 && art()===baseline.art && art().version===baseline.artVersion && baseline.meshes.every(m=>mesh(m.name)===m.mesh && mesh(m.name).geometry===m.geometry && mesh(m.name).material===m.material) && JSON.stringify(state().gl.info.memory)===baseline.memory`)
      await check(width + ': ' + id + ' photo/text span both texture edges, empty area transparent', `alpha(0,100,4,100).some(a=>a>0) && alpha(1020,100,4,100).some(a=>a>0) && alpha(0,320,20,70).some(a=>a>0) && alpha(1004,320,20,70).some(a=>a>0) && alpha(500,0,24,512).every(a=>a===0)`)
      await screenshot('art-seam-'+id+'-'+width)
    }
    await click('[aria-label="Desfazer"]')
    await check(width + ': undo still undoes last artwork edit', `design().elements.find(e=>e.id===textId).content==='O teu texto' && designStore.canRedo()`)
    await click('[data-variant="dots"]')
    await check(width + ': variant switch preserves redo branch', 'designStore.canRedo()')
    await click('[aria-label="Refazer"]')
    await check(width + ': redo restores exact artwork without changing variant', `JSON.stringify(design())===baseline.design && variant()==='dots'`)
    // Actual pointer drags cross the seam for both element types.
    for (const [id,y] of [['photoId',165],['textId',355]]) {
      await evaluate(`designStore.select(${id});true`); await pause(150)
      await drag(await evaluate(`project(1016,${y})`),await evaluate(`project(12,${y})`),width<1024)
      await check(width + ': seam drag ' + id, `design().selectedElementId===${id} && Math.abs(design().elements.find(e=>e.id===${id}).x-20)<6 && state().camera.position.distanceTo(baseline.position)<1e-8`)
      await click('[aria-label="Desfazer"]')
      await check(width + ': seam drag undo ' + id, `design().elements.find(e=>e.id===${id}).x===0`)
    }
    await evaluate(`document.querySelector('.pz-product-appearance').scrollIntoView({block:'center',behavior:'instant'})`)
    await check(width + ': swatches have names, selection and fit without overflow', `document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('.pz-variant')].every(b=>b.textContent.trim() && b.getBoundingClientRect().width>=44 && b.getBoundingClientRect().height>=44 && b.getBoundingClientRect().left>=0 && b.getBoundingClientRect().right<=innerWidth) && document.querySelectorAll('.pz-variant[aria-pressed=true]').length===1`)
    await screenshot('selector-'+width)
  }
  const report = { checks, errors, passed: checks.every(c=>c.pass)&&!errors.length }
  await writeFile(path.join(out,'review.json'),JSON.stringify(report,null,2))
  console.log(JSON.stringify({out,passed:report.passed,checks:checks.length,failed:checks.filter(c=>!c.pass),errors},null,2))
  await send('Browser.close'); ws.close(); chrome.kill()
  process.exitCode = report.passed ? 0 : 1
} catch (error) {
  await writeFile(path.join(out,'review.json'),JSON.stringify({checks,errors,error:String(error)},null,2))
  console.error(error);ws?.close();chrome.kill();process.exitCode=1
}
