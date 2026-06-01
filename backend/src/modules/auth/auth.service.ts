import type { IncomingHttpHeaders } from "node:http";
import type { SignInAuth, SignUpAuth } from "../../shared/validator/validators.js";
import { auth } from "./auth.config.js";
import type { AuthMember } from "./auth.types.js";
import  { toWebHeaders } from "./auth.util.js";





export const registerUser = async(authData: SignUpAuth) => {
    // const data = await auth.api.signUpEmail({
    //   body: {
    //     name: authData.name,
    //     email: authData.email,
    //     password: authData.password
        
    //   },
    // });

    // return data;
    return "auth"
}

export const logInUser = async(authData: SignInAuth, headers: IncomingHttpHeaders) => {
    const data = await auth.api.signInEmail({
      body: {
        email: authData.email,
        password: authData.password,
        rememberMe: authData.rememberMe || false,
      },
      // This endpoint requires session cookies.
      headers: toWebHeaders(headers),
    });

    return data
}

export const signOutUser = async(headers: IncomingHttpHeaders) => {
    await auth.api.signOut({
      headers: toWebHeaders(headers),
    });
}




