import BaseModel from "./BaseModel.js"
import PageModel from "./PageModel.js"

class NavigationMenuModel extends BaseModel {
  static tableName = "navigation_menus"

  static relationMappings() {
    return {
      pages: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: PageModel,
        join: {
          from: "navigation_menus.id",
          through: {
            from: "rel_navigation_menus__pages.navigationMenuId",
            to: "rel_navigation_menus__pages.pageId",
          },
          to: "pages.id",
        },
      },
      parent: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: NavigationMenuModel,
        join: {
          from: "navigation_menus.parentId",
          to: "navigation_menus.id",
        },
      },
      children: {
        relation: BaseModel.HasManyRelation,
        modelClass: NavigationMenuModel,
        join: {
          from: "navigation_menus.id",
          to: "navigation_menus.parentId",
        },
      },
    }
  }
}

export default NavigationMenuModel
