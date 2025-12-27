
import mongoose from 'mongoose';
import Transaction from './src/models/Transaction.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const start = new Date('2025-01-01');
        const transactions = await Transaction.find({ date: { $gte: start } }).sort({ date: 1 });

        console.log("--- 2025 Transactions ---");
        transactions.forEach(t => {
            console.log(JSON.stringify({
                date: t.date.toISOString(),
                kind: t.kind,
                amount: t.amount
            }));
        });

        console.log("--- End ---");
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkData();
