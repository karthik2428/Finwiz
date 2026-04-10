import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";

export default function DateInput({ label, value, onChange }) {

    const [open, setOpen] = useState(false);
    const [month, setMonth] = useState(value ? new Date(value) : new Date());

    const ref = useRef();

    /* close when clicking outside */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (date) => {
        if (!date) return;

        onChange({
            target: {
                value: format(date, "yyyy-MM-dd")
            }
        });

        setOpen(false);
    };

    /* Year range */
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let y = currentYear - 20; y <= currentYear + 50; y++) {
        years.push(y);
    }

    return (
        <div className="w-full relative" ref={ref}>

            {/* LABEL */}
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {label}
                </label>
            )}

            {/* INPUT */}
            <div
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-4 py-2 border border-slate-300 rounded-xl bg-white shadow-sm cursor-pointer hover:border-primary-400 transition"
            >
                <span className="text-sm text-slate-700">
                    {value ? format(new Date(value), "PPP") : "Select date"}
                </span>

                <Calendar className="w-4 h-4 text-slate-400" />
            </div>

            {/* CALENDAR */}
            {open && (
                <div className="absolute z-[9999] mt-2 bg-white border rounded-xl shadow-xl p-4">

                    {/* YEAR SELECTOR */}
                    <div className="flex justify-between items-center mb-3">

                        <select
                            value={month.getFullYear()}
                            onChange={(e) =>
                                setMonth(
                                    new Date(Number(e.target.value), month.getMonth())
                                )
                            }
                            className="border rounded-md px-2 py-1 text-sm"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>

                    </div>

                    <DayPicker
                        mode="single"
                        month={month}
                        onMonthChange={setMonth}
                        selected={value ? new Date(value) : undefined}
                        onSelect={handleSelect}
                    />
                </div>
            )}
        </div>
    );
}