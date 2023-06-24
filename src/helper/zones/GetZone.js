import Zone from "../../models/Zone/Zone.js";
import { res_basic_data } from "../../utility/const.js";

// export const GetYourRestaurant = async (user_id, lat, long) => {
//   try {
//     let get_zone;
//
//     get_zone = await Zone.aggregate([
//       {
//         $match: {
//           lat_long: {
//             $geoIntersects: {
//               $geometry: {
//                 type: "Point",
//                 coordinates: [long, lat],
//               },
//             },
//           },
//         },
//       },
//
//       {
//         $lookup: {
//           from: "restaurents",
//           localField: "_id",
//           foreignField: "zone_id._id",
//
//
//           as: "restaurants",
//         },
//       },
//       {
//         $lookup: {
//           from: "order_masters",
//           localField: "restaurents._id",
//           foreignField: "order_masters.branch_id",
//           pipeline: [
//             { $match: { customer_id: user_id } },
//             {
//               $lookup: {
//                 from: "restaurents",
//                 localField: "branch_id",
//                 foreignField: "_id",
//                 pipeline: [
//
//                   {
//                     $lookup: {
//                       from: "favourite_restaurants",
//                       localField: "_id",
//                       foreignField: "branch_id",
//                       pipeline: [
//                         { $match: { customer_id: user_id } },
//                       ],
//                       as: "is_favourite",
//
//                     },
//                   },
//                   {
//                     $lookup: {
//                       from: "cuisines",
//                       localField: "cuisines.cuisine_id",
//                       foreignField: "_id",
//                       as: "cuisines_details",
//                     },
//                   },
//
//                   {
//                     $lookup: {
//                       from: "branch_coupons",
//                       localField: "_id",
//                       foreignField: "branch_id",
//                       pipeline: [
//                         {
//                           $lookup: {
//                             from: "coupons",
//                             localField: "coupon_id",
//                             foreignField: "_id",
//                             pipeline: [
//                               {
//                                 $match: {
//                                   is_active: true,
//                                   start_time: {
//                                     $lte: new Date(),
//                                   },
//                                   end_time: {
//                                     $gte: new Date(),
//                                   },
//                                 },
//                               },
//                               {
//                                 $sort: {
//                                   created_at: -1,
//                                 },
//                               },
//                               {
//                                 $limit: 2,
//                               },
//                               {
//                                 $project: {
//                                   _id: 1,
//                                   name: 1,
//                                   description:1
//                                 },
//                               },
//                             ],
//                             as: "branch_coupons",
//                           },
//                         },
//                         { $unwind: "$branch_coupons" },
//                         {
//                           $project: {
//                             branch_coupons: 1,
//                           },
//                         },
//                       ],
//                       as: "coupons",
//                     },
//                   },
//                   {
//                     $lookup: {
//                       from: "reviews",
//                       localField: "_id",
//                       foreignField: "rest_id",
//                       pipeline: [
//                         {
//                           $group: {
//                             _id: "$rest_id",
//                             avg: { $avg: "$rating" },
//                             no_review: { $sum: 1 },
//                           },
//                         },
//                         {
//                           $project: {
//                             _id: 0 ,
//                             avg: { $round: [ "$avg", 1 ] },
//                             no_review:1
//                           }
//                         },
//                       ],
//                       as: "rating",
//                     },
//                   },
//
//                   {
//                     $project: {
//                       ...res_basic_data,
//                       coupons: "$coupons.branch_coupons",
//
//                     },
//                   },
//                 ],
//                 as: "your_restaurants",
//               },
//             },
//
//
//
//           ],
//           as: "orders",
//         },
//       },
//
//
//
//         { $project: { _id:0,restaurants: { $arrayElemAt: ["$orders.your_restaurants", 0] } } },
//
//         {$unwind:"$restaurants"},
//         {$replaceRoot:{newRoot:"$restaurants"}}
//     ]);
//
//     return get_zone;
//   } catch (error) {
//     return { status: "fail", data: error.toString() };
//   }
// };

export const getZone = async (lat, long) => {
  try {
    let get_zone;

      get_zone = await Zone.aggregate([
          {
              $match: {
                  lat_long: {
                      $geoIntersects: {
                          $geometry: {
                              type: "Point",
                              coordinates: [long, lat],
                          },
                      },
                  },
              },
          },
          { $project: { _id: 1, area_name: 1 } },
          { $match: { area_name: { $exists: true, $ne: null } } }
      ]);

      return get_zone;

  } catch (err) {
    console.error(err);
    return false;
  }
};
