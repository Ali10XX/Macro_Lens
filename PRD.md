# MacroLens Product Requirements - Cursor Rules

## Project Overview
MacroLens is an AI-powered recipe and nutrition management system combining video/audio/text parsing, robust food tracking, and intuitive interfaces.

## Product Goals
- Automate macro tracking from recipe content
- Support multi-input sources (video metadata, text, URLs, images)
- Deliver high-accuracy nutrition data via AI

## Target Users
- Fitness-focused individuals
- Nutrition coaches
- Meal preppers and food bloggers

## Core Features
- Multimodal Recipe Extraction (Video Processing + Gemini)
- Nutrition Engine (USDA, APIs, ML estimation)
- Full CRUD + Filtering + Ratings
- Mobile & Web App with shared backend
- JWT Auth with premium tier support

## Technical Requirements
- FastAPI + PostgreSQL + Redis
- Next.js frontend (SSR)
- React Native mobile app
- FFmpeg/MoviePy + Gemini + EasyOCR
- Docker, CI/CD via GitHub Actions

## Acceptance Criteria
- >95% extraction accuracy on test set
- <5s average upload-to-response time
- Full accessibility compliance
- Deployment to production-grade environments

## Future Features
- Smart grocery list generation
- Community recipe sharing
- Fitness tracker integrations
- Predictive meal suggestions

## Social Media Recipe Import Feature

### Feature Description
Automatic recipe logging system that detects "link in bio" references or direct recipe URLs in social media posts, autonomously visits those links, extracts structured recipe data (ingredients, cooking steps, nutritional information), and seamlessly integrates the recipe into the user's MacroLens collection.

### User Stories

#### Primary User Stories
- As a fitness enthusiast, I want to automatically import recipes from social media influencers I follow, so I can easily track macros from their recommended meals without manual data entry
- As a meal prep enthusiast, I want the app to detect when I share a "link in bio" post and automatically extract the recipe data, so I can quickly add trending recipes to my collection
- As a nutrition coach, I want to import recipes from multiple social media sources simultaneously, so I can build comprehensive meal plans for my clients efficiently

#### Secondary User Stories
- As a user, I want to be notified when a recipe import is successful or fails, so I can take appropriate action if needed
- As a user, I want to review and edit automatically imported recipes before they're saved, so I can ensure accuracy and add personal notes
- As a user, I want to set preferences for which social media platforms to monitor, so I can control the automation scope

### Acceptance Criteria

#### Core Functionality
- System detects "link in bio" phrases in social media post text with >90% accuracy
- System identifies direct recipe URLs (common recipe sites) with >95% accuracy
- Successfully crawls and extracts recipe data from >80% of supported recipe websites
- Extracted recipes include: ingredients list, cooking instructions, prep/cook times, servings
- Nutrition data is calculated using existing MacroLens nutrition engine
- Imported recipes are tagged with source URL and import timestamp

#### User Experience
- Recipe import process completes within 30 seconds for standard recipe pages
- User receives real-time notifications for import status (success/failure/processing)
- Imported recipes appear in user's recipe collection with "Auto-Imported" tag
- Users can enable/disable auto-import feature in settings
- Users can review and edit imported recipes before saving

#### Error Handling
- System gracefully handles inaccessible URLs (404, timeouts, etc.)
- Failed imports are logged with specific error messages
- System respects website robots.txt and rate limiting
- Duplicate recipe detection prevents multiple imports of same recipe

### Success Metrics

#### Performance Metrics
- Recipe Detection Accuracy: >90% for "link in bio" detection, >95% for direct URLs
- Extraction Success Rate: >80% of detected recipe URLs successfully parsed
- Processing Time: <30 seconds average from detection to recipe availability
- System Uptime: 99.5% availability for import processing

#### User Engagement Metrics
- Feature Adoption: >40% of active users enable auto-import within first month
- Import Volume: Average 5+ recipes imported per user per week
- User Satisfaction: >4.5/5 rating for auto-import feature accuracy
- Conversion Rate: >60% of auto-imported recipes are saved permanently by users

#### Technical Metrics
- Crawling Efficiency: <2 second average page load time
- Data Accuracy: >95% accuracy in ingredient extraction vs. manual entry
- Error Rate: <10% of import attempts result in errors
- Scalability: Handle 1000+ concurrent import requests without performance degradation
