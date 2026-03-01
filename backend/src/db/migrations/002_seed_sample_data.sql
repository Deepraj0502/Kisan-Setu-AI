-- Sample seed data for development/testing
-- This file contains example data to populate RAG tables

-- Sample Government Schemes (2026 Bharat Vistaar aligned)
INSERT INTO government_schemes (
  scheme_code, name_english, name_marathi, name_hindi,
  description_english, description_marathi, description_hindi,
  eligibility_criteria, benefits_summary,
  eligible_states, is_active
) VALUES
(
  'PM-KISAN-2026',
  'PM Kisan Samman Nidhi',
  'पीएम किसान सम्मान निधी',
  'पीएम किसान सम्मान निधी',
  'Direct income support of ₹6,000 per year to all landholding farmers',
  'सर्व जमीनधारक शेतकऱ्यांना दरवर्षी ₹६,००० चे थेट उत्पन्न समर्थन',
  'सभी जमीनधारक किसानों को प्रति वर्ष ₹६,००० का प्रत्यक्ष आय सहायता',
  '{"land_ownership": true, "age_min": 18, "exclusions": ["government_employees", "tax_payers"]}'::jsonb,
  '₹6,000 per year in 3 installments of ₹2,000 each',
  ARRAY['MH', 'UP', 'MP', 'RJ', 'GJ'],
  true
),
(
  'SOIL-HEALTH-CARD-2026',
  'Soil Health Card Scheme',
  'मृदा आरोग्य कार्ड योजना',
  'मृदा स्वास्थ्य कार्ड योजना',
  'Free soil testing and health cards for farmers',
  'शेतकऱ्यांसाठी मोफत मृदा चाचणी आणि आरोग्य कार्ड',
  'किसानों के लिए मुफ्त मिट्टी परीक्षण और स्वास्थ्य कार्ड',
  '{"farmer_status": true}'::jsonb,
  'Free soil testing, personalized fertilizer recommendations',
  ARRAY['MH', 'UP', 'MP', 'RJ', 'GJ', 'KA', 'TN'],
  true
),
(
  'SUBSIDY-FERTILIZER-2026',
  'Fertilizer Subsidy Scheme',
  'खत सबसिडी योजना',
  'उर्वरक सब्सिडी योजना',
  'Subsidized fertilizers for registered farmers',
  'नोंदणीकृत शेतकऱ्यांसाठी सबसिडी असलेले खत',
  'पंजीकृत किसानों के लिए सब्सिडी वाले उर्वरक',
  '{"registration_required": true, "land_size_min_hectares": 0.1}'::jsonb,
  'Up to 50% subsidy on fertilizers',
  ARRAY['MH', 'UP', 'MP', 'RJ', 'GJ'],
  true
)
ON CONFLICT (scheme_code) DO NOTHING;

-- Sample Mandi Data (for price prediction)
INSERT INTO mandi_data (
  mandi_name, mandi_code, district, state,
  commodity_name, commodity_category, variety,
  min_price, max_price, modal_price,
  price_date, unit
) VALUES
(
  'Pune APMC',
  'MH-PUNE-001',
  'Pune',
  'Maharashtra',
  'Onion',
  'vegetables',
  'Nashik Red',
  1800.00,
  2200.00,
  2000.00,
  CURRENT_DATE,
  'quintal'
),
(
  'Nashik APMC',
  'MH-NASHIK-001',
  'Nashik',
  'Maharashtra',
  'Tomato',
  'vegetables',
  'Hybrid',
  1200.00,
  1800.00,
  1500.00,
  CURRENT_DATE,
  'quintal'
),
(
  'Delhi Azadpur',
  'DL-AZADPUR-001',
  'North Delhi',
  'Delhi',
  'Potato',
  'vegetables',
  'Kufri',
  800.00,
  1200.00,
  1000.00,
  CURRENT_DATE,
  'quintal'
)
ON CONFLICT DO NOTHING;
