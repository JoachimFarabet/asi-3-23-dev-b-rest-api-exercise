import jsonwebtoken from "jsonwebtoken"
import config from "../config.js"
import hashPassword from "../db/hashPassword.js"
import UserModel from "../db/models/UserModel.js"
import RoleModel from "../db/models/RoleModel.js"
import validate from "../middlewares/validate.js"
import {
  emailValidator,
  idValidator,
  passwordValidator,
  stringValidator,
} from "../validators.js"

const prepareUsersRoutes = ({ app }) => {
  app.post(
    "/create-users",
    validate({
      body: {
        email: emailValidator.required(),
        password: passwordValidator.required(),
        firstName: stringValidator.required(),
        lastName: stringValidator.required(),
        roleId: idValidator.required(),
      },
    }),
    async (req, res) => {
      const { email, password, firstName, lastName, roleId } = req.locals.body

      const existingUser = await UserModel.query().findOne({ email })

      if (existingUser) {
        res.status(400).send({ error: "User already exists" })

        return
      }

      const [passwordHash, passwordSalt] = await hashPassword(password)

      const user = await UserModel.query().insert({
        email,
        passwordHash,
        passwordSalt,
        firstName,
        lastName,
        roleId,
      })

      res.status(201).send({ user })
    }
  )

  app.post("/login", async (req, res) => {
    const { email, password } = req.body

    const user = await UserModel.query()
      .findOne({ email })
      .withGraphFetched("role")

    if (!user) {
      res.status(401).send({ error: "Invalid email or password" })

      return
    }

    const [passwordHash] = await hashPassword(password, user.passwordSalt)

    if (passwordHash !== user.passwordHash) {
      res.status(401).send({ error: "Invalid credentials." })

      return
    }

    const jwt = jsonwebtoken.sign(
      {
        payload: {
          user: {
            id: user.id,
            role: user.role,
          },
        },
      },
      config.security.jwt.secret,
      config.security.jwt.options
    )

    res.send({ token: jwt })
  })

  app.get("/users", async (req, res) => {
    const { limit = 10, page = 1 } = req.query

    const users = await UserModel.query()
      .withGraphFetched("role")
      .paginate(limit, page)

    res.send({ users })
  })

  app.get("/users/:id", async (req, res) => {
    const { id } = req.params

    const user = await UserModel.query().findById(id).withGraphFetched("role")

    if (!user) {
      res.status(404).send({ error: "User not found" })

      return
    }

    res.send({ user })
  })

  app.put(
    "/users/:id",
    validate({
      body: {
        email: emailValidator,
        password: passwordValidator,
        firstName: stringValidator,
        lastName: stringValidator,
        roleId: stringValidator,
      },
    }),
    async (req, res) => {
      const { id } = req.params
      const { email, password, firstName, lastName, roleId } = req.locals.body

      const user = await UserModel.query().findById(id)

      if (!user) {
        res.status(404).send({ error: "User not found" })

        return
      }

      if (email) {
        const existingUser = await UserModel.query()
          .findOne({ email })
          .whereNot({ id })

        if (existingUser) {
          res.status(400).send({ error: "Email is already taken" })

          return
        }
      }

      if (password) {
        const [passwordHash, passwordSalt] = await hashPassword(password)

        user.passwordHash = passwordHash
        user.passwordSalt = passwordSalt
      }

      if (firstName) {
        user.firstName = firstName
      }

      if (lastName) {
        user.lastName = lastName
      }

      if (roleId) {
        const role = await RoleModel.query().findById(roleId)

        if (!role) {
          res.status(400).send({ error: "Invalid role id" })

          return
        }

        user.roleId = roleId
      }

      const updatedUser = await user.$query().withGraphFetched("role")

      res.send({ user: updatedUser })
    }
  )
}

export default prepareUsersRoutes
