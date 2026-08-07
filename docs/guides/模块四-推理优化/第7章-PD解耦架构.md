---
title: "第7章：Prefill/Decode 解耦架构"
description: "理解 P/D 混合 Batching 的问题、DistServe/Splitwise 等解耦方案、KV Cache 传输、Goodput 与 SLO 感知调度"
pubDate: 2026-04-16
category: "inference-optimization"
order: 36
tags: ["P/D解耦", "DistServe", "Splitwise", "KV Cache传输", "Goodput", "SLO"]
---

## 本章简介

Prefill 和 Decode 的计算特性截然不同（Compute Bound vs Memory Bound），混在一起会互相干扰。本章深入解耦架构的设计与挑战，并落到 vLLM 的 Disaggregated Prefill 能力。

**混合 Batching 的问题**定量分析 Prefill 对 Decode 的干扰：Decode P95 TPOT 可被拖慢 3-5 倍。

**解耦架构设计**覆盖 DistServe（OSDI'24，系统化论证 P/D 解耦）、Splitwise（ISCA'24，分配到不同 GPU 池）、TaiChi（聚合与解耦统一框架）和 MLC Microserving（跨引擎编排）。

**KV Cache 传输与 Connector**深入解耦架构最核心的工程挑战：Prefill 节点算出的 KV Cache 如何高效搬到 Decode 节点。介绍 vLLM 的 KV Connector 抽象、NIXL/NCCL 等传输后端，以及跨节点带宽对整体延迟的影响。

**Goodput 与 SLO 感知调度**强调 Raw QPS 不等于用户体验，Goodput（满足 SLO 的有效吞吐）才是真正的优化目标。

**解耦架构的挑战**包括调度器复杂度、P/D GPU 池的资源配比推导，以及何时该用/不该用解耦。

**vLLM Disaggregated Prefill 实战**：用 vLLM 的解耦部署构造混合负载，量化 P/D 互扰程度并推导给定工作负载下的 P/D GPU 池配比。

## 本章小节

- **7.1 混合 Batching 的问题**：Prefill 对 Decode 的定量干扰分析
- **7.2 解耦架构设计**：DistServe、Splitwise、TaiChi、Microserving
- **7.3 KV Cache 传输与 Connector**：KV Connector、NIXL/NCCL、带宽压力
- **7.4 Goodput 与 SLO 感知调度**：以有效吞吐为优化目标
- **7.5 解耦架构的挑战与配比**：调度复杂度、P/D GPU 池配比
- **7.6 vLLM Disaggregated Prefill 实战**：解耦部署与互扰量化

## 📝 学习提示

- 本章逻辑链：7.1 证明“有问题”（干扰）→ 7.2 给出方案（解耦）→ 7.3 解决工程命脉（KV 传输）→ 7.4 重定义目标（Goodput）→ 7.5 算清代价（配比）→ 7.6 完整验证。建议按序阅读。
- 7.1 的干扰机制与 7.3 的传输账是本章的计算核心：口算 KV/token 体积和传输时间，量级感会帮你在选型时快速判断。
- 7.4 的 Goodput 视角贯穿全章，读 7.2 的 DistServe 时请对照“goodput ≠ raw throughput”这条主线。
- 7.6 的实战流程（基线→解耦→量化→配比）可直接作为你评估生产负载的模板。
- 本节命令基于 vLLM v0.26.0（Disaggregated Prefill 为 experimental 特性），参数可能随版本变化，以官方文档为准。
