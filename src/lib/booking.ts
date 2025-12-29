import { db } from '@/lib/firebase-admin';
import { BookingConfig, DEFAULT_CONFIG } from '@/lib/booking-types';

export async function getBookingConfig(calendarId: string): Promise<BookingConfig> {
    try {
        const doc = await db.collection('booking_configs').doc(calendarId).get();
        if (doc.exists) {
            return doc.data() as BookingConfig;
        }
    } catch (error) {
        console.error('Error fetching booking config:', error);
    }
    return DEFAULT_CONFIG;
}
