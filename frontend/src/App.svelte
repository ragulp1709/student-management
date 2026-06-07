<script>
  import { onMount } from "svelte";
  import { graphQLRequest } from "./lib/api.js";

  const studentFields = `
    id
    name
    grade
    department
    age
  `;

  let students = [];
  let name = "";
  let grade = "";
  let department = "";
  let age = "";
  let filterDept = "";
  let sortBy = "name";
  let loading = true;
  let creating = false;
  let activeStudentId = "";
  let activeAction = "";
  let errorMessage = "";
  let successMessage = "";

  $: filteredStudents = students
    .filter(student =>
      student.department.toLowerCase().includes(filterDept.trim().toLowerCase())
    )
    .sort((left, right) => {
      if (sortBy === "age") {
        return left.age - right.age || left.name.localeCompare(right.name);
      }

      if (sortBy === "department") {
        return (
          left.department.localeCompare(right.department) ||
          left.name.localeCompare(right.name)
        );
      }

      return left.name.localeCompare(right.name);
    });

  onMount(() => {
    fetchStudents();
  });

  function clearFeedback() {
    errorMessage = "";
    successMessage = "";
  }

  function validateStudent(student) {
    const cleanedStudent = {
      name: student.name.trim(),
      grade: student.grade.trim(),
      department: student.department.trim(),
      age: Number(student.age)
    };

    if (
      !cleanedStudent.name ||
      !cleanedStudent.grade ||
      !cleanedStudent.department
    ) {
      throw new Error("Name, grade, and department are required.");
    }

    if (
      !Number.isInteger(cleanedStudent.age) ||
      cleanedStudent.age < 1 ||
      cleanedStudent.age > 120
    ) {
      throw new Error("Age must be a whole number between 1 and 120.");
    }

    return cleanedStudent;
  }

  async function fetchStudents() {
    loading = true;
    clearFeedback();

    try {
      const data = await graphQLRequest(`
        query Students {
          students {
            ${studentFields}
          }
        }
      `);

      students = data.students;
    } catch (error) {
      errorMessage = error.message;
    } finally {
      loading = false;
    }
  }

  async function addStudent(event) {
    event.preventDefault();
    clearFeedback();

    let input;
    try {
      input = validateStudent({ name, grade, department, age });
    } catch (error) {
      errorMessage = error.message;
      return;
    }

    creating = true;

    try {
      const data = await graphQLRequest(
        `
          mutation CreateStudent(
            $name: String!
            $grade: String!
            $department: String!
            $age: Int!
          ) {
            createStudent(
              name: $name
              grade: $grade
              department: $department
              age: $age
            ) {
              ${studentFields}
            }
          }
        `,
        input
      );

      students = [...students, data.createStudent];
      name = "";
      grade = "";
      department = "";
      age = "";
      successMessage = `${data.createStudent.name} was added.`;
    } catch (error) {
      errorMessage = error.message;
    } finally {
      creating = false;
    }
  }

  async function updateStudent(student) {
    clearFeedback();

    let input;
    try {
      input = validateStudent(student);
    } catch (error) {
      errorMessage = error.message;
      return;
    }

    activeStudentId = student.id;
    activeAction = "update";

    try {
      const data = await graphQLRequest(
        `
          mutation UpdateStudent(
            $id: ID!
            $name: String
            $grade: String
            $department: String
            $age: Int
          ) {
            updateStudent(
              id: $id
              name: $name
              grade: $grade
              department: $department
              age: $age
            ) {
              ${studentFields}
            }
          }
        `,
        { id: student.id, ...input }
      );

      students = students.map(currentStudent =>
        currentStudent.id === student.id ? data.updateStudent : currentStudent
      );
      successMessage = `${data.updateStudent.name} was updated.`;
    } catch (error) {
      errorMessage = error.message;
    } finally {
      activeStudentId = "";
      activeAction = "";
    }
  }

  async function deleteStudent(student) {
    const confirmed = window.confirm(`Delete ${student.name}?`);
    if (!confirmed) return;

    clearFeedback();
    activeStudentId = student.id;
    activeAction = "delete";

    try {
      await graphQLRequest(
        `
          mutation DeleteStudent($id: ID!) {
            deleteStudent(id: $id) {
              id
            }
          }
        `,
        { id: student.id }
      );

      students = students.filter(currentStudent => currentStudent.id !== student.id);
      successMessage = `${student.name} was deleted.`;
    } catch (error) {
      errorMessage = error.message;
    } finally {
      activeStudentId = "";
      activeAction = "";
    }
  }
</script>

<svelte:head>
  <title>Student Management</title>
  <meta
    name="description"
    content="Create, update, filter, and manage student records."
  />
</svelte:head>

<main class="app-shell">
  <header class="hero">
    <div>
      <p class="eyebrow">Academic operations</p>
      <h1>Student Management</h1>
      <p class="hero-copy">
        Keep student records current and easy to find from one focused workspace.
      </p>
    </div>

    <div class="student-count" aria-label={`${students.length} total students`}>
      <strong>{students.length}</strong>
      <span>Total students</span>
    </div>
  </header>

  <section class="panel create-panel" aria-labelledby="add-student-heading">
    <div class="section-heading">
      <div>
        <p class="eyebrow">New record</p>
        <h2 id="add-student-heading">Add a student</h2>
      </div>
      <p>All fields are required.</p>
    </div>

    <form class="student-form" onsubmit={addStudent}>
      <label>
        <span>Name</span>
        <input
          bind:value={name}
          placeholder="e.g. Asha Rao"
          autocomplete="name"
          maxlength="100"
          required
        />
      </label>

      <label>
        <span>Grade</span>
        <input bind:value={grade} placeholder="e.g. 10" maxlength="100" required />
      </label>

      <label>
        <span>Department</span>
        <input
          bind:value={department}
          placeholder="e.g. Science"
          maxlength="100"
          required
        />
      </label>

      <label>
        <span>Age</span>
        <input
          bind:value={age}
          type="number"
          placeholder="e.g. 15"
          min="1"
          max="120"
          step="1"
          required
        />
      </label>

      <button class="primary-button" type="submit" disabled={creating}>
        {creating ? "Adding..." : "Add student"}
      </button>
    </form>
  </section>

  {#if errorMessage}
    <div class="message error-message" role="alert">
      <span>{errorMessage}</span>
      <button type="button" onclick={() => (errorMessage = "")}>Dismiss</button>
    </div>
  {/if}

  {#if successMessage}
    <div class="message success-message" role="status">
      <span>{successMessage}</span>
      <button type="button" onclick={() => (successMessage = "")}>Dismiss</button>
    </div>
  {/if}

  <section class="panel roster-panel" aria-labelledby="student-roster-heading">
    <div class="section-heading roster-heading">
      <div>
        <p class="eyebrow">Directory</p>
        <h2 id="student-roster-heading">Student roster</h2>
      </div>

      <div class="toolbar">
        <label class="filter-field">
          <span>Filter department</span>
          <input bind:value={filterDept} placeholder="Search department" />
        </label>

        <label class="sort-field">
          <span>Sort by</span>
          <select bind:value={sortBy}>
            <option value="name">Name</option>
            <option value="age">Age</option>
            <option value="department">Department</option>
          </select>
        </label>

        <button
          class="secondary-button"
          type="button"
          onclick={fetchStudents}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>
    </div>

    {#if loading}
      <div class="empty-state" role="status">Loading student records...</div>
    {:else if filteredStudents.length === 0}
      <div class="empty-state">
        <strong>No students found</strong>
        <span>
          {students.length === 0
            ? "Add the first student using the form above."
            : "Try a different department filter."}
        </span>
      </div>
    {:else}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Grade</th>
              <th>Department</th>
              <th>Age</th>
              <th><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>

          <tbody>
            {#each filteredStudents as student (student.id)}
              <tr>
                <td data-label="Name">
                  <input
                    class="table-input name-input"
                    bind:value={student.name}
                    aria-label={`Name for ${student.name}`}
                    maxlength="100"
                  />
                </td>
                <td data-label="Grade">
                  <input
                    class="table-input"
                    bind:value={student.grade}
                    aria-label={`Grade for ${student.name}`}
                    maxlength="100"
                  />
                </td>
                <td data-label="Department">
                  <input
                    class="table-input department-input"
                    bind:value={student.department}
                    aria-label={`Department for ${student.name}`}
                    maxlength="100"
                  />
                </td>
                <td data-label="Age">
                  <input
                    class="table-input age-input"
                    type="number"
                    bind:value={student.age}
                    aria-label={`Age for ${student.name}`}
                    min="1"
                    max="120"
                    step="1"
                  />
                </td>
                <td class="actions" data-label="Actions">
                  <button
                    class="update-button"
                    type="button"
                    onclick={() => updateStudent(student)}
                    disabled={activeStudentId === student.id}
                  >
                    {activeStudentId === student.id && activeAction === "update"
                      ? "Saving..."
                      : "Save"}
                  </button>
                  <button
                    class="delete-button"
                    type="button"
                    onclick={() => deleteStudent(student)}
                    disabled={activeStudentId === student.id}
                  >
                    {activeStudentId === student.id && activeAction === "delete"
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</main>
