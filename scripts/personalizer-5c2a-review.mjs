// Run against npm run dev -- --host 127.0.0.1 --port 5174. No test dependencies.
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const out = path.join(os.tmpdir(), 'sublime-personalizer-5c2a-review')
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

  if (!process.argv.includes('--transforms-only') && !process.argv.includes('--domain-only')) {
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
  await check('replace preserves identity and box, retains old URL for undo', `['id','x','y','width','height','rotation','zIndex'].every(k=>design().elements.at(-1)[k]===previousPhoto[k]) && design().elements.at(-1).source!==previousPhoto.source && !revoked.includes(previousPhoto.source)`)
  await evaluate('window.deletedSource=design().elements.at(-1).source')
  await click('.pz-delete')
  await check('delete clears selection and retains URL for undo', 'design().elements.length===2 && !design().selectedElementId && !revoked.includes(deletedSource)')
  await click('[aria-label="Adicionar texto"]'); await click('[aria-label="Adicionar texto"]')
  await check('two photos and two texts', 'design().elements.length===4')
  await evaluate(`(()=>{const input=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,${JSON.stringify('Olá Sublime\nSegunda linha')});input.dispatchEvent(new Event('input',{bubbles:true}));})()`)
  await check('multiline content edit', `design().elements.at(-1).content===${JSON.stringify('Olá Sublime\nSegunda linha')} && design().elements.at(-1).height>80`)
  for (const font of ['Montserrat', 'Playfair Display', 'Figtree']) {
    await evaluate(`(()=>{const select=document.querySelector('.pz-control select');select.value='${font}';select.dispatchEvent(new Event('change',{bubbles:true}));})()`)
    await check('font ' + font, `design().elements.at(-1).fontFamily==='${font}'`)
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
  // View the rear seam; the grabbed photo now moves through u=0/1 continuously.
  await evaluate(`design().elements.filter(e=>e.type==='text').forEach(e=>designStore.move(e.id,512,400));designStore.move(design().elements[0].id,140,256);designStore.commit();state().controls.target.set(0,0,0);state().camera.position.set(0,1,-6);state().controls.update();state().invalidate();true`)
  await pause(150)
  await drag(await evaluate('project(30,256)'),await evaluate('project(1000,256)'),false)
  await check('actual seam drag continues without a horizontal wall', 'design().selectedElementId===design().elements[0].id && Math.abs(design().elements[0].x-86)<4 && state().controls.enabled')
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
  await check('unsupported actions remain disabled', `[...document.querySelectorAll('.pz-purchase-actions button')].every(b=>b.disabled) && document.querySelectorAll('.pz-tool')[2].disabled`)
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
  }
  // Phase 5C.2A: actual mouse/touch handles, isolated history, pixels and resources.
  if (!process.argv.includes('--domain-only')) {
  for (const width of [390, 430, 768, 1024, 1280, 1440]) {
    await mug(width); await start(); await upload()
    await evaluate(`(async()=>{window.geom=await import('/src/components/personalizer/editor/geometry.ts');window.comp=await import('/src/components/personalizer/editor/compositor.ts');window.el=()=>design().elements[0];designStore.resizeElement(el().id,'width',180);return true})()`)
    for (const handle of ['top-left','top-right','bottom-left','bottom-right','left','right','top','bottom','rotate']) {
      await evaluate(`designStore.move(el().id,512,256);designStore.commit();window.initial={...el()};window.saved=JSON.stringify(design().elements);window.stable=designStore.getSnapshot();window.cam=state().camera.position.clone();window.tex=state().scene.getObjectByName('printable-surface').material.map;window.h=geom.selectionHandles(el()).find(h=>h.kind==='${handle}');window.hp=geom.toDesign(el(),h);true`)
      const from = await evaluate('project(hp.x,hp.y)')
      const to = await evaluate(handle==='rotate' ? `project(initial.x+(hp.x-initial.x)*Math.cos(.35)-(hp.y-initial.y)*Math.sin(.35),initial.y+(hp.x-initial.x)*Math.sin(.35)+(hp.y-initial.y)*Math.cos(.35))` : `project(hp.x+(h.x===0?0:Math.sign(h.x)*14),hp.y+(h.y===0?0:Math.sign(h.y)*14))`)
      if (width < 1024 && handle === 'rotate') {
        // Mobile's rotation grip is spaced in CSS pixels; its UV anchor is unchanged.
        const grip = await evaluate(`(async()=>{const m=await import('/src/components/personalizer/3d/mobileSelection.ts'),s=state(),r=s.gl.domElement.getBoundingClientRect(),h=m.projectMobileHandles(design(),s.camera,s.scene,r).find(h=>h.kind==='rotate');return {x:r.left+h.x,y:r.top+h.y}})()`)
        to.x += grip.x - from.x; to.y += grip.y - from.y
        from.x = grip.x; from.y = grip.y
      }
      await drag(from,to,width<1024,async()=>{
        await check(`${width}: ${handle} live transform, stable React/texture, orbit locked`, `JSON.stringify(design().elements)!==saved && designStore.getSnapshot()===stable && !state().controls.enabled && state().camera.position.distanceTo(cam)<.000001 && state().scene.getObjectByName('printable-surface').material.map===tex`)
      })
      await check(`${width}: ${handle} commit`, `state().controls.enabled && ${handle==='rotate' ? 'Math.abs(el().rotation)>.15' : 'el().width>initial.width || el().height>initial.height'}`)
      await evaluate('designStore.undo()')
      await check(`${width}: ${handle} is one undo step`, 'JSON.stringify(design().elements)===saved')
      await evaluate('designStore.redo();designStore.undo()')
    }
    await evaluate(`designStore.setAspectLock(el().id,false);window.initial={...el()};true`)
    const side = await evaluate('project(el().x+el().width/2,el().y)')
    const sideEnd = await evaluate('project(el().x+el().width/2+22,el().y)')
    await drag(side,sideEnd,width<1024)
    await check(width+': unlocked side changes only width','el().width>initial.width+10 && Math.abs(el().height-initial.height)<.001')
    await evaluate(`designStore.setPhotoCorners(el().id,100);designStore.rotateElement(el().id,.3);true`)
    await screenshot('transforms-photo-'+width)
    await click('[aria-label="Adicionar texto"]')
    await evaluate(`window.txt=()=>design().elements.at(-1);window.tbefore={...txt()};window.th=geom.selectionHandles(txt()).find(h=>h.kind==='bottom-right');window.tp=geom.toDesign(txt(),th);true`)
    await drag(await evaluate('project(tp.x,tp.y)'),await evaluate('project(tp.x+25,tp.y+15)'),width<1024)
    await check(width+': text corner changes font and measures layout', `txt().fontSize>tbefore.fontSize && geom.selectionHandles(txt()).length===5 && (()=>{const c=comp.createDesignCanvas().getContext('2d');return import('/src/components/personalizer/editor/textLayout.ts').then(m=>{const l=m.layoutText(c,txt());return Math.abs(l.width-txt().width)<.001&&Math.abs(l.height-txt().height)<.001})})()`)
    await check(width+': panel labels and overflow', `!!document.querySelector('[aria-label="Tamanho da fonte"]') && !document.querySelector('[aria-label="Largura"]') && !!document.querySelector('[aria-label="Rotação"]') && document.documentElement.scrollWidth<=innerWidth`)
    await screenshot('transforms-text-'+width)
  }
  }
  await mug(1440); await start(); await upload()
  await evaluate(`(async()=>{window.geom=await import('/src/components/personalizer/editor/geometry.ts');window.comp=await import('/src/components/personalizer/editor/compositor.ts');window.el=()=>design().elements[0];window.source=el().source;window.id=el().id;window.steps=[JSON.stringify(design().elements)];return true})()`)
  for (const [name, action] of [
    ['move','designStore.begin();designStore.move(id,540,275);designStore.move(id,550,280);designStore.commit()'],
    ['resize',`designStore.begin();designStore.resizeElement(id,'width',300);designStore.resizeElement(id,'width',320);designStore.commit()`],
    ['rotate','designStore.rotateElement(id,.4)'], ['corners','designStore.setPhotoCorners(id,50)'],
    ['duplicate','designStore.duplicate(id)'], ['delete','designStore.remove(design().selectedElementId)'],
  ]) { await evaluate(action+';steps.push(JSON.stringify(design().elements))'); await check('sequence '+name,'!revoked.includes(source) && !!designStore.getPhoto(source)?.naturalWidth') }
  for(let i=5;i>=0;i--) { await evaluate('designStore.undo()');await check('sequence undo '+i,`JSON.stringify(design().elements)===steps[${i}] && !!designStore.getPhoto(source)?.naturalWidth`) }
  for(let i=1;i<=6;i++) { await evaluate('designStore.redo()');await check('sequence redo '+i,`JSON.stringify(design().elements)===steps[${i}]`) }
  await evaluate('designStore.remove(id);designStore.undo()')
  await check('undo deletion restores source and decoded image', 'el().source===source && designStore.getPhoto(source).naturalWidth===400 && !revoked.includes(source)')
  await evaluate('designStore.redo()')
  await check('redo deletion removes image', 'design().elements.length===0')
  await evaluate('designStore.undo();designStore.duplicate(id);window.dup=design().selectedElementId')
  await evaluate(`(async()=>{const c=comp.createDesignCanvas();c.getContext('2d').fillRect(0,0,1024,512);const b=await new Promise(r=>c.toBlob(r));await designStore.replacePhoto(dup,new File([b],'replacement.png',{type:'image/png'}));return true})()`)
  await check('replace duplicate retains shared original', 'el().source===source && design().elements.at(-1).source!==source && !revoked.includes(source) && !!designStore.getPhoto(source).naturalWidth')
  await evaluate('designStore.undo()')
  await check('undo replacement restores shared photo','design().elements.every(e=>e.source===source)')
  await evaluate('designStore.setPhotoCorners(id,25)')
  await check('new action discards redo','!designStore.canRedo()')
  await evaluate('designStore.addText();window.textId=design().selectedElementId;designStore.move(textId,550,280);designStore.move(dup,550,280);designStore.commit();designStore.bringForward(dup)')
  await check('front layer wins hit test', 'geom.hitTest(design().elements,{x:550,y:280}).id===dup')
  await evaluate('designStore.sendBackward(dup);designStore.bringForward(id)')
  await check('back/front order and selection', 'geom.hitTest(design().elements,{x:550,y:280}).id===id && design().selectedElementId===textId && Math.max(...design().elements.map(e=>e.zIndex))===2')
  await evaluate('designStore.undo();designStore.undo()')
  await check('layers undo', 'geom.hitTest(design().elements,{x:550,y:280}).id===dup')
  // Independent frames, minimums and rotated printable bounds.
  await evaluate(`designStore.setAspectLock(id,false);designStore.resizeElement(id,'width',250);designStore.resizeElement(id,'height',100);designStore.rotateElement(id,0);true`)
  await check('independent width/height panel model','el().width===250 && el().height===100')
  await evaluate(`designStore.setAspectLock(id,true);designStore.resizeElement(id,'height',120);true`)
  await check('aspect ratio on height','el().width===300 && el().height===120')
  await evaluate(`designStore.resizeElement(id,'width',1);true`)
  await check('locked minimum preserves ratio','Math.abs(el().width/el().height-2.5)<.001 && el().height>=40')
  await evaluate(`designStore.resizeElement(id,'width',9000);designStore.rotateElement(id,Math.PI/4);designStore.move(id,-999,9999);designStore.commit();true`)
  await check('rotated oversized element wraps X and stays within vertical print', `(()=>{const e=el(),r=geom.rotatedExtents(e);return e.x>=0&&e.x<1024&&e.y-r.y>=-.001&&e.y+r.y<=512.001})()`)
  await evaluate(`designStore.updateText(textId,{content:'LONG TEXT '.repeat(50),fontSize:140});designStore.rotateElement(textId,.7);true`)
  await check('long rotated text fits without glyph distortion', `(()=>{const e=design().elements.find(e=>e.id===textId),r=geom.rotatedExtents(e);return r.x<=512.001&&r.y<=256.001&&e.fontSize===140})()`)
  // Render known pixels: ellipse corners transparent over ceramic, centered cover,
  // and selection pixels only in the editor texture.
  await check('cover and rounded clips preserve source', `(()=>{
    const e={...el(),x:512,y:256,width:120,height:120,rotation:0,cornerRadius:0};
    const art=comp.createDesignCanvas(); const pixel=(x,y)=>Array.from(art.getContext('2d').getImageData(x,y,1,1).data);
    const render=()=>comp.renderDesignToCanvas(art,{elements:[e],selectedElementId:e.id},designStore.getPhoto);
    render(); const cover=pixel(478,240); e.cornerRadius=50;render();const mid=pixel(453,197);e.cornerRadius=100;render();const corner=pixel(453,197),center=pixel(512,220);
    const overlay=comp.createDesignCanvas();comp.renderSelectionToCanvas(overlay,{elements:[e],selectedElementId:e.id});
    return cover[1]===166&&mid[0]===255&&corner[0]===255&&corner[1]===253&&center[1]===166&&designStore.getPhoto(source).naturalWidth===400&&overlay.getContext('2d').getImageData(452,196,1,1).data[3]>0;
  })()`)
  // Keyboard shortcuts and panel controls use the same store.
  await evaluate(`designStore.select(id);document.activeElement?.blur();window.keyBefore=JSON.stringify(design().elements);designStore.duplicate(id);true`)
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'z',code:'KeyZ',modifiers:2})
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'z',code:'KeyZ',modifiers:2})
  await check('Ctrl+Z', 'JSON.stringify(design().elements)===keyBefore')
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'y',code:'KeyY',modifiers:2})
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'y',code:'KeyY',modifiers:2})
  await check('Ctrl+Y','design().elements.length===4')
  await evaluate(`designStore.select(textId);true`)
  await until('!!document.querySelector("textarea")')
  await evaluate(`document.querySelector('textarea').focus();window.typingBefore=JSON.stringify(design().elements);true`)
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Backspace',code:'Backspace'})
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Backspace',code:'Backspace'})
  await check('Backspace in textarea preserves element','design().elements.some(e=>e.id===textId)')
  await evaluate(`document.activeElement.blur();designStore.select(id);true`)
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Delete',code:'Delete'})
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Delete',code:'Delete'})
  await check('Delete outside inputs removes selection','!design().elements.some(e=>e.id===id)')
  await check('history limit and unreachable resource cleanup', `(async()=>{
    const {createDesignStore}=await import('/src/components/personalizer/editor/createDesignStore.ts'); const s=createDesignStore();
    const c=comp.createDesignCanvas(),b=await new Promise(r=>c.toBlob(r));await s.addPhoto(new File([b],'limit.png',{type:'image/png'}));const p=s.getDesign().elements[0];s.remove(p.id);
    s.addText();const t=s.getDesign().elements[0];for(let i=0;i<60;i++)s.rotateElement(t.id,i/100);
    let count=0;while(s.canUndo()){s.undo();count++}const valid=count===50&&revoked.includes(p.source)&&!s.getPhoto(p.source);s.cleanup();return valid;
  })()`)
  await check('discarded future releases orphan photo', `(async()=>{
    const {createDesignStore}=await import('/src/components/personalizer/editor/createDesignStore.ts');const s=createDesignStore();const c=comp.createDesignCanvas(),b=await new Promise(r=>c.toBlob(r));await s.addPhoto(new File([b],'future.png',{type:'image/png'}));const source=s.getDesign().elements[0].source;s.undo();const retained=!revoked.includes(source);s.addText();const valid=retained&&revoked.includes(source)&&!s.canRedo();s.cleanup();return valid;
  })()`)
  await mug(1440);await start();await upload()
  await evaluate(`window.el=()=>design().elements[0];window.initialPanel=JSON.stringify(design().elements);true`)
  async function numberInput(label, value) {
    await evaluate(`(()=>{const input=document.querySelector('[aria-label="${label}"]');input.focus();input.select()})()`)
    await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Backspace',code:'Backspace'})
    await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Backspace',code:'Backspace'})
    for(const text of value) await cdp('Input.insertText',{text})
    await evaluate('document.activeElement.blur()')
  }
  await numberInput('Largura','350')
  await check('panel typing complete width with lock','Math.abs(el().width-350)<.001&&Math.abs(el().height-210)<.001')
  await click('[aria-label="Desfazer"]')
  await check('panel number editing is one history action','JSON.stringify(design().elements)===initialPanel')
  await click('.pz-aspect-lock input');await numberInput('Largura','350');await numberInput('Altura','120')
  await check('panel independent width and height','el().width===350&&el().height===120&&!el().lockAspectRatio')
  await click('.pz-aspect-lock input');await numberInput('Altura','150')
  await check('panel height with lock','Math.abs(el().width-437.5)<.001&&el().height===150')
  for(const label of ['Cantos','Rotação']) {
    await evaluate(`document.querySelector('[aria-label="${label}"]').scrollIntoView({block:'center',behavior:'instant'});document.activeElement.blur();window.beforeSlider=JSON.stringify(design().elements);true`)
    const rect=await evaluate(`(()=>{const r=document.querySelector('[aria-label="${label}"]').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()`)
    await drag({x:rect.x+rect.width*.5,y:rect.y+rect.height/2},{x:rect.x+rect.width*.75,y:rect.y+rect.height/2},false)
    await check('panel '+label+' live slider','JSON.stringify(design().elements)!==beforeSlider')
    await evaluate('document.activeElement.blur()');await click('[aria-label="Desfazer"]')
    await check('panel '+label+' slider is one history action','JSON.stringify(design().elements)===beforeSlider')
  }
  await click('[aria-label="Adicionar texto"]')
  await numberInput('Tamanho da fonte','64')
  await check('panel font size','design().elements.at(-1).fontSize===64')
  await evaluate(`document.querySelector('textarea').focus();document.querySelector('textarea').select();true`)
  await cdp('Input.insertText',{text:'Conteúdo novo'})
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'z',code:'KeyZ',windowsVirtualKeyCode:90,modifiers:2})
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'z',code:'KeyZ',windowsVirtualKeyCode:90,modifiers:2})
  const nativeUndo=await evaluate('({count:design().elements.length,value:document.querySelector("textarea").value,content:design().elements.at(-1).content})')
  record('native text undo leaves design element intact',nativeUndo.count===2&&nativeUndo.value==='O teu texto'&&nativeUndo.content==='O teu texto',nativeUndo)
  await evaluate('document.activeElement.blur()')
  for(const text of ['Duplicar','Enviar para trás','Trazer para frente']) {
    await evaluate(`[...document.querySelectorAll('.pz-tool-controls button')].find(b=>b.textContent.includes('${text}')).click()`)
    await pause(50)
    await check('panel '+text,'design().elements.length===3&&design().selectedElementId===design().elements.at(-1).id')
  }
  await evaluate('window.keyBefore=JSON.stringify(design().elements);designStore.remove(design().selectedElementId);document.activeElement.blur();true')
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'z',code:'KeyZ',modifiers:4})
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'z',code:'KeyZ',modifiers:4})
  await check('Meta+Z','JSON.stringify(design().elements)===keyBefore')
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'z',code:'KeyZ',modifiers:10})
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'z',code:'KeyZ',modifiers:10})
  await check('Ctrl+Shift+Z','design().elements.length===2')
  await evaluate(`(async()=>{window.geom=await import('/src/components/personalizer/editor/geometry.ts');return true})()`)
  await check('all unlocked sides, proportional corners, rotated anchors and seam bounds', `(()=>{
    const e={...el(),x:512,y:256,width:200,height:120,rotation:.4,lockAspectRatio:false};
    for(const h of geom.selectionHandles(e).filter(h=>h.kind!=='rotate')){
      const start=geom.toDesign(e,h),end=geom.toDesign(e,{x:h.x+(h.x?Math.sign(h.x)*15:0),y:h.y+(h.y?Math.sign(h.y)*15:0)});
      designStore.transform(e,h.kind,start,end);designStore.commit();const next=el();
      if(h.kind==='left'||h.kind==='right'){if(Math.abs(next.height-e.height)>.001||next.width<=e.width)return false}
      else if(h.kind==='top'||h.kind==='bottom'){if(Math.abs(next.width-e.width)>.001||next.height<=e.height)return false}
      else if(Math.abs(next.width/next.height-e.width/e.height)>.001)return false;
      const sx=Math.sign(h.x),sy=Math.sign(h.y),anchor=geom.toDesign(e,{x:-sx*e.width/2,y:-sy*e.height/2}),after=geom.toDesign(next,{x:-sx*next.width/2,y:-sy*next.height/2});
      if(Math.hypot(anchor.x-after.x,anchor.y-after.y)>.001)return false;
    }
    const edge={...e,x:110,y:256,rotation:0};const h=geom.selectionHandles(edge).find(h=>h.kind==='left');const start=geom.toDesign(edge,h);designStore.transform(edge,'left',start,{x:-35,y:256});designStore.commit();return el().x<200&&Math.abs(el().x-el().width/2+35)<.001;
  })()`)
  // Desktop cursor is picked from the selected control before the element body.
  await evaluate(`designStore.select(el().id);designStore.rotateElement(el().id,0);designStore.move(el().id,512,256);designStore.commit();designStore.resizeElement(el().id,'width',180);document.querySelector('.pz-workspace').scrollIntoView({block:'start',behavior:'instant'});true`)
  await pause(150)
  for(const [handle,cursor] of [['top-left','nwse-resize'],['top-right','nesw-resize'],['right','ew-resize'],['top','ns-resize'],['rotate','grab']]) {
    const point=await evaluate(`(()=>{const h=geom.selectionHandles(el()).find(h=>h.kind==='${handle}'),p=geom.toDesign(el(),h);return project(p.x,p.y)})()`)
    await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',...point,buttons:0})
    await check('cursor '+handle,`state().gl.domElement.style.cursor==='${cursor}'`)
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

