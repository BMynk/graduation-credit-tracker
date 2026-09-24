const UFH_LOGO_URL = "https://www.ufh.ac.za/wp-content/uploads/2024/08/Frame-427321864.png";

export default function UfhLogo({ className = "", variant = "full" }) {
  if (variant === "crest") {
    return (
      <span
        className={`relative block overflow-hidden bg-white ${className}`}
        role="img"
        aria-label="University of Fort Hare crest"
      >
        <img
          src={UFH_LOGO_URL}
          alt=""
          aria-hidden="true"
          loading="eager"
          referrerPolicy="no-referrer"
          className="absolute left-1/2 top-0 h-auto max-w-none -translate-x-1/2"
          style={{ width: "310%" }}
        />
      </span>
    );
  }

  return (
    <img
      src={UFH_LOGO_URL}
      alt="University of Fort Hare — Together in Excellence"
      className={className}
      loading="eager"
      referrerPolicy="no-referrer"
    />
  );
}
