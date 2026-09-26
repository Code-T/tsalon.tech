---
title: 于航谈 WebAssembly 与前端成长：从技术实践到长期积累
summary: 回顾于航在 2022 年 T Chat 中的技术分享与成长访谈，从 WebAssembly 的模块、编译工具和应用案例，到写作、表达与长期能力的积累，并附原片时间码。
type: interview
publishedAt: 2026-09-26
readingMinutes: 9
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
draft: true
allowSingleLocale: true
seo:
  title: 于航谈 WebAssembly 与前端成长｜T Chat 回顾
  description: 回顾于航在 2022 年 T Chat 中对 WebAssembly 工具链、eBay 与 Shopify 实践，以及写作、表达和前端成长的分享；附两段原始视频与对应时间码。
  noindex: true
---
> T Chat 回顾草稿，待校听。本文依据 2022 年录播、当期幻灯片和相关历史资料整理；音频尚未经过人工复核。

在这场 T Chat 中，于航（Jason Yu）带来了两部分内容：WebAssembly 年度分享，以及围绕写作、工作与前端成长的访谈。他当时在 PayPal 从事软件开发，也是《深入浅出 WebAssembly》的作者。[自我介绍，第一段 01:50](https://www.bilibili.com/video/BV1cD4y147QN?t=110)

两段内容有一条相通的线索：技术实践需要理解原理，也需要判断使用条件；个人成长则需要把持续积累与具体机会结合起来。以下按主题回顾，所有技术状态和工作经历均保留在 2022 年的语境中。

## 从一个加法函数理解 WebAssembly

分享先以 JavaScript 的执行流程为背景，再进入 WebAssembly 的模块与调用方式。一个简单的加法函数贯穿了 WAT 文本表示、C++ 代码、Emscripten 编译工具链和浏览器端调用：先获得模块的二进制内容，再实例化模块，最后调用它导出的函数。[第一段 17:00–29:40](https://www.bilibili.com/video/BV1cD4y147QN?t=1020)

这个例子把抽象概念拆成了可以逐步理解的环节。与函数计算不同，文件访问等能力还涉及运行模块的宿主环境。理解一项技术，不能只停在它能生成什么文件，还需要知道它怎样接收输入、使用外部能力和返回结果。[第一段 22:30–24:50](https://www.bilibili.com/video/BV1cD4y147QN?t=1350)

分享也区分了将程序编译为 WebAssembly，与先将解释器等运行时编译过去、再通过运行时执行程序的路径。语言出现在同一个生态中，背后的实现方式和成本未必相同。[第一段 30:00–34:00](https://www.bilibili.com/video/BV1cD4y147QN?t=1800)

## 案例里的价值：复用与组合

在 eBay 的网页条码扫描案例中，WebAssembly 的作用包括复用已有的原生代码。分享中的架构图展示了 ZBar、自有库与 JavaScript 库通过不同 Worker 协作的方案。eBay 的原始工程文章说明，这是商品 UPC 条码扫描场景，最终方案组合了不同识别实现，而不是仅靠替换一种编程语言解决问题。[第一段 40:30–44:10](https://www.bilibili.com/video/BV1cD4y147QN?t=2430)；[eBay 原始案例](https://innovation.ebayinc.com/stories/webassembly-at-ebay-a-real-world-use-case/)

Shopify 的案例把讨论带到浏览器之外。分享用 AssemblyScript、WebAssembly 模块与 Lucet 执行服务的示意图，解释可编程业务逻辑如何进入平台的执行流程。Shopify 在 2020 年的工程文章中也介绍了这套方案，重点涉及不受信代码的执行边界、宿主接口、性能与语言选择。[第一段 44:10–49:00](https://www.bilibili.com/video/BV1cD4y147QN?t=2650)；[Shopify 当年的说明](https://shopify.engineering/shopify-webassembly)

这两个案例呈现的，是技术与已有系统如何配合。它们既不是所有场景的性能保证，也不意味着引入 WebAssembly 就完成了安全设计。

谈到新的前端方案时，于航还把学习成本、团队能力和后续维护放进了讨论。技术能否运行，与团队能否持续维护，是选型时需要同时考虑的问题。[第一段 38:20–40:10](https://www.bilibili.com/video/BV1cD4y147QN?t=2300)

分享后半段继续介绍 WASI（WebAssembly System Interface）及当时的生态进展，结尾则回到结合业务与团队情况选择使用的建议。[第一段 59:50–64:40](https://www.bilibili.com/video/BV1cD4y147QN?t=3590)；[第一段 71:30–72:20](https://www.bilibili.com/video/BV1cD4y147QN?t=4290)

## 从博客到书：先弄清楚，再讲清楚

第二段访谈从职业经历展开。于航回顾了早期接触编程、自建网站以及进入 Web 开发工作的过程。主持人关注其中的关键选择，他的回答也保留了偶然经历与实际环境的影响：方向往往是在持续尝试中逐渐形成的。[第二段 00:00–10:00](https://www.bilibili.com/video/BV1J841187sH?t=0)

谈到《深入浅出 WebAssembly》时，他把写作的困难落在两个具体问题上：书面向谁，以及怎样把自己理解的内容组织成读者能够进入的结构。从博客积累走向一本书，需要重新安排知识之间的关系。[第二段 10:00–12:30](https://www.bilibili.com/video/BV1J841187sH?t=600)

内容的准确性同样需要投入。访谈提到社区提问、与相关开发者交流、阅读规范和编写实验等方式；得到回答后，仍要确认自己的理解和表达是否成立。写作在这里既是知识输出，也是重新检验理解的过程。[第二段 12:30–15:10](https://www.bilibili.com/video/BV1J841187sH?t=750)

这本书的准确名称也能与于航在 2020 年亲自撰写的课程开篇词相互印证。该文介绍了他从技术研究走向写作、再开设《WebAssembly 入门课》的经历。[于航的课程开篇词](https://time.geekbang.org/column/article/282984)

## 表达能力可以从小处练起

对于写作与分享，访谈给出的起点并不复杂：观察别人怎样组织内容，从一个小知识点开始写清楚，再通过反复阅读与修改调整结构。知识点是什么、与哪些背景有关、能够解决或引出什么问题，都可以成为组织内容的线索。[第二段 16:00–18:40](https://www.bilibili.com/video/BV1J841187sH?t=960)

分享也可以从人数较少的场合和熟悉的主题开始。随着对内容越来越熟悉，再逐渐把完整讲稿变成关键点。日常会议里能否向同事说明自己的想法，也是在练习同一种表达能力。[第二段 18:40–21:40](https://www.bilibili.com/video/BV1J841187sH?t=1120)

工作之外的兴趣则让对话轻松下来。面对程序员的刻板印象，讨论回到了具体的人：技术工作之外可以有不同的爱好，个人兴趣与技术能力没有必要被简单捆绑。[第二段 21:40–25:40](https://www.bilibili.com/video/BV1J841187sH?t=1300)

## 先了解工作环境，再判断是否适合自己

谈到 PayPal，于航以自己当时的团队体验，讨论了工作生活平衡、文化差异和协作方式，也谈到围绕主营业务决定哪些能力自建、哪些借助外部产品。这是个人对特定工作环境的观察，不能代表所有团队或今天的公司情况。[第二段 25:40–34:40](https://www.bilibili.com/video/BV1J841187sH?t=1540)

后续讨论延伸到职业选择：了解一种环境真实的工作方式，以及自己可能不适应的地方，再作判断。对某家公司或某种职业路径的评价，只能作为了解情况的起点。[第二段 34:40–36:10](https://www.bilibili.com/video/BV1J841187sH?t=2080)

访谈还涉及岗位相关的技术基础、理解问题与表达反馈的能力，以及工作所需的英语读写和沟通。语言与表达都需要持续练习。这些内容适合作为个人准备的参考，而不是现行招聘流程或门槛的说明。[第二段 36:10–41:50](https://www.bilibili.com/video/BV1J841187sH?t=2170)

## 把长期能力落在具体工作中

访谈最后，于航区分了框架某个版本的具体实现，与算法、架构设计和编程方式等可跨项目复用的知识。读源码可以服务于工作问题或个人兴趣；理解其中可以迁移的思路，才能让学习成果离开单一版本或单一框架仍然发挥作用。[第二段 41:50–44:45](https://www.bilibili.com/video/BV1J841187sH?t=2510)

对架构能力的讨论也回到了代码本身：抽象、分层、组件关系、可维护性和可扩展性，都可以从日常功能与项目中练习。训练不必等到拥有某个头衔，或开始负责庞大的系统之后才发生。[第二段 44:45–46:40](https://www.bilibili.com/video/BV1J841187sH?t=2685)

个人能力与组织机会也需要分开看。持续学习和准备是自己能够推进的部分，岗位空间和时机则并非完全由个人决定。访谈把关注点留在了积累能力、理解环境，并在机会出现时做好准备。[第二段 46:40–49:53](https://www.bilibili.com/video/BV1J841187sH?t=2800)

## 观看完整录播

- [技术分享：WebAssembly Annual Report 2022](https://www.bilibili.com/video/BV1cD4y147QN)
- [访谈：于航谈前端专家成长](https://www.bilibili.com/video/BV1J841187sH)

两段时间码分别从各自的视频起点计算。本文为主题回顾，未将机器转录句子作为经校听的直接引语。
