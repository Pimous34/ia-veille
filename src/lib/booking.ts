import { db } from '@/lib/firebase-admin';

export interface Service {
    id: string;
    name: string;
    duration: number; // minutes
    price: number;
}

export interface WorkingHours {
    start: string; // "HH:MM"
    end: string;
}

export interface BookingConfig {
    services: Service[];
    workingHours: Record<string, WorkingHours>; // "1" (Mon) -> { start, end }
}

export const DEFAULT_CONFIG: BookingConfig = {
    services: [
        { id: 'default', name: 'Rendez-vous standard', duration: 30, price: 0 }
    ],
    workingHours: {
        '1': { start: '09:00', end: '17:00' },
        '2': { start: '09:00', end: '17:00' },
        '3': { start: '09:00', end: '17:00' },
        '4': { start: '09:00', end: '17:00' },
        '5': { start: '09:00', end: '17:00' },
    }
};

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
