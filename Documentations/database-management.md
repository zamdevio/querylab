# Database Management Guide

QueryLab allows you to create, manage, and work with multiple PostgreSQL databases entirely in your browser using PGlite.

## Creating Databases

### Starting Fresh

1. Click the database selector dropdown
2. Click "Create New Database"
3. Enter a name for your database
4. Start writing SQL to create tables and insert data

### Using Default Database

QueryLab comes with a default database containing sample data:
- `students` table with example records
- Perfect for learning and testing

## Importing Databases

### Importing .sql Files

1. Click the "Import SQL" button
2. Select a .sql file from your computer
3. Review the import confirmation
4. Confirm to replace your current database

**Warning**: Importing will permanently delete all data in your current database. Export first if you want to keep it!

### Supported Formats

- Standard SQL files (.sql)
- PostgreSQL dump files
- Multi-statement SQL files

## Exporting Databases

### Saving Your Work

1. Click the "Export SQL" button
2. A .sql file will download automatically
3. Save the file to preserve your database

### Export Format

Exported files contain:
- CREATE TABLE statements
- INSERT statements for all data
- Ready to import into any PostgreSQL database

## Managing Multiple Databases

### Switching Databases

1. Use the database selector in the top bar
2. Select a different database from the dropdown
3. Your SQL editor and results update automatically

### Database Names

- Each database has a unique name/key
- Names are stored locally in your browser
- You can have multiple databases for different projects

## Data Persistence

### How Data is Stored

- Databases are stored in IndexedDB (browser storage)
- Data persists across browser sessions
- Each database is stored separately

### Storage Limits

- Browser storage limits apply (typically 5-10% of disk space)
- Large databases may hit storage limits
- Export important databases regularly

### Clearing Data

To clear a database:
1. Export it first (if you want to keep it)
2. Delete it using the database selector
3. Or clear browser data (clears all databases)

## Best Practices

1. **Regular Exports**: Export important databases frequently
2. **Naming**: Use descriptive names for your databases
3. **Organization**: Create separate databases for different projects
4. **Backup**: Keep exported .sql files as backups
5. **Cleanup**: Delete unused databases to free space

## Troubleshooting

### Database Not Loading

- Refresh the page
- Check browser console for errors
- Try importing from a backup export

### Storage Full

- Export and delete unused databases
- Clear browser cache
- Use browser settings to manage storage

### Import Fails

- Check that the file is a valid .sql file
- Ensure the SQL syntax is correct
- Try importing a smaller file first

