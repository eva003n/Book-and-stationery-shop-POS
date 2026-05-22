import type { IncomingHttpHeaders } from "node:http";
import type { SignInAuth, SignUpAuth } from "../../shared/validator/validators.js";
import { auth } from "./auth.config.js";

const toWebHeaders = (headers: IncomingHttpHeaders) => {
  const webHeaders = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue;

    webHeaders.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  return webHeaders;
};

export const registerUser = async(authData: SignUpAuth) => {
    const data = await auth.api.signUpEmail({
      body: {
        name: authData.name,
        email: authData.email,
        password: authData.password
        
      },
    });

    return data;
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
