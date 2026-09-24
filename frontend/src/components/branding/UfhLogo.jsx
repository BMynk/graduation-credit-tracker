const UFH_LOGO_URL = "https://www.ufh.ac.za/wp-content/uploads/2024/08/Frame-427321864.png";

export default function UfhLogo({ className = "", variant = "full" }) {
  return (
    <img
      src={UFH_LOGO_URL}
      alt={
        variant === "crest"
          ? "University of Fort Hare crest"
          : "University of Fort Hare — Together in Excellence"
      }
      className={`block h-auto object-contain ${className}`}
      loading="eager"
      referrerPolicy="no-referrer"
    />
  );
}
