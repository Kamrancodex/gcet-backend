# Database Seeding Script

This script populates the database with sample data for testing and development purposes.

## What it creates:

### Users

- **Admin User**: `admin@gcet.edu` / `admin123`
- **Admissions Admin**: `admissions@gcet.edu` / `admissions123`
- **Library Admin**: `library@gcet.edu` / `library123`
- **Teacher User**: `teacher@gcet.edu` / `teacher123`

### Students

- **Rahul Sharma**: Computer Science Engineering, Semester 3, Approved & Paid
- **Priya Patel**: Electrical Engineering, Semester 5, Approved & Partial Payment
- **Amit Kumar**: Mechanical Engineering, Semester 7, Pending & Unpaid

### Books

- Introduction to Algorithms (Computer Science)
- Database System Concepts (Computer Science)
- Power System Analysis (Electrical Engineering)

### Notices

- Semester 3 Exam Forms Available
- Library Maintenance Notice

### Admission Sessions

- Fall 2024 Semester 1 (Active)

## How to run:

```bash
# From the backend directory
npm run seed

# Or directly with ts-node
npx ts-node src/scripts/seedDatabase.ts
```

## Prerequisites:

1. Make sure MongoDB is running and accessible
2. Set up your `.env` file with the correct `MONGODB_URI`
3. Install dependencies: `npm install`

## Notes:

- The script will clear all existing data before seeding
- All passwords are hashed using bcrypt
- Student IDs and Library IDs are auto-generated
- The script connects to the database specified in your `.env` file
