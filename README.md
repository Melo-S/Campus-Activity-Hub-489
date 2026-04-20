# Campus Activity Hub

Campus Activity Hub is a role based campus web app built for CPTS 489 Web Application Development.

Students can:

- view facility busyness for campus locations
- create and join activities
- RSVP and check in
- report problematic content

Organizers can:

- apply for verification
- post verified facility updates after approval

Admins can:

- approve or reject organizer applications
- moderate reported content
- manage location records

## Team

- Kaleb Kebede
- Melvin Sanare
- Modeste Houenou

## Tech Stack

- Node.js
- Express 5
- EJS
- Sequelize
- SQLite
- `express-session` with `connect-sqlite3`

## Project Structure

- `app/` application source code
- `app/controllers/` controller logic
- `app/models/` Sequelize models and associations
- `app/routes/` route definitions
- `app/views/` EJS templates
- `assets/` shared CSS and static assets
- `screens/` mockups from the earlier milestone
- `index.html` mockup overview page from the mid submission

## Requirements

Install the following before running the project:

- Node.js 18 or later
- npm

## Environment Variables

This project can run without a custom `.env` file, but you may create one inside `app/` if you want to override defaults.

Optional variables:

```env
SESSION_SECRET=your_custom_secret
PORT=3000
```

If no `.env` file is provided:

- `SESSION_SECRET` falls back to `dev_secret`
- `PORT` falls back to `3000`

## Install Dependencies

From the repo root:

```powershell
cd app
npm install
```

## Database Restore

This project uses SQLite, so the database export is the file itself.

Main database file:

- `app/database.sqlite`

Session database file:

- `sessions.sqlite`

### Option A: Restore from the included SQLite file

If `app/database.sqlite` is already present in the ZIP you submit, that is the restore file. Keep it in place and start the app.

### Option B: Rebuild a fresh demo database

If you want to regenerate the database with the demo accounts and sample data:

```powershell
Remove-Item app\database.sqlite -ErrorAction SilentlyContinue
Remove-Item sessions.sqlite -ErrorAction SilentlyContinue
node app\seed.js
```

This creates a fresh SQLite database with seeded users, organizer applications, status updates, activities, and reports.

## Start the Application

Development mode:

```powershell
cd app
npm run dev
```

Standard start:

```powershell
cd app
npm start
```

The application runs at:

- `http://127.0.0.1:3000`

Note:

- On this Windows machine, `127.0.0.1` is safer than `localhost` because another IPv6 service can sometimes intercept `localhost:3000`.

## Demo Accounts

After running `node app\seed.js`, use:

- Student: `student@wsu.edu` / `password123`
- Organizer approved: `organizer@wsu.edu` / `password123`
- Organizer pending: `pending-organizer@wsu.edu` / `password123`
- Admin: `admin@wsu.edu` / `password123`

## Major Routes

- `/login`
- `/student/home`
- `/organizer/dashboard`
- `/admin/dashboard`

## Notes for Reviewers

- Do not include `node_modules` in the submission ZIP.
- For SQLite, include `app/database.sqlite` directly in the ZIP.
- If schema fields change during development, delete `app/database.sqlite` and run `node app\seed.js` again.

## Clean Setup Checklist

These are the exact steps a reviewer should be able to follow:

```powershell
git clone <repo-url>
cd Campus-Activity-Hub-489
cd app
npm install
cd ..
node app\seed.js
cd app
npm start
```

Then open:

- `http://127.0.0.1:3000/login`

## Current Submission Status

Implemented and demo ready:

- auth and role routing
- student facility and activity flows
- organizer verification flow
- admin verification queue
- admin moderation queue
- admin location management

Still part of final submission prep:

- final PDF assembly
- screenshots of the running app
- MP4 demo video
- final ZIP packaging
