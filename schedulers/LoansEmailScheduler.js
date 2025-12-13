import nodeCron from "node-cron";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import User from '../models/User.js';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
});

export const loansScheduler = () => {
    nodeCron.schedule('0 6 * * *', async () => {
        try {
            const now = new Date();
            // Compare using day boundaries to avoid time-of-day issues and timezone drift
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const threeDaysDate = new Date(startOfToday);
            threeDaysDate.setDate(threeDaysDate.getDate() + 3);
            const endOfThreeDays = new Date(threeDaysDate.getFullYear(), threeDaysDate.getMonth(), threeDaysDate.getDate(), 23, 59, 59, 999);

            // Load all users who have active loans
            const users = await User.find({ 'activeLoans.0': { $exists: true } })
                .populate('activeLoans.bookId', 'title')
                .exec();

            for (const user of users) {
                const overdue = [];
                const dueSoon = [];

                for (const loan of user.activeLoans) {
                    const due = new Date(loan.dueDate);
                    if (isNaN(due.getTime())) continue;
                    // Normalize to day boundaries for comparison
                    const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                    if (dueMidnight < startOfToday) overdue.push(loan);
                    else if (dueMidnight >= startOfToday && due <= endOfThreeDays) dueSoon.push(loan);
                }

                if (overdue.length === 0 && dueSoon.length === 0) continue;

                // Build email body
                const htmlParts = [];
                htmlParts.push(`<p>Доброго дня, ${user.username}!</p>`);
                htmlParts.push(`<p>Це автоматичне повідомлення від бібліотеки.</p>`);

                const toReturnMap = new Map();

                for (const loan of overdue) {
                    const id = String(loan._id);
                    toReturnMap.set(id, {
                        title: loan.bookId?.title || 'Невідома книга',
                        due: new Date(loan.dueDate),
                        status: 'Прострочена',
                        loanId: id
                    });
                }
                for (const loan of dueSoon) {
                    const id = String(loan._id);
                    if (toReturnMap.has(id)) continue;
                    const due = new Date(loan.dueDate);
                    const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
                    const startMidnight = startOfToday.getTime();
                    const msPerDay = 24 * 60 * 60 * 1000;
                    const daysLeft = Math.ceil((dueMidnight - startMidnight) / msPerDay);
                    toReturnMap.set(id, {
                        title: loan.bookId?.title || 'Невідома книга',
                        due: due,
                        status: daysLeft === 0 ? 'Потрібно повернути сьогодні' : `Залишилось ${daysLeft} дн.`,
                        loanId: id
                    });
                }

                if (toReturnMap.size) {
                    htmlParts.push(`<h3>Список книг для повернення:</h3><ul>`);
                    for (const item of toReturnMap.values()) {
                        const dueStr = item.due.toLocaleString('uk-UA');
                        htmlParts.push(`<li>${item.title} — дата повернення: ${dueStr} — <strong>${item.status}</strong></li>`);
                    }
                    htmlParts.push(`</ul>`);
                }

                const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
                htmlParts.push(`<p>Переглянути акаунт або повернути книги: <a href="${siteUrl}">${siteUrl}</a></p>`);

                const subjectParts = [];
                if (overdue.length) subjectParts.push(`Прострочені позики (${overdue.length})`);
                if (dueSoon.length) subjectParts.push(`Нагадування з бібліотеки: Книги на повернення(${dueSoon.length})`);

                const html = htmlParts.join('');
                const mailOptions = {
                    from: process.env.NODEMAILER_FROM || process.env.NODEMAILER_EMAIL,
                    to: user.email,
                    subject: subjectParts.length ? subjectParts.join(' — ') : 'Повідомлення від бібліотеки',
                    html,
                    text: html.replace(/<[^>]+>/g, '')
                };

                try {
                    await transporter.sendMail(mailOptions);
                    console.log(`Sent loans email to ${user.email}`);
                } catch (err) {
                    console.error(`Failed sending email to ${user.email}:`, err);
                }
            }

        } catch (err) {
            console.error('Loans Email Scheduler error:', err);
        }
    }, {
        timezone: 'Europe/Kyiv'
    });
}