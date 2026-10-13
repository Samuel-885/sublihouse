// Run against npm run dev -- --host 127.0.0.1 --port 5174. No test dependencies.
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const out = path.join(os.tmpdir(), 'sublime-personalizer-5c1-review')
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

  for (const width of [390, 430, 768, 1024, 1280, 1440]) {
    await mug(width)
    await start()
    await check(width + ': clean design, reduced motion', 'design().elements.length===0 && !state().controls.autoRotate')
    await check(width + ': separate meshes and geometry', `["ceramic-shell","printable-surface","selection-overlay","ceramic-handle"].every(n=>state().scene.getObjectByName(n)?.isMesh) && state().scene.getObjectByName('ceramic-shell').geometry.type==='LatheGeometry' && state().scene.getObjectByName('printable-surface').geometry.parameters.openEnded`)
    await upload()
    await check(width + ': photo added and selected', 'design().elements.length===1 && design().selectedElementId===design().elements[0].id && document.querySelector(".pz-tool[aria-pressed=true]").getAttribute("aria-label")==="Adicionar foto"')
    const from = await evaluate('project(512,256)'), to = await evaluate('project(550,280)')
    await evaluate(`window.before={snapshot:designStore.getSnapshot(),position:state().camera.position.clone(),texture:state().scene.getObjectByName('printable-surface').material.map,geometry:state().scene.getObjectByName('printable-surface').geometry};true`)
    await drag(from, to, width < 1024, async () => {
      const details=await evaluate(`({x:design().elements[0].x,y:design().elements[0].y,enabled:state().controls.enabled,cameraDelta:state().camera.position.distanceTo(before.position),stableSnapshot:designStore.getSnapshot()===before.snapshot,stableTexture:state().scene.getObjectByName('printable-surface').material.map===before.texture,stableGeometry:state().scene.getObjectByName('printable-surface').geometry===before.geometry})`)
      record(width + ': drag moves design, locks camera, keeps React snapshot and GPU objects', Math.abs(details.x-550)<5 && Math.abs(details.y-280)<5 && !details.enabled && details.cameraDelta<.000001 && details.stableSnapshot && details.stableTexture && details.stableGeometry,details)
    })
    await check(width + ': release commits and restores controls', 'state().controls.enabled && designStore.getSnapshot()===design()')
    const empty = await evaluate('project(430,55)')
    await evaluate('window.beforeOrbit={position:state().camera.position.clone(),elements:JSON.stringify(design().elements)}')
    await drag(empty, { x: empty.x + 38, y: empty.y + 8 }, width < 1024)
    await check(width + ': empty drag rotates only mug and deselects', 'state().camera.position.distanceTo(beforeOrbit.position)>.02 && JSON.stringify(design().elements)===beforeOrbit.elements && design().selectedElementId===null')
    await check(width + ': deselection clears overlay pixels', `(()=>{const c=state().scene.getObjectByName('selection-overlay').material.map.image;return !c.getContext('2d').getImageData(0,0,1024,512).data.some((v,i)=>i%4===3&&v)})()`)
    await click('.pz-reset')
    await check(width + ': reset preserves artwork', 'JSON.stringify(design().elements)===beforeOrbit.elements')
    await click('[aria-label="Adicionar texto"]')
    await check(width + ': photo and text coexist', 'design().elements.length===2 && design().elements[1].content==="O teu texto"')
    await evaluate(`document.querySelector('.pz-workspace').scrollIntoView({block:'start',behavior:'instant'})`)
    await evaluate('window.textCamera=state().camera.position.clone();true')
    await drag(await evaluate('project(512,256)'),await evaluate('project(540,240)'),width<1024)
    await check(width + ': direct drag selects top text over photo', 'design().selectedElementId===design().elements[1].id && Math.abs(design().elements[1].x-540)<5 && Math.abs(design().elements[1].y-240)<5 && state().camera.position.distanceTo(textCamera)<.000001')
    if (width < 1024) {
      await click('.pz-sheet-toggle')
      const p = await evaluate('project(550,320)')
      await pointer('down', p, true); await pointer('up', p, true)
      await check(width + ': direct selection leaves sheet collapsed', 'document.querySelector(".pz-panel-shell").dataset.expanded==="false"')
      await click('.pz-sheet-toggle')
      const p1 = await evaluate('project(430,60)')
      const p2 = { x: p1.x + 30, y: p1.y }
      await evaluate('window.oldDistance=state().camera.position.distanceTo(state().controls.target)')
      await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...p1, id: 1 }, { ...p2, id: 2 }] })
      for(let i=1;i<=5;i++) await cdp('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p1.x-i*3, y:p1.y, id: 1 }, { x:p2.x+i*3,y:p2.y,id: 2 }] })
      await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await pause(200)
      await check(width + ': pinch zoom', 'Math.abs(state().camera.position.distanceTo(state().controls.target)-oldDistance)>.1')
    }
    await check(width + ': no horizontal overflow', 'document.documentElement.scrollWidth<=innerWidth')
    await screenshot('editor-' + width)
    if(width<1024) {
      const scrollBefore=await evaluate('scrollY')
      await drag({x:8,y:500},{x:8,y:300},true)
      record(width + ': page scroll outside viewer',Math.abs((await evaluate('scrollY'))-scrollBefore)>30)
    }
  }

  await mug(1440); await start()
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    await upload(type)
    await check(type + ': accepted', 'design().elements.at(-1).type==="photo" && !document.querySelector("[role=alert]")')
  }
  await check('multiple photos retain aspect ratio', 'design().elements.length===3 && design().elements.every(e=>Math.abs(e.width/e.height-400/240)<.001)')
  await upload('image/gif')
  await check('invalid format rejected', 'design().elements.length===3 && document.querySelector("[role=alert]").textContent.includes("JPG")')
  await upload('image/png', { large: true })
  await check('over 20MB rejected', 'design().elements.length===3 && document.querySelector("[role=alert]").textContent.includes("20 MB")')
  await upload('image/png', { corrupt: true })
  await check('corrupt image rejected and URL revoked', 'design().elements.length===3 && document.querySelector("[role=alert]").textContent.includes("abrir") && revoked.includes(created.at(-1))')
  await evaluate('window.previousPhoto={...design().elements.at(-1)}')
  await click('.pz-tool-controls .pz-control-row button')
  await upload('image/jpeg')
  await check('replace preserves identity and box, releases old URL', `['id','x','y','width','height','rotation','zIndex'].every(k=>design().elements.at(-1)[k]===previousPhoto[k]) && design().elements.at(-1).source!==previousPhoto.source && revoked.includes(previousPhoto.source)`)
  await evaluate('window.deletedSource=design().elements.at(-1).source')
  await click('.pz-delete')
  await check('delete clears selection and URL', 'design().elements.length===2 && !design().selectedElementId && revoked.includes(deletedSource)')
  await click('[aria-label="Adicionar texto"]'); await click('[aria-label="Adicionar texto"]')
  await check('two photos and two texts', 'design().elements.length===4')
  await evaluate(`(()=>{const input=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,${JSON.stringify('Olá Sublime\nSegunda linha')});input.dispatchEvent(new Event('input',{bubbles:true}));})()`)
  await check('multiline content edit', `design().elements.at(-1).content===${JSON.stringify('Olá Sublime\nSegunda linha')} && design().elements.at(-1).height>80`)
  for (const font of ['Arial', 'Georgia', 'Figtree']) {
    await evaluate(`(()=>{const select=document.querySelector('.pz-control select');select.value='${font}';select.dispatchEvent(new Event('change',{bubbles:true}));})()`)
    await check('font ' + font, `design().elements.at(-1).font==='${font}'`)
  }
  await evaluate(`(()=>{const input=document.querySelector('input[type=color]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'#cc2244');input.dispatchEvent(new Event('input',{bubbles:true}));})()`)
  await check('text color', 'design().elements.at(-1).color==="#cc2244"')
  for (const [align, label] of [['left', 'Alinhar à esquerda'], ['center', 'Centrar texto'], ['right', 'Alinhar à direita']]) {
    await click(`[aria-label="${label}"]`)
    await check('alignment ' + align, `design().elements.at(-1).align==='${align}'`)
  }
  await evaluate(`(async()=>{window.geometry=await import('/src/components/personalizer/editor/geometry.ts');window.compositor=await import('/src/components/personalizer/editor/compositor.ts');window.testElement={...design().elements.at(-1),x:500,y:250,width:200,height:40,rotation:Math.PI/2};return true})()`)
  await check('rotated hit test', 'geometry.hitTest([testElement],{x:500,y:330})?.id===testElement.id && !geometry.hitTest([testElement],{x:580,y:250})')
  await check('topmost wins for either element type', `geometry.hitTest(design().elements,{x:512,y:256}).id===design().elements.at(-1).id && geometry.hitTest([...design().elements,{...design().elements[0],zIndex:99}],{x:512,y:256}).type==='photo'`)
  await check('rotated bounds constrained', `(()=>{const e=geometry.constrainElement({...testElement,x:-100,y:900});return Math.abs(e.x-20)<.001 && Math.abs(e.y-412)<.001})()`)
  await check('seam movement unwraps to small deltas', 'geometry.unwrapDelta(2,1022)===4 && geometry.unwrapDelta(1022,2)===-4')
  await check('art excludes selection; overlay is transparent and not raycastable', `(()=>{const art=compositor.createDesignCanvas();compositor.renderDesignToCanvas(art,{elements:[],selectedElementId:null},()=>{});const ctx=art.getContext('2d');const pixel=ctx.getImageData(0,0,1,1).data;const overlay=state().scene.getObjectByName('selection-overlay');const hits=[];overlay.raycast(null,hits);return pixel[0]===255&&pixel[1]===253&&pixel[2]===249&&overlay.material.transparent&&!overlay.material.depthWrite&&hits.length===0})()`)
  // UV checks project known cylinder points, then raycast through the actual geometry.
  for (const [label,x,y] of [['center',512,256],['left',440,256],['right',620,256],['top',512,30],['bottom',512,480]]) {
    await check('UV ' + label, `(()=>{const p=project(${x},${y}),s=state(),r=s.gl.domElement.getBoundingClientRect(),ray=new three.Raycaster();ray.setFromCamera(new three.Vector2((p.x-r.left)/r.width*2-1,-(p.y-r.top)/r.height*2+1),s.camera);const hit=ray.intersectObject(s.scene.getObjectByName('printable-surface'))[0];const d=geometry.uvToDesign(hit.uv);return Math.abs(d.x-${x})<2&&Math.abs(d.y-${y})<2})()`)
  }
  // View the rear seam; move a partly grabbed photo across u=0/1. Its box
  // remains bounded rather than jumping to the opposite side of the texture.
  await evaluate(`design().elements.filter(e=>e.type==='text').forEach(e=>designStore.move(e.id,512,400));designStore.move(design().elements[0].id,140,256);designStore.commit();state().controls.target.set(0,0,0);state().camera.position.set(0,1,-6);state().controls.update();state().invalidate();true`)
  await pause(150)
  await drag(await evaluate('project(30,256)'),await evaluate('project(1000,256)'),false)
  await check('actual seam drag stays bounded without teleport', 'design().selectedElementId===design().elements[0].id && Math.abs(design().elements[0].x-140)<2 && state().controls.enabled')
  await click('.pz-reset')
  await evaluate('designStore.select(design().elements.at(-1).id)')
  await click('.pz-delete')
  await check('delete text', 'design().elements.filter(e=>e.type==="text").length===1')
  // Exercise cancellation paths using real active pointer capture.
  for (const kind of ['pointercancel','lostpointercapture','blur']) {
    await evaluate('designStore.move(design().elements.at(-1).id,512,256);designStore.commit()')
    const p=await evaluate('project(512,256)')
    await pointer('down',p,false)
    await evaluate(kind==='blur' ? `window.dispatchEvent(new Event('blur'))` : `state().gl.domElement.dispatchEvent(new PointerEvent('${kind}',{pointerId:1,bubbles:true}))`)
    await check('cleanup after ' + kind,'state().controls.enabled')
    await pointer('up',p,false)
  }
  await evaluate(`window.allSources=design().elements.filter(e=>e.type==='photo').map(e=>e.source);window.oldStore=designStore;document.querySelector('.pz-back').click()`)
  await pause(500)
  await check('unmount releases all photo URLs and store references', 'allSources.every(s=>revoked.includes(s)) && oldStore.getDesign().elements.length===0')

  await mug(1440,false)
  await check('auto rotation before interaction', 'state().controls.autoRotate')
  await start(); await click('[aria-label="Adicionar texto"]')
  await check('adding content stops auto rotation', '!state().controls.autoRotate')
  await click('.pz-reset')
  await check('reset keeps selection and content', 'design().elements.length===1 && design().selectedElementId===design().elements[0].id')
  await check('unsupported actions remain disabled', `[...document.querySelectorAll('.pz-purchase-actions button,.pz-history button')].every(b=>b.disabled) && document.querySelectorAll('.pz-tool')[2].disabled`)
  await evaluate('window.pendingStorePromise=import("/src/components/personalizer/editor/createDesignStore.ts").then(async m=>{const s=m.createDesignStore(),p=s.addPhoto(new File(["pending"],"pending.png",{type:"image/png"}));const url=created.at(-1);s.cleanup();await p;return revoked.includes(url)&&!s.getPhoto(url)&&s.getDesign().elements.length===0});true')
  await check('unmount cancels a pending image load and revokes URL','pendingStorePromise')
  for (const route of ['/personalize/6','/personalize/2','/personalize/999','/personalize/1?cartItemId=XYZ']) {
    await navigate(route); await pause(400)
    if(route.includes('/6')) await check('notebook 2D fallback and no 3D download', '!!document.querySelector(".pz-product-image img") && !document.querySelector(".pz-scene") && !performance.getEntriesByType("resource").some(r=>r.name.includes("PersonalizerScene")) && document.querySelector(".pz-tool").disabled')
    if(route.includes('/2')) await check('noncustomizable product', 'document.querySelector("main h1").textContent.includes("não é personalizável")')
    if(route.includes('/999')) await check('invalid product', 'document.querySelector("main h1").textContent.includes("não encontrado")')
    if(route.includes('cartItemId')) await check('cart item recognized, no restoration', 'document.querySelector(".personalizer").dataset.mode==="edit" && !!document.querySelector(".pz-edit-notice")')
  }
  const {identifier} = await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)}`})
  await navigate('/personalize/1');await pause(300)
  await check('WebGL fallback retains image and disables editor', '!!document.querySelector(".pz-product-image img") && !!document.querySelector(".pz-viewer-notice") && document.querySelector(".pz-reset").disabled && document.querySelectorAll(".pz-tool")[1].disabled')
  await cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier})
  const report = { checks, errors, passed: checks.every(c=>c.pass)&&!errors.length }
  await writeFile(path.join(out,'review.json'),JSON.stringify(report,null,2))
  console.log(JSON.stringify({out,passed:report.passed,checks:checks.length,failed:checks.filter(c=>!c.pass),errors},null,2))
  await send('Browser.close'); ws.close(); chrome.kill()
  process.exitCode = report.passed ? 0 : 1
} catch (error) {
  await writeFile(path.join(out,'review.json'),JSON.stringify({checks,errors,error:String(error)},null,2))
  console.error(error);ws?.close();chrome.kill();process.exitCode=1
}
