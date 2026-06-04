// import { Router } from "express";
// import { signIn, signOut, signUp } from "./auth.controller.js";
// import { validate } from "../../middleware/validate.middleware.js";
// import { signInSchema, signUpSchema, type SignInAuth, type SignUpAuth } from "../../shared/validator/validators.js";
import { Router } from "express";

import { authHandler } from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { signInSchema, signUpSchema } from "../../shared/validator/validators.js";

const router = Router()

router.route("/sign-up/email").post(validate(signUpSchema))
router.route("/sign-in/email").post(validate(signInSchema))
router.use("/", authHandler);

// router.route("/sign-up").post(validate({body: signUpSchema}), signUp)
// router.route("/sign-in").post(validate({body: signInSchema}), signIn)
// router.route("/sign-out").delete(signOut)

export default router
