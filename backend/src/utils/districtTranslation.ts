/**
 * Translate district names from Marathi/Hindi/regional languages to English
 * Covers major districts across India
 */
export function translateDistrictToEnglish(district: string): string {
  const districtTranslations: Record<string, string> = {
    // Maharashtra - Marathi
    "नाशिक": "nashik",
    "पुणे": "pune",
    "मुंबई": "mumbai",
    "ठाणे": "thane",
    "नागपूर": "nagpur",
    "औरंगाबाद": "aurangabad",
    "सोलापूर": "solapur",
    "अमरावती": "amravati",
    "कोल्हापूर": "kolhapur",
    "सांगली": "sangli",
    "सातारा": "satara",
    "अहमदनगर": "ahmednagar",
    "जळगाव": "jalgaon",
    "लातूर": "latur",
    "धुळे": "dhule",
    "नांदेड": "nanded",
    "परभणी": "parbhani",
    "यवतमाळ": "yavatmal",
    "अकोला": "akola",
    "वर्धा": "wardha",
    "भंडारा": "bhandara",
    "गोंदिया": "gondia",
    "चंद्रपूर": "chandrapur",
    "गडचिरोली": "gadchiroli",
    "रायगड": "raigad",
    "रत्नागिरी": "ratnagiri",
    "सिंधुदुर्ग": "sindhudurg",
    
    // Uttar Pradesh - Hindi
    "लखनऊ": "lucknow",
    "कानपुर": "kanpur",
    "आगरा": "agra",
    "वाराणसी": "varanasi",
    "मेरठ": "meerut",
    "इलाहाबाद": "allahabad",
    "प्रयागराज": "prayagraj",
    "गोरखपुर": "gorakhpur",
    "बरेली": "bareilly",
    "अलीगढ़": "aligarh",
    "मुरादाबाद": "moradabad",
    "सहारनपुर": "saharanpur",
    "गाजियाबाद": "ghaziabad",
    "नोएडा": "noida",
    "फैजाबाद": "faizabad",
    "अयोध्या": "ayodhya",
    
    // Madhya Pradesh - Hindi
    "भोपाल": "bhopal",
    "इंदौर": "indore",
    "जबलपुर": "jabalpur",
    "ग्वालियर": "gwalior",
    "उज्जैन": "ujjain",
    "सागर": "sagar",
    "देवास": "dewas",
    "सतना": "satna",
    "रतलाम": "ratlam",
    
    // Rajasthan - Hindi
    "जयपुर": "jaipur",
    "जोधपुर": "jodhpur",
    "उदयपुर": "udaipur",
    "कोटा": "kota",
    "बीकानेर": "bikaner",
    "अजमेर": "ajmer",
    "भरतपुर": "bharatpur",
    "अलवर": "alwar",
    
    // Gujarat - Hindi
    "अहमदाबाद": "ahmedabad",
    "सूरत": "surat",
    "वडोदरा": "vadodara",
    "राजकोट": "rajkot",
    "भावनगर": "bhavnagar",
    
    // Punjab - Hindi
    "लुधियाना": "ludhiana",
    "अमृतसर": "amritsar",
    "जालंधर": "jalandhar",
    "पटियाला": "patiala",
    
    // Haryana - Hindi
    "फरीदाबाद": "faridabad",
    "गुड़गांव": "gurgaon",
    "गुरुग्राम": "gurugram",
    "रोहतक": "rohtak",
    "हिसार": "hisar",
    "पानीपत": "panipat",
    "करनाल": "karnal",
    
    // Bihar - Hindi
    "पटना": "patna",
    "गया": "gaya",
    "भागलपुर": "bhagalpur",
    "मुजफ्फरपुर": "muzaffarpur",
    "दरभंगा": "darbhanga",
    
    // West Bengal - Hindi
    "कोलकाता": "kolkata",
    "हावड़ा": "howrah",
    "दुर्गापुर": "durgapur",
    "आसनसोल": "asansol",
    "सिलीगुड़ी": "siliguri",
    
    // Karnataka - Hindi
    "बेंगलुरु": "bengaluru",
    "बैंगलोर": "bangalore",
    "मैसूर": "mysore",
    "हुबली": "hubli",
    "मंगलुरु": "mangalore",
    
    // Tamil Nadu - Hindi
    "चेन्नई": "chennai",
    "कोयंबटूर": "coimbatore",
    "मदुरै": "madurai",
    "तिरुचिरापल्ली": "tiruchirappalli",
    "सलेम": "salem",
    
    // Telangana - Hindi
    "हैदराबाद": "hyderabad",
    "वारंगल": "warangal",
    "निजामाबाद": "nizamabad",
    "करीमनगर": "karimnagar",
    
    // Andhra Pradesh - Hindi
    "विशाखापत्तनम": "visakhapatnam",
    "विजयवाड़ा": "vijayawada",
    "गुंटूर": "guntur",
    "नेल्लोर": "nellore",
    "तिरुपति": "tirupati",
  };
  
  // Convert to lowercase for case-insensitive matching
  const lowerDistrict = district.toLowerCase().trim();
  
  // Check if translation exists
  if (districtTranslations[lowerDistrict]) {
    return districtTranslations[lowerDistrict];
  }
  
  // If no translation found, return original (might already be in English)
  return lowerDistrict;
}
