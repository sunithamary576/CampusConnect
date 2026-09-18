import { useState, useEffect } from "react";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import Home from "./components/Home";
import Forum from "./components/Forum/Forum";
import Events from "./components/Events/Events";
import Market from "./components/Market/Market";
import Clubs from "./components/Clubs/Clubs";
import Polls from "./components/Polls/Polls";

export default function App() {
  // Remember the last page after browser refresh
  const [active, setActive] = useState(
    localStorage.getItem("activePage") || "login"
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [bg, setBg] = useState("");

  // Change page and save it in localStorage
  const changePage = (page) => {
    setActive(page);
    localStorage.setItem("activePage", page);
  };

  const backgrounds = {
    login:
      "https://news.belmont.edu/wp-content/uploads/2019/07/The-Lawn.jpg",

    home:
      "https://s.yimg.com/ny/api/res/1.2/nw8KeJjTcZ2K4zfeTATGFg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD04MTc7Y2Y9d2VicA--/https://media.zenfs.com/en/courier-news/fba1500eadbefb66c3959575c9f5bd9a",

    forum:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7",

    events:
      "https://cdn.prod.website-files.com/68734d7eaec6e398c11a5a42/68924e9a8cbe497e6796b731_shutterstock_1009539673.jpeg",

    market:
      "https://blog.bookswagon.com/wp-content/uploads/2018/06/online-books-stores.png",

    clubs:
      "https://varthana.com/student/wp-content/uploads/2023/10/B585-Student.jpg",

    polls:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
  };

  // Change background whenever active page changes
  useEffect(() => {
    setBg(backgrounds[active]);
  }, [active]);

  // Check whether the user already has an active Flask session
  useEffect(() => {
    fetch("http://localhost:5000/me", {
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        throw new Error("Not logged in");
      })
      .then((data) => {
        setCurrentUser(data.user);

        // Get the page saved before browser refresh
        const savedPage = localStorage.getItem("activePage");

        if (savedPage && savedPage !== "login") {
          // Stay on the page the user was viewing
          setActive(savedPage);
        } else {
          // If there is no saved page, go to Home
          changePage("home");
        }
      })
      .catch(() => {
        console.log("No active session.");
      });
  }, []);

  return (
    <div
      style={{
        background: `url(${bg}) center/cover fixed`,
        minHeight: "100vh",
      }}
    >
      <Header />

      {/* Login */}
      {active === "login" && (
        <Login
          setActive={changePage}
          setCurrentUser={setCurrentUser}
        />
      )}

      {/* Registration */}
      {active === "register" && (
        <Register setActive={changePage} />
      )}

      {/* Forgot Password */}
      {active === "forgot-password" && (
        <ForgotPassword setActive={changePage} />
      )}

      {/* Main Pages */}
      {active === "home" && <Home />}

      {active === "forum" && <Forum />}

      {active === "events" && <Events />}

      {active === "market" && <Market />}

      {active === "clubs" && <Clubs />}

      {active === "polls" && <Polls />}

      {/* Navbar only appears after login */}
      {active !== "login" &&
        active !== "register" &&
        active !== "forgot-password" && (
          <Navbar
            active={active}
            setActive={changePage}
            setCurrentUser={setCurrentUser}
          />
        )}
    </div>
  );
}