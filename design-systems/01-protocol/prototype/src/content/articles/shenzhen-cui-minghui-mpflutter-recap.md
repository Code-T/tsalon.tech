---
title: 崔明辉谈 MPFlutter：把 Flutter 布局带到微信小程序
summary: 崔明辉从当时 Flutter Web 的包体、滚动和文本体验问题出发，介绍 MPFlutter 如何序列化布局、映射宿主组件并复用节点信息，也坦陈四端共用代码与原生体验之间的取舍。
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-26
readingMinutes: 8
author: editorial-team
topics: [Flutter, 小程序, 前端, 跨平台]
relatedEvents: []
relatedRecordings: [shenzhen-frontend-challenges]
cover: /images/default-cover.svg
coverAlt: T Salon 深圳前端历史分享通用封面，非嘉宾或现场照片
citations:
  - label: 前端的挑战与机遇 Part 2：使用 Flutter 开发微信小程序 — 崔明辉
    url: https://www.bilibili.com/video/BV1HY4y1r7rJ?p=2
tldr: []
faq: []
featured: false
draft: false
allowSingleLocale: true
seo:
  title: 崔明辉谈 MPFlutter：把 Flutter 布局带到微信小程序
  description: 回顾崔明辉介绍 MPFlutter 的完整技术分享，解释布局序列化、宿主组件映射、增量更新与构建流程，保留历史版本和跨端体验取舍，附原片时间链接。
  noindex: false
---

崔明辉在深圳“前端的挑战与机遇”分享中介绍了自己的开源项目 MPFlutter：沿用 Flutter 的开发方式，尝试把同一套应用带到微信小程序及 Web。出发点不是证明所有平台都应该采用 Flutter，而是已有 Flutter 代码怎样跨过小程序环境的限制。

> 本文对应历史录播第 2 段，所属稿件发布于 2022 年 5 月 9 日。技术表现、平台支持和项目案例均按分享时的版本与经验叙述，不代表相关框架今天的能力边界。

## 问题从哪来：跨平台仍有宿主差异

崔明辉先介绍自己的 iOS 与 Web 开发背景，以及 SVGA 动画库的经历，再把问题限定到微信小程序。Flutter 已能面向多种平台开发，但小程序有自己的运行环境，不能简单把现有 Web 输出当成小程序直接交付。

他当时对 Flutter Web 的主要顾虑包括基础包体、移动端滚动体验，以及 JavaScript 工作与界面更新相互影响。在这些约束下，他希望找到更适合目标环境的渲染路径。片中提到的包体大小和特定设备卡顿，是当时版本及实践观察，不是当前性能基准。[原片 00:01—04:08](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=2&t=1)

## 分开看业务逻辑、布局与宿主呈现

分享用 Flutter 的架构帮助解释方案：开发者用 Dart 描述界面和逻辑，框架承担布局与渲染流程，底层再与平台衔接。迁移到浏览器时，最终仍要选择怎样把这些信息呈现在宿主中。

崔明辉比较了当时的 HTML 与基于 Canvas/WebGL 的呈现路径。前者可能产生频繁样式更新与 JavaScript、DOM 交互；后者又需要处理字体、文本选择、输入和无障碍等浏览器能力的衔接。他把这些列为方案需要面对的问题，并非在声称其中任何一条路径永远不可用。[原片 04:09—08:10](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=2&t=249)

## 关键思路：把已有布局结果交给另一端

MPFlutter 的思路是利用框架已经完成的工作。既然布局和应用逻辑已经在 Flutter 一侧计算，能否把布局信息序列化，再由另一端恢复对应的显示结构？

他提出，不必为 Flutter 丰富的每一种 Widget 都重新实现完整逻辑；宿主呈现真正需要的是节点的位置、宽高，以及文本、图片等内容。把这些信息传到渲染端，就可以建立相应的组件或元素。

这改变了跨端适配的重点：不是在每个宿主重新写一遍业务，而是维护从框架输出到宿主表示的映射。代价也随之转移到序列化、通信、更新和组件适配上。[原片 08:11—10:50](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=2&t=491)

## 序列化与增量更新怎样配合

在具体讲解中，他围绕可复用的 Element 节点组织数据，将相关布局信息序列化为 JSON，再发给渲染端。只要接收端能重建相应位置、尺寸和内容，就可以呈现目标界面。

他特别提到节点复用带来的更新机会：利用节点标识比较变化，做差异更新，减少每次刷新都重复处理相同内容。这里的节点、布局及标识策略属于所介绍实现的设计线索，不宜简化成“Flutter 的任意一棵树直接转成 JSON 就能跨端运行”。[原片 10:50—13:13](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=2&t=650)

## 微信小程序没有浏览器 DOM，怎样接上

小程序宿主并不提供普通浏览器的完整 DOM 环境。崔明辉介绍，通过微信相关的 DOM 适配能力衔接已有操作，再将输出映射到小程序的显示体系。因而方案仍有明确的适配层，并不是把浏览器代码原样放进去。

现场提到的实践案例是“一兜糖”：按他的介绍，团队用 Flutter 开发 iOS、Android、Web 和小程序，尝试由一套代码支持多个端。他也明确承认，相比原生小程序，体验仍有差距；收益在于代码复用和团队投入的统筹。是否值得采用，需要把这种收益与目标端的性能、兼容和交互要求一起衡量。[原片 13:14—15:02](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=2&t=794)

## 构建链路仍以 Dart 与 Flutter 工具为主

最后，他说明项目没有把 webpack 或 TypeScript 当作核心构建起点，而是沿用 Dart 编译到 JavaScript、打包静态资源的路径，并针对输出体积作了精简。代码复用的另一面是工具链维护：适配不仅发生在运行时，也包括编译和资源处理。

他以项目开源、实现与工具链可供查看作结。原片到这里结束，进一步的现场问答未收录在本分段中。[原片 15:02—16:16](https://www.bilibili.com/video/BV1HY4y1r7rJ?p=2&t=902)
