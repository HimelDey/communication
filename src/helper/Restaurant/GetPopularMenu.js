
import MenuModel from "../../models/Restaurant/Menu.js";

const GetPopularMenu = async (rest_id) => {
  try {
    let popular_menu;

    popular_menu = await MenuModel.aggregate([
      { $match: { restaurant_id: rest_id, is_populer: 1 , menu_time_slots_map: { $ne: [] }} },
      //Menu Timing Check
      {
        $lookup: {
          from: "menu_item_and_menu_item_time_slots",
          localField: "_id",
          foreignField: "menu_item_id",
          as: "menu_time_slots_map",
          pipeline: [
            {
              $match: {
                menu_time_slots: { $ne: [] },
              },
            },
            {
              $lookup: {
                from: "menu_item_time_slots",
                localField: "menu_item_time_slot_id",
                foreignField: "_id",
                as: "menu_time_slots",
                pipeline: [
                  {
                    $set: {
                      start: {
                        $dateFromParts: {
                          isoWeekYear: { $isoWeekYear: new Date() },
                          isoWeek: { $isoWeek: new Date() },
                          isoDayOfWeek: { $isoDayOfWeek: new Date() },
                          hour: "$start_time.hour",
                          minute: "$start_time.minute",
                        },
                      },
                      close: {
                        $dateFromParts: {
                          isoWeekYear: { $isoWeekYear: new Date() },
                          isoWeek: { $isoWeek: new Date() },
                          isoDayOfWeek: { $isoDayOfWeek: new Date() },
                          hour: "$end_time.hour",
                          minute: "$end_time.minute",
                        },
                      },
                    },
                  },
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $lte: ["$start", new Date()],
                          },
                          {
                            $gt: ["$end", new Date()],
                          },
                        ],
                      },
                      //   start: { $lte: new Date() },
                      //   end: { $gt: new Date() },
                    },
                  },
                ],
              },
            },
            {
              $group: {
                _id: "$menu_item_id",
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: "variations",
          localField: "_id",
          foreignField: "menu_id",

          pipeline: [
            {
              $lookup: {
                from: "addon_category",
                localField: "_id",
                foreignField: "variation_id",
                pipeline: [
                  {
                    $lookup: {
                      from: "addon_list",
                      localField: "_id",
                      foreignField: "addoncat_id",

                      as: "add_on_list",
                    },
                  },
                ],
                as: "add_on_category",
              },
            },
          ],

          as: "variations",
        },
      },
      {$project:{
          _id:1,
          category_id:1,
          restaurant_id:1,
          menu_name:1,
          menu_price:1,
          description:1,
          image:1,
          check_add_ons:1,
              has_variation:1,
              variation_group_desc:1,
              variation_group_name:1,
          is_populer:1,
          is_active:1,
          sd:1,
          vat:1,
          is_available: {     $cond: {
              if: { $size: "$menu_time_slots_map" },
              then: true,
              else: false
            } },
              variations:1
        }}
    ]);

    return popular_menu;

  } catch (error) {
    console.log(error);
    return false;
  }
};
export default GetPopularMenu;
