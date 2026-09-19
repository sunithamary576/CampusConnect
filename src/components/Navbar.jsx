export default function Navbar({
  active,
  setActive,
  setCurrentUser,
}) {
  const items = [
    "home",
    "forum",
    "events",
    "market",
    "clubs",
    "polls",
  ];

  const logout = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        setCurrentUser(null);
        setActive("login");
        localStorage.removeItem("activePage");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="top-navigation">
      {items.map((item) => (
        <button
          key={item}
          className={active === item ? "active" : ""}
          onClick={() => setActive(item)}
        >
          {item.charAt(0).toUpperCase() + item.slice(1)}
        </button>
      ))}

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
}