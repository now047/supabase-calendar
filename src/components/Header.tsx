
import React, { useContext } from "react";
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DraftsIcon from '@mui/icons-material/Drafts';
import BookIcon from '@mui/icons-material/Book';
import LogoutIcon from '@mui/icons-material/Logout';
import { Box, IconButton, Slide } from "@mui/material";
import Alert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close"

import { HeaderContext } from "../App";

export type TabLabel = "Resource" | "Calendar" | "Reservation"

const Header = () => {
  const { tab, setTab, errorText, setError } = useContext(HeaderContext)
  const onChange = (event: any, value: TabLabel) => {
    setTab(value);
  }
  return (
    <header>
      <BottomNavigation
        showLabels
        value={tab}
        onChange={onChange}
      >
        <BottomNavigationAction label="Calendar" value="Calendar" icon={<CalendarMonthIcon />} />
        <BottomNavigationAction label="Reservation" value="Reservation" icon={<BookIcon />} />
        <BottomNavigationAction label="Resource" value="Resource" icon={<DraftsIcon />} />
        <BottomNavigationAction label="Logout" value="Logout" icon={<LogoutIcon />} />
      </BottomNavigation>
      {!!errorText && (
        <Box sx={{ width: '100%' }}>
          <Slide direction="down" in={errorText !== ""} mountOnEnter unmountOnExit>
            <Alert
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setError("");
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{ mb: 2 }}
            >
              {errorText}
            </Alert>
          </Slide>
        </Box>
      )}
    </header>
  )
};

export default Header;