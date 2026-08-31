"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./index";
import { hydrateAuth } from "./authSlice";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // One store per request on the server, created once per client session.
  const [store] = useState(() => {
    const instance = makeStore();
    instance.dispatch(hydrateAuth());
    return instance;
  });

  return <Provider store={store}>{children}</Provider>;
}
