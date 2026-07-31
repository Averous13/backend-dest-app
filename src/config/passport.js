/* eslint-disable no-undef */
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import dotenv from "dotenv";

dotenv.config();


passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${CLIENT_URL}/api/auth/google/callback`
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                return done(null, profile);
            }catch(error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

export default passport;
