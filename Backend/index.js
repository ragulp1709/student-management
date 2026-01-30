require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const Student = require("./models/Student");

const app = express();
app.use(cors());


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB Connected"))
  .catch(err => console.error(" MongoDB Error:", err));


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

  students: async () => {
    console.log("Fetching students");
    return await Student.find();
  },


  createStudent: async ({ name, grade, department, age }) => {
    console.log("createStudent:", { name, grade, department, age });

    const student = new Student({
      name,
      grade,
      department,
      age
    });

    const savedStudent = await student.save();
    console.log("Student saved:", savedStudent);

    return savedStudent;
  },


  updateStudent: async ({ id, name, grade, department, age }) => {
    console.log("updateStudent:", id);

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (grade !== undefined) updates.grade = grade;
    if (department !== undefined) updates.department = department;
    if (age !== undefined) updates.age = age;

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!updatedStudent) {
      throw new Error("Student not found");
    }

    return updatedStudent;
  },


  deleteStudent: async ({ id }) => {
    console.log("deleteStudent:", id);

    const deletedStudent = await Student.findByIdAndDelete(id);
    if (!deletedStudent) {
      throw new Error("Student not found");
    }

    return deletedStudent;
  }
};


app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true
  })
);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/graphql`);
});
