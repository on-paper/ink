import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Paper privacy policy",
  openGraph: {
    title: "Privacy Policy",
    description: "Paper privacy policy",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const PolicyPage = () => {
  return (
    <>
      <div className="prose dark:prose-invert p-8 lg:prose-lg">
        <h2>Privacy Policy</h2>
        <p>
          Kualta ("us", "we", or "our") operates paper.ink (the "Service"). This page informs you of our policies
          regarding the collection, use and disclosure of Personal Information we receive from users of the Service. We
          use your Personal Information only for identifying you on the website and improving the Service. By using the
          Service, you agree to the collection and use of information in accordance with this policy.
        </p>
        <h4>Information Collection And Use</h4>
        <p>
          While using our Service, we may ask you to provide us with certain personally identifiable information that
          can be used to identify you. Personally identifiable information may include, but is not limited to your email
          address, name, username, and profile picture. We collect this information from the provider you choose when
          you sign up for the Service. We do not use this information for marketing purposes, and we do not share this
          information with any third parties.
        </p>
        <h4>Log Data</h4>
        <p>
          We may also collect information that your browser sends whenever you visit our Service ("Log Data"). This Log
          Data may include information such as your computer's Internet Protocol ("IP") address, browser type, browser
          version, the pages of our Service that you visit, the time and date of your visit, the time spent on those
          pages and other statistics. In addition, we may use third party services such as Vercel Analytics that
          collect, monitor and analyze this type of information in order to increase our Service's functionality. These
          third party service providers have their own privacy policies addressing how they use such information.
        </p>
        <h4>Security</h4>
        <p>
          The security of your Personal Information is important to us, and we use encryption to protect your data.
          However, no method of transmission over the Internet, or method of electronic storage, is 100% secure. While
          we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its
          absolute security.
        </p>
        <h4>Changes To This Privacy Policy</h4>
        <p>
          This Privacy Policy is effective as of January 22, 2025 and will remain in effect except with respect to any
          changes in its provisions in the future, which will be in effect immediately after being posted on this page.
          We reserve the right to update or change our Privacy Policy at any time and you should check this Privacy
          Policy periodically. Your continued use of the Service after we post any modifications to the Privacy Policy
          on this page will constitute your acknowledgment of the modifications and your consent to abide and be bound
          by the modified Privacy Policy.
        </p>
        <h4>Contact Us</h4>
        <p>If you have any questions about this Privacy Policy, please contact us at contact@kualta.dev.</p>
        <h5>
          Last updated: <b>January 22, 2025</b>.
        </h5>
      </div>
    </>
  );
};

export default PolicyPage;
