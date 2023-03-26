import BaseModel from "./BaseModel.js"
import UserModel from "./UserModel.js"

class PageModel extends BaseModel {
  static tableName = "pages"

  static modifiers = {
    paginate: (query, limit, page) => {
      return query.limit(limit).offset((page - 1) * limit)
    },
  }

  static relationMappings() {
    return {
      author: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: UserModel,
        join: {
          from: "pages.authorId",
          to: "users.id",
        },
        modify: (query) => query.select("*"),
      },
      editors: {
        relation: BaseModel.HasManyRelation,
        modelClass: UserModel,
        join: {
          from: "pages.editorId",
          to: "users.id",
        },
        modify: (query) => query.select("*"),
      },
    }
  }
}

export default PageModel
