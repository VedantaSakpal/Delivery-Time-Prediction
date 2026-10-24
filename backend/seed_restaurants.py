import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.supabase import supabase

RESTAURANTS_DATA = [
    {
        "name": "Punjab Grill & Rasoi",
        "description": "Slow-simmered rich dal makhani, authentic butter chicken, Amritsari kulche, and piping hot garlic naans straight from the clay tandoor.",
        "address": "Shop 14, Linking Road, Bandra West, Mumbai",
        "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
        "preparation_time_min": 22,
        "menu": [
            {
                "name": "Murgh Makhani (Butter Chicken)",
                "description": "Succulent tandoor-smoked chicken simmered in rich velvety tomato, butter, and cashew gravy.",
                "price": 360,
                "image_url": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Dal Makhani Rasoi Khas",
                "description": "Slow-cooked black lentils simmered overnight for 16 hours with cream and desi white butter.",
                "price": 280,
                "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Amritsari Chur Chur Kulcha",
                "description": "Flaky layered flatbread stuffed with spiced potatoes and paneer, served with chole and imli pyaz.",
                "price": 190,
                "image_url": "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Garlic Butter Naan (2 pcs)",
                "description": "Clay oven flatbread generously brushed with garlic butter and fresh coriander.",
                "price": 70,
                "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        "name": "Hyderabadi Dastarkhwan",
        "description": "Kachhe Gosht ki authentic Dum Biryani, double ka meetha, and royal Nizami handi specialties made with pure saffron and ghee.",
        "address": "Plot 88, Banjara Hills Road No. 12, Hyderabad",
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
        "preparation_time_min": 25,
        "menu": [
            {
                "name": "Shahi Mutton Dum Biryani",
                "description": "Prime cuts of tender lamb slow-cooked on dum with aged long-grain basmati, saffron, and fried onions.",
                "price": 399,
                "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Hyderabadi Chicken Dum Biryani",
                "description": "Aromatic basmati rice sealed in earthen handi with marinated country chicken and rich potli masala.",
                "price": 299,
                "image_url": "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Chicken 65 Hyderabadi Style",
                "description": "Crispy tempered chicken bites tossed with fresh curry leaves, crushed pepper, and green chilies.",
                "price": 240,
                "image_url": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Shahi Tukda (Double Ka Meetha)",
                "description": "Crisp ghee-fried bread triangles soaked in rich rabdi flavored with cardamom, saffron, and pistachios.",
                "price": 140,
                "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        "name": "Dakshin Tiffin House",
        "description": "Crispy golden Mysore Masala Dosas, melt-in-the-mouth Thatte Idlis, fragrant filter kaapi, and fresh coconut chutneys.",
        "address": "45 100 Feet Road, Indiranagar, Bengaluru",
        "image_url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=800&q=80",
        "preparation_time_min": 15,
        "menu": [
            {
                "name": "Mysore Ghee Roast Dosa",
                "description": "Golden crispy fermented crepe smeared with spicy red chili-garlic chutney and pure desi ghee.",
                "price": 160,
                "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Podi Thatte Idli (2 Pcs)",
                "description": "Large pillowy soft steamed rice cakes smothered in fiery gun powder podi and hot melted ghee.",
                "price": 120,
                "image_url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Medu Vada Sambhar Combo",
                "description": "Crispy outside, fluffy inside black gram fritters served with hot drumstick sambhar and coconut chutney.",
                "price": 90,
                "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Madras Degree Filter Kaapi",
                "description": "Frothy, strong chicory-blended south Indian coffee brewed in traditional brass filters.",
                "price": 50,
                "image_url": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        "name": "Chowpatty Street Chaat Co.",
        "description": "Iconic Mumbai street flavors, butter-toasted ladi pav with spicy bhaji, crisp puris, tangy tamarind chutney, and roasted sev.",
        "address": "Near Juhu Beach Promenade, Vile Parle, Mumbai",
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
        "preparation_time_min": 14,
        "menu": [
            {
                "name": "Special Amul Butter Pav Bhaji",
                "description": "Mashed spiced vegetable bhaji simmered with generous Amul butter, served with 2 hot butter-toasted pavs.",
                "price": 160,
                "image_url": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Dahi Papdi Chaat",
                "description": "Crisp flour crisps loaded with boiled potatoes, chilled sweet curd, tangy saunth, and crunchy sev.",
                "price": 110,
                "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Kolkata Puchka / Pani Puri (8 pcs)",
                "description": "Semolina hollow puris filled with spicy kala chana potato filling and spiked pudina teekha pani.",
                "price": 80,
                "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        "name": "Dilli 6 Kebabs & Tandoor",
        "description": "Purani Dilli's legendary charcoal grilled galouti kebabs, succulent bhatti chicken, and smoky paneer tikkas.",
        "address": "Chandni Chowk Road, Old Delhi, Delhi",
        "image_url": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
        "preparation_time_min": 24,
        "menu": [
            {
                "name": "Melt-in-Mouth Galouti Kebabs (4 pcs)",
                "description": "Finely minced smoked lamb patties prepared with 32 secret spices, served on mini ulte tawe ke parathe.",
                "price": 320,
                "image_url": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Tandoori Bhatti Murgh (Half)",
                "description": "Whole spring chicken marinated in roasted mustard oil and Kashmiri degi mirch, charred over charcoal.",
                "price": 420,
                "image_url": "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Bhatti Paneer Tikka Shashlik",
                "description": "Chunky cottage cheese cubes and bell peppers cured in ajwain hung curd, skewered over coal coals.",
                "price": 260,
                "image_url": "https://images.unsplash.com/photo-1567184109191-37764e7fadd9?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        "name": "Bikaneri Sweets & Snacks",
        "description": "Heritage Rajasthani mithai, piping hot jalebis with thick rabdi, kesar rasmalai, and crunchy pyaaz kachoris.",
        "address": "Station Road, Sadar Bazar, Jaipur",
        "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
        "preparation_time_min": 10,
        "menu": [
            {
                "name": "Garam Jalebi with Shahi Rabdi (250g)",
                "description": "Crispy golden spirals soaked in saffron syrup, served alongside chilled malai rabdi.",
                "price": 150,
                "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Kesar Rasmalai (2 pcs)",
                "description": "Soft cottage cheese dumplings soaked in condensed saffron milk garnished with slivered pistachios.",
                "price": 120,
                "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Jodhpur Pyaaz Kachori (2 pcs)",
                "description": "Crisp flaky fried pastry filled with spiced onion and hing filling, served with saunth and teekha chutney.",
                "price": 70,
                "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"
            }
        ]
    }
]

def seed():
    # Fetch profiles to assign owners if possible
    profiles = supabase.table("profiles").select("id, role, email").execute().data
    default_owner = profiles[0]["id"] if profiles else None

    # Check existing restaurants to avoid duplicates
    existing_resp = supabase.table("restaurants").select("id, name").execute()
    existing_map = {r["name"]: r["id"] for r in (existing_resp.data or [])}

    print(f"Found {len(existing_map)} existing restaurants: {list(existing_map.keys())}")

    for rest in RESTAURANTS_DATA:
        menu = rest.pop("menu", [])
        name = rest["name"]

        if name in existing_map:
            print(f"Updating existing restaurant '{name}'...")
            rest_id = existing_map[name]
            supabase.table("restaurants").update(rest).eq("id", rest_id).execute()
        else:
            print(f"Inserting new restaurant '{name}'...")
            rest["owner_id"] = default_owner
            insert_res = supabase.table("restaurants").insert(rest).execute()
            if not insert_res.data:
                print(f"Failed to insert {name}")
                continue
            rest_id = insert_res.data[0]["id"]

        # Check existing menu items for this restaurant
        existing_items = supabase.table("menu_items").select("name").eq("restaurant_id", rest_id).execute().data or []
        existing_item_names = {item["name"] for item in existing_items}

        new_items = []
        for item in menu:
            if item["name"] not in existing_item_names:
                item["restaurant_id"] = rest_id
                item["is_available"] = True
                new_items.append(item)

        if new_items:
            print(f"  Adding {len(new_items)} menu items to '{name}'...")
            supabase.table("menu_items").insert(new_items).execute()
        else:
            print(f"  Menu items already up-to-date for '{name}'.")

    print("\nRestaurant seeding completed successfully!")

if __name__ == "__main__":
    seed()
