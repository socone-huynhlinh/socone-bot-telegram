
import { Router } from "express";
import CheckInHandler from "./checkin-handle";
import { validateDeviceMiddleware } from "../../middleware/validate-device";
const router =  Router();

const checkInHandler=new CheckInHandler();
router.get("/checkin-main",validateDeviceMiddleware,checkInHandler.handleCheckInMain);
export default router;