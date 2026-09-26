---
title: What ChatGPT Dreaming Reveals About Managing Memory Over Years
summary: OpenAI’s Dreaming update puts memory on a months-to-years timescale. We examine freshness, correction and deletion, while distinguishing documented MemOS Cloud operations from modules that remain under development.
type: news
publishedAt: 2026-09-11
readingMinutes: 7
author: editorial-team
topics:
  - AI
  - Agent
cover: /images/articles/dreaming-ai-memory-cover.jpg
coverAlt: ChatGPT Dreaming and long-term memory management
citations:
  - label: OpenAI — ChatGPT memory dreaming
    url: https://openai.com/index/chatgpt-memory-dreaming/
  - label: MemTensor — public SegmentFault article
    url: https://segmentfault.com/a/1190000048267587
  - label: MemOS Cloud changelog
    url: https://memos-docs.openmem.net/changelog/
  - label: MemOS parametric memory module status
    url: https://memos-docs.openmem.net/open_source/modules/memories/parametric_memory/
  - label: MemOS Cloud Add Message metadata
    url: https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/add_message/
  - label: MemOS Cloud isolation and filters
    url: https://memos-docs.openmem.net/memos_cloud/introduction/isolation_filters/
featured: true
draft: false
translationOf: dreaming-ai-memory
translationStatus: reviewed
tldr:
  - OpenAI’s June 4, 2026 Dreaming update focuses on freshness, continuity and relevance.
  - Years describe the usage horizon; changes and corrections should be handled when relevant information changes.
  - MemOS Cloud Dream Core has a release record, while the open-source parametric memory module remains under development.
faq:
  - question: Does managing memory over years mean an annual cleanup?
    answer: No. Years describe the usage horizon. Changes in preferences, plans or permissions should trigger the appropriate update, suspension or deletion.
  - question: Are all three MemOS memory types fully available?
    answer: No such blanket claim follows from the documentation. Its design covers textual, activation and parametric memory, but the parametric module is still marked as under development at this review date.
seo:
  title: "Managing AI Memory Over Years: Lessons from ChatGPT Dreaming"
  description: Examine freshness, continuity, correction and deletion in long-term memory, with clear boundaries between MemOS design goals, Cloud operations and unfinished modules.
updatedAt: 2026-09-26
---

In April 2025, OpenAI introduced an early version of Dreaming to ChatGPT, letting the system reference chat history in the background and continuously organize information about the user. In June this year, OpenAI upgraded the Dreaming architecture, focusing on stale memories, information correctness, and the cost of long-term, large-scale use.

This upgrade is not about whether a single preference can be saved. When a user says "I'm going to Singapore next week," the system should know the plan has become the past once the trip ends. When a user once avoided spicy food but later changes their taste, the old preference needs updating too. Over long-term use, the system must also **find the part of a large history that the current task actually needs.**

The relevant horizon spans months and years, rather than an annual maintenance schedule. Updates and corrections should occur as information changes. Systems must continuously synthesize, update, and recall the right information, and let users and enterprises view, correct, and delete it.

Agents that reuse information across sessions need to address these questions. The context window, RAG, and vector databases each do important work, but none alone covers the write, update, permission, audit, and deletion needs of long-term memory.

## From saving information to managing state

Early AI memory looked like a memo. A user says "remember I don't eat spicy food," and the system saves a preference; next time it recommends a restaurant, it drops that into the context. This improves the experience, but as usage time grows, memory runs into more specific problems.

A user used to avoid spicy food but changed their taste — how should the system handle the old record? "I'm going to Shanghai next week" passes a week — should the system archive it, update it, or keep treating it as a future plan? A conversation mixes stable preferences with temporary moods; which parts are worth keeping long-term? For the same user, which information across work, family, and different devices can be linked, and which must be isolated? And how should information the model infers from context be marked for confidence?

When a user asks to modify or delete something, the system also has to check related copies, indexes, and derived information. That goes well beyond "store a bit more history text."

What enterprises buy or build is, in the end, a memory system that can run long-term. It must answer five consecutive questions: **how information enters memory, how the current task retrieves the right information, how old and new content is updated, how incorrect memories are corrected, and how unneeded information is deleted.**

## The three long-term capabilities Dreaming points to

[OpenAI’s account](https://openai.com/index/chatgpt-memory-dreaming/) describes **freshness, continuity,** and **relevance**. The discussion of permissions, feedback and scheduling below is our engineering analysis, not a list of OpenAI’s internal implementation details.

Freshness handles stale memories. Trips end, tasks complete, user preferences change, and company rules update. A long-term memory system needs to recognize relationships between old and new information, and update, downweight, archive, or forget memories — so it must keep time information, version relationships, feedback entry points, and lifecycle policies.

Continuity handles cross-session use. Raw conversations are usually long, with much repetition, and much of it is only valid at the time. Putting all of it into the next context expands the input and may obscure important facts; actual cost also depends on the model and caching. The system needs to identify facts, preferences, events, relationships, and task states from the raw messages, then call the right parts for the current scenario.

Relevance handles "what to use now." Retrieving semantically similar content does not mean it should enter the current reasoning. The user's identity, business scenario, time, permissions, task stage, and information confidence all affect whether a memory should be recalled. Long-term memory needs retrieval ability and a scheduling mechanism.

## MemOS Cloud: released operations and their scope

The [MemOS changelog](https://memos-docs.openmem.net/changelog/) records Cloud Dream Core on May 21, 2026. Fine Mode writes can create context nodes; the Dream phase binds and summarizes context and records a Dream diary, while search can retrieve nodes according to configuration. This is a MemOS Cloud capability. A similar name does not establish the same implementation as OpenAI Dreaming.

Cloud write, search, feedback and deletion APIs make maintenance explicit application operations. The [Add Message documentation](https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/add_message/) also describes metadata such as `info`. Sources, tags and application-supplied validation results can support retrieval and investigation; storing them does not establish that the service verified their truth.

Permissions require separate treatment. The [isolation and filtering documentation](https://memos-docs.openmem.net/memos_cloud/introduction/isolation_filters/) distinguishes project, user and Agent scopes. `conversation_id` supports session relevance rather than mandatory isolation. Metadata and tags do not automatically replace server-side authorization.

These descriptions reflect public documentation checked on September 26, 2026, not our own end-to-end performance or access-control tests. Applications still need to check update results, deletion scope and copies held elsewhere.

## Separate the memory design from module maturity

MemOS describes textual memory, activation memory and parametric memory. Textual records support inspection, revision and provenance; activation memory concerns reuse during inference; parametric memory concerns capabilities formed through training. This design distinction does not mean each form supports the same deletion or conversion operations. “Textual” describes the representation, not an encryption guarantee.

At this review date, the [parametric memory documentation](https://memos-docs.openmem.net/open_source/modules/memories/parametric_memory/) remains marked as under development and describes a design and prototype stage. The full conversion and governance of all three forms should not be presented as one delivered Cloud capability. Evaluate modules, versions and deployment forms individually.

The context window holds one inference’s input. RAG can retrieve documents, tool knowledge or historical memories; vector and graph databases can provide storage and queries. The application still decides what to retain, when it applies and who may use it. Not every use case needs every memory form.

## Enterprise Agents face different memory rules

Personal products and enterprise Agents face different constraints. The gaming industry and AI NPCs care more about character setting, shared experiences, and relationship evolution; enterprise knowledge management and office collaboration care more about cross-session task continuity, project context, and permission boundaries; on-device intelligent hardware must balance cross-device continuity and local privacy; AI customer service needs to connect service histories across different channels; finance and industrial scenarios care more about permissions, source, audit, private deployment, and data deletion.

Cloud, self-hosted and on-device deployments have different data boundaries. Check capabilities and delivery conditions individually rather than inferring them from a product name.

Different businesses do not need the same memory strategy. A unified infrastructure can provide governance boundaries, letting applications choose production, scheduling, and storage methods according to their own data, tasks, and compliance requirements.

## Evaluating long-term memory is not just about recall rate

Traditional retrieval systems often use recall rate to measure effectiveness. Once long-term memory enters a product, it also needs to observe continuity, freshness, relevance, controllability, and operational efficiency.

Continuity focuses on whether truly valuable history persists across sessions; freshness focuses on whether expired plans and changed preferences are updated in time; relevance focuses on whether the system only calls suitable memories in suitable tasks; controllability focuses on whether users and enterprises can view, correct, delete, and constrain memories; operational efficiency examines whether memory processing and recall can control latency, token, and storage costs as usage time and user scale grow.

A demo that successfully remembers a user's birthday cannot cover state changes months later, multi-user isolation, and large-scale concurrency. Long-term intelligence relies on a mechanism that can continuously handle these problems.

## Check whether the change reached later tasks

For the travel example, an evaluation can ask whether a cancelled trip still appears as a future plan, whether a corrected preference reappears in its old form, and whether deletion is reflected in related summaries and application copies according to their retention rules.

These are editorial evaluation scenarios, not test results from T Salon. They turn long-term reliability into observable questions rather than treating one successful retrieval as evidence of years of reliable use.