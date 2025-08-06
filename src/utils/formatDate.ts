export function formatDate(date: Date | string, format: string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const fullMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();

  switch (format) {
    case "MMM d, yyyy":
      return `${months[month]} ${day}, ${year}`;
    case "MMM d":
      return `${months[month]} ${day}`;
    case "MMMM d, yyyy":
      return `${fullMonths[month]} ${day}, ${year}`;
    default:
      return d.toLocaleDateString();
  }
}
