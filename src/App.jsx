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

  /* ========================================
     ACTIVE PAGE
  ======================================== */

  const [active, setActive] = useState(
    localStorage.getItem("activePage") || "login"
  );


  /* ========================================
     CURRENT USER
  ======================================== */

  const [currentUser, setCurrentUser] = useState(null);


  /* ========================================
     BACKGROUND
  ======================================== */

  const [bg, setBg] = useState("");


  /* ========================================
     CHANGE PAGE
  ======================================== */

  const changePage = (page) => {

    setActive(page);

    localStorage.setItem(
      "activePage",
      page
    );
  };


  /* ========================================
     PAGE BACKGROUNDS
  ======================================== */

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


  /* ========================================
     UPDATE BACKGROUND WHEN PAGE CHANGES
  ======================================== */

  useEffect(() => {

    setBg(
      backgrounds[active] || ""
    );

  }, [active]);


  /* ========================================
     CHECK EXISTING LOGIN SESSION
  ======================================== */

  useEffect(() => {

    fetch(
      "http://localhost:5000/me",
      {
        credentials: "include",
      }
    )

      .then((response) => {

        if (response.ok) {
          return response.json();
        }

        throw new Error(
          "Not logged in"
        );

      })

      .then((data) => {

        setCurrentUser(data.user);

        const savedPage =
          localStorage.getItem(
            "activePage"
          );

        if (
          savedPage &&
          savedPage !== "login"
        ) {

          setActive(savedPage);

        } else {

          changePage("home");

        }

      })

      .catch(() => {

        console.log(
          "No active session."
        );

      });

  }, []);


  /* ========================================
     MAIN UI
  ======================================== */

  return (

    <div
      style={{
        background: bg
          ? `url(${bg}) center/cover fixed`
          : "#f5f7fb",

        minHeight: "100vh",
      }}
    >

      {/* ====================================
          HEADER
      ==================================== */}

      <Header />


      {/* ====================================
          TOP NAVIGATION

          Navbar is placed HERE,
          immediately below Header.
      ==================================== */}

      {active !== "login" &&
        active !== "register" &&
        active !== "forgot-password" && (

          <Navbar
            active={active}
            setActive={changePage}
            setCurrentUser={setCurrentUser}
          />

        )}


      {/* ====================================
          LOGIN
      ==================================== */}

      {active === "login" && (

        <Login
          setActive={changePage}
          setCurrentUser={setCurrentUser}
        />

      )}


      {/* ====================================
          REGISTER
      ==================================== */}

      {active === "register" && (

        <Register
          setActive={changePage}
        />

      )}


      {/* ====================================
          FORGOT PASSWORD
      ==================================== */}

      {active === "forgot-password" && (

        <ForgotPassword
          setActive={changePage}
        />

      )}


      {/* ====================================
          HOME
      ==================================== */}

      {active === "home" && (

        <Home />

      )}


      {/* ====================================
          FORUM
      ==================================== */}

      {active === "forum" && (

        <Forum />

      )}


      {/* ====================================
          EVENTS
      ==================================== */}

      {active === "events" && (

        <Events />

      )}


      {/* ====================================
          MARKETPLACE
      ==================================== */}

      {active === "market" && (

        <Market />

      )}


      {/* ====================================
          CLUBS
      ==================================== */}

      {active === "clubs" && (

        <Clubs />

      )}


      {/* ====================================
          POLLS
      ==================================== */}

      {active === "polls" && (

        <Polls />

      )}

    </div>

  );
}