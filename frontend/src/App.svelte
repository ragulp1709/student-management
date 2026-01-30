<script>
  let students = [];


  let name = "";
  let grade = "";
  let department = "";
  let age = "";


  let filterDept = "";
  let sortByAge = false;

  const API_URL = "http://localhost:4000/graphql";


  async function fetchStudents() {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query {
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

    const json = await res.json();
    students = json.data.students;
  }


  async function addStudent() {
    if (!name || !grade || !department || !age) return;

    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation ($name: String!, $grade: String!, $department: String!, $age: Int!) {
            createStudent(
              name: $name
              grade: $grade
              department: $department
              age: $age
            ) {
              id
            }
          }
        `,
        variables: {
          name,
          grade,
          department,
          age: Number(age)
        }
      })
    });

    name = "";
    grade = "";
    department = "";
    age = "";

    fetchStudents();
  }


  async function deleteStudent(id) {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation ($id: ID!) {
            deleteStudent(id: $id) {
              id
            }
          }
        `,
        variables: { id }
      })
    });

    fetchStudents();
  }


  async function updateStudent(student) {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation ($id: ID!, $grade: String, $department: String, $age: Int) {
            updateStudent(
              id: $id
              grade: $grade
              department: $department
              age: $age
            ) {
              id
            }
          }
        `,
        variables: {
          id: student.id,
          grade: student.grade,
          department: student.department,
          age: student.age
        }
      })
    });
  }

  $: filteredStudents = students
    .filter(s =>
      filterDept
        ? s.department.toLowerCase().includes(filterDept.toLowerCase())
        : true
    )
    .sort((a, b) => (sortByAge ? a.age - b.age : 0));

  fetchStudents();
</script>

<h1>Student Management</h1>


<div class="form">
  <input placeholder="Name" bind:value={name} />
  <input placeholder="Grade" bind:value={grade} />
  <input placeholder="Department" bind:value={department} />
  <input placeholder="Age" type="number" bind:value={age} />
  <button on:click={addStudent}>Add Student</button>
</div>


<div class="filters">
  <input placeholder="Filter by Department" bind:value={filterDept} />
  <label>
    <input type="checkbox" bind:checked={sortByAge} />
    Sort by Age
  </label>
</div>

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Grade</th>
      <th>Department</th>
      <th>Age</th>
      <th>Actions</th>
    </tr>
  </thead>

  <tbody>
    {#each filteredStudents as s}
      <tr>
        <td class="name">{s.name}</td>

        <td>
          <input bind:value={s.grade} />
        </td>

        <td>
          <input bind:value={s.department} />
        </td>

        <td>
          <input type="number" bind:value={s.age} />
        </td>

        <td class="actions">
          <button class="update" on:click={() => updateStudent(s)}>
            Update
          </button>
          <button class="delete" on:click={() => deleteStudent(s.id)}>
            Delete
          </button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  h1 {
    text-align: center;
    margin-bottom: 20px;
  }

  .form,
  .filters {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 15px;
  }

  table {
    width: 85%;
    margin: auto;
    border-collapse: collapse;
    margin-top: 20px;
  }

  th, td {
    padding: 10px;
    text-align: center;
  }

  th {
    border-bottom: 2px solid #555;
    font-weight: bold;
  }

  tr {
    border-bottom: 1px solid #444;
  }

  .name {
    font-weight: bold;
  }

  input {
    padding: 6px;
    width: 90px;
    background: #2b2b2b;
    color: white;
    border: 1px solid #555;
    border-radius: 4px;
    text-align: center;
  }

  .actions {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  button {
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    border: none;
  }

  .update {
    background: #111;
    color: white;
  }

  .delete {
    background: #c0392b;
    color: white;
  }

  button:hover {
    opacity: 0.85;
  }
</style>
