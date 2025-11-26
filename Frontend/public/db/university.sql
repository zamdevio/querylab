-- University Database
-- A complete university management system with students, courses, enrollments, and more

CREATE SEQUENCE IF NOT EXISTS students_student_id_seq START 1 INCREMENT 1;
CREATE TABLE students (
    student_id INTEGER NOT NULL DEFAULT nextval('students_student_id_seq'::regclass),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    gpa NUMERIC(3, 2)
);

INSERT INTO students (student_id, first_name, last_name, email, enrollment_date, gpa) VALUES (1, 'Alice', 'Johnson', 'alice.johnson@university.edu', CURRENT_DATE, 3.85);
INSERT INTO students (student_id, first_name, last_name, email, enrollment_date, gpa) VALUES (2, 'Bob', 'Smith', 'bob.smith@university.edu', CURRENT_DATE, 3.72);
INSERT INTO students (student_id, first_name, last_name, email, enrollment_date, gpa) VALUES (3, 'Carol', 'Williams', 'carol.williams@university.edu', CURRENT_DATE, 3.91);
INSERT INTO students (student_id, first_name, last_name, email, enrollment_date, gpa) VALUES (4, 'David', 'Brown', 'david.brown@university.edu', CURRENT_DATE, 3.45);
INSERT INTO students (student_id, first_name, last_name, email, enrollment_date, gpa) VALUES (5, 'Emma', 'Davis', 'emma.davis@university.edu', CURRENT_DATE, 3.88);

CREATE SEQUENCE IF NOT EXISTS courses_course_id_seq START 1 INCREMENT 1;
CREATE TABLE courses (
    course_id INTEGER NOT NULL DEFAULT nextval('courses_course_id_seq'::regclass),
    course_code VARCHAR(10) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL,
    department_id INTEGER
);

INSERT INTO courses (course_id, course_code, course_name, credits, department_id) VALUES (1, 'CS101', 'Introduction to Computer Science', 3, 1);
INSERT INTO courses (course_id, course_code, course_name, credits, department_id) VALUES (2, 'MATH201', 'Calculus I', 4, 2);
INSERT INTO courses (course_id, course_code, course_name, credits, department_id) VALUES (3, 'ENG101', 'English Composition', 3, 3);
INSERT INTO courses (course_id, course_code, course_name, credits, department_id) VALUES (4, 'PHYS101', 'Physics I', 4, 4);
INSERT INTO courses (course_id, course_code, course_name, credits, department_id) VALUES (5, 'HIST101', 'World History', 3, 5);

CREATE SEQUENCE IF NOT EXISTS departments_dept_id_seq START 1 INCREMENT 1;
CREATE TABLE departments (
    department_id INTEGER NOT NULL DEFAULT nextval('departments_dept_id_seq'::regclass),
    department_name VARCHAR(100) NOT NULL,
    building VARCHAR(50),
    budget NUMERIC(12, 2)
);

INSERT INTO departments (department_id, department_name, building, budget) VALUES (1, 'Computer Science', 'Science Building', 500000.00);
INSERT INTO departments (department_id, department_name, building, budget) VALUES (2, 'Mathematics', 'Science Building', 350000.00);
INSERT INTO departments (department_id, department_name, building, budget) VALUES (3, 'English', 'Humanities Building', 280000.00);
INSERT INTO departments (department_id, department_name, building, budget) VALUES (4, 'Physics', 'Science Building', 420000.00);
INSERT INTO departments (department_id, department_name, building, budget) VALUES (5, 'History', 'Humanities Building', 300000.00);

CREATE SEQUENCE IF NOT EXISTS professors_professor_id_seq START 1 INCREMENT 1;
CREATE TABLE professors (
    professor_id INTEGER NOT NULL DEFAULT nextval('professors_professor_id_seq'::regclass),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    department_id INTEGER,
    salary NUMERIC(10, 2)
);

INSERT INTO professors (professor_id, first_name, last_name, email, department_id, salary) VALUES (1, 'Dr. Sarah', 'Miller', 'sarah.miller@university.edu', 1, 95000.00);
INSERT INTO professors (professor_id, first_name, last_name, email, department_id, salary) VALUES (2, 'Dr. James', 'Wilson', 'james.wilson@university.edu', 2, 92000.00);
INSERT INTO professors (professor_id, first_name, last_name, email, department_id, salary) VALUES (3, 'Dr. Mary', 'Anderson', 'mary.anderson@university.edu', 3, 88000.00);
INSERT INTO professors (professor_id, first_name, last_name, email, department_id, salary) VALUES (4, 'Dr. Robert', 'Taylor', 'robert.taylor@university.edu', 4, 98000.00);
INSERT INTO professors (professor_id, first_name, last_name, email, department_id, salary) VALUES (5, 'Dr. Lisa', 'Martinez', 'lisa.martinez@university.edu', 5, 85000.00);

CREATE SEQUENCE IF NOT EXISTS enrollments_enrollment_id_seq START 1 INCREMENT 1;
CREATE TABLE enrollments (
    enrollment_id INTEGER NOT NULL DEFAULT nextval('enrollments_enrollment_id_seq'::regclass),
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    grade VARCHAR(2)
);

INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade) VALUES (1, 1, 1, CURRENT_DATE, 'A');
INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade) VALUES (2, 1, 2, CURRENT_DATE, 'B+');
INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade) VALUES (3, 2, 1, CURRENT_DATE, 'A-');
INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade) VALUES (4, 2, 3, CURRENT_DATE, 'B');
INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade) VALUES (5, 3, 1, CURRENT_DATE, 'A');
INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade) VALUES (6, 3, 4, CURRENT_DATE, 'A-');
INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade) VALUES (7, 4, 2, CURRENT_DATE, 'C+');
INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade) VALUES (8, 4, 5, CURRENT_DATE, 'B-');
INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade) VALUES (9, 5, 1, CURRENT_DATE, 'A');
INSERT INTO enrollments (enrollment_id, student_id, course_id, enrollment_date, grade) VALUES (10, 5, 3, CURRENT_DATE, 'A');

CREATE SEQUENCE IF NOT EXISTS assignments_assignment_id_seq START 1 INCREMENT 1;
CREATE TABLE assignments (
    assignment_id INTEGER NOT NULL DEFAULT nextval('assignments_assignment_id_seq'::regclass),
    course_id INTEGER NOT NULL,
    assignment_name VARCHAR(100) NOT NULL,
    due_date DATE,
    max_score INTEGER
);

INSERT INTO assignments (assignment_id, course_id, assignment_name, due_date, max_score) VALUES (1, 1, 'Programming Project 1', CURRENT_DATE + INTERVAL '7 days', 100);
INSERT INTO assignments (assignment_id, course_id, assignment_name, due_date, max_score) VALUES (2, 1, 'Midterm Exam', CURRENT_DATE + INTERVAL '14 days', 100);
INSERT INTO assignments (assignment_id, course_id, assignment_name, due_date, max_score) VALUES (3, 2, 'Homework 1', CURRENT_DATE + INTERVAL '3 days', 50);
INSERT INTO assignments (assignment_id, course_id, assignment_name, due_date, max_score) VALUES (4, 2, 'Quiz 1', CURRENT_DATE + INTERVAL '5 days', 25);
INSERT INTO assignments (assignment_id, course_id, assignment_name, due_date, max_score) VALUES (5, 3, 'Essay 1', CURRENT_DATE + INTERVAL '10 days', 100);

CREATE SEQUENCE IF NOT EXISTS grades_grade_id_seq START 1 INCREMENT 1;
CREATE TABLE grades (
    grade_id INTEGER NOT NULL DEFAULT nextval('grades_grade_id_seq'::regclass),
    enrollment_id INTEGER NOT NULL,
    assignment_id INTEGER,
    score NUMERIC(5, 2),
    graded_date DATE DEFAULT CURRENT_DATE
);

INSERT INTO grades (grade_id, enrollment_id, assignment_id, score, graded_date) VALUES (1, 1, 1, 95.00, CURRENT_DATE);
INSERT INTO grades (grade_id, enrollment_id, assignment_id, score, graded_date) VALUES (2, 1, 2, 88.50, CURRENT_DATE);
INSERT INTO grades (grade_id, enrollment_id, assignment_id, score, graded_date) VALUES (3, 2, 1, 92.00, CURRENT_DATE);
INSERT INTO grades (grade_id, enrollment_id, assignment_id, score, graded_date) VALUES (4, 3, 1, 98.00, CURRENT_DATE);
INSERT INTO grades (grade_id, enrollment_id, assignment_id, score, graded_date) VALUES (5, 3, 2, 94.00, CURRENT_DATE);

CREATE SEQUENCE IF NOT EXISTS classrooms_classroom_id_seq START 1 INCREMENT 1;
CREATE TABLE classrooms (
    classroom_id INTEGER NOT NULL DEFAULT nextval('classrooms_classroom_id_seq'::regclass),
    room_number VARCHAR(10) NOT NULL,
    building VARCHAR(50) NOT NULL,
    capacity INTEGER,
    has_projector BOOLEAN DEFAULT false
);

INSERT INTO classrooms (classroom_id, room_number, building, capacity, has_projector) VALUES (1, '101', 'Science Building', 30, true);
INSERT INTO classrooms (classroom_id, room_number, building, capacity, has_projector) VALUES (2, '102', 'Science Building', 25, false);
INSERT INTO classrooms (classroom_id, room_number, building, capacity, has_projector) VALUES (3, '201', 'Humanities Building', 40, true);
INSERT INTO classrooms (classroom_id, room_number, building, capacity, has_projector) VALUES (4, '202', 'Humanities Building', 35, true);
INSERT INTO classrooms (classroom_id, room_number, building, capacity, has_projector) VALUES (5, '301', 'Main Building', 50, true);

CREATE SEQUENCE IF NOT EXISTS schedules_schedule_id_seq START 1 INCREMENT 1;
CREATE TABLE schedules (
    schedule_id INTEGER NOT NULL DEFAULT nextval('schedules_schedule_id_seq'::regclass),
    course_id INTEGER NOT NULL,
    professor_id INTEGER NOT NULL,
    classroom_id INTEGER,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME,
    end_time TIME
);

INSERT INTO schedules (schedule_id, course_id, professor_id, classroom_id, day_of_week, start_time, end_time) VALUES (1, 1, 1, 1, 'Monday', '09:00:00', '10:30:00');
INSERT INTO schedules (schedule_id, course_id, professor_id, classroom_id, day_of_week, start_time, end_time) VALUES (2, 1, 1, 1, 'Wednesday', '09:00:00', '10:30:00');
INSERT INTO schedules (schedule_id, course_id, professor_id, classroom_id, day_of_week, start_time, end_time) VALUES (3, 2, 2, 2, 'Tuesday', '10:00:00', '11:50:00');
INSERT INTO schedules (schedule_id, course_id, professor_id, classroom_id, day_of_week, start_time, end_time) VALUES (4, 2, 2, 2, 'Thursday', '10:00:00', '11:50:00');
INSERT INTO schedules (schedule_id, course_id, professor_id, classroom_id, day_of_week, start_time, end_time) VALUES (5, 3, 3, 3, 'Monday', '14:00:00', '15:30:00');

CREATE SEQUENCE IF NOT EXISTS library_books_book_id_seq START 1 INCREMENT 1;
CREATE TABLE library_books (
    book_id INTEGER NOT NULL DEFAULT nextval('library_books_book_id_seq'::regclass),
    isbn VARCHAR(20),
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100),
    available BOOLEAN DEFAULT true
);

INSERT INTO library_books (book_id, isbn, title, author, available) VALUES (1, '978-0134685991', 'Introduction to Algorithms', 'Thomas H. Cormen', true);
INSERT INTO library_books (book_id, isbn, title, author, available) VALUES (2, '978-0132350884', 'Clean Code', 'Robert C. Martin', true);
INSERT INTO library_books (book_id, isbn, title, author, available) VALUES (3, '978-0134685991', 'Database Systems', 'Ramez Elmasri', false);
INSERT INTO library_books (book_id, isbn, title, author, available) VALUES (4, '978-0134685991', 'Operating System Concepts', 'Abraham Silberschatz', true);
INSERT INTO library_books (book_id, isbn, title, author, available) VALUES (5, '978-0134685991', 'Computer Networks', 'Andrew S. Tanenbaum', true);

