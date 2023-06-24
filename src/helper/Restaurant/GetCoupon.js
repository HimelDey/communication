import CustomerCoupon from "../../models/Coupon/CustomerCoupon.js";
import SaveVoucher from "../../models/Coupon/SaveVoucher.js";
import VoucherSetting from "../../models/Rewards/VoucherSetting.js";
import EarnBurnHistory from "../../models/Rewards/EarnBurnHistory.js";

export const GetUserCouponList = async (customer_id) => {
  try {
    let customer_coupon, saved_voucher;

    customer_coupon = await CustomerCoupon.aggregate([
      { $match: { customer_id: customer_id } },
      {
        $facet: {
          current_coupon: [
            {
              $lookup: {
                from: "coupons",
                localField: "coupon_id",
                foreignField: "_id",
                pipeline: [{ $match: { is_active: true, end_time: { $gte: new Date() } } }],
                as: "coupon",
              },
            },

            { $project: { coupon: { $arrayElemAt: ["$coupon", 0] } } }

          ],
          past_coupon: [
            {
              $lookup: {
                from: "coupons",
                localField: "coupon_id",
                foreignField: "_id",
                pipeline: [{ $match: {  end_time: { $lt: new Date() } } }],
                as: "coupon",
              },
            },
            { $project: { coupon: { $arrayElemAt: ["$coupon", 0] } } }
          ],

        }
      },
      {
        $match: {
          $or: [
            { current_coupon: { $not: { $size: 0 } } },
            { past_coupon: { $not: { $size: 0 } } }
          ]
        }
      },
      {
        $project: {
          customer_id: 1,
          current_coupon: "$current_coupon.coupon",
          past_coupon: "$past_coupon.coupon",
        }
      }
    ]);
    saved_voucher = await SaveVoucher.aggregate([
      { $match: { customer_id: customer_id } },
      {
        $facet: {
          current_coupon: [
            {
              $lookup: {
                from: "coupons",
                localField: "coupon_id",
                foreignField: "_id",
                pipeline: [{ $match: { is_active: true, end_time: { $gte: new Date() } } }],
                as: "coupon",
              },
            },

            { $project: { coupon: { $arrayElemAt: ["$coupon", 0] } } }

          ],
          past_coupon: [
            {
              $lookup: {
                from: "coupons",
                localField: "coupon_id",
                foreignField: "_id",
                pipeline: [{ $match: {  end_time: { $lt: new Date() } } }],
                as: "coupon",
              },
            },
            { $project: { coupon: { $arrayElemAt: ["$coupon", 0] } } }
          ],

        }
      },
      {
        $match: {
          $or: [
            { current_coupon: { $not: { $size: 0 } } },
            { past_coupon: { $not: { $size: 0 } } }
          ]
        }
      },
      {
        $project: {
          customer_id: 1,
          current_coupon: "$current_coupon.coupon",
          past_coupon: "$past_coupon.coupon",
        }
      }
    ]);


      const merged_current_coupon = [  ...(customer_coupon[0]?.current_coupon || []),
          ...(saved_voucher[0]?.current_coupon || [])
      ];
      const merged_past_coupon = [  ...(customer_coupon[0]?.past_coupon || []),
          ...(saved_voucher[0]?.past_coupon || [])
      ];

      let results={
        current:merged_current_coupon,
        past:merged_past_coupon,
      }
      return results;

  } catch (error) {
    return { status: "fail", data: error.toString() };
  }

};

export const GetRewardsVoucher = async (customer_id) => {
  try {
    let get_point,voucher,customer_point;
    get_point=await EarnBurnHistory.aggregate([


        {
          $facet: {
            customer_point: [
              {
                $match: { is_active: true, customer_id: customer_id }
              },
              {
                $group: {
                  _id: "$customer_id",
                  total_earn_points: {
                    $sum: {
                      $cond: { if: { $eq: ["$type", "Earn"] }, then: "$point", else: 0 }
                    }
                  },
                  total_burn_points: {
                    $sum: {
                      $cond: { if: { $eq: ["$type", "Burn"] }, then: "$point", else: 0 }
                    }
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  total_point: { $subtract: ["$total_earn_points", "$total_burn_points"] }
                }
              }
            ],
              history: [
                  {
                      $match: { customer_id: customer_id }
                  },
                  {
                      $project: {
                          type: 1,
                          description: 1,
                          voucher_id: 1,
                          order_id: 1,
                          created_at: {
                              $dateToString: {
                                  format: "%Y-%m-%d %H:%M",
                                  date: "$created_at",
                                  timezone: "Asia/Dhaka"
                              }
                          },
                          point: {
                              $cond: {
                                  if: { $eq: ["$type", "Burn"] },
                                  then: { $concat: ["-", { $toString: "$point" }] },
                                  else: { $toString: "$point" }
                              }
                          }
                      }
                  },
                  {
                      $sort: { created_at: -1 }
                  },
                  {
                      $limit: 25
                  }
              ]

          }
        },
      {
        $project: {
          total_point: { $arrayElemAt: ["$customer_point.total_point", 0] },
          history: 1
        }
      },
      {
        $addFields: {
          total_point: {$round:["$total_point",2]}
        }
      },

      {
        $replaceRoot: { newRoot: { $mergeObjects:[{}, { total_point: "$total_point", history: "$history" }] } }
      }

    ])
   customer_point=get_point[0].total_point;

    voucher = await VoucherSetting.aggregate([
      {
        $match:{is_active:true}
      },
      {
        $facet:{
          voucher_list:[ {
            $project: {
              _id: 1,
              name: 1,
              image: 1,
              voucher_amount: 1,
              voucher_cost_in_point: 1,
              is_active: 1,
              is_eligible: {
                $cond: {
                  if: {$lte: ["$voucher_cost_in_point", customer_point]},
                  then: true,
                  else: false
                }
              }
            }
          }],
        }
      },



    ]);
    const merged_data = [...get_point, ...voucher];

    const result = {
      total_point: merged_data.find((item) => item.total_point)?.total_point || 0,
      history: merged_data.find((item) => item.history)?.history || [],
      voucher_list: merged_data.find((item) => item.voucher_list)?.voucher_list || [],
    };
    return  result;

  } catch (error) {
    return { status: -1, data: error.toString() };
  }

};
export const GetPoint = async (customer_id) => {
  try {
    let get_point,customer_point;
    get_point=await EarnBurnHistory.aggregate([
      {
        $match: { is_active: true, customer_id: customer_id }
      },
      {
        $group: {
          _id: "$customer_id",
          total_earn_points: {
            $sum: {
              $cond: { if: { $eq: ["$type", "Earn"] }, then: "$point", else: 0 }
            }
          },
          total_burn_points: {
            $sum: {
              $cond: { if: { $eq: ["$type", "Burn"] }, then: "$point", else: 0 }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          total_point: { $subtract: ["$total_earn_points", "$total_burn_points"] }
        }
      },

    ])
   customer_point=get_point[0].total_point>0?get_point[0].total_point:0;


    return  customer_point;

  } catch (error) {
    return 0
  }

};

