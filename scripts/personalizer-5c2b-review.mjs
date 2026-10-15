// Run against npm run dev -- --host 127.0.0.1 --port 5174. No test dependencies.
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const out = path.join(os.tmpdir(), 'sublime-personalizer-5c2b-review')
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
      window.el = () => design().elements.find(e=>e.id===design().selectedElementId);
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


  await mug(1440); await start(); await click('[aria-label="Adicionar texto"]')
  await evaluate(`(async()=>{
    window.fonts=await import('/src/components/personalizer/editor/fontCatalog.ts');
    window.layout=await import('/src/components/personalizer/editor/textLayout.ts');
    window.geom=await import('/src/components/personalizer/editor/geometry.ts');
    window.comp=await import('/src/components/personalizer/editor/compositor.ts');
    window.stores=await import('/src/components/personalizer/editor/createDesignStore.ts');
    window.el=()=>design().elements.find(e=>e.id===design().selectedElementId);
    window.metricsOK=e=>{const l=layout.layoutText(document.createElement('canvas').getContext('2d'),e);return Math.abs(l.width-e.width)<.001&&Math.abs(l.height-e.height)<.001};
    window.inkBounds=e=>{
      const c=comp.createDesignCanvas(),ctx=c.getContext('2d');ctx.translate(512,256);layout.drawText(ctx,e);
      const pixels=ctx.getImageData(0,0,1024,512).data;let count=0,left=1024,right=0,top=512,bottom=0;
      for(let y=0;y<512;y++)for(let x=0;x<1024;x++)if(pixels[(y*1024+x)*4+3]){count++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
      return {count,left,right,top,bottom,inside:left>=512-e.width/2-1&&right<=512+e.width/2+1&&top>=256-e.height/2-1&&bottom<=256+e.height/2+1};
    };
    await fonts.loadFont(el());return true;
  })()`)
  async function select(label, value) {
    await evaluate(`(()=>{const input=document.querySelector('select[aria-label=${JSON.stringify(label)}]');input.focus();input.value=${JSON.stringify(String(value))};input.dispatchEvent(new Event('change',{bubbles:true}));input.blur()})()`)
    await pause(30)
  }
  async function input(label, value, type = 'input') {
    await evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(type==='textarea'?'textarea':`input[aria-label="${label}"]`)});input.focus();Object.getOwnPropertyDescriptor(${type==='textarea'?'HTMLTextAreaElement':'HTMLInputElement'}.prototype,'value').set.call(input,${JSON.stringify(String(value))});input.dispatchEvent(new Event('input',{bubbles:true}));input.blur()})()`)
    await pause(30)
  }
  await check('12 catalog families, supported weights and bundled licenses', `(async()=>fonts.fontCatalog.length===12&&(await Promise.all(fonts.fontCatalog.map(async f=>(await (await fetch('/fonts/personalizer/'+f.directory+'/OFL.txt')).text()).includes('SIL OPEN FONT LICENSE')))).every(Boolean))()`)
  // Delay a real font load while edits, selection and undo occur. Completion must
  // measure the latest state and history, never replay a stale captured element.
  await check('late font completion refreshes live and undo/redo metrics without a history entry', `(async()=>{
    const original=FontFace.prototype.load;let release;
    FontFace.prototype.load=function(){const face=this;return new Promise(resolve=>{release=()=>original.call(face).then(resolve)})};
    const s=stores.createDesignStore({wrapX:true});s.addText();const id=s.getDesign().selectedElementId;
    s.updateText(id,{fontFamily:'Caveat'});s.updateText(id,{content:'Última edição'});
    FontFace.prototype.load=original;release();await fonts.loadFont(s.getDesign().elements[0]);await new Promise(r=>setTimeout(r,20));
    const latest=s.getDesign().elements[0];s.undo();const previous=s.getDesign().elements[0];s.redo();
    const ok=latest.content==='Última edição'&&previous.content==='O teu texto'&&metricsOK(latest)&&metricsOK(previous)&&s.getDesign().elements[0].content===latest.content;
    s.cleanup();return ok;
  })()`)
  const families=await evaluate('fonts.fontCatalog.map(f=>f.family)')
  await select('Fonte','Pacifico')
  for(const family of families) {
    await input('', 'Avó Sublime\nÁgil jç', 'textarea')
    const previous=await evaluate('el().fontFamily')
    await select('Fonte',family)
    await check(family+': load, apply, measure and canvas ink bounds', `(async()=>{const loaded=await fonts.loadFont(el());await new Promise(r=>setTimeout(r,20));const b=inkBounds(el());return loaded&&el().fontFamily===${JSON.stringify(family)}&&metricsOK(el())&&b.count>100&&b.inside})()`)
    if(previous!==family) {
      await evaluate('designStore.undo()')
      await check(family+': undo', `el().fontFamily===${JSON.stringify(previous)}&&metricsOK(el())`)
      await evaluate('designStore.redo()')
      await check(family+': redo', `el().fontFamily===${JSON.stringify(family)}&&metricsOK(el())`)
    }
    const variants=await evaluate(`fonts.resolveFont(${JSON.stringify(family)}).weights.flatMap(fontWeight=>fonts.resolveFont(${JSON.stringify(family)}).italic?['normal','italic'].map(fontStyle=>({fontWeight,fontStyle})):[{fontWeight,fontStyle:'normal'}])`)
    for(const variant of variants) {
      await check(`${family}: real ${variant.fontWeight} ${variant.fontStyle}`, `(async()=>{
        designStore.updateText(el().id,${JSON.stringify(variant)});const loaded=await fonts.loadFont(el());await new Promise(r=>setTimeout(r,0));
        return loaded&&document.fonts.check(fonts.canvasFont(el()))&&metricsOK(el())&&inkBounds(el()).inside;
      })()`)
    }
  }
  await select('Fonte','Figtree');await input('', 'AV jç\nLinha', 'textarea')
  await check('real bold and italic change the rendered pixels', `(async()=>{
    const hashes=[];for(const variant of [{fontWeight:400,fontStyle:'normal'},{fontWeight:700,fontStyle:'normal'},{fontWeight:400,fontStyle:'italic'}]){
      designStore.updateText(el().id,variant);await fonts.loadFont(el());await new Promise(r=>setTimeout(r,0));
      const c=comp.createDesignCanvas();comp.renderDesignToCanvas(c,design(),()=>undefined);hashes.push(c.toDataURL());
    }return new Set(hashes).size===3;
  })()`)
  for(let bits=0;bits<8;bits++) {
    await check('style combination '+bits, `(async()=>{
      designStore.updateText(el().id,{fontWeight:${bits&1?700:400},fontStyle:'${bits&2?'italic':'normal'}',underline:${!!(bits&4)}});
      await fonts.loadFont(el());await new Promise(r=>setTimeout(r,0));const b=inkBounds(el());return b.inside&&b.count>100&&metricsOK(el());
    })()`)
  }
  for(const letterSpacing of [-5,0,30]) for(const lineHeight of [.8,1.3,2]) for(const align of ['left','center','right']) {
    await check(`tracking ${letterSpacing}, leading ${lineHeight}, ${align}`, `(()=>{
      designStore.updateText(el().id,{letterSpacing:${letterSpacing},lineHeight:${lineHeight},align:'${align}',underline:true});
      const e=el(),l=layout.layoutText(document.createElement('canvas').getContext('2d'),e),b=inkBounds(e);
      return metricsOK(e)&&b.inside&&l.lines.length===2&&l.lineHeight===e.fontSize*${lineHeight};
    })()`)
  }
  await check('tracking advances graphemes without splitting combining accents/emoji', `(()=>{
    const ctx=document.createElement('canvas').getContext('2d');ctx.font=fonts.canvasFont(el());
    const zero=layout.measureTextLine(ctx,'HHHH',0),positive=layout.measureTextLine(ctx,'HHHH',10),negative=layout.measureTextLine(ctx,'HHHH',-5);
    return Math.abs(positive.width-zero.width-30)<.01&&Math.abs(negative.width-zero.width+15)<.01&&layout.measureTextLine(ctx,'á👩‍👩‍👦',4).glyphs.length===2;
  })()`)
  await check('underline covers each full line and respects alignment', `(()=>{
    const ctx=document.createElement('canvas').getContext('2d'),moves=[],ends=[];
    ctx.moveTo=(x,y)=>moves.push({x,y});ctx.lineTo=(x,y)=>ends.push({x,y});
    layout.drawText(ctx,el());const l=layout.layoutText(ctx,el());
    return moves.length===2&&moves.every((p,i)=>Math.abs(ends[i].x-p.x-l.lines[i].width)<.001&&p.y===ends[i].y&&Math.abs(p.x-(l.naturalWidth-l.lines[i].width))<.001);
  })()`)
  for(const transform of ['uppercase','lowercase','none']) {
    await select('Maiúsculas / minúsculas',transform)
    await check('non-destructive transform '+transform,`el().content===${JSON.stringify('AV jç\nLinha')}&&document.querySelector('textarea').value===el().content&&layout.displayText(el())===${JSON.stringify(transform==='uppercase'?'AV JÇ\nLINHA':transform==='lowercase'?'av jç\nlinha':'AV jç\nLinha')}`)
  }
  for(const [prop,value] of Object.entries({fontFamily:'Montserrat',fontSize:70,fontWeight:500,fontStyle:'normal',underline:false,letterSpacing:3,lineHeight:1.1,textTransform:'uppercase',color:'#cc2244',align:'left'})) {
    await check('undo/redo property '+prop, `(async()=>{
      const before={...el()};designStore.updateText(el().id,{${prop}:${JSON.stringify(value)}});await fonts.loadFont(el());await new Promise(r=>setTimeout(r,0));
      designStore.undo();const restored=el().${prop}===before.${prop}&&metricsOK(el());designStore.redo();return restored&&el().${prop}===${JSON.stringify(value)}&&metricsOK(el());
    })()`)
  }
  for(const family of ['Figtree','Playfair Display','Dancing Script']) {
    await select('Fonte',family)
    await check('corner resize '+family+' keeps typography and uniform glyph size', `(async()=>{
      designStore.updateText(el().id,{fontSize:28,fontWeight:700,fontStyle:'italic',letterSpacing:12,content:'Avó\\nSublime'});await fonts.loadFont(el());await new Promise(r=>setTimeout(r,0));
      const e={...el()},h=geom.selectionHandles(e).find(h=>h.kind==='bottom-right'),start=geom.toDesign(e,h),end=geom.toDesign(e,{x:h.x+20,y:h.y+10});
      designStore.transform(e,h.kind,start,end);designStore.commit();const resized={...el()};designStore.undo();const undo=el().fontSize===e.fontSize;designStore.redo();
      return undo&&resized.fontSize>e.fontSize&&['fontFamily','fontWeight','fontStyle','letterSpacing','lineHeight','content'].every(k=>resized[k]===e[k])&&metricsOK(resized)&&!('scaleX' in resized)&&!('scaleY' in resized);
    })()`)
  }
  for(const x of [0,2,1022,1024]) {
    await check('advanced seam render / hit / move / rotate / resize / history at '+x,`(()=>{
      designStore.rotateElement(el().id,0);designStore.updateText(el().id,{fontSize:54,letterSpacing:8,underline:true,content:'Costura 360°'});designStore.move(el().id,${x},256);designStore.commit();
      const e={...el()},canvas=comp.createDesignCanvas();comp.renderDesignToCanvas(canvas,design(),()=>undefined);
      const ctx=canvas.getContext('2d'),ink=column=>{const p=ctx.getImageData(column,0,1,512).data;return p.some((v,i)=>i%4===0&&v<230)};
      const paint=ink(0)&&ink(1023),hit=geom.hitTest(design().elements,{x:1023,y:e.y},design().space)?.id===e.id&&geom.hitTest(design().elements,{x:1,y:e.y},design().space)?.id===e.id;
      designStore.move(e.id,${x}+20,e.y);designStore.commit();designStore.rotateElement(e.id,.3);
      const r={...el()},h=geom.selectionHandles(r).find(h=>h.kind==='bottom-right');designStore.transform(r,h.kind,geom.toDesign(r,h),geom.toDesign(r,{x:h.x+10,y:h.y+10}));designStore.commit();
      const final=JSON.stringify(design().elements);designStore.undo();designStore.undo();designStore.undo();const undo=Math.abs(el().x-e.x)<.001;designStore.redo();designStore.redo();designStore.redo();
      return paint&&hit&&undo&&JSON.stringify(design().elements)===final&&metricsOK(el());
    })()`)
  }
  await check('duplicate preserves all typography; layer order undo/redo', `(()=>{
    const original={...el()};designStore.duplicate(original.id);const copy=el();
    const same=['content','fontFamily','fontSize','fontWeight','fontStyle','underline','letterSpacing','lineHeight','textTransform','align','color','rotation'].every(k=>copy[k]===original[k]);
    designStore.sendBackward(copy.id);const back=el().zIndex<design().elements.find(e=>e.id===original.id).zIndex;designStore.undo();designStore.redo();return same&&back&&el().id===copy.id;
  })()`)
  // Exercise the actual React controls at all required viewports.
  for(const width of [390,430,768,1024,1280,1440]) {
    await mug(width);await start();await click('[aria-label="Adicionar texto"]')
    await input('', 'Olá Sublime\nTexto real', 'textarea')
    await select('Fonte','Playfair Display');await select('Peso da fonte',600)
    for(const label of ['Negrito','Itálico','Sublinhado']) await click(`[aria-label="${label}"]`)
    await input('Tamanho da fonte',44)
    for(const [label,prop,values] of [['Ajustar tamanho da fonte','fontSize',[45,46,48]],['Espaçamento entre letras','letterSpacing',[5,10,12]],['Espaçamento entre linhas','lineHeight',[1.4,1.6,1.8]]]) {
      const before=await evaluate(`el().${prop}`)
      await evaluate(`(()=>{const input=document.querySelector('input[aria-label="${label}"]');input.focus();input.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));for(const value of ${JSON.stringify(values)}){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}))}window.dispatchEvent(new PointerEvent('pointerup'));input.blur()})()`)
      await check(width+': '+label+' live update',`el().${prop}===${values.at(-1)}`)
      await evaluate('designStore.undo()')
      await check(width+': '+label+' one undo per gesture',`el().${prop}===${before}`)
      await evaluate('designStore.redo()')
    }
    await evaluate(`window.typingBefore=el().content;document.querySelector('textarea').focus();document.querySelector('textarea').select()`)
    for(const text of ['Nova ','edição ','completa']) await cdp('Input.insertText',{text})
    await evaluate('document.activeElement.blur();designStore.undo()')
    await check(width+': typing groups until blur','el().content===typingBefore')
    await evaluate('designStore.redo()')
    await select('Maiúsculas / minúsculas','uppercase')
    await click('[aria-label="Alinhar à direita"]')
    await evaluate(`(()=>{const input=document.querySelector('input[type=color]');input.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'#2244aa');input.dispatchEvent(new Event('input',{bubbles:true}));input.blur()})()`)
    await check(width+': all style controls, transform, color, alignment',`el().fontFamily==='Playfair Display'&&el().fontWeight===400&&el().fontStyle==='italic'&&el().underline&&el().textTransform==='uppercase'&&el().color==='#2244aa'&&el().align==='right'&&el().content==='Nova edição completa'`)
    await check(width+': pressed states, labels, no overflow',`['Negrito','Itálico','Sublinhado'].every(label=>document.querySelector('[aria-label="'+label+'"]').hasAttribute('aria-pressed'))&&[...document.querySelectorAll('.pz-tool-controls input,.pz-tool-controls select,.pz-tool-controls textarea')].every(n=>n.getAttribute('aria-label')||n.closest('label'))&&document.documentElement.scrollWidth<=innerWidth`)
    await evaluate(`window.gpu={texture:state().scene.getObjectByName('printable-surface').material.map,geometry:state().scene.getObjectByName('printable-surface').geometry,version:state().scene.getObjectByName('printable-surface').material.map.version};designStore.updateText(el().id,{letterSpacing:4});true`)
    await pause(120)
    await check(width+': reuses texture/geometry and updates pixels','gpu.texture===state().scene.getObjectByName("printable-surface").material.map&&gpu.geometry===state().scene.getObjectByName("printable-surface").geometry&&gpu.texture.version>gpu.version')
    await select('Fonte','Pacifico')
    await check(width+': unsupported styles disabled and state normalized',`document.querySelector('[aria-label="Negrito"]').disabled&&document.querySelector('[aria-label="Itálico"]').disabled&&document.querySelector('[aria-label="Peso da fonte"]').options.length===1&&el().fontWeight===400&&el().fontStyle==='normal'`)
    await select('Fonte','Figtree')
    await evaluate(`document.querySelector('.pz-workspace').scrollIntoView({block:'start',behavior:'instant'})`)
    if(width<1024) {
      await check(width+': external scroll and large viewer',`getComputedStyle(document.querySelector('.pz-panel')).overflowY!=='auto'&&document.querySelector('.pz-viewer-surface').getBoundingClientRect().height>=350`)
    } else {
      await check(width+': desktop internal panel scroll',`getComputedStyle(document.querySelector('.pz-panel-content')).overflowY==='auto'&&getComputedStyle(document.querySelector('.pz-stage')).position==='sticky'`)
    }
    await screenshot('typography-'+width)
    // Real pointer events on advanced text, including the larger mobile targets.
    await evaluate(`(async()=>{
      window.geom=await import('/src/components/personalizer/editor/geometry.ts');window.mobile=await import('/src/components/personalizer/3d/mobileSelection.ts');
      const f=await import('/src/components/personalizer/editor/fontCatalog.ts');
      designStore.updateText(el().id,{content:'Avó\\nSublime',fontSize:28,fontWeight:700,fontStyle:'italic',underline:true,letterSpacing:2,lineHeight:1.4,textTransform:'none'});
      await f.loadFont(el());await new Promise(r=>setTimeout(r,20));designStore.move(el().id,512,256);designStore.commit();
      state().controls.target.set(0,0,0);state().camera.position.set(0,0,${width<1024?3.2:5.2});state().controls.update();state().invalidate();
      document.querySelector('.pz-workspace').scrollIntoView({block:'start',behavior:'instant'});return true;
    })()`)
    await pause(200)
    await evaluate('window.textBefore={...el()};window.textCamera=state().camera.position.clone();true')
    const corner=await evaluate(`(()=>{
      const h=geom.selectionHandles(el()).find(h=>h.kind==='bottom-right');
      if(${width<1024}){const s=state(),r=s.gl.domElement.getBoundingClientRect(),p=mobile.projectMobileHandles(design(),s.camera,s.scene,r).find(h=>h.kind==='bottom-right');return {x:p.x+r.left+12,y:p.y+r.top}}
      const p=geom.toDesign(el(),h);return project(p.x,p.y);
    })()`)
    await drag(corner,{x:corner.x+15,y:corner.y+15},width<1024)
    await check(width+': actual advanced text corner resize and orbit lock','el().fontSize>textBefore.fontSize&&el().underline&&el().fontWeight===700&&el().fontStyle==="italic"&&state().camera.position.distanceTo(textCamera)<.00001')
    await evaluate('designStore.undo()')
    await check(width+': actual advanced text resize one undo','JSON.stringify(el())===JSON.stringify(textBefore)')
    await screenshot('advanced-viewer-'+width)
    await evaluate(`document.querySelector('[aria-label="Fonte"]').scrollIntoView({block:'start',behavior:'instant'})`)
    await screenshot('typography-panel-'+width)
    // Keyboard focus, native select and B/I/U activation retain visible focus.
    await evaluate(`document.querySelector('[aria-label="Sublinhado"]').focus()`)
    await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32})
    await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32})
    await check(width+': keyboard style activation and visible focus',`!el().underline&&document.activeElement.getAttribute('aria-label')==='Sublinhado'&&getComputedStyle(document.activeElement).outlineStyle!=='none'`)
  }
  // A fresh document guarantees a cold cache for the intentionally failed load.
  await cdp('Network.enable');await cdp('Network.setBlockedURLs',{urls:['*fonts/personalizer/*']})
  await mug(1440);await start();await click('[aria-label="Adicionar texto"]')
  await check('font failure keeps fallback measurable, editable and drawable',`(async()=>{
    const f=await import('/src/components/personalizer/editor/fontCatalog.ts'),l=await import('/src/components/personalizer/editor/textLayout.ts'),c=await import('/src/components/personalizer/editor/compositor.ts');
    const e=design().elements[0],loaded=await f.loadFont(e);designStore.updateText(e.id,{content:'Fallback seguro',fontWeight:700,underline:true});
    const canvas=c.createDesignCanvas();c.renderDesignToCanvas(canvas,design(),()=>undefined);const next=design().elements[0],m=l.layoutText(canvas.getContext('2d'),next);
    return !loaded&&Number.isFinite(next.width)&&next.width>30&&Math.abs(next.width-m.width)<.001;
  })()`)
  await cdp('Network.setBlockedURLs',{urls:[]})
  const report = { checks, errors, passed: checks.every(c=>c.pass)&&!errors.length }
  await writeFile(path.join(out,'review.json'),JSON.stringify(report,null,2))
  console.log(JSON.stringify({out,passed:report.passed,checks:checks.length,failed:checks.filter(c=>!c.pass),errors},null,2))
  await send('Browser.close'); ws.close(); chrome.kill()
  process.exitCode = report.passed ? 0 : 1
} catch (error) {
  await writeFile(path.join(out,'review.json'),JSON.stringify({checks,errors,error:String(error)},null,2))
  console.error(error);ws?.close();chrome.kill();process.exitCode=1
}

