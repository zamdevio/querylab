# Troubleshooting Guide

Common issues and solutions for QueryLab.

## SQL Execution Errors

### "No such table" Error

**Problem**: Table doesn't exist in your database.

**Solutions**:
- Check the Schema Explorer to see available tables
- Create the table first with `CREATE TABLE`
- Verify table name spelling (case-sensitive)

### Syntax Errors

**Problem**: SQL syntax is invalid.

**Solutions**:
- Check for missing commas, quotes, or parentheses
- Use "Fix With AI" to automatically correct syntax
- Review SQL documentation for proper syntax
- Check the error message for specific issues

### "Database is locked" Error

**Problem**: Multiple operations trying to access the database.

**Solutions**:
- Wait a moment and try again
- Refresh the page
- Close other QueryLab tabs

## AI Features Not Working

### "Authentication required" Error

**Problem**: AI features require login.

**Solutions**:
- Click the login button in the header
- Enter your @ucsiuniversity.edu.my email
- Verify with the code sent to your email

### "Rate limit exceeded" Error

**Problem**: Too many AI requests in a short time.

**Solutions**:
- Wait 60 seconds before trying again
- Reduce the frequency of AI requests
- Use AI features more selectively

### AI Not Generating Correct SQL

**Problem**: Generated SQL doesn't match your intent.

**Solutions**:
- Be more specific in your prompt
- Include table names and schema details
- Review and modify the generated SQL
- Try rephrasing your request

## Database Issues

### Database Not Saving

**Problem**: Changes aren't persisting.

**Solutions**:
- Check browser storage permissions
- Ensure IndexedDB is enabled
- Try exporting the database manually
- Clear browser cache and try again

### Import Fails

**Problem**: Can't import a .sql file.

**Solutions**:
- Verify the file is a valid .sql file
- Check file size (very large files may fail)
- Ensure SQL syntax is correct
- Try importing a smaller test file first

### Database Disappears

**Problem**: Database is missing after refresh.

**Solutions**:
- Check if you're using the correct database selector
- Verify browser storage isn't cleared
- Check if you're in incognito/private mode
- Export databases regularly as backup

## Performance Issues

### Slow Query Execution

**Problem**: Queries take too long to run.

**Solutions**:
- Optimize your SQL queries
- Add indexes for frequently queried columns
- Reduce result set size with LIMIT
- Check for inefficient JOINs or subqueries

### Browser Freezing

**Problem**: Browser becomes unresponsive.

**Solutions**:
- Close other tabs
- Reduce database size
- Avoid very large result sets
- Refresh the page

## Network Issues

### API Errors

**Problem**: Backend API requests fail.

**Solutions**:
- Check your internet connection
- Verify the API URL is correct
- Check browser console for detailed errors
- Try refreshing the page

### CORS Errors

**Problem**: Cross-origin request blocked.

**Solutions**:
- Ensure you're using the correct frontend URL
- Check that CORS is configured on the backend
- Verify cookie settings for authentication

## Authentication Issues

### Can't Login

**Problem**: Login process fails.

**Solutions**:
- Verify email is @ucsiuniversity.edu.my
- Check spam folder for verification code
- Request a new code if expired
- Clear browser cookies and try again

### Session Expired

**Problem**: Logged out unexpectedly.

**Solutions**:
- Log in again with your email
- Check cookie settings in browser
- Ensure cookies are enabled
- Try a different browser

## Getting Help

If you continue to experience issues:

1. Check the browser console for error messages
2. Review the [Error Handling](error-handling.md) documentation
3. Check the [API Reference](api-reference.md) for backend issues
4. Open an issue on GitHub with:
   - Description of the problem
   - Steps to reproduce
   - Browser and OS information
   - Console error messages

