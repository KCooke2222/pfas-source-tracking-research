# ================================================================
# 1. Load packages & define functions (Run this block first)
# ================================================================

# install.packages(c("vegan","ggplot2","dplyr","tidyr","purrr","readr","patchwork","cowplot"))

suppressPackageStartupMessages({
  library(tibble)
  library(jsonlite)
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
    autotransform = FALSE, noshare = FALSE, trace = 0
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
load_data <- function(csv_file, id_col = "Sample", group_col = "Grouping") {
  df <- read_csv(csv_file, show_col_types = FALSE)
  feature_cols <- setdiff(names(df)[sapply(df, is.numeric)], c(id_col, group_col))
  X <- as.data.frame(align_features(df, feature_cols))
  rownames(X) <- df[[id_col]]
  dataset <- list(df = df, X = X, feature_cols = feature_cols, group_col = group_col)
  return(dataset)
}

# ================================================================
# 3. QUICK BROKEN STICK METHOD
# ================================================================
quick_broken_stick <- function(X, dims = 1:4, nperm = 20, trymax = 20, maxit = 50, seed = 42, verbose = FALSE) {
  stress_df <- null_stress_curve(X, dims = dims, nperm = nperm, trymax = trymax, maxit = maxit, seed = seed)
  p_stress  <- plot_stress_curve(stress_df)
  if (verbose) print(p_stress)
  results <- list(stress_df = stress_df, plot = p_stress)
  return(results)
}

# ================================================================
# 4. FINAL NMDS RUN (no vectors)
# ================================================================
final_nmds_model <- function(X, feature_cols, k_final = 2, trymax = 500, maxit = 1000) {
  ord <- fit_nmds(X, k = k_final, trymax = trymax, maxit = maxit)
  model <- list(ordination = ord, feature_cols = feature_cols)
  return(model)
}

# ================================================================
# 5. DISPLAY: all pairwise NMDS axes (points + ellipses only)
# ================================================================
make_pair_plot <- function(data, ax1, ax2,
                           point_size = 3,
                           ellipse_alpha = 0.20,
                           palette_name = "Dark2",
                           stress = NULL,
                           title_suffix = "") {
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
    labs(
      title = if (!is.null(stress))
                sprintf("NMDS axes %d vs %d (stress=%.3f)%s", ax1, ax2, stress, title_suffix)
              else
                sprintf("NMDS axes %d vs %d%s", ax1, ax2, title_suffix),
      x = paste0("NMDS", ax1), y = paste0("NMDS", ax2)
    ) +
    theme_minimal(base_size = 13) +
    theme(legend.position = "right", plot.margin = margin(5,5,5,5), aspect.ratio = 1)
}


nmds_pairplots <- function(ord_final, df, group_col = "Grouping", k_final = 2,
                           point_size = 3, ellipse_alpha = 0.20, palette_name = "Dark2",
                           make_grid = TRUE, verbose = FALSE) {
  scores_df <- as.data.frame(scores(ord_final, display = "sites"))
  stopifnot(ncol(scores_df) >= k_final)
  colnames(scores_df)[1:k_final] <- paste0("NMDS", 1:k_final)
  scores_df$Group <- factor(df[[group_col]])

  pairs <- utils::combn(k_final, 2, simplify = FALSE)

  pair_plots <- lapply(
  pairs,
  function(p) make_pair_plot(
    scores_df, p[1], p[2],
    point_size   = point_size,
    ellipse_alpha= ellipse_alpha,
    palette_name = palette_name,
    stress       = ord_final$stress
  )
)

  combined_plot <- NULL
  if (make_grid) {
    if (requireNamespace("patchwork", quietly = TRUE)) {
      ncol <- min(3, length(pair_plots))
      combined_plot <- Reduce(`+`, pair_plots) + patchwork::plot_layout(ncol = ncol, guides = "collect")
      if (verbose) print(combined_plot)
    } else if (requireNamespace("cowplot", quietly = TRUE)) {
      combined_plot <- cowplot::plot_grid(plotlist = pair_plots, ncol = min(3, length(pair_plots)), align = "hv")
      if (verbose) print(combined_plot)
    } else if (verbose) {
      message("Install 'patchwork' or 'cowplot' for combined grid.")
    }
  }

  results <- list(scores_df = scores_df, pairs = pairs, pair_plots = pair_plots, combined_plot = combined_plot)
  return(results)
}

# ================================================================
# 6. Overlay unlimited new points from file (CSV or TSV) via refit + Procrustes
# ================================================================

overlay_new_points_procrustes <- function(model, X_train, new_data_path, k_final,
                                          scores_df, seed = 42) {
  
  # Read new rows (auto-detects comma vs tab; auto-fills Sample/Grouping if missing)
  new_df <- read_new_samples(new_data_path, feature_cols = model$feature_cols)
  
  # Matrices with same preprocessing as training (no transforms)
  X_train <- as.data.frame(X_train)
  X_new   <- as.data.frame(new_df[, model$feature_cols])
  rownames(X_new) <- new_df$Sample
  
  # Combine training + new
  X_all <- rbind(X_train, X_new)
  
  # Refit NMDS on combined data (seed for reproducibility)
  set.seed(seed)
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
  p12_overlay <- make_pair_plot(
    data         = scores_df,
    ax1          = 1,
    ax2          = 2,
    point_size   = 3,
    ellipse_alpha= 0.20,
    palette_name = "Dark2",
    stress       = model$ordination$stress   # or omit if you don't want it in the title
  ) +
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
  
  # Return all key results instead of saving/printing
  return(list(
    new_coords   = aligned_new,   # new points only, rotated
    all_coords   = sc_all_rot,    # all points, rotated
    ord_all      = ord_all,       # NMDS object for combined data
    procrustes   = proc,          # procrustes fit object
    overlay_plot = p12_overlay    # ggplot overlay (1 vs 2 axes)
  ))
}





# ================================================================
# Full NMDS pipeline: load -> model -> pairplots -> overlay -> (optionally) save
# ================================================================
run_nmds_pipeline <- function(csv_file, new_data_path, output_dir,
                              k_final = 2, seed = 42,
                              get_stress = FALSE,
                              save_outputs = TRUE) {

  if (save_outputs && !dir.exists(output_dir)) dir.create(output_dir, recursive = TRUE)

  # 1) Load data
  dataset <- load_data(csv_file)  # df, X, feature_cols, group_col

  # 2) Optional quick broken stick
  stress <- NULL
  if (get_stress) {
    sres <- quick_broken_stick(dataset$X, verbose = FALSE)
    if (save_outputs) {
      ggsave(file.path(output_dir, "stress_vs_k_quick.png"),
             sres$plot, width = 6, height = 6, dpi = 300)
    }
    stress <- sres$stress_df
  }

  # 3) Final NMDS model (+ optional save)
  model <- final_nmds_model(dataset$X, dataset$feature_cols, k_final = k_final)
  if (save_outputs) {
    saveRDS(model, file.path(output_dir, "nmds_model.rds"))
  }

  # 4) Pairwise plots (pure)
  pp <- nmds_pairplots(model$ordination, dataset$df, dataset$group_col, k_final = k_final)

  # 5) Overlay (pure)
  ov <- overlay_new_points_procrustes(model, dataset$X, new_data_path,
                                      k_final = k_final, scores_df = pp$scores_df, seed = seed)

  # 6) Optional saving (old behavior)
  if (save_outputs) {
    if (!is.null(pp$combined_plot)) {
      ncol <- min(3, length(pp$pair_plots))
      ggsave(file.path(output_dir, "nmds_axes_all_pairs.png"),
             pp$combined_plot,
             width = 6 * ncol,
             height = 6 * ceiling(length(pp$pair_plots) / ncol),
             dpi = 300)
    }
    for (i in seq_along(pp$pairs)) {
      pr <- pp$pairs[[i]]
      ggsave(file.path(output_dir, sprintf("nmds_axes_%d_vs_%d.png", pr[1], pr[2])),
             pp$pair_plots[[i]], width = 6, height = 6, dpi = 300)
    }
    ggsave(file.path(output_dir, "nmds_overlay_procrustes_1v2.png"),
           ov$overlay_plot, width = 6, height = 6, dpi = 300)
  }

  return(list(
    files = list(
      model_rds   = if (save_outputs) file.path(output_dir, "nmds_model.rds") else NULL,
      combined    = if (save_outputs && !is.null(pp$combined_plot)) file.path(output_dir, "nmds_axes_all_pairs.png") else NULL,
      overlay     = if (save_outputs) file.path(output_dir, "nmds_overlay_procrustes_1v2.png") else NULL,
      pairs       = if (save_outputs) vapply(seq_along(pp$pairs), function(i) {
                       pr <- pp$pairs[[i]]
                       file.path(output_dir, sprintf("nmds_axes_%d_vs_%d.png", pr[1], pr[2]))
                     }, character(1)) else character(0)
    ),
    objects = list(
      dataset   = dataset,
      model     = model,
      pairplots = pp,
      overlay   = ov,
      stress_df = stress
    )
  ))
}


# ================================================================
# Emit minimal JSON to stdout (for Python subprocess)
# ================================================================
emit_nmds_json <- function(csv_file, new_data_path, output_dir,
                           k_final = 2, seed = 42,
                           get_stress = FALSE, save_outputs = FALSE,
                           include_scores = FALSE, scores_limit = 0) {
  res <- run_nmds_pipeline(csv_file, new_data_path, output_dir,
                           k_final = k_final, seed = seed,
                           get_stress = get_stress, save_outputs = save_outputs)

  stress_val <- unname(res$objects$model$ordination$stress)
  new_pts    <- tibble::rownames_to_column(as.data.frame(res$objects$overlay$new_coords), "Sample")

  payload <- list(
    status     = "ok",
    stress     = stress_val,
    k_final    = k_final,
    new_points = new_pts
  )

  if (include_scores) {
    scores <- res$objects$pairplots$scores_df
    if (scores_limit > 0) scores <- utils::head(scores, scores_limit)
    payload$scores <- scores
  }
  if (save_outputs) payload$files <- res$files

  cat(jsonlite::toJSON(payload, dataframe = "rows", auto_unbox = TRUE, na = "null"), "\n")
  invisible(res)
}

# ================================================================
# CLI entrypoint (AFTER all functions are defined)
#    Usage:
#      Rscript 1633_NMDS.R <csv> <new_data> <output_dir> [save|nosave] [scores_limit]
# ================================================================
if (!interactive()) {
  args <- commandArgs(trailingOnly = TRUE)
  if (length(args) < 3) {
    stop("Usage: Rscript 1633_NMDS.R <csv> <new_data> <output_dir> [save|nosave] [scores_limit]")
  }
  csv_file     <- args[[1]]
  new_data_path<- args[[2]]
  output_dir   <- args[[3]]
  save_flag    <- ifelse(length(args) >= 4 && tolower(args[[4]]) %in% c("save","true","1"), TRUE, FALSE)
  scores_limit <- ifelse(length(args) >= 5, as.integer(args[[5]]), 0L)

  if (save_flag && !dir.exists(output_dir)) dir.create(output_dir, recursive = TRUE)

  emit_nmds_json(
    csv_file      = csv_file,
    new_data_path = new_data_path,
    output_dir    = output_dir,
    k_final       = 2,
    seed          = 42,
    get_stress    = FALSE,
    save_outputs  = save_flag,
    include_scores= TRUE,
    scores_limit  = scores_limit
  )
  quit(save = "no", status = 0)   # stop here when run via Rscript
}

# ================================================================
# Optional interactive defaults (ONLY for RStudio use)
# ================================================================
csv_file      <- "backend/prediction/data/train/240130-Paper1-present 1633 targets.csv"
new_data_path <- "backend/prediction/data/test/new_samples.csv"
output_dir    <- "backend/prediction/output"
if (!dir.exists(output_dir)) dir.create(output_dir, recursive = TRUE)
res <- run_nmds_pipeline(csv_file, new_data_path, output_dir, k_final=2,
                        get_stress=FALSE, save_outputs=TRUE)