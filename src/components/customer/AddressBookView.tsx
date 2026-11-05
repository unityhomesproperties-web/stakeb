import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  BookUser,
  Plus,
  Search,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Send,
  Star,
  CheckCircle2,
  X,
} from 'lucide-react';
import { AddressBookEntry } from '../../types';

interface AddressBookViewProps {
  onSelectAddressForBooking?: (address: AddressBookEntry) => void;
}

export const AddressBookView: React.FC<AddressBookViewProps> = ({ onSelectAddressForBooking }) => {
  const { addressBook, addAddressBookEntry, deleteAddressBookEntry, currentCustomer, setActiveCustomerTab } = useDemo();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('United Kingdom');
  const [destinationCity, setDestinationCity] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const customerAddresses = addressBook.filter((a) => a.customerId === currentCustomer.id || currentCustomer.customerType === 'business');

  const filteredAddresses = customerAddresses.filter(
    (a) =>
      a.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.destinationCountry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.destinationCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientAddress.trim() || !destinationCity.trim()) {
      return;
    }

    addAddressBookEntry({
      customerId: currentCustomer.id,
      label: label.trim() || `${destinationCity} Contact`,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      recipientEmail: recipientEmail.trim(),
      destinationCountry,
      destinationCity: destinationCity.trim(),
      recipientAddress: recipientAddress.trim(),
      isDefault,
    });

    setSuccessMessage(`Saved "${recipientName}" to your international address book.`);
    setTimeout(() => setSuccessMessage(null), 3500);

    // Reset
    setLabel('');
    setRecipientName('');
    setRecipientPhone('');
    setRecipientEmail('');
    setDestinationCity('');
    setRecipientAddress('');
    setIsDefault(false);
    setShowAddModal(false);
  };

  const handleShipTo = (entry: AddressBookEntry) => {
    if (onSelectAddressForBooking) {
      onSelectAddressForBooking(entry);
    } else {
      setActiveCustomerTab('book');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCEFF3]">
        <div>
          <div className="flex items-center gap-2">
            <BookUser className="w-5 h-5 text-[#00B4D8]" />
            <h2 className="text-base font-serif-display font-bold text-[#354B55]">
              Saved Address Book
            </h2>
          </div>
          <p className="text-xs text-[#6A808C] mt-0.5">
            Store repeat international recipients to speed up checkout and avoid retyping addresses.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#00B4D8] text-white text-xs font-bold rounded-xl hover:bg-[#009BB8] transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Recipient</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-[#CAF0F8]/50 border border-[#90E0EF] text-[#008EA8] text-xs p-3 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00B4D8]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#6A808C] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by recipient name, city, country, or label..."
          className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl text-[#354B55] placeholder:text-[#6A808C]/60 focus:outline-none focus:border-[#00B4D8]"
        />
      </div>

      {/* Address Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAddresses.map((entry) => (
          <div
            key={entry.id}
            className="border border-[#DCEFF3] rounded-2xl p-4 bg-[#F5FBFD]/60 hover:border-[#00B4D8] transition-colors space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#008EA8] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                  {entry.label}
                </span>
                {entry.isDefault && (
                  <span className="text-[10px] font-semibold text-[#354B55] flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>Default</span>
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#354B55]">{entry.recipientName}</h3>
                <div className="flex items-start gap-1.5 text-xs text-[#6A808C] mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#00B4D8] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {entry.recipientAddress}, {entry.destinationCity}, {entry.destinationCountry}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#DCEFF3] text-[11px] text-[#6A808C] space-y-1">
                {entry.recipientPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[#6A808C]" />
                    <span>{entry.recipientPhone}</span>
                  </div>
                )}
                {entry.recipientEmail && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-[#6A808C]" />
                    <span>{entry.recipientEmail}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#DCEFF3] flex items-center justify-between">
              <button
                type="button"
                onClick={() => deleteAddressBookEntry(entry.id)}
                className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={() => handleShipTo(entry)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#00B4D8] hover:bg-[#009BB8] rounded-xl flex items-center gap-1 shadow-sm"
              >
                <Send className="w-3 h-3" />
                <span>Ship to This Address</span>
              </button>
            </div>
          </div>
        ))}

        {filteredAddresses.length === 0 && (
          <div className="col-span-full text-center py-12 text-xs text-[#6A808C] space-y-2">
            <BookUser className="w-8 h-8 text-[#DCEFF3] mx-auto" />
            <p>No saved addresses match your search criteria.</p>
          </div>
        )}
      </div>

      {/* Modal: Add New Recipient */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-[#DCEFF3] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
              <h3 className="text-sm font-bold text-[#354B55]">Add New Recipient to Address Book</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-md text-[#6A808C] hover:text-[#354B55]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#354B55] mb-1">Address Label (Tag)</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. London Boutique, Houston Sister, Toronto Warehouse"
                  className="w-full px-3.5 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#354B55] mb-1">Recipient Legal Full Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Harrods Luxury Consignments / Dr. Dayo Adeleke"
                  className="w-full px-3.5 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#354B55] mb-1">Phone Number (with country code)</label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+44 20 7730 1234"
                    className="w-full px-3.5 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#354B55] mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="intake@recipient.com"
                    className="w-full px-3.5 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#354B55] mb-1">Destination Country</label>
                  <select
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                  >
                    <option value="United Kingdom">United Kingdom (UK)</option>
                    <option value="United States">United States (USA)</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany (EU)</option>
                    <option value="United Arab Emirates">United Arab Emirates (Dubai)</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Ghana">Ghana</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#354B55] mb-1">Destination City</label>
                  <input
                    type="text"
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    placeholder="e.g. London, Houston, Toronto"
                    className="w-full px-3.5 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#354B55] mb-1">Full Physical Street Address &amp; Postcode</label>
                <textarea
                  rows={3}
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Street name, building number, suite/apartment, postcode / ZIP"
                  className="w-full px-3.5 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl text-[#354B55] focus:outline-none focus:border-[#00B4D8]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="default-chk"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-[#00B4D8] focus:ring-[#00B4D8] border-[#DCEFF3]"
                />
                <label htmlFor="default-chk" className="text-xs text-[#354B55] cursor-pointer">
                  Set as default shipping destination
                </label>
              </div>

              <div className="pt-3 border-t border-[#DCEFF3] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#DCEFF3] rounded-xl text-[#6A808C] hover:bg-[#F5FBFD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00B4D8] text-white rounded-xl font-bold hover:bg-[#009BB8] shadow-sm"
                >
                  Save to Address Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
