'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface BookingDetail {
  id: string;
  bookingReference: string;
  status: string;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  depositAmount: number;
  depositPaid: boolean;
  stripePaymentId?: string;
  stripeIntentId?: string;
  paymentDate?: string;
  specialRequests?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    marketingConsent: boolean;
  };
  table: {
    id: string;
    tableNumber: number;
    floor: string;
    capacityMin: number;
    capacityMax: number;
    description: string;
    features: string[];
    isVip: boolean;
  };
  drinkPackage?: {
    id: string;
    name: string;
    price: number;
    description: string;
  };
  spirits?: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    quantity: number;
    price: number;
  }>;
  champagnes?: Array<{
    id: string;
    name: string;
    brand: string;
    quantity: number;
    price: number;
  }>;
}

interface Table {
  id: string;
  tableNumber: number;
  floor: string;
  capacityMin: number;
  capacityMax: number;
  description: string;
  features: string[];
  isVip: boolean;
}

interface AvailabilityCheck {
  available: boolean;
  capacityValid: boolean;
  tableAvailable: boolean;
  message: string;
  alternativeTables?: Table[];
  conflicts?: Array<{
    bookingReference: string;
    customerName: string;
    partySize: number;
  }>;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [bookingEditMode, setBookingEditMode] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityCheck | null>(null);
  const [showModificationModal, setShowModificationModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Edit form states
  const [editForm, setEditForm] = useState({
    bookingDate: '',
    bookingTime: '',
    partySize: 2,
    tableId: '',
    modificationReason: '',
    sendEmail: true
  });

  // Original values for comparison
  const [originalForm, setOriginalForm] = useState({
    bookingDate: '',
    bookingTime: '',
    partySize: 2,
    tableId: ''
  });

  // Time slots for booking
  const timeSlots = [
    '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
    '12:00 AM', '12:30 AM', '1:00 AM', '1:30 AM',
    '2:00 AM', '2:30 AM', '3:00 AM'
  ];

  useEffect(() => {
    if (params?.id) {
      fetchBookingDetail(params.id as string);
      fetchTables();
    }
  }, [params?.id]);

  const fetchBookingDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${id}`);
      if (!response.ok) throw new Error('Failed to fetch booking');
      const data = await response.json();
      setBooking(data);
      setInternalNotes(data.internalNotes || '');
      
      // Set initial edit form values
      const initialValues = {
        bookingDate: new Date(data.bookingDate).toISOString().split('T')[0],
        bookingTime: data.bookingTime,
        partySize: data.partySize,
        tableId: data.table.id
      };
      setEditForm({
        ...initialValues,
        modificationReason: '',
        sendEmail: true
      });
      setOriginalForm(initialValues);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables');
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const checkAvailability = async () => {
    if (!booking) return;
    
    setCheckingAvailability(true);
    setAvailabilityStatus(null);
    
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editForm.bookingDate,
          time: editForm.bookingTime,
          tableId: editForm.tableId,
          partySize: editForm.partySize
        })
      });

      const data = await response.json();
      setAvailabilityStatus(data);
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const hasChanges = () => {
    return editForm.bookingDate !== originalForm.bookingDate ||
           editForm.bookingTime !== originalForm.bookingTime ||
           editForm.partySize !== originalForm.partySize ||
           editForm.tableId !== originalForm.tableId;
  };

  const getChangesSummary = () => {
    const changes = [];
    if (editForm.bookingDate !== originalForm.bookingDate) {
      changes.push(`Date: ${new Date(originalForm.bookingDate).toLocaleDateString()} → ${new Date(editForm.bookingDate).toLocaleDateString()}`);
    }
    if (editForm.bookingTime !== originalForm.bookingTime) {
      changes.push(`Time: ${originalForm.bookingTime} → ${editForm.bookingTime}`);
    }
    if (editForm.partySize !== originalForm.partySize) {
      changes.push(`Party Size: ${originalForm.partySize} → ${editForm.partySize} guests`);
    }
    if (editForm.tableId !== originalForm.tableId) {
      const oldTable = tables.find(t => t.id === originalForm.tableId);
      const newTable = tables.find(t => t.id === editForm.tableId);
      changes.push(`Table: ${oldTable?.tableNumber} → ${newTable?.tableNumber}`);
    }
    return changes;
  };

  const handleSaveChanges = async () => {
    if (!booking || !hasChanges()) return;

    // Check availability first
    if (!availabilityStatus?.available) {
      await checkAvailability();
      if (!availabilityStatus?.available) {
        alert('Cannot save changes: The selected table is not available for the specified date and time.');
        return;
      }
    }

    setShowModificationModal(true);
  };

  const confirmSaveChanges = async () => {
    if (!booking) return;

    try {
      const updateData: any = {};
      
      if (editForm.bookingDate !== originalForm.bookingDate) {
        updateData.bookingDate = editForm.bookingDate;
      }
      if (editForm.bookingTime !== originalForm.bookingTime) {
        updateData.bookingTime = editForm.bookingTime;
      }
      if (editForm.partySize !== originalForm.partySize) {
        updateData.partySize = editForm.partySize;
      }
      if (editForm.tableId !== originalForm.tableId) {
        updateData.tableId = editForm.tableId;
      }
      
      updateData.modificationReason = editForm.modificationReason;
      updateData.sendEmail = editForm.sendEmail;

      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setShowModificationModal(false);
        setBookingEditMode(false);
        fetchBookingDetail(booking.id);
        
        if (editForm.sendEmail) {
          setSendingEmail(true);
          // Email is sent asynchronously by the API
          setTimeout(() => setSendingEmail(false), 2000);
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return;
    
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchBookingDetail(booking.id);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleNotesUpdate = async () => {
    if (!booking) return;
    
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes })
      });

      if (response.ok) {
        setEditMode(false);
        fetchBookingDetail(booking.id);
      }
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const handleRefund = async () => {
    if (!booking || !confirm('Are you sure you want to refund the deposit?')) return;
    
    alert('Refund functionality to be implemented with Stripe integration');
  };

  const handleResendEmail = async () => {
    if (!booking) return;
    
    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/resend-email`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Confirmation email has been resent');
      } else {
        alert('Failed to resend email');
      }
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Error resending email');
    }
  };

  const cancelEditMode = () => {
    setBookingEditMode(false);
    setEditForm({
      ...originalForm,
      modificationReason: '',
      sendEmail: true
    });
    setAvailabilityStatus(null);
  };

  // Calculate max date (31 days from today)
  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 31);
    return date.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading booking details...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Booking not found</p>
        <Link href="/admin/dashboard/bookings" className="text-indigo-600 hover:text-indigo-900 mt-4 inline-block">
          Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Booking {booking.bookingReference}
          </h1>
          <p className="text-gray-600 mt-1">
            Created {new Date(booking.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-3">
          {!bookingEditMode && (
            <button
              onClick={() => setBookingEditMode(true)}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
            >
              Edit Booking
            </button>
          )}
          <Link
            href="/admin/dashboard/bookings"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Back to Bookings
          </Link>
        </div>
      </div>

      {/* Email Sending Notification */}
      {sendingEmail && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700">Sending modification email to customer...</p>
        </div>
      )}

      {/* Status and Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Status
            </label>
            <select
              value={booking.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={bookingEditMode}
              className={`text-sm font-semibold rounded-full px-4 py-2 ${
                booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleResendEmail}
              disabled={bookingEditMode}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:opacity-50"
            >
              Resend Email
            </button>
            {booking.depositPaid && booking.status !== 'CANCELLED' && (
              <button
                onClick={handleRefund}
                disabled={bookingEditMode}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition disabled:opacity-50"
              >
                Refund Deposit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Booking Information</h2>
            {bookingEditMode && (
              <div className="flex space-x-2">
                <button
                  onClick={checkAvailability}
                  disabled={checkingAvailability}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition"
                >
                  {checkingAvailability ? 'Checking...' : 'Check Availability'}
                </button>
              </div>
            )}
          </div>
          <div className="p-6 space-y-4">
            {bookingEditMode ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={editForm.bookingDate}
                      onChange={(e) => {
                        setEditForm({ ...editForm, bookingDate: e.target.value });
                        setAvailabilityStatus(null);
                      }}
                      min={getMinDate()}
                      max={getMaxDate()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Time</label>
                    <select
                      value={editForm.bookingTime}
                      onChange={(e) => {
                        setEditForm({ ...editForm, bookingTime: e.target.value });
                        setAvailabilityStatus(null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
                    >
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Party Size</label>
                    <input
                      type="number"
                      value={editForm.partySize}
                      onChange={(e) => {
                        setEditForm({ ...editForm, partySize: parseInt(e.target.value) });
                        setAvailabilityStatus(null);
                      }}
                      min="2"
                      max="12"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Table</label>
                    <select
                      value={editForm.tableId}
                      onChange={(e) => {
                        setEditForm({ ...editForm, tableId: e.target.value });
                        setAvailabilityStatus(null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
                    >
                      {tables.map(table => (
                        <option key={table.id} value={table.id}>
                          Table {table.tableNumber} - {table.floor} ({table.capacityMin}-{table.capacityMax} guests)
                          {table.isVip && ' - VIP'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Availability Status */}
                {availabilityStatus && (
                  <div className={`p-4 rounded-md ${
                    availabilityStatus.available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`font-semibold ${
                      availabilityStatus.available ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {availabilityStatus.message}
                    </p>
                    
                    {availabilityStatus.conflicts && availabilityStatus.conflicts.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-red-700">Conflicts with:</p>
                        <ul className="text-sm text-red-600 mt-1">
                          {availabilityStatus.conflicts.map((conflict, idx) => (
                            <li key={idx}>
                              • {conflict.bookingReference} - {conflict.customerName} ({conflict.partySize} guests)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {availabilityStatus.alternativeTables && availabilityStatus.alternativeTables.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-700">Alternative tables available:</p>
                        <div className="mt-1 space-y-1">
                          {availabilityStatus.alternativeTables.slice(0, 3).map(table => (
                            <button
                              key={table.id}
                              onClick={() => {
                                setEditForm({ ...editForm, tableId: table.id });
                                setAvailabilityStatus(null);
                              }}
                              className="block text-sm text-blue-600 hover:text-blue-800"
                            >
                              → Table {table.tableNumber} - {table.floor} ({table.capacityMin}-{table.capacityMax} guests)
                              {table.isVip && ' - VIP'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={handleSaveChanges}
                    disabled={!hasChanges() || (availabilityStatus && !availabilityStatus.available)}
                    className="px-4 py-2 bg-prohibition-gold text-prohibition-dark rounded-md hover:bg-prohibition-gold/90 transition disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEditMode}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">
                    {new Date(booking.bookingDate).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">{booking.bookingTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Party Size</p>
                  <p className="font-medium">{booking.partySize} guests</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Table</p>
                  <p className="font-medium">
                    Table {booking.table.tableNumber} - {booking.table.floor}
                    {booking.table.isVip && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">VIP</span>
                    )}
                  </p>
                </div>
              </div>
            )}
            
            {!bookingEditMode && booking.table.features.length > 0 && (
              <div>
                <p className="text-sm text-gray-600">Table Features</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {booking.table.features.map((feature, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {booking.specialRequests && (
              <div>
                <p className="text-sm text-gray-600">Special Requests</p>
                <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{booking.specialRequests}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Customer Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">
                  {booking.customer.firstName} {booking.customer.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{booking.customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{booking.customer.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Marketing Consent</p>
                <p className="font-medium">
                  {booking.customer.marketingConsent ? (
                    <span className="text-green-600">✓ Yes</span>
                  ) : (
                    <span className="text-gray-400">✗ No</span>
                  )}
                </p>
              </div>
            </div>
            <Link
              href={`/admin/dashboard/customers?search=${booking.customer.email}`}
              className="inline-block text-indigo-600 hover:text-indigo-900 text-sm"
            >
              View Customer History →
            </Link>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Payment Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Deposit Amount</p>
                <p className="font-medium">£{booking.depositAmount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className="font-medium">
                  {booking.depositPaid ? (
                    <span className="text-green-600">✓ Paid</span>
                  ) : (
                    <span className="text-red-600">✗ Unpaid</span>
                  )}
                </p>
              </div>
              {booking.paymentDate && (
                <div>
                  <p className="text-sm text-gray-600">Payment Date</p>
                  <p className="font-medium">
                    {new Date(booking.paymentDate).toLocaleString()}
                  </p>
                </div>
              )}
              {booking.stripePaymentId && (
                <div>
                  <p className="text-sm text-gray-600">Stripe Payment ID</p>
                  <p className="font-medium text-xs break-all">{booking.stripePaymentId}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drinks Selection */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Drinks Selection</h2>
          </div>
          <div className="p-6 space-y-4">
            {booking.drinkPackage ? (
              <div>
                <p className="text-sm text-gray-600">Package</p>
                <p className="font-medium">{booking.drinkPackage.name}</p>
                <p className="text-sm text-gray-500">£{booking.drinkPackage.price}</p>
                <p className="text-sm mt-2">{booking.drinkPackage.description}</p>
              </div>
            ) : (
              <div>
                {booking.spirits && booking.spirits.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Spirits</p>
                    <ul className="space-y-1">
                      {booking.spirits.map((spirit) => (
                        <li key={spirit.id} className="text-sm">
                          {spirit.quantity}x {spirit.brand} {spirit.name} - £{spirit.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {booking.champagnes && booking.champagnes.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Champagnes</p>
                    <ul className="space-y-1">
                      {booking.champagnes.map((champagne) => (
                        <li key={champagne.id} className="text-sm">
                          {champagne.quantity}x {champagne.brand} {champagne.name} - £{champagne.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(!booking.spirits || booking.spirits.length === 0) && 
                 (!booking.champagnes || booking.champagnes.length === 0) && (
                  <p className="text-sm text-gray-500">No drinks selected</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Internal Notes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Internal Notes</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            disabled={bookingEditMode}
            className="text-sm text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
          >
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>
        <div className="p-6">
          {editMode ? (
            <div className="space-y-4">
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
                placeholder="Add internal notes (not visible to customer)..."
              />
              <button
                onClick={handleNotesUpdate}
                className="px-4 py-2 bg-prohibition-gold text-prohibition-dark rounded-md hover:bg-prohibition-gold/90 transition"
              >
                Save Notes
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {booking.internalNotes || 'No internal notes'}
            </p>
          )}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p>Created: {new Date(booking.createdAt).toLocaleString()}</p>
        <p>Last Updated: {new Date(booking.updatedAt).toLocaleString()}</p>
      </div>

      {/* Modification Confirmation Modal */}
      {showModificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Booking Changes</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">The following changes will be made:</p>
              <ul className="text-sm space-y-1">
                {getChangesSummary().map((change, idx) => (
                  <li key={idx} className="text-gray-700">• {change}</li>
                ))}
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for modification (optional)
              </label>
              <textarea
                value={editForm.modificationReason}
                onChange={(e) => setEditForm({ ...editForm, modificationReason: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-prohibition-gold focus:border-prohibition-gold"
                placeholder="e.g., Customer requested change, Table maintenance..."
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.sendEmail}
                  onChange={(e) => setEditForm({ ...editForm, sendEmail: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Send modification email to customer</span>
              </label>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={confirmSaveChanges}
                className="flex-1 px-4 py-2 bg-prohibition-gold text-prohibition-dark rounded-md hover:bg-prohibition-gold/90 transition"
              >
                Confirm Changes
              </button>
              <button
                onClick={() => setShowModificationModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}