// Reference: blueprint:javascript_log_in_with_replit
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  // Logout callback - handles the redirect back to the original domain after OAuth logout
  app.get("/api/logout/callback", (req, res) => {
    const returnTo = req.query.returnTo as string;
    
    // Security: Allowlist of valid redirect domains
    const allowedDomains = [
      'ccitstudy.live',
      'localhost',
      '127.0.0.1',
    ];
    
    // Add all Replit domains to allowlist
    if (process.env.REPLIT_DOMAINS) {
      const replitDomains = process.env.REPLIT_DOMAINS.split(',');
      allowedDomains.push(...replitDomains);
    }
    
    // Validate the redirect URL
    if (returnTo) {
      try {
        const url = new URL(returnTo);
        const isAllowed = allowedDomains.some(domain => {
          return url.hostname === domain || 
                 url.hostname.endsWith('.replit.dev') || 
                 url.hostname.endsWith('.replit.app');
        });
        
        if (isAllowed) {
          return res.redirect(returnTo);
        }
      } catch (e) {
        // Invalid URL, fall through to default
      }
    }
    
    // Default redirect to root
    res.redirect('/');
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      // Capture the current domain to return to after OAuth logout
      const isLocalhost = req.hostname === 'localhost' || 
                          req.hostname === '127.0.0.1' || 
                          req.hostname.endsWith('.replit.dev');
      
      const protocol = isLocalhost ? req.protocol : 'https';
      const returnToUrl = `${protocol}://${req.hostname}`;
      
      // Determine the OAuth logout redirect URI (must be a whitelisted domain)
      let oauthRedirectUri: string;
      
      if (isLocalhost) {
        // Local development - direct redirect
        oauthRedirectUri = returnToUrl;
      } else if (process.env.REPLIT_DOMAINS) {
        // Production - use Replit domain with returnTo parameter
        const replitDomain = process.env.REPLIT_DOMAINS.split(',')[0];
        oauthRedirectUri = `https://${replitDomain}/api/logout/callback?returnTo=${encodeURIComponent(returnToUrl)}`;
      } else {
        // Fallback
        oauthRedirectUri = returnToUrl;
      }
      
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: oauthRedirectUri,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
