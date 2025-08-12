# ================================================================
# 1. Load packages & define functions (Run this block first)
# ================================================================

# install.packages(c("vegan","ggplot2","dplyr","tidyr","purrr","readr","patchwork","cowplot"))

suppressPackageStartupMessages({
  library(vegan)
  library(ggplot2)
  library(dplyr)
  library(tidyr)
  library(purrr)
  library(readr)
  if (requireNamespace("patchwork", quietly = TRUE)) library(patchwork)
  if (requireNamespace("cowplot",   quietly = TRUE)) library(cowplot)
})

# ---------- Grid helpers ----------
combine_plots <- function(plot_list, ncol = 3, guides = "collect") {
  stopifnot(length(plot_list) >= 1)
  if (requireNamespace("patchwork", quietly = TRUE)) {
    patchwork::wrap_plots(plot_list, ncol = ncol, guides = guides)
  } else if (requireNamespace("cowplot", quietly = TRUE)) {
    cowplot::plot_grid(plotlist = plot_list, ncol = ncol, align = "hv")
  } else {
    message("Install 'patchwork' or 'cowplot' to combine plots. Returning first plot only.")
    plot_list[[1]]
  }
}
print_plot <- function(p) { print(p); invisible(p) }

# ---------- Utility functions ----------
align_features <- function(df, feature_cols) {
  missing <- setdiff(feature_cols, colnames(df))
  if (length(missing))
    stop("Missing feature columns: ", paste(missing, collapse = ", "))
  df[, feature_cols, drop = FALSE]
}

fit_nmds <- function(X, k = 2, trymax = 500, maxit = 1000) {
  metaMDS(
    X, distance = "bray", k = k, trymax = trymax, maxit = maxit,
    autotransform = FALSE, noshare = FALSE, trace = 1
  )
}

null_stress_curve <- function(X, dims = 1:4, nperm = 500, trymax = 120, maxit = 500, seed = 123) {
  set.seed(seed)
  real <- purrr::map_dfr(dims, function(k) {
    ord <- fit_nmds(X, k = k, trymax = trymax, maxit = maxit)
    tibble(k = k, stress = ord$stress, type = "real")
  })
  null <- purrr::map_dfr(dims, function(k) {
    s <- replicate(nperm, {
      Xnull <- as.data.frame(lapply(X, sample))
      ord <- try(fit_nmds(Xnull, k = k, trymax = trymax, maxit = maxit), silent = TRUE)
      if (inherits(ord, "try-error")) NA_real_ else ord$stress
    })
    tibble(k = k, stress = as.numeric(s), type = "null")
  })
  bind_rows(real, null) |> tidyr::drop_na(stress)
}

plot_stress_curve <- function(stress_df) {
  null_df <- dplyr::filter(stress_df, type == "null") %>% dplyr::mutate(k = factor(k))
  real_df <- dplyr::filter(stress_df, type == "real") %>% dplyr::arrange(k) %>% dplyr::mutate(kf = factor(k))
  ggplot() +
    geom_boxplot(data = null_df, aes(x = k, y = stress),
                 width = 0.55, varwidth = TRUE, fill = "grey80", color = "grey40", outlier.alpha = 0.25) +
    geom_point(data = real_df, aes(x = kf, y = stress), size = 3) +
    geom_line(data = real_df, aes(x = as.numeric(kf), y = stress, group = 1)) +
    labs(x = "Dimensions (k)", y = "Stress",
         title = "NMDS Stress vs Dimensions\nPoints = real; Boxes = null") +
    theme_minimal(base_size = 12)
}

plot_nmds_groups <- function(ord, groups, title = "NMDS (Bray–Curtis)") {
  scr <- as.data.frame(scores(ord, display = "sites"))
  scr$group <- factor(groups)
  ggplot(scr, aes(NMDS1, NMDS2, color = group)) +
    geom_hline(yintercept = 0, linetype = 3, linewidth = 0.2) +
    geom_vline(xintercept = 0, linetype = 3, linewidth = 0.2) +
    stat_ellipse(level = 0.95, alpha = 0.2, type = "norm",
                 aes(fill = group), geom = "polygon", color = NA) +
    geom_point(size = 2.5, alpha = 0.95) +
    coord_equal() +
    scale_color_brewer(palette = "Dark2", name = "Group") +
    scale_fill_brewer(palette  = "Dark2", name = "Group") +
    labs(title = title, x = "NMDS1", y = "NMDS2") +
    theme_minimal(base_size = 12) +
    theme(legend.position = "right")
}

# Reader that accepts CSV *or* TSV; fills Sample/Grouping if missing; orders features
read_new_samples <- function(path, feature_cols) {
  stopifnot(file.exists(path))
  first_line <- readLines(path, n = 1)
  delim <- if (grepl("\t", first_line)) "\t" else ","
  df <- read_delim(path, delim = delim, trim_ws = TRUE, show_col_types = FALSE)
  # Normalize column names (trim spaces only; keep case)
  names(df) <- gsub("^\\s+|\\s+$", "", names(df))
  
  # Ensure Sample column
  if (!"Sample" %in% names(df)) {
    df$Sample <- paste0("NEW_", seq_len(nrow(df)))
  }
  # Ensure Grouping column
  if (!"Grouping" %in% names(df)) {
    df$Grouping <- "NEW"
  }
  # Reorder to put Sample, Grouping first (optional)
  front <- c("Sample", "Grouping")
  rest  <- setdiff(names(df), front)
  df    <- df[, c(front, rest), drop = FALSE]
  
  # Validate required feature columns exist
  missing <- setdiff(feature_cols, names(df))
  if (length(missing)) {
    stop("New file is missing required feature columns: ", paste(missing, collapse = ", "))
  }
  # Keep only features in the trained set and order them identically
  df <- df[, c("Sample", "Grouping", feature_cols), drop = FALSE]
  as.data.frame(df)
}

# ================================================================
# 2. Load data (Run once after starting R session)
# ================================================================
csv_file <- "backend/prediction/data/train/240130-Paper1-present 1633 targets.csv"  # <- change as needed
id_col <- "Sample"
group_col <- "Grouping"

df <- read_csv(csv_file, show_col_types = FALSE)
feature_cols <- setdiff(names(df)[sapply(df, is.numeric)], c(id_col, group_col))
X <- as.data.frame(align_features(df, feature_cols))
rownames(X) <- df[[id_col]]

# ================================================================
# 3. QUICK BROKEN STICK METHOD
# ================================================================
stress_df_quick <- null_stress_curve(X, dims = 1:4, nperm = 20, trymax = 20, maxit = 50, seed = 42)
p_stress_quick <- plot_stress_curve(stress_df_quick)
print(p_stress_quick)
ggsave("stress_vs_k_quick.png", p_stress_quick, width = 6, height = 6, dpi = 300)

# ================================================================
# 4. FINAL NMDS RUN (no vectors)
# ================================================================
k_final <- 2  # set after quick check
ord_final <- fit_nmds(X, k = k_final, trymax = 500, maxit = 1000)

# Save lightweight model for overlays
model <- list(ordination = ord_final, feature_cols = feature_cols)
saveRDS(model, "nmds_model.rds")

# ================================================================
# 5. DISPLAY: all pairwise NMDS axes (points + ellipses only)
# ================================================================
point_size    <- 3
ellipse_alpha <- 0.20
png_size      <- 6
palette_name  <- "Dark2"

scores_df <- as.data.frame(scores(ord_final, display = "sites"))
stopifnot(ncol(scores_df) >= k_final)
colnames(scores_df)[1:k_final] <- paste0("NMDS", 1:k_final)
scores_df$Group <- factor(df[[group_col]])

pairs_list <- utils::combn(k_final, 2, simplify = FALSE)

make_pair_plot <- function(data, ax1, ax2, title_suffix = "") {
  ax1n <- paste0("NMDS", ax1); ax2n <- paste0("NMDS", ax2)
  ellipse_df <- data |>
    dplyr::select(dplyr::all_of(c(ax1n, ax2n, "Group"))) |>
    dplyr::rename(NMDSx = !!ax1n, NMDsy = !!ax2n) |>
    dplyr::group_by(Group) |>
    dplyr::filter(dplyr::n() >= 3) |>
    dplyr::ungroup()
  plot_df <- data |>
    dplyr::select(dplyr::all_of(c(ax1n, ax2n, "Group"))) |>
    dplyr::rename(NMDSx = !!ax1n, NMDsy = !!ax2n)
  ggplot(plot_df, aes(NMDSx, NMDsy, color = Group, fill = Group)) +
    stat_ellipse(data = ellipse_df, geom = "polygon", alpha = ellipse_alpha, color = NA) +
    geom_point(size = point_size, alpha = 0.95) +
    coord_fixed(ratio = 1, expand = FALSE) +
    scale_color_brewer(palette = palette_name, name = "Group") +
    scale_fill_brewer(palette  = palette_name, name = "Group") +
    labs(title = sprintf("NMDS axes %d vs %d (stress=%.3f)%s",
                         ax1, ax2, ord_final$stress, title_suffix),
         x = paste0("NMDS", ax1), y = paste0("NMDS", ax2)) +
    theme_minimal(base_size = 13) +
    theme(legend.position = "right", plot.margin = margin(5,5,5,5), aspect.ratio = 1)
}

pair_plots <- lapply(pairs_list, function(p) make_pair_plot(scores_df, p[1], p[2]))

show_combined <- function(plts) {
  if (requireNamespace("patchwork", quietly = TRUE)) {
    ncol <- min(3, length(plts))
    combined <- Reduce(`+`, plts) + patchwork::plot_layout(ncol = ncol, guides = "collect")
    print(combined); combined
  } else if (requireNamespace("cowplot", quietly = TRUE)) {
    combined <- cowplot::plot_grid(plotlist = plts, ncol = min(3, length(plts)), align = "hv")
    print(combined); combined
  } else {
    message("Install 'patchwork' or 'cowplot' for combined grid. Printing first plot only.")
    print(plts[[1]]); NULL
  }
}
combined_plot <- show_combined(pair_plots)

for (i in seq_along(pairs_list)) {
  p <- pairs_list[[i]]
  fname <- sprintf("nmds_axes_%d_vs_%d.png", p[1], p[2])
  ggsave(fname, pair_plots[[i]], width = png_size, height = png_size, dpi = 300)
}
if (!is.null(combined_plot)) {
  ggsave("nmds_axes_all_pairs.png", combined_plot,
         width = png_size*min(3,length(pair_plots)),
         height = png_size*ceiling(length(pair_plots)/min(3,length(pair_plots))),
         dpi = 300)
}

# ================================================================
# 6. Overlay unlimited new points from file (CSV or TSV) via refit + Procrustes
# ================================================================

# Set your upload path here:
new_data_path <- "backend/prediction/data/test/new_samples.csv"  # can be .csv or .tsv

# Read new rows (auto-detects comma vs tab; auto-fills Sample/Grouping if missing)
new_df <- read_new_samples(new_data_path, feature_cols = model$feature_cols)

# Matrices with same preprocessing as training (no transforms)
X_train <- as.data.frame(X)
X_new   <- as.data.frame(new_df[, model$feature_cols])
rownames(X_new) <- new_df$Sample

# Combine training + new
X_all <- rbind(X_train, X_new)

# Refit NMDS on combined data (seed for reproducibility)
set.seed(42)
ord_all <- metaMDS(X_all, distance = "bray", k = k_final,
                   trymax = 500, maxit = 1000,
                   autotransform = FALSE, noshare = FALSE, trace = 0)

# Procrustes: align using ONLY original samples, then rotate ALL
sc_train_orig <- scores(model$ordination, display = "sites")
sc_all        <- scores(ord_all,          display = "sites")
orig_ids <- rownames(sc_train_orig)
stopifnot(all(orig_ids %in% rownames(sc_all)))

proc <- vegan::procrustes(
  X = sc_train_orig[orig_ids, , drop = FALSE],
  Y = sc_all[orig_ids,        , drop = FALSE],
  scale = TRUE, symmetric = FALSE
)

sc_all_rot <- as.data.frame(predict(proc, sc_all))
colnames(sc_all_rot) <- paste0("NMDS", seq_len(ncol(sc_all_rot)))
aligned_new <- sc_all_rot[rownames(X_new), , drop = FALSE]

# Overlay ONLY the new points on your existing base figure (keeps ellipses/theme/limits)
p12_overlay <- make_pair_plot(scores_df, ax1 = 1, ax2 = 2) +
  geom_point(
    data = transform(aligned_new, NMDSx = NMDS1, NMDsy = NMDS2),
    aes(x = NMDSx, y = NMDsy),
    inherit.aes = FALSE,
    shape = 21, size = 3.6, stroke = 1.1, color = "black", fill = "white"
  ) +
  geom_text(
    data = transform(aligned_new, NMDSx = NMDS1, NMDsy = NMDS2),
    aes(x = NMDSx, y = NMDsy, label = rownames(aligned_new)),
    inherit.aes = FALSE, size = 3, vjust = -0.8
  )

print(p12_overlay)
ggsave("nmds_overlay_procrustes_1v2.png", p12_overlay, width = 6, height = 6, dpi = 300)
