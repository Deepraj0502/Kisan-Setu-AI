type Lang = "mr" | "hi" | "en";

interface MockEntry {
  id: string;
  tags: string[];
  languages: {
    mr?: string;
    hi?: string;
    en?: string;
  };
}

const MOCK_ENTRIES: MockEntry[] = [
  {
    id: "crop-disease-onion-fungus",
    tags: ["onion", "fungus", "disease", "कांदा", "रोग", "फंगस"],
    languages: {
      mr: [
        "🧅 कांदा पिकावर बुरशी / रोग दिसत असल्यास:",
        "",
        "1) **निरीक्षण:**",
        "   - पानांवर तपकिरी / करड्या डाग आहेत का ते बघा.",
        "   - कुजलेली पाने आणि कंद वेगळे करा.",
        "",
        "2) **शेती स्वच्छता:**",
        "   - रोगट अवशेष जाळून टाका किंवा शेताबाहेर न्या.",
        "   - जास्त पाणी साचू देऊ नका; चांगला निचरा ठेवा.",
        "",
        "3) **फवारणी (उदाहरण):**",
        "   - राज्य कृषी विभागाने शिफारस केलेल्या बुरशीनाशकाचा वापर करा.",
        "   - डोस व वेळेसाठी अधिकृत मार्गदर्शक सूचनांचे पालन करा.",
        "",
        "4) **भविष्यासाठी:**",
        "   - रोगप्रतिरोधक वाण वापरा.",
        "   - पीक फेरपालट (Crop Rotation) करा.",
        "",
        "👉 सूचनाः जवळच्या कृषी अधिकारी / कृषी सेवा केंद्राशी संपर्क करून स्थानिक हवामान व जमिनीप्रमाणे अचूक औषधांची माहिती घ्या."
      ].join("\n"),
      hi: [
        "🧅 प्याज की फसल में फफूंदी / रोग दिखने पर:",
        "",
        "1) **जाँच:**",
        "   - पत्तों पर भूरे / राखी धब्बे दिख रहे हैं या नहीं देखें.",
        "   - सड़े हुए पत्ते और कंद अलग कर दें.",
        "",
        "2) **खेत की सफाई:**",
        "   - रोगग्रस्त अवशेष जला दें या खेत से बाहर फेंक दें.",
        "   - खेत में पानी न रुकने दें; निकास अच्छा रखें.",
        "",
        "3) **स्प्रे (उदाहरण):**",
        "   - राज्य कृषि विभाग द्वारा अनुशंसित फफूंदनाशी का उपयोग करें.",
        "   - मात्रा और समय के लिए आधिकारिक गाइडलाइन का पालन करें.",
        "",
        "4) **भविष्य के लिए:**",
        "   - रोग प्रतिरोधी किस्में लें.",
        "   - फसल चक्र (Crop Rotation) अपनाएँ.",
        "",
        "👉 सलाहः नज़दीकी कृषि अधिकारी / सेवा केंद्र से संपर्क कर स्थानीय मौसम और मिट्टी के अनुसार दवा की पुष्टि करें."
      ].join("\n"),
      en: [
        "🧅 If your onion crop shows fungal disease:",
        "",
        "1) **Check the symptoms:**",
        "   - Brown / grey spots on leaves.",
        "   - Rotten leaves and bulbs should be removed.",
        "",
        "2) **Field hygiene:**",
        "   - Destroy infected plant debris away from the field.",
        "   - Avoid standing water; ensure good drainage.",
        "",
        "3) **Fungicide (example):",
        "   - Use a fungicide recommended by your State Agriculture Department.",
        "   - Follow official guidelines for dose and timing.",
        "",
        "4) **For future seasons:**",
        "   - Use disease-resistant varieties.",
        "   - Follow crop rotation.",
        "",
        "👉 Note: Always confirm exact product and dose with your local agriculture officer."
      ].join("\n")
    }
  },
  {
    id: "soil-health-card",
    tags: ["soil", "health card", "मृदा", "मृदा आरोग्य", "मिट्टी", "card"],
    languages: {
      mr: [
        "📄 मृदा आरोग्य कार्ड म्हणजे काय आणि कसे मिळते?",
        "",
        "1) **मृदा आरोग्य कार्ड:**",
        "   - शेतातील जमिनीची तपासणी करून मिळणारा अहवाल.",
        "   - पीएच, सेंद्रिय कार्बन, नायट्रोजन, फॉस्फरस, पोटॅश इ. माहिती देते.",
        "",
        "2) **कसे मिळवायचे?**",
        "   - जवळच्या कृषी अधिकारी / कृषी सेवा केंद्राशी संपर्क करा.",
        "   - जमिनीचा नमुना ठरलेल्या पद्धतीने देऊन तपासणी करा.",
        "",
        "3) **उपयोग:**",
        "   - खतांचे योग्य प्रमाण व वेळ ठरवायला मदत.",
        "   - खर्च कमी आणि उत्पादन अधिक.",
        "",
        "👉 तुम्ही पाठवलेले Soil Health Card फोटो भविष्यात Textract + RAG द्वारे आपोआप समजून घेऊन, तुमच्या शेतासाठी खास खत व्यवस्थापन योजना तयार केली जाईल."
      ].join("\n"),
      hi: [
        "📄 मिट्टी स्वास्थ्य कार्ड क्या है और कैसे मिलता है?",
        "",
        "1) **मिट्टी स्वास्थ्य कार्ड:**",
        "   - खेत की मिट्टी की जाँच के बाद मिलने वाली रिपोर्ट.",
        "   - pH, ऑर्गेनिक कार्बन, नाइट्रोजन, फास्फोरस, पोटाश आदि की जानकारी देती है.",
        "",
        "2) **कैसे मिलेगा?**",
        "   - नज़दीकी कृषि अधिकारी / सेवा केंद्र से संपर्क करें.",
        "   - निर्धारित तरीके से मिट्टी का नमूना देकर जाँच कराएँ.",
        "",
        "3) **उपयोग:**",
        "   - खाद की सही मात्रा और समय तय करने में मदद.",
        "   - खर्च कम, उत्पादन ज़्यादा.",
        "",
        "👉 भविष्य में आप जो Soil Health Card की फोटो भेजेंगे, उसे Textract + RAG से पढ़कर आपके खेत के लिए खास पोषण योजना तैयार की जाएगी."
      ].join("\n"),
      en: [
        "📄 What is a Soil Health Card and how do you get it?",
        "",
        "1) **Soil Health Card:**",
        "   - A report generated after testing your field soil.",
        "   - Shows pH, organic carbon, nitrogen, phosphorus, potassium, etc.",
        "",
        "2) **How to get it?**",
        "   - Visit your nearest agriculture officer / service center.",
        "   - Submit soil samples as per the recommended method.",
        "",
        "3) **Benefits:**",
        "   - Helps decide correct fertilizer dose and timing.",
        "   - Lower cost, higher yield.",
        "",
        "👉 In the future, photos of your Soil Health Card will be read using Textract + RAG to auto-generate a fertilizer plan for your specific field."
      ].join("\n")
    }
  },
  {
    id: "subsidy-schemes",
    tags: ["scheme", "subsidy", "योजना", "सब्सिडी", "scheme match"],
    languages: {
      mr: [
        "🏛️ सब्सिडी व योजना संदर्भात माहिती:",
        "",
        "1) **PM-KISAN:**",
        "   - पात्र जमीनधारक शेतकऱ्यांना दरवर्षी ₹६,००० थेट खात्यात.",
        "",
        "2) **मृदा आरोग्य कार्ड योजना:**",
        "   - मोफत मृदा तपासणी व कार्ड.",
        "",
        "3) **खत सबसिडी योजना:**",
        "   - नोंदणीकृत शेतकऱ्यांना खतांवर सवलत.",
        "",
        "4) **Kisan Setu AI काय करेल?**",
        "   - तुमच्या प्रोफाइल, जमीन व पिकानुसार योग्य योजना सुचवेल.",
        "   - भविष्यात `scheme_matches` सारख्या टेबल्स वर आधारित RAG + नियमांमधून ‘तुमच्यासाठी योग्य योजना’ निवडली जाईल.",
        "",
        "👉 सध्या आम्ही डेमो डेटावर काम करत आहोत; खरी योजना माहिती अधिकृत सरकारी पोर्टलवरूनच घ्या."
      ].join("\n"),
      hi: [
        "🏛️ सब्सिडी और योजनाओं के बारे में जानकारी:",
        "",
        "1) **PM-KISAN:**",
        "   - पात्र जमीनधारक किसानों को प्रति वर्ष ₹६,००० सीधे खाते में.",
        "",
        "2) **मिट्टी स्वास्थ्य कार्ड योजना:**",
        "   - मुफ्त मिट्टी जांच और कार्ड.",
        "",
        "3) **उर्वरक सब्सिडी योजना:**",
        "   - पंजीकृत किसानों को उर्वरकों पर सब्सिडी.",
        "",
        "4) **Kisan Setu AI क्या करेगा?**",
        "   - आपकी प्रोफाइल, जमीन और फसल के अनुसार उपयुक्त योजनाएँ सुझाएगा.",
        "   - भविष्य में `scheme_matches` जैसी टेबल पर आधारित RAG + नियमों से ‘आपके लिए सही योजना’ चुनी जाएगी.",
        "",
        "👉 अभी हम डेमो डेटा पर काम कर रहे हैं; असली योजना की जानकारी हमेशा सरकारी पोर्टल से ही लें."
      ].join("\n"),
      en: [
        "🏛️ Subsidy schemes overview:",
        "",
        "1) **PM-KISAN:**",
        "   - ₹6,000 per year for eligible landholding farmers, paid in 3 installments.",
        "",
        "2) **Soil Health Card Scheme:**",
        "   - Free soil testing and health card.",
        "",
        "3) **Fertilizer Subsidy Scheme:**",
        "   - Subsidized fertilizers for registered farmers.",
        "",
        "4) **What will Kisan Setu AI do?**",
        "   - Match your profile, land details and crops to relevant schemes.",
        "   - In future, it will use tables like `scheme_matches` (plus RAG) to pick ‘best fit’ schemes for you.",
        "",
        "👉 For official details and eligibility, always cross-check on government portals."
      ].join("\n")
    }
  },
  {
    id: "mandi-prices",
    tags: ["mandi", "price", "किंमत", "बाजार", "मंडी", "rate"],
    languages: {
      mr: [
        "📈 मंडी किंमत आणि Mandi-Predictor:",
        "",
        "1) **सध्याची किंमत कशी बघावी?**",
        "   - शासनाच्या अधिकृत पोर्टल / अॅपवरून जवळच्या APMC ची माहिती मिळते.",
        "",
        "2) **उदाहरण डेमो मंडी भाव (आजचे अंदाजे दर):",
        "   - पुणे APMC (Onion / कांदा): ₹2,000 प्रति क्विंटल",
        "   - नाशिक APMC (Tomato / टोमॅटो): ₹1,500 प्रति क्विंटल",
        "   - दिल्ली आझादपूर (Potato / बटाटा): ₹1,000 प्रति क्विंटल",
        "   (हे फक्त डेमो दर आहेत; प्रत्यक्ष दर वेगळे असू शकतात.)",
        "",
        "3) **Mandi-Predictor (या प्रकल्पात):**",
        "   - मंडी डेटावर आधारित भविष्यातील किंमत ट्रेंड दाखवण्याचे उद्दिष्ट.",
        "   - ‘आता विक्री करावी की साठवणूक करावी’ याचा सल्ला देण्याची योजना.",
        "",
        "4) **सध्या डेमोमध्ये:**",
        "   - काही नमुना मंडी डेटा (`mandi_data` टेबल) वापरून डॅशबोर्ड तयार केला जाईल.",
        "",
        "👉 नेहमी स्थानिक मंडी व अधिकृत स्त्रोतांशी किंमतीची खात्री करून व्यवहार करा."
      ].join("\n"),
      hi: [
        "📈 मंडी भाव और Mandi-Predictor:",
        "",
        "1) **मौजूदा भाव कैसे देखें?**",
        "   - सरकारी पोर्टल / ऐप से नज़दीकी APMC के दाम देखें.",
        "",
        "2) **उदाहरण डेमो मंडी भाव (आज के अनुमानित रेट):",
        "   - पुणे APMC (Onion / प्याज): ₹2,000 प्रति क्विंटल",
        "   - नासिक APMC (Tomato / टमाटर): ₹1,500 प्रति क्विंटल",
        "   - दिल्ली आज़ादपुर (Potato / आलू): ₹1,000 प्रति क्विंटल",
        "   (ये केवल डेमो रेट हैं; असली रेट अलग हो सकते हैं.)",
        "",
        "3) **Mandi-Predictor (इस प्रोजेक्ट में):**",
        "   - मंडी डेटा के आधार पर भविष्य के दामों का रुझान दिखाने का लक्ष्य.",
        "   - ‘अभी बेचें या स्टोर करें’ इस पर सलाह देना.",
        "",
        "4) **अभी के डेमो में:**",
        "   - कुछ नमूना मंडी डेटा (`mandi_data` टेबल) का उपयोग कर डैशबोर्ड बनाया जाएगा.",
        "",
        "👉 हमेशा स्थानीय मंडी और आधिकारिक स्रोतों से भाव की पुष्टि करें."
      ].join("\n"),
      en: [
        "📈 Mandi prices and the Mandi-Predictor:",
        "",
        "1) **How to check current prices?**",
        "   - Use official government portals / apps for nearby APMC prices.",
        "",
        "2) **Example demo mandi prices (approx today):**",
        "   - Pune APMC (Onion): ₹2,000 per quintal",
        "   - Nashik APMC (Tomato): ₹1,500 per quintal",
        "   - Delhi Azadpur (Potato): ₹1,000 per quintal",
        "   (These are demo rates; actual market prices will vary.)",
        "",
        "3) **Mandi-Predictor (in this project):**",
        "   - Aim is to forecast price trends using mandi data.",
        "   - Advise ‘Sell now’ vs ‘Store’ based on predicted peaks.",
        "",
        "4) **In the current demo:**",
        "   - A few sample records in `mandi_data` will power a basic trend view.",
        "",
        "👉 Always confirm final prices with local mandi and official sources before selling."
      ].join("\n")
    }
  },
  {
    id: "tomato-disease",
    tags: ["tomato", "टोमॅटो", "टमाटर", "disease", "रोग", "blight", "wilt"],
    languages: {
      mr: [
        "🍅 टोमॅटो पिकावर रोग / ब्लाइट:",
        "",
        "1) **लक्षणे:**",
        "   - पानांवर तपकिरी डाग, पाने सुकतात.",
        "   - फळांवर काळे डाग, कुजणे.",
        "",
        "2) **उपचार:**",
        "   - रोगग्रस्त भाग ताबडतोब काढून टाका.",
        "   - चांगला वायुवीजन ठेवा, पाणी पानांवर नको.",
        "   - कॉपर-आधारित फवारणी (राज्य शिफारसीनुसार).",
        "",
        "3) **प्रतिबंध:**",
        "   - रोगप्रतिरोधक वाण निवडा (Hybrid-4, Arka Vikas).",
        "   - पीक फेरपालट करा (टोमॅटो नंतर भाजीपाला).",
        "",
        "👉 स्थानिक कृषी अधिकारीशी संपर्क करून अचूक फवारणीची माहिती घ्या."
      ].join("\n"),
      hi: [
        "🍅 टमाटर की फसल में रोग / ब्लाइट:",
        "",
        "1) **लक्षण:**",
        "   - पत्तों पर भूरे धब्बे, पत्ते सूखते हैं.",
        "   - फलों पर काले धब्बे, सड़न.",
        "",
        "2) **उपचार:**",
        "   - रोगग्रस्त भाग तुरंत हटा दें.",
        "   - अच्छा वायु संचार रखें, पत्तों पर पानी न डालें.",
        "   - कॉपर-आधारित स्प्रे (राज्य सुझाव के अनुसार).",
        "",
        "3) **रोकथाम:**",
        "   - रोग प्रतिरोधी किस्में चुनें (Hybrid-4, Arka Vikas).",
        "   - फसल चक्र अपनाएँ (टमाटर के बाद सब्जी).",
        "",
        "👉 स्थानीय कृषि अधिकारी से संपर्क कर सटीक स्प्रे की जानकारी लें."
      ].join("\n"),
      en: [
        "🍅 Tomato crop disease / blight:",
        "",
        "1) **Symptoms:**",
        "   - Brown spots on leaves, leaves dry up.",
        "   - Black spots on fruits, rotting.",
        "",
        "2) **Treatment:**",
        "   - Remove infected parts immediately.",
        "   - Ensure good air circulation, avoid watering leaves.",
        "   - Copper-based spray (as per state recommendations).",
        "",
        "3) **Prevention:**",
        "   - Choose disease-resistant varieties (Hybrid-4, Arka Vikas).",
        "   - Practice crop rotation (vegetables after tomato).",
        "",
        "👉 Contact local agriculture officer for exact spray recommendations."
      ].join("\n")
    }
  },
  {
    id: "wheat-rust",
    tags: ["wheat", "गहू", "गेहूं", "rust", "रस्ट", "रोग"],
    languages: {
      mr: [
        "🌾 गहू पिकावर रस्ट रोग:",
        "",
        "1) **लक्षणे:**",
        "   - पानांवर तपकिरी/नारंगी पुडे (rust pustules).",
        "   - पाने पिवळी पडतात, उत्पादन कमी होते.",
        "",
        "2) **उपचार:**",
        "   - Propiconazole किंवा Tebuconazole फवारणी (राज्य शिफारसीनुसार).",
        "   - फवारणी सकाळी किंवा संध्याकाळी करा.",
        "",
        "3) **प्रतिबंध:**",
        "   - रोगप्रतिरोधक वाण (PBW-725, HD-3086).",
        "   - वेळेवर पेरणी, संतुलित खत वापर.",
        "",
        "👉 रस्ट रोग हवामानावर अवलंबून असतो; लवकर निदान महत्त्वाचे."
      ].join("\n"),
      hi: [
        "🌾 गेहूं की फसल में रस्ट रोग:",
        "",
        "1) **लक्षण:**",
        "   - पत्तों पर भूरे/नारंगी धब्बे (rust pustules).",
        "   - पत्ते पीले पड़ते हैं, उत्पादन कम होता है.",
        "",
        "2) **उपचार:**",
        "   - Propiconazole या Tebuconazole स्प्रे (राज्य सुझाव के अनुसार).",
        "   - स्प्रे सुबह या शाम को करें.",
        "",
        "3) **रोकथाम:**",
        "   - रोग प्रतिरोधी किस्में (PBW-725, HD-3086).",
        "   - समय पर बुवाई, संतुलित खाद का उपयोग.",
        "",
        "👉 रस्ट रोग मौसम पर निर्भर करता है; जल्दी निदान ज़रूरी है."
      ].join("\n"),
      en: [
        "🌾 Wheat rust disease:",
        "",
        "1) **Symptoms:**",
        "   - Brown/orange pustules on leaves.",
        "   - Leaves turn yellow, yield decreases.",
        "",
        "2) **Treatment:**",
        "   - Propiconazole or Tebuconazole spray (as per state recommendations).",
        "   - Spray in morning or evening.",
        "",
        "3) **Prevention:**",
        "   - Disease-resistant varieties (PBW-725, HD-3086).",
        "   - Timely sowing, balanced fertilizer use.",
        "",
        "👉 Rust disease depends on weather; early detection is crucial."
      ].join("\n")
    }
  },
  {
    id: "pest-control-aphids",
    tags: ["pest", "aphid", "कीटक", "माहू", "aphids", "insect"],
    languages: {
      mr: [
        "🐛 माहू (Aphids) नियंत्रण:",
        "",
        "1) **ओळख:**",
        "   - छोटे हिरवे/काळे कीटक, पानांच्या खाली गट.",
        "   - पाने वळणे, चिकट पदार्थ (honeydew).",
        "",
        "2) **जैविक नियंत्रण:**",
        "   - लेडीबग (ladybugs) नैसर्गिक शत्रू.",
        "   - नीम तेल फवारणी (2-3% द्रावण).",
        "   - साबण पाण्याची फवारणी (1 लिटर पाण्यात 10ml साबण).",
        "",
        "3) **रासायनिक (शेवटचा पर्याय):**",
        "   - Imidacloprid किंवा Acetamiprid (राज्य शिफारसीनुसार).",
        "",
        "👉 जैविक पद्धती प्रथम वापरा; रासायनिक फक्त गंभीर प्रकरणात."
      ].join("\n"),
      hi: [
        "🐛 माहू (Aphids) नियंत्रण:",
        "",
        "1) **पहचान:**",
        "   - छोटे हरे/काले कीट, पत्तों के नीचे समूह.",
        "   - पत्ते मुड़ना, चिपचिपा पदार्थ (honeydew).",
        "",
        "2) **जैविक नियंत्रण:**",
        "   - लेडीबग (ladybugs) प्राकृतिक दुश्मन.",
        "   - नीम तेल स्प्रे (2-3% घोल).",
        "   - साबुन पानी का स्प्रे (1 लीटर पानी में 10ml साबुन).",
        "",
        "3) **रासायनिक (अंतिम विकल्प):**",
        "   - Imidacloprid या Acetamiprid (राज्य सुझाव के अनुसार).",
        "",
        "👉 जैविक तरीके पहले आज़माएँ; रासायनिक सिर्फ गंभीर मामलों में."
      ].join("\n"),
      en: [
        "🐛 Aphid control:",
        "",
        "1) **Identification:**",
        "   - Small green/black insects, clusters under leaves.",
        "   - Curled leaves, sticky substance (honeydew).",
        "",
        "2) **Biological control:**",
        "   - Ladybugs are natural predators.",
        "   - Neem oil spray (2-3% solution).",
        "   - Soap water spray (10ml soap in 1 liter water).",
        "",
        "3) **Chemical (last resort):**",
        "   - Imidacloprid or Acetamiprid (as per state recommendations).",
        "",
        "👉 Try biological methods first; chemical only in severe cases."
      ].join("\n")
    }
  },
  {
    id: "irrigation-timing",
    tags: ["irrigation", "पाणी", "सिंचन", "water", "watering"],
    languages: {
      mr: [
        "💧 सिंचनाची वेळ आणि पद्धत:",
        "",
        "1) **सकाळी सिंचन (शिफारस):**",
        "   - सकाळी 6-10 वाजेपर्यंत सर्वोत्तम.",
        "   - पानांना वेळ मिळते कोरडे होण्यासाठी, रोग कमी.",
        "",
        "2) **पाण्याचे प्रमाण:**",
        "   - पिकावर अवलंबून: भाजीपाला - 2-3 दिवसांतून, धान्य - 7-10 दिवसांतून.",
        "   - जमिनीचा प्रकार: माती जास्त पाणी धरते, वाळू कमी.",
        "",
        "3) **पद्धत:**",
        "   - ड्रिप सिंचन: पाणी बचत, कार्यक्षम.",
        "   - फवारणी: छोट्या पिकांसाठी.",
        "",
        "👉 जास्त पाणी देऊ नका; जमिनीची आर्द्रता तपासा (हातात घेऊन पाहा)."
      ].join("\n"),
      hi: [
        "💧 सिंचाई का समय और तरीका:",
        "",
        "1) **सुबह सिंचाई (सुझाव):**",
        "   - सुबह 6-10 बजे तक सबसे अच्छा.",
        "   - पत्तों को सूखने का समय मिलता है, रोग कम.",
        "",
        "2) **पानी की मात्रा:**",
        "   - फसल पर निर्भर: सब्जी - 2-3 दिन में, अनाज - 7-10 दिन में.",
        "   - मिट्टी का प्रकार: मिट्टी ज़्यादा पानी रखती है, रेत कम.",
        "",
        "3) **तरीका:**",
        "   - ड्रिप सिंचाई: पानी बचत, कारगर.",
        "   - स्प्रिंकलर: छोटी फसलों के लिए.",
        "",
        "👉 ज़्यादा पानी न दें; मिट्टी की नमी जाँचें (हाथ में लेकर देखें)."
      ].join("\n"),
      en: [
        "💧 Irrigation timing and method:",
        "",
        "1) **Morning irrigation (recommended):**",
        "   - Best between 6-10 AM.",
        "   - Leaves get time to dry, less disease risk.",
        "",
        "2) **Water quantity:**",
        "   - Depends on crop: Vegetables - every 2-3 days, Grains - every 7-10 days.",
        "   - Soil type: Clay holds more water, sand less.",
        "",
        "3) **Method:**",
        "   - Drip irrigation: Water saving, efficient.",
        "   - Sprinkler: For small crops.",
        "",
        "👉 Don't over-water; check soil moisture (feel with hand)."
      ].join("\n")
    }
  },
  {
    id: "fertilizer-timing",
    tags: ["fertilizer", "खत", "उर्वरक", "npk", "timing"],
    languages: {
      mr: [
        "🌱 खत देण्याची वेळ आणि पद्धत:",
        "",
        "1) **बेसल खत (पेरणीपूर्वी):**",
        "   - पेरणीच्या 15-20 दिवस आधी जमिनीत मिसळा.",
        "   - FYM (गोबर खत) 5-10 टन/हेक्टर.",
        "",
        "2) **Top Dressing (पिक वाढत असताना):**",
        "   - नायट्रोजन खत (Urea) 2-3 वेळा विभागून द्या.",
        "   - पहिली वेळ: पेरणीनंतर 25-30 दिवसांनी.",
        "",
        "3) **NPK प्रमाण (सामान्य):**",
        "   - धान्य: 120:60:40 (N:P:K) kg/hectare.",
        "   - भाजीपाला: 80:40:40 kg/hectare.",
        "",
        "👉 मृदा आरोग्य कार्डावर आधारित खत व्यवस्थापन करा; जास्त खत नको."
      ].join("\n"),
      hi: [
        "🌱 खाद देने का समय और तरीका:",
        "",
        "1) **बेसल खाद (बुवाई से पहले):**",
        "   - बुवाई के 15-20 दिन पहले मिट्टी में मिलाएँ.",
        "   - FYM (गोबर खाद) 5-10 टन/हेक्टेयर.",
        "",
        "2) **Top Dressing (फसल बढ़ते समय):**",
        "   - नाइट्रोजन खाद (Urea) 2-3 बार बाँटकर दें.",
        "   - पहली बार: बुवाई के 25-30 दिन बाद.",
        "",
        "3) **NPK मात्रा (सामान्य):**",
        "   - अनाज: 120:60:40 (N:P:K) kg/hectare.",
        "   - सब्जी: 80:40:40 kg/hectare.",
        "",
        "👉 मिट्टी स्वास्थ्य कार्ड के आधार पर खाद प्रबंधन करें; ज़्यादा खाद न दें."
      ].join("\n"),
      en: [
        "🌱 Fertilizer timing and method:",
        "",
        "1) **Basal fertilizer (before sowing):**",
        "   - Mix into soil 15-20 days before sowing.",
        "   - FYM (Farmyard manure) 5-10 tons/hectare.",
        "",
        "2) **Top Dressing (during crop growth):**",
        "   - Nitrogen fertilizer (Urea) in 2-3 split doses.",
        "   - First dose: 25-30 days after sowing.",
        "",
        "3) **NPK ratio (general):**",
        "   - Grains: 120:60:40 (N:P:K) kg/hectare.",
        "   - Vegetables: 80:40:40 kg/hectare.",
        "",
        "👉 Manage fertilizers based on Soil Health Card; avoid over-fertilization."
      ].join("\n")
    }
  },
  {
    id: "crop-rotation",
    tags: ["rotation", "फेरपालट", "फसल चक्र", "crop rotation"],
    languages: {
      mr: [
        "🔄 पीक फेरपालट (Crop Rotation):",
        "",
        "1) **फायदे:**",
        "   - रोग आणि कीटक कमी होतात.",
        "   - जमिनीची सुपीकता वाढते.",
        "   - खत खर्च कमी होतो.",
        "",
        "2) **उदाहरण फेरपालट:**",
        "   - वर्ष 1: धान (Rice) → वर्ष 2: गहू (Wheat) → वर्ष 3: दाल (Pulses).",
        "   - भाजीपाला: टोमॅटो → भेंडी → पालक.",
        "",
        "3) **नियम:**",
        "   - एकाच कुटुंबातील पिके एका ठिकाणी नको (उदा: टोमॅटो + मिरची).",
        "   - दाल पिके नंतर नायट्रोजन-आवश्यक पिके लावा.",
        "",
        "👉 3-4 वर्षांचा फेरपालट चक्र ठेवा; जमिनीची आरोग्य सुधारते."
      ].join("\n"),
      hi: [
        "🔄 फसल चक्र (Crop Rotation):",
        "",
        "1) **फायदे:**",
        "   - रोग और कीट कम होते हैं.",
        "   - मिट्टी की उर्वरता बढ़ती है.",
        "   - खाद खर्च कम होता है.",
        "",
        "2) **उदाहरण चक्र:**",
        "   - वर्ष 1: धान (Rice) → वर्ष 2: गेहूं (Wheat) → वर्ष 3: दाल (Pulses).",
        "   - सब्जी: टमाटर → भिंडी → पालक.",
        "",
        "3) **नियम:**",
        "   - एक ही परिवार की फसलें एक जगह न लगाएँ (जैसे: टमाटर + मिर्च).",
        "   - दाल फसलों के बाद नाइट्रोजन-चाहिए वाली फसलें लगाएँ.",
        "",
        "👉 3-4 साल का चक्र रखें; मिट्टी की सेहत सुधरती है."
      ].join("\n"),
      en: [
        "🔄 Crop Rotation:",
        "",
        "1) **Benefits:**",
        "   - Reduces diseases and pests.",
        "   - Improves soil fertility.",
        "   - Reduces fertilizer cost.",
        "",
        "2) **Example rotation:**",
        "   - Year 1: Rice → Year 2: Wheat → Year 3: Pulses.",
        "   - Vegetables: Tomato → Okra → Spinach.",
        "",
        "3) **Rules:**",
        "   - Don't plant same family crops together (e.g., Tomato + Chilli).",
        "   - Plant nitrogen-demanding crops after pulses.",
        "",
        "👉 Maintain 3-4 year rotation cycle; improves soil health."
      ].join("\n")
    }
  },
  {
    id: "soil-ph-correction",
    tags: ["ph", "चुना", "lime", "acidic", "alkaline", "मृदा"],
    languages: {
      mr: [
        "🧪 मृदा pH सुधारणा:",
        "",
        "1) **आम्लीय जमीन (pH < 6.5):**",
        "   - चुना (Lime) वापरा: 2-4 टन/हेक्टर.",
        "   - पेरणीच्या 2-3 महिने आधी जमिनीत मिसळा.",
        "",
        "2) **क्षारीय जमीन (pH > 7.5):**",
        "   - Gypsum वापरा: 2-3 टन/हेक्टर.",
        "   - सल्फर देखील उपयुक्त.",
        "",
        "3) **pH 6.5-7.5 (आदर्श):**",
        "   - बहुतेक पिकांसाठी योग्य.",
        "   - खतांचे शोषण चांगले.",
        "",
        "👉 मृदा आरोग्य कार्डावरून pH तपासा; योग्य pH मध्ये पिकांचे उत्पादन वाढते."
      ].join("\n"),
      hi: [
        "🧪 मिट्टी pH सुधार:",
        "",
        "1) **अम्लीय मिट्टी (pH < 6.5):**",
        "   - चूना (Lime) उपयोग करें: 2-4 टन/हेक्टेयर.",
        "   - बुवाई के 2-3 महीने पहले मिट्टी में मिलाएँ.",
        "",
        "2) **क्षारीय मिट्टी (pH > 7.5):**",
        "   - Gypsum उपयोग करें: 2-3 टन/हेक्टेयर.",
        "   - सल्फर भी उपयुक्त.",
        "",
        "3) **pH 6.5-7.5 (आदर्श):**",
        "   - ज़्यादातर फसलों के लिए उपयुक्त.",
        "   - खाद का अवशोषण अच्छा.",
        "",
        "👉 मिट्टी स्वास्थ्य कार्ड से pH जाँचें; सही pH में फसल उत्पादन बढ़ता है."
      ].join("\n"),
      en: [
        "🧪 Soil pH correction:",
        "",
        "1) **Acidic soil (pH < 6.5):**",
        "   - Use Lime: 2-4 tons/hectare.",
        "   - Mix into soil 2-3 months before sowing.",
        "",
        "2) **Alkaline soil (pH > 7.5):**",
        "   - Use Gypsum: 2-3 tons/hectare.",
        "   - Sulfur is also suitable.",
        "",
        "3) **pH 6.5-7.5 (ideal):**",
        "   - Suitable for most crops.",
        "   - Good nutrient absorption.",
        "",
        "👉 Check pH from Soil Health Card; correct pH increases crop yield."
      ].join("\n")
    }
  },
  {
    id: "harvesting-timing",
    tags: ["harvest", "कापणी", "कटाई", "timing"],
    languages: {
      mr: [
        "🌾 कापणीची योग्य वेळ:",
        "",
        "1) **धान्य पिके (गहू, तांदूळ):**",
        "   - पीक 80-85% पिकले असता (पिवळे पाने, कठीण दाणे).",
        "   - सकाळी कापणी करा (दिवसा कोरडे होते).",
        "",
        "2) **भाजीपाला:**",
        "   - टोमॅटो: लाल, पूर्ण पिकलेले.",
        "   - भेंडी: 4-6 इंच लांब, ताजी.",
        "   - काकडी: हिरवी, कठीण.",
        "",
        "3) **कापणी नंतर:**",
        "   - चांगले कोरडे करा (12-14% आर्द्रता).",
        "   - साठवणूक: कोरडे, वायुरोधक जागा.",
        "",
        "👉 योग्य वेळी कापणी = चांगले दर्जा + चांगली किंमत."
      ].join("\n"),
      hi: [
        "🌾 कटाई का सही समय:",
        "",
        "1) **अनाज फसलें (गेहूं, धान):**",
        "   - फसल 80-85% पकी हो (पीले पत्ते, कठोर दाने).",
        "   - सुबह कटाई करें (दिन में सूख जाता है).",
        "",
        "2) **सब्जियाँ:**",
        "   - टमाटर: लाल, पूरी तरह पका हुआ.",
        "   - भिंडी: 4-6 इंच लंबी, ताज़ी.",
        "   - खीरा: हरा, कठोर.",
        "",
        "3) **कटाई के बाद:**",
        "   - अच्छी तरह सुखाएँ (12-14% नमी).",
        "   - भंडारण: सूखी, हवा-रोधक जगह.",
        "",
        "👉 सही समय पर कटाई = अच्छी गुणवत्ता + अच्छी कीमत."
      ].join("\n"),
      en: [
        "🌾 Right time for harvesting:",
        "",
        "1) **Grain crops (Wheat, Rice):**",
        "   - When crop is 80-85% mature (yellow leaves, hard grains).",
        "   - Harvest in morning (dries during day).",
        "",
        "2) **Vegetables:**",
        "   - Tomato: Red, fully ripe.",
        "   - Okra: 4-6 inches long, fresh.",
        "   - Cucumber: Green, firm.",
        "",
        "3) **After harvesting:**",
        "   - Dry properly (12-14% moisture).",
        "   - Storage: Dry, airtight place.",
        "",
        "👉 Right timing = Better quality + Better price."
      ].join("\n")
    }
  },
  {
    id: "storage-tips",
    tags: ["storage", "साठवणूक", "भंडारण", "preservation"],
    languages: {
      mr: [
        "📦 पिकांची साठवणूक:",
        "",
        "1) **धान्य (गहू, तांदूळ):**",
        "   - आर्द्रता 12-14% राखा.",
        "   - कोरडे, वायुरोधक भांडे वापरा.",
        "   - कीटकांपासून सुरक्षित ठिकाण.",
        "",
        "2) **भाजीपाला:**",
        "   - थंड, कोरडे जागा (10-15°C).",
        "   - टोमॅटो: थंड, अंधार जागा.",
        "   - कांदा, लसूण: हवेशीर, कोरडे.",
        "",
        "3) **कीटक नियंत्रण:**",
        "   - नीम पाने मिसळा.",
        "   - नियमित तपासणी करा.",
        "",
        "👉 योग्य साठवणूक = कमी नुकसान + चांगली किंमत."
      ].join("\n"),
      hi: [
        "📦 फसलों का भंडारण:",
        "",
        "1) **अनाज (गेहूं, धान):**",
        "   - नमी 12-14% रखें.",
        "   - सूखे, हवा-रोधक बर्तन उपयोग करें.",
        "   - कीटों से सुरक्षित जगह.",
        "",
        "2) **सब्जियाँ:**",
        "   - ठंडी, सूखी जगह (10-15°C).",
        "   - टमाटर: ठंडी, अंधेरी जगह.",
        "   - प्याज, लहसुन: हवादार, सूखा.",
        "",
        "3) **कीट नियंत्रण:**",
        "   - नीम पत्ते मिलाएँ.",
        "   - नियमित जाँच करें.",
        "",
        "👉 सही भंडारण = कम नुकसान + अच्छी कीमत."
      ].join("\n"),
      en: [
        "📦 Crop storage:",
        "",
        "1) **Grains (Wheat, Rice):**",
        "   - Maintain 12-14% moisture.",
        "   - Use dry, airtight containers.",
        "   - Pest-safe location.",
        "",
        "2) **Vegetables:**",
        "   - Cool, dry place (10-15°C).",
        "   - Tomato: Cool, dark place.",
        "   - Onion, Garlic: Airy, dry.",
        "",
        "3) **Pest control:**",
        "   - Mix neem leaves.",
        "   - Regular inspection.",
        "",
        "👉 Proper storage = Less loss + Better price."
      ].join("\n")
    }
  },
  {
    id: "organic-farming",
    tags: ["organic", "जैविक", "organic farming", "compost"],
    languages: {
      mr: [
        "🌿 जैविक शेती:",
        "",
        "1) **गोबर खत (Compost):**",
        "   - गोबर, पाने, कचरा मिसळून 2-3 महिने ठेवा.",
        "   - 5-10 टन/हेक्टर वापरा.",
        "",
        "2) **जैविक कीटक नियंत्रण:**",
        "   - नीम तेल: 2-3% फवारणी.",
        "   - गोमूत्र: 5% द्रावण.",
        "   - लेडीबग, मांजरीचे पिल्लू (beneficial insects).",
        "",
        "3) **फायदे:**",
        "   - जमिनीची सुपीकता वाढते.",
        "   - पर्यावरणास अनुकूल.",
        "   - दीर्घकालीन लाभ.",
        "",
        "👉 जैविक शेती हळूहळू सुरू करा; मिश्र पद्धत देखील चांगली."
      ].join("\n"),
      hi: [
        "🌿 जैविक खेती:",
        "",
        "1) **गोबर खाद (Compost):**",
        "   - गोबर, पत्ते, कचरा मिलाकर 2-3 महीने रखें.",
        "   - 5-10 टन/हेक्टेयर उपयोग करें.",
        "",
        "2) **जैविक कीट नियंत्रण:**",
        "   - नीम तेल: 2-3% स्प्रे.",
        "   - गोमूत्र: 5% घोल.",
        "   - लेडीबग, मांजरी के बच्चे (beneficial insects).",
        "",
        "3) **फायदे:**",
        "   - मिट्टी की उर्वरता बढ़ती है.",
        "   - पर्यावरण के अनुकूल.",
        "   - दीर्घकालीन लाभ.",
        "",
        "👉 जैविक खेती धीरे-धीरे शुरू करें; मिश्रित तरीका भी अच्छा है."
      ].join("\n"),
      en: [
        "🌿 Organic farming:",
        "",
        "1) **Compost:**",
        "   - Mix cow dung, leaves, waste and keep for 2-3 months.",
        "   - Use 5-10 tons/hectare.",
        "",
        "2) **Organic pest control:**",
        "   - Neem oil: 2-3% spray.",
        "   - Cow urine: 5% solution.",
        "   - Ladybugs, beneficial insects.",
        "",
        "3) **Benefits:**",
        "   - Improves soil fertility.",
        "   - Environment-friendly.",
        "   - Long-term benefits.",
        "",
        "👉 Start organic farming gradually; mixed approach is also good."
      ].join("\n")
    }
  },
  {
    id: "seed-selection",
    tags: ["seed", "बीज", "वाण", "selection", "variety"],
    languages: {
      mr: [
        "🌱 बीज निवड:",
        "",
        "1) **गुणवत्ता तपासणी:**",
        "   - अधिकृत विक्रेत्याकडून खरेदी करा.",
        "   - अंकुरण दर 80%+ असावा.",
        "   - रोगमुक्त, स्वच्छ बीज.",
        "",
        "2) **वाण निवड:**",
        "   - स्थानिक हवामानास अनुकूल.",
        "   - रोगप्रतिरोधक वाण (उदा: गहू - PBW-725).",
        "   - उत्पादन क्षमता तपासा.",
        "",
        "3) **बीज उपचार:**",
        "   - Fungicide treatment (राज्य शिफारसीनुसार).",
        "   - Bio-fertilizer coating (Rhizobium for pulses).",
        "",
        "👉 चांगले बीज = चांगले उत्पादन; बचत करू नका."
      ].join("\n"),
      hi: [
        "🌱 बीज चयन:",
        "",
        "1) **गुणवत्ता जाँच:**",
        "   - अधिकृत विक्रेता से खरीदें.",
        "   - अंकुरण दर 80%+ होना चाहिए.",
        "   - रोग-मुक्त, साफ बीज.",
        "",
        "2) **किस्म चुनें:**",
        "   - स्थानीय मौसम के अनुकूल.",
        "   - रोग प्रतिरोधी किस्म (जैसे: गेहूं - PBW-725).",
        "   - उत्पादन क्षमता जाँचें.",
        "",
        "3) **बीज उपचार:**",
        "   - Fungicide treatment (राज्य सुझाव के अनुसार).",
        "   - Bio-fertilizer coating (दालों के लिए Rhizobium).",
        "",
        "👉 अच्छे बीज = अच्छा उत्पादन; बचत न करें."
      ].join("\n"),
      en: [
        "🌱 Seed selection:",
        "",
        "1) **Quality check:**",
        "   - Buy from authorized dealers.",
        "   - Germination rate should be 80%+.",
        "   - Disease-free, clean seeds.",
        "",
        "2) **Variety selection:**",
        "   - Suitable for local climate.",
        "   - Disease-resistant varieties (e.g., Wheat - PBW-725).",
        "   - Check yield potential.",
        "",
        "3) **Seed treatment:**",
        "   - Fungicide treatment (as per state recommendations).",
        "   - Bio-fertilizer coating (Rhizobium for pulses).",
        "",
        "👉 Good seeds = Good yield; don't compromise."
      ].join("\n")
    }
  },
  {
    id: "weather-based-advice",
    tags: ["weather", "हवामान", "मौसम", "rain", "drought"],
    languages: {
      mr: [
        "🌦️ हवामान-आधारित सल्ला:",
        "",
        "1) **पावसाळी हवामान:**",
        "   - निचरा व्यवस्था तपासा.",
        "   - रोगप्रतिरोधक वाण वापरा.",
        "   - पावसाआधी फवारणी करा.",
        "",
        "2) **दुष्काळ:**",
        "   - पाणी बचत करणारी पिके (बाजरी, ज्वारी).",
        "   - Mulching (पाने/कागद झाकण) पाणी राखते.",
        "   - ड्रिप सिंचन वापरा.",
        "",
        "3) **तापमान:**",
        "   - उन्हाळा: सकाळी/संध्याकाळी सिंचन.",
        "   - हिवाळा: दुपारी सिंचन.",
        "",
        "👉 हवामान अंदाज पाहून शेती नियोजन करा; Kisan Setu AI भविष्यात SageMaker Geospatial द्वारे हवामान चेतावणी देईल."
      ].join("\n"),
      hi: [
        "🌦️ मौसम-आधारित सलाह:",
        "",
        "1) **बारिश का मौसम:**",
        "   - निकास व्यवस्था जाँचें.",
        "   - रोग प्रतिरोधी किस्में उपयोग करें.",
        "   - बारिश से पहले स्प्रे करें.",
        "",
        "2) **सूखा:**",
        "   - पानी बचाने वाली फसलें (बाजरा, ज्वार).",
        "   - Mulching (पत्ते/कागज़ ढकना) पानी बचाता है.",
        "   - ड्रिप सिंचाई उपयोग करें.",
        "",
        "3) **तापमान:**",
        "   - गर्मी: सुबह/शाम सिंचाई.",
        "   - सर्दी: दोपहर सिंचाई.",
        "",
        "👉 मौसम पूर्वानुमान देखकर खेती योजना बनाएँ; Kisan Setu AI भविष्य में SageMaker Geospatial से मौसम चेतावनी देगा."
      ].join("\n"),
      en: [
        "🌦️ Weather-based advice:",
        "",
        "1) **Rainy season:**",
        "   - Check drainage system.",
        "   - Use disease-resistant varieties.",
        "   - Spray before rain.",
        "",
        "2) **Drought:**",
        "   - Water-saving crops (Pearl millet, Sorghum).",
        "   - Mulching (leaves/paper covering) saves water.",
        "   - Use drip irrigation.",
        "",
        "3) **Temperature:**",
        "   - Summer: Morning/evening irrigation.",
        "   - Winter: Afternoon irrigation.",
        "",
        "👉 Plan farming based on weather forecast; Kisan Setu AI will provide weather alerts via SageMaker Geospatial in future."
      ].join("\n")
    }
  },
  {
    id: "mandi-sell-advice",
    tags: ["sell", "विक्री", "बेचें", "store", "साठव", "timing"],
    languages: {
      mr: [
        "💰 विक्री किंवा साठवणूक - सल्ला:",
        "",
        "1) **लगेच विका जर:**",
        "   - किंमत उच्च आहे आणि पुढे घसरण्याची शक्यता.",
        "   - साठवणूक सुविधा नाही.",
        "   - पैसे लगेच गरजेचे.",
        "",
        "2) **साठवा जर:**",
        "   - किंमत कमी आहे, पुढे वाढण्याची शक्यता.",
        "   - चांगली साठवणूक सुविधा आहे.",
        "   - 2-3 महिने वाट पाहू शकता.",
        "",
        "3) **Mandi-Predictor (भविष्यात):**",
        "   - SageMaker time-series मॉडेल किंमत अंदाज देईल.",
        "   - 'आता विका' किंवा 'साठवा' सल्ला देईल.",
        "",
        "👉 सध्या स्थानिक मंडी किंमत तपासा; भविष्यात AI-आधारित अंदाज मिळेल."
      ].join("\n"),
      hi: [
        "💰 बेचें या स्टोर करें - सलाह:",
        "",
        "1) **तुरंत बेचें अगर:**",
        "   - कीमत ऊँची है और आगे गिरने की संभावना.",
        "   - भंडारण सुविधा नहीं है.",
        "   - पैसे तुरंत ज़रूरी हैं.",
        "",
        "2) **स्टोर करें अगर:**",
        "   - कीमत कम है, आगे बढ़ने की संभावना.",
        "   - अच्छी भंडारण सुविधा है.",
        "   - 2-3 महीने इंतज़ार कर सकते हैं.",
        "",
        "3) **Mandi-Predictor (भविष्य में):**",
        "   - SageMaker time-series मॉडल कीमत अनुमान देगा.",
        "   - 'अभी बेचें' या 'स्टोर करें' सलाह देगा.",
        "",
        "👉 अभी स्थानीय मंडी कीमत जाँचें; भविष्य में AI-आधारित अनुमान मिलेगा."
      ].join("\n"),
      en: [
        "💰 Sell or Store - Advice:",
        "",
        "1) **Sell immediately if:**",
        "   - Price is high and likely to fall.",
        "   - No storage facility available.",
        "   - Immediate cash needed.",
        "",
        "2) **Store if:**",
        "   - Price is low, likely to rise.",
        "   - Good storage facility available.",
        "   - Can wait 2-3 months.",
        "",
        "3) **Mandi-Predictor (future):**",
        "   - SageMaker time-series model will predict prices.",
        "   - Will advise 'Sell now' or 'Store'.",
        "",
        "👉 Check local mandi prices now; AI-based predictions will be available in future."
      ].join("\n")
    }
  },
  {
    id: "pm-kisan-details",
    tags: ["pm-kisan", "pm kisan", "पीएम किसान", "direct benefit"],
    languages: {
      mr: [
        "🏛️ PM-KISAN योजना तपशील:",
        "",
        "1) **पात्रता:**",
        "   - सर्व जमीनधारक शेतकरी (सीमांत ते मोठे).",
        "   - वय 18+ वर्षे.",
        "",
        "2) **लाभ:**",
        "   - ₹६,०००/वर्ष (3 हप्त्यांमध्ये: ₹२,००० प्रत्येकी).",
        "   - थेट बँक खात्यात.",
        "",
        "3) **अर्ज कसा करावा:**",
        "   - https://pmkisan.gov.in वर ऑनलाइन.",
        "   - कृषी सेवा केंद्रातून.",
        "",
        "4) **Kisan Setu AI काय करेल?**",
        "   - तुमच्या प्रोफाइलवरून स्वयंचलित पात्रता तपासेल.",
        "   - WhatsApp द्वारे स्मरणपत्र पाठवेल.",
        "",
        "👉 अधिकृत पोर्टलवरून अर्ज करा; Kisan Setu AI तुम्हाला योग्य योजना सुचवेल."
      ].join("\n"),
      hi: [
        "🏛️ PM-KISAN योजना विवरण:",
        "",
        "1) **पात्रता:**",
        "   - सभी जमीनधारक किसान (सीमांत से बड़े).",
        "   - उम्र 18+ वर्ष.",
        "",
        "2) **लाभ:**",
        "   - ₹६,०००/वर्ष (3 किस्तों में: ₹२,००० प्रत्येक).",
        "   - सीधे बैंक खाते में.",
        "",
        "3) **आवेदन कैसे करें:**",
        "   - https://pmkisan.gov.in पर ऑनलाइन.",
        "   - कृषि सेवा केंद्र से.",
        "",
        "4) **Kisan Setu AI क्या करेगा?**",
        "   - आपकी प्रोफाइल से स्वचालित पात्रता जाँचेगा.",
        "   - WhatsApp से याद दिलाएगा.",
        "",
        "👉 अधिकृत पोर्टल से आवेदन करें; Kisan Setu AI आपको उपयुक्त योजनाएँ सुझाएगा."
      ].join("\n"),
      en: [
        "🏛️ PM-KISAN Scheme Details:",
        "",
        "1) **Eligibility:**",
        "   - All landholding farmers (marginal to large).",
        "   - Age 18+ years.",
        "",
        "2) **Benefits:**",
        "   - ₹6,000/year (in 3 installments: ₹2,000 each).",
        "   - Direct to bank account.",
        "",
        "3) **How to apply:**",
        "   - Online at https://pmkisan.gov.in",
        "   - Through agriculture service center.",
        "",
        "4) **What will Kisan Setu AI do?**",
        "   - Auto-check eligibility from your profile.",
        "   - Send reminders via WhatsApp.",
        "",
        "👉 Apply through official portal; Kisan Setu AI will suggest suitable schemes for you."
      ].join("\n")
    }
  }
];

function detectEntry(question: string): MockEntry | null {
  const q = question.toLowerCase();

  // If the question clearly mentions Soil Health Card, prioritize that entry
  const soilKeywords = [
    "soil health card",
    "soil card",
    "मृदा आरोग्य",
    "मृदा आरोग्य कार्ड",
    "मिट्टी स्वास्थ्य",
    "मिट्टी स्वास्थ्य कार्ड"
  ];

  if (soilKeywords.some((k) => q.includes(k.toLowerCase()))) {
    const soilEntry = MOCK_ENTRIES.find((e) => e.id === "soil-health-card");
    if (soilEntry) return soilEntry;
  }

   // If the question is about mandi prices / market rates, prioritize that entry
  const mandiKeywords = [
    "mandi",
    "price",
    "rate",
    "market",
    "भाव",
    "किंमत",
    "बाजार",
    "current market",
    "current price",
    "current rates",
    "market trend",
    "market trends"
  ];

  if (mandiKeywords.some((k) => q.includes(k.toLowerCase()))) {
    const mandiEntry =
      MOCK_ENTRIES.find((e) => e.id === "mandi-prices") ||
      MOCK_ENTRIES.find((e) => e.id === "mandi-sell-advice");
    if (mandiEntry) return mandiEntry;
  }

  for (const entry of MOCK_ENTRIES) {
    if (entry.tags.some((t) => q.includes(t.toLowerCase()))) {
      return entry;
    }
  }
  return null;
}

export function getMockAnswer(question: string, language: Lang = "en"): string {
  const entry = detectEntry(question);
  const langKey: Lang = language || "en";

  if (entry) {
    const text = entry.languages[langKey] || entry.languages.en || "";
    if (text) {
      return text;
    }
  }

  // Fallback generic answer
  if (langKey === "mr") {
    return [
      "ही सध्या डेमो प्रतिक्रिया आहे. तुमचा प्रश्न आम्ही नोंदवला आहे.",
      "लवकरच हा एजंट Bedrock + RAG वर चालणाऱ्या प्रत्यक्ष कृषी ज्ञानभांडाराशी जोडला जाईल."
    ].join("\n");
  }

  if (langKey === "hi") {
    return [
      "यह फिलहाल एक डेमो जवाब है. आपका सवाल हमने नोट कर लिया है.",
      "जल्द ही यह एजेंट Bedrock + RAG आधारित असली कृषि ज्ञानभंडार से जुड़ जाएगा."
    ].join("\n");
  }

  return [
    "This is a demo response. Your question has been noted.",
    "Soon this agent will be connected to a real agricultural knowledge base powered by Bedrock + RAG."
  ].join("\n");
}

