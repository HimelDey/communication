import RestaurentModel from "../../models/Restaurant/RestaurentModel.js";
export const GetReviewList = async (rest_id,sort_by,lim,page) => {
  try {
      let  limit=lim>0?lim:15;
    let skipRow = (page - 1) * limit;
      let sort_stage ;
      if (sort_by === "latest") {
          sort_stage = { $sort: { created_at: -1 ,_id:-1} };
      }
      if (sort_by === "oldest") {
          sort_stage = { $sort: { created_at: 1 ,_id:-1} };
      }
      if (sort_by === "highest_rating") {
          sort_stage = { $sort: { rating: -1,_id:-1 } };
      }
      if (sort_by === "lowest_rating") {
          sort_stage = { $sort: {rating: 1 ,_id:-1} };
      }

   const get_data = await RestaurentModel.aggregate([
      {
        $match: { _id: rest_id },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "rest_id",
          pipeline: [
            {
              $group: {
                _id: { rest_id: "$rest_id", rating: "$rating" },
                count: { $sum: 1 },
                totalRatings: { $sum: "$rating" },
              },
            },
            {
              $group: {
                _id: "$_id.rest_id",
                counts: { $push: { rating: "$_id.rating", count: "$count"} },
                totalItemCount: { $sum: "$count" },
                totalRating: {$sum:{ $multiply: [ "$_id.rating", "$count" ] }}
              },
            },

            {
              $project: {
                _id: "$_id",
                avgRating: {  $round :[{$divide: ["$totalRating", "$totalItemCount"] },1]},
                totalItemCount: "$totalItemCount",
                totalRating: "$totalRating",
                counts: "$counts",

              },
            },

          ],
          as: "review_details",
        },
      },

       {
           $lookup: {
               from: "reviews",
               localField: "_id",
               foreignField: "rest_id",
               pipeline: [

                   {
                       $lookup: {
                           from: "helpful_reviews",
                           localField: "_id",
                           foreignField: "review_id",
                           pipeline:[
                               {
                                   $group: {
                                       _id: {review_id: "$review_id"},
                                       count: {$sum: 1},
                                   },

                               },
                               {
                                   $project: {
                                       _id: 0,
                                       count: 1
                                   }
                               }

                           ],
                           as:'helpful_count',
                       }
                   },
                   {$addFields:{help_count:{ $arrayElemAt: ["$helpful_count", 0] }}},
                   {
                       $project: {
                           name: 1,
                           review: 1,
                           helpful_count: { $ifNull: ["$help_count.count", 0] },
                           created_at: {
                               $dateToString: {
                                   format: "%Y-%m-%d %H:%M",
                                   date: "$created_at",
                                   timezone: "Asia/Dhaka"
                               }
                           },
                           short_name: {
                               $concat: [
                                   { $toUpper: { $substrCP: ["$name", 0, 1] } },
                                   { $toUpper: { $substrCP: ["$name", { $add: [{ $indexOfBytes: ["$name", " "] }, 1] }, 1] } }
                               ]
                           },
                           rating: 1
                       }
                   },
                   sort_stage,
                   {$limit:limit },
                   { $skip: skipRow }

               ],
               as: "review_list",
           },
       },
      {
        $project: {
          _id: 1,
          name: 1,
          address: 1,
          avg: 1,
          review_details: {
            $map: {
              input: "$review_details",
              in: {
                _id: "$$this._id",
                counts: "$$this.counts",
                reviews: "$review_list",
                totalItemCount: "$$this.totalItemCount",
                totalRating: "$$this.totalRating",
                avgRating: "$$this.avgRating",
              }
            },
          }
        },
      },


    ]);

      return get_data;
  } catch (error) {
    return { status: "fail", error: error.toString() };
  }
};
