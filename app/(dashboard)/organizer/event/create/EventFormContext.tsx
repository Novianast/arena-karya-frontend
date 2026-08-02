"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface EventFormData {
  title: string;
  description: string;
  posterFile: File | null;
  guidebookFile: File | null;
  startDate: string;
  endDate: string;
  locationType: string;
  locationDetail: string;
  isMultiCompetition: boolean;
  package_payment_id: number | null;
  package_id: number | null;
  packageName: string;
}

const defaultData: EventFormData = {
  title: "",
  description: "",
  posterFile: null,
  guidebookFile: null,
  startDate: "",
  endDate: "",
  locationType: "Online",
  locationDetail: "",
  isMultiCompetition: false,
  package_payment_id: null,
  package_id: null,
  packageName: "",
};

// Buat Context
const EventFormContext = createContext<{
  formData: EventFormData;
  setFormData: (data: Partial<EventFormData>) => void;
  resetForm: () => void;
} | null>(null);

// Buat Provider untuk membungkus halaman detail dan preview
export function EventFormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormDataState] = useState<EventFormData>(defaultData);

  const setFormData = (newData: Partial<EventFormData>) => {
    setFormDataState((prev) => ({ ...prev, ...newData }));
  };

  const resetForm = () => setFormDataState(defaultData);

  return (
    <EventFormContext.Provider value={{ formData, setFormData, resetForm }}>
      {children}
    </EventFormContext.Provider>
  );
}

export function useEventForm() {
  const context = useContext(EventFormContext);
  if (!context) throw new Error("useEventForm harus digunakan di dalam EventFormProvider");
  return context;
}