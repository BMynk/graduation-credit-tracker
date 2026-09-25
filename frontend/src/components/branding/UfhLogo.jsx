const UFH_LOGO_URL = "https://www.ufh.ac.za/wp-content/uploads/2024/08/Frame-427321864.png";

export default function UfhLogo({ className = "", variant = "full" }) {
  if (variant === "crest") {
    return (
      <img
        src={UFH_LOGO_URL}
        alt="University of Fort Hare crest"
        className={`block h-auto object-contain ${className}`}
        loading="eager"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className={`flex flex-col items-center text-center ${className}`}
      role="img"
      aria-label="University of Fort Hare — Together in Excellence"
    >
      <span className="relative h-[150px] w-[150px] overflow-hidden">
        <img
          src={UFH_LOGO_URL}
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-auto max-w-none -translate-x-1/2"
          style={{ width: "430px" }}
          loading="eager"
          referrerPolicy="no-referrer"
        />
      </span>
      <span className="mt-3 whitespace-nowrap font-serif text-[clamp(19px,5.8vw,28px)] font-semibold leading-none tracking-[-0.03em] text-zinc-950">
        University of Fort Hare
      </span>
      <span className="mt-2 whitespace-nowrap font-serif text-[clamp(13px,4vw,18px)] italic leading-none text-zinc-950">
        Together in Excellence
      </span>
    </span>
  );
}
