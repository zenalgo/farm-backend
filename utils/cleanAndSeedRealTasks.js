require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const WorkTask = require("../models/WorkTask");
const WorkCategory = require("../models/WorkCategory");
const User = require("../models/User");

const realCategories = [
  "पोल्ट्री दाना और पानी (Poultry Feeding & Water)",
  "अंडा एकत्रीकरण और पैकिंग (Egg Collection & Packing)",
  "शेड सफाई और सैनिटेशन (Shed Cleaning & Sanitation)",
  "पशु चारा और देखभाल (Livestock & Cattle Care)",
  "टीकाकरण और दवाई (Vaccination & Medication)",
  "खेत सिंचाई और रखरखाव (Field Irrigation & Maintenance)",
  "दाना मिक्सिंग और स्टॉक (Feed Mixing & Stock)",
  "General Farm Work",
];

const run = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB.");

    // 1. Delete all old milking and cropping tasks
    const deleteResult = await WorkTask.deleteMany({
      $or: [
        { category: { $regex: /milking|crop/i } },
        { title: { $regex: /milking|crop/i } },
        { notes: { $regex: /milking|crop/i } },
        { category: "Consolidate milk" },
        { category: "Weigh milk" },
        { category: "Weigh & record milk" },
        { category: "Prepare first buffaloes" },
        { category: "Finish remaining buffaloes" },
        { category: "Start milking – Station A" },
        { category: "Check milking equipment" },
        { category: "Clean milking equipment" },
        { category: "Final milking checks" },
        { category: "Continue milking" },
        { category: "Cropping" },
        { category: "Milking" },
      ],
    });
    console.log(`Deleted ${deleteResult.deletedCount} old milking/cropping tasks.`);

    // 2. Remove Milking and Cropping from WorkCategory
    await WorkCategory.deleteMany({
      name: { $in: ["Milking", "Cropping", "milking", "cropping"] },
    });
    console.log("Removed Milking and Cropping from WorkCategory.");

    // 3. Upsert real farm work categories
    for (const name of realCategories) {
      await WorkCategory.findOneAndUpdate(
        { name },
        { $set: { name, isDefault: true, createdBy: null } },
        { upsert: true }
      );
    }
    console.log("Real categories seeded in WorkCategory collection.");

    // 4. Fetch workers and manager
    const manager = await User.findOne({ role: "manager_operations" });
    const workers = await User.find({ role: "worker" });
    console.log(`Found Manager: ${manager ? manager.name : "None"}, Workers count: ${workers.length}`);

    // Map workers by name
    const kailash = workers.find((w) => w.name.toLowerCase().includes("kailash")) || workers[0];
    const mukesh = workers.find((w) => w.name.toLowerCase().includes("mukesh")) || workers[1];
    const arvind = workers.find((w) => w.name.toLowerCase().includes("arvind")) || workers[2];
    const ramkumar = workers.find((w) => w.name.toLowerCase().includes("ramkumar")) || workers[3];
    const ashok = workers.find((w) => w.name.toLowerCase().includes("ashok")) || workers[4];

    // Today's date (midnight UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Realistic Dewals Farm daily tasks to seed
    const newTasks = [
      {
        title: "Morning Poultry Feeding (Shed 1 & 2)",
        category: "पोल्ट्री दाना और पानी (Poultry Feeding & Water)",
        notes: "Flock 2 LAYER को सुबह 6:00 बजे 120 ग्राम प्रति पक्षी दाना और स्वच्छ पानी भरें।",
        assignedTo: kailash ? kailash._id : null,
        timeLabel: "06:00 AM - 08:00 AM",
        date: today,
        status: "assigned",
        createdBy: manager ? manager._id : null,
      },
      {
        title: "Egg Collection & Tray Grading",
        category: "अंडा एकत्रीकरण और पैकिंग (Egg Collection & Packing)",
        notes: "अंडे एकत्र करके 30-अंडों वाली ट्रे में ग्रेडिंग करें और क्रैक अंडे अलग रखें।",
        assignedTo: mukesh ? mukesh._id : null,
        timeLabel: "08:00 AM - 10:00 AM",
        date: today,
        status: "in_progress",
        createdBy: manager ? manager._id : null,
      },
      {
        title: "Cattle Shed Cleaning & Dung Removal",
        category: "शेड सफाई और सैनिटेशन (Shed Cleaning & Sanitation)",
        notes: "मुर्रा भैंसों और गायों के शेड का गोबर हटाकर पानी से फर्श धोएं और चूना छिड़कें।",
        assignedTo: arvind ? arvind._id : null,
        timeLabel: "07:00 AM - 09:00 AM",
        date: today,
        status: "assigned",
        createdBy: manager ? manager._id : null,
      },
      {
        title: "Green Fodder & Cattle Ration Distribution",
        category: "पशु चारा और देखभाल (Livestock & Cattle Care)",
        notes: "हरा चारा कुट्टी मशीन से काटकर साइलो फीड के साथ मिलाकर सभी पशुओं को दें।",
        assignedTo: ramkumar ? ramkumar._id : null,
        timeLabel: "09:00 AM - 11:00 AM",
        date: today,
        status: "assigned",
        createdBy: manager ? manager._id : null,
      },
      {
        title: "Farm Boundary Inspection & Water Pump Check",
        category: "खेत सिंचाई और रखरखाव (Field Irrigation & Maintenance)",
        notes: "ट्यूबवेल मोटर चालू करके मुख्य खेत में पानी दें और बाउंड्री फेंसिंग चेक करें।",
        assignedTo: ashok ? ashok._id : null,
        timeLabel: "10:00 AM - 12:00 PM",
        date: today,
        status: "assigned",
        createdBy: manager ? manager._id : null,
      },
      {
        title: "Afternoon Feed Mixing & Silo Refill",
        category: "दाना मिक्सिंग और स्टॉक (Feed Mixing & Stock)",
        notes: "मक्का, सोया और मिनरल मिक्स को मिक्सर में चलाकर साइलो A में रीफिल करें।",
        assignedTo: kailash ? kailash._id : null,
        timeLabel: "02:00 PM - 04:00 PM",
        date: today,
        status: "assigned",
        createdBy: manager ? manager._id : null,
      },
      {
        title: "Evening Egg Collection & Record Entry",
        category: "अंडा एकत्रीकरण और पैकिंग (Egg Collection & Packing)",
        notes: "शाम का अंडा एकत्रीकरण और रजिस्टर में कुल संख्या दर्ज करें।",
        assignedTo: mukesh ? mukesh._id : null,
        timeLabel: "04:00 PM - 06:00 PM",
        date: today,
        status: "assigned",
        createdBy: manager ? manager._id : null,
      },
      {
        title: "Brooder Temperature & Night Ventilation Check",
        category: "पोल्ट्री दाना और पानी (Poultry Feeding & Water)",
        notes: "रात के लिए ब्रूडर का तापमान 32°C और कर्टन वेंटिलेशन सेट करें।",
        assignedTo: arvind ? arvind._id : null,
        timeLabel: "06:00 PM - 07:30 PM",
        date: today,
        status: "assigned",
        createdBy: manager ? manager._id : null,
      },
    ];

    for (const t of newTasks) {
      await WorkTask.create(t);
    }
    console.log(`Created ${newTasks.length} real Dewals Farm tasks for today.`);

    const remainingTasks = await WorkTask.find({}).populate("assignedTo", "name");
    console.log(`Total active tasks in database now: ${remainingTasks.length}`);
    remainingTasks.slice(0, 10).forEach((t) => {
      console.log(`- [${t.date ? t.date.toISOString().slice(0, 10) : "No Date"}] ${t.title || t.category} -> ${t.assignedTo ? t.assignedTo.name : "Unassigned"} (${t.status})`);
    });

    process.exit(0);
  } catch (err) {
    console.error("Cleanup & seed failed:", err);
    process.exit(1);
  }
};

run();
