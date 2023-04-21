import React, { useState, useContext } from "react";
import {
    Badge,
    Container,
    Box,
    Stack,
    FormControl,
    FormLabel,
    FormGroup,
    FormControlLabel,
    Checkbox,
    InputLabel,
    OutlinedInput,
    MenuItem,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import { Avatar } from "@mui/material";
import { Typography } from "@mui/material";

import { colorMap } from "../lib/resource-utils";
import Resource from "../lib/resource-utils";
import { EventContext } from "../App";

import { Theme, useTheme } from "@mui/material/styles";

const Sidebar = (props: {
    handleSelectChange: (k: string, n: string, v: boolean) => void;
}) => {
    const ctx = useContext(EventContext);

    const resourceAvatar = (params: GridRenderCellParams<Resource>) => {
        return (
            <>
                <Avatar
                    sx={{
                        bgcolor: colorMap.get(params.value!.display_color),
                        width: 20,
                        height: 20,
                    }}
                >
                    {params.value!.name[0]}
                </Avatar>
                <Typography sx={{ padding: 1 }}>
                    {params.value!.name}
                </Typography>
            </>
        );
    };
    const resourceTableColumns: GridColDef[] = [
        {
            field: "this",
            headerName: "Resource",
            width: 200,
            editable: false,
            renderCell: resourceAvatar,
        },
    ];

    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 100,
            },
        },
    };

    const theme = useTheme();

    function getStyles(
        name: string,
        selected: readonly string[],
        theme: Theme
    ) {
        return {
            fontWeight:
                selected.indexOf(name) === -1
                    ? theme.typography.fontWeightRegular
                    : theme.typography.fontWeightMedium,
        };
    }

    type ResourceProparty = "types" | "generations";
    const renderTypeMenueItm = (kind: ResourceProparty) => {
        const keys = Array.from(ctx.resourceTypes![kind].keys());
        return keys.map((k) => (
            <MenuItem
                key={k}
                value={k}
                style={getStyles(
                    k,
                    Array.from(ctx.resourceTypes![kind].entries())
                        .filter((kv) => kv[1])
                        .map((kv) => kv[0]),
                    theme
                )}
            >
                {" "}
                {k}{" "}
            </MenuItem>
        ));
    };

    const handleTypesChange = (
        kind: ResourceProparty,
        event: SelectChangeEvent<string[]>
    ) => {
        const {
            target: { value },
        } = event;

        //
        const selected = typeof value === "string" ? value.split(",") : value;
        const not_selected = Array.from(ctx.resourceTypes![kind].keys()).filter(
            (s) => selected.indexOf(s) === -1
        );
        console.log("selected", selected);
        console.log("not_selected", not_selected);

        selected.forEach((v) => {
            if (ctx.resourceTypes![kind].get(v) === false) {
                props.handleSelectChange(kind, v, true);
            }
        });
        not_selected.forEach((v) => {
            if (ctx.resourceTypes![kind].get(v) === true) {
                props.handleSelectChange(kind, v, false);
            }
        });
    };

    const renderTypeSelectForm = (kind: ResourceProparty) => {
        return (
            <FormControl sx={{ m: 1, width: 230 }}>
                <InputLabel id={"select-label-" + kind}>
                    Select {kind}
                </InputLabel>
                <Select
                    labelId={"select-label-" + kind}
                    id={"select-" + kind}
                    multiple
                    value={Array.from(ctx.resourceTypes![kind].entries())
                        .filter((kv) => kv[1])
                        .map((kv) => kv[0])}
                    onChange={handleTypesChange.bind(null, kind)}
                    input={
                        <OutlinedInput
                            id={"select-" + kind}
                            label={"resource-" + kind}
                        />
                    }
                    renderValue={(selected: string[]) => (
                        <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                            {selected.map((value) => (
                                <Chip key={value} label={value} />
                            ))}
                        </Box>
                    )}
                    MenuProps={MenuProps}
                >
                    {renderTypeMenueItm(kind)}
                </Select>
            </FormControl>
        );
    };

    return (
        <div className="supabase-calendar-sidebar">
            <div className="supabase-calendar-sidebar-section">
                {renderTypeSelectForm("types")}
                {renderTypeSelectForm("generations")}
            </div>
            <div className="supabase-calendar-sidebar-table">
                <Container
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        width: "100%",
                    }}
                >
                    <Box sx={{ width: "100%" }}>
                        <DataGrid
                            rows={ctx.selectedResources!.map((r) => {
                                return { ...r, this: r };
                            })}
                            columns={resourceTableColumns}
                            rowsPerPageOptions={[25]}
                            pageSize={25}
                            pagination
                            autoHeight
                            disableSelectionOnClick
                        />
                    </Box>
                </Container>
            </div>
        </div>
    );
};

export default Sidebar;
