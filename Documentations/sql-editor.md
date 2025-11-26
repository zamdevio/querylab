# SQL Editor Guide

The QueryLab SQL editor is powered by Monaco Editor (the same editor used in VS Code), providing a professional SQL editing experience.

## Editor Features

### Syntax Highlighting

The editor automatically highlights SQL syntax, making it easier to read and write queries:

- Keywords (SELECT, FROM, WHERE, etc.) are highlighted
- Strings and numbers are color-coded
- Comments are visually distinct

### Autocomplete

Monaco Editor provides intelligent autocomplete:

- Table names from your database
- Column names from selected tables
- SQL keywords and functions
- Press `Ctrl+Space` to trigger autocomplete manually

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Enter` | Run query |
| `Cmd/Ctrl + S` | Save database |
| `Escape` | Close modals |
| `Ctrl+Space` | Trigger autocomplete |
| `Cmd/Ctrl + /` | Toggle comment |

### Multi-line Editing

- Select multiple lines and type to edit them all
- Use `Alt + Click` to add multiple cursors
- Use `Cmd/Ctrl + D` to select next occurrence

## Writing SQL

### Basic Queries

Start with simple SELECT statements:

```sql
SELECT * FROM students;
```

### Filtering Data

Use WHERE clauses to filter results:

```sql
SELECT * FROM students WHERE age > 20;
```

### Joining Tables

Combine data from multiple tables:

```sql
SELECT s.name, c.course_name 
FROM students s 
JOIN courses c ON s.course_id = c.id;
```

### Modifying Data

Insert, update, and delete records:

```sql
INSERT INTO students (name, age) VALUES ('John', 22);
UPDATE students SET age = 23 WHERE name = 'John';
DELETE FROM students WHERE age < 18;
```

## Error Handling

When you write invalid SQL:

1. The editor may show syntax errors inline
2. Running the query displays a detailed error message
3. Use "Fix With AI" to automatically correct errors
4. Review the error message to understand what went wrong

## Tips for Better SQL

1. **Format Your Queries**: Use proper indentation and line breaks
2. **Use Aliases**: Make queries more readable with table/column aliases
3. **Test Incrementally**: Build complex queries step by step
4. **Use Comments**: Document your queries with `--` or `/* */`
5. **Explore Schema**: Use the Schema Explorer to understand your database structure

## Advanced Features

### Query History

While QueryLab doesn't maintain a formal history, you can:
- Use browser back/forward if you navigate away
- Export your database to preserve your work
- Copy queries to save them elsewhere

### Performance

- Large result sets are automatically paginated
- Complex queries run efficiently in WebAssembly
- Database operations are optimized for browser execution

