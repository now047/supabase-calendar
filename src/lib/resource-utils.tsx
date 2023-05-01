import {
    red,
    pink,
    purple,
    deepPurple,
    indigo,
    blue,
    lightBlue,
    cyan,
    teal,
    green,
    lightGreen,
    lime,
    yellow,
    amber,
    orange,
    deepOrange,
    brown,
    grey,
    blueGrey,
} from "@mui/material/colors";

type HueKeys =
    | "50"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900"
    | "A100"
    | "A200"
    | "A400"
    | "A700";

const keys = Object.keys(red) as HueKeys[];

export const colorMap = (col: number) =>
    new Map([
        [1, red[keys[col]]],
        [2, pink[keys[col]]],
        [3, purple[keys[col]]],
        [4, deepPurple[keys[col]]],
        [5, indigo[keys[col]]],
        [6, blue[keys[col]]],
        [7, lightBlue[keys[col]]],
        [8, cyan[keys[col]]],
        [9, teal[keys[col]]],
        [10, green[keys[col]]],
        [11, lightGreen[keys[col]]],
        [12, lime[keys[col]]],
        [13, yellow[keys[col]]],
        [14, amber[keys[col]]],
        [15, orange[keys[col]]],
        [16, deepOrange[keys[col]]],
        [17, brown[keys[col]]],
        [18, grey[keys[col]]],
        [19, blueGrey[keys[col]]],
    ]);

export default interface Resource {
    id: number;
    name: string;
    type: string;
    generation: string;
    note: string;
    display_color: number;
}

export const getResourceName = (id: number, resources: Resource[]) => {
    const ret = resources.filter((r) => r.id === id);
    if (ret !== undefined && (ret as []).length !== 0) {
        return ret[0].name;
    } else {
        return "Unknown-" + id.toString();
    }
};
