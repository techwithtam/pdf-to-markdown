claud# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Fixed
- Fixed markdown escaping issues where special characters (#, *, _, ., etc.) were being unnecessarily escaped
- Removed overly aggressive custom escape function in Turndown service
- Added comprehensive cleanMarkdown function to remove all unnecessary backslash escapes
- Fixed numbered list rendering (1\. now properly displays as 1.)

## [2026-01-30]

### Added
- Enhanced Markdown processing in geminiService
- Improved processing mode logic with QUICK and AI_ENHANCED modes
- Better tab detection using local HTML parsing for DOCX files
- HTML boundary finding for AI-detected tabs
- Direct HTML to Markdown conversion for Quick Convert mode

### Changed
- Updated video embed source in VideoModal component
- Optimized tab detection to prioritize local parsing over AI for HTML content
- Enhanced README for improved processing clarity
- Restructured processing modes for better user experience

### Improved
- Tab detection now uses document bookmarks/anchors as primary detection method
- Reduced API calls by slicing HTML content per-tab before processing
- Better handling of kebab-case and snake_case section titles
- More efficient batch processing with configurable batch sizes

## Earlier Versions

### Core Features
- PDF to Markdown conversion using Gemini AI
- DOCX to Markdown conversion via HTML intermediate format
- Multi-tab document processing with automatic section detection
- Parallel batch processing for better performance
- Local tab detection using HTML structure analysis
- AI-enhanced tab detection fallback
- Progress tracking with real-time updates
- Retry logic for robust processing
- Clean markdown output with proper heading hierarchy
