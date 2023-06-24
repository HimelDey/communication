/** Delivery part*/
import {
   
} from "./src/controllers/chat/ChatController.js";





/** Paths **/
const paths = {
    /** Delivery part*/
  
};

export default async (path, body) => {
  let response;
  try {
    response = paths[path](body);
    if (response) return response;
  } catch (err) {
    console.error(err);
    return {
      status: -1,
      msg: "Gateway not found",
    };
  }
};
