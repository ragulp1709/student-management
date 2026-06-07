const mongoose = require("mongoose");

const requiredText = field => ({
  type: String,
  required: [true, `${field} is required`],
  trim: true,
  minlength: [1, `${field} is required`],
  maxlength: [100, `${field} must be 100 characters or fewer`]
});

const StudentSchema = new mongoose.Schema(
  {
    name: requiredText("Name"),
    grade: requiredText("Grade"),
    department: requiredText("Department"),
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [1, "Age must be at least 1"],
      max: [120, "Age must be 120 or less"],
      validate: {
        validator: Number.isInteger,
        message: "Age must be a whole number"
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", StudentSchema);
