import Link from "next/link";

type ReturnAssistanceProps = {
  whatsappHref: string;
  orderNumber?: string;
};

const CLIENT_CARE_PHONE = "+919876543210";

export default function ReturnAssistance({
  whatsappHref,
  orderNumber,
}: ReturnAssistanceProps) {
  const message = encodeURIComponent(
    orderNumber
      ? `Hi, I need assistance with my return for order ${orderNumber}.`
      : "Hi, I need assistance with my return request.",
  );
  const waLink = `${whatsappHref}?text=${message}`;
  const telLink = `tel:${CLIENT_CARE_PHONE.replace(/\s/g, "")}`;

  return (
    <section className="border border-zinc-100 bg-[#faf8f5] px-5 py-8 sm:px-8">
      <p className="text-sm font-light text-zinc-700">
        Need assistance with your return?
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex cursor-pointer items-center gap-2 border border-zinc-300 bg-white px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-800 transition hover:border-zinc-500"
        >
          <i className="fa-brands fa-whatsapp text-base" aria-hidden="true" />
          WhatsApp support
        </a>
        <a
          href={telLink}
          className="inline-flex cursor-pointer items-center gap-2 border border-zinc-300 bg-white px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-800 transition hover:border-zinc-500"
        >
          <i className="fa-solid fa-phone text-sm" aria-hidden="true" />
          Call client care
        </a>
        <Link
          href="/account/client-care"
          className="inline-flex cursor-pointer items-center border border-zinc-300 bg-white px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-800 transition hover:border-zinc-500"
        >
          Client care
        </Link>
      </div>
    </section>
  );
}
