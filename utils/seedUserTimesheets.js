require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const WorkTask = require("../models/WorkTask");
const User = require("../models/User");

const seedTimesheets = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB.");

    // Fetch all 6 target staff members
    const users = await User.find({
      mobile: {
        $in: [
          "9510680921", // Madhav
          "9109177084", // Kailash
          "8269755638", // Mukesh
          "9329349984", // Arvind
          "9000000001", // Ramkumar
          "9000000002", // Ashok kumar
        ],
      },
    });

    const userMap = {};
    users.forEach((u) => {
      userMap[u.mobile] = u;
    });

    const madhav = userMap["9510680921"];
    const kailash = userMap["9109177084"];
    const mukesh = userMap["8269755638"];
    const arvind = userMap["9329349984"];
    const ramkumar = userMap["9000000001"];
    const ashok = userMap["9000000002"];

    if (!madhav || !kailash) {
      console.error("Missing users! Found:", users.map((u) => `${u.name} (${u.mobile})`));
      process.exit(1);
    }

    // Target today and tomorrow so timesheet is active
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timesheetData = [
      // 1. Madhav (Manager)
      {
        user: madhav,
        slot: "07:00 AM - 08:00 AM",
        category: "General Farm Work",
        title: "Daily Staff Morning Briefing & Shift Allocation",
        notes: "सभी 5 श्रमिकों के साथ सुबह की ब्रीफिंग, दैनिक लक्ष्यों का वितरण और सुरक्षा जांच।",
        status: "in_progress",
      },
      {
        user: madhav,
        slot: "08:00 AM - 09:00 AM",
        category: "पोल्ट्री दाना और पानी (Poultry Feeding & Water)",
        title: "Poultry Sheds 1 & 2 Environmental & Temperature Audit",
        notes: "Flock 2 LAYER शेड का तापमान 24°C और वेंटिलेशन पंखों की जांच।",
        status: "assigned",
      },
      {
        user: madhav,
        slot: "09:00 AM - 10:00 AM",
        category: "दाना मिक्सिंग और स्टॉक (Feed Mixing & Stock)",
        title: "Silo & Feed Inventory Physical Stock Verification",
        notes: "साइलो A व B में मक्का और सोयाबीन के वर्तमान वजन की भौतिक जांच।",
        status: "assigned",
      },
      {
        user: madhav,
        slot: "11:00 AM - 12:00 PM",
        category: "टीकाकरण और दवाई (Vaccination & Medication)",
        title: "Cattle Health & Veterinary Medicine Inspection",
        notes: "मुर्रा भैंसों और गायों की स्वास्थ्य रिपोर्ट और कृमिनाशक दवा खुराक सत्यापन।",
        status: "assigned",
      },
      {
        user: madhav,
        slot: "01:00 PM - 02:00 PM",
        category: "General Farm Work",
        title: "Midday Operations Review & Feed Ration Check",
        notes: "दोपहर के राशन और श्रमिकों की कार्य प्रगति की समीक्षा।",
        status: "assigned",
      },
      {
        user: madhav,
        slot: "03:00 PM - 04:00 PM",
        category: "अंडा एकत्रीकरण और पैकिंग (Egg Collection & Packing)",
        title: "Egg Grading, Packaging & Dispatch Logistics",
        notes: "क्रैक अंडों की छंटनी और 30-अंडों वाली ट्रे की वाहन लोडिंग पर्यवेक्षण।",
        status: "assigned",
      },
      {
        user: madhav,
        slot: "05:00 PM - 06:00 PM",
        category: "खेत सिंचाई और रखरखाव (Field Irrigation & Maintenance)",
        title: "Field Irrigation & Perimeter Security Audit",
        notes: "खेत में ट्यूबवेल पानी का स्तर और बाउंड्री फेंसिंग का अंतिम निरीक्षण।",
        status: "assigned",
      },
      {
        user: madhav,
        slot: "07:00 PM - 08:00 PM",
        category: "General Farm Work",
        title: "Daily Timesheet Review & Shift Closeout",
        notes: "सभी कर्मचारियों की दैनिक टाइमशीट जांचना और कार्य स्वीकृति देना।",
        status: "assigned",
      },

      // 2. Kailash (Worker)
      {
        user: kailash,
        slot: "07:00 AM - 08:00 AM",
        category: "पोल्ट्री दाना और पानी (Poultry Feeding & Water)",
        title: "Morning Poultry Feeding (Shed 1 - Flock 2)",
        notes: "सुबह 7 बजे 120 ग्राम प्रति पक्षी दाना और निप्पल ड्रिंकर में ताजा पानी भरें।",
        status: "in_progress",
      },
      {
        user: kailash,
        slot: "08:00 AM - 09:00 AM",
        category: "पोल्ट्री दाना और पानी (Poultry Feeding & Water)",
        title: "Morning Poultry Feeding (Shed 2 - Batch 2)",
        notes: "शेड 2 में दाने की फीडर ट्रफ्स भरना और पानी की पाइपलाइन फ्लश करना।",
        status: "assigned",
      },
      {
        user: kailash,
        slot: "10:00 AM - 11:00 AM",
        category: "दाना मिक्सिंग और स्टॉक (Feed Mixing & Stock)",
        title: "Raw Grain Loading into Feed Mill",
        notes: "दाना मिल में 500 किग्रा मक्का और 200 किग्रा सोया खली लोड करना।",
        status: "assigned",
      },
      {
        user: kailash,
        slot: "02:00 PM - 03:00 PM",
        category: "दाना मिक्सिंग और स्टॉक (Feed Mixing & Stock)",
        title: "Feed Mixing & Silo A Refill",
        notes: "मिक्सर मशीन चलाकर दाना तैयार करना और साइलो A में ट्रांसफर करना।",
        status: "assigned",
      },
      {
        user: kailash,
        slot: "04:00 PM - 05:00 PM",
        category: "पोल्ट्री दाना और पानी (Poultry Feeding & Water)",
        title: "Evening Poultry Feeding & Water Sanitization",
        notes: "शाम का दाना डालना और पानी की टंकी में सैनिटाइजर मिलाना।",
        status: "assigned",
      },
      {
        user: kailash,
        slot: "06:00 PM - 07:00 PM",
        category: "General Farm Work",
        title: "Curtain & Ventilation Check for Night",
        notes: "शेड के साइड पर्दे 70% बंद करना और नाइट लाइट चालू करना।",
        status: "assigned",
      },

      // 3. Mukesh (Worker)
      {
        user: mukesh,
        slot: "08:00 AM - 09:00 AM",
        category: "अंडा एकत्रीकरण और पैकिंग (Egg Collection & Packing)",
        title: "Morning Egg Collection (Flock 2 - Rows 1 to 4)",
        notes: "नेस्ट बॉक्स से सुबह के ताजे अंडे एकत्र करना।",
        status: "in_progress",
      },
      {
        user: mukesh,
        slot: "09:00 AM - 10:00 AM",
        category: "अंडा एकत्रीकरण और पैकिंग (Egg Collection & Packing)",
        title: "Morning Egg Collection (Flock 2 - Rows 5 to 8)",
        notes: "शेष पंक्तियों से अंडे एकत्र करना और संग्रह कक्ष में लाना।",
        status: "assigned",
      },
      {
        user: mukesh,
        slot: "11:00 AM - 12:00 PM",
        category: "अंडा एकत्रीकरण और पैकिंग (Egg Collection & Packing)",
        title: "Egg Grading & 30-Egg Tray Stacking",
        notes: "गंदे व टूटे अंडे अलग करना और 30 अंडों वाली ट्रे में ग्रेडिंग करना।",
        status: "assigned",
      },
      {
        user: mukesh,
        slot: "03:00 PM - 04:00 PM",
        category: "अंडा एकत्रीकरण और पैकिंग (Egg Collection & Packing)",
        title: "Afternoon Egg Collection",
        notes: "दोपहर के अंडों का दूसरा राउंड एकत्र करना।",
        status: "assigned",
      },
      {
        user: mukesh,
        slot: "04:00 PM - 05:00 PM",
        category: "अंडा एकत्रीकरण और पैकिंग (Egg Collection & Packing)",
        title: "Dispatch Crates Loading & Count Entry",
        notes: "गाड़ी में अंडों की ट्रे लोड करना और रजिस्टर में कुल गिनती दर्ज करना।",
        status: "assigned",
      },

      // 4. Arvind (Worker)
      {
        user: arvind,
        slot: "07:00 AM - 08:00 AM",
        category: "शेड सफाई और सैनिटेशन (Shed Cleaning & Sanitation)",
        title: "Cattle Shed Dung Removal & Floor Wash",
        notes: "पशु शेड से गोबर हटाकर गोबर गैस प्लांट गड्ढे में डालना और फर्श धोना।",
        status: "in_progress",
      },
      {
        user: arvind,
        slot: "08:00 AM - 09:00 AM",
        category: "शेड सफाई और सैनिटेशन (Shed Cleaning & Sanitation)",
        title: "Limewash & Disinfection Spray",
        notes: "नालियों में चूना छिड़कना और मक्खी-मच्छर रोधी स्प्रे करना।",
        status: "assigned",
      },
      {
        user: arvind,
        slot: "10:00 AM - 11:00 AM",
        category: "टीकाकरण और दवाई (Vaccination & Medication)",
        title: "Veterinary Medicine Administration",
        notes: "डॉक्टर के पर्चे अनुसार बीमार पशुओं को एंटीबायोटिक और लिवर टॉनिक देना।",
        status: "assigned",
      },
      {
        user: arvind,
        slot: "01:00 PM - 02:00 PM",
        category: "पोल्ट्री दाना और पानी (Poultry Feeding & Water)",
        title: "Brooder Temp & Litter Turnover",
        notes: "ब्रूडर का तापमान 32°C पर सेट करना और लीटर (भूसा) पलटना ताकि सूखा रहे।",
        status: "assigned",
      },
      {
        user: arvind,
        slot: "05:00 PM - 06:00 PM",
        category: "शेड सफाई और सैनिटेशन (Shed Cleaning & Sanitation)",
        title: "Evening Dung Clearance & Shed Lockup",
        notes: "शाम का गोबर साफ करना और पानी की हौदी धोकर स्वच्छ पानी भरना।",
        status: "assigned",
      },

      // 5. Ramkumar (Worker)
      {
        user: ramkumar,
        slot: "07:00 AM - 08:00 AM",
        category: "पशु चारा और देखभाल (Livestock & Cattle Care)",
        title: "Fresh Water Trough Cleaning & Refill",
        notes: "पशुओं की पानी की हौदी को ब्रश से साफ करना और ताजा ट्यूबवेल पानी भरना।",
        status: "in_progress",
      },
      {
        user: ramkumar,
        slot: "08:00 AM - 09:00 AM",
        category: "पशु चारा और देखभाल (Livestock & Cattle Care)",
        title: "Green Fodder Chaff Cutter Machine",
        notes: "कुट्टी मशीन में हरा बरसीम और नेपियर घास काटना।",
        status: "assigned",
      },
      {
        user: ramkumar,
        slot: "09:00 AM - 10:00 AM",
        category: "पशु चारा और देखभाल (Livestock & Cattle Care)",
        title: "Cattle & Murrah Buffalo Morning Feeding",
        notes: "हरा चारा + सूखा भूसा + 2 किलो दाना प्रति मुर्रा भैंस वितरण करना।",
        status: "assigned",
      },
      {
        user: ramkumar,
        slot: "12:00 PM - 01:00 PM",
        category: "पशु चारा और देखभाल (Livestock & Cattle Care)",
        title: "Livestock Bathing & Grooming",
        notes: "पानी के पाइप से भैंसों और गायों को नहलाना और खुर जांचना।",
        status: "assigned",
      },
      {
        user: ramkumar,
        slot: "03:00 PM - 04:00 PM",
        category: "पशु चारा और देखभाल (Livestock & Cattle Care)",
        title: "Evening Dry Fodder & Mineral Rations",
        notes: "शाम का दाना और मिनरल मिक्चर सभी पशुओं की खुरली में डालना।",
        status: "assigned",
      },
      {
        user: ramkumar,
        slot: "05:00 PM - 06:00 PM",
        category: "पशु चारा और देखभाल (Livestock & Cattle Care)",
        title: "Troughs & Pen Night Check",
        notes: "खुरली की अंतिम जांच और रात के लिए पशुओं को बांधना।",
        status: "assigned",
      },

      // 6. Ashok kumar (Worker)
      {
        user: ashok,
        slot: "08:00 AM - 09:00 AM",
        category: "खेत सिंचाई और रखरखाव (Field Irrigation & Maintenance)",
        title: "Tubewell Motor Pump Start & Channel Flow",
        notes: "ट्यूबवेल स्टार्टर चालू करना और मुख्य सिंचाई नाली की सफाई करना।",
        status: "in_progress",
      },
      {
        user: ashok,
        slot: "09:00 AM - 10:00 AM",
        category: "खेत सिंचाई और रखरखाव (Field Irrigation & Maintenance)",
        title: "Plot 1 & 2 Irrigation Flow Check",
        notes: "प्लॉट 1 में बरसीम के खेत में क्यारियों में पानी का समान वितरण जांचना।",
        status: "assigned",
      },
      {
        user: ashok,
        slot: "11:00 AM - 12:00 PM",
        category: "खेत सिंचाई और रखरखाव (Field Irrigation & Maintenance)",
        title: "Weed Clearing Along Water Channels",
        notes: "सिंचाई नालियों के किनारे से घास-फूस और रुकावटें हटाना।",
        status: "assigned",
      },
      {
        user: ashok,
        slot: "02:00 PM - 03:00 PM",
        category: "खेत सिंचाई और रखरखाव (Field Irrigation & Maintenance)",
        title: "Tractor & Farm Implements Inspection",
        notes: "ट्रैक्टर का डीजल, मोबिल ऑयल और कल्टीवेटर के नट-बोल्ट चेक करना।",
        status: "assigned",
      },
      {
        user: ashok,
        slot: "04:00 PM - 05:00 PM",
        category: "खेत सिंचाई और रखरखाव (Field Irrigation & Maintenance)",
        title: "Perimeter Fence & Boundary Inspection",
        notes: "फार्म की बाहरी जाली और कांटेदार तार की जांच, ताकि आवारा पशु न आएं।",
        status: "assigned",
      },
      {
        user: ashok,
        slot: "06:00 PM - 07:00 PM",
        category: "खेत सिंचाई और रखरखाव (Field Irrigation & Maintenance)",
        title: "Pump Shutoff & Tool Lockup",
        notes: "ट्यूबवेल मोटर बंद करना, फावड़े-कुदाली टूल रूम में लॉक करना।",
        status: "assigned",
      },
    ];

    console.log(`Preparing to seed ${timesheetData.length} timesheet tasks for today...`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of timesheetData) {
      const existing = await WorkTask.findOne({
        assignedTo: item.user._id,
        date: today,
        timeLabel: item.slot,
      });

      if (existing) {
        existing.category = item.category;
        existing.title = item.title;
        existing.notes = item.notes;
        existing.status = item.status;
        await existing.save();
        updatedCount++;
      } else {
        await WorkTask.create({
          category: item.category,
          title: item.title,
          notes: item.notes,
          assignedTo: item.user._id,
          assignedBy: madhav._id,
          source: "schedule",
          date: today,
          timeLabel: item.slot,
          status: item.status,
        });
        createdCount++;
      }
    }

    console.log(`\nTimesheet Seeding Completed!`);
    console.log(`- Created: ${createdCount} timesheet tasks`);
    console.log(`- Updated: ${updatedCount} timesheet tasks`);

    // Verify timesheet entries by user
    for (const u of users) {
      const userTasks = await WorkTask.find({ assignedTo: u._id, date: today }).sort({ timeLabel: 1 });
      console.log(`\n📋 [${u.name}] - Role: ${u.role} (${userTasks.length} timesheet slots):`);
      userTasks.forEach((t) => {
        console.log(`  ⏰ ${t.timeLabel.padEnd(23)} | ${t.category.slice(0, 30).padEnd(30)} | ${t.status}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error("Timesheet seeding failed:", err);
    process.exit(1);
  }
};

seedTimesheets();
