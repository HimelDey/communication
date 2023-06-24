
import MenuModel from "../../models/Restaurant/Menu.js";

import Order from "../../models/Order/Order.js";

export const GetOrderData= async (rest_id,menu_data) => {

    try{



        let results = [];
        let get_data = await Promise.all(Object.values(menu_data).map(async (menu) => {
            const listIds = menu.variations.reduce((listAcc, variation) => {
                if (variation.add_on_category) {
                    const currListIds = variation.add_on_category.reduce((itemAcc, category) => {
                        if (category.add_on_list) {
                            const currItemIds = category.add_on_list.map(item => item._id);
                            return itemAcc.concat(currItemIds);
                        } else {
                            return itemAcc;
                        }
                    }, []);
                    return listAcc.concat(currListIds);
                } else {
                    return listAcc;
                }
            }, []);
            console.log('listids',listIds)
            const result = await MenuModel.aggregate([
                {
                    $match: {
                        //  is_active: true,
                        menu_time_slots_map: {$ne: []},
                        restaurant_id: rest_id,
                        _id: menu._id

                    }
                },
                {
                    $project: {_id: 1, category_id:1, menu_name: 1, menu_price: 1,image:1, vat: 1, sd: 1, is_active: 1}
                },

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
                                    menu_time_slots: {$ne: []},
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
                                                        isoWeekYear: {$isoWeekYear: new Date()},
                                                        isoWeek: {$isoWeek: new Date()},
                                                        isoDayOfWeek: {$isoDayOfWeek: new Date()},
                                                        hour: "$start_time.hour",
                                                        minute: "$start_time.minute",
                                                    },
                                                },
                                                close: {
                                                    $dateFromParts: {
                                                        isoWeekYear: {$isoWeekYear: new Date()},
                                                        isoWeek: {$isoWeek: new Date()},
                                                        isoDayOfWeek: {$isoDayOfWeek: new Date()},
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

                //Variation Check
                {
                    $lookup: {
                        from: 'variations',
                        localField: '_id',
                        foreignField: 'menu_id',
                        pipeline: [
                            {
                                $match: {
                                    //is_active: true,
                                    _id:{$in:menu.variations ?menu.variations.map(variation => variation._id) : []}
                                },
                            },
                            {
                                $lookup: {
                                    from: 'addon_category',
                                    localField: '_id',
                                    foreignField: 'variation_id',
                                    pipeline: [
                                        {
                                            $lookup: {
                                                from: 'addon_list',
                                                localField: '_id',
                                                foreignField: 'addoncat_id',
                                                pipeline: [
                                                    // {
                                                    //     $match: {
                                                    //         _id: {
                                                    //             $in: [menu.variations && menu.variations.length > 0 ? menu.variations.reduce((listAcc, variation) =>
                                                    //                 listAcc.concat(variation.add_on_category?.reduce((itemAcc, category) =>
                                                    //                         itemAcc.concat(category.add_on_list?.map(item => item._id) ?? []) ?? [])
                                                    //                     , []) ?? []) : []]
                                                    //         }
                                                    //     }
                                                    // },
                                                    {
                                                        $match:{
                                                          _id:{$in:listIds.length >0 ? listIds:[]}
                                                        }
                                                    },


                                                    {
                                                        $project: {
                                                            _id: 1,
                                                            add_ons_name: 1,
                                                            addoncat_id: 1,
                                                            add_ons_price: 1,
                                                            is_active: 1
                                                        }
                                                    },
                                                ],
                                                as: 'add_on_list',
                                            },
                                        },
                                        {
                                            $project: {_id: 1, name: 1, add_on_list: 1, is_active: 1}
                                        },
                                    ],
                                    as: 'add_on_category',
                                },
                            },
                            {
                                $project: {
                                    _id: 1,
                                    variation_name: 1,
                                    variation_price: 1,
                                    is_active: 1,
                                    add_on_category: 1,


                                }
                            },
                        ],

                        as: 'variations'

                    }

                },
                {
                    $sort: {
                        menu_price: 1
                    }
                },

                {
                    $project: {
                        _id: '$_id',
                        category_id: '$category_id',
                        menu_name: '$menu_name',
                        menu_price: '$menu_price',
                        image: '$image',
                        variations: '$variations',
                        vat: '$vat',
                        sd: '$sd',
                        is_active: '$is_active',
                        menu_time_slots_map: '$menu_time_slots_map',
                    }
                },
                {
                    $addFields: {


                        item_total: {
                            $cond: {

                                if: {$gt: [{$size: "$variations"}, 0]},
                                then: {
                                    $multiply: [
                                        {
                                            $sum: {
                                                $concatArrays: [
                                                    {$map: {input: "$variations", as: "v", in: "$$v.variation_price"}},
                                                    {
                                                        $map: {
                                                            input: {
                                                                $reduce: {
                                                                    input: "$variations.add_on_category.add_on_list",
                                                                    initialValue: [],
                                                                    in: {$concatArrays: ["$$value", "$$this"]}
                                                                }
                                                            },
                                                            as: "aol",
                                                            in: {$sum: "$$aol.add_ons_price"}
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        menu.quantity
                                    ]
                                },
                                else: {
                                    $cond: {
                                        if: {$and: [{$eq: ["$is_active", true]}, {$size: "$menu_time_slots_map"}]},
                                        then: {$multiply: ["$menu_price", menu.quantity]},
                                        else: 0
                                    }
                                }
                            }
                        },
                        quantity: menu.quantity

                    }
                },
                {
                    $group: {
                        _id: null,
                        menu_data: {$push: '$$ROOT'},

                    }
                },
                {
                    $project: {
                        _id:0,
                        menu_data: {
                            $map: {
                                input: '$menu_data',
                                as: 'md',
                                in: {
                                    _id: '$$md._id',
                                    category_id: '$$md.category_id',
                                    menu_name: '$$md.menu_name',
                                    menu_price: '$$md.menu_price',
                                    image: '$$md.image',
                                    quantity: '$$md.quantity',
                                    variations: '$$md.variations',
                                    is_active: '$$md.is_active',
                                    is_available: {     $cond: {
                                            if: { $size: "$$md.menu_time_slots_map" },
                                            then: true,
                                            else: false
                                        } },
                                    item_total: '$$md.item_total',
                                    item_sd:{
                                        $multiply: [
                                            "$$md.item_total",
                                            {
                                                $divide: [
                                                    "$$md.sd",
                                                    100
                                                ]
                                            }
                                        ]
                                    },
                                    item_vat:{
                                        $multiply: [
                                            "$$md.item_total",
                                            {
                                                $divide: [
                                                    "$$md.vat",
                                                    100
                                                ]
                                            }
                                        ]
                                    }

                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id:0,
                        menu_data: 1
                    }
                },
                { $project: { menu_data: { $arrayElemAt: ["$menu_data", 0] } } },

                {$unwind:"$menu_data"},
                {$replaceRoot:{newRoot:"$menu_data"}}
            ]);

                 results.push(result[0]);

        }))
        return results;

    }
    catch (error) {
        return {status: "fail", data: error.toString()}
    }
};

export const GetUserOrderList = async (customer_id) => {
    try {
        let get_data;

        get_data = await Order.aggregate([
            {
                $match: { customer_id: customer_id,order_details: { $exists: true, $ne: null } },
            },

            {
                $facet:{
                    ongoing:[
                        {
                            $match:{
                                order_status:{ $in: ['placed','onGoing','preparing'] }
                            },
                        },
                        {
                            $lookup: {
                                from: "restaurents",
                                localField: "branch_id",
                                foreignField: "_id",
                                pipeline:[
                                    {
                                        $project:{
                                            _id:1,
                                            name:1,
                                            image:1
                                        }
                                    }
                                ],
                                as: "restaurants",
                            },
                        },
                        {
                            $lookup: {
                                from: "reviews",
                                localField: "rest_id",
                                foreignField: "branch_id",
                                pipeline:[
                                    {
                                        $project:{
                                            _id:1,
                                            rating:1

                                        }
                                    }
                                ],
                                as: "reviews",
                            },
                        },
                        {
                            $project:{
                                _id:1,
                                total_amount: {$round : [ '$total_amount',2 ]},
                                restaurants:1,

                                created_at: {
                                    $dateToString: {
                                        format: "%Y-%m-%d %H:%M",
                                        date: "$created_at",
                                        timezone: "Asia/Dhaka"
                                    }
                                },
                                menu_names: {
                                    $reduce: {
                                        input: "$order_details",
                                        initialValue: "",
                                        in: {
                                            $cond: {
                                                if: { $eq: [ "$$value", "" ] },
                                                then: "$$this.menu_name",
                                                else: { $concat: [ "$$value", ", ", "$$this.menu_name" ] }
                                            }
                                        }
                                    }
                                },
                                order_details:1,
                                is_rated: {     $cond: {
                                        if: { $gt: [ { $size: "$reviews" }, 0 ] },
                                        then: 1,
                                        else: 0
                                    } }
                            }
                        },

                    ],
                    previous:[
                        {
                            $match:{
                                order_status:{ $in: ['delivered','cancel','not_delivered'] }
                            },
                        },

                        {
                            $lookup: {
                                from: "restaurents",
                                localField: "branch_id",
                                foreignField: "_id",
                                pipeline:[
                                    {
                                        $project:{
                                            _id:1,
                                            name:1,
                                            image:1
                                        }
                                    }
                                ],
                                as: "restaurants",
                            },
                        },
                        {
                            $lookup: {
                                from: "reviews",
                                localField: "rest_id",
                                foreignField: "branch_id",
                                pipeline:[
                                    {
                                        $project:{
                                            _id:1,
                                            rating:1

                                        }
                                    }
                                ],
                                as: "reviews",
                            },
                        },
                        {
                            $project:{
                                _id:1,
                                total_amount: {$round : [ '$total_amount',2 ]},
                                restaurants:1,
                                created_at: {
                                    $dateToString: {
                                        format: "%Y-%m-%d %H:%M",
                                        date: "$created_at",
                                        timezone: "Asia/Dhaka"
                                    }
                                },
                                menu_names: {
                                    $reduce: {
                                        input: "$order_details",
                                        initialValue: "",
                                        in: {
                                            $cond: {
                                                if: { $eq: [ "$$value", "" ] },
                                                then: "$$this.menu_name",
                                                else: { $concat: [ "$$value", ", ", "$$this.menu_name" ] }
                                            }
                                        }
                                    }
                                },
                                order_details:1,

                                is_rated: {     $cond: {
                                        if: { $gt: [ { $size: "$reviews" }, 0 ] },
                                        then: 1,
                                        else: 0
                                    } },

                            }
                        },

                    ],
                }
            }


        ]);


        return get_data;
    } catch (error) {
        return { status: "fail", data: error.toString() };
    }
};
export const GetOrderDetails = async (order_id,customer_id) => {
    try {
        let get_data;

        get_data = await Order.aggregate([
            {
                $match: {
                    _id: order_id,
                    customer_id: customer_id,
                    order_details: { $exists: true, $ne: null }
                }
            },
            {
                $lookup: {
                    from: "restaurents",
                    localField: "branch_id",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                name: 1,
                                delivery_time: 1
                            }
                        }
                    ],
                    as: "restaurants"
                }
            },
            {
                $project: {
                    _id:0,
                    order_id: '$_id',
                    order_type: '$order_type',
                    sub_total: {$round : [ '$sub_total',2 ]},
                    total_amount: {$round : [ '$total_amount',2 ]},
                    total_vat: {$round : [ '$value_added_tax_inclusive',2 ]},
                    total_sd: {$round : [ '$supplementary_duty',2 ]},
                    discount_amount: {$round : [ '$discount_amount',2 ]},
                    created_at: {
                        $dateToString: {
                            format: "%Y-%m-%d %H:%M",
                            date: "$created_at",
                            timezone: "Asia/Dhaka"
                        }
                    },
                    order_status: 1,
                    rest_name: {$arrayElemAt: ["$restaurants.name", 0]},
                    delivery_time: {$arrayElemAt: ["$restaurants.delivery_time", 0]},
                    address: 1,
                    order_details: {
                        $cond: {
                            if: {
                                $in: [
                                    "$order_status",
                                    ["delivered", "cancel", "not_delivered"]
                                ]
                            },
                            then: "$order_details",
                            else: "$$REMOVE"
                        }
                    }
                }
            }
        ]);



        return get_data[0];
    } catch (error) {
        return { status: "fail", data: error.toString() };
    }
};
export const GetOngoingOrder = async (customer_id) => {
    try {
        let get_data;

        get_data = await Order.aggregate([
            {
                $match: { customer_id: customer_id,order_details: { $exists: true, $ne: null } },
            },

            {
                $match:{
                    order_status:{ $in: ['placed','onGoing','preparing'] }
                },
            },
            {
                $lookup: {
                    from: "restaurents",
                    localField: "branch_id",
                    foreignField: "_id",
                    pipeline:[
                        {
                            $project:{
                                _id:1,
                                name:1,
                                delivery_time:1
                            }
                        }
                    ],
                    as: "restaurants",
                },
            },
            {
                $lookup: {
                    from: "reviews",
                    localField: "rest_id",
                    foreignField: "branch_id",
                    pipeline:[
                        {
                            $project:{
                                _id:1,
                                rating:1

                            }
                        }
                    ],
                    as: "reviews",
                },
            },
            {
                $project: {
                    _id:0,
                    order_id: '$_id',
                    sub_total: {$round : [ '$sub_total',2 ]},
                    delivery_charge: {$round : [ '$delivery_charge',2 ]},
                    discount_amount: {$round : [ '$discount_amount',2 ]},
                    total_vat: {$round : [ '$value_added_tax_inclusive',2 ]},
                    total_sd: {$round : [ '$supplementary_duty',2 ]},
                    total_amount: {$round : [ '$total_amount',2 ]},
                    created_at: {
                        $dateToString: {
                            format: "%Y-%m-%d %H:%M",
                            date: "$created_at",
                            timezone: "Asia/Dhaka"
                        }
                    },
                    order_status: 1,
                    rest_name: {$arrayElemAt: ["$restaurants.name", 0]},
                    delivery_time: {$arrayElemAt: ["$restaurants.delivery_time", 0]},
                    address: 1,
                    order_details: 1,

                }
            },
            {
                $sort: { created_at: -1 }
            },
            {
                $limit: 1
            }


        ]);


        return get_data;
    } catch (error) {
        return { status: "fail", data: error.toString() };
    }
};


// export const GetOrderData= async (rest_id,menu_data) => {
//
//     const addOnCategoryIds = menu_data.reduce((acc, curr) => {
//         if (curr.variations) {
//             const variationIds = curr.variations.map(variation => variation._id);
//             const listIds = curr.variations.reduce((listAcc, variation) => {
//                 if (variation.add_on_category) {
//                     const currListIds = variation.add_on_category.reduce((itemAcc, category) => {
//                         if (category.add_on_list) {
//                             const currItemIds = category.add_on_list.map(item => item._id);
//                             return itemAcc.concat(currItemIds);
//                         } else {
//                             return itemAcc;
//                         }
//                     }, []);
//                     return listAcc.concat(currListIds);
//                 } else {
//                     return listAcc;
//                 }
//             }, []);
//             if (variationIds && listIds) {
//                 const variationAddOns = {variationIds, listIds};
//                 return acc.concat(variationAddOns);
//             }
//         }
//         return acc;
//     }, []);
//
//
//     try{
//         const get_data = await MenuModel.aggregate([
//             {
//                 $match: {
//                     //  is_active: true,
//                     menu_time_slots_map: { $ne: [] },
//                     restaurant_id: rest_id,
//                     _id: { $in: menu_data.map(md => md._id) }
//
//                 }
//             },
//             {
//                 $project:{_id:1,menu_name:1,menu_price:1,vat:1,sd:1,is_active:1}
//             },
//
//             //Menu Timing Check
//             {
//                 $lookup: {
//                     from: "menu_item_and_menu_item_time_slots",
//                     localField: "_id",
//                     foreignField: "menu_item_id",
//                     as: "menu_time_slots_map",
//                     pipeline: [
//                         {
//                             $match: {
//                                 menu_time_slots: { $ne: [] },
//                             },
//                         },
//                         {
//                             $lookup: {
//                                 from: "menu_item_time_slots",
//                                 localField: "menu_item_time_slot_id",
//                                 foreignField: "_id",
//                                 as: "menu_time_slots",
//                                 pipeline: [
//                                     {
//                                         $set: {
//                                             start: {
//                                                 $dateFromParts: {
//                                                     isoWeekYear: { $isoWeekYear: new Date() },
//                                                     isoWeek: { $isoWeek: new Date() },
//                                                     isoDayOfWeek: { $isoDayOfWeek: new Date() },
//                                                     hour: "$start_time.hour",
//                                                     minute: "$start_time.minute",
//                                                 },
//                                             },
//                                             close: {
//                                                 $dateFromParts: {
//                                                     isoWeekYear: { $isoWeekYear: new Date() },
//                                                     isoWeek: { $isoWeek: new Date() },
//                                                     isoDayOfWeek: { $isoDayOfWeek: new Date() },
//                                                     hour: "$end_time.hour",
//                                                     minute: "$end_time.minute",
//                                                 },
//                                             },
//                                         },
//                                     },
//                                     {
//                                         $match: {
//                                             $expr: {
//                                                 $and: [
//                                                     {
//                                                         $lte: ["$start", new Date()],
//                                                     },
//                                                     {
//                                                         $gt: ["$end", new Date()],
//                                                     },
//                                                 ],
//                                             },
//                                             //   start: { $lte: new Date() },
//                                             //   end: { $gt: new Date() },
//                                         },
//                                     },
//                                 ],
//                             },
//                         },
//                         {
//                             $group: {
//                                 _id: "$menu_item_id",
//                             },
//                         },
//                     ],
//                 },
//             },
//
//             //Variation Check
//             {
//                 $lookup: {
//                     from: 'variations',
//                     localField: '_id',
//                     foreignField: 'menu_id',
//                     pipeline: [
//                         {
//                             $match: {
//                                 //is_active: true,
//                                 _id: { $in: addOnCategoryIds.length > 0?addOnCategoryIds[0]['variationIds']:[]}
//                             },
//                         },
//                         {
//                             $lookup: {
//                                 from: 'addon_category',
//                                 localField: '_id',
//                                 foreignField: 'variation_id',
//                                 pipeline: [
//                                     {
//                                         $lookup: {
//                                             from: 'addon_list',
//                                             localField: '_id',
//                                             foreignField: 'addoncat_id',
//                                             pipeline: [
//                                                 {
//                                                     $match: {
//                                                         _id: { $in: addOnCategoryIds.length > 0?addOnCategoryIds[0]['listIds']:[]}
//                                                     },
//                                                 },
//                                                 {
//                                                     $project:{_id:1,add_ons_name:1,add_ons_price:1,is_active:1}
//                                                 },
//                                             ],
//                                             as: 'add_on_list',
//                                         },
//                                     },
//                                     {
//                                         $project:{_id:1,name:1,add_on_list:1,is_active:1}
//                                     },
//                                 ],
//                                 as: 'add_on_category',
//                             },
//                         },
//                         {
//                             $project:{
//                                 _id:1,
//                                 variation_name:1,
//                                 variation_price:1,
//                                 is_active:1,
//                                 add_on_category:1,
//
//
//
//                             }
//                         },
//                     ],
//
//                     as: 'variations'
//
//                 }
//
//             },
//
//
//
//             {
//                 $project: {
//                     _id: '$_id',
//                     menu_name: '$menu_name',
//                     menu_price: '$menu_price',
//                     variations: '$variations',
//                     vat: '$vat',
//                     sd: '$sd',
//                     is_active: '$is_active',
//                     menu_time_slots_map: '$menu_time_slots_map',
//                     quantity: {
//                         $sum: {
//                             $map: {
//                                 input: {
//                                     $filter: {
//                                         input: menu_data,
//                                         as: 'md',
//                                         cond: { $eq: ['$$md._id', '$_id'] }
//                                     }
//                                 },
//                                 as: 'md',
//                                 in: '$$md.quantity'
//                             }
//                         }
//                     },
//
//                 }
//             },
//             {
//                 $addFields: {
//
//                     item_total: {
//                         $cond: {
//
//                             if: { $gt: [ { $size: "$variations" }, 0 ] },
//                             then: {
//                                 $multiply: [
//                                     {
//                                         $sum: {
//                                             $concatArrays: [
//                                                 { $map: { input: "$variations", as: "v", in: "$$v.variation_price" } },
//                                                 {
//                                                     $map: {
//                                                         input: { $reduce: { input: "$variations.add_on_category.add_on_list", initialValue: [], in: { $concatArrays: [ "$$value", "$$this" ] } } },
//                                                         as: "aol",
//                                                         in: { $sum: "$$aol.add_ons_price" }
//                                                     }
//                                                 }
//                                             ]
//                                         }
//                                     },
//                                     "$quantity"
//                                 ]
//                             },
//                             else: {
//                                 $cond: {
//                                     if: { $and: [ { $eq: [ "$is_active", true ] }, { $size: "$menu_time_slots_map" } ] },
//                                     then: { $multiply: [ "$menu_price", "$quantity" ] },
//                                     else: 0
//                                 }
//                             }
//                         }
//                     },
//
//                 }
//             },
//
//             {
//                 $group: {
//                     _id: null,
//                     menu_data: { $push: '$$ROOT' },
//
//                 }
//             },
//
//
//
//             {
//                 $project: {
//                     _id:0,
//                     menu_data: {
//                         $map: {
//                             input: '$menu_data',
//                             as: 'md',
//                             in: {
//                                 _id: '$$md._id',
//                                 menu_name: '$$md.menu_name',
//                                 menu_price: '$$md.menu_price',
//                                 quantity: '$$md.quantity',
//                                 variations: '$$md.variations',
//                                 is_active: '$$md.is_active',
//                                 is_available: {     $cond: {
//                                         if: { $size: "$$md.menu_time_slots_map" },
//                                         then: true,
//                                         else: false
//                                     } },
//                                 item_total: '$$md.item_total',
//                                 item_sd:{
//                                     $multiply: [
//                                         "$$md.item_total",
//                                         {
//                                             $divide: [
//                                                 "$$md.sd",
//                                                 100
//                                             ]
//                                         }
//                                     ]
//                                 },
//                                 item_vat:{
//                                     $multiply: [
//                                         "$$md.item_total",
//                                         {
//                                             $divide: [
//                                                 "$$md.vat",
//                                                 100
//                                             ]
//                                         }
//                                     ]
//                                 }
//
//                             }
//                         }
//                     }
//                 }
//             },
//             {
//                 $project:{
//                     menu_data: 1,
//                     total_item_total: {
//                         $sum: '$menu_data.item_total'
//                     }  ,
//                     total_sd: {
//                         $sum: '$menu_data.item_sd'
//                     }  ,
//                     total_vat: {
//                         $sum: '$menu_data.item_vat'
//                     }
//                 }
//             }
//
//
//         ]);
//
//
//         return get_data;
//
//     }
//     catch (error) {
//         return {status: "fail", data: error.toString()}
//     }
// };
