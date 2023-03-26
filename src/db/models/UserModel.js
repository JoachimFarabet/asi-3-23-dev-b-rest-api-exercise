import BaseModel from "./BaseModel.js"
import PageModel from "./PageModel.js"
import RoleModel from "./RoleModel.js"

class UserModel extends BaseModel {
  static tableName = "users"

  static modifiers = {
    paginate: (query, limit, page) => {
      return query.limit(limit).offset((page - 1) * limit)
    },
  }

  static relationMappings() {
    return {
      role: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: RoleModel,
        join: {
          from: "users.roleId",
          to: "roles.id",
        },
        modify: (query) => query.select("*"),
      },
      created: {
        relation: BaseModel.HasManyRelation,
        modelClass: PageModel,
        join: {
          from: "users.id",
          to: "pages.authorId",
        },
        modify: (query) => query.select("*"),
      },
      edited: {
        relation: BaseModel.HasManyRelation,
        modelClass: PageModel,
        join: {
          from: "users.roleId",
          to: "pages.editorId",
        },
        modify: (query) => query.select("*"),
      },
    }
  }
}

export default UserModel
