import prepareUsersRoutes from "./routes/prepareUsersRoutes.js"
import prepareNavigationMenuRoutes from "./routes/prepareNavigationMenuRoutes.js"
import preparePageRoutes from "./routes/preparePageRoutes.js"

const prepareRoutes = (ctx) => {
  prepareUsersRoutes(ctx)
  prepareNavigationMenuRoutes(ctx)
  preparePageRoutes(ctx)
}

export default prepareRoutes
