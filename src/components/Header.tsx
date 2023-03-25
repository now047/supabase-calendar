
import React from "react";
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DraftsIcon from '@mui/icons-material/Drafts';
import BookIcon from '@mui/icons-material/Book';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState, useContext} from "react";
import { CurrentTabContext } from "./Home";

export type TabLabel = "Resource" | "Calendar" | "Reservation"


const Header = () => {
    const {tab, setTab} = useContext(CurrentTabContext)
    const onChange = (event:any, value:TabLabel) => {
        setTab(value);
    }
    return (
        <header>
            <BottomNavigation
                showLabels
                value={tab}
                onChange={onChange}
            >
                <BottomNavigationAction label="Calendar" value="Calendar" icon={<CalendarMonthIcon/>} />
                <BottomNavigationAction label="Resource" value="Resource" icon={<DraftsIcon/>} />
                <BottomNavigationAction label="Reservation" value="Reservation" icon={<BookIcon/>} />
                <BottomNavigationAction label="Logout" value="Logout" icon={<LogoutIcon/>} />
            </BottomNavigation>
        </header>
    )
};

export default Header;