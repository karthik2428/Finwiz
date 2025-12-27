import { Info } from 'lucide-react';
import { useState } from 'react';

const explanations = {
    "Financial Efficiency": "A score (0-100) combining your savings rate (how much you keep) and expense management. A score > 70 is excellent health.",
    "Forecast Accuracy": "We compare our past prediction with your actual savings. 'Beating Forecast' means you saved more than we predicted!",
    "WMA": "Weighted Moving Average gives more importance to your recent habits. If you've started saving more recently, WMA will notice it faster than a standard average.",
    "Optimistic Scenario": "What if you improve your savings by 10% next month? This shows your potential upside.",
    "Pessimistic Scenario": "What if unexpected expenses occur? This shows a conservative estimate to help you plan for a rainy day.",
    "Inflation Adjusted": "Money loses value over time due to inflation (approx 6%/yr). This number shows what your future savings can actually buy in today's prices.",
    "CAGR": "Compound Annual Growth Rate. It represents the smooth annual growth rate of an investment over time.",
    "Avg Monthly Savings": "Your standard 'cash flow' - (Total Income - Total Expenses) averaged over time. Negative means you are spending more than you earn.",
    "Volatility": "How much the fund's returns fluctuate. Lower is more stable; higher is riskier but can offer better returns."
};

/**
 * Renders a small Info icon that shows a tooltip on hover/click.
 * Usage: <MathExplainer term="Financial Efficiency" />
 */
export default function MathExplainer({ term, customText, position = 'top' }) {
    const text = customText || explanations[term] || "No explanation available.";
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-flex items-center ml-1 group">
            <Info
                className="w-4 h-4 text-slate-400 hover:text-indigo-500 cursor-help transition-colors"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onClick={() => setIsVisible(!isVisible)}
            />

            {isVisible && (
                <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-[9999] pointer-events-none`}>
                    <div className="font-semibold mb-1 text-indigo-300">{term}</div>
                    <div className="leading-relaxed opacity-90">{text}</div>
                    <div className={`absolute w-2 h-2 bg-slate-800 rotate-45 left-1/2 -translate-x-1/2 ${position === 'top' ? '-bottom-1' : '-top-1'}`}></div>
                </div>
            )}
        </div>
    );
}
