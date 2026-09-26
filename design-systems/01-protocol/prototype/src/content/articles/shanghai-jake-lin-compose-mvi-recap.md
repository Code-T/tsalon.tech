---
title: Jake Lin 谈 Compose 与 MVI：从输入框到双平台状态流
summary: Jake Lin 用一个逐步重构的输入框解释 Compose 的状态与事件，再以钱包创建流程展示 MVI 如何组织异步操作、状态切换和测试，并讨论在 iOS、Android 上复用架构思路的收益与成本。
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-26
readingMinutes: 16
author: editorial-team
topics: [Android, Jetpack Compose, MVI, 软件架构, iOS]
relatedEvents: []
relatedRecordings: [shanghai-mobile-practices]
cover: /images/default-cover.svg
coverAlt: T Salon 上海移动端历史分享通用封面，非嘉宾或现场照片
citations:
  - label: MVI 范式在 Jetpack Compose 上的应用 — Jake Lin
    url: https://www.bilibili.com/video/BV1QT4y1U7U2?p=1
  - label: Android Developers — State and Jetpack Compose
    url: https://developer.android.com/develop/ui/compose/state
  - label: Android Developers — Guide to app architecture
    url: https://developer.android.com/topic/architecture
  - label: Kotlin StateFlow API
    url: https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-state-flow/
tldr: []
faq: []
featured: false
draft: false
allowSingleLocale: true
seo:
  title: Jake Lin 谈 Compose 与 MVI：从输入框到双平台状态流
  description: 回顾 Jake Lin 的 Compose 与 MVI 演示，完整梳理输入框状态提升、UiState 与 Action、单向数据流、输入校验及钱包异步流程，并说明架构取舍和双平台实践边界。
  noindex: false
---

Jake Lin 当时在 REA Group 从事移动产品与研发效能相关工作。他关注架构，不只是为了给代码分类，也为了让不同背景的开发者更容易参与同一个项目，并在引入新 UI 技术时继续理解原有逻辑。

> 本文对应上海“移动端技术实践”录播，稿件发布于 2022 年 3 月 20 日，实际活动日期未据此推定。演示采用当时的 Compose、Kotlin 和 Swift 技术环境；文中的公司经历与团队安排也仅指分享时的情况。

## 统一架构有收益，也会增加成本

Jake 首先谈的是可维护性、复用、扩展和团队沟通。团队变大以后，大家对同一份代码形成稳定预期，能够减少协作和 review 时反复解释“这段逻辑应该放在哪里”的成本。[原片 00:00—01:55](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=0)

他也直接列出代价：分层意味着更多代码和间接调用；响应式编程增加学习成本；带有强约定的框架会限制写法，新成员需要适应，某些新技术也未必容易接入。更一致的代码和更少的自由度，往往来自同一项设计选择。[原片 01:56—03:16](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=116)

他用个人 iOS 示例解释这种取舍。在一个采用 MVVM 的应用中，曾把 UI 换成 SwiftUI 而保留其他层；后来又采用新的并发等机制重写部分实现。技术细节发生变化，但分层思路相近，让精力更多用于理解新能力。这是他的项目经验，并不意味着采用一个架构后就永远无需重构。[原片 03:18—06:37](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=198)

## 名称很多，首先要解决职责和生命周期的问题

面对 MVC、MVP、MVVM 等名称，Jake 把重点放回视图与数据的分离。移动端界面组件受生命周期影响，把大量业务逻辑写在视图里，会让测试、维护和复用更困难。进一步拆分数据访问、Repository 和状态处理，并通过依赖注入连接，有助于单独验证各部分行为。[原片 06:37—08:54](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=397)

分享还比较了当时 Android 文档中从 LiveData、ViewModel 与 Repository 的图示，到 UI、Domain、Data 分层的表达变化。Jake 并不主张为了齐全而强行添加每一层；他在不少应用中并未单设 Domain 层。[原片 08:55—12:02](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=535)

读者也不必把 MVI 名称当作唯一目标。Android 官方架构指南强调职责分离、状态来源与单向数据流，并将 Domain 层作为按复杂度和复用需要选择的部分。[Android 架构指南](https://developer.android.com/topic/architecture)

## Compose：UI 由当前状态决定

Jake 先用可展开卡片说明声明式 UI：点击改变展开状态，组件根据状态决定显示什么。`@Composable` 函数描述界面，状态改变后，相应组合内容得到更新。`remember` 则帮助在重组过程中保留对象，而不是每次都从头创建。[原片 12:03—16:17](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=723)

这里要注意保存范围：`remember` 保留的是当前 Composition 中的值，不等于自动应对配置变化或长期保存数据。状态保存和生命周期仍需按需求设计。[Compose 状态文档](https://developer.android.com/develop/ui/compose/state)

随后他介绍 MVI 的三个词：Model、View、Intent。这里的 Intent 指用户意图或动作，不是用于启动 Activity 等组件的 Android `Intent` 类。他采用的具体实现，是让 ViewModel 向界面提供统一的 `UiState`，界面通过统一的 Action 入口表达操作。[原片 16:19—19:07](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=979)

## 为什么把多个状态流收成一个 UI 状态

搜索页面的例子最能体现问题：结果、加载标记和错误如果独立到达，界面就必须判断先看哪一个，以及它们冲突时怎样显示。逻辑层测得再充分，视图中仍可能出现判断顺序不一致的问题。

Jake 将页面状态表达成加载、结果、错误等明确情形，界面按状态分支渲染。以后新增空结果情形时，也能借助类型和分支检查发现遗漏，而不是在多个布尔判断中寻找合适的位置。[原片 19:08—22:23](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=1148)

这样的检查依赖具体的类型建模与分支写法，不是只把架构命名为 MVI 就会得到。MVVM 也可以使用统一状态；MVI 本身也不能保证每个业务条件都已正确覆盖。分享的价值在于展示一种减少无效状态组合的建模方式。

## 第一步：让输入框和文字共享局部状态

现场从一个新的 Compose 项目开始。Jake 修改生成的问候组件，把原本由参数传入的名字变成组件内的状态，再加入输入框和文本：输入框读取当前值，通过值变化回调更新状态；文本读取同一份状态显示结果。[原片 22:53—27:58](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=1373)

这个最小例子已经能正常交互，却把状态和更新逻辑放在 UI 内部。下一步的问题是，如果更新规则变复杂，怎样在不运行整个界面的情况下测试它？这成为抽出状态持有者的直接理由，而不是为了多写一个类。

## 第二步：把状态和 Action 移到 ViewModel

Jake 建立 ViewModel，定义包含名字的 `UiState`，并在内部维护可更新的状态流。对外只开放读取状态的接口，更新统一经过 Action 处理。示例先定义名字变化的 Action，再演示新增另一个 Action 时，如何检查对应处理分支。[原片 27:59—32:45](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=1679)

处理名字变化时，他基于原有状态创建更新后的副本，保留其他字段，再写回状态流。这使“旧状态经过这个事件变成什么”成为一个明确的测试对象。[原片 32:45—34:07](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=1965)

视频把 `copy` 与通知更新紧密联系，实际机制要更精确：StateFlow 根据相等性合并值，相等的新值不会再次发出。`copy` 是不可变数据建模常用的更新方式，不是通知的特殊开关。对外只读也应由接口类型和封装保证，不能仅凭属性声明为 `val`。[Kotlin StateFlow 文档](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-state-flow/)

## 第三步：界面读取状态，输入只发送事件

回到 Compose，Jake 让界面取得状态持有者，收集其状态流，再把状态字段绑定到组件。输入回调不直接改原来的局部变量，而是发出名字变化的 Action。最终外观与最初示例几乎一样，职责却已经不同。[原片 34:07—37:38](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=2047)

为了展示单向数据流，他在输入回调和 Action 处理处打断点：按下一个字符后，界面并不会绕过状态直接决定最终显示；事件先进入处理逻辑，生成新状态，组件再根据状态更新。可以沿这一条路径逐步检查值在哪里变化。[原片 37:39—40:44](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=2259)

接着他加入只接受数字的规则：处理事件时过滤输入，如果有效值没有变化就保持原状；输入非数字字符时，最终状态不会包含它。校验逻辑集中后，可以直接测试规则，不必把所有情况都放到 UI 自动化里。这个教学例子说明的是控制路径，实际文本编辑仍需考虑输入法等完整交互。[原片 40:45—42:33](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=2445)

Jake 还提到，当时尝试在 SwiftUI 中组织相同输入控制流程时遇到差异。他把它作为继续探索的问题，没有展示一个适用于所有平台和输入组件的通用解决方案。

## 钱包示例：把异步请求也纳入状态转换

后半场用一个闪电网络钱包演示 iOS 与 Android 两套原生实现。UI 分别采用 SwiftUI 和 Compose，状态与异步设施也各用平台语言生态中的实现；相近的是页面流程和状态组织方式，并不是同一份代码无需转换就能运行于两端。[原片 42:33—45:58](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=2553)

创建钱包页面分为表单和备份等状态。表单包含输入内容和加载信息，事件包含字段变化与提交。提交后先进入创建中的状态，发出后台请求；成功后保存相应资料，并切到备份界面。这里展示的是应用流程，不能仅凭 UI 演示判断钱包整体安全性。[原片 46:00—48:47](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=2760)

测试因此可以围绕状态转换展开：给定初始状态与事件，检查中间加载状态和完成后的状态；请求失败时，也应验证对应行为。Jake 把两端 ViewModel 并排展示，说明状态、Action 和处理入口的相似性，让开发者切换平台时仍可沿用理解问题的方式。[原片 48:48—50:50](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=2928)

他同时指出演示尚有差异：Swift 版本已处理失败显示，Android 版本还没有补上。这个缺口也说明，架构相似不等于行为已经对齐；异常路径与用户体验需要逐项完成。[原片 50:51—51:20](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=3051)

## 当时的团队背景与这场分享的落点

结束时，Jake 介绍了团队同时进行 iOS、Android 和部分 BFF 开发的工作方式，以及当时远程协作、学习探索和招聘的安排。这些属于 2022 年分享中的团队情况，不代表现在的岗位或政策。[原片 51:20—53:09](https://www.bilibili.com/video/BV1QT4y1U7U2?p=1&t=3080)

这场演示没有把 MVI 作为消除复杂性的万能答案。它具体展示了如何让状态归属、事件入口和异步结果更容易追踪，并让测试围绕业务转换展开。与此同时，额外分层的成本、平台差异和错误处理，仍然需要开发团队自行承担。
