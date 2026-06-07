const assert = require("node:assert/strict");
const { test } = require("node:test");
const { app } = require("../index");
const Student = require("../models/Student");

test("serves student data through the GraphQL HTTP endpoint", async t => {
  const originalFind = Student.find;
  Student.find = () => ({
    sort: async () => [
      {
        id: "507f1f77bcf86cd799439011",
        name: "Asha Rao",
        grade: "10",
        department: "Science",
        age: 15
      }
    ]
  });

  t.after(() => {
    Student.find = originalFind;
  });

  const server = await new Promise(resolve => {
    const runningServer = app.listen(0, () => resolve(runningServer));
  });

  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
      })
  );

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/graphql`, {
    method: "POST",
    headers: {
      Accept: "application/graphql-response+json, application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: `
        query Students {
          students {
            id
            name
            grade
            department
            age
          }
        }
      `
    })
  });

  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /json/);
  assert.deepEqual(payload, {
    data: {
      students: [
        {
          id: "507f1f77bcf86cd799439011",
          name: "Asha Rao",
          grade: "10",
          department: "Science",
          age: 15
        }
      ]
    }
  });
});
