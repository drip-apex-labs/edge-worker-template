# Changelog

Changes to the Apex Edge Worker, newest first, in Keep a Changelog format.

## [1.2.6] - 2026-09-30

### Changed
- Updated compatibility with the storefront config's on-page surveys block, which the worker passes through unchanged. (#7117)

## [1.2.5] - 2026-09-29

### Fixed
- Count-once goals now count independently for each experiment and can fire again after a results reset, while preserving previously counted goals. (#5635)

## [1.2.4] - 2026-09-26

### Changed
- Combined the delivery-source reporting and API-only flag compatibility updates in one worker version.

## [1.2.3] - 2026-09-26

### Changed
- Updated compatibility with API-only feature flags so they remain separate from storefront experiments. (#6677)

## [1.2.2] - 2026-09-26

### Changed
- Updated compatibility with delivery-source reporting so Apex can identify the code actually delivered to the storefront. (#6712)

## [1.2.1] - 2026-09-23

### Changed
- Updated compatibility with per-shop data layer adoption settings; existing data layers are adopted immediately by default. (#6449)

## [1.2.0] - 2026-09-18

### Added
- Standalone Cloudflare Worker deployment with edge experiment assignment, HTML changes, and Apex SDK delivery.
- Cached configuration, installation diagnostics, and SDK-only fallback when the worker cannot safely run experiments at the edge.

Versions before 1.2.0 are only in the repository history.
