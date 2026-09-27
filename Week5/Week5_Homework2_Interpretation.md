# T4400 处理的小鼠转录组 RNA-seq 分析解读

**课程：** Bioinformatics: From Multi-Omics Data to Discovery
**周次：** 第五周 — 转录组学：RNA-Seq 原理与 DESeq2 差异表达分析
**作业：** Homework 2 — 使用 EasyMultiProfiler-Web 进行 RNA-seq 数据分析

---

## 一、数据与分析方法

使用 EasyMultiProfiler-Web 的 `tests` 文件夹中的 `RNAseq_output.csv`（count 矩阵）与 `RNAseq_mapping.csv`（样本分组表）。

数据集包含 **24 个小鼠样本**，采用 **2×3 因子设计**：

- **3 种化学处理**：DMSO（溶剂对照）、T4400、T3976
- **2 种超声条件**：无 / LIPUS（低强度脉冲超声）
- 每组 **4 个生物学重复**，共 6 组 × 4 = 24 个样本

本次分析聚焦 **T4400 与 DMSO 的对比**（每组 n = 4）。

### 预处理

1. **移除全零基因**：平台导入时自动移除在所有 24 个样本中计数均为 0 的 **5,244 个基因**（24,394 → 19,150）
2. **低表达过滤**：保留最大 count ≥ 10 且在至少 6 个样本中检出的基因，最终保留 **14,245 个基因**

### 差异表达分析

使用 **DESeq2** 负二项模型进行差异表达分析。显著性阈值：

- `padj < 0.05`（校正后 p 值，Benjamini-Hochberg）
- `|log2FoldChange| >= 1`（效应量）

**说明**：平台在做 pairwise 对比时自动将数据子集化为 DMSO（n = 4）与 T4400（n = 4）两组共 **8 个样本**，其余实验组不参与本次比较。

---

## 二、差异表达结果

共鉴定出 **237 个显著差异表达基因**，其中：

| 方向 | 数量 |
|---|---|
| 在 T4400 中**上调** | **170** |
| 在 T4400 中**下调** | **67** |
| 显著总数 | **237** |
| 不显著 | 13,174 |

### 显著上调的代表基因（促炎介质）

| 基因 | 功能 |
|---|---|
| `Il6` | 白细胞介素-6，经典促炎细胞因子 |
| `Il1a` | 白细胞介素-1α，促炎细胞因子 |
| `Ccl3` | C-C 趋化因子配体 3（MIP-1α），招募免疫细胞 |
| `P2rx3` | 嘌呤能受体 P2X3，炎症/疼痛信号 |
| `Itgb7` | 整合素 β7，免疫细胞黏附与归巢 |
| `Havcr2` | TIM-3，免疫检查点分子 |

### 显著下调的代表基因

| 基因 | 功能 |
|---|---|
| `Fam198a` | 功能待定 |
| `Ucma` | 上清液软骨基质蛋白 |
| `Mest` | 印记基因，生长调控 |
| `Cdkn1c` | p57Kip2，细胞周期抑制因子 |
| `Stra6` | 视黄酸刺激基因 |

---

## 三、功能富集结果（GSEA，GO-BP）

由于网络环境无法访问 KEGG API（`rest.kegg.jp` 连接失败），改用基于本地 `org.Mm.eg.db` 注释的 **GO 生物学过程（GO-BP）** 基因集富集分析。

**总体结果：200 个富集通路，全部达到 `p.adjust < 0.05`**（绝大多数 p.adjust 在 10⁻⁸ ~ 10⁻⁷ 量级），其中：

| 方向 | 通路数 | NES 范围 |
|---|---|---|
| 在 T4400 中**上调** | **99** | +1.91 ~ **+2.42** |
| 在 T4400 中**下调** | **101** | −1.92 ~ **−2.58** |

> **NES 方向说明**：平台将基因按 log2FoldChange 降序排列，因此负 NES 表示该通路基因在 DMSO（参考组）一侧富集，即在 T4400 中**下调**；正 NES 表示在 T4400 中**上调**。

富集结果呈现**三个主题高度一致的通路簇**：

### 🔴 簇 1：抗菌防御 / 先天免疫 / 急性炎症（**全部上调**）

| 通路 | NES |
|---|---|
| humoral immune response（体液免疫应答） | +2.424 |
| response to bacterium（对细菌的响应） | +2.415 |
| antimicrobial humoral response（抗菌体液应答） | +2.396 |
| defense response to bacterium（对细菌的防御反应） | +2.363 |
| **acute-phase response（急性期反应）** | +2.282 |
| antimicrobial humoral immune response mediated by antimicrobial peptide | +2.276 |
| **response to lipopolysaccharide（对脂多糖的响应）** | +2.215 |
| **acute inflammatory response（急性炎症反应）** | +2.210 |
| positive regulation of inflammatory response | +2.203 |
| response to molecule of bacterial origin | +2.171 |
| cellular response to lipopolysaccharide | +2.171 |
| **tumor necrosis factor production（TNF 产生）** | +2.147 |
| chemokine-mediated signaling pathway | +2.137 |
| complement activation（补体激活） | +2.114 |
| monocyte chemotaxis（单核细胞趋化） | +2.111 |
| T cell activation involved in immune response | +2.118 |
| response to type II interferon | +1.955 |
| interleukin-1 production | +1.927 |

这一簇在**上调通路中占据了绝大部分**，构成一个清晰的"抗菌—炎症—细胞因子"程序。

### 🔵 簇 2：细胞周期 / 有丝分裂 / DNA 复制（**全部下调**）

| 通路 | NES |
|---|---|
| mitotic sister chromatid segregation（有丝分裂姐妹染色单体分离） | **−2.576** |
| chromosome segregation（染色体分离） | −2.510 |
| sister chromatid segregation（姐妹染色单体分离） | −2.485 |
| nuclear chromosome segregation（核染色体分离） | −2.478 |
| mitotic spindle organization（有丝分裂纺锤体组装） | −2.432 |
| microtubule cytoskeleton organization involved in mitosis | −2.422 |
| **DNA-templated DNA replication（DNA 复制）** | −2.415 |
| attachment of spindle microtubules to kinetochore | −2.402 |
| metaphase chromosome alignment（中期染色体排列） | −2.382 |
| negative regulation of mitotic nuclear division | −2.375 |
| DNA replication initiation（DNA 复制起始） | −2.364 |
| spindle assembly checkpoint signaling（纺锤体检查点信号） | −2.321 |
| nuclear division（核分裂） | −2.243 |
| meiotic cell cycle（减数分裂细胞周期） | −2.028 |
| homologous recombination（同源重组） | −1.947 |

### 🟡 簇 3：线粒体能量代谢 与 肌肉收缩结构（**下调**）

| 通路 | NES |
|---|---|
| proton motive force-driven mitochondrial ATP synthesis | −2.020 |
| ATP synthesis coupled electron transport | −1.999 |
| mitochondrial ATP synthesis coupled electron transport | −1.999 |
| **aerobic electron transport chain（需氧电子传递链）** | −1.963 |
| myofibril assembly（肌原纤维组装） | −2.355 |
| sarcomere organization（肌节组装） | −2.252 |
| striated muscle cell development（横纹肌细胞发育） | −2.083 |
| actin-myosin filament sliding（肌动蛋白-肌球蛋白丝滑动） | −1.998 |
| muscle cell development（肌细胞发育） | −1.971 |

---

## 四、生物学意义

T4400 处理呈现出**多重、方向明确的转录重编程**：

### 1. 激活抗菌 / 先天免疫与急性炎症程序（最强信号）

上调通路中 NES 最高的一批全部指向**细菌成分识别与急性炎症**：对细菌的响应、对**脂多糖（LPS）**的响应、抗菌体液应答、**急性期反应**、**急性炎症反应**、TNF 与 IL-1 产生、补体激活、II 型干扰素响应。

同时，基因水平上 `Il6`、`Il1a`、`Ccl3`（趋化因子）显著上调，与通路水平结果完全一致。整体转录特征**类似于细菌内毒素（LPS）刺激所诱导的炎症反应**。

### 2. 抑制细胞增殖（第二强信号）

染色体分离、姐妹染色单体分离、纺锤体组装、动粒附着、纺锤体检查点、DNA 复制起始与延伸、同源重组等相关通路**协同下调**，且覆盖了细胞周期从复制到分离的多个环节。这提示 T4400 使细胞有丝分裂进程受阻，细胞增殖受到抑制。

### 3. 抑制线粒体能量代谢

需氧电子传递链、ATP 合成偶联电子传递、质子动力势驱动的线粒体 ATP 合成等通路下调。这一变化与增殖抑制相呼应 —— 细胞分裂是高度耗能过程，增殖停滞伴随能量代谢下调在生物学上具有一致性。

### 4. 收缩 / 肌肉结构相关通路下调

肌原纤维组装、肌节组装、横纹肌细胞发育、肌动-肌球蛋白丝滑动等通路下调。由于本次分析未获得该数据集的组织来源信息，这一现象既可解读为肌肉特异性结构的改变，也可能反映**细胞骨架与收缩装置的整体下调**（细胞质分裂相关通路 `positive regulation of cytokinesis` 同样下调，支持后一种可能）。

### 5. 结论的可靠性

**上述结论由两种相互独立的分析路径得出**：

- **基因水平**：单基因差异表达分析（火山图）→ IL-6、IL-1α、CCL3 上调
- **基因集水平**：GSEA 通路富集 → 抗菌/炎症通路上调

两条路径在方向上完全一致，互相印证。综合来看，T4400 的转录效应可概括为：**激活抗菌—炎症免疫程序，同时抑制细胞增殖与线粒体能量代谢**。
