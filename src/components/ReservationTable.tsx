import React from "react";
import Container from "@mui/material/Container"
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Box } from "@mui/material";
import IEvent, { toLocalDateString } from "../lib/event-utils";


const ReservationTable = (props: {events: IEvent[]}) => {

    const renderDateString = (params: GridRenderCellParams<number>) => {
        if (params.value === undefined) 
            return '-'
        else
            return toLocalDateString(params.value)
    };

    const eventTableColumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'title',
            headerName: 'Title',
            width: 300,
            editable: false,
        },
        {
            field: 'start',
            headerName: 'Start date',
            type: 'string',
            width: 200,
            editable: false,
            renderCell: renderDateString
        },
        {
            field: 'end',
            headerName: 'End date',
            type: 'string',
            width: 180,
            editable: false,
            renderCell: renderDateString
        }
    ];

    const handleDubleClickOnTable = () => {
        console.log('handleDubleClickOnTable')

    };

    return (
        <div className={"flex m-4 justify-center"}>
        <h1> Reservation </h1>
        <Container sx={{display: 'flex', justifyContent: 'center', width: '90%'}}>
        <Box sx={{height: 400, width: '100%'}}>
            <DataGrid
                rows={props.events}
                columns={eventTableColumns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                checkboxSelection
                disableSelectionOnClick
                experimentalFeatures={{ newEditingApi: true }}
                onCellDoubleClick={handleDubleClickOnTable}
            />
        </Box>
        </Container>
    </div>
    )
}

export default ReservationTable;