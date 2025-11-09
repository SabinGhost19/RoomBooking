import { useEffect, useState } from 'react';
import { bookingAPI, BookingWithDetails } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Calendar, Clock, Users, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function PendingBookingsManager() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingAPI.getPendingBookings({ skip: 0, limit: 100 });
      setBookings(data);
    } catch (error: any) {
      console.error('Error fetching pending bookings:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Detail array:', JSON.stringify(error.response?.data?.detail, null, 2));
      
      const detail = error.response?.data?.detail;
      let message = 'Failed to fetch pending bookings';
      
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        // Validation errors array
        message = detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
      } else if (detail && typeof detail === 'object') {
        message = JSON.stringify(detail);
      }
      
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const handleApprove = async (bookingId: number) => {
    try {
      setProcessingId(bookingId);
      await bookingAPI.approveBooking(bookingId);
      
      toast({
        title: 'Booking Approved',
        description: 'The booking has been successfully approved.',
      });
      
      // Remove from list or refresh
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (error: any) {
      console.error('Error approving booking:', error);
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 'Failed to approve booking';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedBookingId) return;

    try {
      setProcessingId(selectedBookingId);
      await bookingAPI.rejectBooking(selectedBookingId, rejectionReason || undefined);
      
      toast({
        title: 'Booking Rejected',
        description: 'The booking has been rejected.',
      });
      
      // Remove from list
      setBookings(prev => prev.filter(b => b.id !== selectedBookingId));
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedBookingId(null);
    } catch (error: any) {
      console.error('Error rejecting booking:', error);
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 'Failed to reject booking';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setRejectDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    // timeString format: "HH:MM:SS"
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Pending Bookings</CardTitle>
          <CardDescription className="text-slate-400">
            No pending bookings to review
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[200px]">
          <p className="text-slate-400 text-center">
            All bookings have been reviewed! 🎉
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Pending Bookings</CardTitle>
          <CardDescription className="text-slate-400">
            Review and approve meeting room booking requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="bg-slate-700 border-slate-600">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Booking Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-400" />
                      <span className="font-semibold text-white">{booking.room_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(booking.booking_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Users className="h-4 w-4" />
                      <span>Organizer: {booking.organizer_name}</span>
                    </div>
                    
                    {booking.participant_ids && booking.participant_ids.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Users className="h-4 w-4" />
                        <span>{booking.participant_ids.length} participant(s)</span>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                        Pending Approval
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col justify-center gap-2 md:items-end">
                    <Button
                      onClick={() => handleApprove(booking.id)}
                      disabled={processingId === booking.id}
                      className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
                    >
                      {processingId === booking.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    
                    <Button
                      onClick={() => openRejectDialog(booking.id)}
                      disabled={processingId === booking.id}
                      variant="destructive"
                      className="w-full md:w-auto"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Booking</DialogTitle>
            <DialogDescription className="text-slate-400">
              Provide a reason for rejecting this booking request (optional).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-white">Rejection Reason</Label>
            <Textarea
              id="reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Room needed for another meeting, insufficient capacity, etc."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-slate-400">
              {rejectionReason.length}/500 characters
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason('');
                setSelectedBookingId(null);
              }}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={processingId === selectedBookingId}
              variant="destructive"
            >
              {processingId === selectedBookingId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
