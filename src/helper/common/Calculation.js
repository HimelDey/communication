import RestaurantDistance from "../Restaurant/RestaurantDistance.js";
import ZoneDeliveryCharge from "../../models/Zone/ZoneDeliveryCharge.js";
import CouponModel from "../../models/Coupon/CouponModel.js";
import CouponType from "../../models/Coupon/CouponType.js";
import PointSetter from "../../models/Rewards/PointSetter.js";

export const DeliveryCharge = async (zone_id,rest_lat, rest_long, lat, long) => {

  try {
    let user_distance, delivery_charge,get_data;
     user_distance = await RestaurantDistance(rest_lat, rest_long, lat, long);

     get_data=await ZoneDeliveryCharge.aggregate([
         {
             $match: {
                 zone_id: zone_id,
                 distance_start_in_kilometer: {$lte: user_distance.value/ 1000},
                 distance_end_in_kilometer: {$gte: user_distance.value/ 1000},
             }
         },

         {
             $project: {
                 delivery_charge:1
             }
         }

     ])

     delivery_charge = (user_distance.value / 1000) * get_data[0].delivery_charge;
     return delivery_charge
  } catch (error) {
    return 0;
  }
};

export const coupon_val_check = async (coupon_name) =>{
    try {
    let coupon_id;
        let coupon_check = await CouponModel.aggregate([
            {
                $match:{
                    is_active: true,
                    name: coupon_name,
                    end_time: { $gte: new Date() },
                }
            },
            {
                $project: {
                    _id:1,
                    coupon_type_name:1,
                    is_percent:1,
                    discount_in_percent:1,
                    discount_in_amount:1,
                    minimum_order_amount:1,
                    maximum_discount_amount:1,
                    use_limit:1,
                    daily_use_limit:1,
                    valid_time_in_a_day_start:1,
                    valid_time_in_a_day_end:1,
                }
            }


        ]);

    return coupon_check[0] ? coupon_check[0] : 0;
    } catch (error) {
        return 0;
    }

}
export const getCouponType = async (coupon_type_id) =>{
    try {
        let get_coupon_type = await CouponType.aggregate([
            {
                $match:{
                    is_active:true,
                    _id:coupon_type_id,
                }
            },
            {
                $project: {
                    _id:1,
                    name:1,
                }
            }


        ]);

    return get_coupon_type[0] ? get_coupon_type[0] : 0;
    } catch (error) {
        return 0;
    }

}

export const get_point = async (subscription_type_id ) =>{
    try {
        let get_point = await PointSetter.aggregate([
            {
                $match:{
                    is_active: true,
                    subscription_type_id:subscription_type_id
                }
            },
            {
                $project: {
                    _id:1,
                    per_point_value :1
                }
            }


        ]);

    return get_point[0].per_point_value;
    } catch (error) {
        return 0;
    }

}


/** Pick Up**/
export const pick_coupon_val_check = async (coupon_name) =>{
    try {
        let coupon_id;
        let coupon_check = await CouponModel.aggregate([
            {
                $match:{
                    is_active: true,
                    is_pickup: true,
                    name: coupon_name,
                    end_time: { $gte: new Date() },
                }
            },
            {
                $project: {
                    _id:1,
                    is_percent:1,
                    discount_in_percent:1,
                    discount_in_amount:1,
                }
            }


        ]);

        return coupon_check[0];
    } catch (error) {
        return 0;
    }

}
export const formattedDate = async (date) =>{
    const formattedDate = date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZone: "Asia/Dhaka",
    });
    return formattedDate;
}
