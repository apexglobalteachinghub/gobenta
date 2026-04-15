-- Category tree for Philippines marketplace. Safe to re-run.
-- Requires schema.sql. Does not insert users/listings (use the app).

create or replace function public._seed_category (p_name text, p_icon text, p_parent uuid)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.categories
  where name = p_name
    and (parent_id is not distinct from p_parent);

  if v_id is not null then
    return v_id;
  end if;

  insert into public.categories (name, icon, parent_id)
  values (p_name, p_icon, p_parent)
  returning id into v_id;

  return v_id;
end;
$$;

do $$
declare
  cat_buy_sell uuid;
  cat_mobile uuid;
  cat_property uuid;
  cat_vehicles uuid;
  cat_jobs uuid;
  cat_fashion uuid;
  cat_home uuid;
  cat_health uuid;
  cat_food uuid;
  cat_gaming uuid;
  cat_pets uuid;
  cat_edu uuid;
  cat_business uuid;
  cat_digital uuid;
  cat_community uuid;
begin
  cat_buy_sell := public._seed_category('Buy & Sell', 'cart', null);
  cat_mobile := public._seed_category('Mobile Phones & Gadgets', 'smartphone', null);
  cat_property := public._seed_category('Property', 'building', null);
  cat_vehicles := public._seed_category('Vehicles', 'car', null);
  cat_jobs := public._seed_category('Jobs & Services', 'briefcase', null);
  cat_fashion := public._seed_category('Fashion', 'shirt', null);
  cat_home := public._seed_category('Home & Living', 'home', null);
  cat_health := public._seed_category('Health & Beauty', 'heart', null);
  cat_food := public._seed_category('Food & Business', 'utensils', null);
  cat_gaming := public._seed_category('Gaming & Hobbies', 'gamepad', null);
  cat_pets := public._seed_category('Pets', 'paw', null);
  cat_edu := public._seed_category('Education', 'book', null);
  cat_business := public._seed_category('Business & Industrial', 'factory', null);
  cat_digital := public._seed_category('Digital Products', 'download', null);
  cat_community := public._seed_category('Community', 'users', null);

  -- Buy & Sell
  perform public._seed_category('General Items', 'package', cat_buy_sell);
  perform public._seed_category('Appliances', 'microwave', cat_buy_sell);
  perform public._seed_category('Sports & Outdoors', 'bike', cat_buy_sell);

  -- Mobile Phones & Gadgets
  perform public._seed_category('Smartphones', 'smartphone', cat_mobile);
  perform public._seed_category('Tablets', 'tablet', cat_mobile);
  perform public._seed_category('Accessories', 'headphones', cat_mobile);
  perform public._seed_category('Wearables', 'watch', cat_mobile);
  perform public._seed_category('Laptops & Computers', 'laptop', cat_mobile);

  -- Property
  perform public._seed_category('House & Lot', 'home', cat_property);
  perform public._seed_category('Condo', 'building-2', cat_property);
  perform public._seed_category('Apartment', 'building', cat_property);
  perform public._seed_category('Bedspace', 'bed', cat_property);
  perform public._seed_category('Commercial', 'store', cat_property);
  perform public._seed_category('Land', 'map', cat_property);
  perform public._seed_category('For Rent (Short-term)', 'key', cat_property);

  -- Vehicles
  perform public._seed_category('Cars', 'car', cat_vehicles);
  perform public._seed_category('Motorcycles', 'bike', cat_vehicles);
  perform public._seed_category('Vans & MPVs', 'truck', cat_vehicles);
  perform public._seed_category('Parts & Accessories', 'wrench', cat_vehicles);
  perform public._seed_category('E-bikes & Scooters', 'zap', cat_vehicles);

  -- Jobs & Services
  perform public._seed_category('Full-time Jobs', 'briefcase', cat_jobs);
  perform public._seed_category('Freelance & Part-time', 'clock', cat_jobs);
  perform public._seed_category('Home Services', 'hammer', cat_jobs);
  perform public._seed_category('Delivery Riders', 'bike', cat_jobs);
  perform public._seed_category('Repair & Technical', 'wrench', cat_jobs);

  -- Fashion (Ukay-ukay for PH)
  perform public._seed_category('Men''s Clothing', 'shirt', cat_fashion);
  perform public._seed_category('Women''s Clothing', 'shirt', cat_fashion);
  perform public._seed_category('Ukay-ukay & Thrift', 'shopping-bag', cat_fashion);
  perform public._seed_category('Shoes & Footwear', 'footprints', cat_fashion);
  perform public._seed_category('Bags & Accessories', 'bag', cat_fashion);
  perform public._seed_category('Kids & Baby Fashion', 'baby', cat_fashion);

  -- Home & Living
  perform public._seed_category('Furniture', 'sofa', cat_home);
  perform public._seed_category('Kitchen & Dining', 'utensils', cat_home);
  perform public._seed_category('Decor & Lighting', 'lamp', cat_home);
  perform public._seed_category('Tools & Hardware', 'hammer', cat_home);

  -- Health & Beauty
  perform public._seed_category('Skincare', 'sparkles', cat_health);
  perform public._seed_category('Makeup', 'palette', cat_health);
  perform public._seed_category('Personal Care', 'droplet', cat_health);
  perform public._seed_category('Fitness', 'dumbbell', cat_health);

  -- Food & Business
  perform public._seed_category('Restaurant Equipment', 'chef-hat', cat_food);
  perform public._seed_category('Ingredients & Supply', 'apple', cat_food);
  perform public._seed_category('Franchise & Business Ops', 'trending-up', cat_food);

  -- Gaming & Hobbies
  perform public._seed_category('Consoles', 'gamepad-2', cat_gaming);
  perform public._seed_category('PC Gaming', 'monitor', cat_gaming);
  perform public._seed_category('Toys & Collectibles', 'puzzle', cat_gaming);
  perform public._seed_category('Sports Equipment', 'trophy', cat_gaming);

  -- Pets
  perform public._seed_category('Dogs', 'dog', cat_pets);
  perform public._seed_category('Cats', 'cat', cat_pets);
  perform public._seed_category('Pet Supplies', 'bone', cat_pets);
  perform public._seed_category('Adoption & Rehoming', 'heart-handshake', cat_pets);

  -- Education
  perform public._seed_category('Books & Textbooks', 'book-open', cat_edu);
  perform public._seed_category('Tutoring & Lessons', 'graduation-cap', cat_edu);
  perform public._seed_category('Online Courses & Keys', 'key-round', cat_edu);

  -- Business & Industrial
  perform public._seed_category('Machinery', 'cog', cat_business);
  perform public._seed_category('Office & POS', 'printer', cat_business);
  perform public._seed_category('Wholesale & Bulk', 'boxes', cat_business);

  -- Digital Products
  perform public._seed_category('Templates & Graphics', 'image', cat_digital);
  perform public._seed_category('Software & Licenses', 'code', cat_digital);
  perform public._seed_category('E-books & Media', 'file-text', cat_digital);

  -- Community
  perform public._seed_category('Events & Announcements', 'calendar', cat_community);
  perform public._seed_category('Lost & Found', 'search', cat_community);
  perform public._seed_category('Free Items & Donations', 'gift', cat_community);
end;
$$;

drop function if exists public._seed_category (text, text, uuid);
