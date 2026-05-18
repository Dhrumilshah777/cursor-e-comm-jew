const VIDEO_SRC =
  "https://palmonas.com/cdn/shop/videos/c/vp/bb026995c2684066a92fd9a2324a77e3/bb026995c2684066a92fd9a2324a77e3.SD-480p-1.5Mbps-59300699.mp4?v=0";

export default function PromoVideo({
  src = VIDEO_SRC,
}: {
  src?: string;
}) {
  return (
    <section className="w-full bg-white" aria-label="Promotional video">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900 sm:aspect-video">
        <video
          className="h-full w-full object-cover"
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
    </section>
  );
}
