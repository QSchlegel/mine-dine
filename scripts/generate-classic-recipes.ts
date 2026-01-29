#!/usr/bin/env tsx
/**
 * Generate a starter library of 100 classic recipe markdown files
 * saved under obsidian-vault/recipes.
 *
 * Run: npm run generate:recipes
 */
import fs from 'fs/promises'
import path from 'path'

const recipes: Array<{ title: string; cuisine: string; blurb: string }> = [
  { title: 'Spaghetti Carbonara', cuisine: 'Italian', blurb: 'Creamy egg sauce with guanciale and pecorino.' },
  { title: 'Margherita Pizza', cuisine: 'Italian', blurb: 'San Marzano tomatoes, mozzarella, basil.' },
  { title: 'Lasagna Bolognese', cuisine: 'Italian', blurb: 'Layered pasta with ragù and béchamel.' },
  { title: 'Risotto alla Milanese', cuisine: 'Italian', blurb: 'Saffron-infused creamy rice.' },
  { title: 'Osso Buco', cuisine: 'Italian', blurb: 'Braised veal shanks with gremolata.' },
  { title: 'Pesto Genovese', cuisine: 'Italian', blurb: 'Basil, pine nuts, Parmigiano, olive oil.' },
  { title: 'Chicken Parmigiana', cuisine: 'Italian-American', blurb: 'Breaded chicken cutlets with marinara and mozzarella.' },
  { title: 'Fettuccine Alfredo', cuisine: 'Italian-American', blurb: 'Butter and Parmigiano emulsified into silk.' },
  { title: 'Beef Bourguignon', cuisine: 'French', blurb: 'Red wine braised beef with mushrooms and lardons.' },
  { title: 'Coq au Vin', cuisine: 'French', blurb: 'Chicken braised in red wine with pearl onions.' },
  { title: 'Ratatouille', cuisine: 'French', blurb: 'Provencal stewed vegetables with herbs de Provence.' },
  { title: 'Niçoise Salad', cuisine: 'French', blurb: 'Tuna, olives, green beans, egg, vinaigrette.' },
  { title: 'Croque Monsieur', cuisine: 'French', blurb: 'Ham and Gruyère sandwich with béchamel.' },
  { title: 'French Onion Soup', cuisine: 'French', blurb: 'Caramelized onions, beef broth, Gruyère lid.' },
  { title: 'Cassoulet', cuisine: 'French', blurb: 'Slow-baked white beans with confit and sausage.' },
  { title: 'Quiche Lorraine', cuisine: 'French', blurb: 'Savory custard with lardons and Gruyère.' },
  { title: 'Steak Frites', cuisine: 'French', blurb: 'Seared steak with crisp fries and Béarnaise.' },
  { title: 'Confit de Canard', cuisine: 'French', blurb: 'Duck legs slow-cooked in their own fat.' },
  { title: 'Bouillabaisse', cuisine: 'French', blurb: 'Marseille fish stew with saffron and rouille.' },
  { title: 'Tacos al Pastor', cuisine: 'Mexican', blurb: 'Marinated pork with pineapple and cilantro.' },
  { title: 'Carnitas', cuisine: 'Mexican', blurb: 'Slow-cooked pork crisped in its own fat.' },
  { title: 'Mole Poblano', cuisine: 'Mexican', blurb: 'Chili-chocolate sauce over chicken.' },
  { title: 'Chiles en Nogada', cuisine: 'Mexican', blurb: 'Poblano chiles stuffed, walnut sauce, pomegranate.' },
  { title: 'Pozole Rojo', cuisine: 'Mexican', blurb: 'Hominy stew with pork and guajillo chiles.' },
  { title: 'Enchiladas Verdes', cuisine: 'Mexican', blurb: 'Tomatillo salsa rolled tortillas.' },
  { title: 'Guacamole', cuisine: 'Mexican', blurb: 'Avocado, lime, onion, cilantro classic dip.' },
  { title: 'Ceviche', cuisine: 'Peruvian', blurb: 'Citrus-cured fish with red onion and chili.' },
  { title: 'Lomo Saltado', cuisine: 'Peruvian', blurb: 'Stir-fried beef with fries and soy-jus.' },
  { title: 'Aji de Gallina', cuisine: 'Peruvian', blurb: 'Shredded chicken in creamy chili sauce.' },
  { title: 'Sushi Rice & Nigiri', cuisine: 'Japanese', blurb: 'Seasoned rice topped with fresh fish.' },
  { title: 'Chicken Katsu', cuisine: 'Japanese', blurb: 'Crisp panko-fried cutlet with tonkatsu sauce.' },
  { title: 'Karaage', cuisine: 'Japanese', blurb: 'Soy-ginger marinated fried chicken bites.' },
  { title: 'Tempura', cuisine: 'Japanese', blurb: 'Light batter-fried seafood and vegetables.' },
  { title: 'Ramen Shoyu', cuisine: 'Japanese', blurb: 'Soy-based broth with noodles and chashu.' },
  { title: 'Miso Soup', cuisine: 'Japanese', blurb: 'Dashi, miso paste, tofu, wakame.' },
  { title: 'Okonomiyaki', cuisine: 'Japanese', blurb: 'Savory cabbage pancake with toppings.' },
  { title: 'Teriyaki Salmon', cuisine: 'Japanese', blurb: 'Glazed salmon with soy-mirin sauce.' },
  { title: 'Pad Thai', cuisine: 'Thai', blurb: 'Rice noodles with tamarind, shrimp, peanuts.' },
  { title: 'Green Curry', cuisine: 'Thai', blurb: 'Coconut curry with Thai basil and eggplant.' },
  { title: 'Tom Yum Goong', cuisine: 'Thai', blurb: 'Hot-sour soup with shrimp and lemongrass.' },
  { title: 'Massaman Curry', cuisine: 'Thai', blurb: 'Warm spices, potato, peanuts, slow-braised meat.' },
  { title: 'Som Tum', cuisine: 'Thai', blurb: 'Green papaya salad with chili-lime punch.' },
  { title: 'Khao Pad', cuisine: 'Thai', blurb: 'Thai fried rice with egg and aromatics.' },
  { title: 'Pho Bo', cuisine: 'Vietnamese', blurb: 'Beef noodle soup with spices and herbs.' },
  { title: 'Banh Mi', cuisine: 'Vietnamese', blurb: 'Crisp baguette with pickles, pâté, herbs.' },
  { title: 'Bun Cha', cuisine: 'Vietnamese', blurb: 'Grilled pork with noodles and dipping sauce.' },
  { title: 'Goi Cuon', cuisine: 'Vietnamese', blurb: 'Fresh spring rolls with shrimp and herbs.' },
  { title: 'General Tso’s Chicken', cuisine: 'Chinese-American', blurb: 'Crispy sweet-spicy glazed chicken.' },
  { title: 'Mapo Tofu', cuisine: 'Sichuan', blurb: 'Silky tofu in chili-bean sauce with numbing spice.' },
  { title: 'Kung Pao Chicken', cuisine: 'Sichuan', blurb: 'Stir-fried chicken with peanuts and chilies.' },
  { title: 'Dumplings (Jiaozi)', cuisine: 'Chinese', blurb: 'Pork and cabbage filled wrappers.' },
  { title: 'Congee', cuisine: 'Chinese', blurb: 'Comforting rice porridge with toppings.' },
  { title: 'Hainanese Chicken Rice', cuisine: 'Singaporean', blurb: 'Poached chicken with aromatic rice and sauces.' },
  { title: 'Laksa', cuisine: 'Malaysian', blurb: 'Spicy coconut noodle soup.' },
  { title: 'Beef Rendang', cuisine: 'Indonesian', blurb: 'Slow-cooked coconut beef curry.' },
  { title: 'Satay with Peanut Sauce', cuisine: 'Indonesian/Malay', blurb: 'Grilled skewers with rich peanut dip.' },
  { title: 'Butter Chicken', cuisine: 'Indian', blurb: 'Tomato-butter gravy with tender chicken.' },
  { title: 'Chicken Tikka Masala', cuisine: 'Indian-British', blurb: 'Charred chicken in creamy spiced sauce.' },
  { title: 'Rogan Josh', cuisine: 'Indian', blurb: 'Kashmiri lamb curry with warm spices.' },
  { title: 'Palak Paneer', cuisine: 'Indian', blurb: 'Spinach gravy with paneer cubes.' },
  { title: 'Chana Masala', cuisine: 'Indian', blurb: 'Spiced chickpea stew.' },
  { title: 'Dal Tadka', cuisine: 'Indian', blurb: 'Yellow lentils with ghee tempering.' },
  { title: 'Biryani (Hyderabadi)', cuisine: 'Indian', blurb: 'Layered spiced rice with meat or veg.' },
  { title: 'Naan', cuisine: 'Indian', blurb: 'Tandoor-baked flatbread brushed with ghee.' },
  { title: 'Shakshuka', cuisine: 'Middle Eastern', blurb: 'Poached eggs in spicy tomato pepper sauce.' },
  { title: 'Hummus & Pita', cuisine: 'Middle Eastern', blurb: 'Chickpea dip with tahini and lemon.' },
  { title: 'Falafel', cuisine: 'Middle Eastern', blurb: 'Crisp chickpea fritters with herbs.' },
  { title: 'Tabbouleh', cuisine: 'Levantine', blurb: 'Parsley-bulgur salad with lemon.' },
  { title: 'Kebab Kofta', cuisine: 'Middle Eastern', blurb: 'Spiced ground meat skewers.' },
  { title: 'Greek Moussaka', cuisine: 'Greek', blurb: 'Layered eggplant, meat sauce, béchamel.' },
  { title: 'Greek Salad', cuisine: 'Greek', blurb: 'Tomato, cucumber, feta, olives, oregano.' },
  { title: 'Spanakopita', cuisine: 'Greek', blurb: 'Phyllo pie with spinach and feta.' },
  { title: 'Paella Valenciana', cuisine: 'Spanish', blurb: 'Saffron rice with chicken, rabbit, beans.' },
  { title: 'Tortilla Española', cuisine: 'Spanish', blurb: 'Potato and onion omelet.' },
  { title: 'Gazpacho', cuisine: 'Spanish', blurb: 'Chilled tomato-cucumber soup.' },
  { title: 'Cevapcici', cuisine: 'Balkan', blurb: 'Grilled minced meat sausages.' },
  { title: 'Goulash', cuisine: 'Hungarian', blurb: 'Paprika beef stew with peppers.' },
  { title: 'Wiener Schnitzel', cuisine: 'Austrian', blurb: 'Breaded veal cutlet with lemon.' },
  { title: 'Bratwurst with Sauerkraut', cuisine: 'German', blurb: 'Grilled sausages and tangy cabbage.' },
  { title: 'Fish and Chips', cuisine: 'British', blurb: 'Crisp fried fish with malt vinegar.' },
  { title: 'Shepherd’s Pie', cuisine: 'British', blurb: 'Lamb ragù topped with mashed potatoes.' },
  { title: 'Beef Wellington', cuisine: 'British', blurb: 'Beef tenderloin wrapped in pastry.' },
  { title: 'Clam Chowder', cuisine: 'New England', blurb: 'Creamy soup with clams and potatoes.' },
  { title: 'Jambalaya', cuisine: 'Cajun', blurb: 'Rice with sausage, chicken, shrimp, spice.' },
  { title: 'Gumbo', cuisine: 'Creole', blurb: 'Stew with roux, okra, and seafood or meat.' },
  { title: 'Mac and Cheese', cuisine: 'American', blurb: 'Baked pasta in cheddar sauce.' },
  { title: 'BBQ Ribs', cuisine: 'American', blurb: 'Slow-cooked pork ribs with smoky glaze.' },
  { title: 'Fried Chicken', cuisine: 'American South', blurb: 'Buttermilk brined, crunchy crust.' },
  { title: 'Caesar Salad', cuisine: 'American-Italian', blurb: 'Romaine, anchovy dressing, croutons.' },
  { title: 'Chili con Carne', cuisine: 'Tex-Mex', blurb: 'Beef and bean chili with spices.' },
  { title: 'Poke Bowl', cuisine: 'Hawaiian', blurb: 'Marinated raw fish over rice with toppings.' },
  { title: 'Shoyu Poke', cuisine: 'Hawaiian', blurb: 'Soy-marinated ahi with onions.' },
  { title: 'Cottage Pie', cuisine: 'British', blurb: 'Beef version of shepherd’s pie.' },
  { title: 'Pancakes (Buttermilk)', cuisine: 'American', blurb: 'Fluffy griddled breakfast classic.' },
  { title: 'Apple Pie', cuisine: 'American', blurb: 'Spiced apple filling in buttery crust.' },
  { title: 'Chocolate Chip Cookies', cuisine: 'American', blurb: 'Chewy cookies with chocolate chunks.' },
  { title: 'Banana Bread', cuisine: 'American', blurb: 'Moist loaf with ripe bananas.' },
  { title: 'Tiramisu', cuisine: 'Italian', blurb: 'Espresso-soaked ladyfingers, mascarpone cream.' },
  { title: 'Crème Brûlée', cuisine: 'French', blurb: 'Baked custard with caramelized sugar lid.' },
  { title: 'Pavlova', cuisine: 'Australian/NZ', blurb: 'Meringue shell with cream and fruit.' },
  { title: 'Cheesecake New York', cuisine: 'American', blurb: 'Dense baked cream cheese cake.' },
  { title: 'Baklava', cuisine: 'Turkish/Greek', blurb: 'Phyllo, nuts, honey syrup layers.' },
  { title: 'Churros with Chocolate', cuisine: 'Spanish', blurb: 'Fried dough sticks with hot chocolate.' },
  { title: 'Crêpes Suzette', cuisine: 'French', blurb: 'Orange butter sauce flambéed crêpes.' },
  { title: 'Key Lime Pie', cuisine: 'American', blurb: 'Tart lime custard in graham crust.' },
  { title: 'Panna Cotta', cuisine: 'Italian', blurb: 'Silky set cream dessert.' },
]

// Ensure exactly 100 entries (for visibility if trimmed/extended later)
if (recipes.length !== 100) {
  console.warn(`Recipe list currently ${recipes.length} items (expected 100).`)
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

function buildMarkdown(entry: { title: string; cuisine: string; blurb: string }) {
  const ingredients = [
    `- Main ingredient for ${entry.title}`,
    '- Aromatics (onion/garlic) to taste',
    '- Supporting veg or starch',
    '- Fat (olive oil/butter)',
    '- Salt, pepper, signature herbs/spices',
  ].join('\n')

  const steps = [
    '1. Prep ingredients: chop aromatics, portion proteins, measure spices.',
    '2. Cook aromatics in fat, build sauce or base, add mains and simmer/roast until done.',
    '3. Finish with acid/fresh herbs; taste and adjust seasoning. Serve hot.',
  ].join('\n')

  return `---\ntitle: "${entry.title.replace(/"/g, '\\"')}"\ncuisine: ${entry.cuisine}\ntags: ["classic", "${entry.cuisine.toLowerCase()}"]\n---\n\n${entry.blurb}\n\n## Ingredients\n${ingredients}\n\n## Steps\n${steps}\n`
}

async function main() {
  const outDir = path.join(process.cwd(), 'obsidian-vault', 'recipes')
  await fs.mkdir(outDir, { recursive: true })

  for (const entry of recipes) {
    const filename = `${slugify(entry.title)}.md`
    const markdown = buildMarkdown(entry)
    await fs.writeFile(path.join(outDir, filename), markdown, 'utf8')
  }

  await fs.writeFile(
    path.join(outDir, 'index.json'),
    JSON.stringify(recipes, null, 2),
    'utf8'
  )

  console.log(`Generated ${recipes.length} recipe stubs in ${outDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
