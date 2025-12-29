'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookingConfig, DEFAULT_CONFIG } from '@/lib/booking';
import { Trash2, Plus, Save, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

function AdminContent() {
  const searchParams = useSearchParams();
  const calendarId = searchParams.get('calendarId');
  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!calendarId) return;

    fetch(`/api/booking/config?calendarId=${calendarId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          toast.error(data.error);
        } else {
          setConfig(data);
        }
        setLoading(false);
      })
      .catch(err => {
        toast.error('Erreur chargement config');
        setLoading(false);
      });
  }, [calendarId]);

  const handleSave = async () => {
    if (!calendarId || !config) return;
    setSaving(true);

    try {
      const res = await fetch('/api/booking/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId,
          services: config.services,
          workingHours: config.workingHours
        })
      });

      if (res.ok) {
        toast.success('Configuration sauvegardée !');
      } else {
        throw new Error('Erreur sauvegarde');
      }
    } catch (err) {
      toast.error('Erreur impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    if (!config) return;
    const newId = Math.random().toString(36).substr(2, 9);
    setConfig({
      ...config,
      services: [...config.services, { id: newId, name: 'Nouveau service', duration: 30, price: 0 }]
    });
  };

  const updateService = (id: string, field: string, value: any) => {
    if (!config) return;
    const updatedServices = config.services.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    );
    setConfig({ ...config, services: updatedServices });
  };

  const removeService = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      services: config.services.filter(s => s.id !== id)
    });
  };

  const updateWorkingHours = (day: string, type: 'start' | 'end', value: string) => {
    if (!config) return;
    setConfig({
      ...config,
      workingHours: {
        ...config.workingHours,
        [day]: { ...config.workingHours[day], [type]: value }
      }
    });
  };

  if (!calendarId) return <div className="p-8 text-center text-red-500">❌ calendarId manquant dans l'URL</div>;
  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;
  if (!config) return <div className="p-8 text-center text-red-500">Erreur de chargement</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster />
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuration Réservations</h1>
            <p className="text-gray-500 text-sm mt-1">{calendarId}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Save size={18} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>

        {/* Services Section */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
              Services & Prestations
            </h2>
            <button
              onClick={addService}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <Plus size={16} /> Ajouter un service
            </button>
          </div>

          <div className="space-y-3">
            {config.services.map((service) => (
              <div key={service.id} className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg border border-gray-100 group hover:border-indigo-100 transition-colors">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Nom</label>
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => updateService(service.id, 'name', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Durée (min)</label>
                  <input
                    type="number"
                    value={service.duration}
                    onChange={(e) => updateService(service.id, 'duration', parseInt(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Prix (€)</label>
                  <input
                    type="number"
                    value={service.price}
                    onChange={(e) => updateService(service.id, 'price', parseFloat(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <button
                  onClick={() => removeService(service.id)}
                  className="mt-5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Working Hours Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">2</span>
            Horaires d'ouverture
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['1', '2', '3', '4', '5', '6', '7'].map((dayKey) => {
              const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
              const dayName = dayNames[parseInt(dayKey) - 1];
              const hours = config.workingHours[dayKey];
              const isOpen = !!hours;

              return (
                <div key={dayKey} className={`p-4 rounded-lg border ${isOpen ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-75'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                       {dayName}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isOpen}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfig({
                              ...config,
                              workingHours: { ...config.workingHours, [dayKey]: { start: '09:00', end: '17:00' } }
                            });
                          } else {
                            const newHours = { ...config.workingHours };
                            delete newHours[dayKey];
                            setConfig({ ...config, workingHours: newHours });
                          }
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                  
                  {isOpen && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={14} className="text-gray-400" />
                      <input
                        type="time"
                        value={hours.start}
                        onChange={(e) => updateWorkingHours(dayKey, 'start', e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-500"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="time"
                        value={hours.end}
                        onChange={(e) => updateWorkingHours(dayKey, 'end', e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                  {!isOpen && <span className="text-xs text-gray-400 italic pl-1">Fermé</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <AdminContent />
    </Suspense>
  );
}
