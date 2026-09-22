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

    home: "https://images.pexels.com/photos/8846035/pexels-photo-8846035.jpeg",
    login:
    "https://images.pexels.com/photos/19193975/pexels-photo-19193975.jpeg",
    forum:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7",

    events:"https://images.pexels.com/photos/19399416/pexels-photo-19399416.jpeg",
        market:
"https://images.pexels.com/photos/15444041/pexels-photo-15444041.jpeg",
    clubs:
"https://images.pexels.com/photos/1116302/pexels-photo-1116302.jpeg",
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