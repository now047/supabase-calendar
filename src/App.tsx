import React, { useState, useEffect } from "react";
import { supabase } from "./lib/api";
import type {
    User,
    UserAppMetadata,
    UserMetadata,
} from "@supabase/supabase-js";

import Auth from "./components/Auth";
import Header from "./components/Header";
import Home from "./components/Home";
import Sidebar from "./components/Sidebar";
import ErrorDialog from "./components/ErrorDialog";

import { ColorContextProvider } from "./contexts/ColorContext";
import { ResourceContextProvider } from "./contexts/ResourceContext";
import { EventContextProvider } from "./contexts/EventContext";
import { HeaderContextProvider } from "./contexts/HeaderContext";
import { AnnotationContextProvider } from "./contexts/AnnotationContext";

class DummyUAM implements UserAppMetadata {
    provider?: string;
    [key: string]: any;
}

class DummyUM implements UserMetadata {
    [key: string]: any;
}

class DummyUser implements User {
    constructor() {
        this.id = "6adac62d-f70a-4da8-b741-1afb09c8500e";
        this.app_metadata = new DummyUAM();
        this.user_metadata = new DummyUM();
        this.aud = "aud";
        this.created_at = "now";
    }
    id: string;
    app_metadata: UserAppMetadata;
    user_metadata: UserMetadata;
    aud: string;
    created_at: string;
}

function App() {
    const [user, setUser] = useState<User | null>(new DummyUser());

    useEffect(() => {
        console.log("useEffect of App.");
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
                <HeaderContextProvider user={user}>
                    <AnnotationContextProvider>
                        <ResourceContextProvider>
                            {/* needs to be in AnnotationContext */}
                            <div className="demo-app">
                                <ColorContextProvider>
                                    <div className="supabase-calendar-sidebar">
                                        <Sidebar />
                                    </div>
                                    <EventContextProvider>
                                        {/* needs to be in Color,Header,Annotation,ResourceContext */}
                                        <div
                                            className={"supabase-calendar-main"}
                                        >
                                            <Header />
                                            <ErrorDialog />
                                            <Home />
                                        </div>
                                    </EventContextProvider>
                                </ColorContextProvider>
                            </div>
                        </ResourceContextProvider>
                    </AnnotationContextProvider>{" "}
                </HeaderContextProvider>
            }
        </div>
    );
}

export default App;
