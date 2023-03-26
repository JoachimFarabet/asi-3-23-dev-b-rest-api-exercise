import BaseModel from "./BaseModel.js"
import UserModel from "./UserModel.js"

class RoleModel extends BaseModel {
  static tableName = "roles"

  static relationMappings() {
    return {
      user: {
        relation: BaseModel.HasManyRelation,
        modelClass: UserModel,
        join: {
          from: "roles.id",
          to: "users.roleId",
        },
        modify: (query) => query.select("*"),
      },
    }
  }
}

export default RoleModel
