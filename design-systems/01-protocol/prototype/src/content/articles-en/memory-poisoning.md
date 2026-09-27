---
title: "Memory Poisoning: How Untrusted Information Persists Across Agent Tasks"
summary: Prompt injection can lead to memory poisoning when manipulated content is stored and reused. We distinguish malicious poisoning from accidental contamination and outline six checks for agents that retain information across tasks.
type: news
publishedAt: 2026-09-01
readingMinutes: 5
author: editorial-team
topics:
  - AI
  - Agent
  - Security
cover: /images/articles/memory-poisoning-cover.jpg
coverAlt: Memory poisoning and long-term controls for agents
citations:
  - label: Forcepoint X-Labs — Persistent Memory Poisoning in AI Agents
    url: https://www.forcepoint.com/blog/x-labs/persistent-memory-poisoning-ai-agents
  - label: Public SegmentFault article cited by the original edition
    url: https://segmentfault.com/a/1190000048255404
  - label: MemOS Cloud — Add Message
    url: https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/add_message/
  - label: MemOS Cloud — isolation and filters
    url: https://memos-docs.openmem.net/memos_cloud/introduction/isolation_filters/
  - label: MemOS changelog
    url: https://memos-docs.openmem.net/changelog/
featured: true
draft: false
translationOf: memory-poisoning
translationStatus: reviewed
tldr:
  - Prompt injection can lead to persistent memory poisoning; content may be written during an interaction and reused in later tasks.
  - Malicious poisoning differs from accidental extraction or summarization errors, although some controls are shared.
  - The six checks are editorial recommendations. Memory APIs and private deployment do not automatically establish effective protection.
faq:
  - question: Does a deletion API prove that cleanup is complete?
    answer: No. Check related summaries, caches and copies, retest retrieval and trace affected tasks according to the system’s retention rules.
  - question: Must a small application buy a full security platform?
    answer: "This article makes no such requirement. Match controls to write scope and action risk: establish who can write, how to suspend errors and which tasks reused them, then integrate existing authorization and monitoring."
seo:
  title: "Memory Poisoning Across Agent Tasks: Six Practical Checks"
  description: How prompt injection can reach persistent memory, how poisoning differs from accidental contamination, and six checks for source, scope, correction and monitoring.
updatedAt: 2026-09-27
---

[Forcepoint X-Labs’ August 4, 2026 proof of concept](https://www.forcepoint.com/blog/x-labs/persistent-memory-poisoning-ai-agents) examines indirect prompt injection into persistent agent memory. This article draws on that research and a [related SegmentFault discussion](https://segmentfault.com/a/1190000048255404). The recommendations are editorial analysis; we have not reproduced the attack or security-tested MemOS.

*Correction, September 26, 2026: prompt injection is not limited to the current interaction, and poisoned memory need not be written after a session ends. The two can form one attack chain. Accidental contamination and product protection claims are also clarified.*

Imagine a fake contact on a web page being saved as a trusted supplier. A later procurement task might retrieve it, and other agents might reuse it. This is an illustrative scenario, not a customer incident reported here.

We use “memory poisoning” for deliberate manipulation of persistent memory, and “memory contamination” for accidental extraction errors, omitted context or unchecked inferences. Some responses overlap, but a data-quality failure is not necessarily an attack.

## How untrusted information persists

Prompt injection attempts to change how an agent handles untrusted input, such as instructions embedded in pages, emails or tool results. If that content enters persistent memory, its influence may carry into later tasks.

Poisoned content may be written during an interaction or later memory processing. Memory poisoning emphasizes the contaminated persistent state and its reuse; it is not a mutually exclusive stage that begins only after prompt injection ends.

For example, a forged contact on a web page may be recorded as a trusted supplier, and an anomalous operation may be summarized as reusable experience. Malicious instructions may also be written as user preferences and spread through task summaries, shared memory, or cross-Agent collaboration.

For a long-running Agent, the risk keeps propagating along the memory lifecycle.

| Stage | Questions to watch | Common controls |
| --- | --- | --- |
| Input | Where the information comes from, and how trustworthy it is | Source tagging, content classification, input validation |
| Write | Who can let information into memory | Write permission, policy checks, manual approval |
| Persistence | Whether the information can be traced later | Source, time, operator, version, validity period |
| Recall | Whether the current task should see it | Identity and scope checks, freshness, reranking, confidence thresholds |
| Action | Whether the Agent will execute high-risk operations based on it | Least privilege, critical-action confirmation, tool-call monitoring |
| Propagation | Whether erroneous information enters other Agents or business domains | Provenance tagging, cross-domain limits, tracing and batch cleanup |

## Six editorial checks

These questions organize the memory lifecycle; they are not a certification standard. Systems sharing memory across tenants or taking consequential actions need stronger controls than a personal preference store.

1. **Source.** Distinguish user statements, documents, pages, tool results and model summaries, retaining the supporting record.
2. **Writing.** Define who may add or change a memory, what may be saved automatically and what needs checking.
3. **Updating.** Distinguish supplementation, correction, replacement and conflict so stale records do not remain current facts.
4. **Scope.** Define what tenants, users, agents and projects can read, modify or share.
5. **Response.** Locate and suspend a bad record, then trace derived summaries, caches and copies.
6. **Monitoring.** Connect writes, retrieval, feedback and deletion to actual tasks so affected results can be identified.

## Which MemOS operations can support a response

MemOS Cloud exposes write, search, feedback and deletion operations. Its [write documentation](https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/add_message/) and [scope documentation](https://memos-docs.openmem.net/memos_cloud/introduction/isolation_filters/) describe storing selected information with metadata and retrieving within relevant identity and task scopes. Feedback and deletion provide correction entry points. They do not establish automatic poisoning detection, complete removal of every derived record or prevention of recurrence.

Applications still need authorization, input validation, approval and monitoring appropriate to their risks. Larger deployments may integrate existing security operations tools, but no particular commercial product category is a prerequisite for every application.

In the supplier example, a response can suspend the record, trace tasks that retrieved it, then inspect related summaries and copies. Completion depends on subsequent retrieval no longer returning the false information, derived records being handled and any affected business actions being reviewed. A successful deletion request alone does not answer all of these questions.

## Different memory layers need different governance

Text memory is usually easier to view, modify, and delete. Activation memory and parametric memory have lower visibility and higher correction costs.

Real systems may also contain caches, knowledge graphs, summaries, Skills, and reusable task states. Before governing, teams should inventory these memory forms and confirm their write sources, retention periods, recall scope, and deletion paths.

Self-hosted or on-device deployment can change data storage boundaries, but cannot replace memory governance. Wrong writes, over-broad authorization, unclear sources, and internal poisoning can also happen in local environments.

## Different industries need different memory rules

Companion products need to focus on persona setting, user control, and sensitive preferences.

Smart devices need to consider multi-user isolation, edge privacy, and memory boundaries between devices.

Finance scenarios care more about policy timeliness, access permissions, and complete audit records.

Industrial scenarios need to distinguish device facts, expert experience, and on-site anomalies, to keep unconfirmed experience from directly affecting operation advice.

Whatever the business, teams should first define four things: which content can be written automatically and which must be approved; which memories can be shared and which must be isolated; how long memories are kept and when they expire; and on receiving correction feedback, whether to update, immediately stop use, or enter manual audit.

## Evaluate outcomes, not just operation counts

Alongside write, retrieval and deletion volume, teams can track the share of unverified memories entering final results, repeated errors after correction, and the time from discovery to completed response. Feedback and deletion rates are not inherently better when higher or lower.

Interpret metrics in context. A batch deletion may reflect a routine retention policy or incident cleanup; the reason matters.

Private deployment changes where data is held but does not automatically resolve incorrect writes or excessive permissions. Evaluation should establish who can write, who can reuse information, whether errors can be suspended and whether affected tasks can be traced.
