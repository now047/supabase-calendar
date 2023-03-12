import { EventInput } from '@fullcalendar/core'

let eventGuid = 0
let todayStr = new Date().toISOString().replace(/T.*$/, '') // YYYY-MM-DD of today


export const toDateString = (timestamp: number) => {
  const d = new Date(timestamp * 1000)
  var year = d.getUTCFullYear();
  var month: string | number = d.getUTCMonth() + 1;
  month = (month < 10 ? '0' + month : month)
  var day = (d.getUTCDate() < 10) ? '0' + d.getUTCDate() : d.getUTCDate();
  var hour = (d.getUTCHours() < 10) ? '0' + d.getUTCHours() : d.getUTCHours();
  var min = (d.getUTCMinutes() < 10) ? '0' + d.getUTCMinutes() : d.getUTCMinutes();
  var sec = (d.getUTCSeconds() < 10) ? '0' + d.getUTCSeconds() : d.getUTCSeconds();
  const str_date = year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
  //const str_date = year + '-' + month + '-' + day;
  return str_date;
}

export const toTimestamp = (strDate: string) => {
  var datum = Date.parse(strDate);
  return datum / 1000;
}

// TODO: use EventInput instead?
export interface IEvent {
  id?: number;
  created_at?: number;
  title: string;
  start: number;
  end: number;
  color: string;
}

// TODO: create unique id
export function createEventId() {
  return String(eventGuid++)
}