// // pages/api/send-email.ts
// import type { NextApiRequest, NextApiResponse } from "next";
// import nodemailer from "nodemailer";

// export default async function handler(
// 	req: NextApiRequest,
// 	res: NextApiResponse,
// ) {
// 	if (req.method === "POST") {
// 		const { to, subject, body } = req.body;

// 		// Nodemailer の設定
// 		const transporter = nodemailer.createTransport({
// 			service: "gmail", // 例: Gmail を使用
// 			auth: {
// 				user: process.env.EMAIL_USER, // 環境変数で設定
// 				pass: process.env.EMAIL_PASS, // 環境変数で設定
// 			},
// 		});

// 		try {
// 			await transporter.sendMail({
// 				from: process.env.EMAIL_USER,
// 				to,
// 				subject,
// 				text: body,
// 			});
// 			res.status(200).json({ message: "Email sent successfully" });
// 		} catch (error) {
// 			console.error("Error sending email:", error);
// 			res.status(500).json({ message: "Failed to send email" });
// 		}
// 	} else {
// 		res.status(405).json({ message: "Method not allowed" });
// 	}
// }
