'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookingConfig } from '@/lib/booking-types';
import { Trash2, Plus, Save, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

function AdminInterface() {
    const searchParams = useSearchParams();
    const calendarId = searchParams.get('calendarId');
    const [config, setConfig] = useState<BookingConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!calendarId) return;
        
        // Fetch config
        fetch(`/api/booking/config?calendarId=${calendarId}`)
            .then(res => res.json())
            .then(data => {
                setConfig(data);
                setLoading(false);
            })
            .catch(() => {
                toast.error("Erreur lors du chargement de la configuration");
                setLoading(false);
            });
    }, [calendarId]);

    const handleServiceChange = (index: number, field: keyof any, value: any) => {
        if (!config) return;
        const newServices = [...config.services];
        // @ts-ignore
        newServices[index][field] = value;
        setConfig({ ...config, services: newServices });
    };

    const addService = () => {
        if (!config) return;
        const newService = {
            id: Date.now().toString(),
            name: 'Nouveau service',
            duration: 30,
            price: 0
        };
        setConfig({ ...config, services: [...config.services, newService] });
    };

    const removeService = (index: number) => {
        if (!config) return;
        const newServices = config.services.filter((_, i) => i !== index);
        setConfig({ ...config, services: newServices });
    };

    const handleWorkingHoursChange = (day: string, field: 'start' | 'end', value: string) => {
        if (!config) return;
        setConfig({
            ...config,
            workingHours: {
                ...config.workingHours,
                [day]: {
                    ...config.workingHours[day],
                    [field]: value
                }
            }
        });
    };

    const saveConfig = async () => {
        if (!calendarId || !config) return;
        setSaving(true);
        try {
            const res = await fetch('/api/booking/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calendarId, config })
            });
            
            if (res.ok) {
                toast.success("Configuration sauvegardée !");
            } else {
                throw new Error('Failed to save');
            }
        } catch (error: unknown) {
             console.error(error);
             toast.error("Erreur lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    if (!calendarId) {
        return <div className="p-8 text-center text-red-500">Paramètre calendarId manquant.</div>;
    }

    if (loading) {
        return <div className="p-8 text-center">Chargement...</div>;
    }

    if (!config) return null;

    const days = [
        { key: '1', label: 'Lundi' },
        { key: '2', label: 'Mardi' },
        { key: '3', label: 'Mercredi' },
        { key: '4', label: 'Jeudi' },
        { key: '5', label: 'Vendredi' },
        { key: '6', label: 'Samedi' },
        { key: '0', label: 'Dimanche' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <Toaster position="top-right" />
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Configuration Réservations</h1>
                    <button 
                        onClick={saveConfig}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={20} />
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                </div>

                {/* Services Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Clock className="text-blue-500" />
                            Services & Prestations
                        </h2>
                        <button 
                            onClick={addService}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Plus size={16} />
                            Ajouter un service
                        </button>
                    </div>

                    <div className="space-y-4">
                        {config.services.map((service, index) => (
                            <div key={service.id} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Nom du service</label>
                                    <input 
                                        type="text" 
                                        value={service.name}
                                        onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Durée (min)</label>
                                    <input 
                                        type="number" 
                                        value={service.duration}
                                        onChange={(e) => handleServiceChange(index, 'duration', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Prix (€)</label>
                                    <input 
                                        type="number" 
                                        value={service.price}
                                        onChange={(e) => handleServiceChange(index, 'price', parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={() => removeService(index)}
                                    className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Working Hours Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Clock className="text-green-500" />
                        Horaires d&apos;ouverture
                    </h2>
                    
                    <div className="grid gap-4">
                        {days.map(day => (
                            <div key={day.key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-b last:border-0 border-gray-50">
                                <span className="font-medium text-gray-700 w-32">{day.label}</span>
                                <div className="flex gap-4 items-center">
                                    <input 
                                        type="time" 
                                        value={config?.workingHours[day.key]?.start || ''}
                                        onChange={(e) => handleWorkingHoursChange(day.key, 'start', e.target.value)}
                                        className="px-3 py-1 border rounded-md"
                                    />
                                    <span className="text-gray-400">à</span>
                                    <input 
                                        type="time" 
                                        value={config?.workingHours[day.key]?.end || ''}
                                        onChange={(e) => handleWorkingHoursChange(day.key, 'end', e.target.value)}
                                        className="px-3 py-1 border rounded-md"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
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
