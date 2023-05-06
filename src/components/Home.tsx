import type { User } from "@supabase/supabase-js";
import React from "react";
import { useEffect, useState, useContext } from "react";
import { supabase } from "../lib/api";
import RecoverPassword from "./RecoverPassword";

import IEvent from "../lib/event-utils";
import ReserveDialog, { ReserveDialogProps } from "./ReserveDialog";
import ResourceDialog from "./ResourceDialog";
import Resource from "../lib/resource-utils";
import Header from "./Header";
import ResourceTable from "./ResourceTable";
import Calendar from "./Calendar";
import ReservationTable from "./ReservationTable";
import { getResourceName } from "../lib/resource-utils";
import { strToTimestamp } from "../lib/event-utils";
import { HeaderContext } from "../App";
import { useResource } from "../contexts/ResourceContext";
import { useEvent } from "../contexts/EventContext";

interface HomeProps {
    user: User;
}

const Home = ({ user }: HomeProps) => {
    const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
    const [reservationInfo, setReservationInfo] =
        useState<ReserveDialogProps | null>(null);
    const [resourceAdding, setResourceAdding] = useState(false);
    const { tab, setError } = useContext(HeaderContext);
    const { resources, addResource } = useResource();

    interface IResults {
        access_token: string;
        refresh_token: string;
        expires_in: string;
        token_type: string;
        type: string;
    }

    useEffect(() => {
        console.log("useEffect");
        /* Recovery url is of the form
         * <SITE_URL>#access_token=x&refresh_token=y&expires_in=z&token_type=bearer&type=recovery
         * Read more on https://supabase.com/docs/reference/javascript/reset-password-email#notes
         */
        let url = window.location.hash;
        let query = url.slice(1);
        let result: IResults = {
            access_token: "",
            refresh_token: "",
            expires_in: "",
            token_type: "",
            type: "",
        };

        query.split("&").forEach((part) => {
            const item = part.split("=");
            result[item[0] as keyof IResults] = decodeURIComponent(item[1]);
        });

        if (result.type === "recovery") {
            setRecoveryToken(result.access_token);
        }
    }, []);

    // Menue
    const handleLogout = async () => {
        supabase.auth.signOut().catch(setError);
    };

    const handleResourceDialogClose = (resource: Resource | null) => {
        console.log("add resource");
        setResourceAdding(false);
        if (resource !== null) addResource(resource);
    };

    // render
    return recoveryToken ? (
        <RecoverPassword
            token={recoveryToken}
            setRecoveryToken={setRecoveryToken}
        />
    ) : reservationInfo ? (
        <div className={"supabase-calendar-main"}>
            <ReserveDialog {...reservationInfo} />
        </div>
    ) : resourceAdding ? (
        <div className={"supabase-calendar-main"}>
            <ResourceDialog
                {...{
                    name: "",
                    generation: "",
                    type: "",
                    open: true,
                    resources: resources!.current,
                    onClose: handleResourceDialogClose,
                }}
            />
        </div>
    ) : tab === "Resource" ? (
        <div className={"supabase-calendar-main"}>
            <Header />
            <ResourceTable setResourceAdding={setResourceAdding} />
        </div>
    ) : tab === "Calendar" ? (
        <div className={"supabase-calendar-main"}>
            <Header />
            <Calendar setReservationInfo={setReservationInfo} />
        </div>
    ) : tab === "Reservation" ? (
        <div className={"supabase-calendar-main"}>
            <Header />
            <ReservationTable setReservationInfo={setReservationInfo} />
        </div>
    ) : (
        <>{handleLogout()}</>
    );
};

export default Home;
