import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const RestaurantDistance = async (origin_lat, origin_long, dest_lat, dest_long) => {
  try {
    const config = {
      method: "get",
      url:
        "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" +
        origin_lat +
        "%2C" +
        origin_long +
        "&destinations=" +
        parseFloat(dest_lat) +
        "%2C" +
        parseFloat(dest_long) +
        "&key=" +
        GOOGLE_API_KEY,
      headers: {},
    };
    const res = await axios(config);
    return res.data.rows[0].elements[0].distance;
  } catch (error) {
    return { status: "fail", data: error.toString() };
  }
};
export default RestaurantDistance;
