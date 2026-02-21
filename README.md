# COMP3133 Assignment 1 — GraphQL Employee API

**Student ID:** 101488042

## Overview

This project implements a GraphQL API for managing employees using Node.js, Express, Apollo Server, and MongoDB Atlas.  
It supports user authentication, employee CRUD operations, and image upload functionality.

---

## Technologies Used

- Node.js & Express
- Apollo Server (GraphQL)
- MongoDB Atlas & Mongoose
- JWT Authentication
- Cloudinary (Image Upload)
- Postman (API Testing)

---

## Setup Instructions

1. Install dependencies:

npm install


2. Run server:

npm run dev

Server runs at:  
http://localhost:3000/graphql

---

## API Features

### Authentication
- User signup
- User login (JWT token)

### Employee Management
- Add employee
- Get all employees
- Search by EID
- Search by department/designation
- Update employee
- Delete employee

### Image Upload
Employee photos uploaded to Cloudinary via GraphQL.

---


## Sample Login User

Email: kiana_postman@test.com  
Password: 123456