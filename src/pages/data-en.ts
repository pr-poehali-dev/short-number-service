import { Operator } from "./data";

export interface PhoneNumberEn {
  id: number;
  name: string;
  description: string;
  procedure?: string;
}

export const NUMBERS_EN_DEFAULT: PhoneNumberEn[] = [
  { id: 1,  name: "Emergency Services",           description: "Single emergency call number. Works free from all phones, including without a SIM card.", procedure: "Free call. Available without registration and even without a SIM card." },
  { id: 2,  name: "Fire Department / EMERCOM",    description: "Call fire service and EMERCOM. Reports fires and emergency situations.", procedure: "Free from all operators and landline phones." },
  { id: 3,  name: "Police",                       description: "Call the police. For reporting offenses, crimes, and incidents.", procedure: "Free from all operators." },
  { id: 4,  name: "Ambulance",                    description: "Call emergency medical service. Accepts calls 24/7.", procedure: "Free from all operators, including while roaming." },
  { id: 5,  name: "Gas Emergency Service",        description: "Emergency gas service. In case of gas leak or smell of gas indoors.", procedure: "Free from all operators and landline phones." },
  { id: 6,  name: "MTS Support",                  description: "MTS contact center. Help with tariffs, services, and technical support.", procedure: "Free only from MTS number. From other operators — standard rate." },
  { id: 7,  name: "Beeline Support",              description: "Beeline contact center. Information about tariffs, services, and settings.", procedure: "Free from Beeline numbers. From others — standard rate." },
  { id: 8,  name: "MegaFon Support",              description: "MegaFon contact center. Consultations on services, tariffs, and balance.", procedure: "Free from MegaFon numbers." },
  { id: 9,  name: "T2 Support",                   description: "T2 (Tele2) contact center. Customer support on services and tariffs.", procedure: "Free from T2 numbers." },
  { id: 10, name: "MTS IVR",                      description: "MTS voice menu: balance, itemized bill, blocking, tariff information.", procedure: "Free from MTS numbers." },
  { id: 11, name: "Beeline IVR",                  description: "Check balance, manage services and subscriptions through voice menu.", procedure: "Free from Beeline numbers." },
  { id: 12, name: "MTS SIM Block",                description: "Emergency SIM card blocking for MTS in case of loss or theft.", procedure: "Available from any phone. Passport details of the owner required." },
  { id: 13, name: "MTS Support (from other networks)", description: "Free call to MTS support from other operator phones.", procedure: undefined },
  { id: 14, name: "Children's Helpline",          description: "Free psychological help for children and teenagers. Works 24/7, anonymously.", procedure: "Free, anonymous. Available from all operators." },
  { id: 15, name: "Doctor Appointment / EMIAS",   description: "Single number for doctor appointments and medical institution information.", procedure: "Free. Available in most regions of Russia." },
  { id: 16, name: "Children's Helpline (Federal)", description: "Federal children's helpline. Free, anonymous, 24/7.", procedure: undefined },
  { id: 17, name: "MegaFon IVR",                  description: "Automatic balance check, tariff plan and connected MegaFon services.", procedure: "Free from MegaFon numbers." },
  { id: 18, name: "T2 IVR",                       description: "T2 voice menu: balance, tariff, service management.", procedure: "Free from T2 numbers." },
  { id: 19, name: "Sberbank",                     description: "Sberbank support. Questions about cards, accounts, blocks, and fraud.", procedure: "Available from all smartphones for free. Also accessible from landline." },
  { id: 20, name: "VTB",                          description: "VTB Bank support. Consultations on products, cards, and transactions.", procedure: "Available from all smartphones for free. Also accessible from landline." },
  { id: 21, name: "Aeroflot",                     description: "Aeroflot information center. Booking, check-in, flight information.", procedure: "Available from all smartphones." },
  { id: 22, name: "Raiffeisen Bank",              description: "Raiffeisen Bank hotline. Customer support for banking services.", procedure: "Available from all smartphones." },
  { id: 23, name: "METRO Cash&Carry",             description: "METRO retail chain customer support.", procedure: "Available from all smartphones." },
  { id: 24, name: "L'Etoile",                     description: "L'Etoile perfume and cosmetics chain hotline.", procedure: "Available from all smartphones." },
  { id: 25, name: "Avtodor",                      description: "Avtodor information service. Toll roads and transponder questions.", procedure: "Available from all smartphones." },
  { id: 26, name: "Gazprombank",                  description: "Gazprombank support. Cards, loans, and deposits consultations.", procedure: "Available from all smartphones." },
];

export const STORAGE_KEY_EN = "admin_numbers_en_v1";

export function loadNumbersEn(): PhoneNumberEn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EN);
    if (raw) return JSON.parse(raw) as PhoneNumberEn[];
  } catch (e) {
    console.warn("loadNumbersEn error", e);
  }
  return NUMBERS_EN_DEFAULT;
}

export function saveNumbersEn(nums: PhoneNumberEn[]) {
  localStorage.setItem(STORAGE_KEY_EN, JSON.stringify(nums));
}

export const FAQ_ITEMS_EN = [
  {
    q: "What are short numbers?",
    a: "Short numbers are abbreviated phone numbers for quick dialing of important services: emergency, operator support, government services. They are easier to remember and faster to dial.",
  },
  {
    q: "Can I call from any phone?",
    a: "Universal numbers (112, 101, 102, 103, 104) are available from all phones and operators, even without a SIM card. Numbers of specific operators work only within their own network unless otherwise stated.",
  },
  {
    q: "Are short number calls paid?",
    a: "Emergency and social numbers are always free. Operator support numbers are free when calling from that operator's number. Check the tariff in each number's card.",
  },
  {
    q: "How to get your own short number for business?",
    a: "You need to contact Roskomnadzor or a telecom operator. The Procedures section contains detailed instructions for each type of number.",
  },
  {
    q: "Why are some numbers unavailable while roaming?",
    a: "Operator short numbers (support, balance) may not be available in international roaming. Emergency number 112 works in most countries worldwide.",
  },
];

export const PROCEDURES_EN = [
  {
    icon: "Building2",
    title: "Getting a Number via Roskomnadzor",
    steps: [
      "Prepare a document package: incorporation documents, service description",
      "Submit an application at the Roskomnadzor website or through MFC",
      "Wait for review — up to 30 business days",
      "Receive the permit and connect the number through an operator",
    ],
    time: "30–60 days",
    cost: "State fee",
  },
  {
    icon: "Phone",
    title: "Corporate Number via Operator",
    steps: [
      "Contact the corporate department of a telecom operator",
      "Provide legal entity documents",
      "Choose a number type from available options",
      "Sign the contract and activate the number",
    ],
    time: "3–10 days",
    cost: "Operator tariffs",
  },
  {
    icon: "ShieldCheck",
    title: "SIM Blocking and Recovery",
    steps: [
      "Call the emergency blocking number of your operator",
      "Provide your passport details for identification",
      "Receive blocking confirmation",
      "For recovery — visit operator office with your passport",
    ],
    time: "Instantly / 1–3 days",
    cost: "Free",
  },
];

export const OPERATOR_MAP_EN: Record<string, string> = {
  "МТС": "MTS",
  "Билайн": "Beeline",
  "МегаФон": "MegaFon",
  "Т2": "T2",
  "Универсальный": "Universal",
  "Коммерческий": "Commercial",
};

export const CATEGORY_MAP_EN: Record<string, string> = {
  "Экстренные": "Emergency",
  "Поддержка": "Support",
  "Автоинформатор": "IVR",
  "Безопасность": "Security",
  "Социальные": "Social",
  "Здоровье": "Health",
  "Коммерческие": "Commercial",
};

export const INDUSTRY_MAP_EN: Record<string, string> = {
  "Банк": "Bank",
  "Транспорт": "Transport",
  "Торговля": "Retail",
  "Страхование": "Insurance",
  "Медицина": "Healthcare",
  "Государственные": "Government",
  "Другое": "Other",
};
