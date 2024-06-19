import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getChannelStatus,
  getChannelVideos,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.use(verifyJWT);
router.route("/status").get(getChannelStatus);
router.route("/videos").get(getChannelVideos);

export default router;
