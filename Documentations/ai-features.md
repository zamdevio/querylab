# AI Features Guide

QueryLab uses DeepSeek AI to help you generate, fix, and understand SQL queries.

## AI-Powered SQL Generation

### Generating SQL from Natural Language

1. Click the "Ask AI" button
2. Type your request in natural language, for example:
   - "Show me all students older than 20"
   - "Find courses with more than 50 students"
   - "Get the average age of students by course"
3. Click "Generate" and wait for the AI to create your SQL
4. Review the generated query and run it

### Best Practices for AI Prompts

- **Be Specific**: "Show students in Computer Science" is better than "show students"
- **Mention Tables**: Reference table names when possible
- **Specify Conditions**: Include filters, sorting, and limits
- **Ask for Explanations**: Request explanations to learn from the AI

### AI Suggestions

The AI can provide suggestions based on:
- Your current database schema
- Common SQL patterns
- Best practices for your use case

## AI-Powered Error Fixing

### Using "Fix With AI"

When you encounter a SQL error:

1. The error message appears with a "Fix With AI" button
2. Click the button to analyze the error
3. The AI will:
   - Analyze the error message
   - Review your SQL query
   - Consider your database schema
   - Generate a corrected query
4. Review the fix and explanation
5. Apply the fix or modify as needed

### What Gets Fixed

The AI can fix:
- Syntax errors (missing commas, typos)
- Logic errors (wrong table names, invalid joins)
- Type mismatches
- Missing clauses
- Incorrect function usage

### Understanding AI Fixes

Each fix includes:
- **Corrected SQL**: The fixed query
- **Explanation**: What was wrong and why
- **Learning Points**: Tips to avoid similar errors

## Rate Limiting

To ensure fair usage:
- AI requests are rate-limited (30 requests per minute)
- Rate limit errors show when you can try again
- Authentication is required for AI features

## Tips for Best Results

1. **Provide Context**: Include relevant table names and schema info
2. **Review Carefully**: Always review AI-generated SQL before running
3. **Learn from Fixes**: Use explanations to improve your SQL skills
4. **Iterate**: Refine your prompts based on results
5. **Combine with Learning**: Use AI as a learning tool, not just a crutch

## Limitations

- AI may not always generate perfect SQL
- Complex queries might need refinement
- Rate limits apply to prevent abuse
- Requires internet connection and authentication

