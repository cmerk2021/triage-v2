/// <reference path="../pb_data/types.d.ts" />

/**
 * Triage — initial schema.
 *
 * Design goal: PocketBase stores *facts* only. All prioritization,
 * planning and recommendation logic lives in the frontend application.
 *
 * Ownership model: every record has an `owner` relation to a user, and
 * access rules restrict all reads/writes to the record owner.
 */
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    const ownerRule = "@request.auth.id != '' && owner = @request.auth.id";
    const createRule =
      "@request.auth.id != '' && @request.body.owner = @request.auth.id";

    const autodates = [
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ];

    // ── Extend the built-in users collection with app preferences ──────
    users.fields.add(new BoolField({ name: "onboardingComplete" }));
    users.fields.add(new JSONField({ name: "preferences", maxSize: 200000 }));
    app.save(users);

    // ── Semesters ──────────────────────────────────────────────────────
    const semesters = new Collection({
      type: "base",
      name: "semesters",
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: createRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        {
          name: "owner",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true,
        },
        { name: "name", type: "text", required: true, max: 120 },
        { name: "startDate", type: "date" },
        { name: "endDate", type: "date" },
        { name: "archived", type: "bool" },
        ...autodates,
      ],
    });
    app.save(semesters);

    // ── Courses ────────────────────────────────────────────────────────
    const courses = new Collection({
      type: "base",
      name: "courses",
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: createRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        {
          name: "owner",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true,
        },
        {
          name: "semester",
          type: "relation",
          maxSelect: 1,
          collectionId: semesters.id,
          cascadeDelete: false,
        },
        { name: "name", type: "text", required: true, max: 120 },
        { name: "code", type: "text", max: 40 },
        { name: "professor", type: "text", max: 120 },
        { name: "location", type: "text", max: 120 },
        { name: "meetingSchedule", type: "json", maxSize: 20000 },
        { name: "color", type: "text", max: 40 },
        { name: "icon", type: "text", max: 16 },
        { name: "archived", type: "bool" },
        ...autodates,
      ],
    });
    app.save(courses);

    // ── Assignments ──────────────────────────────────────────────────────
    const assignments = new Collection({
      type: "base",
      name: "assignments",
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: createRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        {
          name: "owner",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true,
        },
        {
          name: "course",
          type: "relation",
          maxSelect: 1,
          collectionId: courses.id,
          cascadeDelete: false,
        },
        { name: "title", type: "text", required: true, max: 200 },
        { name: "dueDate", type: "date" },
        {
          name: "estimatedMinutes",
          type: "number",
          onlyInt: true,
          min: 0,
        },
        { name: "notes", type: "editor" },
        {
          name: "attachments",
          type: "file",
          maxSelect: 10,
          maxSize: 26214400,
        },
        {
          name: "status",
          type: "select",
          maxSelect: 1,
          values: ["todo", "in_progress", "done"],
        },
        { name: "startedAt", type: "date" },
        { name: "completedAt", type: "date" },
        { name: "archived", type: "bool" },
        ...autodates,
      ],
    });
    app.save(assignments);

    // ── Subtasks ───────────────────────────────────────────────────────
    const subtasks = new Collection({
      type: "base",
      name: "subtasks",
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: createRule,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        {
          name: "owner",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true,
        },
        {
          name: "assignment",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: assignments.id,
          cascadeDelete: true,
        },
        { name: "title", type: "text", required: true, max: 200 },
        { name: "done", type: "bool" },
        { name: "position", type: "number", onlyInt: true, min: 0 },
        { name: "estimatedMinutes", type: "number", onlyInt: true, min: 0 },
        ...autodates,
      ],
    });
    app.save(subtasks);
  },
  (app) => {
    // Rollback — drop in reverse dependency order.
    for (const name of ["subtasks", "assignments", "courses", "semesters"]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {
        // already removed
      }
    }
    const users = app.findCollectionByNameOrId("users");
    for (const field of ["onboardingComplete", "preferences"]) {
      const f = users.fields.getByName(field);
      if (f) users.fields.removeById(f.id);
    }
    app.save(users);
  },
);
