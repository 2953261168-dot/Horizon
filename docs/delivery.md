---
layout: default
title: 早间邮件配置
---

# 每天早上 8 点的简报

发件人与收件人使用 GitHub Secret `HORIZON_EMAIL_ADDRESS`，通过 163 邮箱 SMTP 发送中文简报。

1. 将个人收件邮箱存入仓库 Secret `HORIZON_EMAIL_ADDRESS`，不会在公开配置中出现。
2. 在仓库 **Settings → Secrets and variables → Actions** 设置 `SMTP_PASSWORD` 为 163 邮箱 SMTP 授权码。邮箱需要启用 SMTP 服务；此处不是网页登录密码。
2. 保留已有 `ZHIPU_API_KEY`，用于生成新闻摘要。密钥只保存在 GitHub Secrets 中。
3. 在 **Actions** 启用工作流。复刻仓库的定时任务可能需要手动启用。
4. 手动运行 **Prepare Daily Briefing**，成功后运行 **Send Morning Email**，验证真实收件。失败会在 Actions 显示，不会以发送成功掩盖错误。

每天北京时间 06:30 抓取过去 24 小时的新闻，生成中英双语网页；08:00 单独发送当天中文简报。当天简报缺失时明确失败，不会发送旧日报。手动重跑邮件会再次发送。

GitHub Actions 是尽力调度，整点任务可能延迟，无法保证 08:00 准点到达。如需严格准点，请使用持续运行的服务器调度相同的发送脚本。公开仓库不活跃 60 天后定时工作流可能被自动禁用，需关注 Actions 状态。

来源检查记录见 [信息来源](sources)。官方公告只证明机构的发布内容，不等同于独立核验。
