
import BookingCalendar from '@/components/BookingCalendar';

export default function BookingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const calendarId = typeof searchParams.calendarId === 'string' ? searchParams.calendarId : undefined;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <BookingCalendar calendarId={calendarId} />
    </div>
  );
}
