const sampleListings = [
  {
    title: "The Oberoi Rajvilas Heritage Palace",
    description:
      "Indulge in royal Rajasthani grandeur set within 32 acres of lush landscaped gardens and reflecting pools. Boasting traditional Mughal arches, private plunge pools, hand-painted gold leaf murals, and opulent pavilion suites.",
    image: {
      filename: "rajvilas_palace_1",
      url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "rajvilas_palace_1",
        url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "rajvilas_palace_2",
        url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "rajvilas_palace_3",
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "rajvilas_palace_4",
        url: "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "rajvilas_palace_5",
        url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 14500,
    location: "Jaipur, Rajasthan",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [75.8752, 26.8851]
    },
    category: "Castles"
  },
  {
    title: "Taj Lake Palace Heritage Suite",
    description:
      "Floating like an exquisite white marble jewel on the serene waters of Lake Pichola, this legendary 18th-century palace features 360-degree views of the City Palace, royal butler service, and romantic candlelit courtyard dinners.",
    image: {
      filename: "taj_lake_palace_1",
      url: "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "taj_lake_palace_1",
        url: "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "taj_lake_palace_2",
        url: "https://images.unsplash.com/photo-1585128792020-803d29415281?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "taj_lake_palace_3",
        url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "taj_lake_palace_4",
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "taj_lake_palace_5",
        url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 18000,
    location: "Udaipur, Rajasthan",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [73.68, 24.5753]
    },
    category: "Iconic Cities"
  },
  {
    title: "Heritage Houseboat on Vembanad Lake",
    description:
      "Cruise peacefully through the emerald backwaters of Kerala in an authentic handcrafted wooden Kettuvallam houseboat. Equipped with spacious sun-decks, private air-conditioned bedrooms, and a dedicated personal onboard chef serving fresh coastal cuisine.",
    image: {
      filename: "kerala_houseboat_1",
      url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "kerala_houseboat_1",
        url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "kerala_houseboat_2",
        url: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "kerala_houseboat_3",
        url: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "kerala_houseboat_4",
        url: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "kerala_houseboat_5",
        url: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 7200,
    location: "Alleppey, Kerala",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [76.3388, 9.4981]
    },
    category: "Houseboats"
  },
  {
    title: "Himalayan Cedarwood Chalet",
    description:
      "A rustic pine and stone mountain chalet overlooking the snow-draped peaks of the Pir Panjal range. Features a crackling stone fireplace, panoramic glass conservatory, private wooden cedar deck, and cozy alpine attic bedrooms.",
    image: {
      filename: "manali_chalet_1",
      url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "manali_chalet_1",
        url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "manali_chalet_2",
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "manali_chalet_3",
        url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "manali_chalet_4",
        url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "manali_chalet_5",
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 6500,
    location: "Manali, Himachal Pradesh",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [77.1892, 32.2432]
    },
    category: "Mountains"
  },
  {
    title: "Sundance Luxury Beach Villa",
    description:
      "Just 200 meters from the golden sands of Candolim Beach, this private contemporary Goan Portuguese villa features an infinity-edge swimming pool, palm tree garden, breezy outdoor cabana, and stylish open-concept living quarters.",
    image: {
      filename: "goa_villa_1",
      url: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "goa_villa_1",
        url: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "goa_villa_2",
        url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "goa_villa_3",
        url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "goa_villa_4",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "goa_villa_5",
        url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 11000,
    location: "Candolim, Goa",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [73.7663, 15.5173]
    },
    category: "Amazing Pools"
  },
  {
    title: "Ganges View Heritage Haveli",
    description:
      "Perched right above the historic Dashashwamedh Ghat, this restored 200-year-old stone haveli provides front-row seats to the evening Ganga Aarti, sunrise boat excursions, carved sandstone balconies, and serene rooftop breakfast dining.",
    image: {
      filename: "varanasi_haveli_1",
      url: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "varanasi_haveli_1",
        url: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "varanasi_haveli_2",
        url: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "varanasi_haveli_3",
        url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "varanasi_haveli_4",
        url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "varanasi_haveli_5",
        url: "https://images.unsplash.com/photo-1609949279531-cf48d64bed89?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 5200,
    location: "Varanasi, Uttar Pradesh",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [83.0064, 25.3176]
    },
    category: "Iconic Cities"
  },
  {
    title: "Wildflower Cloud Forest Estate",
    description:
      "Nestled amidst emerald tea hills and spice gardens, this boutique plantation retreat in Munnar offers guided organic tea tours, birdsong sunrises, wood-floored planter cottages, and panoramic veranda views across mist-laden valleys.",
    image: {
      filename: "munnar_estate_1",
      url: "https://images.unsplash.com/photo-1591522810850-58128c5fb089?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "munnar_estate_1",
        url: "https://images.unsplash.com/photo-1591522810850-58128c5fb089?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "munnar_estate_2",
        url: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "munnar_estate_3",
        url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "munnar_estate_4",
        url: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "munnar_estate_5",
        url: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 5800,
    location: "Munnar, Kerala",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [77.0595, 10.0889]
    },
    category: "Farms"
  },
  {
    title: "Pangong Mountain Yurts & Stargazer Camp",
    description:
      "Experience high-altitude luxury glamping in the trans-Himalayan wilderness of Ladakh. Heated traditional yurts featuring insulated Tibetan wool rugs, brass stoves, unobstructed Milky Way stargazing, and jaw-dropping mountain pass panoramas.",
    image: {
      filename: "leh_yurt_1",
      url: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "leh_yurt_1",
        url: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "leh_yurt_2",
        url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "leh_yurt_3",
        url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "leh_yurt_4",
        url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "leh_yurt_5",
        url: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 8500,
    location: "Leh, Ladakh",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [77.5771, 34.1526]
    },
    category: "Yurts"
  },
  {
    title: "Ganga Forest Treehouse & Yoga Sanctuary",
    description:
      "Perched high in the green canopy above the holy Ganges river, this hand-crafted bamboo treehouse sanctuary offers open-air wooden yoga shalas, wholesome Ayurvedic vegetarian cuisine, natural plunge tubs, and soothing jungle stream sounds.",
    image: {
      filename: "rishikesh_treehouse_1",
      url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "rishikesh_treehouse_1",
        url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "rishikesh_treehouse_2",
        url: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "rishikesh_treehouse_3",
        url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "rishikesh_treehouse_4",
        url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "rishikesh_treehouse_5",
        url: "https://images.unsplash.com/photo-1507038772120-7ffe76f79d04?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 4900,
    location: "Rishikesh, Uttarakhand",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [78.2676, 30.0869]
    },
    category: "Off-the-grid"
  },
  {
    title: "Boutique French Quarter Maison",
    description:
      "Step into timeless French-colonial sophistication with sunlit mustard archways, bougainvillea-draped courtyards, vintage teak four-poster beds, and an easy 3-minute stroll to the breezy Promenade Beach.",
    image: {
      filename: "pondicherry_maison_1",
      url: "https://images.unsplash.com/photo-1582650625119-3a31f8418365?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "pondicherry_maison_1",
        url: "https://images.unsplash.com/photo-1582650625119-3a31f8418365?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "pondicherry_maison_2",
        url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "pondicherry_maison_3",
        url: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "pondicherry_maison_4",
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "pondicherry_maison_5",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 6200,
    location: "White Town, Pondicherry",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [79.8359, 11.9349]
    },
    category: "Rooms"
  },
  {
    title: "Golden Fort Desert Camp & Dunes",
    description:
      "Immerse yourself in the magic of the Thar Desert with royal Swiss luxury tents, evening camel treks into glowing sand dunes, vibrant Kalbelia folk performances around open campfires, and authentic desert feasts.",
    image: {
      filename: "jaisalmer_camp_1",
      url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "jaisalmer_camp_1",
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "jaisalmer_camp_2",
        url: "https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "jaisalmer_camp_3",
        url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "jaisalmer_camp_4",
        url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "jaisalmer_camp_5",
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 5500,
    location: "Sam Sand Dunes, Jaisalmer, Rajasthan",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [70.916, 26.9157]
    },
    category: "Camping"
  },
  {
    title: "Nilgiri Heritage Tea Bungalow",
    description:
      "A charming 19th-century British stone plantation bungalow nestled among blue gum eucalyptus groves and fragrant tea gardens. Features cozy bedroom fireplaces, English garden lawns, antique brass fittings, and afternoon high tea.",
    image: {
      filename: "ooty_bungalow_1",
      url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "ooty_bungalow_1",
        url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "ooty_bungalow_2",
        url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "ooty_bungalow_3",
        url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "ooty_bungalow_4",
        url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "ooty_bungalow_5",
        url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 6800,
    location: "Ooty, Tamil Nadu",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [76.6932, 11.4102]
    },
    category: "Mountains"
  },
  {
    title: "Boulders & Ruins Heritage Villa",
    description:
      "Crafted specifically for artists, writers, and explorers amidst the surreal giant granite boulders and historic Vijayanagara empire ruins of Hampi. Features stone-pillar verandas, hammock courtyards, and sunset views over the Tungabhadra river.",
    image: {
      filename: "hampi_villa_1",
      url: "https://images.unsplash.com/photo-1600100397608-f010e4210d19?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "hampi_villa_1",
        url: "https://images.unsplash.com/photo-1600100397608-f010e4210d19?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "hampi_villa_2",
        url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "hampi_villa_3",
        url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "hampi_villa_4",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "hampi_villa_5",
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 4800,
    location: "Hampi, Karnataka",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [76.46, 15.335]
    },
    category: "Creative spaces"
  },
  {
    title: "Royal Bengal Jungle Safari Lodge",
    description:
      "Positioned directly at the edge of Ranthambore Tiger Sanctuary, this sprawling safari lodge offers luxury 4x4 jungle jeep drives, knowledgeable wildlife naturalists, private forest plunge pools, and starlit open-air barbecues.",
    image: {
      filename: "ranthambore_lodge_1",
      url: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "ranthambore_lodge_1",
        url: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "ranthambore_lodge_2",
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "ranthambore_lodge_3",
        url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "ranthambore_lodge_4",
        url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "ranthambore_lodge_5",
        url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 13500,
    location: "Ranthambore, Rajasthan",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [76.5026, 26.0173]
    },
    category: "Mansions"
  },
  {
    title: "Tea Estate Colonial Villa",
    description:
      "Wake up to clear, uninhibited views of Mount Kanchenjunga from your sun-drenched private bay window in this century-old plantation bungalow, situated in the heart of world-renowned Darjeeling orthodox tea gardens.",
    image: {
      filename: "darjeeling_villa_1",
      url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "darjeeling_villa_1",
        url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "darjeeling_villa_2",
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "darjeeling_villa_3",
        url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "darjeeling_villa_4",
        url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "darjeeling_villa_5",
        url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 7500,
    location: "Darjeeling, West Bengal",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [88.2663, 27.041]
    },
    category: "Mountains"
  },
  {
    title: "Spice Plantation Cottage",
    description:
      "Tucked away within a 100-acre organic coffee and cardamom estate, this rustic stone cottage features private wooden decks, crystal stream walks, birdwatching trails, and piping hot home-brewed Coorg filter coffee.",
    image: {
      filename: "coorg_cottage_1",
      url: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "coorg_cottage_1",
        url: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "coorg_cottage_2",
        url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "coorg_cottage_3",
        url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "coorg_cottage_4",
        url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "coorg_cottage_5",
        url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 5600,
    location: "Coorg, Karnataka",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [75.7382, 12.4244]
    },
    category: "Farms"
  },
  {
    title: "Taj Mahal View Luxury Haven",
    description:
      "Boasting an unparalleled direct rooftop view of the magnificent Taj Mahal just 600 meters away. Features intricate Mughal marble inlays, tranquil courtyard fountains, and unforgettable sunset candlelit rooftop dinners.",
    image: {
      filename: "agra_haven_1",
      url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "agra_haven_1",
        url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "agra_haven_2",
        url: "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "agra_haven_3",
        url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "agra_haven_4",
        url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "agra_haven_5",
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 9500,
    location: "Agra, Uttar Pradesh",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [78.0421, 27.1751]
    },
    category: "Iconic Cities"
  },
  {
    title: "Living Root Bridge Eco Cabin",
    description:
      "An entirely off-grid rainforest sanctuary situated near Nohkalikai Falls and the world-famous double-decker living root bridges. Enjoy natural canyon vistas, fresh mountain streams, and sustainably crafted bamboo architecture.",
    image: {
      filename: "cherrapunji_cabin_1",
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "cherrapunji_cabin_1",
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "cherrapunji_cabin_2",
        url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "cherrapunji_cabin_3",
        url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "cherrapunji_cabin_4",
        url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "cherrapunji_cabin_5",
        url: "https://images.unsplash.com/photo-1507038772120-7ffe76f79d04?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 4200,
    location: "Cherrapunji, Meghalaya",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [91.7323, 25.2702]
    },
    category: "Off-the-grid"
  },
  {
    title: "Golden Temple Heritage Haveli",
    description:
      "Situated in the historic heart of the old city within walking distance of Sri Harmandir Sahib. Immerse in traditional Punjabi hospitality with rich Phulkari furnishings, rooftop views of the golden dome, and piping hot Amritsari kulchas.",
    image: {
      filename: "amritsar_haveli_1",
      url: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "amritsar_haveli_1",
        url: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "amritsar_haveli_2",
        url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "amritsar_haveli_3",
        url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "amritsar_haveli_4",
        url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "amritsar_haveli_5",
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 4700,
    location: "Amritsar, Punjab",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [74.8765, 31.62]
    },
    category: "Iconic Cities"
  },
  {
    title: "Old Spice Harbour Loft",
    description:
      "A repurposed Dutch-Portuguese heritage spice warehouse loft in historic Fort Kochi. Showcasing soaring exposed rafters, contemporary Kerala art, teak floorboards, and a private balcony overlooking the Arabian Sea and cantilevered Chinese fishing nets.",
    image: {
      filename: "kochi_loft_1",
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "kochi_loft_1",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "kochi_loft_2",
        url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "kochi_loft_3",
        url: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "kochi_loft_4",
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "kochi_loft_5",
        url: "https://images.unsplash.com/photo-1582650625119-3a31f8418365?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 5100,
    location: "Fort Kochi, Kerala",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [76.2425, 9.9639]
    },
    category: "Creative spaces"
  },
  {
    title: "Snowy Ridge Alpine Wood Chalet",
    description:
      "Perched high on a ridge above the Mall Road in Shimla with unobstructed vistas of pine forests and Himalayan mountain ranges. Featuring a private heated cedar jacuzzi, wood paneling, floor-to-ceiling windows, and crackling fireplaces.",
    image: {
      filename: "shimla_chalet_1",
      url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "shimla_chalet_1",
        url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "shimla_chalet_2",
        url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "shimla_chalet_3",
        url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "shimla_chalet_4",
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "shimla_chalet_5",
        url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 6900,
    location: "Shimla, Himachal Pradesh",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [77.1734, 31.1048]
    },
    category: "Mountains"
  },
  {
    title: "Ancient Cave Suite & Natural Springs",
    description:
      "Hand-carved into ancient red sandstone cliff faces overlooking Agastya Lake and centuries-old cave temples. Enjoy naturally cool subterranean rock chambers, a cliffside plunge pool, and candlelit dinners under starlit skies.",
    image: {
      filename: "badami_cave_1",
      url: "https://images.unsplash.com/photo-1600100397608-f010e4210d19?auto=format&fit=crop&w=1200&q=80"
    },
    images: [
      {
        filename: "badami_cave_1",
        url: "https://images.unsplash.com/photo-1600100397608-f010e4210d19?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "badami_cave_2",
        url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "badami_cave_3",
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "badami_cave_4",
        url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"
      },
      {
        filename: "badami_cave_5",
        url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80"
      }
    ],
    price: 5400,
    location: "Badami, Karnataka",
    country: "India",
    geometry: {
      type: "Point",
      coordinates: [75.6766, 15.9187]
    },
    category: "Caves"
  }
];

module.exports = { data: sampleListings };