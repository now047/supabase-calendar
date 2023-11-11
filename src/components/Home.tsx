import type { User } from "@supabase/supabase-js";
import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/api";
import RecoverPassword from "./RecoverPassword";

import ReserveDialog, { ReserveDialogProps } from "./ReserveDialog";
import ResourceDialog, { ResourceDialogPrams } from "./ResourceDialog";
import Resource from "../lib/resource-utils";
import ResourceTable from "./ResourceTable";
import Calendar from "./Calendar";
import ReservationTable from "./ReservationTable";
import { useAnnotation } from "../contexts/AnnotationContext";
import { useResource } from "../contexts/ResourceContext";
import { useHeader } from "../contexts/HeaderContext";

const Home = () => {
    const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
    const [reservationInfo, setReservationInfo] =
        useState<ReserveDialogProps | null>(null);
    const [resourcePrams, setResourcePrams] =
        useState<ResourceDialogPrams | null>(null);
    const { tab } = useHeader();
    const { setError } = useAnnotation();
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
        //setResourceAdding(false);
        setResourcePrams(null);
        if (resource !== null) addResource(resource);
    };

    const renderResourceDialog = () => {
        return resourcePrams ? (
            <ResourceDialog
                id={resourcePrams.id}
                name={resourcePrams.name}
                generation={resourcePrams.generation}
                type={resourcePrams.type}
                note={resourcePrams.note}
                display_color={resourcePrams.display_color}
                open={true}
                resources={resources!.current}
                onClose={handleResourceDialogClose}
            />
        ) : (
            <></>
        );
    };

    const renderReserveDialog = () => {
        return reservationInfo ? <ReserveDialog {...reservationInfo} /> : <></>;
    };

    // render
    return recoveryToken ? (
        <RecoverPassword
            token={recoveryToken}
            setRecoveryToken={setRecoveryToken}
        />
    ) : tab === "Resource" ? (
        <>
            <ResourceTable setResourcePrams={setResourcePrams} />
            {renderResourceDialog()}
        </>
    ) : tab === "Calendar" ? (
        <>
            <Calendar setReservationInfo={setReservationInfo} />
            {renderReserveDialog()}
        </>
    ) : tab === "Reservation" ? (
        <ReservationTable />
    ) : (
        <>{handleLogout()}</>
    );
};

export default Home;
