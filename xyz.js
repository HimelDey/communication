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

promo_code: "$promo_code.branch_coupons",