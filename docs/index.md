---
layout: default
title: 早间简报
---
{% assign zh_posts = site.posts | where: "lang", "zh" %}
{% assign latest = zh_posts | first %}
<section class="hero" aria-labelledby="hero-title">
  <div><p class="eyebrow">THE MORNING PERSPECTIVE</p><h1 id="hero-title">世界很大，<br>读点重要的。</h1><p class="intro">从国际动态到技术前沿，汇集官方发布与专业报道。让值得关注的信息，成为每天的清晰起点。</p></div>
  <aside class="today"><p class="eyebrow">YOUR DAILY BRIEFING</p>{% if latest %}<p class="issue-date">{{ latest.date | date: '%Y / %m / %d' }} · 最新一期</p><h2>今天，发生了什么？</h2><p>国际 · 财经 · 科技<br>精选事件、背景与原始来源。</p><a class="cta" href="{{ latest.url | relative_url }}">阅读最新简报 ↗</a>{% else %}<h2>新的一天，新的视野。</h2><p>第一期简报将在生成完成后出现在这里。</p>{% endif %}</aside>
</section>
<div class="topics"><div class="topic"><strong>01 / 全球动态</strong><span>国际新闻与公共事务</span></div><div class="topic"><strong>02 / 经济脉搏</strong><span>市场、产业与政策发布</span></div><div class="topic"><strong>03 / 技术前沿</strong><span>AI、工程与科学研究</span></div></div>
<section aria-labelledby="archive-title"><div class="section-top"><h2 id="archive-title">往期简报</h2><span>中文精选 · 按发布日期排列</span></div><ul class="archive">{% for post in zh_posts limit:30 %}<li class="issue"><span class="number">DAILY PERSPECTIVE</span><h3>{{ post.date | date: '%Y.%m.%d' }}</h3><p>用一份简报，连接当天值得关注的变化。</p><a href="{{ post.url | relative_url }}" aria-label="阅读 {{ post.date | date: '%Y年%m月%d日' }} 中文简报">阅读本期 →</a></li>{% else %}<li class="empty">暂无已发布简报。</li>{% endfor %}</ul></section>
<details><summary>English editions / 英文版</summary><ul>{% assign en_posts = site.posts | where: "lang", "en" %}{% for post in en_posts limit:30 %}<li><a href="{{ post.url | relative_url }}">{{ post.date | date: '%Y.%m.%d' }} — English briefing</a></li>{% else %}<li>No editions yet.</li>{% endfor %}</ul></details>
