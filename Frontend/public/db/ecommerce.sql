-- E-Commerce Database
-- A complete e-commerce system with products, orders, customers, payments, and more

CREATE SEQUENCE IF NOT EXISTS categories_category_id_seq START 1 INCREMENT 1;
CREATE TABLE categories (
    category_id INTEGER NOT NULL DEFAULT nextval('categories_category_id_seq'::regclass),
    category_name VARCHAR(50) NOT NULL,
    description VARCHAR(200)
);

INSERT INTO categories (category_id, category_name, description) VALUES (1, 'Electronics', 'Electronic devices and accessories');
INSERT INTO categories (category_id, category_name, description) VALUES (2, 'Clothing', 'Apparel and fashion items');
INSERT INTO categories (category_id, category_name, description) VALUES (3, 'Books', 'Books and educational materials');

CREATE SEQUENCE IF NOT EXISTS customers_customer_id_seq START 1 INCREMENT 1;
CREATE TABLE customers (
    customer_id INTEGER NOT NULL DEFAULT nextval('customers_customer_id_seq'::regclass),
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(150)
);

INSERT INTO customers (customer_id, customer_name, email) VALUES (1, 'John Smith', 'john.smith@email.com');
INSERT INTO customers (customer_id, customer_name, email) VALUES (2, 'Sarah Johnson', 'sarah.j@email.com');
INSERT INTO customers (customer_id, customer_name, email) VALUES (3, 'Mike Davis', 'mike.davis@email.com');

CREATE TABLE departments (
    department_id INTEGER NOT NULL,
    department_name VARCHAR(100) NOT NULL
);

INSERT INTO departments (department_id, department_name) VALUES (1, 'Sales');
INSERT INTO departments (department_id, department_name) VALUES (2, 'Marketing');
INSERT INTO departments (department_id, department_name) VALUES (3, 'IT');
INSERT INTO departments (department_id, department_name) VALUES (4, 'Human Resources');
INSERT INTO departments (department_id, department_name) VALUES (5, 'Finance');

CREATE SEQUENCE IF NOT EXISTS discounts_discount_id_seq START 1 INCREMENT 1;
CREATE TABLE discounts (
    discount_id INTEGER NOT NULL DEFAULT nextval('discounts_discount_id_seq'::regclass),
    discount_code VARCHAR(50) NOT NULL,
    discount_percent NUMERIC
);

INSERT INTO discounts (discount_id, discount_code, discount_percent) VALUES (1, 'WELCOME10', 10.00);
INSERT INTO discounts (discount_id, discount_code, discount_percent) VALUES (2, 'SUMMER25', 25.00);
INSERT INTO discounts (discount_id, discount_code, discount_percent) VALUES (3, 'VIP15', 15.00);
INSERT INTO discounts (discount_id, discount_code, discount_percent) VALUES (4, 'HOLIDAY30', 30.00);
INSERT INTO discounts (discount_id, discount_code, discount_percent) VALUES (5, 'FIRST5', 5.00);
INSERT INTO discounts (discount_id, discount_code, discount_percent) VALUES (6, 'HOLIDAY15', 15.00);

CREATE TABLE employees (
    employee_id INTEGER NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL
);

INSERT INTO employees (employee_id, first_name, last_name) VALUES (1, 'Alice', 'Brown');
INSERT INTO employees (employee_id, first_name, last_name) VALUES (2, 'Bob', 'Wilson');
INSERT INTO employees (employee_id, first_name, last_name) VALUES (3, 'Carol', 'Miller');
INSERT INTO employees (employee_id, first_name, last_name) VALUES (4, 'David', 'Taylor');
INSERT INTO employees (employee_id, first_name, last_name) VALUES (5, 'Emma', 'Anderson');

CREATE SEQUENCE IF NOT EXISTS order_items_order_item_id_seq START 1 INCREMENT 1;
CREATE TABLE order_items (
    order_item_id INTEGER NOT NULL DEFAULT nextval('order_items_order_item_id_seq'::regclass),
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL
);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity) VALUES (1, 1, 1, 1);
INSERT INTO order_items (order_item_id, order_id, product_id, quantity) VALUES (2, 1, 2, 2);
INSERT INTO order_items (order_item_id, order_id, product_id, quantity) VALUES (3, 2, 3, 1);
INSERT INTO order_items (order_item_id, order_id, product_id, quantity) VALUES (4, 3, 4, 1);
INSERT INTO order_items (order_item_id, order_id, product_id, quantity) VALUES (5, 4, 5, 2);

CREATE SEQUENCE IF NOT EXISTS orders_order_id_seq START 1 INCREMENT 1;
CREATE TABLE orders (
    order_id INTEGER NOT NULL DEFAULT nextval('orders_order_id_seq'::regclass),
    user_id INTEGER,
    order_date DATE DEFAULT CURRENT_DATE
);

INSERT INTO orders (order_id, user_id, order_date) VALUES (1, 1, CURRENT_DATE);
INSERT INTO orders (order_id, user_id, order_date) VALUES (2, 2, CURRENT_DATE);
INSERT INTO orders (order_id, user_id, order_date) VALUES (3, 3, CURRENT_DATE);
INSERT INTO orders (order_id, user_id, order_date) VALUES (4, 1, CURRENT_DATE);

CREATE SEQUENCE IF NOT EXISTS payments_payment_id_seq START 1 INCREMENT 1;
CREATE TABLE payments (
    payment_id INTEGER NOT NULL DEFAULT nextval('payments_payment_id_seq'::regclass),
    order_id INTEGER,
    amount NUMERIC NOT NULL,
    payment_date DATE
);

INSERT INTO payments (payment_id, order_id, amount, payment_date) VALUES (1, 1, 99.99, CURRENT_DATE);
INSERT INTO payments (payment_id, order_id, amount, payment_date) VALUES (2, 2, 149.50, CURRENT_DATE);
INSERT INTO payments (payment_id, order_id, amount, payment_date) VALUES (3, 3, 75.25, CURRENT_DATE);
INSERT INTO payments (payment_id, order_id, amount, payment_date) VALUES (4, 4, 200.00, CURRENT_DATE);
INSERT INTO payments (payment_id, order_id, amount, payment_date) VALUES (5, 5, 45.75, CURRENT_DATE);

CREATE SEQUENCE IF NOT EXISTS products_product_id_seq START 1 INCREMENT 1;
CREATE TABLE products (
    product_id INTEGER NOT NULL DEFAULT nextval('products_product_id_seq'::regclass),
    product_name VARCHAR(100) NOT NULL,
    price NUMERIC NOT NULL
);

INSERT INTO products (product_id, product_name, price) VALUES (1, 'Laptop', 999.99);
INSERT INTO products (product_id, product_name, price) VALUES (2, 'Mouse', 29.99);
INSERT INTO products (product_id, product_name, price) VALUES (3, 'Keyboard', 79.99);
INSERT INTO products (product_id, product_name, price) VALUES (4, 'Monitor', 299.99);
INSERT INTO products (product_id, product_name, price) VALUES (5, 'Headphones', 149.99);

CREATE TABLE promotions (
    promotion_id INTEGER NOT NULL,
    promotion_name VARCHAR(100) NOT NULL,
    discount_percent NUMERIC
);

INSERT INTO promotions (promotion_id, promotion_name, discount_percent) VALUES (1, 'Summer Sale', 15.00);
INSERT INTO promotions (promotion_id, promotion_name, discount_percent) VALUES (2, 'Black Friday', 30.00);
INSERT INTO promotions (promotion_id, promotion_name, discount_percent) VALUES (3, 'New Year Special', 20.00);
INSERT INTO promotions (promotion_id, promotion_name, discount_percent) VALUES (4, 'Clearance Event', 50.00);
INSERT INTO promotions (promotion_id, promotion_name, discount_percent) VALUES (5, 'Member Discount', 10.00);

CREATE TABLE reviews (
    review_id INTEGER NOT NULL,
    product_id INTEGER,
    rating INTEGER NOT NULL
);

INSERT INTO reviews (review_id, product_id, rating) VALUES (1, 1, 5);
INSERT INTO reviews (review_id, product_id, rating) VALUES (2, 1, 4);
INSERT INTO reviews (review_id, product_id, rating) VALUES (3, 2, 3);
INSERT INTO reviews (review_id, product_id, rating) VALUES (4, 3, 5);
INSERT INTO reviews (review_id, product_id, rating) VALUES (5, 4, 2);

CREATE SEQUENCE IF NOT EXISTS shipments_shipment_id_seq START 1 INCREMENT 1;
CREATE TABLE shipments (
    shipment_id INTEGER NOT NULL DEFAULT nextval('shipments_shipment_id_seq'::regclass),
    order_id INTEGER,
    shipment_date DATE,
    status VARCHAR(50)
);

INSERT INTO shipments (shipment_id, order_id, shipment_date, status) VALUES (1, 1, CURRENT_DATE, 'Shipped');
INSERT INTO shipments (shipment_id, order_id, shipment_date, status) VALUES (2, 2, CURRENT_DATE, 'In Transit');
INSERT INTO shipments (shipment_id, order_id, shipment_date, status) VALUES (3, 3, CURRENT_DATE, 'Delivered');
INSERT INTO shipments (shipment_id, order_id, shipment_date, status) VALUES (4, 4, CURRENT_DATE, 'Processing');
INSERT INTO shipments (shipment_id, order_id, shipment_date, status) VALUES (5, 5, CURRENT_DATE, 'Shipped');

CREATE TABLE suppliers (
    supplier_id INTEGER NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100)
);

INSERT INTO suppliers (supplier_id, supplier_name, contact_email) VALUES (1, 'Tech Supplies Inc', 'contact@techsupplies.com');
INSERT INTO suppliers (supplier_id, supplier_name, contact_email) VALUES (2, 'Office Depot', 'orders@officedepot.com');
INSERT INTO suppliers (supplier_id, supplier_name, contact_email) VALUES (3, 'Global Electronics', 'sales@globalelectronics.com');
INSERT INTO suppliers (supplier_id, supplier_name, contact_email) VALUES (4, 'Paper Products Co', 'info@paperproducts.com');
INSERT INTO suppliers (supplier_id, supplier_name, contact_email) VALUES (5, 'Furniture World', 'support@furnitureworld.com');

CREATE SEQUENCE IF NOT EXISTS users_user_id_seq START 1 INCREMENT 1;
CREATE TABLE users (
    user_id INTEGER NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL
);

INSERT INTO users (user_id, username, email) VALUES (1, 'john_doe', 'john@example.com');
INSERT INTO users (user_id, username, email) VALUES (2, 'jane_smith', 'jane@example.com');
INSERT INTO users (user_id, username, email) VALUES (3, 'bob_wilson', 'bob@example.com');
INSERT INTO users (user_id, username, email) VALUES (4, 'alice_brown', 'alice@example.com');

CREATE SEQUENCE IF NOT EXISTS warehouses_warehouse_id_seq START 1 INCREMENT 1;
CREATE TABLE warehouses (
    warehouse_id INTEGER NOT NULL DEFAULT nextval('warehouses_warehouse_id_seq'::regclass),
    warehouse_name VARCHAR(100) NOT NULL,
    location VARCHAR(200)
);

INSERT INTO warehouses (warehouse_id, warehouse_name, location) VALUES (1, 'Main Warehouse', 'New York');
INSERT INTO warehouses (warehouse_id, warehouse_name, location) VALUES (2, 'West Coast Hub', 'Los Angeles');
INSERT INTO warehouses (warehouse_id, warehouse_name, location) VALUES (3, 'Central Distribution', 'Chicago');
INSERT INTO warehouses (warehouse_id, warehouse_name, location) VALUES (4, 'Southern Depot', 'Atlanta');
INSERT INTO warehouses (warehouse_id, warehouse_name, location) VALUES (5, 'Northwest Storage', 'Seattle');

