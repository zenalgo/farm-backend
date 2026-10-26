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

const scheduleData = [
  // 1. Manager — Madhav
  {
    workerKey: "madhav",
    items: [
      { start: "07:15", stop: "07:30", task: "Check attendance; brief Workers 1–4 on daily and extra work" },
      { start: "07:30", stop: "07:45", task: "Check animal health" },
      { start: "07:45", stop: "08:00", task: "Check milking shed cleanliness" },
      { start: "08:15", stop: "08:30", task: "Switch on fresh drinking water pump" },
      { start: "08:15", stop: "08:30", task: "Supervise morning milking (hygiene, quantity)" },
      { start: "08:15", stop: "08:30", task: "Receive milk and record litres" },
      { start: "08:15", stop: "08:30", task: "Compare previous day's feed with fat and yield impact; record in physical register" },
      { start: "08:15", stop: "08:30", task: "Book milk sales and morning expenses in the app" },
      { start: "08:15", stop: "08:30", task: "Spray anti-fly treatment after milking" },
      { start: "08:40", stop: "09:00", task: "Apply chunna to the drain system" },
      { start: "08:40", stop: "09:00", task: "Leave for milk delivery" },
      { start: "08:40", stop: "09:00", task: "Start goat feeding" },
      { start: "10:45", stop: "11:00", task: "Inspect goat and poultry sheds; rate labour with photo" },
      { start: "11:20", stop: "12:00", task: "Supervise weeding block and take photos" },
      { start: "12:00", stop: "15:00", task: "Handover check for Workers 1–2: feed stock, fodder and JeevAmrit" },
      { start: "15:10", stop: "16:00", task: "Check feed stock yard, days remaining and reorder if low" },
      { start: "15:10", stop: "16:00", task: "Admin: timesheets, expenses, heat and pregnancy alerts, messages" },
      { start: "15:10", stop: "16:00", task: "Supervise painting/repair block and take photos" },
      { start: "16:00", stop: "17:00", task: "Water plants and irrigation" },
      { start: "17:00", stop: "18:00", task: "Mix Jeev Amrit in water and circulate to all plants" },
      { start: "18:00", stop: "18:30", task: "Visit cow shed for milking" },
    ],
  },

  // 2. Worker 1 — Mukesh
  {
    workerKey: "mukesh",
    items: [
      { start: "07:15", stop: "07:30", task: "Register attendance" },
      { start: "07:30", stop: "07:45", task: "Check and report animal health" },
      { start: "07:45", stop: "08:00", task: "Clean cow dung" },
      { start: "08:15", stop: "08:30", task: "Ask manager to refill cleaning/drinking water" },
      { start: "08:15", stop: "08:30", task: "Clean cow dung and sanitize milking area" },
      { start: "08:15", stop: "08:30", task: "Start milking" },
      { start: "08:15", stop: "08:30", task: "Continue milking (Entry 1)" },
      { start: "08:15", stop: "08:30", task: "Continue milking (Entry 2)" },
      { start: "08:15", stop: "08:30", task: "Continue milking (Entry 3)" },
      { start: "08:40", stop: "09:00", task: "Prepare cow feed and photograph preparation" },
      { start: "08:40", stop: "09:00", task: "Photograph quantity of prepared feed" },
      { start: "08:40", stop: "09:00", task: "Serve cows' food" },
      { start: "09:00", stop: "09:20", task: "Serve goats' morning bhusa" },
      { start: "09:20", stop: "09:40", task: "Serve goats fresh water" },
      { start: "09:20", stop: "09:40", task: "Feed young goats milk" },
      { start: "09:20", stop: "09:40", task: "Check all goats' health" },
      { start: "09:20", stop: "09:40", task: "Tea break" },
      { start: "09:40", stop: "10:30", task: "Clean workplace, shed, building and terrace (Morning)" },
      { start: "10:45", stop: "11:00", task: "Clean workplace, shed, building and terrace (Midday)" },
      { start: "11:20", stop: "12:00", task: "Weed around all sheds" },
      { start: "12:00", stop: "15:00", task: "Lunch break" },
      { start: "15:10", stop: "16:00", task: "Clean and weed vegetable field" },
      { start: "15:10", stop: "16:00", task: "Apply Jeev Amrit fertilizer" },
      { start: "15:10", stop: "16:00", task: "Sow seeds and prepare nursery for upcoming season" },
      { start: "15:10", stop: "17:00", task: "Construct vegetable tunnel" },
      { start: "17:00", stop: "17:30", task: "Clean cow dung" },
      { start: "17:30", stop: "18:30", task: "Start milking" },
      { start: "17:00", stop: "19:00", task: "Serve cows' food" },
    ],
  },

  // 3. Worker 2 — Ram Kumar
  {
    workerKey: "ramkumar",
    items: [
      { start: "07:15", stop: "07:30", task: "Register attendance" },
      { start: "07:30", stop: "07:45", task: "Go for fresh green fodder cutting" },
      { start: "07:45", stop: "08:00", task: "Clean cow dung" },
      { start: "08:15", stop: "08:30", task: "Clean cow dung and sanitize milking area (Part 1)" },
      { start: "08:15", stop: "08:30", task: "Clean cow dung and sanitize milking area (Part 2)" },
      { start: "08:15", stop: "08:30", task: "Start milking" },
      { start: "08:15", stop: "08:30", task: "Continue milking (Entry 1)" },
      { start: "08:15", stop: "08:30", task: "Continue milking (Entry 2)" },
      { start: "08:15", stop: "08:30", task: "Continue milking (Entry 3)" },
      { start: "08:40", stop: "09:00", task: "Prepare cow feed and photograph preparation" },
      { start: "08:40", stop: "09:00", task: "Water vegetable crops" },
      { start: "08:40", stop: "09:00", task: "Serve cows' food" },
      { start: "09:00", stop: "09:20", task: "Serve goats' morning bhusa" },
      { start: "09:20", stop: "09:40", task: "Serve goats fresh water" },
      { start: "09:20", stop: "09:40", task: "Feed young goats milk" },
      { start: "09:20", stop: "09:40", task: "Check all goats' health" },
      { start: "09:20", stop: "09:40", task: "Tea break" },
      { start: "09:40", stop: "10:30", task: "Clean workplace, shed, building and terrace (Morning)" },
      { start: "10:45", stop: "11:00", task: "Clean workplace, shed, building and terrace (Midday)" },
      { start: "11:20", stop: "12:00", task: "Weed around all sheds" },
      { start: "12:00", stop: "15:00", task: "Lunch break" },
      { start: "15:10", stop: "16:00", task: "Clean and weed vegetable field" },
      { start: "15:10", stop: "16:00", task: "Apply Jeev Amrit fertilizer" },
      { start: "15:10", stop: "16:00", task: "Sow seeds and prepare nursery for upcoming season" },
      { start: "15:10", stop: "17:00", task: "Construct vegetable tunnel" },
      { start: "17:00", stop: "17:30", task: "Clean cow dung" },
      { start: "17:30", stop: "18:30", task: "Start milking" },
      { start: "17:00", stop: "19:00", task: "Serve cows' food" },
    ],
  },

  // 4. Worker 3 — Kailash
  {
    workerKey: "kailash",
    items: [
      { start: "08:40", stop: "09:00", task: "Register attendance" },
      { start: "08:40", stop: "09:00", task: "Visit cow shed — food and health" },
      { start: "09:00", stop: "09:20", task: "Check water and calcium in water (Cow Shed)" },
      { start: "09:20", stop: "09:40", task: "Give medication if required in cow shed" },
      { start: "09:20", stop: "09:40", task: "Check water and calcium in water (Goat Shed)" },
      { start: "09:20", stop: "09:40", task: "Give medication if required in goat shed" },
      { start: "09:20", stop: "09:40", task: "Visit chicken shed; check food and water" },
      { start: "09:40", stop: "10:30", task: "Provide additional special feed to goat kids" },
      { start: "10:45", stop: "11:00", task: "Neem leaves" },
      { start: "11:20", stop: "12:00", task: "Follow chicken routine check" },
      { start: "12:00", stop: "13:00", task: "Prepare the makka tray" },
      { start: "13:00", stop: "14:00", task: "Check stock and clean warehouse" },
      { start: "14:00", stop: "15:00", task: "Lunch break" },
      { start: "15:10", stop: "16:00", task: "Check feed and animal water" },
      { start: "15:10", stop: "17:00", task: "Help in vegetable section and weed cleaning" },
      { start: "17:00", stop: "17:30", task: "Help in cow shed and goat feeding" },
      { start: "17:30", stop: "18:30", task: "Give medication if required to cows/goats" },
      { start: "17:00", stop: "19:00", task: "Feed kids and provide special feed for cows and goats" },
    ],
  },

  // 5. Worker 4 — Arvind
  {
    workerKey: "arvind",
    items: [
      { start: "08:40", stop: "09:00", task: "Register attendance" },
      { start: "08:40", stop: "09:00", task: "Visit cow shed — food and health" },
      { start: "09:00", stop: "09:20", task: "Check water and calcium in water (Cow Shed)" },
      { start: "09:20", stop: "09:40", task: "Give medication if required in cow shed" },
      { start: "09:20", stop: "09:40", task: "Check water and calcium in water (Goat Shed)" },
      { start: "09:20", stop: "09:40", task: "Give medication if required in goat shed" },
      { start: "09:20", stop: "09:40", task: "Visit chicken shed; check food and water" },
      { start: "09:40", stop: "10:30", task: "Provide additional special feed to goat kids" },
      { start: "10:45", stop: "11:00", task: "Paint all metal items (Section 1)" },
      { start: "11:20", stop: "12:00", task: "Paint all metal items (Section 2)" },
      { start: "12:00", stop: "13:00", task: "Paint all metal items (Section 3)" },
      { start: "13:00", stop: "14:00", task: "House cleaning" },
      { start: "14:00", stop: "15:00", task: "Lunch break" },
      { start: "15:10", stop: "16:00", task: "Painting and cleaning" },
      { start: "15:10", stop: "17:00", task: "Maintain garden opposite the building" },
      { start: "17:00", stop: "17:30", task: "Light a fire near the cow and goat sheds" },
      { start: "17:30", stop: "18:30", task: "Help Madhav with plant watering and irrigation (Session 1)" },
      { start: "17:00", stop: "19:00", task: "Help Madhav with plant watering and irrigation (Session 2)" },
    ],
  },
];

const run = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB Atlas.");

    // 1. DELETE ALL EXISTING WORK TASKS FROM DATABASE
    const delAll = await WorkTask.deleteMany({});
    console.log(`Deleted all previous tasks (${delAll.deletedCount} tasks cleared from WorkTask collection).`);

    // 2. Fetch users
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
    });

    const madhav = userMap["madhav"];
    if (!madhav) {
      console.error("Madhav not found!");
      process.exit(1);
    }

    // Seed dates: Today (2026-10-23) + upcoming days (2026-10-24, 2026-10-25, 2026-10-26, 2026-10-27, 2026-10-28, 2026-10-29, 2026-10-30)
    const targetDates = [
      new Date("2026-10-23T00:00:00.000Z"),
      new Date("2026-10-24T00:00:00.000Z"),
      new Date("2026-10-25T00:00:00.000Z"),
      new Date("2026-10-26T00:00:00.000Z"),
      new Date("2026-10-27T00:00:00.000Z"),
      new Date("2026-10-28T00:00:00.000Z"),
      new Date("2026-10-29T00:00:00.000Z"),
      new Date("2026-10-30T00:00:00.000Z"),
    ];

    let totalCreated = 0;

    for (const d of targetDates) {
      const dateStr = d.toISOString().slice(0, 10);
      console.log(`\nInserting timesheet for date: ${dateStr}...`);

      for (const group of scheduleData) {
        const user = userMap[group.workerKey];
        if (!user) continue;

        const seenSlots = {};

        for (const item of group.items) {
          const slot = makeSlotLabel(item.start, item.stop);
          let taskTitle = item.task;
          const key = `${slot}_${taskTitle}`;

          if (seenSlots[key]) {
            seenSlots[key] += 1;
            taskTitle = `${taskTitle} (Entry ${seenSlots[key]})`;
          } else {
            seenSlots[key] = 1;
          }

          await WorkTask.create({
            title: taskTitle,
            category: taskTitle,
            notes: `Timesheet: ${item.start} - ${item.stop}`,
            assignedTo: user._id,
            assignedBy: madhav._id,
            source: "schedule",
            date: d,
            timeLabel: slot,
            status: "assigned",
          });
          totalCreated++;
        }
      }
    }

    console.log(`\n======================================================`);
    console.log(`SUCCESS: All old tasks deleted and ${totalCreated} clean timesheet tasks inserted across 8 days!`);
    console.log(`======================================================`);

    const todayCount = await WorkTask.countDocuments({ date: new Date("2026-10-23T00:00:00.000Z") });
    console.log(`Tasks for today (2026-10-23): ${todayCount}`);

    for (const [key, usr] of Object.entries(userMap)) {
      const uCount = await WorkTask.countDocuments({ assignedTo: usr._id, date: new Date("2026-10-23T00:00:00.000Z") });
      console.log(`- ${usr.name.padEnd(15)} | ${usr.mobile} | Today's tasks: ${uCount}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Failed to reset and set timesheet:", err);
    process.exit(1);
  }
};

run();
