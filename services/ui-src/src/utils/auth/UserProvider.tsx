import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useLocation } from "react-router-dom";
import { Auth } from "aws-amplify";
import config from "config";
import { initAuthManager, updateTimeout, getExpiration, useStore } from "utils";
import { PRODUCTION_HOST_DOMAIN } from "../../constants";

import { MFPUser, UserContextShape, UserRoles } from "types/users";

export const UserContext = createContext<UserContextShape>({
  logout: async () => {},
  loginWithIDM: () => {},
  updateTimeout: () => {},
  getExpiration: () => {},
});

const authenticateWithIDM = async () => {
  const authConfig = Auth.configure();
  if (authConfig?.oauth) {
    const oAuthOpts = authConfig.oauth;
    const domain = oAuthOpts.domain;
    const responseType = oAuthOpts.responseType;
    const redirectSignIn = (oAuthOpts as any).redirectSignIn;
    const clientId = authConfig.userPoolWebClientId;
    const url = `https://${domain}/oauth2/authorize?identity_provider=Okta&redirect_uri=${redirectSignIn}&response_type=${responseType}&client_id=${clientId}`;
    window.location.assign(url);
  }
  const cognitoHostedUrl = new URL(
    `https://${config.cognito.APP_CLIENT_DOMAIN}/oauth2/authorize?identity_provider=${config.cognito.COGNITO_IDP_NAME}&redirect_uri=${config.APPLICATION_ENDPOINT}&response_type=CODE&client_id=${config.cognito.APP_CLIENT_ID}&scope=email openid profile`
  );
  window.location.replace(cognitoHostedUrl);
};

export const UserProvider = ({ children }: Props) => {
  const location = useLocation();
  const isProduction = window.location.origin.includes(PRODUCTION_HOST_DOMAIN);

  // state management
  const { user, showLocalLogins, setUser, setShowLocalLogins } = useStore();

  // initialize the authentication manager that oversees timeouts
  initAuthManager();

  const logout = async () => {
    try {
      setUser(undefined);
      await Auth.signOut();
      localStorage.clear();
    } catch (error) {
      console.log(error); // eslint-disable-line no-console
    }
    window.location.assign(config.POST_SIGNOUT_REDIRECT);
  };

  const checkAuthState = useCallback(async () => {
    // Allow Post Logout flow alongside user login flow
    if (location?.pathname.toLowerCase() === "/postlogout") {
      window.location.href = config.POST_SIGNOUT_REDIRECT;
      return;
    }

    try {
      const session = await Auth.currentSession();
      const payload = session.getIdToken().payload;
      const { email, given_name, family_name } = payload;
      // "custom:cms_roles" is an string of concat roles so we need to check for the one applicable to MFP
      const cms_role = payload["custom:cms_roles"] as string;
      const userRole = cms_role.split(",").find((r) => r.includes("mdctmfp"));
      const state = payload["custom:cms_state"] as string | undefined;
      const full_name = [given_name, " ", family_name].join("");
      const userCheck = {
        userIsAdmin:
          userRole === UserRoles.ADMIN || userRole === UserRoles.APPROVER,
        userIsReadOnly:
          userRole === UserRoles.HELP_DESK || userRole === UserRoles.INTERNAL,
        userIsEndUser: userRole === UserRoles.STATE_USER,
      };
      const currentUser: MFPUser = {
        email,
        given_name,
        family_name,
        full_name,
        userRole,
        state,
        ...userCheck,
      };
      setUser(currentUser);
    } catch (error) {
      if (isProduction) {
        authenticateWithIDM();
      } else {
        setShowLocalLogins(true);
      }
    }
  }, [isProduction, location]);

  // re-render on auth state change, checking router location
  useEffect(() => {
    checkAuthState();
  }, [location, checkAuthState]);

  const values: UserContextShape = useMemo(
    () => ({
      user,
      logout,
      showLocalLogins,
      loginWithIDM: authenticateWithIDM,
      updateTimeout,
      getExpiration,
    }),
    [user, logout, showLocalLogins]
  );

  return <UserContext.Provider value={values}>{children}</UserContext.Provider>;
};

interface Props {
  children?: ReactNode;
}
