import validate from "../middlewares/validate.js"
import { idValidator, stringValidator, titleValidator } from "../validators.js"
import auth from "../middlewares/auth.js"
import NavigationMenuModel from "../db/models/NavigationMenuModel.js"
import UserModel from "../db/models/UserModel.js"

const prepareNavigationMenuRoutes = ({ app }) => {
  app.post(
    "/create-navigation-menu",
    auth,
    validate({
      body: {
        name: titleValidator.required(),
      },
    }),
    async (req, res) => {
      const { name } = req.locals.body
      const userId = req.locals.session.user.id
      const loggedUser = await UserModel.query()
        .findById(userId)
        .withGraphFetched("role")

      if (loggedUser.role.permissions.users === "r") {
        res.status(403).send({
          error: "You do not have the permissions to create a navigation menu.",
        })

        return
      }

      const findNavMenu = await NavigationMenuModel.query().findOne({ name })

      if (findNavMenu) {
        res.status(409).send({
          error:
            "Another navigation menu has the same name as the one you are creating.",
        })

        return
      }

      const pages = JSON.stringify([])
      const newNavMenu = await NavigationMenuModel.query()
        .insert({ name, pages })
        .returning("*")

      res.send({
        info: "You have successfully created this navigation menu.",
        result: newNavMenu,
      })
    }
  )
  app.patch(
    "/update-navigation-menu/:id",
    auth,
    validate({
      params: {
        id: idValidator.required(),
      },
      body: {
        name: titleValidator,
        pages: stringValidator,
      },
    }),
    async (req, res) => {
      const { id } = req.params
      const { name, pages } = req.locals.body
      const userId = req.locals.session.user.id
      const loggedUser = await UserModel.query()
        .findById(userId)
        .withGraphFetched("role")

      if (loggedUser.role.permissions.users === "r") {
        res.status(403).send({
          error: "You do not have the permissions to update a navigation menu.",
        })

        return
      }

      const existingNavMenu = await NavigationMenuModel.query().findById(id)

      if (!existingNavMenu) {
        res.status(404).send({
          error: "Navigation menu not found.",
        })

        return
      }

      const updatedNavMenu = await existingNavMenu
        .$query()
        .patchAndFetch({ name, pages })

      res.send({
        info: "You have successfully updated this navigation menu.",
        result: updatedNavMenu,
      })
    }
  )
  app.get("/navigation-menus", async (req, res) => {
    const { limit, page, sort_by, order, name } = req.query

    const query = NavigationMenuModel.query()

    if (name) {
      query.where("name", "like", `%${name}%`)
    }

    const [count, menus] = await Promise.all([
      query.resultSize(),
      query.orderBy(sort_by, order).page(page - 1, limit),
    ])

    res.send({
      total: count,
      per_page: limit,
      current_page: page,
      data: menus,
    })
  })
}

export default prepareNavigationMenuRoutes
