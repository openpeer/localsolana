"use client";

import { useEffect } from "react";
import { Intercom, shutdown } from "@intercom/messenger-js-sdk";
import { useUserProfile } from "@/hooks";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { intercomAppId } from "@/utils/constants";

export default function IntercomWidget() {
  const { user} = useUserProfile({});
  const {primaryWallet} = useDynamicContext();
  // const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    shutdown();
    if (typeof window !== "undefined") {
      // Initialize Intercom with user details if user is logged in
      Intercom(
        user
          ? {
              app_id: intercomAppId,
              user_id: user.id.toString(),
              name: user.name || user.address,
              email: user.email || user.address,
            }
          : { app_id: intercomAppId } // Initialize without user details
      );
    }else{
      Intercom( { app_id: intercomAppId }); 
    }
  }, [primaryWallet, user]);

  return <></>;
}
