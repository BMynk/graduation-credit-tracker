const UFH_LOGO_URL = "https://www.ufh.ac.za/wp-content/uploads/2024/08/Frame-427321864.png";

export default function UfhLogo({ className = "", compact = false }) {
  return (
    <img
      src={UFH_LOGO_URL}
      alt="University of Fort Hare"
      className={className}
      loading="eager"
      referrerPolicy="no-referrer"
      style={compact ? { objectPosition: "top" } : undefined}
    />
  );
}
