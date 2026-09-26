/// <reference path="../pb_data/types.d.ts" />

/**
 * Courses default to accepting late work when no explicit policy is stored.
 * The frontend preserves that default for existing records during mapping.
 */
migrate(
  (app) => {
    const courses = app.findCollectionByNameOrId("courses");
    courses.fields.add(new BoolField({ name: "acceptsLateWork" }));
    app.save(courses);
  },
  (app) => {
    const courses = app.findCollectionByNameOrId("courses");
    const field = courses.fields.getByName("acceptsLateWork");
    if (field) courses.fields.removeById(field.id);
    app.save(courses);
  },
);
