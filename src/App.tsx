import { useState, useEffect } from "react";
import { supabase } from "./lib/api";
import Auth from "./components/Auth";
import Home from "./components/Home";
import Sidebar from "./components/Sidebar";
import type { User, UserAppMetadata, UserMetadata } from "@supabase/supabase-js";
import React from "react";

function App() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const session = supabase.auth.session();
        setUser(session?.user ?? null);

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


    class DummyUAM implements UserAppMetadata {
        provider?: string
        [key: string]: any
      }
      
    class DummyUM implements UserMetadata {
        [key: string]: any
      }

    class DummyUser implements User  {
        constructor() {
            this.id = "6adac62d-f70a-4da8-b741-1afb09c8500e"
            this.app_metadata = new DummyUAM()
            this.user_metadata =new DummyUM()
            this.aud = "aud"
            this.created_at = "now"
        }
        id: string 
        app_metadata: UserAppMetadata 
        user_metadata: UserMetadata
        aud: string
        created_at: string; 
    }

    return (
        <div className="min-w-full min-h-screen flex items-center justify-center bg-gray-200">
            {/*
            {!user ? <Auth /> : <Home user={user} />}
            */}
            {
                <div className='demo-app'>
                    <Sidebar/>
                    <Home user={new DummyUser()} />
                </div>
            } 
        </div>
    );
}

export default App;
