export type StatusDurationOption =
  | "1_DAY"
  | "2_DAYS"
  | "1_WEEK"
  | "2_WEEKS"
  | "1_MONTH"
  | "1_YEAR";

export const ALLOWED_STATUS_DURATIONS: StatusDurationOption[] = [
  "1_DAY",
  "2_DAYS",
  "1_WEEK",
  "2_WEEKS",
  "1_MONTH",
  "1_YEAR",
];

export function calculateStatusExpiry(
  duration: StatusDurationOption = "1_DAY",
  fromTime: Date = new Date()
): Date {
  const d = new Date(fromTime.getTime());
  switch (duration) {
    case "1_DAY":
      d.setDate(d.getDate() + 1);
      break;
    case "2_DAYS":
      d.setDate(d.getDate() + 2);
      break;
    case "1_WEEK":
      d.setDate(d.getDate() + 7);
      break;
    case "2_WEEKS":
      d.setDate(d.getDate() + 14);
      break;
    case "1_MONTH":
      d.setDate(d.getDate() + 30);
      break;
    case "1_YEAR":
      d.setDate(d.getDate() + 365);
      break;
    default:
      d.setDate(d.getDate() + 1);
      break;
  }
  return d;
}

