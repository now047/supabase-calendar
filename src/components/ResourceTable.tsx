import React, { useState, useContext } from "react";
import FullCalendar from "@fullcalendar/react";
import listPlugin from '@fullcalendar/list';
import jaLocale from '@fullcalendar/core/locales/ja';
import { Stack, Container, Box, Button, Avatar, Typography } from "@mui/material";
import {
    GridColDef, GridRenderCellParams,
    DataGrid, useGridApiContext, GridRowId, GridRowModel,
    GridToolbarContainer
} from "@mui/x-data-grid";
import { supabase } from "../lib/api";

import { EventContext, HeaderContext } from "../App";
import Resource, { colorMap } from "../lib/resource-utils";

const ResourceTable = (props: {
    setResourceAdding: (b: boolean) => void
    setResourceSynced: (b: boolean) => void
}) => {
    const [resourceTablePageSize, setResourceTablePageSize] = useState<number>(5);
    const { tab, setTab, errorText, setError } = useContext(HeaderContext)
    const { events, resources } = useContext(EventContext);

    const businessHours = {
        daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday 
        startTime: '08:30',
        endTime: '17:15',
    };

    const resourceAvatar = (params: GridRenderCellParams<Resource>) => {
        return <>
            <Avatar sx={{
                bgcolor: colorMap.get(params.value!.display_color),
                width: 24, height: 24
            }}>
                {params.value!.name[0]}
            </Avatar>
            <Typography sx={{ padding: 1 }}>
                {params.value!.name}
            </Typography>
        </>
    };

    const resourceTableColumns: GridColDef[] = [
        {
            field: 'this',
            headerName: 'Name',
            width: 200,
            editable: false,
            renderCell: resourceAvatar
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 100,
            editable: false,
        },
        {
            field: 'generation',
            headerName: 'Generation',
            width: 100,
            editable: false,
        },
        {
            field: 'note',
            headerName: 'Note',
            width: 300,
            editable: false,
        },
    ];


    const handleResourceAdd = () => {
        props.setResourceAdding(true);
    };

    function ResourceTableToolBar() {
        const apiRef = useGridApiContext();

        const deleteResourceSelected = () => {
            //apiRef.current.setPage(1);
            const selectedRows: Map<GridRowId, GridRowModel> = apiRef.current.getSelectedRows();
            const iter = selectedRows.entries()
            let ent = iter.next();
            while (!ent.done) {
                const resource = ent.value[1];
                if (window.confirm(`Are you sure to delete '${resource.name}'`)) {
                    deleteResource(resource.id)
                }
                ent = iter.next();
            }
        }
        return (
            <GridToolbarContainer
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                }}>
                <Button size='small' onClick={deleteResourceSelected}>Delete</Button>
                <Button size='small' onClick={handleResourceAdd}>Add</Button>
            </GridToolbarContainer>
        );
    };

    const deleteResource = async (id: string | undefined) => {
        if (id) {
            let res = await supabase
                .from("resources")
                .delete()
                .eq('id', id)
            props.setResourceSynced(false);
            setError(null);
        }
    };

    const handleDubleClickOnTable = () => {
        console.log('handleDubleClickOnTable')

    };

    return (
        <>
            <Stack spacing={10}>
                <div hidden={false} className={"flex m-4 justify-center"} >
                    <h1> Ressorce </h1>
                    <FullCalendar
                        height={200}
                        plugins={[listPlugin]}
                        initialView="listDay"
                        headerToolbar={{
                            left: 'title',
                            center: '',
                            right: '',
                        }}
                        locales={[jaLocale]}
                        locale='ja'
                        businessHours={businessHours}
                        timeZone='local'
                        events={events!.current as []}
                    />
                </div>
                <div className={"flex m-4 justify-center"}>
                    <Container sx={{ display: 'flex', justifyContent: 'center', width: '90%' }}>
                        <Box sx={{ width: '100%' }}>
                            <DataGrid
                                rows={resources!.current.map((r) => { return { ...r, "this": r } })}
                                columns={resourceTableColumns}
                                rowsPerPageOptions={[5, 10, 20, 50]}
                                pageSize={resourceTablePageSize}
                                onPageSizeChange={(newPageSize) => setResourceTablePageSize(newPageSize)}
                                pagination
                                autoHeight
                                checkboxSelection
                                components={{ Toolbar: ResourceTableToolBar }}
                                disableSelectionOnClick
                                // experimentalFeatures={{ newEditingApi: true }}
                                onCellDoubleClick={handleDubleClickOnTable}
                            />
                        </Box>
                    </Container>
                </div>
            </Stack>
        </>
    )
};

export default ResourceTable