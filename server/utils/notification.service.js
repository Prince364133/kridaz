import User from "../models/user.model.js";
import generateEmail from "./generateEmail.js";
import chalk from "chalk";

import axios from "axios";

// MSG91 WhatsApp Service
export const sendWhatsAppMessage = async (phone, message, templateName = null, params = []) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    const sender = process.env.MSG91_WHATSAPP_SENDER; // The integrated number in MSG91

    if (!authKey) {
      console.warn(chalk.yellow("[WhatsApp Service] MSG91_AUTH_KEY not set, using mock."));
      console.log(chalk.green(`[WhatsApp Service] Mock Sending to ${phone}: ${message}`));
      return true;
    }

    // Format phone: remove + and ensure country code (defaulting to 91 if missing)
    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.length === 10) formattedPhone = "91" + formattedPhone;

    const payload = {
      integrated_number: sender,
      content_type: templateName ? "template" : "text",
      payload: {
        to: formattedPhone,
        type: templateName ? "template" : "text",
        ...(templateName ? {
          template: {
            name: templateName,
            language: { code: "en", policy: "deterministic" },
            components: [{
              type: "body",
              parameters: params.map(p => ({ type: "text", text: String(p) }))
            }]
          }
        } : {
          text: { body: message }
        })
      }
    };

    const response = await axios.post("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/", payload, {
      headers: { 
        "authkey": authKey,
        "Content-Type": "application/json"
      }
    });

    return response.data.status === "success";
  } catch (error) {
    console.error(chalk.red(`[WhatsApp Service] Error: ${error.response?.data?.message || error.message}`));
    return false;
  }
};

export const notifyNewGame = async (game, host) => {
  try {
    const { city, state, gameType, date, time } = game;
    
    // Find users in the same city and state
    const targetUsers = await User.find({ 
      city: new RegExp(city, "i"), 
      state: new RegExp(state, "i"),
      _id: { $ne: host._id } 
    }).select("name email phone");

    if (targetUsers.length === 0) return;

    const message = `
🔥 New ${gameType} Match Hosted!
📍 Location: ${city}, ${state}
📅 Date: ${new Date(date).toDateString()}
⏰ Time: ${time}
👤 Hosted by: ${host.name}

Join the action now on Kridaz! 🏏⚽🏐
    `;

    const emailSubject = `New ${gameType} Match in ${city}!`;
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; background: #000; color: #fff; border-radius: 20px;">
        <h1 style="color: #fbbf24;">New ${gameType} Match!</h1>
        <p>Hey there! A new match has been hosted in your area.</p>
        <div style="background: #171717; padding: 20px; border-radius: 15px; border: 1px solid #262626;">
          <p><strong>Sport:</strong> ${gameType}</p>
          <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Location:</strong> ${city}, ${state}</p>
        </div>
        <a href="http://localhost:5174/join-games" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #fbbf24; color: #000; text-decoration: none; font-weight: bold; border-radius: 10px;">Join Match Now</a>
      </div>
    `;

    const templateName = process.env.MSG91_WHATSAPP_NOTIF_TEMPLATE;
    const baseUrl = process.env.CLIENT_URL || "http://localhost:5174";

    // Send notifications in parallel
    await Promise.all(targetUsers.map(async (user) => {
      // Email
      if (user.email) {
        generateEmail(user.email, emailSubject, emailHtml).catch(e => console.error(e));
      }
      
      // WhatsApp
      if (user.phone) {
        if (templateName) {
          // Template params: Sport, City, Host, Link
          sendWhatsAppMessage(user.phone, "", templateName, [
            gameType, 
            city, 
            host.name, 
            `${baseUrl}/join-games`
          ]).catch(e => console.error(e));
        } else {
          sendWhatsAppMessage(user.phone, message).catch(e => console.error(e));
        }
      }
    }));

    console.log(chalk.blue(`[Notifications] Sent to ${targetUsers.length} users in ${city}, ${state}`));
  } catch (error) {
    console.error(chalk.red(`[Notifications] Error: ${error.message}`));
  }
};
