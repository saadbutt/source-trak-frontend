import {
  FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiClock, FiDroplet, FiGrid,
  FiLayers, FiPackage, FiPenTool, FiRefreshCw, FiRotateCcw, FiSettings,
  FiShoppingBag, FiSun, FiThermometer, FiTool, FiTriangle, FiTruck, FiXCircle,
} from 'react-icons/fi';

// Step-by-step entry flow, one config per supply-chain role.
//
// Field `key`s are the exact JSON keys the backend stores (POST /api/data keeps
// the whole payload as free-form JSON), so they must not be renamed. `lower`
// keeps the legacy behaviour of storing an option lower-cased.
//
// Field types: text | number | date | datetime | textarea | quantity |
// location | batch | tiles (single choice) | chips (single choice) |
// multichips (several choices, stored comma-separated).

const CERTIFICATION_OPTIONS = [
  'None', 'ISO 9001 (Quality)', 'ISO 14001 (Environmental)', 'ISO 22000 / HACCP (Food Safety)',
  'Organic', 'Fair Trade', 'FSC (Forestry)', 'CE Marking', 'Halal', 'Kosher',
];

export const QUANTITY_UNITS = ['kg', 'tonnes', 'lb', 'litres', 'units', 'boxes', 'pallets'];

export const STAGES = [
  { role: 'Farm/Producer', label: 'Origin' },
  { role: 'Processing/Packaging', label: 'Processing & packaging' },
  { role: 'Logistics & Cold Chain Monitoring', label: 'Logistics & transport' },
  { role: 'Distribution/Retail', label: 'Distribution & retail' },
];

const BATCH_FIELD = {
  key: 'batch_id',
  label: 'Batch ID',
  type: 'batch',
  required: true,
  placeholder: 'Paste the batch ID from the QR code or the previous stage',
  help: 'You can find it on the batch QR code or the batch page.',
};

export const ROLE_CONFIGS = {
  'Farm/Producer': {
    title: 'Record a new batch',
    entityLabel: 'Batch',
    successTitle: 'Batch recorded',
    icon: FiSun,
    idKey: 'farm_id',
    idLabel: 'Origin ID',
    createsBatch: true,
    defaults: { quantity_unit: 'kg' },
    previewTitle: (d) => d.product_type || 'New batch',
    steps: [
      {
        name: 'Product',
        question: 'What are you recording?',
        sub: 'Start with the product and how much of it is in this batch.',
        summary: (d) => [d.product_type, d.quantity && `${d.quantity} ${d.quantity_unit}`].filter(Boolean).join(' · '),
        fields: [
          { key: 'product_type', label: 'Product type', type: 'text', required: true, placeholder: 'e.g., coffee beans, cotton fabric, circuit boards', help: 'Use the name buyers will recognise.' },
          { key: 'quantity', label: 'Quantity', type: 'quantity', required: true, unitKey: 'quantity_unit', placeholder: 'e.g., 500', half: true },
          { key: 'harvest_date', label: 'Production date', type: 'date', required: true, help: 'The date this batch was made or harvested.', half: true },
        ],
      },
      {
        name: 'Origin & location',
        question: 'Where was this batch produced?',
        sub: 'Buyers see this location when they scan the batch QR code.',
        summary: (d) => d.farm_name || 'Location added',
        fields: [
          { key: 'farm_name', label: 'Producer / site name', type: 'text', placeholder: 'e.g., Green Valley Farm, Northside Plant, Acme Workshop' },
          { key: 'location_coordinates', label: 'Location', type: 'location', placeholder: 'Latitude, longitude', help: 'Leave blank to keep the location private.' },
        ],
      },
      {
        name: 'Method & certification',
        question: 'How was it produced?',
        sub: 'Tap to choose. These appear as trust badges on the product page.',
        summary: (d) => d.farming_method || '',
        fields: [
          {
            key: 'farming_method', label: 'Production method', type: 'tiles', required: true, lower: true,
            options: [
              { label: 'Grown / Harvested', icon: FiSun }, { label: 'Manufactured', icon: FiTool },
              { label: 'Assembled', icon: FiGrid }, { label: 'Processed', icon: FiSettings },
              { label: 'Extracted / Mined', icon: FiTriangle }, { label: 'Handcrafted', icon: FiPenTool },
              { label: 'Recycled / Upcycled', icon: FiRefreshCw },
            ],
          },
          { key: 'certifications', label: 'Certifications', type: 'multichips', required: true, hint: 'Pick all that apply, or None', options: CERTIFICATION_OPTIONS },
        ],
      },
    ],
    preview: [
      ['Quantity', (d) => d.quantity && `${d.quantity} ${d.quantity_unit}`],
      ['Production date', 'harvest_date'],
      ['Site', 'farm_name'],
      ['Method', 'farming_method'],
      ['Certifications', 'certifications'],
    ],
    nextSteps: [
      'Share the QR code with your processor so they can add their stage',
      'Logistics and retail add theirs the same way',
      'Buyers scan the QR code to see the whole journey',
    ],
  },

  'Processing/Packaging': {
    title: 'Add processing & packaging',
    entityLabel: 'Processing record',
    successTitle: 'Processing details added',
    icon: FiPackage,
    idKey: 'processor_id',
    idLabel: 'Processor ID',
    previewTitle: (d) => d.facility_name || 'Processing & packaging',
    steps: [
      {
        name: 'Batch & facility',
        question: 'Which batch did you process?',
        sub: 'Link this record to the batch it belongs to.',
        summary: (d) => d.facility_name || (d.batch_id && `Batch ${d.batch_id.slice(0, 8)}`),
        fields: [
          BATCH_FIELD,
          { key: 'facility_name', label: 'Facility name', type: 'text', placeholder: 'e.g., Northside Processing Plant', half: true },
          { key: 'processing_date', label: 'Processing date', type: 'date', required: true, half: true },
        ],
      },
      {
        name: 'Processing & packaging',
        question: 'What was done to the product?',
        sub: 'Describe the processing and how it was packed.',
        summary: (d) => d.packaging_type || '',
        fields: [
          { key: 'product_transformation_details', label: 'What was done', type: 'textarea', placeholder: 'e.g., Cleaned, assembled, and packed into 50-unit cartons' },
          {
            key: 'packaging_type', label: 'Packaging', type: 'chips', required: true, lower: true,
            options: ['Cardboard Box / Carton', 'Plastic Wrap / Bag', 'Pallet', 'Crate', 'Bottle / Jar', 'Drum / Barrel', 'Bulk Container', 'Vacuum Sealed', 'Recyclable', 'Biodegradable', 'Individual Portions'],
          },
          { key: 'lot_number', label: 'Lot number', type: 'text', required: true, placeholder: 'e.g., LOT2024001', half: true },
          { key: 'expiration_date', label: 'Expiry / use-by date', type: 'date', required: true, half: true },
        ],
      },
      {
        name: 'Quality & certification',
        question: 'Did it pass quality checks?',
        sub: 'Record the quality result and the facility certifications.',
        summary: (d) => d.quality_check_result || '',
        fields: [
          {
            key: 'quality_check_result', label: 'Quality check result', type: 'tiles', required: true, lower: true,
            options: [
              { label: 'Passed', icon: FiCheckCircle }, { label: 'Conditional Pass', icon: FiAlertCircle },
              { label: 'Pending Review', icon: FiClock }, { label: 'Requires Retest', icon: FiRotateCcw },
              { label: 'Failed', icon: FiXCircle },
            ],
          },
          {
            key: 'processing_certifications', label: 'Certifications', type: 'multichips', required: true, hint: 'Pick all that apply, or None',
            options: ['None', 'ISO 9001 (Quality)', 'ISO 14001 (Environmental)', 'GMP (Good Manufacturing Practice)', 'ISO 22000 / HACCP (Food Safety)', 'ISO 13485 (Medical Devices)', 'IATF 16949 (Automotive)', 'Organic', 'Halal', 'Kosher'],
          },
        ],
      },
    ],
    preview: [
      ['Batch', (d) => d.batch_id && `${d.batch_id.slice(0, 8)}…`],
      ['Processed', 'processing_date'],
      ['Packaging', 'packaging_type'],
      ['Lot number', 'lot_number'],
      ['Use by', 'expiration_date'],
      ['Quality', 'quality_check_result'],
    ],
    nextSteps: [
      'Hand the batch to your logistics partner',
      'They scan the same QR code to add the shipment',
      'Buyers see your processing step in the journey',
    ],
  },

  'Logistics & Cold Chain Monitoring': {
    title: 'Add a shipment',
    entityLabel: 'Shipment',
    successTitle: 'Shipment recorded',
    icon: FiTruck,
    idKey: 'shipment_id',
    idLabel: 'Shipment ID',
    previewTitle: (d) => d.logistics_provider_id || 'Shipment',
    steps: [
      {
        name: 'Batch & carrier',
        question: 'Which batch are you shipping?',
        sub: 'Link the shipment to its batch and choose the carrier.',
        summary: (d) => d.logistics_provider_id || '',
        fields: [
          BATCH_FIELD,
          {
            key: 'logistics_provider_id', label: 'Logistics provider', type: 'chips', required: true, lower: true,
            options: ['FedEx', 'UPS', 'DHL', 'Amazon Logistics', 'USPS', 'TNT Express', 'DB Schenker', 'Kuehne + Nagel', 'C.H. Robinson', 'XPO Logistics'],
          },
        ],
      },
      {
        name: 'Shipment timing',
        question: 'When did it travel?',
        sub: 'Departure and arrival times for this leg of the journey.',
        summary: (d) => (d.departure_time ? 'Dates added' : ''),
        fields: [
          { key: 'departure_time', label: 'Departure', type: 'datetime', required: true, half: true },
          { key: 'arrival_time', label: 'Arrival', type: 'datetime', required: true, half: true, after: 'departure_time' },
          { key: 'GPS_tracking_hash', label: 'GPS tracking reference', type: 'text', placeholder: 'e.g., GPS_HASH_ABC123XYZ' },
        ],
      },
      {
        name: 'Conditions',
        question: 'How did the shipment go?',
        sub: 'Record transport conditions and any alerts.',
        summary: (d) => d.cold_chain_breach_flags || '',
        fields: [
          {
            key: 'cold_chain_breach_flags', label: 'Shipment condition', type: 'tiles', lower: true,
            options: [
              { label: 'No Issues', icon: FiCheckCircle }, { label: 'Temperature Exceeded', icon: FiThermometer },
              { label: 'Humidity Exceeded', icon: FiDroplet }, { label: 'Delay in Transit', icon: FiClock },
              { label: 'Damage / Shock Detected', icon: FiAlertTriangle }, { label: 'Equipment Failure', icon: FiTool },
              { label: 'Multiple Issues', icon: FiLayers },
            ],
          },
          { key: 'real_time_temperature_logs', label: 'Temperature logs', type: 'textarea', placeholder: 'e.g., 2°C at 10:00, 3°C at 11:00', half: true },
          { key: 'humidity_logs', label: 'Humidity logs', type: 'textarea', placeholder: 'e.g., 65% at 10:00, 68% at 11:00', half: true },
          {
            key: 'transport_certification_status', label: 'Transport certifications', type: 'multichips', hint: 'Pick all that apply',
            options: ['None', 'ISO 9001 (Quality)', 'ISO 14001 (Environmental)', 'ISO 45001 (Health & Safety)', 'ISO 28000 (Supply Chain Security)', 'TAPA (Cargo Security)', 'GDP (Good Distribution Practice)', 'Temperature-Controlled Certified'],
          },
        ],
      },
    ],
    preview: [
      ['Batch', (d) => d.batch_id && `${d.batch_id.slice(0, 8)}…`],
      ['Carrier', 'logistics_provider_id'],
      ['Departed', 'departure_time'],
      ['Arrived', 'arrival_time'],
      ['Condition', 'cold_chain_breach_flags'],
    ],
    nextSteps: [
      'The retailer scans the batch QR code on arrival',
      'They add stock and shelf-life details',
      'Buyers see this shipment in the journey',
    ],
  },

  'Distribution/Retail': {
    title: 'Add retail details',
    entityLabel: 'Retail record',
    successTitle: 'Retail details added',
    icon: FiShoppingBag,
    idKey: 'retailer_id',
    idLabel: 'Retailer ID',
    previewTitle: (d) => d.store_location || 'Distribution & retail',
    steps: [
      {
        name: 'Batch & location',
        question: 'Where is this batch stocked?',
        sub: 'Link the record to its batch and the store it is sold from.',
        summary: (d) => d.store_location || '',
        fields: [
          BATCH_FIELD,
          { key: 'store_location', label: 'Store location', type: 'text', required: true, placeholder: 'e.g., Store #123, Main Street, City' },
          { key: 'distribution_center_location', label: 'Distribution center', type: 'text', placeholder: 'e.g., Central Distribution Hub, City' },
        ],
      },
      {
        name: 'Stock & arrival',
        question: 'When did it arrive?',
        sub: 'Stock references for this batch at the store.',
        summary: (d) => d.inventory_id || '',
        fields: [
          { key: 'product_arrival_timestamp', label: 'Arrival time', type: 'datetime', half: true },
          { key: 'inventory_id', label: 'Inventory ID', type: 'text', required: true, placeholder: 'e.g., INV-2024-001', half: true },
          { key: 'product_qr_code', label: 'Product QR / barcode', type: 'text', required: true, placeholder: 'e.g., QR-2024-ABC123' },
        ],
      },
      {
        name: 'Shelf life & sale',
        question: 'When does it go on sale?',
        sub: 'Shelf life helps buyers know how fresh the product is.',
        summary: (d) => d.shelf_life_remaining || '',
        fields: [
          {
            key: 'shelf_life_remaining', label: 'Shelf life / validity remaining', type: 'chips', required: true,
            options: ['1-2 days', '3-5 days', '1 week', '2 weeks', '1 month', '2-3 months', '6 months', '1 year', 'More than 1 year', 'Not applicable'],
          },
          { key: 'display_date', label: 'Available for sale', type: 'date', required: true, half: true },
        ],
      },
    ],
    preview: [
      ['Batch', (d) => d.batch_id && `${d.batch_id.slice(0, 8)}…`],
      ['Store', 'store_location'],
      ['Inventory ID', 'inventory_id'],
      ['Shelf life', 'shelf_life_remaining'],
      ['On sale', 'display_date'],
    ],
    nextSteps: [
      'The batch journey is now complete',
      'Buyers scan the QR code in store to see every stage',
    ],
  },
};
