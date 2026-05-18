import { Router } from "express";

const router = Router()

router.route("/sign-up").post()
router.route("/sign-in").post()
router.route("/sign-out").delete()

export default router