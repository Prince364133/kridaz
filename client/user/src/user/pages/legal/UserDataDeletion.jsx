import React from "react";
import { Link } from "react-router-dom";

const UserDataDeletion = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 font-sans selection:bg-[#84CC16]/30">
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-black mb-8 uppercase tracking-tight text-[#84CC16]">User Data Deletion</h1>
        
        <div className="space-y-8 text-white/70 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Your Right to Deletion</h2>
            <p>At Kridaz, we respect your privacy and your right to control your personal data. You have the right to request the deletion of your personal information from our active databases.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How to Request Deletion</h2>
            <p>To request the deletion of your account and associated personal data, you can do so through the following methods:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Log in to your account, navigate to the <Link to="/profile" className="text-[#84CC16] hover:underline">Profile Settings</Link> section, and select "Delete Account".</li>
              <li>Send an email to <a href="mailto:privacy@kridaz.com" className="text-[#84CC16] hover:underline">privacy@kridaz.com</a> with the subject line "Data Deletion Request" from the email address associated with your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. What Happens When You Request Deletion</h2>
            <p>Once we receive and verify your request, we will delete (or anonymize) your personal information from our records, unless an exception applies. Please note that we may need to retain certain information for recordkeeping purposes, to complete any transactions that you began prior to requesting deletion, or to comply with our legal obligations.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Timeline</h2>
            <p>We strive to process all data deletion requests within 30 days of receipt. If we require more time or if your request is particularly complex, we will inform you of the reason and extension period in writing.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Contact Us</h2>
            <p>If you have any questions about the data deletion process, please contact us at <a href="mailto:privacy@kridaz.com" className="text-[#84CC16] hover:underline">privacy@kridaz.com</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link to="/" className="text-[#84CC16] hover:underline font-bold uppercase tracking-wider text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserDataDeletion;
