# DrinkLogger Blueprint

## Overview
DrinkLogger is a Next.js application for tracking drink consumption, featuring a public dashboard with statistics and an admin interface for managing logs and categories.

## Current State
- **Home Page**: Public dashboard showing recent activities, streaks, and top drinks.
- **Admin Dashboard**: Secured area for adding/removing drinks, managing categories, and viewing full logs.
- **Tech Stack**: Next.js (App Router), Firebase (Firestore, Auth), Tailwind CSS.

## Plan: Fix Data Limits
The goal is to ensure all data is accessible on both the Home and Admin pages.

### Steps
1.  **Home Page**: Remove filters restricting data to the current year and the 200-log limit.
2.  **Admin Page**: Remove the 100-log limit on the dashboard query.
