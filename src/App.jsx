import "./App.css";
import Nav from "./components/Nav/Nav";
import FullStack from "./components/Services/FullStack/FullStack";
import Plutus from "./components/Services/Plutus/Plutus";
import Pool from "./components/Services/Pool/Pool";
import Uiux from "./components/Services/UIUX/UIUX";
import Landing from "./components/Landing/Landing";
import BG from "./components/Landing/background/bg1.jpg";
import { useSelector, useDispatch } from "react-redux";
import {
  landingPage,
  plutusPage,
  fullstackPage,
  poolPage,
  uiuxPage,
} from "./features/page/pageSlice";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.mode);
  const page = useSelector((state) => state.page.mode);

  const changePage = (input) => {
    if (input == "plutus") {
      dispatch(plutusPage());
    } else if (input == "fullstack") {
      dispatch(fullstackPage());
    } else if (input == "pool") {
      dispatch(poolPage());
    } else if (input == "uiux") {
      dispatch(uiuxPage());
    } else {
      dispatch(landingPage());
    }
  };

  const navigatePage = (pageLink) => {
    window.location.href = pageLink;
  };

  return (
    <div className="App" data-theme={theme}>
      <Nav changePage={changePage} navigatePage={navigatePage} />
      <img src={BG} alt="" className="app-bg" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/plutus" element={<Plutus />} />
          <Route path="/spo" element={<Pool />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
