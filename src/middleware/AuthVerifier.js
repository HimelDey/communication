import jwt from "jsonwebtoken";
import { blacklist } from "../helper/blacklist.js";

const optional_routes = [
  "/api/v1/restaurant/restaurant_view",
  "/api/v1/restaurant/campaign/details",
  "/api/v1/restaurant/nearby",
  "/api/v1/restaurant/similar",
  "/api/v1/restaurant/getPromotions",
  "/api/v1/restaurant/popular",
  "/api/v1/restaurant/cuisine_details",
  "/api/v1/restaurant/search",
  "/api/v1/restaurant/cart/add",
  "/api/v1/restaurant/review/get",

    "/api/v1/restaurant/pickup/restaurant_view",
    "/api/v1/restaurant/pickup/campaign/details",
    "/api/v1/restaurant/pickup/nearby",
    "/api/v1/restaurant/pickup/getPromotions",
    "/api/v1/restaurant/pickup/search",
    "/api/v1/restaurant/pickup/cart/add",

    "/api/v1/restaurant/dine/restaurant_view",
    "/api/v1/restaurant/dine/campaign/details",
    "/api/v1/restaurant/dine/nearby",
    "/api/v1/restaurant/dine/search",
    "/api/v1/restaurant/dine/similar",
];

export default (req, res, next) => {
    console.log("req :", req.originalUrl);

    console.log("reqa :", optional_routes.includes(req.originalUrl));
  let bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    jwt.verify(bearerToken, "foodi@#$2020", function (err, decoded) {
      if (err) {
        // console.log(bearerToken)
        res.status(401).json({ status: "Unauthorized" });
      } else {
        if (blacklist.has(bearerToken)) {
          res.status(401).json({ error: "Invalid token" });
        }
        let id = decoded.data.id;
        req.body.id = id;
        // req.body.bearerToken = bearerToken;
        next();
      }
    });
  } else {
    if (optional_routes.includes(req.originalUrl)) {
      next();
    } else {
      res.status(403).json({ status: "Access Denied" });
    }
  }
};
