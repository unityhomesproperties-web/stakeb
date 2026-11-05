import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  Layers,
  Plus,
  Trash2,
  Send,
  Scale,
  Package,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { ShipmentTemplate } from '../../types';
import { formatNaira } from '../../utils/shipping-calculator';

interface ShipmentTemplatesViewProps {
  onUseTemplate?: (tmpl: ShipmentTemplate) => void;
}

export const ShipmentTemplatesView: React.FC<ShipmentTemplatesViewProps> = ({ onUseTemplate }) => {
  const { shipmentTemplates, addShipmentTemplate, deleteShipmentTemplate, currentCustomer, setActiveCustomerTab } = useDemo();

  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'goods' | 'documents' | 'apparel'>('goods');
  const [description, setDescription] = useState('');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState<number>(3.0);
  const [lengthCm, setLengthCm] = useState<number>(35);
  const [widthCm, setWidthCm] = useState<number>(25);
  const [heightCm, setHeightCm] = useState<number>(15);
  const [declaredValueNgn, setDeclaredValueNgn] = useState<number>(120000);
  const [preferredTier, setPreferredTier] = useState<'standard' | 'priority'>('standard');

  const customerTemplates = shipmentTemplates.filter(
    (t) => t.customerId === currentCustomer.id || currentCustomer.customerType === 'business'
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    addShipmentTemplate({
      customerId: currentCustomer.id,
      name: name.trim(),
      category,
      description: description.trim(),
      estimatedWeightKg: Number(estimatedWeightKg) || 1.0,
      dimensions: {
        lengthCm: Number(lengthCm) || 30,
        widthCm: Number(widthCm) || 20,
        heightCm: Number(heightCm) || 10,
      },
      declaredValueNgn: Number(declaredValueNgn) || 50000,
      preferredTier,
    });

    setShowAddModal(false);
    setSuccessMessage(`Package template "${name}" saved.`);
    setTimeout(() => setSuccessMessage(null), 3500);

    // Reset
    setName('');
    setDescription('');
    setEstimatedWeightKg(3.0);
    setDeclaredValueNgn(120000);
  };

  const handleUseTemplate = (tmpl: ShipmentTemplate) => {
    if (onUseTemplate) {
      onUseTemplate(tmpl);
    } else {
      setActiveCustomerTab('book');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCEFF3]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00B4D8]" />
            <h2 className="text-base font-bold text-[#354B55]">
              Shipment Package Templates
            </h2>
          </div>
          <p className="text-xs text-[#6A808C] mt-0.5">
            Save standard carton sizes, weights, and product specifications for quick single-click re-booking.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#00B4D8] hover:bg-[#0096B4] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Package Template</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-[#CAF0F8] border border-[#90E0EF] text-[#008EA8] text-xs p-3 rounded-lg flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00B4D8]" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {customerTemplates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="border border-[#DCEFF3] rounded-xl p-4 bg-[#F5FBFD] hover:border-[#00B4D8] transition-colors space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#008EA8] bg-[#CAF0F8] px-2 py-0.5 rounded-full border border-[#90E0EF] uppercase">
                  {tmpl.category}
                </span>
                <span className="text-[10px] font-medium text-[#6A808C]">
                  {tmpl.preferredTier === 'priority' ? 'Priority Express' : 'Standard Air'}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#354B55]">{tmpl.name}</h3>
                <p className="text-[11px] text-[#6A808C] mt-1 leading-relaxed line-clamp-2">
                  {tmpl.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#DCEFF3] grid grid-cols-2 gap-2 text-[11px] text-[#6A808C]">
                <div>
                  <span className="block text-[10px] text-[#6A808C]">Scale Weight:</span>
                  <span className="font-semibold text-[#354B55] font-mono">{tmpl.estimatedWeightKg} kg</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#6A808C]">Dimensions:</span>
                  <span className="font-semibold text-[#354B55] font-mono">
                    {tmpl.dimensions.lengthCm}×{tmpl.dimensions.widthCm}×{tmpl.dimensions.heightCm} cm
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] text-[#6A808C]">Declared Customs Value:</span>
                  <span className="font-semibold text-[#008EA8] font-mono">
                    {formatNaira(tmpl.declaredValueNgn)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DCEFF3] flex items-center justify-between">
              <button
                type="button"
                onClick={() => deleteShipmentTemplate(tmpl.id)}
                className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={() => handleUseTemplate(tmpl)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#00B4D8] hover:bg-[#0096B4] rounded-md flex items-center gap-1 shadow-xs transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Ship With This</span>
              </button>
            </div>
          </div>
        ))}

        {customerTemplates.length === 0 && (
          <div className="col-span-full text-center py-12 text-xs text-[#6A808C] space-y-2">
            <Layers className="w-8 h-8 text-[#DCEFF3] mx-auto" />
            <p>No shipment templates created yet. Save standard packaging to speed up repeats.</p>
          </div>
        )}
      </div>

      {/* Modal: New Template */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-[#DCEFF3] shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCEFF3]">
              <h3 className="text-sm font-bold text-[#354B55]">Create New Package Template</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-md text-[#6A808C] hover:text-[#354B55]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#354B55] mb-1">Template Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard Agbada Set (3kg) or Legal Deeds Envelope"
                  className="w-full px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#354B55] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  >
                    <option value="goods">Manufactured Goods / Crafts</option>
                    <option value="apparel">Fashion &amp; Textiles</option>
                    <option value="documents">Official Documents</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#354B55] mb-1">Preferred Air Tier</label>
                  <select
                    value={preferredTier}
                    onChange={(e) => setPreferredTier(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  >
                    <option value="standard">Standard Air Courier (4–6 Days)</option>
                    <option value="priority">Priority Air Express (2–3 Days)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#354B55] mb-1">Package Contents Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 2 hand-dyed adire tunics and embroidered trousers"
                  className="w-full px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[#354B55] mb-1">
                  Estimated Weight (kg) <span className="text-[#00B4D8]">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g. 2.5"
                  value={estimatedWeightKg}
                  onChange={(e) => setEstimatedWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[#354B55] mb-1">
                  Carton Dimensions (Optional cm)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="L (cm)"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="W (cm)"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="H (cm)"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#354B55] mb-1">Declared Value (NGN)</label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  value={declaredValueNgn}
                  onChange={(e) => setDeclaredValueNgn(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg focus:outline-hidden focus:border-[#00B4D8]"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#DCEFF3] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#DCEFF3] rounded-lg text-[#6A808C] hover:bg-[#F5FBFD] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  Save Package Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
