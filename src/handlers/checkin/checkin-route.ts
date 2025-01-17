
import { Router } from "express";
import CheckInHandler from "./checkin-handle";
import { validateDeviceMiddleware } from "../../middleware/validate-device";
import bot from "../../bot/telegram-bot";
const router =  Router();

const checkInHandler=new CheckInHandler(bot);
router.get("/checkin-main",validateDeviceMiddleware,checkInHandler.handleCheckInMain);
router.get("/checkin-special",validateDeviceMiddleware,checkInHandler.handleCheckInSpecial);
export default router;