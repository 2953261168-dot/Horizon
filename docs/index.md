---
layout: default
title: 每日视野
home: true
---
{% assign zh_posts = site.posts | where: "lang", "zh" %}
{% assign en_posts = site.posts | where: "lang", "en" %}
{% assign latest = zh_posts | first %}
<section class="field-hero" aria-labelledby="field-title">
<div class="field-stage">
  <div class="field-scene" aria-label="手绘建筑观察场景，按住拖动框选可发现新闻分类入口">
    <div class="field-grid" aria-hidden="true"></div><div class="field-sun" aria-hidden="true"></div>
    <div class="field-art"><img src="{{ '/assets/art/heron-architecture.webp' | relative_url }}" alt="细密排线的现代建筑手绘，树木、楼梯与窗格交织" width="2060" height="1037" fetchpriority="high"></div>
    <div class="field-scan" aria-hidden="true"></div><div class="draft-cursor" aria-hidden="true"><i></i><span data-field-coordinate>X 000 / Y 000</span></div>
    <span class="field-corner field-corner-tl" aria-hidden="true">＋</span><span class="field-corner field-corner-tr" aria-hidden="true">＋</span><span class="field-corner field-corner-bl" aria-hidden="true">＋</span><span class="field-corner field-corner-br" aria-hidden="true">＋</span>
    <p class="field-focus"><span>FOCUS / 每日观察</span>世界 · 经济 · 科技<br><small>BEIJING TIME <span data-clock>08:00</span></small></p>
    <p class="field-gesture">[ 拖动框选，发现观察入口 ]</p>
    <a class="field-pin pin-world" href="{% if latest %}{{ latest.url | relative_url }}?topic=world-news{% else %}{{ '/sources' | relative_url }}{% endif %}"><i aria-hidden="true">＋</i><span><small>01 / WORLD</small>全球动态 ↗</span></a>
    <a class="field-pin pin-tech" href="{% if latest %}{{ latest.url | relative_url }}?topic=tech-news{% else %}{{ '/sources' | relative_url }}{% endif %}"><i aria-hidden="true">＋</i><span><small>03 / TECHNOLOGY</small>技术前沿 ↗</span></a>
    <span class="field-plate" aria-hidden="true">PLATE 001 / A CLEARER VIEW · SCROLL TO EXPLORE ↓</span>
  </div>
  <div class="field-heading"><h1 id="field-title"><span class="title-en" lang="en">A CLEARER VIEW.<br>A WIDER WORLD.</span><span class="title-zh">看清世界的每一寸变化。</span></h1><div class="field-description"><p>一份关于世界、经济与科技的早间手记。<br>让新闻回到事情本身，让好奇心继续生长。</p><div class="field-bottom"><span>INDEPENDENT PERSPECTIVE / DAILY</span><a class="draft-button" href="#latest"><span>阅读今日视野</span><span aria-hidden="true">↗</span></a></div></div></div>
</div>
</section>
<div class="origin-band"><span>从出处开始 / SOURCES</span><a href="{{ '/sources' | relative_url }}">BBC</a><a href="{{ '/sources' | relative_url }}">FINANCIAL TIMES</a><a href="{{ '/sources' | relative_url }}">NATURE</a><a href="{{ '/sources' | relative_url }}">MIT</a><a href="{{ '/sources' | relative_url }}">官方机构 ↗</a></div>
<section class="field-manifesto">
  <figure class="manifesto-plate"><img src="{{ '/assets/art/architecture-study.avif' | relative_url }}" width="900" height="1200" loading="lazy" alt="复古手绘建筑研究"><figcaption>STUDY IN PERSPECTIVE / 002</figcaption></figure>
  <div class="manifesto-copy"><p class="draft-label">THE ART OF PAYING ATTENTION / 关注的艺术</p><h2 data-ink-reveal>世界从不缺少声音。<br>我们想留下的，是<br>值得停下来的<span>那一刻。</span></h2><p>在信息的森林里，为重要的事情留一束光。<br>从一则报道，读到事件的来处、背景与影响。</p><a class="draft-link" href="{{ '/sources' | relative_url }}">认识我们的信息来源 <span>↗</span></a></div>
</section>
<section class="reading-ritual gaze-chapter" aria-labelledby="ritual-title">
<div class="ritual-stage gaze-stage">
  <div class="ritual-caption"><span>READ BETWEEN THE LINES</span><span>[ 滚动，走近事情的本来面目 ]</span></div>
  <div class="ritual-copy"><p class="draft-label">ON SEEING / R. W. EMERSON</p><h2 id="ritual-title">眼睛是<span>第一个圆。</span><br>地平线，是第二个。</h2><div class="ritual-steps"><article class="ritual-step"><span>[ 01 / 看见 ]</span><h3>看见。</h3><p>眼前发生的，不只是远方的事。</p></article><article class="ritual-step"><span>[ 02 / 理解 ]</span><h3>停留。</h3><p>在细节里，给理解一点时间。</p></article><article class="ritual-step"><span>[ 03 / 追问 ]</span><h3>回望。</h3><p>沿着出处，再看一次世界。</p></article></div></div>
  <div class="drafting-table" aria-hidden="true"><div class="desk-halo"></div><img class="plan plan-one" src="{{ '/assets/art/plan.png' | relative_url }}" width="800" height="600" loading="lazy" alt=""><img class="plan plan-two" src="{{ '/assets/art/plan-detail.png' | relative_url }}" width="800" height="600" loading="lazy" alt=""><div class="desk-note"><span>OBSERVATION / HORIZON</span><strong>THE FIRST CIRCLE</strong><small>EVENT → CONTEXT → SOURCE</small></div><span class="desk-cross cross-a">＋</span><span class="desk-cross cross-b">＋</span></div>
<div class="gaze-eyes natural-gaze" role="img" aria-label="圣母版画中同一张面庞上的双眼，随着继续滚动逐渐显现"><img src="{{ '/assets/art/madonna-eyes.jpg' | relative_url }}" width="1200" height="561" alt="" loading="lazy"><span class="eye-number" aria-hidden="true">T. WOOLNOTH / AFTER C. DOLCI, 1827</span></div><div class="gaze-tears" aria-hidden="true"><i class="pendant pendant-one"></i><i class="pendant pendant-two"></i><i class="pendant pendant-three"></i><span class="tear-thread thread-one"></span></div><div class="gaze-quotation"><p class="quote-original" lang="en">“The eye is the first circle; the horizon which it forms is the second.”</p><a href="https://www.gutenberg.org/files/2944/2944-h/2944-h.htm" target="_blank" rel="noopener noreferrer">CIRCLES, 1841 ↗<small>标题节译，中文为本站自译</small></a></div></div>
</section>
<section class="forest-latest" id="latest" aria-labelledby="latest-title">
  <div class="forest-light" aria-hidden="true"></div><div class="forest-engraving" aria-hidden="true"></div>
  <div class="forest-section-label"><span>THE LATEST EDITION</span><span>每个清晨，重新认识世界。</span></div>
  <div class="forest-latest-grid"><div class="forest-editorial"><p class="draft-label">01 / DAILY PERSPECTIVE</p><h2 id="latest-title">今日<br><span>视野。</span></h2><p>在世界醒来之前，<br>为你留一扇窗。</p></div>
  <article class="forest-edition"><div class="edition-top"><span>HORIZON / 中文简报</span><span class="edition-seal" aria-hidden="true">H</span></div>{% if latest %}<p class="forest-date">{{ latest.date | date: '%Y.%m.%d' }}</p><h3>今天的变化，<br>从这里读起。</h3><p>全球动态、经济脉搏与技术前沿。<br>事件、背景、影响，以及通往原始报道的链接。</p><a class="draft-button" href="{{ latest.url | relative_url }}"><span>打开本期简报</span><span aria-hidden="true">↗</span></a>{% else %}<h3>下一份视野，<br>正在抵达。</h3><p>生成完成后，简报会自动出现在这里。</p>{% endif %}<div class="edition-foot"><span>每日 08:00 / 北京时间</span><span>READ WITH CURIOSITY</span></div></article></div>
  <div class="forest-topics">{% for topic in (1..3) %}{% if topic == 1 %}{% assign name = '全球动态' %}{% assign key = 'world-news' %}{% assign english = 'WORLD & SOCIETY' %}{% elsif topic == 2 %}{% assign name = '经济脉搏' %}{% assign key = 'finance-news' %}{% assign english = 'ECONOMY & POLICY' %}{% else %}{% assign name = '技术前沿' %}{% assign key = 'tech-news' %}{% assign english = 'SCIENCE & TECHNOLOGY' %}{% endif %}<a href="{% if latest %}{{ latest.url | relative_url }}?topic={{ key }}{% else %}{{ '/sources' | relative_url }}{% endif %}"><span>0{{ topic }} / {{ english }}</span><strong>{{ name }}</strong><i aria-hidden="true">↗</i></a>{% endfor %}</div>
</section>
<section class="field-archive" id="archive" aria-labelledby="archive-title"><div class="archive-intro"><p class="draft-label">02 / THE DAILY ARCHIVE</p><h2 id="archive-title">时间留下的，<br>不止是<span>昨天。</span></h2><p>每一份简报，都是观察世界的一张底稿。</p></div><div class="archive-ledger">{% for post in zh_posts limit:30 %}<a class="ledger-row" href="{{ post.url | relative_url }}"><span>DAILY BRIEFING / ZH</span><strong>{{ post.date | date: '%Y.%m.%d' }}</strong><span>世界 · 经济 · 科技</span><i aria-hidden="true">↗</i></a>{% else %}<p>存档将随着每日简报，慢慢展开。</p>{% endfor %}<details class="english-editions"><summary>ENGLISH EDITIONS <span aria-hidden="true">＋</span></summary><ul>{% for post in en_posts limit:30 %}<li><a href="{{ post.url | relative_url }}">{{ post.date | date: '%Y.%m.%d' }} — English briefing ↗</a></li>{% else %}<li>No editions yet.</li>{% endfor %}</ul></details></div></section>
<section class="field-closing"><div class="closing-copy"><p class="draft-label">STAY CURIOUS / SEE FURTHER</p><h2>保持好奇，<br>明天继续<span>看见。</span></h2><a class="draft-button" href="{{ '/subscribe' | relative_url }}" data-subscribe><span>订阅每日视野</span><span aria-hidden="true">↗</span></a></div><img src="{{ '/assets/art/heron-landscape.webp' | relative_url }}" width="1704" height="952" loading="lazy" alt="圆拱、阶梯与消失点组成的建筑手绘"><span class="closing-notation" aria-hidden="true">[ 0, 544 ] / PERSPECTIVE IS EVERYTHING</span></section>
