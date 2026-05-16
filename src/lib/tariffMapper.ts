import type { TariffRule } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Tariff codes sourced from TARIFA DOGANORE KOSOVE (TARIK 2025)
// Basis: Harmonized System + EU Combined Nomenclature, valid from 1 Jan 2025
// CD = Customs Duty (dogana) | VAT = TVSH (18% standard Kosovo rate)
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_TARIFF_RULES: TariffRule[] = [

  // ── AROMATIC / PERFUME / FRAGRANCE ────────────────────────────────────────
  { id: '1',  keyword: 'CAR AROMATHERAPY',     descriptionEn: 'Car aromatherapy / fragrance products',       descriptionSq: 'PREPARATE AROMATIKE PER MAKINE',            tariffCode: '3307490000', customsRate: 10, vatRate: 18, notes: 'TARIK 3307 49 00 — Preparate aromatike, të tjera' },
  { id: '2',  keyword: 'PAPER TABLET AROMA',   descriptionEn: 'Aromatic paper tablet',                       descriptionSq: 'TABLETA AROMATIKE PREJ LETRE',               tariffCode: '3307490000', customsRate: 10, vatRate: 18, notes: 'TARIK 3307 49 00' },
  { id: '3',  keyword: 'INCENSE',              descriptionEn: 'Incense / agarbati',                          descriptionSq: 'THIMJAM / TEMJAN',                           tariffCode: '3307410000', customsRate: 10, vatRate: 18, notes: 'TARIK 3307 41 00 — Agarbati' },
  { id: '4',  keyword: 'AIR FRESHENER',        descriptionEn: 'Air freshener / room fragrance',              descriptionSq: 'PARFUM DHOME',                               tariffCode: '3307490000', customsRate: 10, vatRate: 18, notes: 'TARIK 3307 49 00' },

  // ── CERAMICS ──────────────────────────────────────────────────────────────
  { id: '5',  keyword: 'CERAMIC BOWL',         descriptionEn: 'Ceramic bowls',                               descriptionSq: 'TAS QERAMIKE',                               tariffCode: '6912002900', customsRate: 10, vatRate: 18, notes: 'TARIK 6912 00 29 — Enë qeramike tavoline/kuzhine, të tjera' },
  { id: '6',  keyword: 'CERAMIC PLATE',        descriptionEn: 'Ceramic plates',                              descriptionSq: 'PJATE QERAMIKE',                             tariffCode: '6912002900', customsRate: 10, vatRate: 18, notes: 'TARIK 6912 00 29' },
  { id: '7',  keyword: 'CERAMIC TABLEWARE',    descriptionEn: 'Ceramic tableware set',                       descriptionSq: 'SET ENESH TRYEZE QERAMIKE',                  tariffCode: '6912002900', customsRate: 10, vatRate: 18, notes: 'TARIK 6912 00 29' },
  { id: '8',  keyword: 'CERAMIC STOCKPOT',     descriptionEn: 'Ceramic stockpot / cooking pot',              descriptionSq: 'TENXHERE QERAMIKE',                          tariffCode: '6912002100', customsRate: 10, vatRate: 18, notes: 'TARIK 6912 00 21 — Prej qeramike te zakonshme' },
  { id: '9',  keyword: 'PORCELAIN',            descriptionEn: 'Porcelain / faience tableware',               descriptionSq: 'ENE PORCELANI / FAJANCE',                    tariffCode: '6911100000', customsRate: 10, vatRate: 18, notes: 'TARIK 6911 10 00 — Pajisje tavoline e kuzhine porcelani' },
  { id: '10', keyword: 'OVENWARE',             descriptionEn: 'Ceramic ovenware / baking dish',              descriptionSq: 'ENE FURRE QERAMIKE',                         tariffCode: '6911100000', customsRate: 10, vatRate: 18, notes: 'TARIK 6911 10 00' },

  // ── GLASS ─────────────────────────────────────────────────────────────────
  { id: '11', keyword: 'GLASS CUP',            descriptionEn: 'Glass cups / drinking glasses',               descriptionSq: 'GOTE QELQI',                                 tariffCode: '7013289000', customsRate: 10, vatRate: 18, notes: 'TARIK 7013 28 90 — Gota pije, te mbledhura mekanikisht' },
  { id: '12', keyword: 'GLASS TABLEWARE',      descriptionEn: 'Glass tableware / glassware set',             descriptionSq: 'ENE TRYEZE PREJ QELQI',                      tariffCode: '7013289000', customsRate: 10, vatRate: 18, notes: 'TARIK 7013 28 90' },

  // ── HAIR APPLIANCES ───────────────────────────────────────────────────────
  { id: '13', keyword: 'HAIR DRYER',           descriptionEn: 'Hair dryer',                                  descriptionSq: 'THARSE FLOKESH',                             tariffCode: '8516310000', customsRate: 10, vatRate: 18, notes: 'TARIK 8516 31 00 — Thareset e flokeve' },
  { id: '14', keyword: 'HAIR STRAIGHTENER',    descriptionEn: 'Hair straightener / flat iron',               descriptionSq: 'DREJTUES FLOKESH',                           tariffCode: '8516320000', customsRate: 10, vatRate: 18, notes: 'TARIK 8516 32 00 — Aparate tjera per kujdes flokesh' },
  { id: '15', keyword: 'HAIR CURLER',          descriptionEn: 'Hair curling iron',                          descriptionSq: 'KAÇURRELUSE FLOKESH',                         tariffCode: '8516320000', customsRate: 10, vatRate: 18, notes: 'TARIK 8516 32 00' },
  { id: '16', keyword: 'DRY IRON',             descriptionEn: 'Electric dry iron',                          descriptionSq: 'HEKUR I THATE ELEKTRIK',                      tariffCode: '8516400000', customsRate: 10, vatRate: 18, notes: 'TARIK 8516 40 00 — Hekurat e hekurosjes elektrike' },

  // ── KITCHEN APPLIANCES ────────────────────────────────────────────────────
  { id: '17', keyword: 'ELECTRIC MIXER',       descriptionEn: 'Electric food mixer / blender',              descriptionSq: 'MIKSER ELEKTRIK PER USHQIM',                  tariffCode: '8509400000', customsRate: 10, vatRate: 18, notes: 'TARIK 8509 40 00 — Grireset e perziersit e ushqimit' },
  { id: '18', keyword: 'ELECTRIC DOUGH',       descriptionEn: 'Electric dough mixer',                       descriptionSq: 'MIKSER ELEKTRIK BRUME',                       tariffCode: '8509400000', customsRate: 10, vatRate: 18, notes: 'TARIK 8509 40 00' },
  { id: '19', keyword: 'VACUUM KETTLE',        descriptionEn: 'Vacuum hot water kettle / thermos flask',    descriptionSq: 'KAZAN UJI VAKUM',                             tariffCode: '8516609000', customsRate: 10, vatRate: 18, notes: 'TARIK 8516 60 90 — Pajisje te tjera gatimi elektrike' },
  { id: '20', keyword: 'ELECTRIC KETTLE',      descriptionEn: 'Electric kettle',                            descriptionSq: 'KAZAN ELEKTRIK',                              tariffCode: '8516609000', customsRate: 10, vatRate: 18, notes: 'TARIK 8516 60 90' },
  { id: '21', keyword: 'VACUUM CLEANER',       descriptionEn: 'Vacuum cleaner',                             descriptionSq: 'FSHESE ELEKTRIKE',                            tariffCode: '8508190000', customsRate: 10, vatRate: 18, notes: 'TARIK 8508 19 00 — Fshesa elektrike, tjera' },

  // ── CHARGERS / CABLES / POWER ─────────────────────────────────────────────
  { id: '22', keyword: 'CHARGER',              descriptionEn: 'Electric charger / power adapter',           descriptionSq: 'MBUSHES ELEKTRIK / ADAPTER',                  tariffCode: '8504408390', customsRate: 10, vatRate: 18, notes: 'TARIK 8504 40 83 90 — Konvertues stati, te tjera' },
  { id: '23', keyword: 'USB CABLE',            descriptionEn: 'USB cable / data cable',                     descriptionSq: 'KABLLO USB',                                  tariffCode: '8544429000', customsRate: 10, vatRate: 18, notes: 'TARIK 8544 42 90 — Konduktore elektrike, te tjera' },
  { id: '24', keyword: 'POWER BANK',           descriptionEn: 'Power bank / portable battery',             descriptionSq: 'BATERI PORTABËL',                             tariffCode: '8507600000', customsRate: 10, vatRate: 18, notes: 'TARIK 8507 60 — Akumulues jon-litium' },
  { id: '25', keyword: 'PLUG',                 descriptionEn: 'Electrical plug / connector',               descriptionSq: 'BASHKUES / GNISHTIM ELEKTRIK',                tariffCode: '8536500000', customsRate: 10, vatRate: 18, notes: 'TARIK 8536 50 — Çelesa te tjera, konektore' },

  // ── AUDIO / HEADSETS ──────────────────────────────────────────────────────
  { id: '26', keyword: 'BLUETOOTH HEADSET',    descriptionEn: 'Bluetooth headset / wireless earphones',    descriptionSq: 'KUFJE BLUETOOTH PA TELA',                     tariffCode: '8518300020', customsRate: 10, vatRate: 18, notes: 'TARIK 8518 30 00 20 — Kufje headset' },
  { id: '27', keyword: 'EARPHONE',             descriptionEn: 'Earphones / earbuds',                       descriptionSq: 'KUFJE / EARPHONE',                            tariffCode: '8518300020', customsRate: 10, vatRate: 18, notes: 'TARIK 8518 30 00 20' },
  { id: '28', keyword: 'HEADPHONES',           descriptionEn: 'Headphones',                                descriptionSq: 'KUFJE OVER-EAR',                               tariffCode: '8518300020', customsRate: 10, vatRate: 18, notes: 'TARIK 8518 30 00 20' },
  { id: '29', keyword: 'SPEAKER',              descriptionEn: 'Loudspeaker / portable speaker',            descriptionSq: 'ALTOPARLANT / SPIKAR',                         tariffCode: '8518210090', customsRate: 10, vatRate: 18, notes: 'TARIK 8518 21 00 90 — Altoparlanta, te tjera' },

  // ── PHONES / COMPUTERS ───────────────────────────────────────────────────
  { id: '30', keyword: 'SMARTPHONE',           descriptionEn: 'Smartphone / mobile phone',                 descriptionSq: 'TELEFON INTELIGJENT',                          tariffCode: '8517130000', customsRate: 10, vatRate: 18, notes: 'TARIK 8517 13 00 — Telefona inteligjente' },
  { id: '31', keyword: 'MOBILE PHONE',         descriptionEn: 'Mobile / cellular phone',                   descriptionSq: 'TELEFON CELULAR',                              tariffCode: '8517140000', customsRate: 10, vatRate: 18, notes: 'TARIK 8517 14 00 — Telefona per rrjete celulare, tjera' },
  { id: '32', keyword: 'KEYBOARD',             descriptionEn: 'Computer keyboard',                         descriptionSq: 'TASTIERE KOMPJUTERI',                          tariffCode: '8471606090', customsRate: 0,  vatRate: 18, notes: 'TARIK 8471 60 60 90 — Pajisje hyrjeje, te tjera' },
  { id: '33', keyword: 'USB MOUSE',            descriptionEn: 'Computer mouse / USB wireless mouse',       descriptionSq: 'MAUS KOMPJUTERI',                              tariffCode: '8471606090', customsRate: 0,  vatRate: 18, notes: 'TARIK 8471 60 60 90' },
  { id: '34', keyword: 'LAPTOP',               descriptionEn: 'Laptop / portable computer',               descriptionSq: 'KOMPJUTER PORTABEL',                            tariffCode: '8471300000', customsRate: 0,  vatRate: 18, notes: 'TARIK 8471 30 00 — Makina portabile te perpunimit te te dhenave' },
  { id: '35', keyword: 'TABLET PC',            descriptionEn: 'Tablet PC / iPad',                         descriptionSq: 'TABLETE KOMPJUTERIKE',                          tariffCode: '8471300000', customsRate: 0,  vatRate: 18, notes: 'TARIK 8471 30 00' },
  { id: '36', keyword: 'MONITOR',              descriptionEn: 'Computer monitor / display screen',        descriptionSq: 'MONITOR KOMPJUTERI',                            tariffCode: '8528490000', customsRate: 10, vatRate: 18, notes: 'TARIK 8528 49 00 — Monitore, te tjera' },
  { id: '37', keyword: 'TELEVISION',           descriptionEn: 'Television / TV set',                      descriptionSq: 'TELEVIZOR',                                     tariffCode: '8528490000', customsRate: 10, vatRate: 18, notes: 'TARIK 8528 49 00' },

  // ── BABY / CHILDREN ───────────────────────────────────────────────────────
  { id: '38', keyword: 'BABY STROLLER',        descriptionEn: 'Baby stroller / pram',                     descriptionSq: 'KARROCA FEMIJESH / PRAM',                       tariffCode: '8715001000', customsRate: 10, vatRate: 18, notes: 'TARIK 8715 00 10 — Karrocat e bebeve' },
  { id: '39', keyword: 'BABY CAR SEAT',        descriptionEn: 'Baby car safety seat',                     descriptionSq: 'SEDILE SIGURIE FEMIJESH PER MAKINE',            tariffCode: '9401200000', customsRate: 10, vatRate: 18, notes: 'TARIK 9401 20 00 — Ndenjeset per mjete transporti rrugor' },
  { id: '40', keyword: 'BABY HIGH CHAIR',      descriptionEn: 'Baby high chair',                          descriptionSq: 'KARRIGE E LARTE PER FEMIJE',                    tariffCode: '9401790000', customsRate: 10, vatRate: 18, notes: 'TARIK 9401 79 00 — Ndenjese, te tjera (pa mbulese)' },
  { id: '41', keyword: 'CHILDREN SCOOTER',     descriptionEn: "Children's kick scooter",                  descriptionSq: 'TROTINET FEMIJESH',                             tariffCode: '9506703000', customsRate: 10, vatRate: 18, notes: 'TARIK 9506 70 30 — Patina me rrota' },
  { id: '42', keyword: 'SCOOTER',              descriptionEn: 'Motor scooter',                            descriptionSq: 'SKUTER',                                        tariffCode: '8711201000', customsRate: 10, vatRate: 18, notes: 'TARIK 8711 20 10 — Skuter' },

  // ── UMBRELLAS ─────────────────────────────────────────────────────────────
  { id: '43', keyword: 'OUTDOOR UMBRELLA',     descriptionEn: 'Outdoor / garden umbrella',                descriptionSq: 'OMBRELLA KOPSHTI / JASHTE',                     tariffCode: '6601100000', customsRate: 10, vatRate: 18, notes: 'TARIK 6601 10 00 — Cadrat e kopshtit' },
  { id: '44', keyword: 'UMBRELLA',             descriptionEn: 'Umbrella / rain umbrella',                 descriptionSq: 'OMBRELLA / CADER SHIU',                         tariffCode: '6601910000', customsRate: 10, vatRate: 18, notes: 'TARIK 6601 91 00 — Cadra me shteize teleskopike' },

  // ── BAGS / LUGGAGE ────────────────────────────────────────────────────────
  { id: '45', keyword: 'BACKPACK',             descriptionEn: 'Backpack / rucksack',                      descriptionSq: 'CANTE SHPINE',                                  tariffCode: '4202911000', customsRate: 10, vatRate: 18, notes: 'TARIK 4202 91 10 — Cantat e udhetimit, shpines etj.' },
  { id: '46', keyword: 'LUGGAGE',              descriptionEn: 'Suitcase / trolley luggage',               descriptionSq: 'VALIXHE / BAGAZH',                              tariffCode: '4202129100', customsRate: 10, vatRate: 18, notes: 'TARIK 4202 12 91 — Valixhe, me siperfaqe teksti' },
  { id: '47', keyword: 'SCHOOL BAG',           descriptionEn: 'School bag / satchel',                     descriptionSq: 'CANTE SHKOLLORE',                               tariffCode: '4202111000', customsRate: 10, vatRate: 18, notes: 'TARIK 4202 11 10 — Cantat e dokumenteve / shkollore' },
  { id: '48', keyword: 'HANDBAG',              descriptionEn: 'Ladies handbag / purse',                   descriptionSq: 'CANTE DORE FEMRASH',                            tariffCode: '4202219000', customsRate: 10, vatRate: 18, notes: 'TARIK 4202 21 — Canta dore me lekure etj.' },

  // ── PAPER / HYGIENE ───────────────────────────────────────────────────────
  { id: '49', keyword: 'TOILET PAPER',         descriptionEn: 'Toilet paper / bathroom tissue',           descriptionSq: 'LETER TUALETI / HIGJENIKE',                     tariffCode: '4818101000', customsRate: 10, vatRate: 18, notes: 'TARIK 4818 10 10 — Letra higjenike, peshe max 25g/m2' },
  { id: '50', keyword: 'PAPER NAPKIN',         descriptionEn: 'Paper napkins / facial tissue',            descriptionSq: 'PECETE LETRE / SHAMICE LETRE',                  tariffCode: '4818201000', customsRate: 10, vatRate: 18, notes: 'TARIK 4818 20 10 — Shamice dhe letra pastruese faciale' },
  { id: '51', keyword: 'PAPER TOWEL',          descriptionEn: 'Paper kitchen towels / rolls',             descriptionSq: 'PESHQIRE LETRE',                                tariffCode: '4818209100', customsRate: 10, vatRate: 18, notes: 'TARIK 4818 20 91 — Letra pastruese, ne role' },

  // ── TOYS ──────────────────────────────────────────────────────────────────
  { id: '52', keyword: 'MODEL METAL CAR',      descriptionEn: 'Die-cast model metal car',                 descriptionSq: 'MAKINE LODRA METALIKE / MINIATURE',             tariffCode: '9503008500', customsRate: 10, vatRate: 18, notes: 'TARIK 9503 00 85 — Modele miniature te fituara me derdhje metali' },
  { id: '53', keyword: 'BALL TOY',             descriptionEn: 'Ball toy / inflatable ball',               descriptionSq: 'TOP LODRA',                                     tariffCode: '9503007500', customsRate: 10, vatRate: 18, notes: 'TARIK 9503 00 75 — Lodra tjera, prej plastike' },
  { id: '54', keyword: 'DOLL',                 descriptionEn: 'Doll / toy doll',                          descriptionSq: 'KUKULL LODRA',                                  tariffCode: '9503002100', customsRate: 10, vatRate: 18, notes: 'TARIK 9503 00 21 — Kukullat' },
  { id: '55', keyword: 'TOY',                  descriptionEn: 'Toy / children toy',                       descriptionSq: 'LODRA FEMIJESH',                                tariffCode: '9503007900', customsRate: 10, vatRate: 18, notes: 'TARIK 9503 00 79 — Lodra tjera, prej materialeve tjera' },
  { id: '56', keyword: 'ELECTRIC TRAIN',       descriptionEn: 'Electric toy train set',                   descriptionSq: 'TREN LODRA ELEKTRIK',                           tariffCode: '9503003000', customsRate: 10, vatRate: 18, notes: 'TARIK 9503 00 30 — Trenat elektrike me aksesore' },

  // ── WATCHES ───────────────────────────────────────────────────────────────
  { id: '57', keyword: 'ELECTRONIC WATCH',     descriptionEn: 'Electronic / digital wristwatch',          descriptionSq: 'ORE ELEKTRONIKE / DIXHITALE',                   tariffCode: '9102120000', customsRate: 10, vatRate: 18, notes: 'TARIK 9102 12 00 — Ore, vetem me afishues opto-elektronik' },
  { id: '58', keyword: 'WRIST WATCH',          descriptionEn: 'Wristwatch',                               descriptionSq: 'ORE DORE',                                      tariffCode: '9102190000', customsRate: 10, vatRate: 18, notes: 'TARIK 9102 19 00 — Ore, te tjera' },
  { id: '59', keyword: 'SMART WATCH',          descriptionEn: 'Smart watch',                              descriptionSq: 'ORE INTELIGJENTE',                              tariffCode: '8517140000', customsRate: 10, vatRate: 18, notes: 'TARIK 8517 14 00 — Paisje wireless te tjera' },

  // ── FURNITURE / CHAIRS ────────────────────────────────────────────────────
  { id: '60', keyword: 'FOLDING CHAIR',        descriptionEn: 'Folding chair / portable chair',           descriptionSq: 'KARRIGE E PALOSSHME',                           tariffCode: '9401790000', customsRate: 10, vatRate: 18, notes: 'TARIK 9401 79 00 — Ndenjese, te tjera' },
  { id: '61', keyword: 'SOFA',                 descriptionEn: 'Sofa / couch / settee',                    descriptionSq: 'DIVAN / SOFA',                                  tariffCode: '9401610000', customsRate: 10, vatRate: 18, notes: 'TARIK 9401 61 00 — Ndenjese, te mobiluara' },
  { id: '62', keyword: 'ROCKING CHAIR',        descriptionEn: 'Rocking chair',                            descriptionSq: 'KARRIGE LJATACESE',                             tariffCode: '9401790000', customsRate: 10, vatRate: 18, notes: 'TARIK 9401 79 00' },
  { id: '63', keyword: 'TABLE CHAIR SET',      descriptionEn: 'Table and chair set / furniture set',      descriptionSq: 'SET TAVOLINE DHE KARRIGE',                      tariffCode: '9403601000', customsRate: 10, vatRate: 18, notes: 'TARIK 9403 60 10 — Mobilie prej druri, dhome ngrenie' },

  // ── LAMPS / LIGHTING ──────────────────────────────────────────────────────
  { id: '64', keyword: 'LAMP',                 descriptionEn: 'Electric lamp / lighting fixture',         descriptionSq: 'LLAMP / NDRICUES ELEKTRIK',                     tariffCode: '9405499010', customsRate: 10, vatRate: 18, notes: 'TARIK 9405 49 90 — Pajisje ndricimi, te tjera' },
  { id: '65', keyword: 'LED LIGHT',            descriptionEn: 'LED light / LED lamp',                     descriptionSq: 'DRITEN LED',                                    tariffCode: '9405310000', customsRate: 10, vatRate: 18, notes: 'TARIK 9405 31 00 — Pajisje ndricimi LED' },

  // ── TEXTILES / HOME LINEN ─────────────────────────────────────────────────
  { id: '66', keyword: 'PILLOWCASE',           descriptionEn: 'Pillowcase / pillow cover',                descriptionSq: 'JASTKECE / MBULESE JASTEKU',                    tariffCode: '6302210000', customsRate: 10, vatRate: 18, notes: 'TARIK 6302 21 00 — Shtresa krevati prej pambuku' },
  { id: '67', keyword: 'SUMMER QUILT',         descriptionEn: 'Summer quilt / light duvet',               descriptionSq: 'JORGAN VEROR',                                  tariffCode: '9404409000', customsRate: 10, vatRate: 18, notes: 'TARIK 9404 40 90 — Jorganet dhe jelek-jorganet, te tjera' },
  { id: '68', keyword: 'QUILT',                descriptionEn: 'Duvet / quilt / comforter',                descriptionSq: 'JORGAN / PLAPUME',                               tariffCode: '9404401000', customsRate: 10, vatRate: 18, notes: 'TARIK 9404 40 10 — Jorganet mbushur me pende/push' },
  { id: '69', keyword: 'BLANKET',              descriptionEn: 'Blanket / throw',                          descriptionSq: 'BATANIE',                                       tariffCode: '6301201000', customsRate: 10, vatRate: 18, notes: 'TARIK 6301 20 10 — Batanie prej leshi, thurura' },

  // ── STATIONERY / NOTEBOOKS ────────────────────────────────────────────────
  { id: '70', keyword: 'NOTEBOOK',             descriptionEn: 'Notebook / notepad / writing book',        descriptionSq: 'BLLOK SHENIMESH / FLETORE',                     tariffCode: '4820103000', customsRate: 10, vatRate: 18, notes: 'TARIK 4820 10 30 — Librat e shenimeve, mbushjet me leter' },
  { id: '71', keyword: 'EXERCISE BOOK',        descriptionEn: 'Exercise book / school notebook',          descriptionSq: 'FLETORE SHKOLLE',                               tariffCode: '4820200000', customsRate: 10, vatRate: 18, notes: 'TARIK 4820 20 00 — Librat e ushtrimeve' },

  // ── PUMPS / TOOLS ─────────────────────────────────────────────────────────
  { id: '72', keyword: 'PUMP',                 descriptionEn: 'Pump / fluid pump',                        descriptionSq: 'POMPE / POMPE LENGJESH',                        tariffCode: '8413400000', customsRate: 10, vatRate: 18, notes: 'TARIK 8413 40 00 — Pompat per beton / te tjera' },
  { id: '73', keyword: 'AIR PUMP',             descriptionEn: 'Air pump / bicycle pump',                  descriptionSq: 'POMPE AJRI',                                    tariffCode: '8414202000', customsRate: 10, vatRate: 18, notes: 'TARIK 8414 20 20 — Pompat e dores per cicle' },

  // ── FRIDGE / RUBBER MAGNETS ───────────────────────────────────────────────
  { id: '74', keyword: 'FRIDGE MAGNET',        descriptionEn: 'Rubber / flexible fridge magnet',          descriptionSq: 'MAGNET FRIGORIFERI / GOME',                     tariffCode: '8505199000', customsRate: 10, vatRate: 18, notes: 'TARIK 8505 19 90 — Magnetet e perhershem, te tjera' },
  { id: '75', keyword: 'MAGNET',               descriptionEn: 'Permanent magnet / decorative magnet',     descriptionSq: 'MAGNET I PERHERSHEM',                           tariffCode: '8505199000', customsRate: 10, vatRate: 18, notes: 'TARIK 8505 19 90' },

  // ── COSMETICS / PERSONAL CARE ─────────────────────────────────────────────
  { id: '76', keyword: 'SHAMPOO',              descriptionEn: 'Shampoo / hair wash',                      descriptionSq: 'SHAMPO',                                        tariffCode: '3305100000', customsRate: 10, vatRate: 18, notes: 'TARIK 3305 10 00 — Shampot' },
  { id: '77', keyword: 'TOOTHPASTE',           descriptionEn: 'Toothpaste / dental paste',                descriptionSq: 'PASTE DHEMBESH',                                tariffCode: '3306100000', customsRate: 10, vatRate: 18, notes: 'TARIK 3306 10 00 — Pastat e dhembeve' },
  { id: '78', keyword: 'FACE CREAM',           descriptionEn: 'Face cream / skin cream / beauty cream',   descriptionSq: 'KREM FYTYRES / KREM LEKURE',                    tariffCode: '3304990000', customsRate: 10, vatRate: 18, notes: 'TARIK 3304 99 00 — Preparate per kujdes lekure, te tjera' },
  { id: '79', keyword: 'DEODORANT',            descriptionEn: 'Deodorant / antiperspirant',               descriptionSq: 'DEODORANT',                                     tariffCode: '3307200000', customsRate: 10, vatRate: 18, notes: 'TARIK 3307 20 00 — Deodorantet personale' },

  // ── TUBE / HOSE ───────────────────────────────────────────────────────────
  { id: '80', keyword: 'TUBE',                 descriptionEn: 'Plastic tube / pipe',                      descriptionSq: 'TUB PLASTIK',                                   tariffCode: '3917290000', customsRate: 10, vatRate: 18, notes: 'TARIK 3917 29 00 — Tuba rezine sintetike, te tjera' },

  // ── LASER / MACHINES ──────────────────────────────────────────────────────
  { id: '81', keyword: 'LASER MACHINE',        descriptionEn: 'Laser engraving / cutting machine',        descriptionSq: 'MAKINE LAZER GRAVIMI / PRERJE',                 tariffCode: '8456109000', customsRate: 10, vatRate: 18, notes: 'TARIK 8456 10 90 — Makinerite me lazer, te tjera' },
  { id: '82', keyword: 'HEATER PEN',           descriptionEn: 'Heat pen / wood burning pen',              descriptionSq: 'STILOLAPS NGROHES / PIROGRAFI',                  tariffCode: '8516800000', customsRate: 10, vatRate: 18, notes: 'TARIK 8516 80 — Rezistancat ngrohese, tjera' },

  // ── MULTILINGUAL KEYWORDS — Serbian / Croatian / Bosnian / Turkish / German ──
  // These ensure correct tariff codes even when invoice language is not English.
  // Paper hygiene products (Serbisch: T.papir, Ubrus, Salvete)
  { id: '83', keyword: 'T.PAPIR',              descriptionEn: 'Toilet paper',                             descriptionSq: 'LETER TUALETI',                                 tariffCode: '4818100000', customsRate: 10, vatRate: 18, notes: 'SR: toaletni papir' },
  { id: '84', keyword: 'TOALETNI PAPIR',       descriptionEn: 'Toilet paper',                             descriptionSq: 'LETER TUALETI',                                 tariffCode: '4818100000', customsRate: 10, vatRate: 18, notes: 'SR: toaletni papir' },
  { id: '85', keyword: 'SALVETE',              descriptionEn: 'Paper serviettes / napkins',               descriptionSq: 'PECETE LETRE',                                  tariffCode: '4818300000', customsRate: 10, vatRate: 18, notes: 'SR: salvete (papirne)' },
  { id: '86', keyword: 'UBRUS',                descriptionEn: 'Paper napkins / wipes',                    descriptionSq: 'PECETE LETRE / SHAL LETRE',                     tariffCode: '4818201000', customsRate: 10, vatRate: 18, notes: 'SR: ubrus (papirni)' },
  { id: '87', keyword: 'MARAMICE',             descriptionEn: 'Facial tissues / handkerchiefs',           descriptionSq: 'SHAMICE LETRE',                                 tariffCode: '4818201000', customsRate: 10, vatRate: 18, notes: 'SR: papirne maramice' },
  { id: '88', keyword: 'PAPIRNI UBRUS',        descriptionEn: 'Paper towels',                             descriptionSq: 'PESHQIRE LETRE',                                tariffCode: '4818209100', customsRate: 10, vatRate: 18, notes: 'SR: papirni ubrus kuhinjski' },
  // German
  { id: '89', keyword: 'TOILETTENPAPIER',      descriptionEn: 'Toilet paper',                             descriptionSq: 'LETER TUALETI',                                 tariffCode: '4818100000', customsRate: 10, vatRate: 18, notes: 'DE: Toilettenpapier' },
  { id: '90', keyword: 'KUCHENROLLE',          descriptionEn: 'Kitchen paper towels',                     descriptionSq: 'PESHQIRE LETRE KUZHINE',                        tariffCode: '4818209100', customsRate: 10, vatRate: 18, notes: 'DE: Küchenrolle' },
  { id: '91', keyword: 'SERVIETTEN',           descriptionEn: 'Paper serviettes',                         descriptionSq: 'PECETE LETRE',                                  tariffCode: '4818300000', customsRate: 10, vatRate: 18, notes: 'DE: Papierservietten' },
  // Turkish
  { id: '92', keyword: 'TUVALET KAGIDI',       descriptionEn: 'Toilet paper',                             descriptionSq: 'LETER TUALETI',                                 tariffCode: '4818100000', customsRate: 10, vatRate: 18, notes: 'TR: tuvalet kağıdı' },
  { id: '93', keyword: 'KAGIT HAVLU',          descriptionEn: 'Paper towels',                             descriptionSq: 'PESHQIRE LETRE',                                tariffCode: '4818209100', customsRate: 10, vatRate: 18, notes: 'TR: kağıt havlu' },
  // Italian
  { id: '94', keyword: 'CARTA IGIENICA',       descriptionEn: 'Toilet paper',                             descriptionSq: 'LETER TUALETI',                                 tariffCode: '4818100000', customsRate: 10, vatRate: 18, notes: 'IT: carta igienica' },
  { id: '95', keyword: 'TOVAGLIOLI',           descriptionEn: 'Paper napkins',                            descriptionSq: 'PECETE LETRE',                                  tariffCode: '4818300000', customsRate: 10, vatRate: 18, notes: 'IT: tovaglioli carta' },
  // Chinese product categories (transliterated common terms)
  { id: '96', keyword: 'PORCELAIN',            descriptionEn: 'Porcelain tableware',                      descriptionSq: 'ENE PORCELANI',                                 tariffCode: '6911100000', customsRate: 10, vatRate: 18, notes: 'Porcelain / china tableware' },
  { id: '97', keyword: 'STAINLESS STEEL',      descriptionEn: 'Stainless steel kitchenware',              descriptionSq: 'ENE KUZHINE CELIK',                             tariffCode: '7323930000', customsRate: 10, vatRate: 18, notes: 'Stainless steel kitchen items' },
  { id: '98', keyword: 'EXTENSION CORD',       descriptionEn: 'Electrical extension cord',                descriptionSq: 'ZGJATUES ELEKTRIK',                             tariffCode: '8544429000', customsRate: 10, vatRate: 18, notes: 'Extension cord / power strip cable' },
  { id: '99', keyword: 'POWER STRIP',          descriptionEn: 'Power strip / extension socket',           descriptionSq: 'PLLAKE ELEKTRIKE ME PRIZA',                     tariffCode: '8536690000', customsRate: 10, vatRate: 18, notes: 'Power strip / multi-socket' },
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

/* ── Confirmed codes store ────────────────────────────────────
 * Grows over time as users confirm codes for specific products.
 * Key: normalized description (uppercase, trimmed).
 * Once confirmed, same product description → 'confirmed' status.
 * ─────────────────────────────────────────────────────────── */
const CONFIRMED_KEY = 'dudi_confirmed_tariffs'

export interface ConfirmedEntry {
  keyword: string
  tariffCode: string
  cdRate: number
  vatRate: number
  confirmedAt: string
  confirmedBy?: string
}

export function getConfirmedTariffs(): ConfirmedEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CONFIRMED_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

export function getConfirmedCode(description: string): ConfirmedEntry | null {
  const upper = description.toUpperCase().trim()
  const confirmed = getConfirmedTariffs()
  // Exact match first
  let found = confirmed.find(e => e.keyword === upper)
  // Partial match if no exact
  if (!found) found = confirmed.find(e => upper.includes(e.keyword) || e.keyword.includes(upper))
  return found || null
}

export function saveConfirmedCode(
  description: string,
  tariffCode: string,
  cdRate: number,
  vatRate: number,
  confirmedBy?: string
): void {
  if (typeof window === 'undefined') return
  const keyword = description.toUpperCase().trim()
  const entries = getConfirmedTariffs()
  const idx     = entries.findIndex(e => e.keyword === keyword)
  const entry: ConfirmedEntry = {
    keyword, tariffCode, cdRate, vatRate,
    confirmedAt: new Date().toISOString(),
    confirmedBy,
  }
  if (idx >= 0) entries[idx] = entry
  else entries.push(entry)
  localStorage.setItem(CONFIRMED_KEY, JSON.stringify(entries))
}

export function removeConfirmedCode(description: string): void {
  if (typeof window === 'undefined') return
  const keyword = description.toUpperCase().trim()
  const entries = getConfirmedTariffs().filter(e => e.keyword !== keyword)
  localStorage.setItem(CONFIRMED_KEY, JSON.stringify(entries))
}
