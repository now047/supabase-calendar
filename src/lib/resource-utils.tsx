import {
  red, pink, purple, deepPurple,
  indigo, blue, lightBlue, cyan,
  teal, green, lightGreen, lime,
  yellow, amber, orange, deepOrange,
  brown, grey, blueGrey
} from '@mui/material/colors';

const hue = 500;
export const colorMap = new Map(
  [
    [1, red[hue]],
    [2, pink[hue]],
    [3, purple[hue]],
    [4, deepPurple[hue]],
    [5, indigo[hue]],
    [6, blue[hue]],
    [7, lightBlue[hue]],
    [8, cyan[hue]],
    [9, teal[hue]],
    [10, green[hue]],
    [11, lightGreen[hue]],
    [12, lime[hue]],
    [13, yellow[hue]],
    [14, amber[hue]],
    [15, orange[hue]],
    [16, deepOrange[hue]],
    [17, brown[hue]],
    [18, grey[hue]],
    [19, blueGrey[hue]]
  ]
);

export default interface Resource {
  id: number;
  name: string;
  type: string;
  generation: string;
  note: string;
  display_color: number;
}

export const getResouceColor = (id: number, resources: Resource[]) => {
  return colorMap.get(resources.filter(r => r.id === id)[0].display_color);
}

export const getResourceName = (id: number, resources: Resource[]) => {
  return resources.filter((r) => r.id === id)[0].name;
}