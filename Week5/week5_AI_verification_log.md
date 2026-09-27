# 第五周：AI 使用验证日志

## 一、使用的 AI 提示词（原文保留）

1. 「我在工作区中上传了一个叫 xielab2017 Bioinformatics_SUAT_2026_FALL main Week 5
   的文件夹……请你阅读后告诉我第五周的作业要怎么完成」
   —— 用于理解作业要求与提交标准

2. 「错误于 library(ggrepel): 不存在叫'ggrepel'这个名称的程序包」
   —— 排查依赖包缺失

3. 「错误于 setwd(dirname(getActiveDocumentContext()$path)): 无法改变工作目录」
   —— 排查工作目录设置失败

4. 「错误于 vst(dds, blind = FALSE): less than 'nsub' rows,
   it is recommended to use varianceStabilizingTransformation directly」
   —— 排查方差稳定变换报错

5. 「前面你说到很多可以写进 week5_interpretation.md 里的，你帮我做一个统合」
   —— 统合解读要点

## 二、AI 生成或提供的内容

- 对 Starter.R 各代码块功能的逐段解释（导入、验证、因子设置、建模、过滤、拟合、
  提取、作图、保存）
- 三个运行错误的诊断与修复方案
- 基于 PCA 坐标数据的质控结论（PC1 两组均值 ±6.83、各批次均值接近 0）
- 解读文档 `week5_interpretation.md` 的要点统合

## 三、我独立验证的内容

1. **数据完整性**：`stopifnot()` 全部通过；非负整数检查、行列数一致检查均通过。
2. **样本身份与顺序**：`identical(colnames(counts), rownames(coldata))` 返回 TRUE，
   确认计数矩阵列名与元数据行名完全一致且顺序相同。
3. **系数名与比较方向**：实际运行 `resultsNames(dds)`，输出第 4 项为
   `condition_treated_vs_control`，与代码中的 `target_coef` 一致；同时 `results()`
   中使用 `contrast = c("condition", "treated", "control")` 显式指定方向，不依赖系数顺序。
4. **包函数与参数**：核对 `DESeqDataSetFromMatrix()`、`DESeq()`、
   `lfcShrink(type = "apeglm")`、`plotPCA(returnData = TRUE)` 的调用参数与官方文档一致。
5. **统计阈值**：确认 `significant` 列同时使用 `padj < 0.05`（校正后 p 值）
   与 `abs(log2FoldChange) >= 1`（效应量）两个条件。
6. **收缩行为验证**：对比 `res` 与 `res_shrunk`，确认 `pvalue` 与 `padj` 完全一致、
   仅 `log2FoldChange` 发生变化，证明 apeglm 只收缩效应量而不改变显著性。
7. **结果自洽性**：36（上调）+ 24（下调）+ 929（不显著）= 989，与预过滤后基因数一致。

## 四、修订记录（AI 建议的错误修正）

| 报错 | 原因 | 处理方式 |
|---|---|---|
| `library(ggrepel)` 报「不存在叫 'ggrepel' 这个名称的程序包」 | `ggrepel` 不属于 tidyverse 核心包，需单独安装 | 执行 `install.packages("ggrepel")` 后重新加载 |
| `setwd(dirname(getActiveDocumentContext()$path))` 报「无法改变工作目录」 | 该写法依赖 RStudio 的活动文档上下文，当前环境无法取得路径 | 注释掉该行，改为写死路径 `setwd("C:/workspace_ds/.../for_student")`，并用 `getwd()` 与 `list.files()` 验证工作目录正确 |
| `vst()` 报 `less than 'nsub' rows` | 预过滤后基因数为 989，少于 `vst()` 默认的 `nsub = 1000`，无法完成子采样拟合 | 改用 `varianceStabilizingTransformation()`，该函数使用全部基因拟合，适用于小数据集；其返回对象同为 `DESeqTransform`，后续 `plotPCA()` 代码无需修改 |

## 五、结论

所有 AI 提供的建议均在本地实际运行验证。遇到的三个错误都已定位原因并完成修正，
修正后的脚本可完整复现全部结果。