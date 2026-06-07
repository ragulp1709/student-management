const assert = require("node:assert/strict");
const { test } = require("node:test");
const { runStudentOperation } = require("../index");
const Student = require("../models/Student");

test("accepts and trims a valid student", async () => {
  const student = new Student({
    name: "  Asha Rao  ",
    grade: "  10  ",
    department: "  Science  ",
    age: 15
  });

  await student.validate();

  assert.equal(student.name, "Asha Rao");
  assert.equal(student.grade, "10");
  assert.equal(student.department, "Science");
});

test("rejects blank required fields", async () => {
  const student = new Student({
    name: "   ",
    grade: "",
    department: "Science",
    age: 15
  });

  await assert.rejects(student.validate(), error => {
    assert.equal(error.name, "ValidationError");
    assert.ok(error.errors.name);
    assert.ok(error.errors.grade);
    return true;
  });
});

test("rejects ages outside the supported range", async () => {
  for (const age of [0, 12.5, 121]) {
    const student = new Student({
      name: "Asha Rao",
      grade: "10",
      department: "Science",
      age
    });

    await assert.rejects(student.validate(), { name: "ValidationError" });
  }
});

test("converts database validation details into a client-safe error", async () => {
  const validationError = new Error("database internals");
  validationError.name = "ValidationError";
  validationError.errors = {
    age: { message: "Age must be at least 1" }
  };

  await assert.rejects(
    runStudentOperation(async () => {
      throw validationError;
    }),
    { message: "Age must be at least 1" }
  );
});

test("converts invalid database IDs into a client-safe error", async () => {
  const castError = new Error("database internals");
  castError.name = "CastError";

  await assert.rejects(
    runStudentOperation(async () => {
      throw castError;
    }),
    { message: "Invalid student ID" }
  );
});
