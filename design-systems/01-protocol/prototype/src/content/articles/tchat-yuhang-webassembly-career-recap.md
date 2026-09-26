---
title: 于航谈 WebAssembly 与前端成长：技术回顾与访谈导览
summary: 从 2022 年 T Chat 的加法示例、eBay 条码识别和 Shopify 历史架构，回看 WebAssembly 的实践路径；另附写作、表达与职业成长访谈的主题时间索引，方便对照原片观看。
type: interview
publishedAt: 2026-09-26
readingMinutes: 5
author: editorial-team
topics:
  - WebAssembly
  - Engineering
  - T Chat
relatedEvents: []
cover: /images/talks/tchat-14.jpeg
coverAlt: 于航在 T Chat 分享 WebAssembly 与前端成长的访谈封面
citations:
  - label: 于航技术分享：WebAssembly Annual Report 2022
    url: https://www.bilibili.com/video/BV1cD4y147QN
  - label: 于航谈前端专家成长
    url: https://www.bilibili.com/video/BV1J841187sH
  - label: eBay 原始工程案例
    url: https://innovation.ebayinc.com/stories/webassembly-at-ebay-a-real-world-use-case/
  - label: Shopify 2020 年 WebAssembly 实践
    url: https://shopify.engineering/shopify-webassembly
  - label: 于航的 WebAssembly 入门课开篇词
    url: https://time.geekbang.org/column/article/282984
tldr: []
faq: []
featured: false
draft: false
allowSingleLocale: true
seo:
  title: 于航谈 WebAssembly 与前端成长｜T Chat 回顾
  description: 整理于航在 2022 年 T Chat 中展示的 WebAssembly 加法示例、eBay 条码扫描和 Shopify 历史架构，并提供写作、表达与职业成长访谈的原片时间索引。
  noindex: false
---
> 本文依据 2022 年录播画面与原始资料整理技术回顾，并提供成长访谈的主题索引。访谈索引参考自动转录，未经逐句人工校听；文中问题由编辑整理，具体发言请对照原片。

2022 年，于航（Jason Yu）在 T Chat 带来 WebAssembly 年度分享，并参与围绕写作、工作与前端成长的访谈。当期自我介绍页写明，他在 PayPal 从事软件开发，也是《深入浅出 WebAssembly》的作者。这里保留的是当时的身份与技术背景。[第一段 01:50，自我介绍](https://www.bilibili.com/video/BV1cD4y147QN?t=110)

技术分享适合从一个小例子看起：一个加法函数怎样变成可以被浏览器调用的模块？沿着这条线，再看真实系统为什么引入 WebAssembly，以及它如何与已有代码和平台配合，会比单独记住工具名称更容易理解。

## 从加法函数走到浏览器调用

演示中的加法函数连接了几种不同的表示与工具。在 WAT 文本示例中，函数接收两个整数参数，执行加法，并以 `add` 导出；随后，C++ 示例展示了返回两数之和的函数，配合 Emscripten 构建 WebAssembly 应用。[第一段 18:10，WAT 示例](https://www.bilibili.com/video/BV1cD4y147QN?t=1090)；[22:30，Emscripten](https://www.bilibili.com/video/BV1cD4y147QN?t=1350)；[26:00，C++ 示例](https://www.bilibili.com/video/BV1cD4y147QN?t=1560)

浏览器端的画面展示了接下来的调用步骤：获取模块文件，把响应转换为二进制数据，使用 `WebAssembly.instantiate` 实例化，再通过导出对象调用 `add`。这使模块、加载和函数调用之间的关系变得具体。[第一段 28:40，浏览器端调用](https://www.bilibili.com/video/BV1cD4y147QN?t=1720)

观看这组演示时，可以分别留意编写函数、构建模块和调用模块三个环节。

## eBay：复用代码，也组合不同实现

eBay 案例展示的是网页商品条码扫描。幻灯片中的架构图列出 ZBar、自有库和 JavaScript 库，由不同 Worker 承担识别工作。eBay 的原始工程文章进一步说明了 UPC 条码场景，以及结合多种实现获取识别结果的方案。[第一段 41:20，案例架构图](https://www.bilibili.com/video/BV1cD4y147QN?t=2480)；[eBay 原始案例](https://innovation.ebayinc.com/stories/webassembly-at-ebay-a-real-world-use-case/)

这一案例让 WebAssembly 的代码复用价值有了具体对象：已有的原生识别库可以进入网页的工作流程，JavaScript 实现也继续参与其中。值得观察的既有单个库的能力，也有多个实现如何配合完成同一任务。

当期幻灯片标题将场景写成了二维码扫描；这里依据 eBay 原文使用更准确的商品条码表述。

## Shopify：把可编程逻辑放进平台

Shopify 的示意图把讨论带到浏览器之外。图中，开发者一侧的 AssemblyScript 代码形成 WebAssembly 模块，进入 Lucet 执行服务，再与 Shopify 的业务流程连接。示例涉及可编程的优惠逻辑。[第一段 45:00，Shopify 架构图](https://www.bilibili.com/video/BV1cD4y147QN?t=2700)

Shopify 在 2020 年的原始工程文章介绍了这套历史方案：平台需要执行合作方提供的代码，并考虑执行边界、宿主提供的接口以及性能和语言选择。它为理解幻灯片中的各个组成部分提供了背景。[Shopify 当年的说明](https://shopify.engineering/shopify-webassembly)

与 eBay 的网页扫描放在一起看，两个案例关注的问题各有侧重：一个组合已有识别实现，另一个让平台接纳可编程业务逻辑。这些历史设计展示了 WebAssembly 与已有系统配合的不同方式。

## WASI：继续追问模块怎样接入环境

分享后半段出现了 WASI，即 WebAssembly System Interface。相邻幻灯片使用接口在不同操作系统上的实现示意，继续讨论程序与外部环境的连接。[第一段 59:50，WASI](https://www.bilibili.com/video/BV1cD4y147QN?t=3590)；[60:30，接口示意](https://www.bilibili.com/video/BV1cD4y147QN?t=3630)

把这一部分与前面的模块调用和平台案例相连，可以带着一个问题观看：当模块进入不同环境时，哪些能力由模块自身实现，哪些需要环境提供？

## 写作与成长访谈：按问题观看

第二段录播转向个人经历、技术写作、表达与工作环境。下表提供主题导航，以及编辑整理的观看问题。

| 原片位置 | 讨论主题 | 观看时可关注的问题 |
|---|---|---|
| [00:00–10:00](https://www.bilibili.com/video/BV1J841187sH?t=0) | 编程经历与职业方向 | 回顾一段技术经历时，兴趣、尝试与实际环境分别处于什么位置？ |
| [10:00–15:10](https://www.bilibili.com/video/BV1J841187sH?t=600) | 从博客到书、读者定位与内容核实 | 面向读者组织内容，与自己理解一个知识点，有哪些不同？哪些问题需要继续查证？ |
| [16:00–21:40](https://www.bilibili.com/video/BV1J841187sH?t=960) | 写作、技术分享与日常表达 | 一次讲解的内容、顺序和表达方式，可以怎样分别观察？ |
| [21:40–25:40](https://www.bilibili.com/video/BV1J841187sH?t=1300) | 工作之外的兴趣 | 访谈怎样从技术角色转向具体的人与生活？ |
| [25:40–41:50](https://www.bilibili.com/video/BV1J841187sH?t=1540) | 团队环境、职业选择与岗位准备 | 哪些内容属于个人经历，哪些问题还需要向具体团队了解？ |
| [41:50–49:53](https://www.bilibili.com/video/BV1J841187sH?t=2510) | 技术学习、架构与成长机会 | 具体工具的学习、可迁移的知识与组织中的机会，应怎样分开理解？ |

作为延伸阅读，于航在 2020 年撰写的《WebAssembly 入门课》开篇词介绍了《深入浅出 WebAssembly》的写作与课程背景。[于航的课程开篇词](https://time.geekbang.org/column/article/282984)

涉及工作环境与职业选择的片段，宜结合当时背景、提问和回应一起观看。

## 观看完整录播

- [技术分享：WebAssembly Annual Report 2022](https://www.bilibili.com/video/BV1cD4y147QN)
- [访谈：于航谈前端专家成长](https://www.bilibili.com/video/BV1J841187sH)

两段时间码分别从各自视频的起点计算。本文为主题回顾与导览，技术方案和工作经历保留在 2022 年语境中；对话的具体措辞与限定以原片为准。
