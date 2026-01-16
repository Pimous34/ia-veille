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
