import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { FullRetro } from "../storage/storage";
import { generateSummaryHTML } from "@/components/RetroStages/Finished/generateSummaryHTML";

export async function sendMail(request: Request) {

  const { to, subject, retro } = await request.json();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_PASS,
    }
  });

  try {
    const typedRetro = retro as FullRetro;
    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      bcc: to.join(", "),
      subject,
      html: `<div>Summary of ${process.env.NEXT_PUBLIC_PROD_URL}/retros/${typedRetro.uId}</div>`.concat(generateSummaryHTML(typedRetro)),
    };
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ status: 200, message: `Email sent to ${to}` });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ status: 500, error: `Error sending email to ${to}: ${error}` });
  }
}
