import type { TariffRule } from '@/types'

export const DEFAULT_TARIFF_RULES: TariffRule[] = [
  { id: '1', keyword: 'CAR AROMATHERAPY', descriptionEn: 'Car aromatherapy products', descriptionSq: 'Produkte aromatike per makine', tariffCode: '33074900', customsRate: 10, vatRate: 18, notes: '' },
  { id: '2', keyword: 'CERAMIC BOWL', descriptionEn: 'Ceramic bowls', descriptionSq: 'Tasa qeramike', tariffCode: '6912008100', customsRate: 10, vatRate: 18, notes: '' },
  { id: '3', keyword: 'CERAMIC PLATE', descriptionEn: 'Ceramic plates', descriptionSq: 'Pjata qeramike', tariffCode: '6912008100', customsRate: 10, vatRate: 18, notes: '' },
  { id: '4', keyword: 'CERAMIC TABLEWARE', descriptionEn: 'Ceramic tableware', descriptionSq: 'Enë tryeze qeramike', tariffCode: '6912008100', customsRate: 10, vatRate: 18, notes: '' },
  { id: '5', keyword: 'CERAMIC STOCKPOT', descriptionEn: 'Ceramic stockpot', descriptionSq: 'Tenxhere qeramike', tariffCode: '6912008100', customsRate: 10, vatRate: 18, notes: '' },
  { id: '6', keyword: 'GLASS CUP', descriptionEn: 'Glass cups', descriptionSq: 'Gota qelqi', tariffCode: '7013370000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '7', keyword: 'GLASS TABLEWARE', descriptionEn: 'Glass tableware', descriptionSq: 'Ene tryeze qelqi', tariffCode: '7013370000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '8', keyword: 'HAIR STRAIGHTENER', descriptionEn: 'Hair straightener', descriptionSq: 'Drejtues flokesh', tariffCode: '8516320000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '9', keyword: 'CHARGER', descriptionEn: 'Electric charger', descriptionSq: 'Mbushes elektrik', tariffCode: '8504400000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '10', keyword: 'USB CABLE', descriptionEn: 'USB cable', descriptionSq: 'Kabllo USB', tariffCode: '8544420000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '11', keyword: 'BLUETOOTH HEADSET', descriptionEn: 'Bluetooth headset', descriptionSq: 'Kufje Bluetooth', tariffCode: '8518300000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '12', keyword: 'BABY STROLLER', descriptionEn: 'Baby stroller', descriptionSq: 'Karrocë fëmijësh', tariffCode: '8715000000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '13', keyword: 'ELECTRONIC WATCH', descriptionEn: 'Electronic watch', descriptionSq: 'Ore elektronike', tariffCode: '9102000000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '14', keyword: 'UMBRELLA', descriptionEn: 'Umbrella', descriptionSq: 'Ombrellë', tariffCode: '6601000000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '15', keyword: 'OUTDOOR UMBRELLA', descriptionEn: 'Outdoor umbrella', descriptionSq: 'Ombrellë për jashtë', tariffCode: '6601910000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '16', keyword: 'LUGGAGE', descriptionEn: 'Luggage', descriptionSq: 'Valixhe', tariffCode: '4202120000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '17', keyword: 'BACKPACK', descriptionEn: 'Backpack', descriptionSq: 'Çantë shpine', tariffCode: '4202920000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '18', keyword: 'PAPER NAPKIN', descriptionEn: 'Paper napkins', descriptionSq: 'Peceta letre', tariffCode: '4818300000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '19', keyword: 'TOILET PAPER', descriptionEn: 'Toilet paper', descriptionSq: 'Letër tualeti', tariffCode: '4818100000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '20', keyword: 'PAPER TOWEL', descriptionEn: 'Paper towels', descriptionSq: 'Peshqir letre', tariffCode: '4818200000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '21', keyword: 'FRIDGE MAGNET', descriptionEn: 'Fridge magnet rubber', descriptionSq: 'Magnet frigoriferi gome', tariffCode: '8505199000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '22', keyword: 'MODEL METAL CAR', descriptionEn: 'Model metal car toy', descriptionSq: 'Makine lodër metalike', tariffCode: '9503000000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '23', keyword: 'BALL TOY', descriptionEn: 'Ball toy', descriptionSq: 'Top lodër', tariffCode: '9503000000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '24', keyword: 'SCOOTER', descriptionEn: "Children's scooter", descriptionSq: 'Biçikletë fëmijësh', tariffCode: '9503003000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '25', keyword: 'USB MOUSE', descriptionEn: 'USB wireless mouse', descriptionSq: 'Maus pa tel USB', tariffCode: '8471600000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '26', keyword: 'KEYBOARD', descriptionEn: 'Computer keyboard', descriptionSq: 'Tastierë kompjuteri', tariffCode: '8471600000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '27', keyword: 'HAIR DRYER', descriptionEn: 'Hair dryer', descriptionSq: 'Tharëse flokësh', tariffCode: '8516310000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '28', keyword: 'DRY IRON', descriptionEn: 'Dry iron', descriptionSq: 'Hekur i thatë', tariffCode: '8516400000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '29', keyword: 'EARPHONE', descriptionEn: 'Earphone', descriptionSq: 'Kufje', tariffCode: '8518300000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '30', keyword: 'FOLDING CHAIR', descriptionEn: 'Folding chair', descriptionSq: 'Karrige e palosshme', tariffCode: '9401790000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '31', keyword: 'PILLOWCASE', descriptionEn: 'Pillowcase', descriptionSq: 'Jastëkçe', tariffCode: '6302219000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '32', keyword: 'QUILT', descriptionEn: 'Quilt', descriptionSq: 'Jorgan', tariffCode: '9404900000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '33', keyword: 'PUMP', descriptionEn: 'Pump', descriptionSq: 'Pompë', tariffCode: '8413810000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '34', keyword: 'NOTEBOOK', descriptionEn: 'Notebook', descriptionSq: 'Bllok shënimesh', tariffCode: '4820100000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '35', keyword: 'PLUG', descriptionEn: 'Electrical plug', descriptionSq: 'Bashkues elektrik', tariffCode: '8536500000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '36', keyword: 'VACUUM KETTLE', descriptionEn: 'Vacuum hot water kettle', descriptionSq: 'Kazan uji i nxehtë me vakum', tariffCode: '8516400000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '37', keyword: 'ELECTRIC MIXER', descriptionEn: 'Electric dough mixer', descriptionSq: 'Mikser elektrik brume', tariffCode: '8509400000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '38', keyword: 'OVENWARE', descriptionEn: 'Ovenware', descriptionSq: 'Enë furre', tariffCode: '6912008100', customsRate: 10, vatRate: 18, notes: '' },
  { id: '39', keyword: 'BABY CAR SEAT', descriptionEn: 'Baby car safety seat', descriptionSq: 'Sedile sigurie fëmijësh', tariffCode: '9401200000', customsRate: 10, vatRate: 18, notes: '' },
  { id: '40', keyword: 'BABY HIGH CHAIR', descriptionEn: 'Baby high chair', descriptionSq: 'Karrige e lartë fëmijësh', tariffCode: '9401790000', customsRate: 10, vatRate: 18, notes: '' },
]

export function findTariffByKeyword(description: string, rules?: TariffRule[]): TariffRule | null {
  const allRules = rules || DEFAULT_TARIFF_RULES
  const upper = description.toUpperCase()

  // Sort by keyword length desc for best match
  const sorted = [...allRules].sort((a, b) => b.keyword.length - a.keyword.length)

  for (const rule of sorted) {
    if (upper.includes(rule.keyword.toUpperCase())) {
      return rule
    }
  }
  return null
}

export function getTariffRules(): TariffRule[] {
  if (typeof window === 'undefined') return DEFAULT_TARIFF_RULES
  try {
    const stored = localStorage.getItem('dudi_tariff_rules')
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_TARIFF_RULES
}

export function saveTariffRules(rules: TariffRule[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('dudi_tariff_rules', JSON.stringify(rules))
}
