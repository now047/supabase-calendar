import React, { useContext, useState } from "react";
import Container from "@mui/material/Container"
import { DataGrid, GridColDef, GridRenderCellParams, GridRowId, GridRowModel, GridToolbarContainer, useGridApiContext } from "@mui/x-data-grid";
import { Box, Button } from "@mui/material";
import { supabase } from "../lib/api";
import IEvent, { toLocalDateString } from "../lib/event-utils";
import { ReserveDialogProps } from "./ReserveDialog";
import { HeaderContext } from "../App";

const ReservationTable = (props: {
    events: IEvent[],
    setReservationInfo: (info: ReserveDialogProps) => void,
    setEventSynced: (b: boolean) => void,
}) => {
    const [pageSize, setPageSize] = useState<number>(20);
    const renderDateString = (params: GridRenderCellParams<number>) => {
        if (params.value === undefined)
            return '-'
        else
            return toLocalDateString(params.value)
    };

    const { user, setError } = useContext(HeaderContext);

    function ReserveTableToolBar() {
        const apiRef = useGridApiContext();

        const deleteEventSelected = () => {
            //apiRef.current.setPage(1);
            const selectedRows: Map<GridRowId, GridRowModel> = apiRef.current.getSelectedRows();
            const iter = selectedRows.entries()
            let ent = iter.next();
            while (!ent.done) {
                const event = ent.value[1];
                if (window.confirm(`Are you sure to cancel resarvation ? : '${event.purpose_of_use}'`)) {
                    deleteEvent(event.id)
                }
                ent = iter.next();
            }
        }
        return (
            <GridToolbarContainer
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'left',
                }}>
                <Button size='small' onClick={deleteEventSelected}>Delete</Button>
            </GridToolbarContainer>
        );
    };

    const deleteEvent = async (id: string | undefined) => {
        if (id) {
            let res = await supabase
                .from("events")
                .delete()
                .eq('id', id)
            props.setEventSynced(false);
            setError(null);
        }
    };

    const eventTableColumns: GridColDef[] = [
        //{ field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'resource_name',
            headerName: 'Resource',
            width: 200,
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
        },
        {
            field: 'purpose_of_use',
            headerName: 'Pose of use',
            width: 400,
            editable: false,
        },
    ];

    const handleDubleClickOnTable = () => {
        console.log('handleDubleClickOnTable')

    };

    return (
        <div className={"flex m-4 justify-center"}>
            <h1> Reservation </h1>
            <Container sx={{ display: 'flex', justifyContent: 'center', width: '90%' }}>
                <Box sx={{ width: '100%' }}>
                    <DataGrid
                        rows={props.events}
                        columns={eventTableColumns}
                        pageSize={pageSize}
                        autoHeight
                        rowsPerPageOptions={[10, 20, 50, 100]}
                        onPageSizeChange={(size) => setPageSize(size)}
                        checkboxSelection
                        disableSelectionOnClick
                        components={{ Toolbar: ReserveTableToolBar }}
                        experimentalFeatures={{ newEditingApi: true }}
                        onCellDoubleClick={handleDubleClickOnTable}
                    />
                </Box>
            </Container>
        </div>
    )
}

export default ReservationTable;