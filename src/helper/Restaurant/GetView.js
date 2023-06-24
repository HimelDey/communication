import RestaurentModel from "../../models/Restaurant/RestaurentModel.js";
import MenuModel from "../../models/Restaurant/Menu.js";
import RestaurantDistance from "../../helper/Restaurant/RestaurantDistance.js";
import { res_basic_data } from "../../utility/const.js";

const GetView = async (rest_id, user_lat, user_long,user_id) => {
  try {
    let restaurant, populer_menu;

    restaurant = await RestaurentModel.aggregate([
      { $match: { _id: rest_id } },
      {
        $lookup: {
          from: "favourite_restaurants",
          localField: "_id",
          foreignField: "branch_id",
          pipeline: [
            { $match: { customer_id: user_id } },
          ],
          as: "is_favourite",

        },
      },
      {
        $lookup: {
          from: "branch_coupons",
          localField: "_id",
          foreignField: "branch_id",
          pipeline: [
            {
              $lookup: {
                from: "coupons",
                localField: "coupon_id",
                foreignField: "_id",
                pipeline: [
                  {
                    $match: {
                      is_active: true,
                      start_time: {
                        $lte: new Date(),
                      },
                      end_time: {
                        $gte: new Date(),
                      },
                    },
                  },
                  {
                    $sort: {
                      created_at: -1,
                    },
                  },
                  {
                    $limit: 2,
                  },
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      description:1
                    },
                  },
                ],
                as: "branch_coupons",
              },
            },
            { $unwind: "$branch_coupons" },
            {
              $project: {
                branch_coupons: 1,
              },
            },
          ],
          as: "coupons",
        },
      },
      {
        $lookup: {
          from: "branch_coupons",
          localField: "_id",
          foreignField: "branch_id",
          pipeline: [
            {
              $lookup: {
                from: "coupons",
                localField: "coupon_id",
                foreignField: "_id",
                pipeline: [
                  {
                    $match: {
                      is_active: true,
                      start_time: {
                        $lte: new Date(),
                      },
                      end_time: {
                        $gte: new Date(),
                      },
                    },
                  },
                  {
                    $sort: {
                      created_at: -1,
                    },
                  },

                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      description:1
                    },
                  },
                ],
                as: "branch_coupons",
              },

            },
            { $unwind: "$branch_coupons" },
            {

              $project: {
                _id: 0,
                branch_coupons: 1,
              },
            },
            {
              $limit: 1,
            },
          ],
          as: "promo_code",
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "rest_id",
          pipeline: [
            {
              $group: {
                _id: "$rest_id",
                avg: { $avg: "$rating" },
                no_review: { $sum: 1 },
              },
            },
            {
              $project: {
              _id: 0 ,
                avg: { $round: [ "$avg", 1 ] },
                no_review:1
            }
            },
          ],
          as: "rating",
        },
      },

      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "restaurant_id",

          pipeline: [

            {
              $lookup: {
                from: "restaurant_menus",
                localField: "_id",
                foreignField: "category_id",

                pipeline: [
                  { $match:
                        {
                          menu_time_slots_map: { $ne: [] },
                          restaurant_id: rest_id

                        } },
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
                      is_populer:1,
                      has_variation:1,
                      check_add_ons:1,
                      variation_group_name:1,
                      variation_group_desc:1,
                      is_active:1,
                      sd:1,
                      vat:1,
                      variations:1,
                      is_available: {     $cond: {
                          if: { $size: "$menu_time_slots_map" },
                          then: true,
                          else: false
                        } },
                    }}
                ],


                as: "menu_data",
              },
            },


          ],

          as: "categories",
        },

      },


      {
        $project: {

          ...res_basic_data,
          coupons: "$coupons.branch_coupons",
          promo_code: "$promo_code.branch_coupons",


        },
      },
    ]);

    populer_menu = await MenuModel.aggregate([
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
          variation_group_name:1,
          variation_group_desc:1,
          is_populer:1,
          is_active:1,
          has_variation:1,
          variations:1,
          sd:1,
          vat:1,
          is_available: {     $cond: {
              if: { $size: "$menu_time_slots_map" },
              then: true,
              else: false
            } },
        }}
    ]);

    //  console.log("length", populer_menu.length);

    let populer = {
      _id: -1,
      category_name: "Popular",
      menu_data: populer_menu,
    };
    if (populer_menu.length > 0) {
      restaurant[0].categories.splice(0, 0, populer);
    }

    let rest_lat = parseFloat(restaurant[0].location.coordinates[1]);
    let rest_long = parseFloat(restaurant[0].location.coordinates[0]);
    let distance = await RestaurantDistance(user_lat, user_long, rest_lat, rest_long);
    return {
        distance: distance.text ,
      restaurant: restaurant[0],
    };
  } catch (error) {
    console.log(error);
    return false;
  }
};
export default GetView;
