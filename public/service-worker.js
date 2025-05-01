self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('Push received:', data);

    const options = {
        body: data.body,
        icon: data.icon || '/icons/notification-icon.png',
        badge: data.badge || '/icons/badge.png',
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
