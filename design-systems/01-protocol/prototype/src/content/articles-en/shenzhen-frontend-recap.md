---
title: Frontend Engineering in Shenzhen — Five Talks from May 2022
summary: A record of five talks for T Salon’s May 2022 Shenzhen event, including a remote presentation, on frontend observability, Flutter, mini programs, engineering systems and Webpack performance.
type: field-note
publishedAt: 2022-05-10
updatedAt: 2026-09-26
readingMinutes: 8
author: editorial-team
topics:
  - Frontend
  - Flutter
  - Webpack
relatedEvents: []
cover: /images/news/shenzhen-frontend-recap-01.jpg
coverAlt: Developers in the audience at the T Salon frontend engineering event in Shenzhen
citations:
  - label: Original WeChat article in Chinese
    url: https://mp.weixin.qq.com/s/f3ayHlx2JFlxVYXa7ZfR2w
  - label: MPFlutter official project website
    url: https://mpflutter.com/zh/
  - label: Shuyu Guo — Flutter Web talk notes, May 2022 (Chinese)
    url: https://juejin.cn/post/7095294020900880420
featured: true
draft: false
translationOf: shenzhen-frontend-recap
translationStatus: reviewed
seo:
  title: Modern Frontend Engineering in Shenzhen — T Salon
  description: A field report from five talks on frontend observability, Flutter mini programs, engineering systems, Flutter Web and Webpack performance.
  noindex: false
---

On 8 May 2022, T Salon worked with the Lalamove developer community and Zhaopin Executive Search to host “Challenges and Opportunities in Modern Frontend Engineering” in Shenzhen. Five speakers contributed talks on observability systems, cross-platform products, developer tooling and build performance; Yining Lu joined remotely from Shanghai. This record describes the technologies as discussed in May 2022.

## A face-to-face conversation about modern frontend work

The event had been postponed because of the COVID-19 situation in Shenzhen. More than 300 developers registered online and close to 100 joined us in person on a rainy weekend afternoon. The talks mattered, but so did the questions and conversations between them.

## Five speakers, five kinds of practice

### Yining Lu: observability as a product decision

Yining Lu, who led frontend engineering for Lalamove’s driver platform, presented remotely from Shanghai because of the pandemic. She explained why frontend monitoring matters to the business. She compared Sentry, Alibaba Cloud ARMS, Yueying and an in-house system, then described how data collection, log reporting and querying fit together.

![Yining Lu sharing frontend observability practices](/images/news/shenzhen-frontend-recap-02.jpg)

### Minghui Cui: building WeChat mini programs with Flutter

SVGA creator Minghui Cui introduced [MPFlutter](https://mpflutter.com/zh/) and demonstrated how Flutter can be used to build WeChat mini programs. He also addressed bundle size, scrolling performance and asynchronous rendering in Flutter for Web.

![Minghui Cui introducing the MPFlutter architecture](/images/news/shenzhen-frontend-recap-03.jpg)

### Zeya Zhang: engineering systems must fit the team

Zeya Zhang, a frontend engineer on ByteDance’s Feishu team, started with two pressures: growing application complexity and increasing coordination costs. His central point was that engineering systems have no universal silver bullet. Tools and platforms must fit a team’s stage, constraints and most important problem.

![Zeya Zhang discussing frontend engineering systems](/images/news/shenzhen-frontend-recap-04.jpg)

### Shuyu Guo: how Flutter Web builds and renders

Shuyu Guo, author of *Flutter Development in Practice*, traced the evolution of cross-platform frameworks before examining Flutter Web’s build and rendering mechanisms, including platform engines, canvas text drawing and rendering choices. His [written version of the talk](https://juejin.cn/post/7095294020900880420), published on May 8, 2022, preserves the technical detail and discusses Flutter 2.10-era behavior.

![Shuyu Guo’s presentation on Flutter Web](/images/news/shenzhen-frontend-recap-05.jpg)

### Wenjie Fan: finding the real Webpack bottleneck

Wenjie Fan from ByteDance’s games team broke down Webpack’s workflow, performance analysis and common optimization paths. The talk covered a Webpack 4-based mini-program build system, Webpack 5 performance changes and the reasons behind Vite’s speed. It focused on locating the relevant bottleneck rather than copying a configuration checklist.

![Wenjie Fan explaining Webpack performance analysis](/images/news/shenzhen-frontend-recap-06.jpg)

## Beyond the stage

A community event is also made in the spaces between talks: registration, coffee breaks, questions and the discussions that continue after the formal program ends.

![Registration and refreshments at the Shenzhen event](/images/news/shenzhen-frontend-recap-07.png)

![Dinner and community conversations after the talks](/images/news/shenzhen-frontend-recap-08.png)

## Why we keep the record

Events end, but the speakers’ decisions, methods and open questions remain useful. Publishing a durable record lets that work be found, cited and discussed beyond the room in which it first appeared.

## Sources and speaker materials

- [Original May 10, 2022 event report in Chinese](https://mp.weixin.qq.com/s/f3ayHlx2JFlxVYXa7ZfR2w): event context, speaker summaries and photographs.
- [MPFlutter project website](https://mpflutter.com/zh/): the project introduced by Minghui Cui; the current site describes later versions.
- [Shuyu Guo’s Flutter Web talk notes, May 8, 2022](https://juejin.cn/post/7095294020900880420): the written companion to his presentation.
