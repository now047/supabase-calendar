import React, { createContext, useState, useEffect, useRef } from "react";
import { supabase } from "./lib/api";
import Auth from "./components/Auth";
import Home from "./components/Home";
import Sidebar from "./components/Sidebar";
import type { User, UserAppMetadata, UserMetadata } from "@supabase/supabase-js";

import IEvent from "./lib/event-utils";
import { TabLabel } from "./components/Header";
import Resource from "./lib/resource-utils";

class DummyUAM implements UserAppMetadata {
  provider?: string
  [key: string]: any
}

class DummyUM implements UserMetadata {
  [key: string]: any
}

class DummyUser implements User {
  constructor() {
    this.id = "6adac62d-f70a-4da8-b741-1afb09c8500e"
    this.app_metadata = new DummyUAM()
    this.user_metadata = new DummyUM()
    this.aud = "aud"
    this.created_at = "now"
  }
  id: string
  app_metadata: UserAppMetadata
  user_metadata: UserMetadata
  aud: string
  created_at: string;
}

type HeaderContextType = {
  user: User | null;
  tab: TabLabel;
  setTab: (t: TabLabel) => void;
  errorText: string | null;
  setError: (e: string | null) => void;
};

const defaultHeaderContext: HeaderContextType = {
  user: new DummyUser(),
  tab: "Calendar",
  setTab: (t: TabLabel) => { },
  errorText: "",
  setError: (s: string | null) => { }
};
export const HeaderContext = createContext(defaultHeaderContext);

type EventContextType = {
  events: React.MutableRefObject<IEvent[]> | null;
  resources: React.MutableRefObject<Resource[]> | null;
};
const defaultEventContext: EventContextType = {
  events: null,
  resources: null
};
export const EventContext = createContext(defaultEventContext);

function App() {
  const [user, setUser] = useState<User | null>(new DummyUser());
  const [errorText, setError] = useState<string | null>("");
  const [tab, setTab] = useState<TabLabel>("Calendar");
  const events = useRef<IEvent[]>([]);
  const resources = useRef<Resource[]>([]);

  const currentHeaderContext = {
    user,
    tab,
    setTab,
    errorText,
    setError
  };
  const currentEventContext = {
    events: events,
    resources: resources
  };
  useEffect(() => {
    const session = supabase.auth.session();
    //setUser(session?.user ?? null);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user;
        setUser(currentUser ?? null);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, [user]);


  return (
    <div className="min-w-full min-h-screen flex items-center justify-center bg-gray-200">
      {/*
        {!user ? <Auth /> : <Home user={user} />}
      */}
      {
        <HeaderContext.Provider value={currentHeaderContext}>
          <EventContext.Provider value={currentEventContext}>
            <div className='demo-app'>
              <Sidebar />
              <Home user={new DummyUser()} />
            </div>
          </EventContext.Provider>
        </HeaderContext.Provider>
      }
    </div>
  );
}

export default App;
