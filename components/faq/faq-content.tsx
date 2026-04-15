import type { ReactNode } from "react";
import Link from "next/link";
import type { FaqAccordionItem } from "@/components/faq/faq-accordion";

const L = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => (
  <Link href={href} className="font-medium text-brand hover:underline">
    {children}
  </Link>
);

export const faqItems: FaqAccordionItem[] = [
  {
    id: "what-is",
    question: "What is GoBenta.ph?",
    answer:
      "GoBenta.ph is an online marketplace that connects buyers and sellers across the Philippines. We host listings, search, and messaging; agreements and payments are between you and the other party unless we say otherwise.",
  },
  {
    id: "buy-sell",
    question: "How do I buy or sell?",
    answer: (
      <>
        Register or log in, then browse the home page or use the search bar and
        category strip. To sell, use <L href="/listing/new">Sell</L> to create a
        listing with photos, price, and location. Buyers can message sellers from
        a listing page to agree on meetup, delivery, and payment.
      </>
    ),
  },
  {
    id: "create-listing",
    question: "How do I post a listing (photos, category, location)?",
    answer: (
      <>
        Open <L href="/listing/new">Create a listing</L>, choose a category and
        optional subcategory, add a title, description, price, and condition.
        You can set location (province, city, barangay where applicable), upload
        images, and mark payment options you accept (e.g. GCash, Maya, COD) and
        whether pasabuy is OK. Save to publish.
      </>
    ),
  },
  {
    id: "search-filters",
    question: "How do search and category filters work?",
    answer: (
      <>
        The header search looks at listing titles. The category row under the
        header filters by main category. On the marketplace page, the sidebar
        (and mobile filters) let you narrow by price, condition, location, and
        more depending on what we expose—try them together with search.
      </>
    ),
  },
  {
    id: "messages",
    question: "How does Messages work?",
    answer: (
      <>
        From a listing (that isn&apos;t yours), open <strong>Message seller</strong>{" "}
        to start a conversation tied to that listing. Your threads appear under{" "}
        <L href="/messages">Messages</L>. Keep deals and safety in mind; see our{" "}
        <L href="/chat-ratings-reviews">Chat, ratings &amp; reviews</L> policy.
      </>
    ),
  },
  {
    id: "saved",
    question: "What are Saved listings?",
    answer: (
      <>
        Use the heart on a listing to save it. View everything you saved under{" "}
        <L href="/saved">Saved</L> (you need to be logged in).
      </>
    ),
  },
  {
    id: "complete-sale",
    question: "How does a seller mark a deal complete (sold)?",
    answer: (
      <>
        On your own listing, after you&apos;ve agreed with a buyer, use the
        complete-transaction controls to set the buyer and mark the sale
        finished. The listing then leaves the public marketplace, appears in your{" "}
        <L href="/profile/selling">Selling</L> view as sold, and both of you can
        leave a rating and optional comment.
      </>
    ),
  },
  {
    id: "reviews",
    question: "How do ratings and reviews work?",
    answer: (
      <>
        After a completed transaction, the buyer and seller can each rate the
        other once for that listing, with an optional written comment. Averages
        show on profiles and listings. See{" "}
        <L href="/chat-ratings-reviews">Chat, ratings &amp; reviews</L> for fair
        use rules.
      </>
    ),
  },
  {
    id: "profile",
    question: "What is my profile and public page?",
    answer: (
      <>
        <L href="/profile">Profile</L> is where you edit your display name,
        photo, and optional trust fields (phone, area, ID label—never full ID
        numbers). Others see a public page at <code className="text-xs">/u/your-id</code>{" "}
        with your rating and reviews. Use <strong>Selling</strong> and{" "}
        <strong>Purchased</strong> in the account menu to see your listings and
        completed buys.
      </>
    ),
  },
  {
    id: "payments",
    question: "Does GoBenta.ph process or hold my payments?",
    answer: (
      <>
        No—payment badges on a listing only show what the seller is open to
        (e.g. GCash, Maya, COD). You arrange payment directly with the other
        person. Read <L href="/terms">Terms &amp; conditions</L> for limitations
        of liability.
      </>
    ),
  },
  {
    id: "scam",
    question: "I think I was scammed. What should I do?",
    answer: (
      <>
        Stop paying, block the user, and gather evidence. Read{" "}
        <L href="/protect-yourself">Protect yourself (scams)</L> and{" "}
        <L href="/contact">Contact us</L> if you need help. For crimes, consider
        reporting to the authorities.
      </>
    ),
  },
];
