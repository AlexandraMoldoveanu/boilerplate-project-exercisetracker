import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);

export const isNumber = (arg) => {
  return arg && !Number.isNaN(parseInt(arg));
};

export const isDateValid = (date) => {
  const allowedFormats = ["YYYY-MM-DD", "MM/DD/YYYY", "DD-MM-YYYY"];

  return allowedFormats.some((format) => dayjs(date, format, true).isValid());
};
