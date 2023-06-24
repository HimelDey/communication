import { Router } from "express";

import Auth from "../middleware/AuthVerifier.js";
const router = Router();
import dotenv from "dotenv";
import {
    send_message,
    receive_message,
    rider_admin_send_message,
    rider_admin_receive_message,
    restaurant_admin_send_message,
    restaurant_admin_receive_message,
    create
} from "../controllers/chat/ChatController.js";

dotenv.config();

router.post("/create", Auth,create);
router.post("/send_message", Auth,send_message);
router.post("/receive_message", Auth,receive_message);


router.post("/rider-admin/send_message", Auth,rider_admin_send_message);
router.post("/rider-admin/receive_message", Auth,rider_admin_receive_message);

router.post("/restarurant-admin/send_message", Auth,restaurant_admin_send_message);
router.post("/restarurant-admin/receive_message", Auth,restaurant_admin_receive_message);

router.get('/', (req, res) => {
    res.send('hello world');
   
});

export default router;
