
import mongoose from 'mongoose';
import Transaction from './server/src/models/Transaction.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const transactions = await Transaction.find({}).sort({ date: -1 }).limit(10);
        console.log("Recent Transactions:");
        transactions.forEach(t => {
            console.log(`Date: ${t.date}, Kind: '${t.kind}', Amount: ${t.amount}, Category: ${t.category}`);
        });

        // specific check for 2025
        const start2025 = new Date('2025-01-01');
        const tx2025 = await Transaction.find({ date: { $gte: start2025 } });
        console.log("\n2025 Transactions:", tx2025.length);
        tx2025.forEach(t => {
            console.log(`[2025] Date: ${t.date}, Kind: '${t.kind}', Amount: ${t.amount}`);
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkData();
