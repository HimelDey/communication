export const res_basic_data = {
  _id: 1,
  name: 1,
  image: 1,
  cover_image: 1,
  min_order_value: 1,
  //is_favorite: { $ifNull: ["$is_favorite", 0] },
  is_favourite: {
    $cond: {
      if: { $gt: [{ $size: "$is_favourite" }, 0] },
      then: 1,
      else: 0,
    },
  },
  address: { $ifNull: ["$address", ""] },
  share_link: { $ifNull: ["$share_link", ""] },
  delivery_time: { $ifNull: ["$delivery_time", 0] },
  pickup_time: { $ifNull: ["$pickup_time", 0] },
  delivery_charge: { $ifNull: ["$delivery_charge", 0] },
  coupons: { $ifNull: ["$coupons", []] },
  promo_code: { $ifNull: ["$promo_code", []] },
  categories: { $ifNull: ["$categories", []] },
  rating: { $ifNull: ["$rating", 0] },
  price_range: { $ifNull: ["$price_range", null] },
  is_open: { $ifNull: ["$is_open", null] },
  is_take_pre_order: 1,
  cuisines: 1,
  cuisines_details: 1,
  // is_favorite: 1,
  location: 1,
  is_popular: 1,
  // categories: {
  //   $cond: {
  //     if: { $eq: ["$categories.menu_data", []] },
  //     then: [],
  //     else: "$categories"
  //   }
  // }
};
