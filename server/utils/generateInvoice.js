import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { format } from "date-fns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoice = async (booking, user, turf) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Header ---
      const logoPath = path.join(__dirname, "../../client/user/public/logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 50 });
      }

      doc
        .fillColor("#444444")
        .fontSize(20)
        .text("KRIDAZ", 110, 57)
        .fontSize(10)
        .text("Kridaz Pvt Ltd.", 200, 50, { align: "right" })
        .text("123 Sports Arena Complex", 200, 65, { align: "right" })
        .text("Bangalore, KA 560001", 200, 80, { align: "right" })
        .moveDown();

      // --- Divider ---
      doc.moveTo(50, 110).lineTo(550, 110).stroke("#EEEEEE");

      // --- Invoice Meta ---
      doc
        .fillColor("#444444")
        .fontSize(20)
        .text("INVOICE", 50, 130);

      doc
        .fontSize(10)
        .text(`Invoice Number: TS-${booking.id.toString().slice(-6).toUpperCase()}`, 50, 160)
        .text(`Invoice Date: ${format(new Date(), "dd MMMM yyyy")}`, 50, 175)
        .text(`Booking ID: ${booking.id}`, 50, 190)
        .moveDown();

      // --- Customer & Merchant Details ---
      doc
        .fontSize(10)
        .text("BILL TO:", 50, 220, { underline: true })
        .text(user.name, 50, 235)
        .text(user.email, 50, 250)
        .text(user.phone || "", 50, 265);

      doc
        .fontSize(10)
        .text("MERCHANT:", 350, 220, { underline: true })
        .text(turf.name, 350, 235)
        .text(turf.location, 350, 250);

      // --- Table Header ---
      const tableTop = 320;
      doc
        .fillColor("#444444")
        .fontSize(10)
        .text("Description", 50, tableTop, { bold: true })
        .text("Date", 250, tableTop, { bold: true })
        .text("Duration", 350, tableTop, { bold: true })
        .text("Price", 450, tableTop, { bold: true, align: "right" });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke("#EEEEEE");

      // --- Table Row ---
      const rowY = tableTop + 30;
      doc
        .fontSize(10)
        .text(`${turf.name} Booking`, 50, rowY)
        .text(format(new Date(booking.bookingDate), "dd MMM yyyy"), 250, rowY)
        .text(`${booking.duration} Hour(s)`, 350, rowY)
        .text(`₹ ${booking.totalPrice.toFixed(2)}`, 450, rowY, { align: "right" });

      // --- Total ---
      const totalY = rowY + 50;
      doc.moveTo(350, totalY).lineTo(550, totalY).stroke("#EEEEEE");
      
      doc
        .fontSize(12)
        .fillColor("#000000")
        .text("Total Amount Paid:", 350, totalY + 15)
        .text(`₹ ${booking.totalPrice.toFixed(2)}`, 450, totalY + 15, { align: "right", bold: true });

      // --- Payment Status ---
      doc
        .fontSize(10)
        .fillColor("#4CAF50")
        .text(`Payment Status: ${booking.status === 'confirmed' ? 'PAID' : 'SUCCESS'}`, 50, totalY + 15);

      // --- Signature & Footer ---
      const footerY = 700;
      doc.moveTo(50, footerY).lineTo(550, footerY).stroke("#EEEEEE");
      
      doc
        .fillColor("#888888")
        .fontSize(8)
        .text("Authorized Signature", 400, footerY + 40, { align: "center" })
        .text("Kridaz Admin", 400, footerY + 50, { align: "center" });

      doc
        .fontSize(10)
        .fillColor("#444444")
        .text("Thank you for choosing Kridaz!", 50, footerY + 40, { align: "left" })
        .fontSize(8)
        .text("This is a computer-generated invoice and does not require a physical signature.", 50, footerY + 60, { align: "left" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
