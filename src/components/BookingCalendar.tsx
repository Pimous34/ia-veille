
'use client';
import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2, Calendar, Clock, CheckCircle } from 'lucide-react';

interface BookingCalendarProps {
  calendarId?: string;
}

export default function BookingCalendar({ calendarId }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  
  const [loadingDays, setLoadingDays] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Génération du calendrier visuel
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Navigation Mois
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Fetch Slots quand une date est sélectionnée
  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate]);

  const fetchSlots = async (date: Date) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      let url = `/api/booking/slots?year=${year}&month=${month}&day=${day}`;
      if (calendarId) {
        url += `&calendarId=${encodeURIComponent(calendarId)}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setTimeSlots(data.timeSlots);
      } else {
        console.error("Error fetching slots", data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/booking/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          ...formData,
          calendarId // Pass the calendarId to the API
        })
      });
      const data = await res.json();
      if (data.success) {
        setBookingSuccess(true);
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (e) {
      alert("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-green-50 rounded-xl border border-green-200">
        <CheckCircle className="w-16 h-16 text-green-600" />
        <h2 className="text-2xl font-bold text-green-800">Rendez-vous confirmé !</h2>
        <p className="text-green-700">Merci {formData.name}, un email d'invitation vous a été envoyé.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Nouveau RDV</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden flex flex-col md:flex-row h-[600px]">
      
      {/* Coté Gauche : Calendrier */}
      <div className="w-full md:w-1/2 p-6 border-r border-gray-100 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>
          <div className="flex space-x-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-4">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2 flex-1 content-start">
          {daysInMonth.map((day) => {
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isClosed = day.getDay() === 0; // Fermé le Dimanche uniquement
            
            return (
              <button
                key={day.toString()}
                disabled={isClosed}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square rounded-full flex items-center justify-center text-sm transition-all
                  ${isSelected ? 'bg-black text-white shadow-lg scale-110' : ''}
                  ${!isSelected && !isClosed ? 'hover:bg-gray-100 text-gray-700' : ''}
                  ${isClosed ? 'text-gray-300 cursor-not-allowed' : ''}
                  ${isToday && !isSelected ? 'border border-black font-bold' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Coté Droit : Slots & Formulaire */}
      <div className="w-full md:w-1/2 p-6 bg-gray-50 flex flex-col">
        {selectedDate ? (
          <>
             <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
               <Calendar className="w-4 h-4 mr-2" />
               {format(selectedDate, 'dP MMMM yyyy', { locale: fr })}
             </h3>

             {loadingSlots ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
             ) : (
                !selectedSlot ? (
                  <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {timeSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((slot, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedSlot(slot)}
                            className="p-2 text-sm border bg-white rounded hover:border-black hover:shadow-sm transition text-gray-700 flex items-center justify-center"
                          >
                            <Clock className="w-3 h-3 mr-2 text-gray-400" />
                            {format(parseISO(slot.startTime), 'HH:mm')}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 mt-10">Aucun créneau disponible ce jour.</p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleBook} className="flex-1 flex flex-col space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-white p-3 rounded border text-sm flex justify-between items-center">
                      <span className="font-semibold">{format(parseISO(selectedSlot.startTime), 'HH:mm')} - {format(parseISO(selectedSlot.endTime), 'HH:mm')}</span>
                      <button type="button" onClick={() => setSelectedSlot(null)} className="text-blue-600 hover:underline text-xs">Changer</button>
                    </div>

                    <div className="space-y-3">
                       <input 
                         required 
                         type="text" 
                         placeholder="Votre Nom" 
                         className="w-full p-2 rounded border focus:ring-2 focus:ring-black focus:outline-none"
                         onChange={e => setFormData({...formData, name: e.target.value})}
                       />
                       <input 
                         required 
                         type="email" 
                         placeholder="Votre Email" 
                         className="w-full p-2 rounded border focus:ring-2 focus:ring-black focus:outline-none"
                         onChange={e => setFormData({...formData, email: e.target.value})}
                       />
                       <input 
                         required 
                         type="tel" 
                         placeholder="Téléphone" 
                         className="w-full p-2 rounded border focus:ring-2 focus:ring-black focus:outline-none"
                         onChange={e => setFormData({...formData, phone: e.target.value})}
                       />
                    </div>

                    <button 
                      disabled={submitting} 
                      type="submit" 
                      className="w-full mt-auto py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmer le Rendez-vous'}
                    </button>
                  </form>
                )
             )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Calendar className="w-12 h-12 mb-2 opacity-20" />
            <p>Sélectionnez une date</p>
          </div>
        )}
      </div>

    </div>
  );
}
