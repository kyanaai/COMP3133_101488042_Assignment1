const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    eid: { type: String, required: true, unique: true, trim: true },

    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },

    salary: { type: Number, required: true, min: 1000 },

    designation: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },

    dateOfJoining: { type: Date, required: true },

    employeePhoto: { type: String } 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);