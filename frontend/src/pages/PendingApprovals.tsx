import { PendingBookingsManager } from '@/components/PendingBookingsManager';

export function PendingApprovals() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Booking Approvals
            </h1>
            <p className="text-slate-300">
              Review and manage pending meeting room booking requests
            </p>
          </div>
          
          <PendingBookingsManager />
        </div>
      </main>
    </div>
  );
}
