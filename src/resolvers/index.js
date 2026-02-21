// src/resolvers/index.js

const { uploadToCloudinary } = require("../utils/cloudinaryUpload");
const { GraphQLUpload } = require("graphql-upload");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const { GraphQLError } = require("graphql");

const User = require("../models/User");
const Employee = require("../models/Employee");

// ===================== ERROR HELPERS =====================
const badInput = (message, extra = {}) =>
  new GraphQLError(message, {
    extensions: { code: "BAD_USER_INPUT", ...extra },
  });

const unauthenticated = (message = "Unauthorized") =>
  new GraphQLError(message, {
    extensions: { code: "UNAUTHENTICATED" },
  });

const notFound = (message = "Not found") =>
  new GraphQLError(message, {
    extensions: { code: "NOT_FOUND" },
  });

const internalError = (message = "Internal server error") =>
  new GraphQLError(message, {
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });

const resolvers = {
  Upload: GraphQLUpload,

  // ===================== QUERIES =====================
  Query: {
    getAllEmployees: async () => {
      return await Employee.find();
    },

    searchEmployeeByEid: async (_, { eid }) => {
      if (!eid || !eid.trim()) throw badInput("eid is required");

      const employee = await Employee.findOne({ eid: eid.trim() });
      if (!employee) throw notFound("Employee not found");
      return employee;
    },

    searchEmployeesByDesignationOrDepartment: async (_, { designation, department }) => {
      if (!designation && !department) {
        throw badInput("Provide designation or department (at least one)");
      }

      const filter = {};
      if (designation) filter.designation = designation;
      if (department) filter.department = department;

      return await Employee.find(filter);
    },
  },

  // ===================== MUTATIONS =====================
  Mutation: {
    // ---------- SIGNUP ----------
    signup: async (_, { username, email, password }) => {
      // validation
      if (!username || username.trim().length < 3) {
        throw badInput("Username must be at least 3 characters");
      }

      if (!email || !validator.isEmail(email)) {
        throw badInput("Invalid email format");
      }

      if (!password || password.length < 6) {
        throw badInput("Password must be at least 6 characters");
      }

      // existing user check
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) throw badInput("Email already registered");

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      });

      await newUser.save();
      return newUser;
    },

    // ---------- LOGIN ----------
    login: async (_, { email, password }) => {
      // validation
      if (!email || !validator.isEmail(email)) {
        throw badInput("Invalid email format");
      }
      if (!password) {
        throw badInput("Password is required");
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) throw unauthenticated("Invalid email or password");

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw unauthenticated("Invalid email or password");

      if (!process.env.JWT_SECRET) {
        throw internalError("JWT_SECRET is missing in .env");
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return { user, token };
    },

    // ---------- ADD EMPLOYEE (with optional photo upload) ----------
    addEmployee: async (_, args) => {
      const { employeePhoto, ...data } = args;

      // validation
      if (!data.eid || !/^E\d+$/i.test(data.eid)) {
        throw badInput("EID must look like E101, E200, etc.");
      }

      if (!data.first_name || data.first_name.trim().length < 2) {
        throw badInput("first_name must be at least 2 characters");
      }

      if (!data.last_name || data.last_name.trim().length < 2) {
        throw badInput("last_name must be at least 2 characters");
      }

      if (!data.email || !validator.isEmail(data.email)) {
        throw badInput("Invalid employee email format");
      }

      const allowedGenders = ["Male", "Female", "Other"];
      if (!data.gender || !allowedGenders.includes(data.gender)) {
        throw badInput("gender must be Male, Female, or Other");
      }

      if (data.salary === undefined || data.salary === null || Number.isNaN(Number(data.salary))) {
        throw badInput("salary is required");
      }
      if (Number(data.salary) < 1000) {
        throw badInput("salary must be at least 1000");
      }

      if (!data.designation || !data.designation.trim()) {
        throw badInput("designation is required");
      }

      if (!data.department || !data.department.trim()) {
        throw badInput("department is required");
      }

      if (!data.dateOfJoining) {
        throw badInput("dateOfJoining is required");
      }

      const eidTrim = data.eid.trim();
      const emailNorm = data.email.toLowerCase().trim();

      const existingEid = await Employee.findOne({ eid: eidTrim });
      if (existingEid) throw badInput("Employee with this EID already exists");

      const existingEmail = await Employee.findOne({ email: emailNorm });
      if (existingEmail) throw badInput("Employee with this email already exists");

      // upload photo if provided
      let photoUrl = null;
      if (employeePhoto) {
        try {
          const { createReadStream } = await employeePhoto;
          const stream = createReadStream();
          const uploadResult = await uploadToCloudinary(stream, "employees");
          photoUrl = uploadResult.secure_url;
        } catch (e) {
          throw internalError("Photo upload failed");
        }
      }

      const employee = new Employee({
        ...data,
        eid: eidTrim,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: emailNorm,
        employeePhoto: photoUrl,
      });

      await employee.save();
      return employee;
    },

    // ---------- UPDATE EMPLOYEE BY EID (optional photo upload) ----------
    updateEmployeeByEid: async (_, { eid, employeePhoto, ...updates }) => {
      if (!eid || !eid.trim()) throw badInput("eid is required");

      Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

      const hasUpdates = Object.keys(updates).length > 0 || !!employeePhoto;
      if (!hasUpdates) throw badInput("Provide at least one field to update");

      if (updates.email && !validator.isEmail(updates.email)) {
        throw badInput("Invalid employee email format");
      }
      if (updates.salary !== undefined && Number(updates.salary) < 1000) {
        throw badInput("salary must be at least 1000");
      }
      if (updates.first_name && updates.first_name.trim().length < 2) {
        throw badInput("first_name must be at least 2 characters");
      }
      if (updates.last_name && updates.last_name.trim().length < 2) {
        throw badInput("last_name must be at least 2 characters");
      }
      if (updates.gender) {
        const allowedGenders = ["Male", "Female", "Other"];
        if (!allowedGenders.includes(updates.gender)) {
          throw badInput("gender must be Male, Female, or Other");
        }
      }

      // normalize email if updating
      if (updates.email) updates.email = updates.email.toLowerCase().trim();
      if (updates.first_name) updates.first_name = updates.first_name.trim();
      if (updates.last_name) updates.last_name = updates.last_name.trim();
      if (updates.designation) updates.designation = updates.designation.trim();
      if (updates.department) updates.department = updates.department.trim();

      if (updates.email) {
        const existingEmail = await Employee.findOne({
          email: updates.email,
          eid: { $ne: eid.trim() },
        });
        if (existingEmail) throw badInput("Employee with this email already exists");
      }

      // upload photo if provided
      if (employeePhoto) {
        try {
          const { createReadStream } = await employeePhoto;
          const stream = createReadStream();
          const uploadResult = await uploadToCloudinary(stream, "employees");
          updates.employeePhoto = uploadResult.secure_url;
        } catch (e) {
          throw internalError("Photo upload failed");
        }
      }

      const employee = await Employee.findOneAndUpdate(
        { eid: eid.trim() },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!employee) throw notFound("Employee not found");
      return employee;
    },

    // ---------- DELETE EMPLOYEE BY EID ----------
    deleteEmployeeByEid: async (_, { eid }) => {
      if (!eid || !eid.trim()) throw badInput("eid is required");

      const employee = await Employee.findOneAndDelete({ eid: eid.trim() });
      if (!employee) throw notFound("Employee not found");

      return "Employee deleted successfully";
    },
  },
};

module.exports = resolvers;