require("dotenv").config({ quiet: true });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createHandler } = require("graphql-http/lib/use/express");
const { buildSchema } = require("graphql");
const Student = require("./models/Student");

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
  })
);

const schema = buildSchema(`
  type Student {
    id: ID!
    name: String!
    grade: String!
    department: String!
    age: Int!
  }

  type Query {
    students: [Student!]!
  }

  type Mutation {
    createStudent(
      name: String!
      grade: String!
      department: String!
      age: Int!
    ): Student!

    updateStudent(
      id: ID!
      name: String
      grade: String
      department: String
      age: Int
    ): Student!

    deleteStudent(id: ID!): Student!
  }
`);

const root = {
  students: async () =>
    runStudentOperation(() => Student.find().sort({ name: 1 })),

  createStudent: async ({ name, grade, department, age }) =>
    runStudentOperation(() =>
      Student.create({ name, grade, department, age })
    ),

  updateStudent: async ({ id, name, grade, department, age }) => {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (grade !== undefined) updates.grade = grade;
    if (department !== undefined) updates.department = department;
    if (age !== undefined) updates.age = age;

    const updatedStudent = await runStudentOperation(() =>
      Student.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
      })
    );

    if (!updatedStudent) {
      throw new Error("Student not found");
    }

    return updatedStudent;
  },

  deleteStudent: async ({ id }) => {
    const deletedStudent = await runStudentOperation(() =>
      Student.findByIdAndDelete(id)
    );

    if (!deletedStudent) {
      throw new Error("Student not found");
    }

    return deletedStudent;
  }
};

async function runStudentOperation(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error.name === "CastError") {
      throw new Error("Invalid student ID");
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map(validationError => validationError.message)
        .join(". ");
      throw new Error(message);
    }

    console.error("Student operation failed:", error);
    throw new Error("Unable to complete the student operation");
  }
}

app.get("/health", (_request, response) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  response.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "unavailable",
    database: databaseConnected ? "connected" : "disconnected"
  });
});

app.all("/graphql", createHandler({ schema, rootValue: root }));

const PORT = Number(process.env.PORT) || 4000;
let server;

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
  });

  return server;
}

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  }

  await mongoose.disconnect();
}

if (require.main === module) {
  startServer().catch(error => {
    console.error("Unable to start server:", error.message);
    process.exitCode = 1;
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      shutdown(signal).catch(error => {
        console.error("Shutdown failed:", error.message);
        process.exitCode = 1;
      });
    });
  }
}

module.exports = {
  app,
  root,
  runStudentOperation,
  schema,
  shutdown,
  startServer
};
