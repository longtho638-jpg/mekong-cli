export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined') return null;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('Push notifications not supported');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;

  // Replace with your actual VAPID public key
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

  try {
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource
    });

    // Send subscription to backend
    // This is where you would normally call your API
    console.log('Push subscription:', subscription);

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(Array.from(rawData).map(char => char.charCodeAt(0)));
}
