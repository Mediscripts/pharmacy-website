export const navigationLinks = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Track Order', to: '/track-order' },
  { label: 'Contact', to: '/contact' },
]

export const homeFeatures = [
  {
    title: 'Fast medicine search',
    description:
      'Browse trusted medicines by category and find exactly what you need in moments.',
  },
  {
    title: 'Prescription-first safety',
    description:
      'Prescription-only medicines go through a careful review process before payment or release.',
  },
  {
    title: 'Order updates you can trust',
    description:
      'Track your order securely with email verification and clear updates from checkout to delivery.',
  },
]

export const categories = [
  'Pain Relief',
  'Antibiotics',
  'Baby Care',
  'Supplements',
  'Diabetes',
  'Skin Care',
]

export const featuredProducts = [
  {
    id: 'paracetamol-500mg',
    category: 'Pain Relief',
    name: 'Paracetamol 500mg',
    description: 'Everyday relief for fever and mild pain, delivered with a simple and reliable ordering experience.',
    price: 2500,
    note: 'In stock',
    image: '/product-placeholder.svg',
    inStock: true,
  },
  {
    id: 'vitamin-c-tablets',
    category: 'Supplements',
    name: 'Vitamin C Tablets',
    description: 'Daily immune support with a smooth, easy way to shop for your essentials.',
    price: 4200,
    note: 'Popular',
    image: '/product-placeholder.svg',
    inStock: true,
  },
  {
    id: 'baby-lotion',
    category: 'Baby Care',
    name: 'Baby Lotion',
    description: 'Gentle care essentials for infants and toddlers, ready when you need them.',
    price: 3100,
    note: 'Fast moving',
    image: '/product-placeholder.svg',
    inStock: true,
  },
  {
    id: 'antiseptic-cream',
    category: 'Skin Care',
    name: 'Antiseptic Cream',
    description: 'Reliable skin care for everyday comfort, available with a simple order process.',
    price: 5000,
    note: 'Available',
    image: '/product-placeholder.svg',
    inStock: true,
  },
  {
    id: 'glucometer-strips',
    category: 'Diabetes',
    name: 'Glucometer Strips',
    description: 'Essential diabetes supplies you can reorder with confidence and convenience.',
    price: 8500,
    note: 'Limited stock',
    image: '/product-placeholder.svg',
    inStock: false,
  },
  {
    id: 'amoxicillin-capsules',
    category: 'Prescription',
    name: 'Amoxicillin Capsules',
    description: 'A secure prescription-based purchase flow designed to keep your care moving smoothly.',
    price: 6800,
    note: 'Prescription required',
    image: '/product-placeholder.svg',
    inStock: true,
  },
]

export const purchaseSteps = [
  'Browse the catalog and find the right medicine',
  'Add products to cart and complete checkout',
  'Upload prescriptions when required',
  'Track payment, approval, and delivery status',
]

export const supportContacts = [
  {
    label: 'Phone',
    value: '+234 800 000 0000',
  },
  {
    label: 'Email',
    value: 'support@mediscriptpharmacy.com',
  },
  {
    label: 'Hours',
    value: 'Mon - Sat, 8:00 AM - 8:00 PM',
  },
]
