# 🛒 Full Stack E-Commerce Application

A full-stack E-Commerce Web Application developed using **Java, Spring Boot, Spring Security, JWT Authentication, MySQL, and React.js**.

The application provides customer shopping functionality along with a dedicated admin panel for managing products, categories, orders, inventory, users, returns, refunds, and business analytics.

## 🚀 Project Overview

This project is designed to simulate a real-world e-commerce platform with separate customer and administrator functionalities.

The backend follows a layered architecture using Controllers, Services, Repositories, DTOs, Entities, and Exception Handling to maintain code organization and separation of concerns.

The frontend is developed using React.js and communicates with the Spring Boot REST APIs.

## 🛠️ Technology Stack

### Backend
- Java 17
- Spring Boot
- Spring Security
- JWT Authentication
- Spring Data JPA
- Hibernate ORM
- MySQL
- Maven
- RESTful APIs
- DTO Pattern
- MapStruct
- Swagger / OpenAPI

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3

### Tools
- Visual Studio Code
- Postman
- Git & GitHub
- MySQL

## ✨ Key Features

### 👤 Customer Module
- User Registration
- User Login and Authentication
- JWT-based Authorization
- Product Browsing
- Product Search and Filtering
- Category Management and Browsing
- Shopping Cart Management
- Buy Now Functionality
- Order Placement
- Order History
- Payment Management
- Order Status Tracking
- Return Request Management
- Refund Management
- Customer Profile Management
- Address Management

### 🔐 Admin Module
- Admin Authentication and Authorization
- User Management
- Product Management
- Category Management
- Order Management
- Order Status Management
- Inventory and Stock Management
- Return and Refund Management
- Best-Selling Product Reports
- Date-Wise Sales Reports
- Inventory Reports
- Order Analytics
- Return and Refund Analytics
- Revenue and Sales Reporting

## 🏗️ Backend Architecture

The backend follows a layered architecture.

```text
Backend
│
├── configuration
│   ├── SecurityConfig
│   ├── JWTAuthenticationFilter
│   └── OpenAPIConfig
│
├── controller
│
├── dto
│
├── entity
│
├── enums
│
├── exception
│
├── mapper
│
├── repository
│
├── service
│
└── resources
    └── application.properties
```

### Architecture Responsibilities

| Layer | Responsibility |
|---|---|
| Controller | Handles HTTP requests and responses |
| Service | Contains business logic |
| Repository | Database operations |
| Entity | Database table mapping |
| DTO | Transfers data between application layers |
| Mapper | Converts Entity objects into DTOs and vice versa |
| Configuration | Application and security configuration |
| Exception | Centralized exception handling |
| Enums | Defines predefined application states |

## 🔒 Security Implementation

- Spring Security for application security.
- JWT-based authentication.
- Role-based authorization.
- Password encryption using BCrypt.
- Authentication filter for validating JWT tokens.
- Protected endpoints for authorized users.

## 🗄️ Database

**Database:** MySQL

The application uses Spring Data JPA and Hibernate for database interaction and entity management.

Main database entities include:

- User
- Product
- Category
- Cart
- CartItem
- Order
- OrderItem
- Payment
- Address
- ReturnRequest
- Refund

## 📁 Project Structure

```text
Ecommerce/
│
├── Ecomerce bakend/
│   ├── src/
│   ├── pom.xml
│   └── .gitignore
│
├── ecommerce-frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Make sure you have installed:

- JDK 17
- MySQL Server
- Node.js and npm
- Git
- Maven (or use the included Maven Wrapper)

### 1. Clone the Repository

```bash
git clone https://github.com/KrishnaYadav24/Ecommerce-website.git
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd "Ecomerce bakend"
```

Configure your MySQL database and update the database credentials in `application.properties`.

Create the database:

```sql
CREATE DATABASE ecommerce_db;
```

Configure the database connection and JWT secret securely using your local configuration.

Run the Spring Boot application:

**Windows:**

```bash
mvnw.cmd spring-boot:run
```

**Linux / macOS:**

```bash
./mvnw spring-boot:run
```

### 3. Frontend Setup

Open another terminal:

```bash
cd ecommerce-frontend
```

Install dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 📖 API Documentation

The backend uses RESTful APIs for communication between the frontend and backend.

Swagger / OpenAPI documentation is configured in the backend.

When the application is running, check:

```text
http://localhost:8569/swagger-ui/index.html
```

## 🔄 Application Workflow

1. Customer registers and logs into the application.
2. The backend authenticates the user and generates a JWT token.
3. The customer browses products and adds items to the cart.
4. The customer places an order.
5. The admin manages orders and updates their statuses.
6. Inventory and stock information are managed.
7. Customers can submit return requests.
8. Admin manages return and refund operations.
9. Admin can access sales, inventory, and order analytics.

## 🔮 Future Enhancements

- Online Payment Gateway Integration
- Email Notifications
- Product Reviews and Ratings
- Wishlist Functionality
- Docker Containerization
- Cloud Deployment
- Automated Testing
- CI/CD Pipeline

## 👨‍💻 Developer

**Krishna Yadav**

B.Tech in Computer Science and Engineering

GitHub: [KrishnaYadav24](https://github.com/KrishnaYadav24)

Project Repository: [Ecommerce-website](https://github.com/KrishnaYadav24/Ecommerce-website)

---

⭐ If you find this project interesting, feel free to explore the repository and its implementation.

**Developed with Java, Spring Boot, React.js, and MySQL.**
