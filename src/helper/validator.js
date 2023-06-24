import Validator from "validatorjs";

export const couponBasicRules = {
  customer_id: "required",
  coupon_name: "required",
};
export const favBasicRules = {
  customer_id: "required",
  branch_id: "required",
};
export const reviewBasicRules = {
  rest_id: "required",
};

export const chatBasicRules = {
  from_user_id: "required",
  to_user_id: "required",
  from_type: "required",
  to_type: "required",
  text: "required",
  created_at:new Date(),
};

export const chatRoomBasicRules = {
  user_ids: "required",
  initiator: "required",
 
  created_at:new Date(),
};


export const chatBasicReceiveRules = {
  from_user_id: "required",
  to_user_id: "required",
};
export const orderBasicRules = {
  id: "required",
  address: "required",
};

export const validator = async (body, rules, customMessages, callback) => {
  const validation = new Validator(body, rules, customMessages);
  validation.passes(() => callback(null, true));
  validation.fails(() => callback(validation.errors, false));
};
