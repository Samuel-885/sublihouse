// Run against npm run dev -- --host 127.0.0.1 --port 5174. No test dependencies.
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const out = path.join(os.tmpdir(), 'sublime-personalizer-wrap-review')
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

  for (const width of [390,430,1024,1440]) {
    await mug(width);await start();await upload()
    await evaluate(`(async()=>{window.geom=await import('/src/components/personalizer/editor/geometry.ts');window.comp=await import('/src/components/personalizer/editor/compositor.ts');window.el=()=>design().elements[0];window.id=el().id;window.space=design().space;designStore.setAspectLock(id,false);designStore.resizeElement(id,'width',200);designStore.resizeElement(id,'height',120);designStore.setPhotoCorners(id,35);designStore.move(id,1000,256);designStore.commit();state().controls.target.set(0,0,0);state().camera.position.set(0,1,-6);state().controls.update();state().invalidate();return true})()`)
    await pause(180)
    await check(width+': wrap enabled, no X wall','space.wrapX&&el().x===1000&&design().elements.length===1')
    for (const x of [950,30]) {
      await evaluate('designStore.select(null)')
      const point=await evaluate(`project(${x},256)`)
      await pointer('down',point,width<1024);await pointer('up',point,width<1024)
      await check(width+': select body on seam side '+x,'design().selectedElementId===id')
    }
    for (const [from,to,expected] of [[1000,1060,36],[36,-24,1000]]) {
      await evaluate('window.saved=JSON.stringify(design().elements);window.snap=designStore.getSnapshot();window.cam=state().camera.position.clone();window.texture=state().scene.getObjectByName("printable-surface").material.map;window.paintXs=[];window.unsub=designStore.subscribePaint(()=>paintXs.push(el().x));true')
      await drag(await evaluate(`project(${from},256)`),await evaluate(`project(${to},256)`),width<1024,async()=>{
        await check(width+': seam move retains React/texture, orbit locked '+from,'designStore.getSnapshot()===snap&&!state().controls.enabled&&state().camera.position.distanceTo(cam)<.000001&&state().scene.getObjectByName("printable-surface").material.map===texture')
      })
      await evaluate('unsub()')
      await check(width+': continuous wrapped move '+from,`Math.abs(geom.unwrapDelta(el().x,${expected}))<4&&paintXs.every((x,i)=>x>=0&&x<1024&&(!i||Math.abs(geom.unwrapDelta(x,paintXs[i-1]))<20))`)
      await evaluate('window.after=JSON.stringify(design().elements);designStore.undo()')
      await check(width+': seam move single undo '+from,'JSON.stringify(design().elements)===saved')
      await evaluate('designStore.redo()')
      await check(width+': seam move redo '+from,'JSON.stringify(design().elements)===after')
    }
    // Grab the auxiliary painted side (point x=30, element center x=1000).
    await evaluate('designStore.move(id,1000,256);designStore.commit()')
    await drag(await evaluate('project(30,256)'),await evaluate('project(60,256)'),width<1024)
    await check(width+': dragging from auxiliary copy keeps offset','Math.abs(geom.unwrapDelta(el().x,6))<4')
    for (const handle of ['top-left','top-right','bottom-left','bottom-right','left','right','top','bottom','rotate']) {
      await evaluate(`designStore.rotateElement(id,0);designStore.move(id,1000,256);designStore.commit();window.initial={...el()};window.saved=JSON.stringify(design().elements);window.h=geom.selectionHandles(el(),space).find(h=>h.kind==='${handle}');window.hp=geom.toDesign(el(),h);true`)
      const from=await evaluate('project(hp.x,hp.y)')
      const to=await evaluate(handle==='rotate'?`project(initial.x+(hp.x-initial.x)*Math.cos(.4)-(hp.y-initial.y)*Math.sin(.4),initial.y+(hp.x-initial.x)*Math.sin(.4)+(hp.y-initial.y)*Math.cos(.4))`:`project(hp.x+(h.x?Math.sign(h.x)*16:0),hp.y+(h.y?Math.sign(h.y)*16:0))`)
      await drag(from,to,width<1024)
      await check(width+': seam handle '+handle,`JSON.stringify(design().elements)!==saved&&state().controls.enabled&&el().cornerRadius===35&&el().x>=0&&el().x<1024&&${handle==='rotate'?'Math.abs(el().rotation)>.2':handle==='left'||handle==='right'?'Math.abs(el().height-initial.height)<.01&&el().width>initial.width':handle==='top'||handle==='bottom'?'Math.abs(el().width-initial.width)<.01&&el().height>initial.height':'Math.abs(el().width/el().height-initial.width/initial.height)<.001'}`)
      await evaluate('designStore.undo()')
      await check(width+': seam handle single undo '+handle,'JSON.stringify(design().elements)===saved')
    }
    await evaluate(`designStore.setAspectLock(id,true);window.initial={...el()};window.hp=geom.toDesign(el(),{x:el().width/2,y:0});true`)
    await drag(await evaluate('project(hp.x,hp.y)'),await evaluate('project(hp.x+20,hp.y)'),width<1024)
    await check(width+': locked side preserves ratio across seam','el().width>initial.width&&Math.abs(el().width/el().height-initial.width/initial.height)<.001')
    await evaluate(`designStore.rotateElement(id,.4);designStore.move(id,1000,256);designStore.commit();window.h=geom.selectionHandles(el(),space).find(h=>h.kind==='bottom-right');window.hp=geom.toDesign(el(),h);window.end=geom.toDesign(el(),{x:h.x+12,y:h.y+12});window.saved=JSON.stringify(design().elements);true`)
    await drag(await evaluate('project(hp.x,hp.y)'),await evaluate('project(end.x,end.y)'),width<1024)
    await check(width+': rotated resize at seam','JSON.stringify(design().elements)!==saved&&Math.abs(el().rotation-.4)<.001')
    await evaluate('designStore.undo()')
    await check(width+': rotated resize undo','JSON.stringify(design().elements)===saved')
    // Inspect the texture edges and render the rear of the mug before/after orbit.
    await evaluate(`designStore.rotateElement(id,0);designStore.setPhotoCorners(id,0);designStore.move(id,1000,256);designStore.commit();true`)
    await pause(100)
    await check(width+': actual texture draws both edges',`(()=>{const c=state().scene.getObjectByName('printable-surface').material.map.image,ctx=c.getContext('2d');return [1,1022].every(x=>{const p=ctx.getImageData(x,220,1,1).data;return !(p[0]===255&&p[1]===253&&p[2]===249)})&&design().elements.length===1})()`)
    await screenshot('seam-'+width)
    await evaluate(`window.texture=state().scene.getObjectByName('printable-surface').material.map;window.beforeOrbit=state().camera.position.clone();window.saved=JSON.stringify(design().elements);true`)
    const empty=await evaluate('project(980,50)')
    await drag(empty,{x:empty.x+30,y:empty.y+2},width<1024)
    await check(width+': orbit retains continuous art','state().camera.position.distanceTo(beforeOrbit)>.01&&JSON.stringify(design().elements)===saved&&state().scene.getObjectByName("printable-surface").material.map===texture')
    await screenshot('seam-orbit-'+width)
    await evaluate(`state().controls.target.set(0,0,0);state().camera.position.set(0,1,-6);state().controls.update();state().invalidate();designStore.addText({x:1000,y:256});window.tid=design().selectedElementId;window.txt=()=>design().elements.find(e=>e.id===tid);window.initial={...txt()};window.h=geom.selectionHandles(txt(),space).find(h=>h.kind==='bottom-right');window.hp=geom.toDesign(txt(),h);true`)
    await pause(120)
    await drag(await evaluate('project(hp.x,hp.y)'),await evaluate('project(hp.x+20,hp.y+12)'),width<1024)
    await check(width+': text resize across seam','txt().fontSize>initial.fontSize&&geom.selectionHandles(txt(),space).length===5')
    await evaluate(`window.h=geom.selectionHandles(txt(),space).find(h=>h.kind==='rotate');window.hp=geom.toDesign(txt(),h);window.initial={...txt()};true`)
    await drag(await evaluate('project(hp.x,hp.y)'),await evaluate('project(initial.x+30,hp.y+5)'),width<1024)
    await check(width+': text rotation across seam','Math.abs(txt().rotation)>.1')
    await check(width+': photo/text layers hit through seam',`(()=>{const point={x:15,y:256};designStore.bringForward(id);const photo=geom.hitTest(design().elements,point,space)?.id===id;designStore.bringForward(tid);return photo&&geom.hitTest(design().elements,point,space)?.id===tid})()`)
    await click('.pz-reset')
    await check(width+': reset preserves canonical centers','design().elements.every(e=>e.x>=0&&e.x<1024)')
  }
  await check('normalization and multiple turns','[-2049,-1024,-1,0,1024,2049].map(geom.normalizeDesignX).join() === "1023,0,1023,0,0,1" && geom.unwrapDelta(20,1000)===44&&geom.unwrapDelta(3073,-1)===2')
  await check('flat domain keeps planar constraints',`(async()=>{const {createDesignStore}=await import('/src/components/personalizer/editor/createDesignStore.ts');const s=createDesignStore({wrapX:false});s.addText({x:1000,y:256});const e=s.getDesign().elements[0];s.move(e.id,-20,999);s.commit();const next=s.getDesign().elements[0];const valid=next.x===next.width/2&&next.y+next.height/2===512&&!geom.hitTest([next],{x:1020,y:next.y},{wrapX:false});s.cleanup();return valid})()`)
  // Compare the complete wrapped art against a shifted reference canvas; catches
  // cropping, rotation, layering and text discontinuity at either texture edge.
  for (const rotation of [0,.4,-.8]) for (const corners of [0,50,100]) {
    await check('wrapped compositor matches continuous reference '+rotation+'/'+corners,`(()=>{
      const photo={...el(),x:1000,y:256,width:200,height:120,rotation:${rotation},cornerRadius:${corners},zIndex:0};
      const text={...design().elements.at(-1),x:1000,y:256,rotation:${rotation},zIndex:1};const elements=[photo,text];
      const a=comp.createDesignCanvas(),b=comp.createDesignCanvas();comp.renderDesignToCanvas(a,{space,elements,selectedElementId:null},designStore.getPhoto);comp.renderDesignToCanvas(b,{space:{wrapX:false},elements:elements.map(e=>({...e,x:e.x-488})),selectedElementId:null},designStore.getPhoto);
      const ca=a.getContext('2d'),cb=b.getContext('2d');let error=0;for(let y=170;y<340;y++)for(let dx=-145;dx<145;dx++){const p=ca.getImageData(geom.normalizeDesignX(1000+dx),y,1,1).data,q=cb.getImageData(512+dx,y,1,1).data;for(let k=0;k<3;k++)error+=Math.abs(p[k]-q[k])}return error/(170*290*3)<.1;
    })()`)
  }
  await check('overlay control copies match a continuous reference',`(()=>{const e={...el(),x:1000,y:256,width:200,height:120,rotation:.4};const a=comp.createDesignCanvas(),b=comp.createDesignCanvas();comp.renderSelectionToCanvas(a,{space,elements:[e],selectedElementId:e.id});comp.renderSelectionToCanvas(b,{space,elements:[{...e,x:512}],selectedElementId:e.id});const ca=a.getContext('2d'),cb=b.getContext('2d');let error=0;for(let y=140;y<370;y++)for(let dx=-160;dx<160;dx++){const p=ca.getImageData(geom.normalizeDesignX(1000+dx),y,1,1).data,q=cb.getImageData(512+dx,y,1,1).data;for(let k=0;k<4;k++)error+=Math.abs(p[k]-q[k])}return error/(230*320*4)<.1})()`)
  await check('overlay wraps handles even when body does not cross',`(()=>{const e={...el(),x:101,y:256,width:200,height:120,rotation:0};const a=comp.createDesignCanvas();comp.renderSelectionToCanvas(a,{space,elements:[e],selectedElementId:e.id});return a.getContext('2d').getImageData(1022,196,1,1).data[3]>0})()`)
  await check('all rotated handles pick through either seam',`(()=>{for(const x of [10,1000])for(const rotation of [0,.4,-.8]){const e={...el(),x,y:256,width:200,height:120,rotation};for(const h of geom.selectionHandles(e,space)){const p=geom.toDesign(e,h);p.x=geom.normalizeDesignX(p.x);if(geom.hitTestHandle(e,p,false,space)!==h.kind)return false}}return true})()`)
  await evaluate(`(async()=>{window.insertion=await import('/src/components/personalizer/3d/insertionPoint.ts');window.pick=await import('/src/components/personalizer/3d/printableSurface.ts');return true})()`)
  await check('insertion skips occluding handle and finds nearby print',`(()=>{
    const scene=new three.Scene(),camera=new three.PerspectiveCamera(40,1,.1,20);camera.position.set(0,0,4);camera.lookAt(0,0,0);
    const surface=new three.Mesh(new three.PlaneGeometry(2,2),new three.MeshBasicMaterial());surface.name='printable-surface';scene.add(surface);
    const blocker=new three.Mesh(new three.BoxGeometry(.12,.12,.1),new three.MeshBasicMaterial());blocker.position.z=1;blocker.name='ceramic-handle';scene.add(blocker);
    const p=insertion.getInsertionPoint(camera,scene);window.occlusionFixture={scene,camera,surface,blocker};return !!p&&Math.abs(p.y-256)>10;
  })()`)
  await check('occluding shell blocks all insertion samples',`(()=>{const {scene,camera,blocker}=occlusionFixture;blocker.name='ceramic-shell';blocker.scale.set(100,100,1);return insertion.getInsertionPoint(camera,scene)===undefined})()`)
  await check('overlay never occludes insertion',`(()=>{const {scene,camera,blocker}=occlusionFixture;blocker.name='selection-overlay';const p=insertion.getInsertionPoint(camera,scene);return !!p&&Math.abs(p.x-512)<.001&&Math.abs(p.y-256)<.001})()`)
  await check('real mug handle occludes a center sample',`(()=>{const camera=state().camera.clone(),ray=new three.Raycaster();for(let angle=1;angle<2.2;angle+=.04){camera.position.set(Math.sin(angle)*6,.3,Math.cos(angle)*6);camera.lookAt(0,0,0);camera.updateMatrixWorld();ray.setFromCamera(new three.Vector2(0,0),camera);const hits=ray.intersectObjects(state().scene.children,true);if(hits[0]?.object.name==='ceramic-handle'&&hits.some(h=>h.object.name==='printable-surface'))return pick.pickPrintablePoint(ray,state().scene)===undefined}return false})()`)
  await check('real mug shell occludes a rim sample',`(()=>{const camera=state().camera.clone(),ray=new three.Raycaster();camera.position.set(0,3,6);for(let y=.6;y<1.4;y+=.02){camera.lookAt(0,y,0);camera.updateMatrixWorld();ray.setFromCamera(new three.Vector2(0,0),camera);const hits=ray.intersectObjects(state().scene.children,true);if(hits[0]?.object.name==='ceramic-shell')return pick.pickPrintablePoint(ray,state().scene)===undefined}return false})()`)
  const report = { checks, errors, passed: checks.every(c=>c.pass)&&!errors.length }
  await writeFile(path.join(out,'review.json'),JSON.stringify(report,null,2))
  console.log(JSON.stringify({out,passed:report.passed,checks:checks.length,failed:checks.filter(c=>!c.pass),errors},null,2))
  await send('Browser.close'); ws.close(); chrome.kill()
  process.exitCode = report.passed ? 0 : 1
} catch (error) {
  await writeFile(path.join(out,'review.json'),JSON.stringify({checks,errors,error:String(error)},null,2))
  console.error(error);ws?.close();chrome.kill();process.exitCode=1
}

