// import { Router } from "express";
// import { signIn, signOut, signUp } from "./auth.controller.js";
// import { validate } from "../../middleware/validate.middleware.js";
// import { signInSchema, signUpSchema, type SignInAuth, type SignUpAuth } from "../../shared/validator/validators.js";
import { auth } from "./auth.config.js";

const router = auth.handler

// router.route("/sign-up").post(validate({body: signUpSchema}), signUp)
// router.route("/sign-in").post(validate({body: signInSchema}), signIn)
// router.route("/sign-out").delete(signOut)

export default router
