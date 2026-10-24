export const MOCK_RESTAURANTS = [
  {
    id: "punjab-grill",
    name: "Punjab Grill & Rasoi",
    description: "Authentic North Indian curries, 16-hour charcoal dal makhani, and tandoori stuffed kulchas.",
    address: "14 Connaught Place, Central Ring",
    image_url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
    preparation_time_min: 20,
    cuisine: "North Indian",
    rating: 4.9,
    reviews: 1840,
    distance_km: 3.2,
    menu: [
      {
        id: "pg-1",
        name: "Butter Chicken Murgh Makhani",
        description: "Charcoal-grilled tandoori chicken simmered in rich, velvety tomato, butter, and cashew gravy.",
        price: 360,
        image_url: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "pg-2",
        name: "Slow-Cooked Dal Makhani",
        description: "Black lentils slow-cooked overnight with churned white butter, cream, and aromatic spices.",
        price: 280,
        image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "pg-3",
        name: "Amritsari Paneer Kulcha & Chole",
        description: "Crispy layered tandoor bread stuffed with spiced cottage cheese, served with tangy Punjabi chole.",
        price: 190,
        image_url: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "pg-4",
        name: "Garlic Butter Naan (2 pcs)",
        description: "Freshly slapped tandoor naan topped with minced roasted garlic and fresh coriander.",
        price: 70,
        image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: "hyderabadi-dastarkhwan",
    name: "Hyderabadi Dastarkhwan",
    description: "Royal kachchi dum biryanis layered with aged basmati, saffron, mirchi ka salan, and kebabs.",
    address: "88 Banjara Hills, Rd No 12",
    image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    preparation_time_min: 18,
    cuisine: "Biryani",
    rating: 4.9,
    reviews: 3420,
    distance_km: 4.5,
    menu: [
      {
        id: "hd-1",
        name: "Royal Mutton Dum Biryani",
        description: "Tender goat meat marinated in spices and yogurt, sealed in handi and cooked on slow charcoal dum.",
        price: 399,
        image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "hd-2",
        name: "Special Chicken Dum Biryani",
        description: "Fragrant long-grain basmati with succulent spiced chicken, served with mirchi ka salan & burani raita.",
        price: 299,
        image_url: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "hd-3",
        name: "Crispy Andhra Chicken 65",
        description: "Deep fried boneless chicken tossed with curry leaves, crushed black pepper, and spicy red chillies.",
        price: 240,
        image_url: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "hd-4",
        name: "Shahi Tukda with Rabdi",
        description: "Crispy ghee-fried bread triangles soaked in saffron syrup and topped with thick pistachio rabdi.",
        price: 140,
        image_url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: "dakshin-tiffin",
    name: "Dakshin Tiffin House",
    description: "Authentic South Indian vegetarian breakfast, crispy ghee dosas, steamed idlis, and filter kaapi.",
    address: "45 Indiranagar 100ft Road",
    image_url: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=800&q=80",
    preparation_time_min: 12,
    cuisine: "South Indian",
    rating: 4.8,
    reviews: 2150,
    distance_km: 2.1,
    menu: [
      {
        id: "dt-1",
        name: "Mysore Ghee Roast Masala Dosa",
        description: "Crisp red rice batter smeared with spicy garlic-red chilli chutney, filled with potato bhaji.",
        price: 160,
        image_url: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "dt-2",
        name: "Ghee Podi Thatte Idli (2 pcs)",
        description: "Soft fluffy steamed idlis drenched in pure desi ghee and Gunpowder (karam podi).",
        price: 120,
        image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "dt-3",
        name: "Crispy Medu Vada with Sambhar (2 pcs)",
        description: "Golden crispy lentil donuts served with piping hot drumstick sambhar and fresh coconut chutney.",
        price: 90,
        image_url: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "dt-4",
        name: "Kumbakonam Degree Filter Kaapi",
        description: "Freshly brewed chicory blend filter coffee frothed in traditional brass dabarah.",
        price: 50,
        image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: "chowpatty-chaat",
    name: "Chowpatty Street Chaat Co.",
    description: "Famous Mumbai street food, extra buttery pav bhaji, zesty pani puri, and loaded sev dahi puri.",
    address: "22 Marine Drive Promenade",
    image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    preparation_time_min: 10,
    cuisine: "Chaat",
    rating: 4.9,
    reviews: 1420,
    distance_km: 1.8,
    menu: [
      {
        id: "cc-1",
        name: "Special Butter Pav Bhaji",
        description: "Spiced mashed mixed vegetable bhaji topped with a generous cube of Amul butter, served with 2 toasted pavs.",
        price: 160,
        image_url: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "cc-2",
        name: "Delhi Style Dahi Papdi Chaat",
        description: "Crispy flour wafers, boiled potatoes, sweet yogurt, tangy tamarind chutney, and roasted cumin.",
        price: 110,
        image_url: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "cc-3",
        name: "Golkappe / Pani Puri Platter (8 pcs)",
        description: "Crisp hollow puris stuffed with spiced chickpea-potato and served with chilled spicy mint and sweet saunth water.",
        price: 80,
        image_url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: "dilli-tandoor",
    name: "Dilli 6 Kebabs & Tandoor",
    description: "Old Delhi style charcoal kebabs, buttery rumali rotis, and rich Mughlai delicacies.",
    address: "7 Jama Masjid Gate 1, Old Quarter",
    image_url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    preparation_time_min: 16,
    cuisine: "Mughlai",
    rating: 4.9,
    reviews: 1890,
    distance_km: 3.8,
    menu: [
      {
        id: "d6-1",
        name: "Melt-in-Mouth Galouti Kebabs",
        description: "Finely minced smoked meat patties infused with 32 royal spices, served on mini Mughlai parathas.",
        price: 320,
        image_url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "d6-2",
        name: "Paneer Tikka Angara",
        description: "Spiced yogurt-marinated cottage cheese cubes chargrilled on skewers with capsicum and onions.",
        price: 260,
        image_url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "d6-3",
        name: "Bhatti Da Tandoori Murgh (Full)",
        description: "Whole spring chicken marinated in mustard oil, Kashmiri mirch, and roasted spices, crisped in tandoor.",
        price: 420,
        image_url: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: "bikaneri-mithai",
    name: "Bikaneri Sweet & Snacks",
    description: "Garma-garam jalebi rabdi, royal kesar rasmalai, authentic pyaaz kachoris, and festive mithai boxes.",
    address: "102 Station Road, Bapu Bazaar",
    image_url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    preparation_time_min: 10,
    cuisine: "Mithai",
    rating: 4.9,
    reviews: 2450,
    distance_km: 2.4,
    menu: [
      {
        id: "bm-1",
        name: "Garma Garam Jalebi with Rabdi (250g)",
        description: "Crispy spiral jalebis soaked in saffron sugar syrup, served with chilled condensed milk rabdi.",
        price: 150,
        image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "bm-2",
        name: "Royal Kesar Rasmalai (2 pcs)",
        description: "Soft spongy cottage cheese discs steeped in thickened cardamom and saffron milk, garnished with almonds.",
        price: 120,
        image_url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "bm-3",
        name: "Jodhpur Pyaaz Ki Kachori (2 pcs)",
        description: "Flaky golden fried pastry stuffed with roasted spiced onions, served with saunth and mint chutney.",
        price: 70,
        image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"
      }
    ]
  }
];
