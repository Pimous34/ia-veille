```
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Clock, Check, Scissors } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addDays, startOfWeek, endOfWeek, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface BookingCalendarProps {
  calendarId?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface BookingConfig {
  services: Service[];
  workingHours: any;
}

export default function BookingCalendar({ calendarId }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  
  // New States for Multi-Service
  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [step, setStep] = useState<'service' | 'date' | 'form'>('service'); // service -> date -> form

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // 1. Fetch Config on Mount
  useEffect(() => {
    if (!calendarId) return;
    
    setLoading(true);
    fetch(`/api/booking/config?calendarId=${calendarId}`)
      .then(res => res.json())
      .then(data => {
        if (data.services && data.services.length > 0) {
          setConfig(data);
          // Auto-select if only 1 service
          if (data.services.length === 1) {
            setSelectedService(data.services[0]);
            setStep('date');
          }
        } else {
             // Fallback default
             const defaultService = { id: 'default', name: 'Rendez-vous', duration: 30, price: 0 };
             setConfig({ services: [defaultService], workingHours: {} });
             setSelectedService(defaultService);
             setStep('date');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching config:', err);
        setLoading(false);
      });
  }, [calendarId]);

  // 2. Fetch Slots when Date or Service changes
  useEffect(() => {
    if (selectedDate && selectedService && calendarId) {
      const fetchSlots = async () => {
        setLoading(true);
        try {
          const formattedDate = format(selectedDate, 'yyyy-MM-dd');
          const res = await fetch(
            `/api/booking/slots?year=${selectedDate.getFullYear()}&month=${selectedDate.getMonth() + 1}&day=${selectedDate.getDate()}&calendarId=${calendarId}&serviceId=${selectedService.id}`
          );
          const data = await res.json();
          if (data.success) {
            setSlots(data.timeSlots);
          } else {
            setSlots([]);
          }
        } catch (error) {
          console.error('Error fetching slots:', error);
          toast.error('Erreur lors du chargement des créneaux');
        } finally {
          setLoading(false);
        }
      };
      
      fetchSlots();
    }
  }, [selectedDate, calendarId, selectedService]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !calendarId || !selectedService) return;

    setBookingStatus('loading');
    try {
      const res = await fetch('/api/booking/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slot: selectedSlot,
          ...formData,
          calendarId,
          serviceId: selectedService.id,
          serviceName: selectedService.name
        }),
      });

      const data = await res.json();

      if (data.success) {
        setBookingStatus('success');
        toast.success('Rendez-vous confirmé !');
      } else {
        throw new Error(data.error || 'Erreur lors de la réservation');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingStatus('error');
      toast.error("Impossible de réserver ce créneau.");
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // STEP 1: SERVICE SELECTION
  if (step === 'service' && config && config.services.length > 1) {
      return (
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
                  <h2 className="text-xl font-bold">Choisissez une prestation</h2>
                  <p className="text-blue-100 text-sm mt-1">Sélectionnez le type de rendez-vous souhaité</p>
              </div>
              <div className="p-4 space-y-3">
                  {config.services.map(service => (
                      <button
                          key={service.id}
                          onClick={() => { setSelectedService(service); setStep('date'); }}
                          className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                      >
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                  <Scissors size={18} />
                              </div>
                              <div className="text-left">
                                  <div className="font-semibold text-gray-900 group-hover:text-blue-700">{service.name}</div>
                                  <div className="text-xs text-gray-500">{service.duration} min</div>
                              </div>
                          </div>
                          <div className="font-bold text-gray-700 group-hover:text-blue-700">
                              {service.price > 0 ? `${service.price}€` : ''}
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  // Success View
  if (bookingStatus === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
          <Check size={40} strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Réservation Confirmée !</h2>
        <p className="text-gray-600 mb-6">
          Un email de confirmation a été envoyé à <strong>{formData.email}</strong>.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-left border border-gray-100 mb-6">
            <div className="flex justify-between mb-2">
                <span className="text-gray-500 text-sm">Service</span>
                <span className="font-medium text-gray-900">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between mb-2">
                <span className="text-gray-500 text-sm">Date</span>
                <span className="font-medium text-gray-900">{selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: fr }) : ''}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Heure</span>
                <span className="font-medium text-gray-900">{selectedSlot ? format(new Date(selectedSlot.startTime), 'HH:mm') : ''}</span>
            </div>
        </div>
        <button 
          onClick={() => { setBookingStatus('idle'); setSelectedSlot(null); setStep('service'); }}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full"
        >
          Nouvelle réservation
        </button>
      </motion.div>
    );
  }

  // Calendar & Form View
  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
  });
  
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row h-[600px]">
        {/* Sidebar Info - Only on Desktop */}
        <div className="hidden md:flex flex-col w-64 bg-slate-900 text-white p-6 justify-between">
             <div>
                 <div className="mb-8">
                     <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Service sélectionné</h3>
                     <div className="flex items-center gap-2">
                         <Scissors size={16} className="text-blue-400"/>
                         <span className="font-semibold text-lg">{selectedService?.name}</span>
                     </div>
                     <button onClick={() => setStep('service')} className="text-xs text-blue-300 hover:text-white mt-1 underline">Modifier</button>
                 </div>
                 
                 {selectedDate && (
                     <div className="mb-8">
                         <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Date</h3>
                         <div className="flex items-center gap-2">
                             <CalendarIcon size={16} className="text-blue-400"/>
                             <span className="font-semibold text-lg capitalize">{format(selectedDate, 'EEE d MMM', { locale: fr })}</span>
                         </div>
                     </div>
                 )}

                 {selectedSlot && (
                     <div>
                         <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Heure</h3>
                         <div className="flex items-center gap-2">
                             <Clock size={16} className="text-blue-400"/>
                             <span className="font-semibold text-lg">{format(new Date(selectedSlot.startTime), 'HH:mm')}</span>
                         </div>
                     </div>
                 )}
             </div>
             <div className="text-xs text-slate-500">
                 Code Over Booking System
             </div>
        </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        
        {/* Mobile Header for context */}
        <div className="md:hidden mb-4 flex justify-between items-center bg-gray-50 p-3 rounded-lg">
             <div className="text-sm font-medium">{selectedService?.name}</div>
             <button onClick={() => setStep('service')} className="text-xs text-blue-600 font-semibold">Modifier</button>
        </div>

        {!selectedSlot ? (
           <>
            {/* Calendar Header */}
            <div className="flex item-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="mb-6">
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map(d => (
                  <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {daysInMonth.map((day, i) => {
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isPast = isBefore(day, new Date()) && !isToday(day);
                  
                  return (
                    <button
                      key={i}
                      disabled={!isCurrentMonth || isPast}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square rounded-lg flex items-center justify-center text-sm relative transition-all
                        ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700 hover:bg-blue-50'}
                        ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md transform scale-105' : ''}
                        ${isToday(day) && !isSelected ? 'border border-blue-600 font-bold text-blue-600' : ''}
                        ${isPast ? 'opacity-30 cursor-not-allowed' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots Selection */}
            {selectedDate && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock size={16} /> Créneaux disponibles pour le {format(selectedDate, 'd MMMM', { locale: fr })}
                </h3>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-blue-600" />
                  </div>
                ) : slots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map((slot, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedSlot(slot)}
                            className="py-2 px-3 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-sm font-medium shadow-sm"
                        >
                            {format(new Date(slot.startTime), 'HH:mm')}
                        </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        Aucun créneau disponible ce jour.
                    </div>
                )}
              </div>
            )}
           </>
        ) : (
            // Booking Form
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col h-full"
            >
                <div>
                   <button 
                        onClick={() => setSelectedSlot(null)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
                    >
                        <ChevronLeft size={16} /> Retour aux créneaux
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Vos informations</h2>
                </div>

                <form onSubmit={handleBooking} className="space-y-4 flex-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="john@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input
                            required
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="06 12 34 56 78"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-24 resize-none"
                            placeholder="Précisions..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={bookingStatus === 'loading'}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg mt-auto"
                    >
                        {bookingStatus === 'loading' ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin" size={20} />
                                Confirmation...
                            </div>
                        ) : 'Confirmer le rendez-vous'}
                    </button>
                </form>
            </motion.div>
        )}
      </div>

    </div>
  );
}
