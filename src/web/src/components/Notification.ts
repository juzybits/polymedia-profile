import "./Notification.less";

export function notifyOkay(message: string): void {
    notify("okay", message);
}

export function notifyError(message: string): void {
    notify("error", message);
}

function notify(type: string, message: string): void {
    const notification = document.createElement("div");
    notification.classList.add("notification");
    if (type=="okay") {
        notification.classList.add("okay");
    } else if (type=="error") {
        notification.classList.add("error");
    }
    notification.textContent = message;
    document.body.appendChild(notification);

    // Show notification
    notification.classList.add("show");

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500); // Delay removal to allow for fadeout animation
    }, 3000);
}
