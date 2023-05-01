import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import { Alert, Avatar, Snackbar, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { MobileDateTimePicker } from "@mui/x-date-pickers";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import IEvent from "../lib/event-utils";
import Resource from "../lib/resource-utils";
import { EventContext } from "../App";

export interface ReserveDialogProps {
    id?: string;
    open: boolean;
    user: string;
    start: number;
    end?: number;
    purpose_of_use?: string;
    resource_name: string;
    resources: Resource[];
    resource_id?: number;
    onClose: (event: IEvent | null) => void;
    onDelete: (id: string | undefined, title: string | undefined) => void;
}

const ReserveDialog = (props: ReserveDialogProps) => {
    const { colors } = React.useContext(EventContext);
    const [user, setUser] = React.useState(props.user);
    const [resource_id, setResourceId] = React.useState<number>(
        props.resource_id ?? 1
    );
    const [start, setStart] = React.useState(dayjs(props.start));
    const [end, setEnd] = React.useState(
        props.end ? dayjs(props.end) : dayjs(props.start)
    );
    const [purposeOfUse, setPurposeOfUse] = React.useState(
        props.purpose_of_use ?? "a"
    );
    const [purposeOfUseError, setPurposeOfUseError] = React.useState(false);
    const [durationError, setDurationError] = React.useState(false);

    const handleClose = (cancel: boolean) => {
        if (purposeOfUse === "") {
            setPurposeOfUseError(true);
        } else if (!cancel) {
            if (start.unix() >= end.unix()) {
                setDurationError(true);
                return;
            }
            props.onClose({
                id: props.id,
                start: start.unix() * 1000,
                end: end.unix() * 1000,
                purpose_of_use: purposeOfUse,
                resource_id: resource_id,
            } as IEvent);
        } else {
            props.onClose(null);
        }
    };

    const handleStartChange = (s: Dayjs | null) => {
        if (s !== null) {
            setStart(s);
        }
    };

    const handleEndChange = (e: Dayjs | null) => {
        if (e !== null) {
            setEnd(e);
        }
    };

    const handlePOUChange = (
        t: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
    ) => {
        setPurposeOfUse(t.currentTarget.value);
        setPurposeOfUseError(false);
    };

    const handleDelete = () => {
        props.onDelete(props.id, purposeOfUse);
    };

    const handleResourceChange = (event: SelectChangeEvent) => {
        console.log("resource change: value=", event.target);
        setResourceId(Number(event.target.value));
    };

    function ProLabel({ children }: { children: React.ReactNode }) {
        return (
            <Stack direction="row" spacing={0.5} component="span">
                <Tooltip title="Included in Pro package">
                    <a href="/x/introduction/licensing/#pro-plan">
                        <span className="plan-pro" />
                    </a>
                </Tooltip>
                <span>{children}</span>
            </Stack>
        );
    }

    return (
        <Dialog onClose={handleClose.bind(null, true)} open={props.open}>
            <Snackbar
                open={durationError}
                autoHideDuration={6000}
                onClose={setDurationError.bind(null, false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity="error">
                    "Start time cannot be after the End time."
                </Alert>
            </Snackbar>
            <DialogTitle>Make Reservation !</DialogTitle>

            <Box sx={{ "& > :not(style)": { m: 2 } }} width={300}>
                <DemoContainer
                    components={[
                        "Purpose",
                        "Resource",
                        "Start",
                        "End",
                        "Delete",
                    ]}
                >
                    <DemoItem
                        label={<ProLabel>Purpose</ProLabel>}
                        component="Purpose"
                    >
                        <TextField
                            autoFocus
                            required
                            error={purposeOfUseError}
                            helperText={
                                purposeOfUseError ? "Please enter a value" : ""
                            }
                            focused={purposeOfUse === ""}
                            id="pou-input"
                            label="Input purpose of use"
                            variant="outlined"
                            value={purposeOfUse}
                            onChange={handlePOUChange}
                        />
                    </DemoItem>
                    <DemoItem
                        label={<ProLabel>Resource</ProLabel>}
                        component="Resource"
                    >
                        <FormControl fullWidth>
                            <Select
                                id="resource-select"
                                value={resource_id.toString()}
                                label="resource"
                                onChange={handleResourceChange}
                            >
                                {props.resources.map((r) => (
                                    <MenuItem
                                        key={"resource-" + r.id}
                                        value={r.id}
                                    >
                                        <Stack
                                            direction="row"
                                            justifyContent={"flex-start"}
                                            spacing={1}
                                        >
                                            <Avatar
                                                variant="rounded"
                                                sx={{
                                                    bgcolor: colors!.get(
                                                        r.display_color
                                                    ),
                                                    fontSize: 12,
                                                    width: 24,
                                                    height: 24,
                                                }}
                                            >
                                                {r.name[0] + r.type[0]}{" "}
                                            </Avatar>
                                            <Typography>{r.name}</Typography>
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DemoItem>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DemoItem
                            label={<ProLabel>Start Date & Time</ProLabel>}
                            component="Start"
                        >
                            <MobileDateTimePicker
                                value={start}
                                onChange={handleStartChange}
                            />
                        </DemoItem>
                        <DemoItem
                            label={<ProLabel>End Date & Time</ProLabel>}
                            component="End"
                        >
                            <MobileDateTimePicker
                                value={end}
                                onChange={handleEndChange}
                            />
                        </DemoItem>
                    </LocalizationProvider>
                    <DemoItem component="Delete">
                        <Stack
                            paddingBottom={2}
                            justifyContent={"space-between"}
                            direction="row"
                        >
                            {props.id ? (
                                <Button onClick={handleDelete} variant="text">
                                    Delete
                                </Button>
                            ) : (
                                <Button onClick={handleDelete} variant="text">
                                    Cancel
                                </Button>
                            )}
                            <Button
                                onClick={handleClose.bind(null, false)}
                                variant="text"
                            >
                                Save
                            </Button>
                        </Stack>
                    </DemoItem>
                </DemoContainer>
            </Box>
        </Dialog>
    );
};

export default ReserveDialog;
