import React, { useContext } from "react";
import {
    Container,
    Box,
    FormControl,
    InputLabel,
    OutlinedInput,
    MenuItem,
    Slider,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import { Avatar } from "@mui/material";
import { Typography } from "@mui/material";

import Resource from "../lib/resource-utils";

import { Theme, useTheme } from "@mui/material/styles";
import { useColor } from "../contexts/ColorContext";
import { useResource } from "../contexts/ResourceContext";

const Sidebar = () => {
    const { resourceTypes, selectedResources, handleSelectChange } =
        useResource();

    const { colors, setHue } = useColor();

    const resourceAvatar = (params: GridRenderCellParams<Resource>) => {
        return (
            <>
                <Avatar
                    variant="rounded"
                    sx={{
                        bgcolor: colors.get(params.value!.display_color),
                        fontSize: 12,
                        width: 24,
                        height: 24,
                    }}
                >
                    {params.value!.name[0] + params.value!.type[0]}
                </Avatar>
            </>
        );
    };
    const resourceTableColumns: GridColDef[] = [
        {
            field: "this",
            headerName: "Icon",
            width: 30,
            editable: false,
            renderCell: resourceAvatar,
        },
        {
            headerName: "Name",
            field: "name",
            width: 200,
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
        const keys = Array.from(resourceTypes[kind].keys());
        return keys.map((k) => (
            <MenuItem
                key={k}
                value={k}
                style={getStyles(
                    k,
                    Array.from(resourceTypes[kind].entries())
                        .filter((kv) => kv[1])
                        .map((kv) => kv[0]),
                    theme
                )}
            >
                {k}
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
        const not_selected = Array.from(resourceTypes[kind].keys()).filter(
            (s) => selected.indexOf(s) === -1
        );
        console.log("selected", selected);
        console.log("not_selected", not_selected);

        selected.forEach((v) => {
            if (resourceTypes[kind].get(v) === false) {
                handleSelectChange(kind, v, true);
            }
        });
        not_selected.forEach((v) => {
            if (resourceTypes[kind].get(v) === true) {
                handleSelectChange(kind, v, false);
            }
        });
    };

    const handleSelectColorChange = (
        event: Event,
        value: number | number[],
        activeThumb: number
    ) => {
        if (Array.isArray(value)) {
            return;
        }
        setHue(value);
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
                    value={Array.from(resourceTypes[kind].entries())
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
                            rows={selectedResources.map((r) => {
                                return { ...r, this: r };
                            })}
                            columns={resourceTableColumns}
                            rowsPerPageOptions={[10]}
                            pageSize={10}
                            pagination
                            autoHeight
                            disableSelectionOnClick
                        />
                    </Box>
                </Container>
                <Container
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        width: "100%",
                    }}
                >
                    <Box sx={{ width: "94%" }}>
                        <Typography
                            gutterBottom
                            fontSize={12}
                            sx={{ marginTop: 4 }}
                        >
                            Select your favorite color !
                        </Typography>
                        <Slider
                            aria-label="color-select"
                            max={13}
                            min={0}
                            defaultValue={5}
                            color="secondary"
                            size="small"
                            onChange={handleSelectColorChange}
                        />
                    </Box>
                </Container>
            </div>
        </div>
    );
};

export default Sidebar;
