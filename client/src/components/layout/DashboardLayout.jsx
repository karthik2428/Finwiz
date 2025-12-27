import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
