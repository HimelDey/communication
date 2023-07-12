import {
  chatBasicRules,
  chatBasicReceiveRules,
  chatRoomBasicRules,
  validator,
} from "../../helper/validator.js";
import RiderClientChat from "../../models/Communication/RiderClientChat.js";
import RiderAdminChat from "../../models/Communication/RiderAdminChat.js";
import RestaurantAdminChat from "../../models/Communication/RestaurantAdminChat.js";
import GeneralChatRoom from "../../models/Communication/GeneralChatRoom.js";
import io from "../../../index.js";
import { Send_Queue } from "../../helper/common/RMQ.js";

export async function create(req, res) {
  try {
    //validation required here
    let body = req.body;
    let rules = chatRoomBasicRules;
    let error;
    await validator(body, rules, {}, (err) => {
      error = err;
    });
    if (error) {
      res.json({
        status: -1,
        data: error,
        msg: "Validation error.",
      });
    }

    const { user_ids, initiator } = req.body;
    const allUserIds = [user_ids.toString(), initiator.toString()];
    const chatRoom = await GeneralChatRoom.initiateChat(allUserIds, initiator);
    return res.status(200).json({ status: 1, chatRoom });
  } catch (error) {
    return res.status(500).json({ status: 0, error: error });
  }
}

export async function send_message(req, res) {
  let body = req.body;
  let rules = chatBasicRules;
  let error;
  await validator(body, rules, {}, (err) => {
    error = err;
  });
  if (error) {
    res.json({
      status: -1,
      data: error,
      msg: "Validation error.",
    });
  }

  let results = {};
  try {
    let user_data;

    let chat_data = {
      from_user_id: body.from_user_id,
      to_user_id: body.to_user_id,
      from_type: body.from_type,
      to_type: body.to_type,
      text: body.text,
      is_active: 1,
      created_at: new Date(),
    };

    let result1 = await RiderClientChat.create(chat_data);
    // console.log("result1 :", result1);

    const fromUserData = await Send_Queue(
      body.from_type == "User" ? "main_user_request" : "main_rider_request",
      "",
      { _id: body.from_user_id },
      body.from_type == "User" ? "UserModel" : "RiderModel",
      "get"
    );
    console.log("fromUserData :", fromUserData);
    // if (fromUserData)
    chat_data.user = {
      _id: body.from_user_id,
      firstName: fromUserData.data.firstName,
      lastName: fromUserData.data.lastName,
      avatar: "https://www.iconspng.com/uploads/circled-user-icon.png",
    };
    chat_data._id = result1._id;

    console.log("chat_data :", chat_data);
    global.client.broadcast.emit("message", { message: chat_data });
    global.client.to(body.room_id).emit("message", { message: chat_data });

    results = {
      status: 0,
      msg: "Success",
    };
    return res.json(results);
  } catch (error) {
    results = {
      status: -1,
      msg: `Error while seeding data: ${error.message}`,
    };
    res.json(results);
  }
}

export async function receive_message(req, res) {
  let body = req.body;
  let rules = chatBasicReceiveRules;
  let error;
  await validator(body, rules, {}, (err) => {
    error = err;
  });
  if (error) {
    res.json({
      status: -1,
      data: error,
      msg: "Validation error.",
    });
  }
  let results = {};
  try {
    let result1 = await RiderClientChat.find({
      from_user_id: body.from_user_id,
      to_user_id: body.to_user_id,
    });
    console.log("result1 :", result1);

    const fromUserData = await Send_Queue(
      body.from_type == "User" ? "main_user_request" : "main_rider_request",
      "",
      { _id: body.from_user_id },
      body.from_type == "User" ? "UserModel" : "RiderModel",
      "get"
    );
    console.log("fromUserData :", fromUserData);

    for (let i = 0; i < result1.length; i++) {
      result1[i]._doc.user = {
        _id: body.from_user_id,
        firstName: fromUserData.data.firstName,
        lastName: fromUserData.data.lastName,
        avatar: "https://www.iconspng.com/uploads/circled-user-icon.png",
      };
    }
    results = {
      status: 0,
      msg: "Success",
      data: result1,
    };
    return res.json(results);
  } catch (error) {
    results = {
      status: -1,
      msg: `Error while seeding data: ${error.message}`,
    };
    res.json(results);
  }
}

export async function rider_admin_send_message(req, res) {
  let body = req.body;
  let rules = chatBasicRules;
  let error;
  await validator(body, rules, {}, (err) => {
    error = err;
  });
  if (error) {
    res.json({
      status: -1,
      data: error,
      msg: "Validation error.",
    });
  }

  let results = {};
  try {
    let chat_data = {
      from_user_id: body.from_user_id,
      to_user_id: body.to_user_id,
      from_type: body.from_type,
      to_type: body.to_type,
      text: body.text,
      is_active: 1,
      created_at: new Date(),
    };

    let result1 = await RiderAdminChat.create(chat_data);
    console.log(result1);

    results = {
      status: 0,
      msg: "Success",
    };
    return res.json(results);
  } catch (error) {
    results = {
      status: -1,
      msg: `Error while seeding data: ${error.message}`,
    };
    res.json(results);
  }
}

export async function rider_admin_receive_message(req, res) {
  let body = req.body;
  let rules = chatBasicReceiveRules;
  let error;
  await validator(body, rules, {}, (err) => {
    error = err;
  });
  if (error) {
    res.json({
      status: -1,
      data: error,
      msg: "Validation error.",
    });
  }
  let results = {};
  try {
    let result1 = await RiderAdminChat.find({
      from_user_id: body.from_user_id,
      to_user_id: body.to_user_id,
    });
    results = {
      status: 0,
      msg: "Success",
      data: result1,
    };
    return res.json(results);
  } catch (error) {
    results = {
      status: -1,
      msg: `Error while seeding data: ${error.message}`,
    };
    res.json(results);
  }
}

export async function restaurant_admin_send_message(req, res) {
  let body = req.body;
  let rules = chatBasicRules;
  let error;
  await validator(body, rules, {}, (err) => {
    error = err;
  });
  if (error) {
    res.json({
      status: -1,
      data: error,
      msg: "Validation error.",
    });
  }

  let results = {};
  try {
    let chat_data = {
      from_user_id: body.from_user_id,
      to_user_id: body.to_user_id,
      from_type: body.from_type,
      to_type: body.to_type,
      text: body.text,
      is_active: 1,
      created_at: new Date(),
    };

    let result1 = await RestaurantAdminChat.create(chat_data);
    console.log(result1);

    results = {
      status: 0,
      msg: "Success",
    };
    return res.json(results);
  } catch (error) {
    results = {
      status: -1,
      msg: `Error while seeding data: ${error.message}`,
    };
    res.json(results);
  }
}

export async function restaurant_admin_receive_message(req, res) {
  let body = req.body;
  let rules = chatBasicReceiveRules;
  let error;
  await validator(body, rules, {}, (err) => {
    error = err;
  });
  if (error) {
    res.json({
      status: -1,
      data: error,
      msg: "Validation error.",
    });
  }
  let results = {};
  try {
    let result1 = await RestaurantAdminChat.find({
      from_user_id: body.from_user_id,
      to_user_id: body.to_user_id,
    });
    results = {
      status: 0,
      msg: "Success",
      data: result1,
    };
    return res.json(results);
  } catch (error) {
    results = {
      status: -1,
      msg: `Error while seeding data: ${error.message}`,
    };
    res.json(results);
  }
}
