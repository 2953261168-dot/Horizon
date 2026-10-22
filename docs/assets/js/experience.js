(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.getElementById('subscribe-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-subscribe]').forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      dialog.showModal();
    }));
    if (!('closedBy' in HTMLDialogElement.prototype)) dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
  }
  document.querySelectorAll('[data-copy-feed]').forEach(button => button.addEventListener('click', async () => {
    const field = button.closest('.feed-field').querySelector('input');
    const status = button.closest('dialog, .sources-intro').querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText(field.value);
      status.textContent = '已复制。去阅读器中添加订阅，即可接收每日简报。';
      button.textContent = '已复制 ✓';
    } catch {
      field.focus(); field.select();
      status.textContent = '地址已选中，请长按复制，或按 Ctrl / ⌘ + C。';
    }
  }));

  const reading = document.querySelector('.reading');
  if (reading) enhanceReading(reading);
  function enhanceReading(root) {
    const headings = [...root.querySelectorAll(':scope > h3')];
    if (!headings.length) return;
    const en = document.documentElement.lang === 'en';
    const words = en ? {all:'All stories',search:'Search this edition',empty:'No stories match. Try another search.',more:'Context & references',less:'Close context',original:'Read original',count:'stories',top:'Back to top',saved:'Saved',save:'Save for later',copied:'Link copied',copy:'Copy story link'} : {all:'全部视野',search:'搜索本期新闻',empty:'没有找到相关新闻，换个关键词试试。',more:'背景与参考',less:'收起延伸阅读',original:'阅读原文',count:'条新闻',top:'回到顶部',saved:'已收藏',save:'稍后阅读',copied:'链接已复制',copy:'复制新闻链接'};
    const groups = []; const cards = []; let bookmarkOnly = false;
    const firstCategory = root.querySelector(':scope > h2');
    // Capture the original document's boundaries before moving any nodes.
    const plans = headings.map((h, index) => {
      let category = h.previousElementSibling;
      while (category && category.tagName !== 'H2') category = category.previousElementSibling;
      const previous = h.previousElementSibling;
      const anchor = previous?.matches('a[id^="item-"]') ? previous : previous?.querySelector('a[id^="item-"]');
      const nodes = []; let next = h.nextElementSibling;
      while (next && !['H2','H3'].includes(next.tagName)) {nodes.push(next); next = next.nextElementSibling;}
      return {h,index,category,anchor,nodes};
    });
    const fragment = document.createDocumentFragment();
    plans.forEach(({h,index,category,anchor,nodes}) => {
      const rawLabel = category?.textContent.trim() || (en ? 'News' : '每日新闻');
      // Editorial provenance belongs inside the story, not in the topic navigation.
      const label = /PHP2Shell/i.test(rawLabel) && /补充|核对|supplement|verif/i.test(rawLabel)
        ? ([...root.querySelectorAll(':scope > h2')].find(title => /AI 与有趣工具|Technology News/.test(title.textContent))?.textContent.trim() || (en ? 'Technology News' : 'AI 与有趣工具')) : rawLabel;
      let group = groups.find(g => g.label === label);
      const anchorID = anchor?.id || `story-${index+1}`;
      const topic = label !== rawLabel ? 'tech-news' : anchorID.replace(/^item-/, '').replace(/-\d+$/, '');
      if (!group) {
        const section = document.createElement('section'); section.className = 'news-group'; section.dataset.topic = topic;
        const title = document.createElement('h2'); title.className = 'group-title'; title.textContent = label;
        if (category?.id) title.id = category.id;
        section.append(title); fragment.append(section); group = {label,topic,section,title,cards:[]}; groups.push(group);
      }
      const card = document.createElement('article'); card.className = 'news-card'; card.id = anchorID; card.dataset.topic = group.topic;
      const head = document.createElement('div'); head.className = 'card-overline';
      const number = document.createElement('span'); number.textContent = String(index+1).padStart(2,'0')+' / '+label;
      const mark = document.createElement('span'); mark.className='card-mark'; mark.textContent='H'; mark.setAttribute('aria-hidden','true'); head.append(number,mark);
      // Scores are ranking machinery, not evidence of accuracy; keep them out of the reading UI.
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT); let text;
      while ((text=walker.nextNode())) text.textContent=text.textContent.replace(/[⭐★☆]\uFE0F?\s*\d+(?:\.\d+)?\s*\/\s*10/g,'');
      h.className='news-title';
      const original = h.querySelector('a[href^="http"]');
      if (original) {original.target='_blank';original.rel='noopener noreferrer';}
      const body = document.createElement('div');body.className='news-summary';
      const deep = document.createElement('details');deep.className='news-context';
      const summary=document.createElement('summary');summary.innerHTML='<span></span><i aria-hidden="true">＋</i>';summary.firstChild.textContent=words.more;deep.append(summary);
      const context=document.createElement('div');context.className='context-content';deep.append(context);
      let metadata = null;
      const tags = document.createElement('div'); tags.className='news-tags';
      let isContext=false;
      nodes.forEach(node => {
        if (node.tagName==='HR' || node.matches('a[id^="item-"]') || node.querySelector('a[id^="item-"]')) return;
        if (node.matches('ol,ul') && node.querySelector('a[href^="#item-"]')) return;
        if (node.matches('p') && node.querySelector('strong') && node.nextElementSibling?.matches('ol,ul') && node.nextElementSibling.querySelector('a[href^="#item-"]')) return;
        if(node.matches('.reaction-clippings')){body.append(node);return;}
        const value=node.textContent.trim();
        if (/^(rss|reddit|github|hackernews|hn|telegram)\s*·/i.test(value)) {metadata=node;node.className='news-source';const first=node.firstChild;if(first?.nodeType===Node.TEXT_NODE)first.textContent=first.textContent.replace(/^[^·]+·\s*/,'');return;}
        if (/^(标签|Tags)\s*[:：]/i.test(value)) {
          const matches=[...node.querySelectorAll('code')];
          matches.slice(0,4).forEach(code=>{const tag=document.createElement('span');tag.textContent=code.textContent.replace(/^#/,'');tags.append(tag);});return;
        }
        if (['DETAILS','BLOCKQUOTE'].includes(node.tagName) || /「背景|「影响|「社区|「商业|Background|Impact/.test(value.slice(0,40))) isContext=true;
        (isContext?context:body).append(node);
      });
      const footer=document.createElement('div');footer.className='news-actions';
      if (original) {const link=original.cloneNode(true);link.className='original-link';link.textContent=words.original+' ↗';link.setAttribute('aria-label',words.original+'：'+original.textContent);footer.append(link);}
      const save=document.createElement('button');save.type='button';save.className='save-story';save.setAttribute('aria-pressed','false');
      let saved=[];try {saved=JSON.parse(localStorage.getItem('horizon-saved') || '[]');if (!Array.isArray(saved)) saved=[];} catch {}
      const key=location.pathname+'#'+anchorID;
      function paintSave(){const on=saved.includes(key);save.textContent=on?'✓ '+words.saved:'＋ '+words.save;save.setAttribute('aria-pressed',String(on));}
      paintSave();save.addEventListener('click',()=>{try{const stored=JSON.parse(localStorage.getItem('horizon-saved')||'[]');if(Array.isArray(stored))saved=stored;}catch{}const before=saved.includes(key);saved=before?saved.filter(x=>x!==key):[...saved,key];try {localStorage.setItem('horizon-saved',JSON.stringify(saved));paintSave();apply();}catch {saved=before?[...saved,key]:saved.filter(x=>x!==key);save.textContent=en?'Storage unavailable':'浏览器无法保存收藏';}});footer.append(save);
      card.append(head,h);if(metadata)card.append(metadata);card.append(body);
      if(tags.childElementCount)card.append(tags);
      if(context.childElementCount)card.append(deep);
      card.append(footer);group.section.append(card);group.cards.push(card);cards.push(card);
    });
    if (!cards.length) return;
    root.replaceChildren(fragment);
    document.body.classList.add('reader-page');
    const tools=document.createElement('div');tools.className='reader-tools';
    const info=document.createElement('div');info.className='edition-note';info.textContent=en?'Original sources and context accompany each story.':'每篇附原文与背景参考。';
    const controlRow=document.createElement('div');controlRow.className='reader-controls';
    const filters=document.createElement('div');filters.className='topic-switch';filters.setAttribute('role','group');filters.setAttribute('aria-label',en?'Filter stories':'新闻分类');
    const indicator=document.createElement('span');indicator.className='topic-indicator';indicator.setAttribute('aria-hidden','true');filters.append(indicator);
    const buttons=[];let selected='all';
    [{label:words.all,topic:'all'},...groups].forEach(g=>{const b=document.createElement('button');b.type='button';b.textContent=g.label;b.dataset.topic=g.topic;b.setAttribute('aria-pressed',String(g.topic==='all'));filters.append(b);buttons.push(b);b.addEventListener('click',()=>{selected=g.topic;apply();const url=new URL(location.href);if(selected==='all')url.searchParams.delete('topic');else url.searchParams.set('topic',selected);history.replaceState(null,'',url);});});
    const search=document.createElement('input');search.type='search';search.className='reader-search';search.placeholder=words.search;search.setAttribute('aria-label',words.search);search.addEventListener('input',()=>apply());
    const count=document.createElement('p');count.className='reader-count';count.setAttribute('role','status');count.setAttribute('aria-live','polite');
    const empty=document.createElement('div');empty.className='reader-empty';empty.textContent=words.empty;empty.hidden=true;
    const savedFilter=document.createElement('button');savedFilter.type='button';savedFilter.className='saved-filter';savedFilter.textContent=en?'Saved stories':'我的收藏';savedFilter.setAttribute('aria-pressed','false');savedFilter.addEventListener('click',()=>{bookmarkOnly=!bookmarkOnly;savedFilter.setAttribute('aria-pressed',String(bookmarkOnly));apply();});controlRow.append(filters,search,savedFilter);tools.append(info,controlRow,count);root.prepend(tools);root.append(empty);
    const top=document.createElement('a');top.href='#main';top.className='back-top';top.textContent='↑ '+words.top;root.append(top);
    const initial=new URLSearchParams(location.search).get('topic');if(groups.some(g=>g.topic===initial)) selected=initial;
    function moveIndicator(){const b=buttons.find(x=>x.dataset.topic===selected);if(!b)return;indicator.style.width=b.offsetWidth+'px';indicator.style.transform=`translateX(${b.offsetLeft}px)`;}
    function apply(){const term=search.value.trim().toLocaleLowerCase();let visible=0;
      groups.forEach(g=>{let n=0;g.cards.forEach(c=>{const show=(selected==='all'||g.topic===selected)&&(!bookmarkOnly||c.querySelector('.save-story').getAttribute('aria-pressed')==='true')&&(!term||c.textContent.toLocaleLowerCase().includes(term));c.hidden=!show;if(show){n++;visible++;}});g.section.hidden=n===0;});
      buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic===selected)));
      count.textContent=en?`${visible} of ${cards.length} stories`:`正在阅读 ${visible} / ${cards.length} 条新闻`;
      empty.textContent=bookmarkOnly?(en?'Save stories using the + button on each card. Your bookmarks stay in this browser.':'点击新闻卡片的「稍后阅读」即可收藏。收藏保存在当前浏览器中。'):words.empty;empty.hidden=visible!==0;requestAnimationFrame(moveIndicator);
    }
    addEventListener('resize',moveIndicator,{passive:true});
    // Direct story links always reveal their category, including links copied from a filtered view.
    function revealHash(){const id=decodeURIComponent(location.hash.slice(1));const target=cards.find(c=>c.id===id);if(!target)return;selected='all';bookmarkOnly=false;savedFilter.setAttribute('aria-pressed','false');search.value='';apply();requestAnimationFrame(()=>target.scrollIntoView({behavior:'instant',block:'start'}));}
    apply();revealHash();addEventListener('hashchange',revealHash);
    // Home reading verbs are ordinary links; their destination works without scripting too.
    const view=new URLSearchParams(location.search).get('view');
    if(view==='context' || view==='sources'){
      root.querySelectorAll('.news-context').forEach(details=>{details.open=true;});
      info.textContent += en
        ? (view==='context' ? ' — Context and references expanded.' : ' — Original sources and references expanded.')
        : (view==='context' ? ' · 已展开本期背景与参考。' : ' · 每篇文末可打开原文，背景中的参考链接也已展开。');
      const destination=view==='context' ? root.querySelector('.news-context summary') : root.querySelector('.original-link');
      if(destination && !location.hash)requestAnimationFrame(()=>{destination.scrollIntoView({behavior:'instant',block:'center'});destination.focus({preventScroll:true});});
    }

  }

  // Soft light follows the pointer; transforms stay small enough to preserve readability.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.latest-sheet,.perspective,.news-card,.issue').forEach(card => {
      let frame=0;let point;
      card.addEventListener('pointermove',event=>{if(reduced.matches)return;point={x:event.clientX,y:event.clientY};if(frame)return;frame=requestAnimationFrame(()=>{frame=0;const r=card.getBoundingClientRect();card.style.setProperty('--light-x',`${point.x-r.left}px`);card.style.setProperty('--light-y',`${point.y-r.top}px`);});},{passive:true});
    });
  }
})();
