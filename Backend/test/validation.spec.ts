import { describe, it, expect } from 'vitest';
import { validateSql } from '../src/lib/services/sql/validation';

describe('SQL Validation', () => {
	describe('Valid SQL statements', () => {
		it('should accept valid SELECT statement', () => {
			const result = validateSql('SELECT name FROM students WHERE age > 21');
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.statements).toBeDefined();
			}
		});

		it('should accept SELECT with JOIN', () => {
			const result = validateSql(
				'SELECT s.name, o.total FROM students s JOIN orders o ON s.id = o.student_id',
			);
			expect(result.ok).toBe(true);
		});

		it('should accept INSERT statement', () => {
			const result = validateSql(
				"INSERT INTO students (name, age) VALUES ('John', 25)",
			);
			expect(result.ok).toBe(true);
		});

		it('should accept UPDATE statement', () => {
			const result = validateSql(
				"UPDATE students SET age = 26 WHERE name = 'John'",
			);
			expect(result.ok).toBe(true);
		});

		it('should accept SELECT with allowed tables', () => {
			const result = validateSql('SELECT * FROM students', ['students']);
			expect(result.ok).toBe(true);
		});
	});

	describe('Invalid SQL statements', () => {
		it('should reject empty SQL', () => {
			const result = validateSql('');
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain('Empty SQL');
			}
		});

		it('should reject DROP TABLE statement', () => {
			const result = validateSql('DROP TABLE students');
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain('DROP');
			}
		});

		it('should reject CREATE TABLE statement', () => {
			const result = validateSql(
				'CREATE TABLE test (id INTEGER PRIMARY KEY)',
			);
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain('create');
			}
		});

		it('should reject ALTER TABLE statement', () => {
			const result = validateSql('ALTER TABLE students ADD COLUMN email TEXT');
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain('alter');
			}
		});

		it('should reject multiple statements', () => {
			const result = validateSql(
				'SELECT * FROM students; DROP TABLE students;',
			);
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain('Multiple statements');
			}
		});

		it('should reject PRAGMA statement', () => {
			const result = validateSql('PRAGMA table_info(students)');
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain('pragma');
			}
		});

		it('should reject ATTACH DATABASE', () => {
			const result = validateSql("ATTACH DATABASE 'test.db' AS test");
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain('attach');
			}
		});

		it('should reject DELETE statement', () => {
			const result = validateSql('DELETE FROM students WHERE id = 1');
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain('delete');
			}
		});

		it('should reject table not in allowed list', () => {
			const result = validateSql('SELECT * FROM unauthorized_table', [
				'students',
				'orders',
			]);
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain('not allowed');
			}
		});

		it('should reject malformed SQL', () => {
			const result = validateSql('SELECT FROM WHERE');
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeDefined();
			}
		});
	});

	describe('Table allowlist validation', () => {
		it('should accept query with allowed table', () => {
			const result = validateSql('SELECT * FROM students', ['students']);
			expect(result.ok).toBe(true);
		});

		it('should reject query with disallowed table', () => {
			const result = validateSql('SELECT * FROM users', ['students']);
			expect(result.ok).toBe(false);
		});

		it('should accept query with multiple allowed tables', () => {
			const result = validateSql(
				'SELECT * FROM students s JOIN orders o ON s.id = o.student_id',
				['students', 'orders'],
			);
			expect(result.ok).toBe(true);
		});

		it('should reject query with one disallowed table in JOIN', () => {
			const result = validateSql(
				'SELECT * FROM students s JOIN unauthorized o ON s.id = o.student_id',
				['students'],
			);
			expect(result.ok).toBe(false);
		});
	});
});

