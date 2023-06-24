import RestaurentModel from "../../models/Restaurant/RestaurentModel.js";
import MenuModel from "../../models/Restaurant/Menu.js";
import RestaurantDistance from "../../helper/Restaurant/RestaurantDistance.js";
import { res_basic_data } from "../../utility/const.js";

const dine_GetView = async (rest_id, user_lat, user_long,user_id) => {
  try {
    let restaurant;
      const today = new Date().getDay() + 1;

       restaurant = await RestaurentModel.aggregate([
          { $match: { _id: rest_id, is_active: true, is_dine: true } },
          {
              $facet: {
                  basic_data:[
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
                              from: "dine_in_cards",
                              localField: "_id",
                              foreignField: "branch_id",
                              pipeline: [
                                  { $match: { branch_id: rest_id } },
                                   {$project:{is_active:1,name:1,images:1,thumbnail_image:1}}
                              ],
                              as: "dine_in_cards",

                          },
                      },
                      {
                          $lookup: {
                              from: "voucher_settings",
                              foreignField: "restaurants.res_id",
                              localField: "_id",
                              pipeline: [
                                  { $match: { is_active:true,is_dine:true } },

                                  {$project:{_id:1,name:1,image:1,notes:1,description:1,users_coupon:1}},
                                  {$sort:{created_at:-1}},
                                  {$limit:1},
                              ],
                              as: "vouchers",

                          },
                      },
                      {
                          $lookup: {
                              from: "customer_coupon",
                              localField: "_id",
                              foreignField: "restaurant_id",
                              pipeline: [
                                  {$match:{customer_id:user_id,restaurant_id:rest_id,is_dine:true}},
                                  {$sort:{created_at:-1}},
                                  {$limit:1},
                                  {
                                      $lookup: {
                                          from: "coupons",
                                          localField: "coupon_id",
                                          foreignField: "_id",
                                          pipeline: [
                                              {
                                                  $match: {
                                                      is_active: true,
                                                      is_dine: true,
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
                                                  $limit: 1,
                                              },
                                              {
                                                  $project: {
                                                      _id: 1,
                                                      name: 1,
                                                      description: 1,
                                                      start_time: 1,
                                                      end_time: 1,
                                                  },
                                              },
                                          ],
                                          as: "users_coupon",
                                      },
                                  },
                                  //{$project:{users_coupon:1}},
                                  //  { $project: { users_coupon: { $arrayElemAt: ["$users_coupon", 0] } } },
                                  //  { $replaceRoot: { newRoot: "$users_coupon" } },
                              ],
                              as: "customer_coupons",
                          },
                      },
                      {
                          $project: {
                              ...res_basic_data,
                              dine_in_cards: "$dine_in_cards",
                              vouchers: "$vouchers",
                              users_coupon: {
                                  $cond: [
                                      {
                                          $eq: [
                                              { $size: "$customer_coupons" },
                                              0
                                          ]
                                      },
                                      [],
                                      { $ifNull: [ { $arrayElemAt: ["$customer_coupons.users_coupon", 0] }, [] ] }
                                  ]
                              }
                          },
                      },
                  ],
                  opening_hours: [
                      { $unwind: "$working_hours" },
                      {
                          $addFields: {
                              day: {
                                  $switch: {
                                      branches: [
                                          { case: { $eq: ["$working_hours.day", 1] }, then: "Sunday" },
                                          { case: { $eq: ["$working_hours.day", 2] }, then: "Monday" },
                                          { case: { $eq: ["$working_hours.day", 3] }, then: "Tuesday" },
                                          { case: { $eq: ["$working_hours.day", 4] }, then: "Wednesday" },
                                          { case: { $eq: ["$working_hours.day", 5] }, then: "Thursday" },
                                          { case: { $eq: ["$working_hours.day", 6] }, then: "Friday" },
                                          { case: { $eq: ["$working_hours.day", 7] }, then: "Saturday" },
                                      ],
                                  },
                              },
                          },
                      },
                      {
                          $group: {
                              _id: "$day",
                              open_hours: {
                                  $push: {
                                      $concat: [
                                          { $toString: "$working_hours.open_hour" },
                                          ":",
                                          { $toString: "$working_hours.open_minute" },
                                          " - ",
                                          { $toString: "$working_hours.close_hour" },
                                          ":",
                                          { $toString: "$working_hours.close_minute" },
                                      ],
                                  },
                              },

                          },
                      },
                      // {
                      //     $sort: { '$working_hours.day': 1 }
                      // },
                      {
                          $project:{
                              open_hours:{$arrayElemAt:["$open_hours",0]},
                          }
                      }


                  ],
                  open_today: [
                      { $unwind: "$working_hours" },
                      { $match: { "working_hours.day": today } },
                      {
                          $group: {
                              _id: today,
                              open_hours: {
                                  $push: {
                                      $concat: [
                                          { $toString: "$working_hours.open_hour" },
                                          ":",
                                          { $toString: "$working_hours.open_minute" },
                                          " - ",
                                          { $toString: "$working_hours.close_hour" },
                                          ":",
                                          { $toString: "$working_hours.close_minute" },
                                      ],
                                  },
                              },
                          },
                      },
                      {
                          $project:{
                              open_hours:{$arrayElemAt:["$open_hours",0]}
                          }
                      }
                  ],

              },
          },
      ]);



      // return restaurant;
    let rest_lat = parseFloat(restaurant[0].basic_data[0].location.coordinates[1]);
    let rest_long = parseFloat(restaurant[0].basic_data[0].location.coordinates[0]);
    let distance = await RestaurantDistance(user_lat, user_long, rest_lat, rest_long);
      restaurant[0].basic_data[0].distance=  distance.text;
    return {

      restaurant: {
          basic_data:restaurant[0].basic_data[0]?restaurant[0].basic_data[0]:[],
          opening_hours:restaurant[0].opening_hours[0]?restaurant[0].opening_hours[0]:[],
          open_today:restaurant[0].open_today[0]?restaurant[0].open_today[0]:[],
      },
    };
  } catch (error) {
    console.log(error);
    return false;
  }
};
export default dine_GetView;
