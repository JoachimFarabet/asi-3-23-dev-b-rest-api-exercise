import validate from "../middlewares/validate.js"
import {
  boolValidator,
  contentValidator,
  limitValidator,
  orderValidator,
  pageValidator,
  stringValidator,
  titleValidator,
} from "../validators.js"
import PageModel from "../db/models/PageModel.js"
import auth from "../middlewares/auth.js"
import UserModel from "../db/models/UserModel.js"

const preparePagesRoutes = ({ app }) => {
  app.post(
    "/create-page",
    auth,
    validate({
      body: {
        title: titleValidator.required(),
        content: contentValidator.required(),
        url: stringValidator,
        publish: boolValidator.default(false),
      },
    }),
    async (req, res) => {
      const { title, content, url, publish } = req.locals.body
      const userId = req.locals.session.user.id
      const loggedUser = await UserModel.query()
        .findById(userId)
        .withGraphFetched("role")

      if (loggedUser.role.permissions.users === "ru") {
        res.status(403).send({
          error: "You do not have the permissions to create a page.",
        })

        return
      }

      const findPage = await PageModel.query().findOne({ title })

      if (findPage) {
        res.status(409).send({
          error: "Another page has the same title as the one you are creating.",
        })

        return
      }

      const newPage = await PageModel.query()
        .insert({
          title,
          content,
          url: url
            ? url
            : `:3000/pages/${title.trim().toLowerCase().replace(/\s+/g, "-")}`,
          status: publish ? "published" : "draft",
          authorId: userId,
          createdAt: new Date().toISOString(),
        })
        .returning("*")

      res.status(200).send({
        info: "You have successfully created this page.",
        result: newPage,
      })
    }
  )
  app.get(
    "/pages",
    validate({
      query: {
        limit: limitValidator.default(10),
        page: pageValidator.default(1),
        order: orderValidator.default("desc"),
        title: titleValidator,
      },
    }),
    async (req, res) => {
      const { limit, page, sort_by, order, title } = req.locals.query

      const query = PageModel.query()

      if (title) {
        query.where("title", "like", `%${title}%`)
      }

      const [count, pages] = await Promise.all([
        query.resultSize(),
        query
          .orderBy(sort_by, order)
          .page(page - 1, limit)
          .withGraphFetched("author(role)"),
      ])

      res.status(200).send({
        total: count,
        per_page: limit,
        current_page: page,
        data: pages,
      })
    }
  )

  app.get("/pages/:id", async (req, res) => {
    const { id } = req.params

    const page = await PageModel.query()
      .findById(id)
      .withGraphFetched("author(role)")

    if (!page) {
      res.status(404).send({
        error: "Page not found.",
      })

      return
    }

    res.status(200).send(page)
  })

  app.put(
    "/pages/:id",
    auth,
    validate({
      body: {
        title: titleValidator.required(),
        content: contentValidator.required(),
        url: stringValidator,
        status: stringValidator.oneOf(["draft", "published"]).default("draft"),
      },
    }),
    async (req, res) => {
      const { title, content, url, status } = req.locals.body
      const { id } = req.params
      const userId = req.locals.session.user.id
      const loggedUser = await UserModel.query()
        .findById(userId)
        .withGraphFetched("role")

      if (loggedUser.role.permissions.users === "ru") {
        res.status(403).send({
          error: "You do not have the permissions to update this page.",
        })

        return
      }

      const existingPage = await PageModel.query().findById(id)

      if (!existingPage) {
        res.status(404).send({
          error: "Page not found.",
        })

        return
      }

      const sameTitlePage = await PageModel.query()
        .where("title", title)
        .whereNot("id", id)
        .first()

      if (sameTitlePage) {
        res.status(409).send({
          error: "Another page has the same title as the one you are updating.",
        })

        return
      }

      const updatedPage = await PageModel.query()
        .patchAndFetchById(id, {
          title,
          content,
          url: url || existingPage.url,
          status,
          updatedAt: new Date().toISOString(),
        })
        .withGraphFetched("author(role)")

      res.status(200).send({
        info: "You have successfully updated this page.",
        result: updatedPage,
      })
    }
  )
}

export default preparePagesRoutes
