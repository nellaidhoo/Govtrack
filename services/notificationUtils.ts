/**
 * Utility to handle browser-level Web Notifications
 */
export const BrowserNotificationService = {
  /**
   * Request permission from the user to show browser notifications
   */
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notification");
      return "denied";
    }

    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      return await Notification.requestPermission();
    }
    
    return Notification.permission;
  },

  /**
   * Send a browser notification if permission is granted
   */
  send: (title: string, message: string, tag?: string) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      const options: NotificationOptions = {
        body: message,
        icon: 'https://cdn-icons-png.flaticon.com/512/2555/2555013.png', // Mock government/shield icon
        tag: tag || 'govtrack-alert',
        badge: 'https://cdn-icons-png.flaticon.com/512/2555/2555013.png',
        silent: false,
      };

      const notification = new Notification(title, options);
      
      notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        notification.close();
      };
    }
  },

  getPermissionStatus: () => {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  }
};