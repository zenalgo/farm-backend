require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const WorkTask = require("../models/WorkTask");
const User = require("../models/User");

function to12h(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.trim().split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  return `${hStr}:${m} ${ampm}`;
}

function makeSlotLabel(start, stop) {
  return `${to12h(start)} - ${to12h(stop)}`;
}

const rawSchedule = [
  // ------------------- MADHAV (MANAGER) -------------------
  {
    workerKey: "madhav",
    items: [
      { start: "07:15:00", stop: "07:30:00", task: "Check attendance, brief Workers 1–4 on the day, including any extra work Admin has set", status: "in_progress" },
      { start: "07:30:00", stop: "07:45:00", task: "Check Animal Health", status: "assigned" },
      { start: "07:45:00", stop: "08:00:00", task: "Check Miling Shed Cleanliness", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Switch on Fresh Drinking Water Pump", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Supervise morning milking (hygiene, quantity)", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Receive milk, record litres", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Compare Feed Given Last Day and Fat and Yeild Impact and Note on the Physical Register", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Book milk sale and morning expenses in the app", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Spray Anti Fly After Milking", status: "assigned" },
      { start: "08:40:00", stop: "09:00:00", task: "Use Chunna on The Drain System", status: "assigned" },
      { start: "08:40:00", stop: "09:00:00", task: "Leave for Milk Delivery", status: "assigned" },
      { start: "08:40:00", stop: "09:00:00", task: "Start Goat Feeding", status: "assigned" },
      { start: "10:45:00", stop: "11:00:00", task: "Round of goat and poultry sheds, rate labour with photo", status: "assigned" },
      { start: "11:20:00", stop: "12:00:00", task: "Supervise weeding block, take photos", status: "assigned" },
      { start: "12:00:00", stop: "15:00:00", task: "Workers 1–2 handover check (Feed Stock , fodder, JeevAmrit)", status: "assigned" },
      { start: "15:10:00", stop: "16:00:00", task: "Feed stock yard check, days-remaining, raise reorder if low", status: "assigned" },
      { start: "15:10:00", stop: "16:00:00", task: "Admin: timesheets, expenses, heat and pregnancy alerts, messages", status: "assigned" },
      { start: "15:10:00", stop: "16:00:00", task: "Supervise painting/repair block, photos", status: "assigned" },
      { start: "16:00:00", stop: "17:00:00", task: "Water Plants and Irrigation", status: "assigned" },
      { start: "17:00:00", stop: "18:00:00", task: "Use Jeev Amrit in Water and Circulate to All Plants", status: "assigned" },
      { start: "18:00:00", stop: "18:30:00", task: "Visit the Cow Shed for Milking", status: "assigned" },
    ],
  },

  // ------------------- WORKER 1 / MUKESH -------------------
  {
    workerKey: "mukesh",
    items: [
      { start: "07:15:00", stop: "07:30:00", task: "Register Your Attendance", status: "in_progress" },
      { start: "07:30:00", stop: "07:45:00", task: "Check and Report animal health", status: "assigned" },
      { start: "07:45:00", stop: "08:00:00", task: "Clean the Cow Dung", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Ask Manager to Refill Cleaning Drinking Water", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Clean the All Cow Dung and Santize the Area Milking Area", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Start Milking", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Continue Milking (Round 1)", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Continue Milking (Round 2)", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Continue Milking (Round 3)", status: "assigned" },
      { start: "08:40:00", stop: "09:00:00", task: "Prepare The Cow Feed and Click a Photo of the Preparation", status: "assigned" },
      { start: "08:40:00", stop: "09:00:00", task: "Click the Photo of the Quantity of feed Prepared", status: "assigned" },
      { start: "08:40:00", stop: "09:00:00", task: "Serve the Cows Food", status: "assigned" },
      { start: "09:00:00", stop: "09:20:00", task: "Serve the Goats Morning Bhusa", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Serve the Goats Fresh Water", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Feed the Young Goats Milk", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Check All Goats Health", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Go For a Tea Break", status: "assigned" },
      { start: "09:40:00", stop: "10:30:00", task: "Cleaning for Work Place Shed , Building, Terrace", status: "assigned" },
      { start: "10:45:00", stop: "11:00:00", task: "Cleaning for Work Place Shed , Building, Terrace (Second Round)", status: "assigned" },
      { start: "11:20:00", stop: "12:00:00", task: "Weed Cleaning around all the sheds", status: "assigned" },
      { start: "12:00:00", stop: "15:00:00", task: "Go For Lunch Break", status: "assigned" },
      { start: "15:10:00", stop: "16:00:00", task: "Vegetable Field Cleaning Weeding", status: "assigned" },
      { start: "15:10:00", stop: "16:00:00", task: "Apply fertilizer Jeev Amrit", status: "assigned" },
      { start: "15:10:00", stop: "16:00:00", task: "Sown Seeds, Make a Nursery for Upcoming Season", status: "assigned" },
      { start: "15:10:00", stop: "17:00:00", task: "Construction vegetable Tunnel", status: "assigned" },
      { start: "17:00:00", stop: "17:30:00", task: "Clean the Cow Dung", status: "assigned" },
      { start: "17:30:00", stop: "18:30:00", task: "Start Milking", status: "assigned" },
      { start: "17:00:00", stop: "19:00:00", task: "Serve the Cows Food", status: "assigned" },
    ],
  },

  // ------------------- WORKER 2 / RAM KUMAR -------------------
  {
    workerKey: "ramkumar",
    items: [
      { start: "07:15:00", stop: "07:30:00", task: "Register Your Attendance", status: "in_progress" },
      { start: "07:30:00", stop: "07:45:00", task: "Go Far Fresh Green Fodder cutting", status: "assigned" },
      { start: "07:45:00", stop: "08:00:00", task: "Clean the Cow Dung", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Clean the All Cow Dung and Santize the Area Milking Area (Part 1)", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Clean the All Cow Dung and Santize the Area Milking Area (Part 2)", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Start Milking", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Continue Milking (Round 1)", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Continue Milking (Round 2)", status: "assigned" },
      { start: "08:15:00", stop: "08:30:00", task: "Continue Milking (Round 3)", status: "assigned" },
      { start: "08:40:00", stop: "09:00:00", task: "Prepare The Cow Feed and Click a Photo of the Preparation", status: "assigned" },
      { start: "08:40:00", stop: "09:00:00", task: "Water the Vegetable Croping", status: "assigned" },
      { start: "08:40:00", stop: "09:00:00", task: "Serve the Cows Food", status: "assigned" },
      { start: "09:00:00", stop: "09:20:00", task: "Serve the Goats Morning Bhusa", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Serve the Goats Fresh Water", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Feed the Young Goats Milk", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Check Alll Goats Health", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Go For a Tea Break", status: "assigned" },
      { start: "09:40:00", stop: "10:30:00", task: "Cleaning for Work Place Shed , Building, Terrace", status: "assigned" },
      { start: "10:45:00", stop: "11:00:00", task: "Cleaning for Work Place Shed , Building, Terrace (Second Round)", status: "assigned" },
      { start: "11:20:00", stop: "12:00:00", task: "Weed Cleaning around all the sheds", status: "assigned" },
      { start: "12:00:00", stop: "15:00:00", task: "Go For Lunch Break", status: "assigned" },
      { start: "15:10:00", stop: "16:00:00", task: "Vegetable Field Cleaning Weeding", status: "assigned" },
      { start: "15:10:00", stop: "16:00:00", task: "Apply fertilizer Jeev Amrit", status: "assigned" },
      { start: "15:10:00", stop: "16:00:00", task: "Sown Seeds, Make a Nursery for Upcoming Season", status: "assigned" },
      { start: "15:10:00", stop: "17:00:00", task: "Construction vegetable Tunnel", status: "assigned" },
      { start: "17:00:00", stop: "17:30:00", task: "Clean the Cow Dung", status: "assigned" },
      { start: "17:30:00", stop: "18:30:00", task: "Start Milking", status: "assigned" },
      { start: "17:00:00", stop: "19:00:00", task: "Serve the Cows Food", status: "assigned" },
    ],
  },

  // ------------------- WORKER 3 / KAILASH -------------------
  {
    workerKey: "kailash",
    items: [
      { start: "08:40:00", stop: "09:00:00", task: "Register Attendance", status: "in_progress" },
      { start: "08:40:00", stop: "09:00:00", task: "Visit Cow Shed - Food and Health", status: "assigned" },
      { start: "09:00:00", stop: "09:20:00", task: "Check Water and Calcium to Water (Cow Shed)", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Give any Medication if Required in Cow Shed", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Check Water and Calcium to Water (Goat Shed)", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Give any Medication if Required in Goat Shed", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Visit Chicken Shed- Check Food and water", status: "assigned" },
      { start: "09:40:00", stop: "10:30:00", task: "Additional Special Feed to any Goat Kids", status: "assigned" },
      { start: "10:45:00", stop: "11:00:00", task: "Neem Leaves", status: "assigned" },
      { start: "11:20:00", stop: "12:00:00", task: "Follow Chicken Routine Check", status: "assigned" },
      { start: "12:00:00", stop: "13:00:00", task: "Prepare The Makka Tray", status: "assigned" },
      { start: "13:00:00", stop: "14:00:00", task: "Stock Check and Warehouse Cleaning", status: "assigned" },
      { start: "14:00:00", stop: "15:00:00", task: "Lunch Break", status: "assigned" },
      { start: "15:10:00", stop: "16:00:00", task: "Check Feed and Animals Water", status: "assigned" },
      { start: "15:10:00", stop: "17:00:00", task: "Help In vegetable Section and Weed Cleaning", status: "assigned" },
      { start: "17:00:00", stop: "17:30:00", task: "help In Cow Shed and Goat Feed", status: "assigned" },
      { start: "17:30:00", stop: "18:30:00", task: "Give any Medication if Required in Cow / Goat", status: "assigned" },
      { start: "17:00:00", stop: "19:00:00", task: "Feed Kids and Special Feed for Cow and Goats", status: "assigned" },
    ],
  },

  // ------------------- WORKER 4 / ARVIND -------------------
  {
    workerKey: "arvind",
    items: [
      { start: "08:40:00", stop: "09:00:00", task: "Register Attendance", status: "in_progress" },
      { start: "08:40:00", stop: "09:00:00", task: "Visit Cow Shed - Food and Health", status: "assigned" },
      { start: "09:00:00", stop: "09:20:00", task: "Check Water and Calcium to Water (Cow Shed)", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Give any Medication if Required in Cow Shed", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Check Water and Calcium to Water (Goat Shed)", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Give any Medication if Required in Goat Shed", status: "assigned" },
      { start: "09:20:00", stop: "09:40:00", task: "Visit Chicken Shed- Check Food and water", status: "assigned" },
      { start: "09:40:00", stop: "10:30:00", task: "Additional Special Feed to any Goat Kids", status: "assigned" },
      { start: "10:45:00", stop: "11:00:00", task: "Painting of All Metal Things (Section 1)", status: "assigned" },
      { start: "11:20:00", stop: "12:00:00", task: "Painting of All Metal Things (Section 2)", status: "assigned" },
      { start: "12:00:00", stop: "13:00:00", task: "Painting of All Metal Things (Section 3)", status: "assigned" },
      { start: "13:00:00", stop: "14:00:00", task: "House Cleaning", status: "assigned" },
      { start: "14:00:00", stop: "15:00:00", task: "Lunch Break", status: "assigned" },
      { start: "15:10:00", stop: "16:00:00", task: "Painting and Cleaning", status: "assigned" },
      { start: "15:10:00", stop: "17:00:00", task: "Take care Garden Opposite to the Building", status: "assigned" },
      { start: "17:00:00", stop: "17:30:00", task: "Place Fire on the Cow Shed and Near Goat Shed", status: "assigned" },
      { start: "17:30:00", stop: "18:30:00", task: "Help Madhav in Watering Plants and Irrigation (Round 1)", status: "assigned" },
      { start: "17:00:00", stop: "19:00:00", task: "Help Madhav in Watering Plants and Irrigation (Round 2)", status: "assigned" },
    ],
  },

  // ------------------- ASHOK KUMAR (FIELD & PUMP SUPPORT) -------------------
  {
    workerKey: "ashok",
    items: [
      { start: "08:40:00", stop: "09:00:00", task: "Register Attendance", status: "in_progress" },
      { start: "09:00:00", stop: "10:00:00", task: "Start Tubewell Motor & Water Channel Cleaning", status: "assigned" },
      { start: "10:00:00", stop: "11:00:00", task: "Vegetable Field Weeding & Weed Cleaning", status: "assigned" },
      { start: "11:20:00", stop: "12:00:00", task: "Weed Cleaning around all the sheds", status: "assigned" },
      { start: "12:00:00", stop: "13:00:00", task: "House Cleaning & Farm Fence Inspection", status: "assigned" },
      { start: "14:00:00", stop: "15:00:00", task: "Lunch Break", status: "assigned" },
      { start: "15:10:00", stop: "17:00:00", task: "Help In vegetable Section and Weed Cleaning", status: "assigned" },
      { start: "17:00:00", stop: "18:30:00", task: "Help Madhav in Watering Plants and Irrigation", status: "assigned" },
      { start: "18:30:00", stop: "19:00:00", task: "Pump Shutoff & Farm Tool Lockup", status: "assigned" },
    ],
  },
];

const run = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB.");

    const users = await User.find({
      mobile: { $in: ["9510680921", "9109177084", "8269755638", "9329349984", "9000000001", "9000000002"] },
    });

    const userMap = {};
    users.forEach((u) => {
      if (u.mobile === "9510680921") userMap["madhav"] = u;
      if (u.mobile === "8269755638") userMap["mukesh"] = u;
      if (u.mobile === "9000000001") userMap["ramkumar"] = u;
      if (u.mobile === "9109177084") userMap["kailash"] = u;
      if (u.mobile === "9329349984") userMap["arvind"] = u;
      if (u.mobile === "9000000002") userMap["ashok"] = u;
    });

    const madhav = userMap["madhav"];
    if (!madhav) {
      console.error("Madhav not found!");
      process.exit(1);
    }

    // Seed for today and next 2 days so tasks are always active and visible
    const targetDates = [
      new Date("2026-10-23T00:00:00.000Z"),
      new Date("2026-10-24T00:00:00.000Z"),
      new Date("2026-10-25T00:00:00.000Z"),
    ];

    for (const d of targetDates) {
      console.log(`\n--- Seeding for Date: ${d.toISOString().slice(0, 10)} ---`);

      for (const group of rawSchedule) {
        const user = userMap[group.workerKey];
        if (!user) continue;

        const seenSlots = {};

        for (const item of group.items) {
          const slot = makeSlotLabel(item.start, item.stop);
          let taskTitle = item.task;
          const key = `${slot}_${taskTitle}`;

          if (seenSlots[key]) {
            seenSlots[key] += 1;
            taskTitle = `${taskTitle} (Part ${seenSlots[key]})`;
          } else {
            seenSlots[key] = 1;
          }

          await WorkTask.findOneAndUpdate(
            {
              assignedTo: user._id,
              date: d,
              timeLabel: slot,
              category: taskTitle,
            },
            {
              $set: {
                title: taskTitle,
                category: taskTitle,
                notes: `Official Timesheet: ${item.start} to ${item.stop}`,
                assignedTo: user._id,
                assignedBy: madhav._id,
                source: "schedule",
                date: d,
                timeLabel: slot,
                status: item.status || "assigned",
              },
            },
            { upsert: true }
          );
        }
      }
    }

    console.log(`\n======================================================`);
    console.log(`All dates seeded successfully into MongoDB Atlas!`);
    console.log(`======================================================`);
    process.exit(0);
  } catch (err) {
    console.error("Error importing timesheet:", err);
    process.exit(1);
  }
};

run();
