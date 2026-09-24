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
      <span className="-mt-[44%] font-serif text-[clamp(20px,8vw,34px)] font-semibold leading-none tracking-[-0.03em] text-zinc-950">
        University of Fort Hare
      </span>
      <span className="mt-2 pb-[25%] font-serif text-[clamp(13px,4.5vw,20px)] italic leading-none text-zinc-950">
        Together in Excellence
      </span>
    </span>
  );
}
