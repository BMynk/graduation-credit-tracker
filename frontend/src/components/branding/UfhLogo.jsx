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
      className={`flex flex-col items-center justify-center text-center ${className}`}
      role="img"
      aria-label="University of Fort Hare — Together in Excellence"
    >
      <img
        src={UFH_LOGO_URL}
        alt=""
        aria-hidden="true"
        className="block h-auto w-full object-contain"
        loading="eager"
        referrerPolicy="no-referrer"
      />
      <span className="-mt-[28%] pb-[22%] font-serif text-[clamp(18px,6.5vw,30px)] font-semibold leading-tight tracking-[-0.03em] text-zinc-950">
        University of Fort Hare
      </span>
      <span className="-mt-[18%] pb-[12%] font-serif text-[clamp(12px,4vw,18px)] italic leading-tight text-zinc-950">
        Together in Excellence
      </span>
    </span>
  );
}
