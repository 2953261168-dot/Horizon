(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const chapter=document.querySelector('.gaze-chapter'),tide=document.querySelector('.horizon-tide'),basin=document.querySelector('.catchment');
  const clamp=n=>Math.max(0,Math.min(1,n));
  
  const layer=document.createElement('div');layer.className='water-theatre';layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<svg width="0" height="0"><defs><filter id="paper-wet-edge"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="3" seed="12" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale="18"/></filter><linearGradient id="tear-body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eff1d2" stop-opacity=".8"/><stop offset=".28" stop-color="#a3b596" stop-opacity=".15"/><stop offset=".62" stop-color="#d4dfbe" stop-opacity=".5"/><stop offset="1" stop-color="#657459" stop-opacity=".9"/></linearGradient></defs></svg>`;
  document.body.append(layer);
  const surfaces=[...document.querySelectorAll('.forest-latest,.forest-edition,.field-archive,.archive-ledger,.field-closing,.footer-grid,.reading-desks,.reading-desks>a,.front-lead,.front-column,.front-headline,.news-card')];
  surfaces.forEach(el=>el.classList.add('wet-surface'));
  let reservoir=0,particles=[],traces=[],frame=0,last=0,nextDrop=0,burst=0,dropId=0;
  const image=chapter?.querySelector('.natural-gaze img');
  const optics=image&&window.HorizonWaterOptics?new window.HorizonWaterOptics(layer,image):null;
  let boundaries=[];
  function measure(){boundaries=surfaces.map(el=>{const r=el.getBoundingClientRect();return {el,left:r.left,right:r.right,top:r.top+scrollY,bottom:r.bottom+scrollY};});}
  addEventListener('load',measure,{once:true});document.fonts?.ready.then(measure);
  const ripples=basin?[...basin.querySelectorAll('.lake-ripples ellipse')]:[];
  function ripple(x=.5,y=215){
    if(reduced.matches)return;
    ripples.forEach((ring,i)=>{ring.setAttribute('cx',String(clamp(x)*1400));ring.setAttribute('cy',String(y));ring.getAnimations().forEach(a=>a.cancel());ring.animate([{transform:'scale(.1)',opacity:0},{transform:'scale(.65)',opacity:1,offset:.15},{transform:'scale(3)',opacity:0}],{duration:2600+i*200,delay:i*110,easing:'ease-out'});});
    reservoir=Math.min(1,reservoir+.22);tide?.style.setProperty('--tide',String(reservoir));tide?.classList.add('has-arrival');setTimeout(()=>tide?.classList.remove('has-arrival'),4200);basin?.style.setProperty('--lake-level',String(.3+reservoir*.7));
  }
  const waterButton=basin?.querySelector('button');
  function touchWater(event){
    const svg=basin?.querySelector('svg'),matrix=svg?.getScreenCTM(),pool=basin?.querySelector('.court-pool');
    if((event.detail||event.type==='pointermove')&&matrix){const local=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());if(pool?.isPointInFill(local)){ripple(local.x/1400,local.y);return;}if(event.type==='pointermove')return;}
    ripple(.5,220);
  }
  waterButton?.addEventListener('click',touchWater);
  let stirredAt=0;
  waterButton?.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||performance.now()-stirredAt<170)return;stirredAt=performance.now();touchWater(event);},{passive:true});

  function soak(el,x,y,radius=8){
    if(el.querySelectorAll(':scope>.wet-bloom').length>=2)return;
    const r=el.getBoundingClientRect(),bloom=document.createElement('i');bloom.className='wet-bloom';bloom.setAttribute('aria-hidden','true');bloom.style.setProperty('--wet-x',(x-r.left)+'px');bloom.style.setProperty('--wet-y',Math.max(0,y-r.top)+'px');const spread=Math.min(el.clientWidth*1.3,100+radius*32);bloom.style.width=spread+'px';bloom.style.height=spread*.72+'px';el.append(bloom);
    bloom.animate([{opacity:0,transform:'translate(-50%,-45%) scale(.08)'},{opacity:.85,transform:'translate(-50%,-45%) scale(.55)',offset:.13},{opacity:.65,transform:'translate(-50%,-45%) scale(1.15)',offset:.65},{opacity:0,transform:'translate(-50%,-45%) scale(1.4)'}],{duration:11000,easing:'cubic-bezier(.15,.55,.4,1)'}).finished.then(()=>bloom.remove()).catch(()=>bloom.remove());
    const card=el.matches('.forest-edition,.news-card,.archive-ledger,.front-lead,.front-headline')?el:null;
    card?.animate([{translate:'0 0',rotate:'0deg'},{translate:'0 4px',rotate:'.18deg',offset:.18},{translate:'0 -1px',rotate:'-.08deg',offset:.55},{translate:'0 0',rotate:'0deg'}],{duration:950,easing:'ease-out'});
  }
  // All source measurements use the actually painted object-fit rectangle.
  // While the portrait is pinned, its drops share its coordinate frame: scrolling
  // must not drag older drops upward over her forehead.
  function imageBox(){
    const r=image.getBoundingClientRect(),w=image.naturalWidth||1200,h=image.naturalHeight||561;
    const scale=Math.min(r.width/w,r.height/h);
    return {left:r.left+(r.width-w*scale)/2,top:r.top+(r.height-h*scale)/2,width:w*scale,height:h*scale};
  }
  function origin(box){return {x:box.left+box.width*(419/1200),y:box.top+box.height*(268/561)+scrollY};}
  // Calibrated on the source engraving: inner corner, nose side, then cheek.
  // The curve belongs to the face; only detached water enters world-space gravity.
  const cheek=[[419,268],[431,307],[429,347],[416,388],[423,428],[445,470],[468,518],[475,540]];
  function cheekPoint(progress,box,lane=0){
    const value=clamp(progress)*(cheek.length-1),i=Math.min(cheek.length-2,Math.floor(value)),t=value-i;
    const p0=cheek[Math.max(0,i-1)],p1=cheek[i],p2=cheek[i+1],p3=cheek[Math.min(cheek.length-1,i+2)];
    const cubic=k=>.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t);
    return {x:box.left+(cubic(0)+lane*Math.sin(progress*Math.PI))/1200*box.width,y:box.top+scrollY+cubic(1)/561*box.height};
  }
  function emit(start){
    const rill=Math.random()<.62;
    particles.push({rill,pause:0,pauses:rill?[.35+Math.random()*.2]:[.24+Math.random()*.13,.6+Math.random()*.14],id:++dropId,x:start.x,y:start.y,previousOrigin:start.y,onFace:true,faceProgress:0,travel:(rill?4.8:7.5)+Math.random()*2,endHold:0,lane:(Math.random()-.5)*5,following:true,vx:0,vy:0,age:0,hold:0,r:.5,targetR:8+Math.random()*2.5,wide:.95,long:1,traceAt:0,hit:new Set()});
  }
  function draw(now){
    frame=0;if(document.hidden||reduced.matches||!chapter||!optics?.ready)return;
    const dt=Math.min(.035,last?(now-last)/1000:.016);last=now;
    const cr=chapter.getBoundingClientRect(),eye=chapter.querySelector('.natural-gaze');
    const alpha=Number(getComputedStyle(eye).opacity),box=imageBox(),start=origin(box);
    const birthVisible=alpha>.8&&start.y-scrollY>45&&start.y-scrollY<innerHeight-45&&cr.top<0;
    if(cr.top>innerHeight*.15){particles=[];traces=[];nextDrop=now+600;burst=0;}
    if(birthVisible&&now>nextDrop&&particles.filter(p=>p.y-scrollY>0&&p.y-scrollY<innerHeight).length<10&&particles.length<85){
      if(!burst)burst=3+Math.floor(Math.random()*3);
      emit(start);burst--;nextDrop=now+(burst?520+Math.random()*850:3800+Math.random()*2200);
    }
    const poolSvg=basin?.querySelector('svg'),pool=basin?.querySelector('.court-pool'),poolMatrix=poolSvg?.getScreenCTM();
    const splinters=[];
    particles=particles.filter(p=>{
      p.age+=dt;const oldY=p.y;
      if(p.onFace){
        if(p.age>1.05){
          if(p.pause>0)p.pause-=dt;
          else{const before=p.faceProgress;p.faceProgress=Math.min(1,p.faceProgress+dt/p.travel);if(p.pauses.length&&before<p.pauses[0]&&p.faceProgress>=p.pauses[0]){p.pauses.shift();p.pause=(p.rill?.08:.25)+Math.random()*.35;}}
        }
        const point=cheekPoint(p.faceProgress,box,p.lane);p.x=point.x;p.y=point.y;
        p.r=.4+p.targetR*(p.rill?.68:.52)*clamp(p.age/1.05);p.long=1.06;p.wide=.9;
        if(p.age-p.traceAt>.055&&p.faceProgress>0&&(p.rill||p.age%1.6<.22)){traces.push({id:p.rill?String(p.id):p.id+':'+Math.floor(p.age/1.6),x:p.x,y:p.y,age:0,r:1.35,opacity:.42,following:true,previousOrigin:start.y});p.traceAt=p.age;}
        if(p.faceProgress===1){
          p.endHold+=dt;p.r=p.targetR*((p.rill?.68:.52)+(p.rill?.32:.48)*clamp(p.endHold/.7));p.long=1.08;
          if(p.endHold>.7){
            p.onFace=false;p.following=false;p.vy=20;p.vx=(cheekPoint(1,box).x-cheekPoint(.98,box).x)/(p.travel*.02);p.r=p.targetR;
            if(p.rill&&Math.random()<.55){const radius=1.8+Math.random()*1.1;splinters.push({...p,id:++dropId,r:radius,targetR:radius,vy:4,vx:(Math.random()-.5)*2,hit:new Set()});p.r=Math.sqrt(p.r*p.r-radius*radius);}
          }
        }
      }else{
        if(p.hold>0){p.hold-=dt;p.vy=18;p.vx*=Math.exp(-dt*5);}
        else{p.vy=Math.min(210,p.vy+70*dt);p.y+=p.vy*dt;p.x+=p.vx*dt;p.vx*=Math.exp(-dt*.9);}
        p.long+=((p.hold>0?.65:1.04+Math.sin(p.age*7)*.035)-p.long)*dt*9;
        p.wide+=((p.hold>0?1.4:1-Math.sin(p.age*7)*.025)-p.wide)*dt*11;
        for(const border of boundaries){
          if(!p.hit.has(border.el)&&oldY<=border.top+2&&p.y>=border.top&&p.x>=border.left&&p.x<=border.right){
            p.hit.add(border.el);p.y=border.top+1;p.hold=.24;p.vx=(Math.random()-.5)*8;soak(border.el,p.x,p.y-scrollY,p.r);break;
          }
        }
        if(poolMatrix&&pool){
          const local=new DOMPoint(p.x,p.y-scrollY).matrixTransform(poolMatrix.inverse());
          if(pool.isPointInFill(local)){ripple(clamp(local.x/1400),local.y);return false;}
        }
      }
      return p.age<90;
    });
    particles.push(...splinters);
    // Thin films visually join through the height field. Detached beads conserve
    // area on collision and relax back to a rounded shape, without pointed tails.
    for(let i=0;i<particles.length;i++)for(let j=i+1;j<particles.length;j++){
      const a=particles[i],b=particles[j];if(a.onFace||b.onFace)continue;
      if(Math.hypot(a.x-b.x,a.y-b.y)<(a.r+b.r)*.58){
        const ma=a.r*a.r,mb=b.r*b.r,total=ma+mb;
        a.x=(a.x*ma+b.x*mb)/total;a.y=(a.y*ma+b.y*mb)/total;a.vy=(a.vy*ma+b.vy*mb)/total;
        a.r=Math.min(12,Math.sqrt(total));a.long=1.08;a.wide=.96;particles.splice(j--,1);
      }
    }
    traces=traces.filter(t=>{t.age+=dt;if(t.following){t.y+=start.y-t.previousOrigin;t.previousOrigin=start.y;}t.opacity=.5*(1-t.age/5);return t.age<5;});
    optics.render(particles,traces,box,alpha);
    optics.canvas.dataset.sourceX=start.x.toFixed(1);optics.canvas.dataset.sourceY=(start.y-scrollY).toFixed(1);
    if(birthVisible||particles.length||traces.length)frame=requestAnimationFrame(draw);
  }
  function wake(){if(!frame&&!document.hidden&&!reduced.matches&&chapter){last=0;frame=requestAnimationFrame(draw);}}
  let scrollFrame=0;
  function update(){scrollFrame=0;
    if(chapter){const r=chapter.getBoundingClientRect(),p=clamp(-r.top/Math.max(1,chapter.offsetHeight-innerHeight));const reveal=clamp((p-.32)/.25);const eyes=chapter.querySelector('.natural-gaze');eyes.style.opacity=String(reveal);eyes.style.translate=`0 ${(1-reveal)*22}px`;chapter.querySelector('.drafting-table').style.opacity=String(1-clamp((p-.28)/.3));chapter.querySelector('.gaze-quotation').style.opacity=String(clamp((p-.4)/.17));}
    if(tide){const r=tide.getBoundingClientRect(),p=clamp((innerHeight-r.top)/Math.max(innerHeight,r.height));tide.style.setProperty('--tide',String(reservoir));}
    wake();
  }
  function schedule(){if(!scrollFrame)scrollFrame=requestAnimationFrame(update);}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',()=>{particles=[];traces=[];nextDrop=performance.now()+600;measure();optics?.resize();schedule();},{passive:true});document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',()=>{particles=[];traces=[];cancelAnimationFrame(frame);frame=0;update();});measure();update();
})();

