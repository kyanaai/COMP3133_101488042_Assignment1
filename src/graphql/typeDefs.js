const { gql } = require("graphql-tag");

const typeDefs = gql`
  scalar Upload

  type User {
    _id: ID!
    username: String!
    email: String!
  }

  type Employee {
    _id: ID!
    eid: String!
    first_name: String!
    last_name: String!
    email: String!
    gender: String!
    salary: Float!
    designation: String!
    department: String!
    dateOfJoining: String!
    employeePhoto: String
  }

  type AuthPayload {
    user: User!
    token: String
  }

  type Query {
    # Employee queries (we'll implement step-by-step)
    getAllEmployees: [Employee!]!
    searchEmployeeByEid(eid: String!): Employee
    searchEmployeesByDesignationOrDepartment(
      designation: String
      department: String
    ): [Employee!]!
  }

  type Mutation {
    # User
    signup(username: String!, email: String!, password: String!): User!
    login(email: String!, password: String!): AuthPayload!

    # Employee mutations (we'll implement after auth)
    addEmployee(
      eid: String!
      first_name: String!
      last_name: String!
      email: String!
      gender: String!
      salary: Float!
      designation: String!
      department: String!
      dateOfJoining: String!
      employeePhoto: Upload
    ): Employee!

    updateEmployeeByEid(
      eid: String!
      first_name: String
      last_name: String
      email: String
      gender: String
      salary: Float
      designation: String
      department: String
      dateOfJoining: String
      employeePhoto: Upload
    ): Employee!

    deleteEmployeeByEid(eid: String!): String!
  }
`;

module.exports = typeDefs;