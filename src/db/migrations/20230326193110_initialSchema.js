export const up = async (knex) => {
  await knex.schema
    .createTable("roles", (table) => {
      table.increments("id")
      table.text("name").notNullable()
      table.json("permissions").notNullable()
    })
    .then(() =>
      knex("roles").insert([
        {
          id: 1,
          name: "admin",
          permissions: {
            users: "crud",
            roles: "crud",
            pages: "crud",
            navigationMenus: "crud",
          },
        },
        {
          id: 2,
          name: "manager",
          permissions: {
            users: "",
            roles: "",
            pages: "crud",
            navigationMenus: "crud",
          },
        },
        {
          id: 3,
          name: "editor",
          permissions: {
            users: "",
            roles: "",
            pages: "crud",
            navigationMenus: "r",
          },
        },
      ])
    )

  await knex.schema.createTable("users", (table) => {
    table.increments("id")
    table.text("email").notNullable().unique()
    table.text("passwordHash").notNullable()
    table.text("passwordSalt").notNullable()
    table.text("firstName").notNullable()
    table.text("lastName").notNullable()
    table
      .integer("roleId")
      .unsigned()
      .references("id")
      .inTable("roles")
      .notNullable()
    table.timestamps(true, true)
  })

  await knex.schema.createTable("pages", (table) => {
    table.increments("id")
    table.text("title").notNullable()
    table.text("content").notNullable()
    table.text("url").unique().notNullable()
    table
      .integer("creatorId")
      .unsigned()
      .references("id")
      .inTable("users")
      .notNullable()
    table.json("modifiers").notNullable()
    table.dateTime("publishedAt").notNullable()
    table.text("status").notNullable()
    table.timestamps(true, true)
  })

  await knex.schema.createTable("navigationMenus", (table) => {
    table.increments("id")
    table.text("name").notNullable()
    table.json("menuItems").notNullable()
    table.timestamps(true, true)
  })
}

export const down = async (knex) => {
  await knex.schema.dropTable("navigationMenus")
  await knex.schema.dropTable("pages")
  await knex.schema.dropTable("roles")
  await knex.schema.dropTable("users")
}
