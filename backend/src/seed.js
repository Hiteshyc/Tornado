/**
 * Seed Script — populates MongoDB with initial Alerts, Announcements, and SafetyGuides.
 *
 * Run with:  node src/seed.js
 *
 * WARNING: This will wipe existing Alerts, Announcements, and SafetyGuides before inserting.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import Alert from "./models/Alert.js";
import Announcement from "./models/Announcement.js";
import SafetyGuide from "./models/SafetyGuide.js";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URI_LOGIN;

// ── Seed data ─────────────────────────────────────────────────────────────────

const alertsData = [
  {
    title: "Cyclone Vayu — Category 3",
    severity: "high",
    location: "Panaji, Goa",
    coordinates: { type: "Point", coordinates: [73.8278, 15.4909] },
    expectedHours: 4,
    action: "Evacuate to designated shelters immediately",
  },
  {
    title: "Storm Surge Alert",
    severity: "critical",
    location: "Sindhudurg Coast",
    coordinates: { type: "Point", coordinates: [73.62, 15.85] },
    expectedHours: 2,
    action: "All coastal areas must evacuate. Move 5 km inland.",
  },
  {
    title: "Flood Warning — Mandovi River",
    severity: "moderate",
    location: "Ponda, Goa",
    coordinates: { type: "Point", coordinates: [73.97, 15.22] },
    expectedHours: 8,
    action: "Avoid low-lying areas. Monitor official updates.",
  },
  {
    title: "High Tide Advisory",
    severity: "low",
    location: "Ratnagiri District",
    coordinates: { type: "Point", coordinates: [73.58, 16.05] },
    expectedHours: 3,
    action: "Stay informed. Avoid beach activities.",
  },
  {
    title: "Lightning Risk Zone",
    severity: "moderate",
    location: "Vasco da Gama, Goa",
    coordinates: { type: "Point", coordinates: [73.73, 15.55] },
    expectedHours: 6,
    action: "Seek shelter indoors. Avoid open areas.",
  },
];

const announcementsData = [
  {
    agency: "IMD — India Meteorological Department",
    badge: "WEATHER",
    title: "Cyclone Vayu: Red Alert for Goa & Konkan Coast",
    body: "Cyclone Vayu expected to make landfall between Veraval and Diu coast with wind speeds of 115–125 km/h. All fishermen advised to return to port immediately. Coastal districts should take precautionary measures and remain indoors.",
    priority: "critical",
  },
  {
    agency: "NDRF — National Disaster Response Force",
    badge: "RESPONSE",
    title: "12 NDRF Teams Deployed Along Konkan Coast",
    body: "NDRF has deployed 12 teams in Maharashtra and 4 in Goa. Coordination centers established at Ratnagiri and Panaji. Call 1078 to request rescue. Teams are equipped with boats, medical supplies, and communication systems.",
    priority: "high",
  },
  {
    agency: "Goa State Disaster Management Authority",
    badge: "EVACUATION",
    title: "Mandatory Evacuation: North Goa Coastal Villages",
    body: "Residents of Calangute, Baga, Anjuna, and Vagator must evacuate to designated shelters immediately. Buses available at village panchayat offices from 6 AM. Carry essential documents, medicines, and phone chargers.",
    priority: "high",
  },
  {
    agency: "Indian Coast Guard",
    badge: "MARITIME",
    title: "Port Closure: All Goa Ports Closed Until Further Notice",
    body: "Mormugao Port Trust and Panaji jetty are closed for all maritime operations. All vessels must seek safe anchorage. Violators will be penalized under the Disaster Management Act, 2005.",
    priority: "moderate",
  },
  {
    agency: "Ministry of Health & Family Welfare",
    badge: "HEALTH",
    title: "Emergency Medical Camps at 8 Locations",
    body: "Emergency medical camps have been set up at Panaji Civil Hospital, Margao District Hospital, and 6 community centers. Free treatment, medicines, and meals are available. Ambulances on standby at all locations.",
    priority: "moderate",
  },
];

const safetyGuidesData = [
  {
    key: "cyclone", title: "Cyclone Safety", icon: "🌀", order: 0,
    dos: [
      "Stay indoors and away from windows",
      "Keep emergency kit ready (water, food, medicines)",
      "Follow evacuation orders from authorities immediately",
      "Charge all devices; back up important documents",
      "Monitor updates on AIR and Doordarshan",
      "Board up windows and secure loose objects outdoors",
    ],
    donts: [
      "Don't ignore cyclone warnings or advisories",
      "Don't go outdoors during the storm",
      "Don't use electrical appliances during flooding",
      "Don't spread unverified information on social media",
      "Don't return home until all-clear is officially issued",
    ],
  },
  {
    key: "flood", title: "Flood Safety", icon: "🌊", order: 1,
    dos: [
      "Move to higher ground immediately when warned",
      "Disconnect all electrical appliances at the mains",
      "Keep important documents in waterproof bags",
      "Follow designated evacuation routes only",
      "Help neighbors, especially elderly and disabled",
    ],
    donts: [
      "Don't walk through moving floodwater (6 inches can knock you down)",
      "Don't drive through flooded roads",
      "Don't touch electrical equipment near water",
      "Don't return until authorities confirm it's safe",
    ],
  },
  {
    key: "tsunami", title: "Tsunami Safety", icon: "⚠️", order: 2,
    dos: [
      "Move inland and to higher ground (30m+) immediately",
      "Follow tsunami evacuation signs and routes",
      "Stay away from the coast until official all-clear",
      "Help the elderly and disabled evacuate",
      "Listen to official emergency broadcasts",
    ],
    donts: [
      "Don't go to the coast to watch the tsunami",
      "Don't return after the first wave — more follow",
      "Don't rely on visual signs alone; act on warnings",
      "Don't use elevators during evacuation",
    ],
  },
  {
    key: "stormsurge", title: "Storm Surge", icon: "🌪️", order: 3,
    dos: [
      "Evacuate coastal and low-lying areas immediately",
      "Move to sturdy multi-story buildings away from coast",
      "Keep emergency supplies on upper floors",
      "Monitor NDMA alerts constantly",
    ],
    donts: [
      "Don't underestimate water surge speed and force",
      "Don't shelter in mobile homes or beachfront structures",
      "Don't try to drive through surge waters",
    ],
  },
  {
    key: "hightide", title: "High Tide", icon: "🌅", order: 4,
    dos: [
      "Stay away from beaches and rocky shores",
      "Secure boats and watercraft",
      "Keep children away from waterfront areas",
      "Monitor official tide predictions and advisories",
    ],
    donts: [
      "Don't swim or wade during high tide alerts",
      "Don't fish from exposed rocks or jetties",
      "Don't park vehicles near the shoreline",
      "Don't ignore beach closure or warning signs",
    ],
  },
  {
    key: "lightning", title: "Lightning Safety", icon: "⚡", order: 5,
    dos: [
      "Seek shelter in a sturdy building or vehicle",
      "Unplug electronic devices and appliances",
      "Stay away from tall isolated trees",
      "If caught outdoors, crouch low — avoid open areas",
    ],
    donts: [
      "Don't stand under trees during thunderstorms",
      "Don't use wired phones or electrical equipment",
      "Don't swim or be near water bodies",
      "Don't shelter under isolated tall structures",
    ],
  },
  {
    key: "heatwave", title: "Heatwave Safety", icon: "☀️", order: 6,
    dos: [
      "Stay indoors during peak heat hours (12 PM – 4 PM)",
      "Drink plenty of water even if not thirsty",
      "Wear light-colored, loose-fitting clothing",
      "Check on elderly neighbors and vulnerable people",
    ],
    donts: [
      "Don't leave children or pets in parked vehicles",
      "Don't consume alcohol or caffeinated beverages",
      "Don't exercise outdoors during peak heat",
      "Don't ignore symptoms of heat exhaustion",
    ],
  },
  {
    key: "evacuation", title: "Evacuation Guide", icon: "🚶", order: 7,
    dos: [
      "Follow official evacuation orders without delay",
      "Take essential items: documents, medicines, charger",
      "Notify a family member of your destination",
      "Follow designated routes only — avoid shortcuts",
      "Help neighbors, especially the elderly and children",
    ],
    donts: [
      "Don't delay evacuation waiting for more information",
      "Don't use unofficial roads or routes",
      "Don't return to the evacuated area prematurely",
      "Don't bring non-essential belongings that slow you down",
    ],
  },
];

// ── Run seed ──────────────────────────────────────────────────────────────────

import dns from "dns";

async function seed() {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Wipe existing data
    await Alert.deleteMany({});
    await Announcement.deleteMany({});
    await SafetyGuide.deleteMany({});
    console.log("🗑️  Cleared existing Alerts, Announcements, SafetyGuides");

    // Insert fresh seed data
    await Alert.insertMany(alertsData);
    console.log(`📢  Inserted ${alertsData.length} alerts`);

    await Announcement.insertMany(announcementsData);
    console.log(`📣  Inserted ${announcementsData.length} announcements`);

    await SafetyGuide.insertMany(safetyGuidesData);
    console.log(`📖  Inserted ${safetyGuidesData.length} safety guides`);

    console.log("\n🌱 Seed complete!");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
