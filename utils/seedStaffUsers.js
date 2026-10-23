require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const usersToCreate = [
  {
    name: "Madhav",
    mobile: "9510680921",
    email: "madhav@dewalsfarm.com",
    role: "manager_operations",
    salary: 10000,
    address: "Dewals Farm",
    dateOfJoining: new Date("2026-01-01"),
    pin: "1234",
  },
  {
    name: "Kailash",
    mobile: "9109177084",
    email: "kailash@dewalsfarm.com",
    role: "worker",
    salary: 10000,
    address: "Dewals Farm",
    dateOfJoining: new Date("2026-01-01"),
    pin: "1234",
  },
  {
    name: "Mukesh",
    mobile: "8269755638",
    email: "mukesh@dewalsfarm.com",
    role: "worker",
    salary: 10000,
    address: "Dewals Farm",
    dateOfJoining: new Date("2026-01-01"),
    pin: "1234",
  },
  {
    name: "Arvind",
    mobile: "9329349984",
    email: "arvind@dewalsfarm.com",
    role: "worker",
    salary: 10000,
    address: "Dewals Farm",
    dateOfJoining: new Date("2026-01-01"),
    pin: "1234",
  },
  {
    name: "Ramkumar",
    mobile: "9000000001",
    email: "ramkumar@dewalsfarm.com",
    role: "worker",
    salary: 10000,
    address: "Dewals Farm",
    dateOfJoining: new Date("2026-01-01"),
    pin: "1234",
  },
  {
    name: "Ashok kumar",
    mobile: "9000000002",
    email: "ashokkumar@dewalsfarm.com",
    role: "worker",
    salary: 5000,
    address: "Dewals Farm",
    dateOfJoining: new Date("2026-01-01"),
    pin: "1234",
  },
];

const seed = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB successfully.");

    const admin = await User.findOne({ role: "admin" });
    const adminId = admin ? admin._id : null;

    for (const u of usersToCreate) {
      let existing = await User.findOne({ mobile: u.mobile });
      if (existing) {
        console.log(`User already exists for mobile ${u.mobile} (${existing.name}). Updating details & pin...`);
        existing.name = u.name;
        existing.role = u.role;
        existing.salary = u.salary;
        existing.address = u.address;
        existing.email = u.email;
        existing.pin = u.pin; // triggers pre('save') bcrypt hash
        existing.isActive = true;
        await existing.save();
        console.log(`Updated: ${existing.name} (${existing.mobile}) - Role: ${existing.role}, Salary: ₹${existing.salary}`);
      } else {
        const created = await User.create({
          ...u,
          createdBy: adminId,
          isActive: true,
        });
        console.log(`Created: ${created.name} (${created.mobile}) - Role: ${created.role}, Salary: ₹${created.salary}`);
      }
    }

    console.log("\nVerifying all users in database:");
    const allUsers = await User.find({}, "name mobile email role salary isActive");
    for (const usr of allUsers) {
      const full = await User.findById(usr._id).select("+pin");
      const pinMatches = await full.matchPin("1234");
      console.log(`- ${usr.name.padEnd(15)} | Mobile: ${usr.mobile} | Role: ${usr.role.padEnd(20)} | Salary: ₹${usr.salary.toString().padEnd(6)} | PIN 1234 Valid: ${pinMatches}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seed();
