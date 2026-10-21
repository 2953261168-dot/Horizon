"""Table-based, inline-styled daily letter for conservative mail clients."""
from __future__ import annotations
import html
import re
from urllib.parse import urlsplit
from bs4 import BeautifulSoup
import markdown

SITE = 'https://2953261168-dot.github.io/Horizon'

def _safe_fragment(fragment: str) -> str:
    soup = BeautifulSoup(markdown.markdown(html.escape(fragment)), 'html.parser')
    allowed={'p','a','strong','em','ul','ol','li','br','blockquote','code','h1','h2','h3'}
    for tag in list(soup.find_all(True)):
        if tag.name not in allowed:
            tag.unwrap();continue
        href=tag.get('href','');tag.attrs={}
        if tag.name=='a':
            if urlsplit(href).scheme in ('http','https'):
                tag['href']=href;tag['style']='color:#685e3b;text-decoration:underline;'
            else:tag.unwrap();continue
        if tag.name=='p':tag['style']='margin:0 0 13px;font-size:15px;line-height:1.9;color:#414b3a;'
        if tag.name in ('ul','ol'):tag['style']='padding-left:20px;margin:10px 0 15px;line-height:1.8;'
        if tag.name=='blockquote':tag['style']='margin:12px 0;padding-left:15px;border-left:2px solid #a59b70;'
    return str(soup)

def render_daily_letter(summary: str, subject: str, sender: str, footer: str) -> str:
    match=re.search(r'20\d\d-\d\d-\d\d',subject) or re.search(r'^(?:#{1,2}[^\n]*?)?(20\d\d-\d\d-\d\d)',summary)
    date=match.group() if match else ''
    link=f'{SITE}/{date.replace("-","/")}/summary-zh.html' if date else SITE+'/'
    chunks=re.split(r'^###\s+',summary,flags=re.M)
    blocks=[];contents=[];category='今日视野'
    for i,chunk in enumerate(chunks[1:],1):
        heading,_,body=chunk.partition('\n')
        title=re.sub(r'\s*[⭐★].*','',heading).strip()
        m=re.match(r'\[(.*?)\]\((https?://[^\s]+)\)',title)
        title=m.group(1) if m else re.sub(r'[*#]','',title)
        url=html.unescape(m.group(2)) if m else link
        if urlsplit(url).scheme not in ('http','https'):url=link
        # A group heading at the end belongs to the following item, not this card.
        body=re.split(r'^##\s+',body,flags=re.M)[0]
        body=re.sub(r'<a\s+id="[^"]*"\s*></a>','',body)
        body=re.sub(r'^---\s*$','',body,flags=re.M)
        # Keep the main account and the first useful context; the complete edition stays one tap away.
        paragraphs=[p.strip() for p in body.strip().split('\n\n') if p.strip()]
        chosen=[];length=0
        for p in paragraphs:
            if p.startswith(('**标签','**Tags','**「相关','**「参考','**参考','**References')):continue
            if length+len(p)>550 and chosen:break
            if len(p)>600:p=p[:580].rsplit("。",1)[0]+"。"
            chosen.append(p);length+=len(p)
        contents.append(f'<p style="margin:8px 0;font-size:13px;line-height:1.65;color:#535e49;">{i:02d} &nbsp; {html.escape(title)}</p>')
        blocks.append(f'''<tr><td style="padding:0 24px 22px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #b8bba7;background:#f0f0e5;"><tr><td style="padding:23px;"><p style="font:11px Georgia,serif;letter-spacing:2px;color:#7b8069;margin:0 0 15px;">FIELD NOTE / {i:02d}</p><h2 style="font-family:Georgia,SimSun,serif;font-size:23px;line-height:1.55;font-weight:bold;margin:0 0 18px;color:#2e3c2a;">{html.escape(title)}</h2>{_safe_fragment((chr(10)*2).join(chosen))}<p style="margin:20px 0 0;padding-top:15px;border-top:1px solid #c7cab9;"><a href="{html.escape(url,quote=True)}" style="font-size:13px;color:#9d5035;text-decoration:none;">阅读原始报道 ↗</a> &nbsp; <a href="{html.escape(link,quote=True)}" style="font-size:12px;color:#677359;">本期完整背景 →</a></p></td></tr></table></td></tr>''')
    if not blocks:blocks=[f'<tr><td style="padding:28px;">{_safe_fragment(summary)}</td></tr>']
    stats=re.search(r'从\s*[\d,]+\s*条[^\n]+',summary)
    deck=html.escape(stats.group()) if stats else '世界在变化，留一点时间，看清发生了什么。'
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(subject)}</title></head><body style="margin:0;padding:0;background:#dfe3d3;"><div style="display:none;max-height:0;overflow:hidden;">{html.escape(date)} 每日视野 · {deck}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#dfe3d3"><tr><td align="center" style="padding:24px 8px;"><table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;background:#eeeee3;border:1px solid #a7af95;"><tr><td bgcolor="#293b28" style="padding:31px 28px;color:#e7ead8;"><p style="margin:0 0 24px;font-size:10px;letter-spacing:2px;color:#b7c4a4;">THE MORNING EDITION / {html.escape(date)}</p><h1 style="font-family:Impact,Arial,sans-serif;font-size:48px;letter-spacing:-2px;margin:0;line-height:1;">HORIZON<span style="color:#b66b43;">.</span></h1><p style="font-family:Georgia,SimSun,serif;font-size:25px;line-height:1.5;margin:25px 0 15px;">世界很大，<br>从这一页慢慢看起。</p><p style="font-size:12px;line-height:1.8;color:#c0cbb0;margin:0;">{deck}</p><p style="margin:24px 0 0;"><a href="{html.escape(link,quote=True)}" style="display:inline-block;background:#dfdfc8;border:1px solid #d3d8bb;padding:12px 18px;color:#2c3b26;font-size:13px;text-decoration:none;">在网页中阅读本期 ↗</a></p></td></tr><tr><td style="padding:27px 28px 22px;"><p style="font:10px Arial,sans-serif;letter-spacing:2px;color:#81866f;margin:0 0 15px;">IN THIS ISSUE / 本期目录</p>{''.join(contents[:8])}{'<p style="font-size:12px;color:#7a826d;">以及更多值得留意的变化。</p>' if len(contents)>8 else ''}</td></tr>{''.join(blocks)}<tr><td bgcolor="#293b28" style="padding:25px 28px;"><p style="font:18px Georgia,SimSun,serif;color:#d5ddc3;margin:0 0 15px;">保持好奇，明天继续看见。</p><p style="font-size:11px;line-height:1.8;color:#a9ba99;margin:0;">{html.escape(sender)} · 每日 08:00 / 北京时间<br>{html.escape(footer)}</p></td></tr></table></td></tr></table></body></html>'''
