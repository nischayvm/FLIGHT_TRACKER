const mongoose = require('mongoose');
const TollGate = require('../models/TollGate');
require('dotenv').config({ path: '../.env' });

const tolls = [
    {
        name: "Airport Toll Plaza (KIAL)",
        location: { lat: 13.1986, lng: 77.7066 },
        cost: { car: 110, bike: 0, truck: 180 },
        type: "Expressway"
    },
    {
        name: "Electronic City Flyover",
        location: { lat: 12.8452, lng: 77.6602 },
        cost: { car: 55, bike: 0, truck: 100 },
        type: "Expressway"
    },
    {
        name: "NICE Road - Hosur Road Entry",
        location: { lat: 12.8724, lng: 77.6493 },
        cost: { car: 45, bike: 15, truck: 90 }, // Bikes pay on NICE road
        type: "Expressway"
    },
    {
        name: "NICE Road - Bannerghatta Road",
        location: { lat: 12.8716, lng: 77.5878 },
        cost: { car: 40, bike: 15, truck: 80 },
        type: "Expressway"
    },
    {
        name: "NICE Road - Kanakapura Road",
        location: { lat: 12.8767, lng: 77.5348 },
        cost: { car: 35, bike: 10, truck: 70 },
        type: "Expressway"
    },
    {
        name: "NICE Road - Mysore Road",
        location: { lat: 12.9195, lng: 77.4872 },
        cost: { car: 45, bike: 15, truck: 90 },
        type: "Expressway"
    },
    {
        name: "Nelamangala Toll",
        location: { lat: 13.0645, lng: 77.4589 },
        cost: { car: 30, bike: 0, truck: 60 },
        type: "Highway"
    },
    {
        name: "Attibele Toll Plaza",
        location: { lat: 12.7766, lng: 77.7719 },
        cost: { car: 45, bike: 0, truck: 85 },
        type: "Highway"
    },
    {
        name: "Kaniminike Toll Plaza",
        location: { lat: 12.8938, lng: 77.4526 },
        cost: { car: 50, bike: 0, truck: 90 },
        type: "Expressway"
    },
    {
        name: "Guilalu Toll Plaza (Hubli-Dharwad)",
        location: { lat: 15.4243, lng: 74.9654 },
        cost: { car: 70, bike: 0, truck: 130 },
        type: "Highway"
    },
    {
        name: "Bankapur Toll Plaza",
        location: { lat: 14.9304, lng: 75.2530 },
        cost: { car: 65, bike: 0, truck: 110 },
        type: "Highway"
    },
    {
        name: "Hattargi Toll Plaza",
        location: { lat: 16.0827, lng: 74.5029 },
        cost: { car: 40, bike: 0, truck: 70 },
        type: "Highway"
    },
    {
        name: "Mulbagal Toll Plaza",
        location: { lat: 13.1614, lng: 78.3846 },
        cost: { car: 55, bike: 0, truck: 95 },
        type: "Highway"
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karnataka_tolls');
        console.log("Connected to DB");

        await TollGate.deleteMany({});
        console.log("Cleared existing tolls");

        await TollGate.insertMany(tolls);
        console.log("Seeded Tolls");

        mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
};

seedDB();
