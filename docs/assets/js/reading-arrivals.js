/* Reading cues move in the margins. Text is never hidden, delayed or replaced. */
(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const seen=new WeakSet(),running=new Set();
  const headlines=[...document.querySelectorAll('.front-headline')];
  const dates=[...document.querySelectorAll('.ledger-row')];
  const clippings=[...document.querySelectorAll('.reaction-clippings')];
  const mast=document.querySelector('.edition-mast');
  const closing=document.querySelector('.closing-copy .draft-button');
  headlines.forEach(el=>{
    const fold=document.createElement('span');fold.className='reading-fold';fold.setAttribute('aria-hidden','true');
    fold.innerHTML='<svg viewBox="0 0 30 30"><path d="M0 0H30V30Z" fill="#c8c9b7"/><path d="M0 0L30 30L22 7Z" fill="#f5f2e7" stroke="#858c70" stroke-width=".55"/></svg>';el.append(fold);
    let flutter;
    function lift(){
      if(reduced.matches || !matchMedia('(hover: hover) and (pointer: fine)').matches)return;
      flutter?.cancel();
      flutter=el.animate([{rotate:'0deg'},{rotate:'.65deg',offset:.25},{rotate:'-.35deg',offset:.55},{rotate:'.12deg',offset:.78},{rotate:'0deg'}],{duration:480,easing:'ease-out'});
      running.add(flutter);const active=flutter;active.finished.then(()=>running.delete(active)).catch(()=>running.delete(active));
    }
    el.addEventListener('pointerenter',lift);
    el.addEventListener('focus',lift);

  });
  dates.forEach(el=>{
    const tab=document.createElement('span');tab.className='date-bookmark';tab.setAttribute('aria-hidden','true');
    tab.textContent=el.querySelector('strong').textContent.trim().split('.').pop();el.append(tab);
  });
  const archiveIntro=document.querySelector('.archive-intro');
  if(archiveIntro && dates.length){
    const preview=document.createElement('a');preview.className='archive-paper';
    const dateline=document.createElement('span');dateline.className='archive-paper-date';
    const title=document.createElement('h3');
    const illustration=document.querySelector('.front-art img')?.cloneNode(true);
    const turn=document.createElement('span');turn.className='archive-paper-turn';turn.textContent='翻开这一期 ↗';
    preview.append(dateline,title);if(illustration){illustration.alt='';preview.append(illustration);}preview.append(turn);archiveIntro.append(preview);
    function select(row){
      const headline=row.querySelector('.ledger-preview')?.textContent.trim();
      const date=row.querySelector('strong')?.textContent.trim();
      preview.href=row.href;dateline.textContent=date;title.textContent=headline || '每日视野 · '+date;
      dates.forEach(el=>el.classList.toggle('is-selected',el===row));
      if(!reduced.matches)play(preview,[{rotate:'-1.1deg',translate:'-5px 4px'},{rotate:'-.4deg',translate:'0 0'}],{duration:320,easing:'ease-out'});
    }
    select(dates[0]);
    dates.forEach(row=>{row.addEventListener('pointerenter',()=>select(row));row.addEventListener('focus',()=>select(row));});
  }
  if(mast){const marks=document.createElement('span');marks.className='press-register';marks.setAttribute('aria-hidden','true');marks.innerHTML='<i></i><i></i><i></i>';mast.append(marks);}
  function play(el,frames,options){if(reduced.matches)return;const animation=el.animate(frames,options);running.add(animation);animation.finished.then(()=>running.delete(animation)).catch(()=>running.delete(animation));}
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(({target,isIntersecting})=>{
      target.classList.toggle('is-reading',isIntersecting);
      if(!isIntersecting||seen.has(target)||reduced.matches)return;
      seen.add(target);target.classList.add('arrived-once');
      if(target.matches('.front-headline')){
        play(target.querySelector('.reading-fold'),[{rotate:'-16deg',translate:'4px -5px'},{rotate:'4deg',translate:'-1px 1px',offset:.55},{rotate:'0deg',translate:'0 0'}],{duration:720,easing:'cubic-bezier(.2,.7,.3,1)'});
        play(target.querySelector('span'),[{translate:'-5px 0'},{translate:'1px 0',offset:.65},{translate:'0 0'}],{duration:460,easing:'ease-out'});
      }else if(target.matches('.ledger-row')){
        play(target.querySelector('.date-bookmark'),[{translate:'0 -17px',rotate:'-9deg'},{translate:'0 3px',rotate:'2deg',offset:.65},{translate:'0 0',rotate:'0deg'}],{duration:820,easing:'cubic-bezier(.2,.75,.3,1)'});
      }else if(target===mast){
        target.querySelectorAll('.press-register i').forEach((mark,i)=>play(mark,[{translate:`${(i-1)*8}px ${i%2?5:-5}px`,rotate:'8deg'},{translate:'0 0',rotate:'0deg'}],{duration:700,delay:i*90,easing:'cubic-bezier(.18,.8,.3,1)'}));
      }else if(target===closing){
        play(target.lastElementChild,[{translate:'-7px 5px',rotate:'-12deg'},{translate:'1px -1px',rotate:'2deg',offset:.65},{translate:'0 0',rotate:'0deg'}],{duration:760,easing:'ease-out'});
      }
    });
  },{rootMargin:'-12% 0px -24% 0px',threshold:.18});
  [...headlines,...dates,...clippings,mast,closing].filter(Boolean).forEach(el=>observer.observe(el));
  reduced.addEventListener('change',()=>{if(reduced.matches){running.forEach(a=>a.cancel());running.clear();}});
})();
