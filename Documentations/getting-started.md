# Getting Started with QueryLab

This guide will help you get started with QueryLab, a zero-install, in-browser PostgreSQL learning application powered by PGlite.

## What is QueryLab?

QueryLab is a full-stack application designed to help you learn SQL in your browser. It features:

- **Zero Installation**: Everything runs in your browser - no setup required
- **Client-Side Execution**: All SQL runs locally using PGlite (PostgreSQL compiled to WebAssembly) - the best engine matching standard SQL format
- **AI Assistance**: Generate and fix SQL queries using AI
- **Beautiful UI**: Modern, responsive interface with light/dark mode

## First Steps

### 1. Opening QueryLab

Simply navigate to the QueryLab website. No account creation is required to start using basic features.

### 2. Understanding the Interface

The QueryLab interface consists of:

- **SQL Editor**: The main area where you write your SQL queries
- **Results Table**: Displays query results below the editor
- **Schema Explorer**: Shows your database structure on the right
- **Action Buttons**: Run queries, ask AI, import/export databases

### 3. Writing Your First Query

1. Type a SQL query in the editor, for example:
   ```sql
   SELECT * FROM students LIMIT 10;
   ```

2. Press `Cmd/Ctrl + Enter` or click "Run Query"

3. View your results in the table below

## Basic Features

### Running Queries

- Use `Cmd/Ctrl + Enter` keyboard shortcut
- Or click the "Run Query" button
- Results appear instantly in the results table

### Using AI

Click the "Ask AI" button to:
- Generate SQL from natural language
- Get suggestions for your queries
- Learn SQL patterns and best practices

### Managing Databases

- **Import**: Load existing .sql files
- **Export**: Save your database as a .sql file
- **Create New**: Start with a fresh database
- **Switch**: Use the database selector to manage multiple databases

## Next Steps

- Learn about the [SQL Editor](sql-editor.md)
- Explore [AI Features](ai-features.md)
- Understand [Database Management](database-management.md)

