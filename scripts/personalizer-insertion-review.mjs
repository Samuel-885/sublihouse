// Run against npm run dev -- --host 127.0.0.1 --port 5174. No test dependencies.
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const out = path.join(os.tmpdir(), 'sublime-personalizer-insertion-review')
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
  async function click(selector) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await pause(180) }
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

  for (const width of [390, 1440]) {
    await mug(width); await start()
    await evaluate(`(async()=>{window.insertion=await import('/src/components/personalizer/3d/insertionPoint.ts');window.geom=await import('/src/components/personalizer/editor/geometry.ts');return true})()`)
    for (const angle of [0, 1.3, -1.3, 2.5, Math.PI]) {
      await evaluate(`state().controls.target.set(0,0,0);state().camera.position.set(Math.sin(${angle})*6,1.8,Math.cos(${angle})*6);state().controls.update();state().invalidate();window.oldElements=JSON.stringify(design().elements);window.point=insertion.getInsertionPoint(state().camera,state().scene);true`)
      await pause(100)
      await check(width+': raycast follows camera azimuth '+angle, `(()=>{const ray=new three.Raycaster();ray.setFromCamera(new three.Vector2(0,0),state().camera);const center=ray.intersectObjects(state().scene.children,true)[0];return center?.object.name==='printable-surface' ? Math.abs(geom.unwrapDelta(point.x,(512+${angle}/(2*Math.PI)*1024)%1024))<2 : !point||Math.cos(point.x/1024*2*Math.PI-Math.PI-(${angle}))>0})()`)
      await click('[aria-label="Adicionar texto"]')
      await check(width+': text at visible point '+angle, `(()=>{const e=design().elements.at(-1),expected=geom.constrainElement({...e,...(point??{x:512,y:256})},design().space);return Math.abs(e.x-expected.x)<.001&&Math.abs(e.y-expected.y)<.001&&JSON.stringify(design().elements.slice(0,-1))===oldElements})()`)
      await evaluate('window.oldElements=JSON.stringify(design().elements)')
      await click('[aria-label="Adicionar foto"]')
      await upload()
      await check(width+': photo at visible point '+angle, `(()=>{const e=design().elements.at(-1),expected=geom.constrainElement({...e,...(point??{x:512,y:256})},design().space);return Math.abs(e.x-expected.x)<.001&&Math.abs(e.y-expected.y)<.001&&JSON.stringify(design().elements.slice(0,-1))===oldElements})()`)
      await evaluate('window.inserted={...design().elements.at(-1)};designStore.undo()')
      await check(width+': insertion undo '+angle,'JSON.stringify(design().elements)===oldElements')
      await evaluate('designStore.redo()')
      await check(width+': insertion redo '+angle,'JSON.stringify(design().elements.at(-1))===JSON.stringify(inserted)')
      await evaluate('designStore.select(inserted.id)')
      await pause(50)
      await click('.pz-tool-controls .pz-control-row button')
      await upload('image/jpeg')
      await check(width+': replace retains position '+angle,'design().elements.at(-1).x===inserted.x&&design().elements.at(-1).y===inserted.y')
      await evaluate('designStore.duplicate(inserted.id)')
      await check(width+': duplicate retains local offset '+angle,`(()=>{const e=design().elements.at(-1),expected=geom.constrainElement({...inserted,x:inserted.x+20,y:inserted.y+20},design().space);return e.x===expected.x&&e.y===expected.y&&e.id!==inserted.id})()`)
    }
    await screenshot('visible-insertion-'+width)
  }
  await check('nearby samples find print when center misses', `(()=>{const camera=state().camera.clone(),surface=state().scene.getObjectByName('printable-surface'),ray=new three.Raycaster();camera.position.set(0,0,6);for(let x=1;x<2;x+=.05){camera.lookAt(x,0,0);camera.updateMatrixWorld();ray.setFromCamera(new three.Vector2(0,0),camera);if(!ray.intersectObject(surface,false).length&&insertion.getInsertionPoint(camera,state().scene))return true}return false})()`)
  await check('missing surface or missed rays return optional fallback', `(()=>{const camera=state().camera.clone();camera.lookAt(20,0,0);return insertion.getInsertionPoint(camera,state().scene)===undefined&&insertion.getInsertionPoint(camera,new three.Object3D())===undefined})()`)
  await check('store fallback stays at logical center without Three.js', `(async()=>{const {createDesignStore}=await import('/src/components/personalizer/editor/createDesignStore.ts');const s=createDesignStore();s.addText();const text=s.getDesign().elements[0];const c=document.createElement('canvas');c.width=c.height=100;const b=await new Promise(r=>c.toBlob(r));await s.addPhoto(new File([b],'fallback.png',{type:'image/png'}));const photo=s.getDesign().elements[1];const valid=[text,photo].every(e=>e.x===512&&e.y===256);s.cleanup();return valid})()`)
  const report = { checks, errors, passed: checks.every(c=>c.pass)&&!errors.length }
  await writeFile(path.join(out,'review.json'),JSON.stringify(report,null,2))
  console.log(JSON.stringify({out,passed:report.passed,checks:checks.length,failed:checks.filter(c=>!c.pass),errors},null,2))
  await send('Browser.close'); ws.close(); chrome.kill()
  process.exitCode = report.passed ? 0 : 1
} catch (error) {
  await writeFile(path.join(out,'review.json'),JSON.stringify({checks,errors,error:String(error)},null,2))
  console.error(error);ws?.close();chrome.kill();process.exitCode=1
}

