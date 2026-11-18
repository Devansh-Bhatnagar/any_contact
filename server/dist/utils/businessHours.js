"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOpenStatus = calculateOpenStatus;
const DEFAULT_DAYS = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];
function calculateOpenStatus(workingHoursRaw, manualStatus, clientDate = new Date()) {
    if (manualStatus === "CLOSED") {
        return {
            isOpen: false,
            statusText: "Temporarily Closed",
            todayHours: "Closed today",
        };
    }
    if (manualStatus === "OPEN") {
        return {
            isOpen: true,
            statusText: "Open Now",
            todayHours: "Open (Manual Override)",
        };
    }
    if (!workingHoursRaw || typeof workingHoursRaw !== "object") {
        return {
            isOpen: true,
            statusText: "Open Now",
            todayHours: "09:00 AM - 08:00 PM",
        };
    }
    const hours = workingHoursRaw;
    const dayName = DEFAULT_DAYS[clientDate.getDay()];
    const todaySchedule = hours[dayName];
    if (!todaySchedule || todaySchedule.isClosed) {
        return {
            isOpen: false,
            statusText: "Closed",
            todayHours: "Closed today",
        };
    }
    const { open, close } = todaySchedule;
    if (!open || !close) {
        return {
            isOpen: true,
            statusText: "Open Now",
            todayHours: "Open",
        };
    }
    const [openHour, openMin] = open.split(":").map(Number);
    const [closeHour, closeMin] = close.split(":").map(Number);
    const currentMinutes = clientDate.getHours() * 60 + clientDate.getMinutes();
    const openMinutes = openHour * 60 + (openMin || 0);
    const closeMinutes = closeHour * 60 + (closeMin || 0);
    const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    const formatTime = (timeStr) => {
        const [h, m] = timeStr.split(":").map(Number);
        const period = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 || 12;
        const displayM = m < 10 ? `0${m}` : m;
        return `${displayH}:${displayM} ${period}`;
    };
    return {
        isOpen,
        statusText: isOpen ? "Open Now" : "Closed",
        todayHours: `${formatTime(open)} - ${formatTime(close)}`,
    };
}
