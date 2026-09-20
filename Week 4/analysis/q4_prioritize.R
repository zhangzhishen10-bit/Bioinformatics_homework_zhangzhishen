#!/usr/bin/env Rscript
# =============================================================================
# Week 4 Homework - Question 4: AI-assisted variant prioritization
# Dataset: ../data/variants_q4.tsv  (SYNTHETIC teaching table - not clinical data)
# -----------------------------------------------------------------------------
# This is MY filtering logic, defined BEFORE asking AI (see report, Q4 part 1).
# Every threshold is explicit and every filter reports how many variants it drops,
# so the audit trail is reproducible.
#
# Run:  Rscript q4_prioritize.R
# =============================================================================

suppressPackageStartupMessages({
  library(readr)
  library(dplyr)
})

VARIANTS  <- file.path("..", "data", "variants_q4.tsv")
OUT_DIR   <- "q4_out"
dir.create(OUT_DIR, showWarnings = FALSE)

log_con <- file(file.path(OUT_DIR, "q4_run_log.txt"), open = "wt")
on.exit(close(log_con), add = TRUE)
say <- function(...) {
  m <- paste0(...); cat(m, "\n"); writeLines(m, log_con)
}

say("=== Q4 variant prioritization log ===")
say("run at        : ", format(Sys.time(), "%Y-%m-%d %H:%M:%S"))
say("R version     : ", R.version.string)
say("input         : ", VARIANTS)
say("WARNING       : teaching synthetics - NOT clinical data, NOT a diagnosis.")
say("")

## ---- 0. Load ---------------------------------------------------------------
# Comment lines start with '#', skipped by readr's comment argument.
v <- read_tsv(VARIANTS, comment = "#", show_col_types = FALSE)
say("variants loaded: ", nrow(v))
say("columns        : ", paste(names(v), collapse = ", "))
say("")

## ---- 1. Preserve the raw file (guardrail from the lecture) ------------------
write_tsv(v, file.path(OUT_DIR, "variants_raw_copy.tsv"))

## ---- 2. MY FILTERS, DECLARED BEFORE CODING ---------------------------------
# Hard excludes: technical quality that makes the call untrustworthy.
MIN_DP  <- 20      # <20x: allele balance and genotype call unreliable
MIN_GQ  <- 30      # <30: ~1 in 1000 chance the genotype is wrong (Phred)
MAX_AF  <- 0.01    # >1% population AF: too common for a rare Mendelian phenotype
REQUIRE_PASS <- TRUE

# Consequence classes I treat as potentially impactful for a coding/regulatory phenotype
IMPACT <- c("splice_acceptor_variant", "splice_donor_variant",
            "stop_gained", "frameshift_variant",
            "start_lost", "missense_variant")

# ClinVar-style labels I will NOT discard automatically (soft, not hard)
ACTIONABLE_CLINVAR <- c("Pathogenic", "Likely_pathogenic",
                        "Conflicting_interpretations_of_pathogenicity",
                        "Uncertain_significance")

## ---- 3. Apply filters one at a time, counting the loss ---------------------
steps <- list()
track <- v
add_step <- function(label, keep) {
  steps[[length(steps) + 1]] <<- data.frame(
    step = label, before = nrow(track), after = sum(keep),
    dropped = nrow(track) - sum(keep)
  )
  track <<- track[keep, , drop = FALSE]
}

add_step("FILTER == PASS",            if (REQUIRE_PASS) track$FILTER == "PASS" else rep(TRUE, nrow(track)))
add_step(paste0("DP >= ", MIN_DP),    track$DP >= MIN_DP)
add_step(paste0("GQ >= ", MIN_GQ),    track$GQ >= MIN_GQ)
add_step(paste0("AF <= ", MAX_AF),    track$AF <= MAX_AF)
add_step("impactful CONSEQUENCE",     track$CONSEQUENCE %in% IMPACT)

filter_report <- do.call(rbind, steps)
say("--- Filter cascade (each row shows variants remaining) ---")
say(paste(capture.output(print(filter_report, row.names = FALSE)), collapse = "\n"))
say("")
say("variants surviving all hard filters: ", nrow(track))
say("")

## ---- 4. Rank the survivors -------------------------------------------------
# Rank by a transparent, auditable score - not a black box.
clinvar_rank <- c(
  "Pathogenic"                                   = 5,
  "Likely_pathogenic"                            = 4,
  "Conflicting_interpretations_of_pathogenicity" = 3,
  "Uncertain_significance"                       = 2,
  "Likely_benign"                                = 1,
  "Benign"                                       = 0
)
cons_rank <- c(
  "splice_acceptor_variant" = 5,
  "splice_donor_variant"    = 5,
  "frameshift_variant"      = 4,
  "stop_gained"             = 4,
  "start_lost"              = 4,
  "missense_variant"        = 2
)

ranked <- track %>%
  mutate(
    clinvar_score = ifelse(CLINVAR_SIG %in% names(clinvar_rank),
                           clinvar_rank[CLINVAR_SIG], 0),
    consequence_score = ifelse(CONSEQUENCE %in% names(cons_rank),
                               cons_rank[CONSEQUENCE], 0),
    # rarity term: 3 for AF<1e-4, 2 for <1e-3, 1 otherwise (all already <=1%)
    rarity_score = ifelse(AF < 1e-4, 3, ifelse(AF < 1e-3, 2, 1)),
    # quality term: 2 for DP>=50 & GQ>=90, 1 otherwise
    quality_score = ifelse(DP >= 50 & GQ >= 90, 2, 1),
    total_score = clinvar_score + consequence_score + rarity_score + quality_score
  ) %>%
  arrange(desc(total_score), AF)

say("--- Ranked shortlist (transparent additive score) ---")
say(paste(capture.output(
  print(as.data.frame(ranked[, c("GENE", "CHROM", "POS", "CONSEQUENCE",
                                 "CLINVAR_SIG", "AF", "DP", "GQ", "total_score")]),
        row.names = FALSE)), collapse = "\n"))
say("")

## ---- 5. What did the hard filters remove, and why? ------------------------
removed <- v[!v$GENE %in% ranked$GENE | !v$POS %in% ranked$POS, ]
removed <- anti_join(v, ranked, by = c("CHROM", "POS", "REF", "ALT"))
say("--- Variants excluded by hard filters (", nrow(removed), ") ---")
for (i in seq_len(nrow(removed))) {
  r <- removed[i, ]
  reasons <- c(
    if (r$FILTER != "PASS") paste0("FILTER=", r$FILTER) else NULL,
    if (r$DP < MIN_DP)      paste0("DP=", r$DP, "<", MIN_DP) else NULL,
    if (r$GQ < MIN_GQ)      paste0("GQ=", r$GQ, "<", MIN_GQ) else NULL,
    if (r$AF > MAX_AF)      paste0("AF=", r$AF, ">", MAX_AF) else NULL,
    if (!r$CONSEQUENCE %in% IMPACT) paste0("consequence=", r$CONSEQUENCE) else NULL
  )
  say(sprintf("  %-7s %-11s %-28s -> %s", r$GENE, r$CONSEQUENCE,
              paste(reasons, collapse = "; "), r$NOTE))
}
say("")

## ---- 6. Top picks ----------------------------------------------------------
top <- head(ranked, 2)
say("--- TOP PICKS ---")
for (i in seq_len(nrow(top))) {
  r <- top[i, ]
  say(sprintf("%d. %s %s:%s %s>%s  [%s | %s | AF=%s | DP=%d | GQ=%d] score=%d",
              i, r$GENE, r$CHROM, r$POS, r$REF, r$ALT,
              r$CONSEQUENCE, r$CLINVAR_SIG, r$AF, r$DP, r$GQ, r$total_score))
}
say("")

## ---- 7. Sensitivity: does the top pick survive a stricter filter? ---------
say("--- Sensitivity check: tighten AF to 1e-4 and DP to 30 ---")
# NOTE: operator precedence - `CONSEQUENCE %in% IMPACT & FILTER == "PASS"` would
# bind as `%in%`(CONSEQUENCE, IMPACT & FILTER == "PASS"), so every condition is
# explicitly parenthesised here.
strict <- v %>%
  filter((FILTER == "PASS") & (DP >= 30) & (GQ >= 30) &
         (AF <= 1e-4) & (CONSEQUENCE %in% IMPACT))
say("variants surviving strict filters: ", nrow(strict))
if (nrow(strict)) {
  say(paste(capture.output(print(as.data.frame(strict[, c("GENE", "CONSEQUENCE", "CLINVAR_SIG", "AF")]),
                                row.names = FALSE)), collapse = "\n"))
}
say("")

## ---- 8. Outputs ------------------------------------------------------------
write_tsv(as.data.frame(ranked), file.path(OUT_DIR, "q4_ranked_shortlist.tsv"))
write_tsv(as.data.frame(removed), file.path(OUT_DIR, "q4_excluded.tsv"))
write_tsv(filter_report, file.path(OUT_DIR, "q4_filter_cascade.tsv"))
writeLines(capture.output(sessionInfo()), file.path(OUT_DIR, "sessionInfo.txt"))
say("--- outputs written to ", OUT_DIR, " ---")
say(paste(" ", list.files(OUT_DIR), collapse = "\n"))
say("")
say("REMINDER: synthetic teaching data. Result is a prioritization exercise,")
say("not a clinical interpretation.")
