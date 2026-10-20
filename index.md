---
layout: default
title: 每日视野
home: true
---
{% assign zh_posts = site.posts | where: "lang", "zh" %}
{% assign en_posts = site.posts | where: "lang", "en" %}
{% assign latest = zh_posts | first %}
<section class="observatory" aria-labelledby="hero-title">
<div class="observatory-stage">
  <div class="stage-grid" aria-hidden="true"></div>
  <div class="stage-meta"><span>独立视野 / DAILY PERSPECTIVE</span><span>BEIJING TIME <span data-clock>08:00</span></span></div>
  <div class="hero-copy"><p class="eyebrow">A CLEARER VIEW OF A CHANGING WORLD</p><h1 id="hero-title">世界在变。<br>看见<span class="serif">重要的。</span></h1><p class="hero-intro">越过信息的喧嚣，抵达事情的本来面目。<br>一份关于世界、经济与科技的早间简报。</p><a class="action" href="#latest"><span>开始阅读今日视野</span><span class="action-arrow" aria-hidden="true">↗</span></a></div>
  <div class="scene" role="img" aria-label="红日与城市建筑线稿，色彩随滚动变化">
    <div class="solar-motion"><div class="solar-disc"></div></div>
    <div class="architecture-motion"><div class="architecture-pointer">{% include cityscape.svg %}</div></div>
    <span class="scene-cross" aria-hidden="true"></span><span class="scene-coordinates" aria-hidden="true">X <span data-coordinate-x>000</span> / Y <span data-coordinate-y>000</span></span>
    <div class="scene-note" aria-hidden="true"><span>FIG. 001 — THE OBSERVATORY</span><span>移动鼠标，换个角度看世界</span></div>
  </div>
  <div class="hero-after" aria-hidden="true"><span>更少喧嚣。</span><span class="serif">更多看见。</span></div>
  <div class="stage-bottom"><span class="scroll-cue"><i aria-hidden="true"></i> SCROLL TO EXPLORE</span><span>全球动态 / 经济脉搏 / 技术前沿</span><span class="stage-index">01 — 03</span></div>
</div>
</section>
<section class="briefing-section page-width" id="latest" aria-labelledby="latest-title">
  <div class="section-kicker reveal"><span>[ 01 / 今日视野 ]</span><span>每个清晨，重新认识世界。</span></div>
  <div class="latest-grid">
    <div class="latest-title reveal"><h2 id="latest-title">新闻如潮。<br><span class="serif">先读重要的。</span></h2><p>官方发布与专业报道，在这里交汇。<br>为每一次变化，留下出处与背景。</p><a class="text-link" href="{{ '/sources' | relative_url }}">探索我们的信息来源 <span aria-hidden="true">↗</span></a></div>
    <article class="latest-sheet reveal">
      <div class="sheet-top"><span class="status-dot" aria-hidden="true"></span><span>THE LATEST EDITION</span><span>ZH / 中文</span></div>
      {% if latest %}<p class="edition-date">{{ latest.date | date: '%Y.%m.%d' }}</p><h3>今天的变化，<br>从这里读起。</h3><p>事件、背景、影响，以及通往原始报道的链接。</p><a class="action solid" href="{{ latest.url | relative_url }}"><span>打开本期简报</span><span class="action-arrow" aria-hidden="true">↗</span></a>{% else %}<p class="edition-date">COMING INTO VIEW</p><h3>下一份视野，<br>正在抵达。</h3><p>中文简报生成完成后，会自动出现在这里。</p>{% if en_posts.size > 0 %}{% assign latest_en = en_posts | first %}<a class="action solid" href="{{ latest_en.url | relative_url }}"><span>先读最新英文版</span><span class="action-arrow" aria-hidden="true">↗</span></a>{% endif %}{% endif %}
      <div class="sheet-foot"><span>每日 08:00 · 北京时间</span><span>HORIZON ↗</span></div>
    </article>
  </div>
  <div class="perspectives">
    <a class="perspective reveal" href="{% if latest %}{{ latest.url | relative_url }}?topic=world-news{% else %}{{ '/sources' | relative_url }}{% endif %}"><span class="small-index">[ 01 ]</span><h3>全球动态<span>↗</span></h3><p>从国际事件到公共事务，<br>看见彼此相连的世界。</p><span class="micro">WORLD & SOCIETY</span></a>
    <a class="perspective reveal" href="{% if latest %}{{ latest.url | relative_url }}?topic=finance-news{% else %}{{ '/sources' | relative_url }}{% endif %}"><span class="small-index">[ 02 ]</span><h3>经济脉搏<span>↗</span></h3><p>从机构发布到产业变化，<br>理解数字背后的方向。</p><span class="micro">ECONOMY & POLICY</span></a>
    <a class="perspective reveal" href="{% if latest %}{{ latest.url | relative_url }}?topic=tech-news{% else %}{{ '/sources' | relative_url }}{% endif %}"><span class="small-index">[ 03 ]</span><h3>技术前沿<span>↗</span></h3><p>从科学发现到工程实践，<br>观察下一步如何发生。</p><span class="micro">SCIENCE & TECHNOLOGY</span></a>
  </div>
</section>
<section class="atlas-section" aria-labelledby="atlas-title">
  <div class="page-width atlas-top reveal"><p class="eyebrow">A DIFFERENT POINT OF VIEW / 02</p><h2 id="atlas-title">世界的轮廓，<br><span class="serif">藏在细节里。</span></h2><p>把视线放远，也把细节看近。<br>从一条新闻，走向它背后的世界。</p></div>
  <div class="atlas-landscape" aria-hidden="true"><div class="atlas-sun"></div><div class="atlas-drawing">{% include arcade.svg %}</div><span class="atlas-caption">PLATE II / THE HOUSE OF PERSPECTIVES · ORIGINAL LINE STUDY</span></div>
  <div class="atlas-bottom page-width"><span>保持独立。保持好奇。</span><a class="text-link" href="#archive">沿时间继续探索 <span aria-hidden="true">↓</span></a></div>
</section>
<section class="archive-section page-width" id="archive" aria-labelledby="archive-title">
  <div class="section-kicker reveal"><span>[ 02 / 时间存档 ]</span><span>每一天，都有新的视角。</span></div>
  <div class="archive-heading reveal"><h2 id="archive-title">往日，<span class="serif">仍值得回望。</span></h2><span class="micro">THE DAILY ARCHIVE</span></div>
  <ul class="archive">{% for post in zh_posts limit:30 %}<li class="issue reveal"><span class="issue-label">DAILY BRIEFING / ZH</span><a href="{{ post.url | relative_url }}" aria-label="阅读 {{ post.date | date: '%Y年%m月%d日' }} 中文简报"><span>{{ post.date | date: '%Y.%m.%d' }}</span><span class="issue-arrow" aria-hidden="true">↗</span></a><span class="issue-note">世界 · 经济 · 科技</span></li>{% else %}<li class="empty">存档将随着每日简报，慢慢展开。</li>{% endfor %}</ul>
  <details class="english-editions"><summary>ENGLISH EDITIONS <span aria-hidden="true">＋</span></summary><ul>{% for post in en_posts limit:30 %}<li><a href="{{ post.url | relative_url }}">{{ post.date | date: '%Y.%m.%d' }} — English briefing ↗</a></li>{% else %}<li>No editions yet.</li>{% endfor %}</ul></details>
</section>
<section class="closing page-width reveal"><p class="eyebrow">STAY CURIOUS. SEE FURTHER.</p><h2>保持好奇。<br><span class="serif">明天，继续看见。</span></h2><a class="action" href="{{ '/subscribe' | relative_url }}" data-subscribe><span>订阅每日视野</span><span class="action-arrow" aria-hidden="true">↗</span></a><div class="closing-sun" aria-hidden="true"></div></section>
