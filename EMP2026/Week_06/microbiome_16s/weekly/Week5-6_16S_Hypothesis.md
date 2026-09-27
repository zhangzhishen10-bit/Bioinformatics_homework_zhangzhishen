# Week 5/6 作业：16S 微生物组分析 —— 科学假设与参数支持

**数据集：** `16S_level-7.csv`（丰度表）+ `16S_mapping.csv`（样本元数据），来自 EasyMultiProfiler-Web 的 `tests` 文件夹
**分析平台：** EasyMultiProfiler-Web v9.0.4
**实验设计：** 2 种疾病（IBS / UC）× 2 个时间点（治疗前 / 治疗后）× 2 种临床响应（great / poor）

---

## 一、科学假设

> **XYL 干预对肠道菌群的重塑作用具有疾病特异性，且临床疗效不可由治疗前菌群预测。**
>
> 具体而言：
> 1. XYL 干预**显著改变**了溃疡性结肠炎（UC）患者的整体肠道菌群结构，但对肠易激综合征（IBS）患者**无显著影响**；
> 2. **疾病类型**（IBS vs UC）对菌群组成的解释力**远强于**临床响应状态；
> 3. 治疗前的菌群组成**无法区分**响应良好（great）与不佳（poor）的患者。

---

## 二、支持该假设的参数

### 2.1 数据与预处理参数

| 步骤 | 参数 | 结果 |
|---|---|---|
| 导入 | 16S level-7 分类表 + 样本元数据 | 470 taxa × 132 样本 |
| **特征过滤** | MIN MAX COUNT = **10**；MIN DETECT RATE = **0.1**；MIN PREVALENCE = **0.1** | 保留 **132 个 taxa**（移除 338 个） |
| **分类聚合** | COLLAPSE LEVEL = **Genus**；DROP UNASSIGNED = **Yes**；KEEP TOP N TAXA = **40**；NORMALIZE = **None** | 保留 **40 个属** |
| 元数据完整性 | 2 个样本（`K_XYL_F_0009_03`、`K_XYL_F_0035_03`）在丰度表中存在但无分组信息 | 分析中自动排除，**有效样本 130 个** |

### 2.2 Beta 多样性参数

| 项目 | 设置 |
|---|---|
| 距离度量 | **Bray-Curtis** |
| 排序方法 | **PCoA**（主坐标分析） |
| 数据状态 | 原始 counts（未做 rclr 归一化） |
| 统计检验 | **PERMANOVA**（`adonis2`），**999 次置换** |
| 分析变量 | `Group`（4 水平：IBS/UC × before/after）、`Group_sub`（8 水平，含 great/poor） |

### 2.3 PERMANOVA 结果（核心证据）

| 对比 | R² | F | **p 值** | 是否支持假设 |
|---|---|---|---|---|
| `Group`（4 组整体） | 0.069 | 3.11 | **0.001** | — |
| `Group_sub`（8 组整体） | 0.101 | 1.95 | **0.001** | — |
| **UC: before vs after** | 0.043 | 2.50 | **0.017** | ✅ **干预改变了 UC 菌群** |
| **IBS: before vs after** | 0.013 | 0.93 | **0.478** | ✅ **对 IBS 无显著影响** |
| **before: IBS vs UC** | 0.045 | 2.94 | **0.004** | ✅ **疾病是主要决定因素** |
| **after: IBS vs UC** | 0.065 | 4.40 | **0.001** | ✅ 同上 |
| baseline: IBS great vs poor | 0.022 | 0.78 | 0.610 | ✅ **无法预测疗效** |
| baseline: UC great vs poor | 0.023 | 0.63 | 0.865 | ✅ 同上 |
| IBS_after: great vs poor | 0.017 | 0.58 | 0.918 | — |
| UC_after: great vs poor | 0.082 | 2.43 | 0.047 | — |

**参数解读：**

- 疾病类型对比的 p 值最低（**0.004 / 0.001**），R² 最高 → **疾病背景是菌群结构的主导因素**
- UC 治疗前后显著（**p = 0.017**），IBS 不显著（**p = 0.478**）→ **干预效应具有疾病特异性**
- 治疗前 great vs poor 完全不显著（**p = 0.610 / 0.865**，R² 仅 2%）→ **基线菌群无预测价值**

### 2.4 Alpha 多样性结果（Shannon）

| 分组 | n | mean ± sd |
|---|---|---|
| IBS_before_great | 18 | 1.4923 ± 0.4326 |
| IBS_before_poor | 18 | **1.6029** ± 0.3592 |
| IBS_after_great | 18 | 1.4859 ± 0.4042 |
| IBS_after_poor | 18 | 1.5236 ± 0.3219 |
| UC_before_great | 16 | 1.4598 ± 0.3900 |
| UC_before_poor | 13 | **1.5518** ± 0.3146 |
| UC_after_great | 16 | 1.3464 ± 0.3743 |
| UC_after_poor | 13 | 1.4271 ± 0.3622 |

**参数解读：** 治疗前 `poor` 组的 Shannon 多样性在两种疾病中**一致地略高**（差值 0.09–0.11），但效应量小（Cohen's d ≈ 0.26–0.27），**不足以支持多样性作为疗效预测指标**。UC 整体多样性低于 IBS，符合 UC 为更严重炎症性疾病的预期。

### 2.5 差异丰度分析结果

| 项目 | 设置 |
|---|---|
| 方法 | **Wilcoxon rank sum exact test** |
| 对比 | **UC_before vs UC_after** |
| 多重检验校正 | **Benjamini-Hochberg (FDR)** |
| 预过滤低计数 | 是 |

**结果：FDR < 0.05 的属 = 0 个；名义 p < 0.05 的属 = 4 个（全部在治疗前更高）**

| 属 | p 值 | FDR | log2FC |
|---|---|---|---|
| `s__caccae`（Bacteroides caccae） | 0.0184 | 0.317 | +2.51 |
| `s__fragilis`（Bacteroides fragilis） | 0.0232 | 0.317 | +1.68 |
| `s__mucilaginosa` | 0.0238 | 0.317 | +1.18 |
| `s__uniformis`（Bacteroides uniformis） | 0.0387 | 0.387 | +0.95 |

**参数解读：** 治疗后下降的主要是**拟杆菌属（Bacteroides）**的若干种。该结果与 PERMANOVA 的整体显著（p = 0.017）方向一致，说明**菌群改变发生在群落整体结构层面，而非由单一菌属驱动** —— 变化分散在多个属，单个属经不起多重检验校正。

---

## 三、结论

上述参数从三个独立层次共同支持本假设：

| 层次 | 关键参数 | 结论 |
|---|---|---|
| **群落结构**（Beta 多样性） | PERMANOVA：UC 前后 p = 0.017；IBS 前后 p = 0.478 | 干预效应具有**疾病特异性** |
| **群落结构**（疾病对比） | PERMANOVA：IBS vs UC p = 0.004 / 0.001 | **疾病类型**是菌群的主导因素 |
| **疗效预测** | PERMANOVA：基线 great vs poor p = 0.610 / 0.865 | 基线菌群**无法预测**临床响应 |
| **多样性**（Alpha） | Shannon 差值 0.09–0.11（小效应） | 多样性不是有效预测指标 |
| **单属差异** | Wilcoxon，FDR 最小 0.317 | 效应为**群落水平**，非单菌驱动 |

**综合结论：** XYL 干预对肠道菌群的作用依赖于疾病背景 —— 它在 UC 中引起可检测的群落结构改变，在 IBS 中则无显著作用；同时，治疗前的菌群组成不携带预测疗效的信息。

---

## 四、局限性

1. **效应量有限**：所有 PERMANOVA 的 R² 仅为 **2%–10%**，说明分组只解释了少量变异，**个体间差异远大于组间差异**
2. **多重比较未校正**：共进行 10 次 PERMANOVA 检验，未做 FDR 校正；`UC before/after`（p = 0.017）与 `UC_after great/poor`（p = 0.047）在多重校正后可能失去显著性
3. **单属差异不显著**：Wilcoxon 检验经 FDR 校正后无显著属（最小 FDR = 0.317），无法定位具体的驱动菌属
4. **样本量有限**：UC 组 n = 29（before 29 / after 29），UC_after 的 great/poor 亚组仅 n = 16 / 13
5. **数据清理**：2 个样本因缺少元数据被排除；仅保留丰度最高的 40 个属，稀有 taxa 的信息未纳入
6. **多样性数值偏低**：Shannon 指数在 1.3–1.6 之间，是因为基于聚合后的 40 个属计算，而非全部 ASV
7. **无法推断因果**：PERMANOVA 与差异丰度均反映**统计关联**，不能证明 XYL 直接导致菌群改变

---

## 五、方法学备注

| 项目 | 说明 |
|---|---|
| 平台 | EasyMultiProfiler-Web v9.0.4 |
| 分析流程 | 数据导入 → 特征过滤 → Genus 聚合 → Alpha 多样性 → PCoA → PERMANOVA → 差异丰度 |
| Beta 多样性 | Bray-Curtis 距离 + PCoA |
| 统计检验 | PERMANOVA（`vegan::adonis2`，999 次置换）；Wilcoxon rank sum |
| 多重检验校正 | Benjamini-Hochberg (FDR) |
| 结果同步 | 已通过平台 Sync 功能提交至 GitHub 仓库 |
