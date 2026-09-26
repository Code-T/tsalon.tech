---
title: 张涛谈 Android 协程原型：JNI 调度、挂起边界与实现限制
summary: 张涛从线程调度的成本出发，展示一个连接 Java、JNI 与 C++ 的 Android 协程教学原型，说明任务队列、状态流转和挂起恢复，也坦陈语法与 I/O 支持的不足；回顾同时辨清问答中对 Kotlin 协程的误解。
type: field-note
publishedAt: 2026-09-26
updatedAt: 2026-09-26
readingMinutes: 13
author: editorial-team
topics: [Android, C++, Kotlin, 协程]
relatedEvents: []
relatedRecordings: [shanghai-mobile-practices]
cover: /images/default-cover.svg
coverAlt: T Salon 上海移动端历史分享通用封面，非嘉宾或现场照片
citations:
  - label: 基于 C++ 的 Android 协程设计 — 张涛
    url: https://www.bilibili.com/video/BV1da411b7N8?p=1
  - label: Kotlin Coroutines basics
    url: https://kotlinlang.org/docs/coroutines-basics.html
  - label: Kotlin delay API
    url: https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/delay.html
  - label: Kotlin specification — Asynchronous programming with coroutines
    url: https://kotlinlang.org/spec/asynchronous-programming-with-coroutines.html
  - label: C++ working draft — csetjmp synopsis
    url: https://eel.is/c++draft/csetjmp.syn
tldr: []
faq: []
featured: false
draft: false
allowSingleLocale: true
seo:
  title: 张涛谈 Android 协程原型：JNI 调度、挂起边界与实现限制
  description: 回顾张涛的 Android 协程教学原型，覆盖 Java 与 JNI 桥接、原生线程、任务队列、状态流转和未解决的问题，并依据官方资料辨清 Kotlin 协程机制。
  noindex: false
---

张涛这场分享的重点，是亲手做一个协程原型时需要回答哪些问题：任务运行在哪个线程，何时交出执行权，调度器怎样找到下一个任务，又怎样回到之前暂停的位置。

> 本文对应上海“移动端技术实践”录播，稿件发布于 2022 年 3 月 12 日，实际活动日期未据此推定。分享展示的是探索性的教学实现；文末把涉及 Kotlin 的现场问答与其官方机制分别说明。

## 为什么从线程谈起

分享先用做菜的比喻说明并发与并行，再回顾进程、线程、上下文和调度。对开发者而言，创建多个任务容易，控制它们如何等待、切换与协作却需要额外机制。把所有工作交给线程，并不意味着等待、调度和资源占用的问题自动消失。[原片 00:35—08:57](https://www.bilibili.com/video/BV1da411b7N8?p=1&t=35)

张涛希望协程让任务之间的切换更可控，降低某些场景下的调度负担，并减少层层嵌套的异步回调。他关注的收益主要是更有效地组织等待和后续工作，而不是让同一段 CPU 密集计算凭空加速。对任意阻塞调用，协程也不会自动把它变成非阻塞调用。[原片 08:58—12:06](https://www.bilibili.com/video/BV1da411b7N8?p=1&t=538)

这里还应区分两个概念：任务可以在一个线程上交替推进，形成并发；真正同时执行则涉及并行。不能因为协程运行于单线程，就认为它们之间不可能存在状态协调问题。任务在挂起后恢复时，共享状态可能已被其他任务改变。[Kotlin 语言规范](https://kotlinlang.org/spec/asynchronous-programming-with-coroutines.html)

## 先列出需要实现的操作

原型围绕启动、挂起、恢复、等待另一个任务和延迟执行等操作展开。张涛希望任务等待一段时间时，调度器可以先处理别的工作；如果一个任务依赖另一个任务的结果，也能表达这种先后关系。[原片 14:23—16:40](https://www.bilibili.com/video/BV1da411b7N8?p=1&t=863)

这些操作看似只是 API 名称，背后却要回答不同问题：启动需要确定任务归属，挂起需要保存恢复位置，等待需要管理依赖，结束需要处理结果和回收。一个方法叫 `delay` 或 `join`，并不等于它已经具备成熟协程库相同的语义、取消行为和异常处理能力。

## Java、JNI 与原生线程怎样连接

张涛先展示线程封装：上层提供 Java 接口，经 JNI 进入 C++，再借助原生线程设施启动执行，最终回调 Java 侧的任务方法。这一步建立了从 Java 请求到原生执行、再返回 Java 代码的通路。[原片 16:41—19:31](https://www.bilibili.com/video/BV1da411b7N8?p=1&t=1001)

协程 API 建在这条通路上。任务主体和结果处理仍通过 Java 对象及回调表达；创建时可关联当前线程或指定线程，初始化过程则向原生层注册相应对象。它展示了如何跨语言连接调度与业务代码，也暴露出一个限制：调用方式仍然带有回调风格，没有得到直接书写顺序异步代码的体验。[原片 19:31—22:16](https://www.bilibili.com/video/BV1da411b7N8?p=1&t=1171)

## 按线程组织队列，再处理任务状态

在调度层，原型按线程标识管理相应的任务集合。新任务进入队列，调度循环从中取出可运行的工作。张涛用生产与消费的关系解释任务提交和执行，把“加入工作”与“何时执行工作”分开。[原片 22:16—25:45](https://www.bilibili.com/video/BV1da411b7N8?p=1&t=1336)

任务本身有创建、进入挂起过程、等待恢复、恢复运行和结束等阶段。其中一些状态只在切换过程中短暂存在；一个任务也可能多次挂起和恢复。状态不是为了给日志多加几个标签，而是帮助调度器区分“尚未开始”和“已经运行过、需要接着执行”。完成之后还要清理相关资源。

这种分层让原型具有可讲解性：Java 层负责表达任务，JNI 负责跨语言调用，原生层维护线程、队列和执行顺序。不过，视频展示并不等同于对线程安全、异常传播、资源释放或性能的完整验证。

## 真正困难的是挂起点

张涛随后把重点转向暂停与恢复：协程并不是在任意一条指令上都能随意停下。必须有明确的挂起边界，并保存恢复执行所需的信息。[原片 25:46—27:34](https://www.bilibili.com/video/BV1da411b7N8?p=1&t=1546)

演示中的延迟操作，意图是记录当前任务，把执行机会让给其他工作，满足条件后再恢复。讨论队列位置和恢复顺序，是为了说明调度流程。但他也明确提到，自己的实现只支持有限的挂起位置：原生层调用整个 Java 方法时，无法仅凭这一层封装拆分方法内部的任意执行过程。[原片 27:35—29:53](https://www.bilibili.com/video/BV1da411b7N8?p=1&t=1655)

围绕这个限制，他讨论过在更多位置插入调用或改变运行时的设想，同时承认 JNI 调用成本和侵入性。这里需要补充：修改 JVM 并不是支持 Kotlin 挂起函数的必要条件。Kotlin 编译器通过 continuation 与状态机转换保存恢复信息；挂起点与可挂起调用有关，不是每执行一条语句都自动暂停。[Kotlin 语言规范](https://kotlinlang.org/spec/asynchronous-programming-with-coroutines.html)

## 底层设施的选择，以及尚未完成的工作

在底层实现讨论中，张涛比较了不同的上下文切换设施和现成协程库，也提到 C++ 协程支持，最终介绍自己选择 `setjmp` / `longjmp` 的思路。这一段呈现了原型开发的取舍：语言提供的机制、库提供的调度能力、目标平台支持和维护成本，需要分别考察。[原片 31:37—34:47](https://www.bilibili.com/video/BV1da411b7N8?p=1&t=1897)

这类非局部跳转不是可直接套用的完整协程方案。尤其在 C++ 中，自动对象的生命周期与析构有明确约束，不能忽略它们而只保留“保存位置、跳回来”的示意。[C++ 工作草案相关规定](https://eel.is/c++draft/csetjmp.syn)

分享最后列出尚未解决的事情：上层仍需回调，挂起边界受限，以及如何让 I/O 等待与调度配合。他谈到信号等可能方向，但没有交付完整的 I/O 集成方案。这些属于后续探索，而不是原型已经具备的能力。[原片 34:47—37:02](https://www.bilibili.com/video/BV1da411b7N8?p=1&t=2087)

## 问答：这个原型与 Kotlin 协程应怎样比较

现场最后一个实质问题涉及 Kotlin 协程。回答中把 Kotlin 协程理解成线程池的包装，并将挂起和 `delay` 与阻塞执行线程联系起来。这部分解释与 Kotlin 的官方机制不符，不能作为选型或性能判断的依据。[现场问答 37:04—39:19](https://www.bilibili.com/video/BV1da411b7N8?p=1&t=2224)

Kotlin 协程运行在线程之上，由 dispatcher 决定执行安排；多个协程可以在同一个线程上交替推进。挂起协程与阻塞线程是不同的操作，是否并行则取决于调度方式和可用线程等条件。[Kotlin 协程基础](https://kotlinlang.org/docs/coroutines-basics.html)

同样，`kotlinx.coroutines.delay` 的语义是在等待期间不阻塞线程，不能等同于调用 `Thread.sleep`。具体计时机制由相应 dispatcher 的实现处理。[Kotlin delay API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/delay.html)

回到这场分享本身，它提供的是一个拆开调度器、任务状态和跨语言边界的实践案例。原型的限制值得保留，因为这些限制具体展示了从“能够切换任务”走向可用异步运行机制时，还需要解决哪些问题。
