const UFH_LOGO_URL = "https://www.ufh.ac.za/wp-content/uploads/2024/08/Frame-427321864.png";

function UfhCrest({ className = "" }) {
  return (
    <span
      className={`relative block overflow-hidden bg-white ${className}`}
      aria-hidden="true"
    >
      <img
        src={UFH_LOGO_URL}
        alt=""
        loading="eager"
        referrerPolicy="no-referrer"
        className="absolute left-1/2 top-0 h-auto max-w-none -translate-x-1/2"
        style={{ width: "310%" }}
      />
    </span>
  );
}

export default function UfhLogo({ className = "", variant = "full" }) {
  if (variant === "crest") {
    return (
      <span role="img" aria-label="University of Fort Hare crest">
        <UfhCrest className={className} />
      </span>
    );
  }

  return (
    <span
      className={`flex flex-col items-center justify-center text-center ${className}`}
      role="img"
      aria-label="University of Fort Hare — Together in Excellence"
    >
      <UfhCrest className="h-[82px] w-[78px] rounded-sm" />
      <span className="mt-1 whitespace-nowrap font-serif text-[20px] font-semibold leading-none tracking-[-0.02em] text-black">
        University of Fort Hare
      </span>
      <span className="mt-1 whitespace-nowrap font-serif text-[12px] italic leading-none text-black">
        Together in Excellence
      </span>
    </span>
  );
}
