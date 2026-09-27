---
title: 从 ChatGPT Dreaming 看长期记忆：过期、纠错和删除怎么管
summary: OpenAI 的 Dreaming 更新把记忆问题放到数月、数年的使用尺度。本文讨论过期信息、跨会话复用和删除，并以 MemOS 文档为例区分已发布接口与仍在开发中的记忆模块。
type: news
publishedAt: 2026-09-11
readingMinutes: 7
author: editorial-team
topics:
  - AI
  - Agent
cover: /images/articles/dreaming-ai-memory-cover.jpg
coverAlt: ChatGPT Dreaming 与长期记忆管理主题封面
citations:
  - label: OpenAI — ChatGPT memory dreaming
    url: https://openai.com/index/chatgpt-memory-dreaming/
  - label: MemTensor — SegmentFault 公开原文
    url: https://segmentfault.com/a/1190000048267587
  - label: MemOS Cloud 更新日志
    url: https://memos-docs.openmem.net/changelog/
  - label: MemOS 参数记忆模块状态
    url: https://memos-docs.openmem.net/open_source/modules/memories/parametric_memory/
  - label: MemOS Cloud Add Message 元信息
    url: https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/add_message/
  - label: MemOS Cloud 隔离与过滤
    url: https://memos-docs.openmem.net/memos_cloud/introduction/isolation_filters/
featured: true
draft: false
tldr:
  - OpenAI 于 2026 年 6 月 4 日介绍 Dreaming 更新，关注时效性、连续性和相关性。
  - 多年使用需要在信息变化时更新和纠错，不是每年集中整理一次。
  - MemOS Cloud Dream Core 有发布记录；开源参数记忆模块仍标为开发中，不能视为全部设计已可用。
faq:
  - question: 多年记忆意味着每年维护一次吗？
    answer: 不是。多年描述使用跨度；偏好、计划或权限变化时，就应按规则更新、停用或删除相关信息。
  - question: MemOS 三类记忆都已经完整上线吗？
    answer: 不能这样概括。设计涵盖文本、激活和参数记忆，但模块成熟度不同；截至本次核查，参数记忆文档仍标为开发中。
seo:
  title: 从 ChatGPT Dreaming 看长期记忆的更新、纠错与删除
  description: 解释 AI 记忆在多年使用中的时效性、连续性和相关性，并依据 MemOS 文档区分已发布接口、设计目标和开发中模块。
updatedAt: 2026-09-27
---

[OpenAI 于 2026 年 6 月 4 日介绍了 ChatGPT Dreaming 更新](https://openai.com/index/chatgpt-memory-dreaming/)。其早期版本于 2025 年 4 月引入，升级关注过时信息、正确性和长期使用成本。

本文参考 MemTensor 在 [SegmentFault 公开发表的原文](https://segmentfault.com/a/1190000048267587)，由 T Salon 编辑部依据 OpenAI 与 MemOS 文档整理并补充工程边界。MemOS 段落属于厂商公开能力说明，本站未独立验证其效果。

这次升级讨论的并非某一条偏好能否被保存。用户说过“下周去新加坡”，行程结束后，系统应当知道这段计划已经变成过去；用户曾经不吃辣，后来口味发生变化，旧偏好也需要被更新。长期使用下来，系统还要**从大量历史信息中找出当前任务真正需要的部分。**

这里的“年”指跨数月、数年的使用跨度，而不是每年才整理一次。信息变化时，更新和纠错就应发生。系统需要持续合成、更新和调用正确的信息，并让用户与企业能够查看、修正和删除这些信息。

需要跨会话复用信息的 Agent 应考虑这些问题。上下文窗口、RAG 和向量数据库各自承担重要工作，却无法独立覆盖长期记忆的写入、更新、权限、审计与删除。

## 从保存信息到管理状态

早期的 AI 记忆很像一张备忘录。用户说“记住我不吃辣”，系统保存一条偏好；下次推荐餐厅时，再把它放进上下文。这种方式能改善体验，但使用时间拉长后，记忆会遇到更具体的问题。

用户以前不吃辣，现在改了口味，系统应怎样处理旧记录？“我下周去上海”过了一周，系统该把它归档、更新，还是继续当作未来计划？一段对话里既有稳定偏好，也有临时情绪，哪些内容值得长期保存？同一位用户在工作、家庭和不同设备上的信息，哪些可以关联，哪些需要隔离？模型根据上下文推断出的信息，又该怎样标记可信度？

用户提出修改或删除请求时，系统还需要检查相关副本、索引和派生信息。这些工作超出了“多放一些历史文本”的范围。

![640 (3)\_副本.png](/images/articles/dreaming-ai-memory-0.png "640 (3)_副本.png")

企业采购或自建的，最终是一套能够长期运行的记忆系统。它需要回答五个连续的问题：**信息怎样进入记忆，当前任务怎样找回合适的信息，新旧内容怎样更新，错误记忆怎样修正，不再需要的信息怎样删除。**

## Dreaming 指向的三项长期能力

[OpenAI 的说明](https://openai.com/index/chatgpt-memory-dreaming/)将新版 Dreaming 的目标概括为 **freshness、continuity** 和 **relevance**，也就是时效性、连续性与相关性。以下对权限、反馈和调度的展开是本文的工程分析，不是对 OpenAI 内部实现的逐项描述。

时效性处理的是记忆过期的问题。旅行会结束，任务会完成，用户偏好会改变，企业规则也会更新。长期记忆系统需要识别新旧信息之间的关系，对记忆进行更新、降权、归档或遗忘，因此需要保留时间信息、版本关系、反馈入口和生命周期策略。

连续性处理的是跨会话使用的问题。原始对话通常很长，重复内容很多，其中大量信息只在当时有效。把它们全部拼进下一轮上下文，会扩大输入规模，也可能让重要事实被噪音淹没；实际成本还受模型与缓存机制影响。系统需要从原始消息中识别事实、偏好、事件、关系和任务状态，再结合当前场景调用合适的部分。

相关性则处理“此时该用什么”的问题。检索到语义相似的内容，不代表它应当进入当前推理。用户身份、业务场景、时间、权限、任务阶段和信息可信度，都会影响一条记忆是否适合被调用。长期记忆需要检索能力，也需要调度机制。

## MemOS Cloud：已发布接口与具体范围

[MemOS 更新日志](https://memos-docs.openmem.net/changelog/)在 2026 年 5 月 21 日记录了 Cloud Dream Core：Fine Mode 写入可生成 context nodes，Dream 阶段进行上下文绑定与摘要并留下 Dream diary，检索可按配置召回这些节点。这是 MemOS Cloud 的产品能力，不能因为名称相近就认为它与 OpenAI Dreaming 是同一实现。

Cloud 的写入、检索、反馈与删除接口，可以把记忆维护变成明确的应用操作。[Add Message 文档](https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/add_message/)还说明了 `info` 等元信息字段。来源、标签和应用提供的核查结果有助于后续检索与排查，但存入字段本身不代表系统已验证其真实性。

权限也需要单独处理。[隔离与过滤文档](https://memos-docs.openmem.net/memos_cloud/introduction/isolation_filters/)区分项目、用户和 Agent 范围；`conversation_id` 用于会话相关性，不承担强制隔离。元信息和标签不能自动替代服务端授权规则。

本文按 2026 年 9 月 26 日公开文档说明这些入口，未做端到端效果或访问控制测试。应用仍需核对更新结果、删除范围及自身保存的副本。

## 记忆设计与模块成熟度要分开看

MemOS 的设计涵盖文本记忆、激活记忆和参数记忆。文本记录便于查看、修订和溯源；激活记忆关注推理过程中的复用；参数记忆关注训练后形成的能力。这是对不同形态的设计划分，不意味着所有形态都能以相同方式删除或相互转换。

截至本次核查，[参数记忆模块文档](https://memos-docs.openmem.net/open_source/modules/memories/parametric_memory/)仍标为开发中，并说明处于设计与原型阶段。不能把三类记忆的完整转换和治理当作 Cloud 已交付的统一功能；选型应逐项核对模块、版本与部署形式。

上下文窗口承载当次推理输入；RAG 可以从文档、工具知识或历史记忆中检索材料；向量和图数据库可提供存储与查询。上层应用仍需决定哪些信息保存、何时适用以及谁可以使用。并非每个场景都需要全部记忆形态。

## 企业 Agent 的记忆规则各不相同

个人产品与企业 Agent 面对的约束不同。游戏行业、AI NPC 更关注角色设定、共同经历与关系演进；企业知识管理与办公协同更关注跨会话任务延续、项目上下文和权限边界；端侧智能硬件需要兼顾跨设备连续性和本地隐私；AI 客服需要连接不同渠道的服务历史；金融和工业场景则更关注权限、来源、审计、私有化与数据删除。

云服务、自托管与端侧部署的数据边界不同，具体能力和交付条件应逐项核对，不能只按一个产品名称推断。

不同业务也不需要采用同一套记忆策略。统一的基础设施可以提供治理边界，让应用按自身数据、任务和合规要求选择生产、调度与存储方式。

## 评价长期记忆，不能只看召回率

传统检索系统常用召回率衡量效果。长期记忆进入产品后，还需要同时观察连续性、时效性、相关性、可控性与运行效率。

连续性关注跨会话后能否延续真正有价值的历史；时效性关注过期计划和变化后的偏好能否及时更新；相关性关注系统是否只在合适的任务中调用合适的记忆；可控性关注用户和企业能否查看、修正、删除并约束记忆；运行效率则要考察使用时间和用户规模增长后，记忆加工与调用能否控制延迟、Token 和存储成本。

一次成功记起用户生日的演示，无法覆盖数月后的状态变化、多用户隔离和大规模并发。长期智能依赖的是一套可以持续处理这些问题的机制。

## 用结果检查更新是否生效

以前面的旅行计划为例，验收可以检查：行程取消后，后续推荐是否仍把它当作未来计划；偏好纠正后，旧说法是否再次出现；删除后，相关摘要和应用副本是否按各自规则处理。

这些是编辑部建议的检查场景，不是本站实测结果。它们把“长期记忆可靠”转成可以观察的问题，也避免只用一次成功召回证明多年使用效果。
