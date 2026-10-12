import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.supabase import supabase

RESTAURANTS_DATA = [
    {
        "name": "Bella Italia Trattoria",
        "description": "Authentic wood-fired Neapolitan pizza, fresh handmade pasta, and classic Italian desserts.",
        "address": "42 Little Italy Way, Downtown",
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        "preparation_time_min": 20,
        "menu": [
            {
                "name": "Margherita D.O.P. Pizza",
                "description": "San Marzano tomatoes, fresh buffalo mozzarella, fragrant basil, and extra virgin olive oil.",
                "price": 14.99,
                "image_url": "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Handmade Tagliatelle al Tartufo",
                "description": "Fresh ribbon pasta tossed in creamy black truffle butter and aged Parmigiano-Reggiano.",
                "price": 18.50,
                "image_url": "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Crispy Calamari Fritti",
                "description": "Golden fried calamari rings served with house marinara and lemon garlic aioli.",
                "price": 11.00,
                "image_url": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Classic Tiramisu",
                "description": "Espresso-soaked ladyfingers, velvety mascarpone cream, and Dutch cocoa powder.",
                "price": 7.50,
                "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        "name": "Smash & Sizzle Burger Co.",
        "description": "Gourmet smashed beef burgers, golden loaded waffle fries, and decadent thick shakes.",
        "address": "108 Broadway Blvd, Westside",
        "image_url": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
        "preparation_time_min": 15,
        "menu": [
            {
                "name": "The Double Smashed Truffle Burger",
                "description": "Two crispy smashed Angus beef patties, Swiss cheese, caramelized onions, and truffle aioli on a toasted brioche.",
                "price": 13.99,
                "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Spicy Nashville Hot Chicken Sandwich",
                "description": "Buttermilk-brined fried chicken breast tossed in cayenne oil, house slaw, and pickles.",
                "price": 12.50,
                "image_url": "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Cheddar & Bacon Loaded Fries",
                "description": "Crispy skin-on fries smothered in melted aged cheddar, smoked bacon bits, and scallions.",
                "price": 6.99,
                "image_url": "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Salted Caramel Shake",
                "description": "Creamy hand-spun vanilla bean ice cream blended with sea salt caramel and crushed pretzels.",
                "price": 5.99,
                "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        "name": "Sakura Japanese Ramen & Sushi",
        "description": "Rich 16-hour tonkotsu broth ramen, fresh nigiri, and artistic specialty maki rolls.",
        "address": "77 Sakura Ave, Midtown",
        "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
        "preparation_time_min": 25,
        "menu": [
            {
                "name": "Signature Black Garlic Tonkotsu Ramen",
                "description": "Rich pork bone broth, tender chashu pork belly, ajitsuke tamago, wood ear mushrooms, and fragrant black garlic oil.",
                "price": 16.50,
                "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Spicy Salmon Dragon Roll",
                "description": "Fresh spicy Scottish salmon, cucumber, topped with avocado slices, unagi glaze, and tobiko.",
                "price": 14.99,
                "image_url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Pan-Seared Pork Gyoza",
                "description": "Six crispy handmade dumplings stuffed with minced pork, ginger, cabbage, and soy scallion dip.",
                "price": 7.99,
                "image_url": "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Matcha Green Tea Crepe Cake",
                "description": "Delicate layers of handmade crepes and Japanese Uji matcha cream.",
                "price": 6.50,
                "image_url": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        "name": "Tacos El Fuego",
        "description": "Vibrant street-style tacos, flame-grilled carne asada, fresh guacamole, and ice-cold jarritos.",
        "address": "210 Mission St, Southside",
        "image_url": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80",
        "preparation_time_min": 15,
        "menu": [
            {
                "name": "Birria Tacos with Consomé (Trio)",
                "description": "Slow-braised beef chuck folded in corn tortillas with Oaxaca cheese, cilantro, and savory dipping consomé.",
                "price": 13.50,
                "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Al Pastor Taco Platter",
                "description": "Marinated spit-roasted pork with roasted pineapple, chopped onion, cilantro, and salsa verde.",
                "price": 12.00,
                "image_url": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Fresh Table-Side Guacamole & Chips",
                "description": "Hass avocados mashed with lime, jalapeño, tomato, red onion, and warm stone-ground tortilla chips.",
                "price": 8.50,
                "image_url": "https://images.unsplash.com/photo-1541256942802-7b299b48368f?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Cinnamon Sugar Churros with Dulce de Leche",
                "description": "Freshly fried Mexican churros dusted in canela sugar served with warm caramel dip.",
                "price": 5.99,
                "image_url": "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        "name": "Spice Route Indian Kitchen",
        "description": "Rich aromatic curries, clay-oven tandoori specialties, and freshly baked buttery garlic naan.",
        "address": "315 Heritage Rd, Uptown",
        "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
        "preparation_time_min": 25,
        "menu": [
            {
                "name": "Murgh Makhani (Butter Chicken)",
                "description": "Tender chicken tikka simmered in a silky tomato, cashew, and fenugreek butter sauce.",
                "price": 15.99,
                "image_url": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Paneer Tikka Masala",
                "description": "Char-grilled cottage cheese cubes cooked in a rich, spiced bell pepper and onion gravy.",
                "price": 14.50,
                "image_url": "https://images.unsplash.com/photo-1567184109191-37764e7fadd9?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Garlic & Herb Butter Naan",
                "description": "Fresh leavened flatbread baked in the tandoor, brushed with garlic butter and fresh coriander.",
                "price": 3.99,
                "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Royal Lamb Dum Biryani",
                "description": "Fragrant basmati rice layered with spiced marinated lamb, saffron, caramelized onions, and mint raita.",
                "price": 17.99,
                "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        "name": "Green Garden Health & Bowls",
        "description": "Nourishing grain bowls, crisp organic salads, fresh cold-pressed juices, and gluten-free treats.",
        "address": "15 Eco Park Walk, Green District",
        "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
        "preparation_time_min": 12,
        "menu": [
            {
                "name": "Mediterranean Quinoa Bowl",
                "description": "Organic tri-color quinoa, roasted chickpeas, cherry tomatoes, kalamata olives, cucumber, feta, and tahini lemon dressing.",
                "price": 12.99,
                "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Wild Salmon Poke Bowl",
                "description": "Fresh diced Atlantic salmon, sushi rice, edamame, sliced avocado, pickled ginger, seaweed salad, and ponzu drizzle.",
                "price": 16.50,
                "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
            },
            {
                "name": "Green Glow Cold-Pressed Juice",
                "description": "Organic celery, green apple, cucumber, kale, lemon, and fresh ginger.",
                "price": 6.50,
                "image_url": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80"
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
